import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import CocoChat from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";

const PADLET_URL = "https://padlet.com/comsol2024/coco_app";
const SCENARIOS = [
  { id:"fieldtrip", label:"🏕 3학년 현장체험학습",    desc:"3학년 빠지고 1,2학년만 급식" },
  { id:"sports",    label:"🏃 체육대회 (학부모 참여)", desc:"학부모가 추가로 급식 참여" },
  { id:"repair",    label:"🔨 급식실 일부 공사",       desc:"배식 속도가 평소보다 감소" },
  { id:"custom",    label:"✏️ 직접 입력",              desc:"조건을 직접 입력" },
];

// ── 특수상황 그래프 상수 ──
const GW3=340, GH3=240, GPL3=60, GPB3=36, GPR3=16, GPT3=16;
const TVW3=GPL3+GW3+GPR3, TVH3=GPT3+GH3+GPB3;
const XMAX3=40, YMAX3=1500;
const gx3 = x => GPL3+(x/XMAX3)*GW3;
const gy3 = y => GPT3+(1-y/YMAX3)*GH3;

export default function LunchSpecialPage({ user }) {
  const navigate   = useNavigate();
  const captureRef = useRef(null);

  const [scenario,     setScenario]     = useState("");
  const [extraLabel,   setExtraLabel]   = useState("");
  const [extraValue,   setExtraValue]   = useState("");
  const [customCond,   setCustomCond]   = useState("");
  const [sp3Slope,     setSp3Slope]     = useState("");
  const [sp3Intercept, setSp3Intercept] = useState("");
  const [sp3Drawn,     setSp3Drawn]     = useState(false);
  const [sp3StartTime, setSp3StartTime] = useState("");
  const [saved,        setSaved]        = useState(false);

  const sp3_xint = (parseFloat(sp3Slope)<0 && parseFloat(sp3Intercept)>0)
    ? -parseFloat(sp3Intercept)/parseFloat(sp3Slope) : null;

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db,"users",user.uid,"chapters","lunch-special"));
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.scenario)      setScenario(d.scenario);
      if (d.extraValue)    setExtraValue(d.extraValue);
      if (d.customCond)    setCustomCond(d.customCond);
      if (d.sp3Slope)      setSp3Slope(d.sp3Slope);
      if (d.sp3Intercept)  setSp3Intercept(d.sp3Intercept);
      if (d.sp3StartTime)  setSp3StartTime(d.sp3StartTime);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      await setDoc(
        doc(db,"users",user.uid,"chapters","lunch-special"),
        { scenario, extraValue, customCond, sp3Slope, sp3Intercept, sp3StartTime,
          updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, extraValue, customCond, sp3Slope, sp3Intercept, sp3StartTime]);

  const handleScenario = id => {
    setScenario(id); setSp3Drawn(false); setSp3Slope(""); setSp3Intercept("");
    if (id==="fieldtrip")   setExtraLabel("1, 2학년 학생 수 (명)");
    else if (id==="sports") setExtraLabel("추가 참여 인원 (명)");
    else if (id==="repair") setExtraLabel("변경된 배식 속도 (명/분)");
    else                    setExtraLabel("조건 설명");
    setExtraValue("");
  };

  const predictEndTime = () => {
    if (!sp3StartTime || !sp3Slope || !sp3Intercept) return null;
    const s = parseFloat(sp3Slope), b = parseFloat(sp3Intercept);
    if (s>=0) return null;
    const mins = Math.round(-b/s);
    const [h,m] = sp3StartTime.split(":").map(Number);
    const tot = h*60+m+mins;
    return `${Math.floor(tot/60)}:${String(tot%60).padStart(2,"0")}`;
  };

  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor:"#ffffff", scale:2, useCORS:true,
      });
      const link = document.createElement("a");
      link.download = "특수상황_분석.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("캡처 중 오류가 발생했어요.");
    }
  };

  const inp = {
    padding:"10px 14px", borderRadius:"10px",
    border:"1px solid #e2e8f0", fontSize:"18px",
    outline:"none", width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ background:"linear-gradient(180deg,#FFF3E0,#FFE0B2)", minHeight:"100vh" }}>

      {/* 헤더 */}
      <div style={{
        background:"white", padding:"12px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/lunch-data")} style={{
          background:"none", border:"none", color:"#E65100",
          fontWeight:"700", fontSize:"18px", cursor:"pointer"
        }}>← 배식 데이터로</button>
        <div style={{ fontWeight:"900", fontSize:"20px" }}>🎭 특수 상황 분석</div>
        <div style={{ fontSize:"16px", fontWeight:"600", color:saved?"#34a853":"#bbb" }}>
          {saved?"✓ 저장됨":"저장 중..."}
        </div>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:"960px", margin:"0 auto" }}>

        {/* 안내 */}
        <div style={{
          background:"linear-gradient(135deg,#E65100,#BF360C)",
          borderRadius:"14px", padding:"14px 20px",
          marginBottom:"24px", color:"white",
          fontSize:"18px", lineHeight:"1.8"
        }}>
          🌀 <strong>코코의 미션</strong> — 특수한 상황이 생겼을 때 배식 완료 시간을 예측해봐!<br/>
          조건이 달라지면 일차함수 식이 어떻게 바뀌는지 분석해보자.
        </div>

        {/* ── 2열 레이아웃 ── */}
        <div ref={captureRef} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"20px" }}>

          {/* 왼쪽: ① + ② */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            {/* ① 추가 조건 */}
            <div style={{
              background:"white", borderRadius:"16px",
              padding:"20px", boxShadow:"0 4px 16px rgba(0,0,0,0.07)"
            }}>
              <div style={{ fontSize:"18px", fontWeight:"900",
                color:"#E65100", marginBottom:"14px" }}>
                ① 추가되는 조건 선택
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
                {SCENARIOS.map(s=>(
                  <button key={s.id} onClick={()=>handleScenario(s.id)} style={{
                    padding:"12px 16px", borderRadius:"12px", cursor:"pointer",
                    border: scenario===s.id?"2px solid #FF8F00":"1.5px solid #e2e8f0",
                    background: scenario===s.id?"#FFF3E0":"white",
                    fontSize:"17px",
                    fontWeight: scenario===s.id?"700":"400",
                    textAlign:"left"
                  }}>
                    <div>{s.label}</div>
                    <div style={{ fontSize:"15px", color:"#aaa", marginTop:"3px" }}>{s.desc}</div>
                  </button>
                ))}
              </div>
              {scenario && scenario!=="custom" && (
                <div>
                  <label style={{ fontSize:"17px", fontWeight:"700",
                    color:"#555", display:"block", marginBottom:"6px" }}>
                    {extraLabel}
                  </label>
                  <input type="number" value={extraValue}
                    onChange={e=>setExtraValue(e.target.value)}
                    placeholder="숫자 입력"
                    style={{ ...inp, background:"#FFF9E6", border:"1px solid #FFCA28" }}/>
                </div>
              )}
              {scenario==="custom" && (
                <textarea value={customCond}
                  onChange={e=>setCustomCond(e.target.value)}
                  placeholder="특수 상황을 직접 설명해봐!"
                  style={{ ...inp, minHeight:"80px", resize:"vertical", lineHeight:"1.7" }}/>
              )}
            </div>

            {/* ② 일차함수 식 구하기 */}
            <div style={{
              background:"white", borderRadius:"16px",
              padding:"20px", boxShadow:"0 4px 16px rgba(0,0,0,0.07)"
            }}>
              <div style={{ fontSize:"18px", fontWeight:"900",
                color:"#6A1B9A", marginBottom:"10px" }}>
                ② 일차함수 식 구하기
              </div>
              <div style={{ fontSize:"17px", color:"#888", marginBottom:"12px" }}>
                x = 시간(분),  y = 남은 학생 수
              </div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"20px", fontWeight:"700", whiteSpace:"nowrap" }}>y =</span>
                <input value={sp3Slope}
                  onChange={e=>{ setSp3Slope(e.target.value); setSp3Drawn(false); }}
                  placeholder="기울기"
                  style={{ ...inp, fontFamily:"Courier New", textAlign:"center" }}/>
                <span style={{ fontSize:"20px", fontWeight:"700", whiteSpace:"nowrap" }}>x +</span>
                <input value={sp3Intercept}
                  onChange={e=>{ setSp3Intercept(e.target.value); setSp3Drawn(false); }}
                  placeholder="y절편"
                  style={{ ...inp, fontFamily:"Courier New", textAlign:"center" }}/>
              </div>
            </div>
          </div>

          {/* 오른쪽: ③ 그래프 + 예측 */}
          <div style={{
            background:"white", borderRadius:"16px",
            padding:"20px", boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
            display:"flex", flexDirection:"column", gap:"14px"
          }}>
            <div style={{ fontSize:"18px", fontWeight:"900", color:"#2E7D32" }}>
              ③ 그래프 + 배식 완료 시간 예측
            </div>

            {/* 특수상황 그래프 SVG */}
            <svg viewBox={`0 0 ${TVW3} ${TVH3}`}
              style={{
                width:"100%", border:"1px solid #e0e0e0",
                borderRadius:"12px", background:"#fafafa"
              }}>
              {[0,10,20,30,40].map(x=>(
                <g key={`sx${x}`}>
                  <line x1={gx3(x)} y1={GPT3} x2={gx3(x)} y2={GPT3+GH3}
                    stroke={x===0?"#aaa":"#ebebeb"} strokeWidth={x===0?1.5:1}/>
                  <text x={gx3(x)} y={GPT3+GH3+14} textAnchor="middle"
                    fontSize={11} fill="#888">{x}</text>
                </g>
              ))}
              {[0,300,600,900,1200,1500].map(y=>(
                <g key={`sy${y}`}>
                  <line x1={GPL3} y1={gy3(y)} x2={GPL3+GW3} y2={gy3(y)}
                    stroke={y===0?"#aaa":"#ebebeb"} strokeWidth={y===0?1.5:1}/>
                  <text x={GPL3-5} y={gy3(y)+4} textAnchor="end"
                    fontSize={11} fill="#888">{y}</text>
                </g>
              ))}
              <line x1={GPL3} y1={GPT3} x2={GPL3} y2={GPT3+GH3} stroke="#333" strokeWidth={1.5}/>
              <line x1={GPL3} y1={GPT3+GH3} x2={GPL3+GW3} y2={GPT3+GH3} stroke="#333" strokeWidth={1.5}/>
              <text x={GPL3+GW3/2} y={TVH3-6} textAnchor="middle" fontSize={12} fill="#555">시간 (분) →</text>

              {sp3Drawn && parseFloat(sp3Slope)<0 && parseFloat(sp3Intercept)>0 && (()=>{
                const s=parseFloat(sp3Slope), b=parseFloat(sp3Intercept);
                const xi = -b/s;
                const clampX = Math.min(xi,XMAX3);
                const y0 = Math.min(b,YMAX3);
                return (
                  <>
                    <line x1={gx3(0)} y1={gy3(y0)} x2={gx3(clampX)} y2={gy3(0)}
                      stroke="#e53935" strokeWidth={3}/>
                    <circle cx={gx3(0)} cy={gy3(y0)} r={5}
                      fill="#1565C0" stroke="white" strokeWidth={2}/>
                    {xi<=XMAX3 && (
                      <circle cx={gx3(xi)} cy={gy3(0)} r={5}
                        fill="#e53935" stroke="white" strokeWidth={2}/>
                    )}
                    <g>
                      <rect x={GPL3+6} y={GPT3+6} width={150} height={22}
                        rx={4} fill="rgba(255,255,255,0.93)"/>
                      <text x={GPL3+10} y={GPT3+19} fontSize={13}
                        fill="#e53935" fontWeight="bold">
                        y={s}x+{b}
                      </text>
                    </g>
                  </>
                );
              })()}
              {!sp3Drawn && (
                <text x={GPL3+GW3/2} y={GPT3+GH3/2} textAnchor="middle" fontSize={13} fill="#ccc">
                  ② 식 입력 후 그래프 그리기 버튼을 눌러봐!
                </text>
              )}
            </svg>

            <button onClick={()=>{
              if (!sp3Slope||!sp3Intercept) {
                alert("② 에서 일차함수 식을 먼저 입력해줘!");
                return;
              }
              setSp3Drawn(true);
            }} style={{
              padding:"14px",
              background:"linear-gradient(135deg,#43a047,#2e7d32)",
              color:"white", border:"none", borderRadius:"12px",
              fontSize:"18px", fontWeight:"700", cursor:"pointer"
            }}>📈 그래프 그리기</button>

            {/* 배식 완료 시간 예측 */}
            <div style={{ background:"#f8f9ff", borderRadius:"12px", padding:"16px" }}>
              <div style={{ fontSize:"17px", fontWeight:"700",
                color:"#555", marginBottom:"8px" }}>⏰ 배식 시작 시간 입력</div>
              <input type="time" value={sp3StartTime}
                onChange={e=>setSp3StartTime(e.target.value)}
                style={{ ...inp, marginBottom:"12px" }}/>
              {sp3Drawn && sp3_xint && sp3_xint>0 && (
                <div style={{
                  background:"linear-gradient(135deg,#e8f5e9,#c8e6c9)",
                  borderRadius:"12px", padding:"14px 16px", textAlign:"center"
                }}>
                  <div style={{ fontSize:"17px", color:"#555", marginBottom:"4px" }}>
                    예측 배식 완료 시간
                  </div>
                  <div style={{ fontSize:"24px", fontWeight:"900", color:"#2E7D32" }}>
                    {sp3StartTime ? `${predictEndTime()} 🕐` : `약 ${sp3_xint.toFixed(1)}분 후`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"16px" }}>
          <button onClick={handleCapture} style={{
            padding:"16px",
            background:"linear-gradient(135deg,#546E7A,#37474F)",
            color:"white", border:"none", borderRadius:"14px",
            fontSize:"18px", fontWeight:"700", cursor:"pointer",
            boxShadow:"0 4px 16px rgba(84,110,122,0.35)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"
          }}>📷 캡처하기</button>

          <button onClick={()=>
            PADLET_URL
              ? window.open(PADLET_URL,"_blank")
              : alert("패들렛 링크가 아직 설정되지 않았어요!")}
            style={{
              padding:"16px",
              background:"linear-gradient(135deg,#FF8F00,#E65100)",
              color:"white", border:"none", borderRadius:"14px",
              fontSize:"18px", fontWeight:"700", cursor:"pointer",
              boxShadow:"0 4px 16px rgba(230,81,0,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"
            }}>🚀 패들렛 공유하기</button>
        </div>
      </div>

      <CocoChat
        systemPrompt={PROMPTS.lunch}
        initialMessage="안녕! 나는 코코야 🌀&#10;특수 상황에서 일차함수 식이 어떻게 바뀌는지 막히면 물어봐!"
      />
    </div>
  );
}
