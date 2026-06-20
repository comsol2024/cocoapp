import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc,
         doc, query, orderBy } from "firebase/firestore";

// ── 공통 모달 껍데기 ────────────────────────────
function Modal({ title, emoji, color="#1565C0", onClose, children }) {
  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0,
        background:"rgba(0,0,0,0.65)", zIndex:300
      }}/>
      <div style={{
        position:"fixed", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        background:"#16162a", borderRadius:"22px",
        width:"min(480px,95vw)", maxHeight:"88vh",
        display:"flex", flexDirection:"column",
        zIndex:301,
        boxShadow:"0 24px 64px rgba(0,0,0,0.7)",
        border:"1px solid rgba(255,255,255,0.1)",
        overflow:"hidden"
      }}>
        <div style={{
          padding:"16px 20px", flexShrink:0,
          display:"flex", alignItems:"center",
          justifyContent:"space-between",
          borderBottom:"1px solid rgba(255,255,255,0.1)",
          background:`linear-gradient(135deg,${color}44,transparent)`
        }}>
          <span style={{ color:"white", fontWeight:"900", fontSize:"17px" }}>
            {emoji} {title}
          </span>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.12)", border:"none",
            color:"white", width:"32px", height:"32px",
            borderRadius:"50%", cursor:"pointer",
            fontSize:"13px", fontWeight:"700"
          }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════
// 1. 경사로 기울기 카메라
// ══════════════════════════════════════════════
export function SlopeCamera({ onClose }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [angle,       setAngle]       = useState(0);
  const [hasDevice,   setHasDevice]   = useState(false);
  const [cameraOn,    setCameraOn]    = useState(false);
  const [iosNeedsPerm, setIosNeedsPerm] = useState(false);
  const [locked,      setLocked]      = useState(false);
  const [lockedAngle, setLockedAngle] = useState(null);

  // 카메라 시작
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video:{ facingMode:"environment" } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
      })
      .catch(() => setCameraOn(false));
    return () => streamRef.current?.getTracks().forEach(t=>t.stop());
  }, []);

  // 기울기 센서
  const startOrientation = useCallback(() => {
    const handler = e => {
      const b = e.beta ?? 0;
      const abs = Math.abs(b);
      setAngle(abs > 90 ? 180 - abs : abs);
      setHasDevice(true);
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  useEffect(() => {
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      setIosNeedsPerm(true);
    } else {
      return startOrientation();
    }
  }, [startOrientation]);

  const requestPerm = async () => {
    try {
      await DeviceOrientationEvent.requestPermission();
      setIosNeedsPerm(false);
      startOrientation();
    } catch {}
  };

  const displayAngle = locked ? lockedAngle : angle;
  const slope  = Math.tan(displayAngle * Math.PI / 180);
  const grade  = slope * 100;

  // 각도 시각화 (프로트랙터 스타일)
  const W=280, H=140, cx=140, cy=130, R=100;
  const tickLine = (deg) => {
    const r = deg * Math.PI / 180;
    return {
      x1: cx + Math.cos(Math.PI+r)*R, y1: cy + Math.sin(Math.PI+r)*R,
      x2: cx + Math.cos(Math.PI+r)*(R-10), y2: cy + Math.sin(Math.PI+r)*(R-10),
    };
  };
  const needleRad = (180 - displayAngle) * Math.PI / 180;
  const nx = cx + Math.cos(needleRad)*90;
  const ny = cy + Math.sin(needleRad)*90;

  const numStyle = {
    color:"white", textAlign:"center", lineHeight:"1.3"
  };

  return (
    <Modal title="경사로 기울기 측정" emoji="📐"
      color="#1565C0" onClose={onClose}>
      <div style={{ padding:"16px 20px" }}>

        {/* iOS 권한 버튼 */}
        {iosNeedsPerm && (
          <button onClick={requestPerm} style={{
            width:"100%", padding:"12px",
            background:"#1565C0", color:"white",
            border:"none", borderRadius:"12px",
            fontSize:"14px", fontWeight:"700",
            cursor:"pointer", marginBottom:"14px"
          }}>📱 기울기 센서 권한 허용하기</button>
        )}

        {/* 카메라 뷰 */}
        <div style={{
          position:"relative", borderRadius:"14px",
          overflow:"hidden", background:"#000",
          marginBottom:"14px",
          aspectRatio:"4/3"
        }}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ width:"100%", height:"100%",
              objectFit:"cover", display:cameraOn?"block":"none" }}/>
          {!cameraOn && (
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center",
              justifyContent:"center", color:"#888",
              fontSize:"13px", flexDirection:"column", gap:"6px"
            }}>
              <span style={{fontSize:"32px"}}>📷</span>
              카메라 사용 불가
            </div>
          )}

          {/* 수평선 오버레이 */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center",
            justifyContent:"center", pointerEvents:"none"
          }}>
            <div style={{
              width:"85%", height:"2px",
              background:"rgba(255,255,255,0.4)",
              position:"absolute", top:"50%",
              transform:`translateY(-50%) rotate(${-displayAngle}deg)`,
              transformOrigin:"center",
              transition:"transform 0.1s"
            }}/>
            <div style={{
              background:"rgba(0,0,0,0.65)",
              borderRadius:"10px", padding:"6px 14px",
              color:"white", fontSize:"22px", fontWeight:"900",
              letterSpacing:"1px"
            }}>
              {displayAngle.toFixed(1)}°
            </div>
          </div>
        </div>

        {/* 프로트랙터 */}
        <svg viewBox={`0 0 ${W} ${H}`}
          style={{ width:"100%", marginBottom:"14px" }}>
          {/* 반원 */}
          <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`}
            fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2}/>
          {/* 눈금 */}
          {[0,15,30,45,60,75,90].map(d => {
            const t = tickLine(d);
            return (
              <g key={d}>
                <line {...t} stroke="rgba(255,255,255,0.5)"
                  strokeWidth={d%30===0?2:1}/>
                <text
                  x={cx + Math.cos((180-d)*Math.PI/180)*116}
                  y={cy + Math.sin((180-d)*Math.PI/180)*116 + 4}
                  fill="rgba(255,255,255,0.6)"
                  fontSize={9} textAnchor="middle">{d}</text>
              </g>
            );
          })}
          {/* 기준선 */}
          <line x1={cx-R} y1={cy} x2={cx+R} y2={cy}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}/>
          {/* 바늘 */}
          <line x1={cx} y1={cy} x2={nx} y2={ny}
            stroke="#42a5f5" strokeWidth={3} strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r={5} fill="#42a5f5"/>
        </svg>

        {/* 수치 3개 */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
          gap:"10px", marginBottom:"14px"
        }}>
          {[
            { label:"각도", value:`${displayAngle.toFixed(1)}°`,
              color:"#42a5f5" },
            { label:"기울기 (tan θ)", value:slope.toFixed(3),
              color:"#66bb6a" },
            { label:"경사율", value:`${grade.toFixed(1)}%`,
              color:"#ff7043" },
          ].map((item,i)=>(
            <div key={i} style={{
              background:"rgba(255,255,255,0.06)",
              borderRadius:"12px", padding:"12px 8px",
              textAlign:"center"
            }}>
              <div style={{ fontSize:"18px", fontWeight:"900",
                color:item.color, ...numStyle }}>{item.value}</div>
              <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.5)",
                marginTop:"3px" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* 고정 버튼 */}
        <button onClick={()=>{
          if (locked) { setLocked(false); }
          else { setLocked(true); setLockedAngle(angle); }
        }} style={{
          width:"100%", padding:"12px",
          background: locked
            ? "linear-gradient(135deg,#e53935,#c62828)"
            : "linear-gradient(135deg,#1565C0,#0D47A1)",
          color:"white", border:"none", borderRadius:"12px",
          fontSize:"14px", fontWeight:"700", cursor:"pointer"
        }}>
          {locked ? "🔓 고정 해제" : "📌 현재값 고정"}
        </button>

        {!hasDevice && !iosNeedsPerm && (
          <div style={{ marginTop:"10px", fontSize:"12px",
            color:"rgba(255,255,255,0.4)", textAlign:"center" }}>
            기울기 센서를 지원하는 모바일 기기에서 사용해봐!
          </div>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
// 2. 활동 사진
// ══════════════════════════════════════════════
export function ActivityCamera({ onClose, user }) {
  const fileRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Firestore에서 사진 목록 불러오기 (base64 메타만)
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      const q = query(
        collection(db,"users",user.uid,"activity_photos"),
        orderBy("createdAt","desc")
      );
      const snap = await getDocs(q);
      setPhotos(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const savePhoto = async () => {
    if (!preview || !user?.uid) return;
    setSaving(true);
    const data = {
      dataUrl: preview,
      label: label || `활동 사진 ${new Date().toLocaleString("ko-KR")}`,
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(
      collection(db,"users",user.uid,"activity_photos"), data
    );
    setPhotos(p => [{ id:ref.id, ...data }, ...p]);
    setPreview(null); setLabel(""); setSaving(false);
  };

  const deletePhoto = async (id) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db,"users",user.uid,"activity_photos",id));
    setPhotos(p => p.filter(ph=>ph.id!==id));
  };

  const downloadPhoto = (photo) => {
    const a = document.createElement("a");
    a.href = photo.dataUrl;
    a.download = `${photo.label}.png`;
    a.click();
  };

  return (
    <Modal title="활동 사진" emoji="📷"
      color="#6A1B9A" onClose={onClose}>
      <div style={{ padding:"16px 20px" }}>

        {/* 촬영 영역 */}
        {!preview ? (
          <div style={{ marginBottom:"16px" }}>
            <button onClick={()=>fileRef.current?.click()} style={{
              width:"100%", padding:"18px",
              background:"linear-gradient(135deg,#6A1B9A,#4A148C)",
              color:"white", border:"none", borderRadius:"14px",
              fontSize:"15px", fontWeight:"700", cursor:"pointer",
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:"10px"
            }}>
              <span style={{fontSize:"24px"}}>📸</span>
              카메라로 사진 찍기
            </button>
            <input ref={fileRef} type="file"
              accept="image/*" capture="environment"
              onChange={handleFile}
              style={{ display:"none" }}/>
            <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)",
              fontSize:"12px", marginTop:"6px" }}>
              또는 갤러리에서 선택
            </div>
            <button onClick={()=>{
              if (fileRef.current) {
                fileRef.current.removeAttribute("capture");
                fileRef.current.click();
                setTimeout(()=>fileRef.current?.setAttribute("capture","environment"),300);
              }
            }} style={{
              width:"100%", padding:"11px", marginTop:"8px",
              background:"rgba(255,255,255,0.08)",
              color:"rgba(255,255,255,0.7)",
              border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:"12px", fontSize:"13px",
              fontWeight:"600", cursor:"pointer"
            }}>🖼️ 갤러리에서 선택</button>
          </div>
        ) : (
          /* 미리보기 + 저장 */
          <div style={{ marginBottom:"16px" }}>
            <img src={preview} alt="preview"
              style={{ width:"100%", borderRadius:"14px",
                marginBottom:"10px", maxHeight:"240px",
                objectFit:"cover" }}/>
            <input value={label} onChange={e=>setLabel(e.target.value)}
              placeholder="사진 설명 (선택)"
              style={{ width:"100%", padding:"10px 14px",
                background:"rgba(255,255,255,0.08)",
                border:"1px solid rgba(255,255,255,0.15)",
                borderRadius:"10px", color:"white",
                fontSize:"14px", outline:"none",
                marginBottom:"10px", boxSizing:"border-box" }}/>
            <div style={{ display:"grid",
              gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              <button onClick={()=>{ setPreview(null); setLabel(""); }}
                style={{ padding:"11px", background:"rgba(255,255,255,0.08)",
                  color:"rgba(255,255,255,0.7)", border:"none",
                  borderRadius:"10px", fontSize:"13px",
                  fontWeight:"700", cursor:"pointer" }}>
                취소
              </button>
              <button onClick={savePhoto} disabled={saving} style={{
                padding:"11px",
                background:"linear-gradient(135deg,#6A1B9A,#4A148C)",
                color:"white", border:"none", borderRadius:"10px",
                fontSize:"13px", fontWeight:"700", cursor:"pointer"
              }}>
                {saving ? "저장 중..." : "💾 저장하기"}
              </button>
            </div>
          </div>
        )}

        {/* 저장된 사진 목록 */}
        <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.5)",
          marginBottom:"8px", fontWeight:"600" }}>
          저장된 사진 ({photos.length})
        </div>
        {photos.length === 0 ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.25)",
            padding:"24px", fontSize:"13px" }}>
            아직 저장된 사진이 없어!
          </div>
        ) : (
          <div style={{ display:"grid",
            gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {photos.map(ph=>(
              <div key={ph.id} style={{ position:"relative" }}>
                <img src={ph.dataUrl} alt={ph.label}
                  style={{ width:"100%", aspectRatio:"1",
                    objectFit:"cover", borderRadius:"10px" }}/>
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background:"linear-gradient(transparent,rgba(0,0,0,0.8))",
                  borderRadius:"0 0 10px 10px",
                  padding:"6px 8px"
                }}>
                  <div style={{ fontSize:"10px", color:"white",
                    fontWeight:"600",
                    overflow:"hidden", textOverflow:"ellipsis",
                    whiteSpace:"nowrap" }}>
                    {ph.label}
                  </div>
                </div>
                <div style={{
                  position:"absolute", top:"6px", right:"6px",
                  display:"flex", gap:"4px"
                }}>
                  <button onClick={()=>downloadPhoto(ph)} style={{
                    width:"26px", height:"26px", borderRadius:"50%",
                    background:"rgba(21,101,192,0.85)",
                    border:"none", color:"white",
                    fontSize:"11px", cursor:"pointer"
                  }}>⬇</button>
                  <button onClick={()=>deletePhoto(ph.id)} style={{
                    width:"26px", height:"26px", borderRadius:"50%",
                    background:"rgba(198,40,40,0.85)",
                    border:"none", color:"white",
                    fontSize:"11px", cursor:"pointer"
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
// 3. 타이머
// ══════════════════════════════════════════════
export function ExploreTimer({ onClose }) {
  const [cs, setCs]         = useState(0); // centiseconds
  const [running, setRunning] = useState(false);
  const [laps, setLaps]     = useState([]);
  const intervalRef         = useRef(null);
  const startTimeRef        = useRef(null);
  const accRef              = useRef(0); // accumulated time

  const tick = useCallback(() => {
    setCs(accRef.current + (Date.now() - startTimeRef.current) / 10);
  }, []);

  const start = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(tick, 30);
    setRunning(true);
  };
  const pause = () => {
    clearInterval(intervalRef.current);
    accRef.current += (Date.now() - startTimeRef.current) / 10;
    setRunning(false);
  };
  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setCs(0); accRef.current = 0;
    setLaps([]);
  };
  const lap = () => {
    setLaps(prev => [Math.floor(cs), ...prev]);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const fmt = (centisecs) => {
    const total = Math.floor(centisecs);
    const m  = Math.floor(total / 6000);
    const s  = Math.floor((total % 6000) / 100);
    const c  = total % 100;
    return {
      m:  String(m).padStart(2,"0"),
      s:  String(s).padStart(2,"0"),
      c:  String(c).padStart(2,"0"),
    };
  };

  const { m, s, c } = fmt(cs);
  const avgLap = laps.length > 0
    ? laps.reduce((a,b)=>a+b,0) / laps.length : null;

  const btnBase = {
    borderRadius:"14px", border:"none",
    fontSize:"14px", fontWeight:"700",
    cursor:"pointer", padding:"13px 0"
  };

  return (
    <Modal title="타이머" emoji="⏱️"
      color="#2E7D32" onClose={onClose}>
      <div style={{ padding:"20px" }}>

        {/* 대형 시간 표시 */}
        <div style={{
          background:"rgba(0,0,0,0.4)", borderRadius:"18px",
          padding:"28px 16px", marginBottom:"20px",
          textAlign:"center"
        }}>
          <div style={{
            display:"flex", alignItems:"baseline",
            justifyContent:"center", gap:"2px"
          }}>
            <span style={{ fontSize:"64px", fontWeight:"900",
              color:"white", fontVariantNumeric:"tabular-nums",
              fontFamily:"Courier New, monospace",
              letterSpacing:"-2px" }}>
              {m}:{s}
            </span>
            <span style={{ fontSize:"32px", fontWeight:"700",
              color:"rgba(255,255,255,0.6)",
              fontFamily:"Courier New, monospace" }}>
              .{c}
            </span>
          </div>
          {avgLap !== null && (
            <div style={{ color:"rgba(255,255,255,0.5)",
              fontSize:"13px", marginTop:"6px" }}>
              평균 랩: {fmt(avgLap).m}:{fmt(avgLap).s}.{fmt(avgLap).c}
              &nbsp;({laps.length}회)
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        <div style={{ display:"grid",
          gridTemplateColumns:"1fr 1fr 1fr", gap:"10px",
          marginBottom:"16px" }}>
          <button onClick={running ? pause : start}
            style={{ ...btnBase,
              background: running
                ? "linear-gradient(135deg,#e65100,#bf360c)"
                : "linear-gradient(135deg,#2E7D32,#1B5E20)",
              color:"white", gridColumn:"span 2" }}>
            {running ? "⏸ 일시정지" : (cs>0 ? "▶ 계속" : "▶ 시작")}
          </button>
          <button onClick={reset}
            style={{ ...btnBase,
              background:"rgba(255,255,255,0.1)",
              color:"rgba(255,255,255,0.8)" }}>
            🔄 초기화
          </button>
          <button onClick={lap} disabled={!running}
            style={{ ...btnBase,
              background: running
                ? "linear-gradient(135deg,#1565C0,#0D47A1)"
                : "rgba(255,255,255,0.05)",
              color: running ? "white" : "rgba(255,255,255,0.2)",
              gridColumn:"span 3", cursor:running?"pointer":"default" }}>
            🏁 랩 기록 ({laps.length})
          </button>
        </div>

        {/* 랩 목록 */}
        {laps.length > 0 && (
          <div style={{
            background:"rgba(0,0,0,0.3)", borderRadius:"14px",
            overflow:"hidden"
          }}>
            <div style={{ padding:"10px 14px", fontSize:"12px",
              color:"rgba(255,255,255,0.4)", fontWeight:"700",
              borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              랩 기록
            </div>
            {laps.map((l,i)=>{
              const {m:lm,s:ls,c:lc} = fmt(l);
              const diff = i < laps.length-1 ? l - laps[i+1] : l;
              const {m:dm,s:ds,c:dc} = fmt(diff);
              return (
                <div key={i} style={{
                  display:"flex", justifyContent:"space-between",
                  alignItems:"center",
                  padding:"10px 14px",
                  borderBottom:"1px solid rgba(255,255,255,0.04)"
                }}>
                  <span style={{ color:"rgba(255,255,255,0.5)",
                    fontSize:"12px", fontWeight:"600" }}>
                    랩 {laps.length - i}
                  </span>
                  <span style={{ color:"white", fontWeight:"700",
                    fontFamily:"Courier New", fontSize:"15px" }}>
                    {lm}:{ls}.{lc}
                  </span>
                  <span style={{ color:"rgba(100,220,130,0.8)",
                    fontSize:"12px", fontFamily:"Courier New" }}>
                    +{dm}:{ds}.{dc}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
// 4. 메모
// ══════════════════════════════════════════════
export function ExploreMemo({ onClose, user }) {
  const [memos,   setMemos]   = useState([]);
  const [input,   setInput]   = useState("");
  const [tag,     setTag]     = useState("일반");
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  const TAGS = ["일반","배식","기울기","확률","기타"];
  const TAG_COLORS = {
    "일반":"#546E7A","배식":"#E65100","기울기":"#1565C0",
    "확률":"#6A1B9A","기타":"#37474F"
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return setLoading(false);
      const q = query(
        collection(db,"users",user.uid,"explore_memos"),
        orderBy("createdAt","desc")
      );
      const snap = await getDocs(q);
      setMemos(snap.docs.map(d=>({ id:d.id, ...d.data() })));
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMemo = async () => {
    if (!input.trim() || !user?.uid) return;
    setSaving(true);
    const data = {
      text: input.trim(),
      tag,
      createdAt: new Date().toISOString(),
      displayTime: new Date().toLocaleString("ko-KR",{
        month:"short", day:"numeric",
        hour:"2-digit", minute:"2-digit"
      })
    };
    const ref = await addDoc(
      collection(db,"users",user.uid,"explore_memos"), data
    );
    setMemos(p => [{ id:ref.id, ...data }, ...p]);
    setInput(""); setSaving(false);
  };

  const deleteMemo = async (id) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db,"users",user.uid,"explore_memos",id));
    setMemos(p => p.filter(m=>m.id!==id));
  };

  return (
    <Modal title="메모" emoji="📝"
      color="#E65100" onClose={onClose}>
      <div style={{ padding:"16px 20px" }}>

        {/* 태그 선택 */}
        <div style={{ display:"flex", gap:"6px",
          marginBottom:"10px", flexWrap:"wrap" }}>
          {TAGS.map(t=>(
            <button key={t} onClick={()=>setTag(t)} style={{
              padding:"5px 12px", borderRadius:"20px",
              border:"none", fontSize:"12px",
              fontWeight: tag===t ? "700" : "400",
              cursor:"pointer",
              background: tag===t
                ? TAG_COLORS[t] : "rgba(255,255,255,0.1)",
              color: tag===t ? "white" : "rgba(255,255,255,0.5)"
            }}>{t}</button>
          ))}
        </div>

        {/* 입력창 */}
        <textarea value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) saveMemo(); }}
          placeholder="메모를 입력해봐! (Ctrl+Enter로 저장)"
          style={{
            width:"100%", minHeight:"90px", padding:"12px 14px",
            background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:"12px", color:"white",
            fontSize:"14px", lineHeight:"1.65",
            resize:"vertical", outline:"none",
            fontFamily:"inherit", boxSizing:"border-box",
            marginBottom:"10px"
          }}/>

        <button onClick={saveMemo} disabled={saving||!input.trim()} style={{
          width:"100%", padding:"12px",
          background: input.trim()
            ? "linear-gradient(135deg,#E65100,#BF360C)"
            : "rgba(255,255,255,0.06)",
          color: input.trim() ? "white" : "rgba(255,255,255,0.2)",
          border:"none", borderRadius:"12px",
          fontSize:"14px", fontWeight:"700",
          cursor: input.trim() ? "pointer" : "default",
          marginBottom:"18px"
        }}>
          {saving ? "저장 중..." : "💾 메모 저장"}
        </button>

        {/* 메모 목록 */}
        <div style={{ fontSize:"12px",
          color:"rgba(255,255,255,0.4)", fontWeight:"700",
          marginBottom:"8px" }}>
          저장된 메모 ({memos.length})
        </div>

        {loading && (
          <div style={{ textAlign:"center",
            color:"rgba(255,255,255,0.3)", padding:"20px" }}>
            불러오는 중...
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {memos.map(m=>(
            <div key={m.id} style={{
              background:"rgba(255,255,255,0.07)",
              borderRadius:"12px", padding:"12px 14px",
              borderLeft:`3px solid ${TAG_COLORS[m.tag]||"#546E7A"}`
            }}>
              <div style={{ display:"flex",
                justifyContent:"space-between",
                alignItems:"flex-start", gap:"8px" }}>
                <div style={{ fontSize:"14px", color:"white",
                  lineHeight:"1.6", flex:1,
                  whiteSpace:"pre-wrap" }}>{m.text}</div>
                <button onClick={()=>deleteMemo(m.id)} style={{
                  background:"rgba(198,40,40,0.7)",
                  border:"none", borderRadius:"6px",
                  color:"white", width:"24px", height:"24px",
                  cursor:"pointer", fontSize:"11px",
                  flexShrink:0
                }}>✕</button>
              </div>
              <div style={{
                display:"flex", gap:"8px",
                marginTop:"6px", alignItems:"center"
              }}>
                <span style={{
                  background: TAG_COLORS[m.tag]||"#546E7A",
                  borderRadius:"10px", padding:"2px 8px",
                  fontSize:"10px", color:"white", fontWeight:"700"
                }}>{m.tag}</span>
                <span style={{ fontSize:"11px",
                  color:"rgba(255,255,255,0.35)" }}>
                  {m.displayTime}
                </span>
              </div>
            </div>
          ))}
          {!loading && memos.length === 0 && (
            <div style={{ textAlign:"center",
              color:"rgba(255,255,255,0.25)",
              padding:"24px", fontSize:"13px" }}>
              아직 저장된 메모가 없어!
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}