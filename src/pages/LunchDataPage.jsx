import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import CocoChat    from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";

const PADLET_URL = "https://padlet.com/comsol2024/coco_1_festival";
const DAYS = [
  { id:"mon", day:"월요일", defaultMenu:"한식", color:"#e3f2fd", lc:"#1565c0" },
  { id:"tue", day:"화요일", defaultMenu:"양식", color:"#f3e5f5", lc:"#7b1fa2" },
  { id:"wed", day:"수요일", defaultMenu:"특식", color:"#fff8e1", lc:"#e65100" },
  { id:"thu", day:"목요일", defaultMenu:"한식", color:"#e8f5e9", lc:"#2e7d32" },
  { id:"fri", day:"금요일", defaultMenu:"한식", color:"#fce4ec", lc:"#c62828" },
];
const MENU_OPTIONS = ["한식","양식","중식","특식","기타"];
const MENU_EMOJI   = {"한식":"🍚","양식":"🍝","중식":"🥟","특식":"🌟","기타":"🍽"};
const SCENARIOS = [
  { id:"fieldtrip", label:"🏕 3학년 현장체험학습",    desc:"3학년 빠지고 1,2학년만 급식" },
  { id:"sports",    label:"🏃 체육대회 (학부모 참여)", desc:"학부모가 추가로 급식 참여" },
  { id:"repair",    label:"🔨 급식실 일부 공사",       desc:"배식 속도가 평소보다 감소" },
  { id:"custom",    label:"✏️ 직접 입력",              desc:"조건을 직접 입력" },
];

// ── 메인 그래프 레이아웃 상수 ──
const GW=300, GH=230, GPL=56, GPB=40, GPR=16, GPT=16;
const TVW=GPL+GW+GPR, TVH=GPT+GH+GPB;
const XMAX=40;
const gx = x => GPL+(x/XMAX)*GW;

// ── 특수상황 그래프 레이아웃 상수 ──
const GW3=230, GH3=180, GPL3=54, GPB3=32, GPR3=12, GPT3=12;
const TVW3=GPL3+GW3+GPR3, TVH3=GPT3+GH3+GPB3;
const XMAX3=40, YMAX3=1500;
const gx3 = x => GPL3+(x/XMAX3)*GW3;
const gy3 = y => GPT3+(1-y/YMAX3)*GH3;

export default function LunchDataPage({ user }) {
  const navigate = useNavigate();

  const [globalStart, setGlobalStart] = useState("");
  const [globalTotal, setGlobalTotal] = useState("");
  const [weekData, setWeekData] = useState(
    DAYS.reduce((acc,d) => ({
      ...acc,
      [d.id]: { menu: d.defaultMenu, rate: "", note: "" }
    }), {})
  );
  const [graphDrawn, setGraphDrawn]       = useState(false);
  const [xIntAnswers, setXIntAnswers]     = useState({});   // 학생 입력값
  const [xIntChecked, setXIntChecked]     = useState({});   // 정오답 결과
  const [scenario,     setScenario]       = useState("");
  const [extraLabel,   setExtraLabel]     = useState("");
  const [extraValue,   setExtraValue]     = useState("");
  const [customCond,   setCustomCond]     = useState("");
  const [sp3Slope,     setSp3Slope]       = useState("");
  const [sp3Intercept, setSp3Intercept]   = useState("");
  const [sp3Drawn,     setSp3Drawn]       = useState(false);
  const [sp3StartTime, setSp3StartTime]   = useState("");
  const [saved,        setSaved]          = useState(false);
  const captureRef = useRef(null);

  // ── 동적 YMAX / gy ──
  const total = parseFloat(globalTotal) || 0;
  const YMAX  = total > 0 ? Math.ceil(total / 200) * 200 : 1400;
  const gy    = y => GPT+(1-y/YMAX)*GH;
  const yTicks = Array.from({ length: YMAX/200+1 }, (_,i) => i*200);

  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor:"#ffffff", scale:2, useCORS:true,
      });
      const link = document.createElement("a");
      link.download = "배식시간_측정기록.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("캡처 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db,"users",user.uid,"chapters","lunch-data"));
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.globalStart) setGlobalStart(d.globalStart);
      if (d.globalTotal) setGlobalTotal(d.globalTotal);
      if (d.weekData)    setWeekData(d.weekData);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      await setDoc(
        doc(db,"users",user.uid,"chapters","lunch-data"),
        { globalStart, globalTotal, weekData,
          updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalStart, globalTotal, weekData]);

  const updateDay = (id,k,v) =>
    setWeekData(p => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const handleDrawGraph = () => {
    const t = parseFloat(globalTotal);
    const hasRate = DAYS.some(d => parseFloat(weekData[d.id].rate) > 0);
    if (!t || !hasRate) {
      alert("전체 배식 인원수와 요일별 1분당 배식 인원을 입력해주세요!");
      return;
    }
    setGraphDrawn(true);
    setXIntAnswers({});
    setXIntChecked({});
  };

  // x절편 정오답 확인 (±1분 허용)
  const checkXInt = (dayId) => {
    const rate = parseFloat(weekData[dayId].rate);
    if (!rate || !total) return;
    const correct = total / rate;
    const answer  = parseFloat(xIntAnswers[dayId]);
    if (isNaN(answer)) return;
    const isOk = Math.abs(answer - correct) <= 1;
    setXIntChecked(p => ({ ...p, [dayId]: isOk ? "correct" : "wrong" }));
  };

  const predictEndTime = () => {
    if (!sp3StartTime || !sp3Slope || !sp3Intercept) return null;
    const s = parseFloat(sp3Slope), b = parseFloat(sp3Intercept);
    if (s >= 0) return null;
    const mins = Math.round(-b / s);
    const [h,m] = sp3StartTime.split(":").map(Number);
    const tot = h*60 + m + mins;
    return `${Math.floor(tot/60)}:${String(tot%60).padStart(2,"0")}`;
  };

  const sp3_xint = (parseFloat(sp3Slope)<0 && parseFloat(sp3Intercept)>0)
    ? -parseFloat(sp3Intercept)/parseFloat(sp3Slope) : null;

  const handleScenario = id => {
    setScenario(id); setSp3Drawn(false); setSp3Slope(""); setSp3Intercept("");
    if (id==="fieldtrip")   setExtraLabel("1, 2학년 학생 수 (명)");
    else if (id==="sports") setExtraLabel("추가 참여 인원 (명)");
    else if (id==="repair") setExtraLabel("변경된 배식 속도 (명/분)");
    else                    setExtraLabel("조건 설명");
    setExtraValue("");
  };

  const inp = {
    padding:"7px 10px", borderRadius:"8px",
    border:"1px solid #e2e8f0", fontSize:"14px",
    outline:"none", width:"100%", boxSizing:"border-box",
  };

  // 그래프에 표시할 요일 목록 (rate 입력된 것만)
  const activeDays = DAYS.filter(d => parseFloat(weekData[d.id].rate) > 0);

  return (
    <div style={{ background:"linear-gradient(180deg,#FFF8E1,#FFECB3)",
      minHeight:"100vh" }}>

      {/* 헤더 */}
      <div style={{
        background:"white", padding:"12px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/lunch-scene")} style={{
          background:"none", border:"none", color:"#FF8F00",
          fontWeight:"700", fontSize:"14px", cursor:"pointer"
        }}>← 뒤로</button>
        <div style={{ fontWeight:"900", fontSize:"17px" }}>🍱 배식 시간 측정 기록</div>
        <div style={{ fontSize:"12px", fontWeight:"600",
          color:saved?"#34a853":"#bbb" }}>
          {saved?"✓ 저장됨":"저장 중..."}
        </div>
      </div>

      <div style={{ padding:"16px 20px" }}>
        <div ref={captureRef} style={{ padding:"16px 20px" }}></div>

        {/* 안내 */}
        <div style={{
          background:"linear-gradient(135deg,#FF8F00,#E65100)",
          borderRadius:"14px", padding:"14px 18px",
          marginBottom:"16px", color:"white",
          fontSize:"16px", lineHeight:"1.8"
        }}>
          🌀 <strong>코코의 미션</strong> — 배식 데이터를 측정하고 일차함수 그래프로 나타내봐!
        </div>

        {/* ── 배식 기록 표 ── */}
        <div style={{
          background:"white", borderRadius:"16px",
          boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
          marginBottom:"16px", overflow:"hidden"
        }}>
          <div style={{
            padding:"14px 20px", borderBottom:"1px solid #f0f0f0",
            fontWeight:"900", fontSize:"16px"
          }}>📅 요일별 배식 기록</div>

          <div style={{
            display:"flex", gap:"20px", padding:"14px 20px",
            borderBottom:"1px solid #f5f5f5",
            background:"#fffdf5", flexWrap:"wrap"
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <label style={{ fontSize:"14px", fontWeight:"700",
                color:"#555", whiteSpace:"nowrap" }}>🕛 배식 시작 시간</label>
              <input type="time" value={globalStart}
                onChange={e=>setGlobalStart(e.target.value)}
                style={{ ...inp, width:"140px" }}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <label style={{ fontSize:"14px", fontWeight:"700",
                color:"#555", whiteSpace:"nowrap" }}>👥 전체 배식 인원수</label>
              <input type="number" value={globalTotal}
                onChange={e=>{ setGlobalTotal(e.target.value); setGraphDrawn(false); }}
                placeholder="예: 1300"
                style={{ ...inp, width:"120px" }}/>
              <span style={{ fontSize:"13px", color:"#888" }}>명</span>
            </div>
          </div>

          <div style={{
            display:"grid", gridTemplateColumns:"90px 100px 1fr 1fr",
            gap:"8px", padding:"9px 20px",
            background:"#fffdf5", fontSize:"13px", fontWeight:"700", color:"#999"
          }}>
            <div>요일</div><div>메뉴</div>
            <div>1분당 배식 인원 (명/분)</div><div>비고</div>
          </div>

          {DAYS.map(d => {
            const row = weekData[d.id];
            return (
              <div key={d.id} style={{
                display:"grid", gridTemplateColumns:"90px 100px 1fr 1fr",
                gap:"8px", padding:"9px 20px",
                borderBottom:"1px solid #f5f5f5",
                background: d.color+"55", alignItems:"center"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ width:"12px", height:"12px", borderRadius:"50%",
                    background:d.lc, flexShrink:0 }}/>
                  <span style={{ fontSize:"15px", fontWeight:"700" }}>{d.day}</span>
                </div>
                <select value={row.menu}
                  onChange={e=>updateDay(d.id,"menu",e.target.value)}
                  style={{ ...inp, background:d.color, fontSize:"15px" }}>
                  {MENU_OPTIONS.map(m=>(
                    <option key={m} value={m}>{MENU_EMOJI[m]} {m}</option>
                  ))}
                </select>
                <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
                  <input type="number" value={row.rate}
                    onChange={e=>{ updateDay(d.id,"rate",e.target.value); setGraphDrawn(false); }}
                    placeholder="예: 50"
                    style={{ ...inp, maxWidth:"700px" }}/>
                  <span style={{ fontSize:"15px", color:"#888", whiteSpace:"nowrap" }}>
                    명/분
                  </span>
                </div>
                <input value={row.note||""}
                  onChange={e=>updateDay(d.id,"note",e.target.value)}
                  placeholder="특이사항" style={inp}/>
              </div>
            );
          })}
        </div>

        {/* ── 그래프 + 특수상황 ── */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:"16px", marginBottom:"16px"
        }}>

          {/* 요일별 통합 그래프 */}
          <div style={{
            background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
            display:"flex", flexDirection:"column", overflow:"hidden"
          }}>
            <div style={{
              padding:"14px 18px", borderBottom:"1px solid #f0f0f0",
              fontWeight:"900", fontSize:"16px", flexShrink:0
            }}>📈 요일별 일차함수 그래프</div>

            <div style={{ flex:1, padding:"14px 16px", overflowY:"auto" }}>
              {/* 설정값 안내 */}
              <div style={{
                background:"#f8f9ff", borderRadius:"12px",
                padding:"12px 14px", marginBottom:"12px",
                fontSize:"13px", lineHeight:"1.8"
              }}>
                <div style={{ fontWeight:"700", color:"#555", marginBottom:"6px" }}>
                  📌 그래프 설정값
                </div>
                <div>
                  <span style={{ fontWeight:"700", color:"#1565C0" }}>y절편</span>
                  {" = 전체 배식 인원수 = "}
                  <strong>{globalTotal || "?"}</strong>명
                </div>
                <div style={{ marginTop:"4px" }}>
                  <span style={{ fontWeight:"700", color:"#e65100" }}>기울기</span>
                  {" = -(1분당 배식 인원)"}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"6px" }}>
                  {DAYS.map(d => {
                    const rate = parseFloat(weekData[d.id].rate);
                    return (
                      <span key={d.id} style={{
                        padding:"2px 8px", background:d.color,
                        borderRadius:"6px", fontSize:"12px",
                        fontWeight:"700", color:d.lc
                      }}>
                        {d.day[0]}: {rate > 0 ? `-${rate}` : "?"}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* SVG 메인 그래프 */}
              <svg viewBox={`0 0 ${TVW} ${TVH}`}
                style={{
                  width:"100%", border:"1px solid #f0f0f0",
                  borderRadius:"10px", background:"#fafafa", marginBottom:"10px"
                }}>

                {/* x축 격자: 0~40, 5분 간격 */}
                {[0,5,10,15,20,25,30,35,40].map(x=>(
                  <g key={`gx${x}`}>
                    <line x1={gx(x)} y1={GPT} x2={gx(x)} y2={GPT+GH}
                      stroke={x===0?"#aaa":"#ebebeb"} strokeWidth={x===0?1.5:1}/>
                    <text x={gx(x)} y={GPT+GH+16} textAnchor="middle"
                      fontSize={10} fill="#888">{x}</text>
                  </g>
                ))}

                {/* y축 격자: 동적 200 단위 */}
                {yTicks.map(y=>(
                  <g key={`gy${y}`}>
                    <line x1={GPL} y1={gy(y)} x2={GPL+GW} y2={gy(y)}
                      stroke={y===0?"#aaa":"#ebebeb"} strokeWidth={y===0?1.5:1}/>
                    <text x={GPL-5} y={gy(y)+4} textAnchor="end"
                      fontSize={10} fill="#888">{y}</text>
                  </g>
                ))}

                {/* 축 */}
                <line x1={GPL} y1={GPT} x2={GPL} y2={GPT+GH}
                  stroke="#333" strokeWidth={2}/>
                <line x1={GPL} y1={GPT+GH} x2={GPL+GW} y2={GPT+GH}
                  stroke="#333" strokeWidth={2}/>
                <text x={GPL+GW/2} y={TVH-5} textAnchor="middle"
                  fontSize={12} fill="#555">시간 (분) →</text>
                <text x={15} y={GPT+GH/2} textAnchor="middle"
                  fontSize={12} fill="#555"
                  transform={`rotate(-90,15,${GPT+GH/2})`}>
                  남은 학생 수 →
                </text>

                {/* 요일별 선 */}
                {graphDrawn && total > 0 && DAYS.map(d => {
                  const rate = parseFloat(weekData[d.id].rate);
                  if (!rate || rate <= 0) return null;
                  const xInt = total / rate;
                  const xEnd = Math.min(xInt, XMAX);
                  const yEnd = Math.max(0, -rate * xEnd + total);

                  return (
                    <g key={d.id}>
                      <line
                        x1={gx(0)} y1={gy(Math.min(total, YMAX))}
                        x2={gx(xEnd)} y2={gy(yEnd)}
                        stroke={d.lc} strokeWidth={2.5}/>
                      {/* y절편 점 */}
                      <circle cx={gx(0)} cy={gy(Math.min(total, YMAX))} r={4}
                        fill={d.lc} stroke="white" strokeWidth={1.5}/>
                      {/* x절편 점 (XMAX 이내일 때만) */}
                      {xInt <= XMAX && (
                        <circle cx={gx(xInt)} cy={gy(0)} r={4}
                          fill={d.lc} stroke="white" strokeWidth={1.5}/>
                      )}
                    </g>
                  );
                })}

                {!graphDrawn && (
                  <text x={GPL+GW/2} y={GPT+GH/2} textAnchor="middle"
                    fontSize={12} fill="#ccc">
                    데이터 입력 후 그래프 그리기 버튼을 눌러봐!
                  </text>
                )}
              </svg>

              {/* 범례 */}
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"10px" }}>
                {DAYS.map(d => {
                  const rate = parseFloat(weekData[d.id].rate);
                  return (
                    <div key={d.id} style={{
                      display:"flex", alignItems:"center", gap:"5px",
                      padding:"4px 10px", background:d.color,
                      borderRadius:"8px", fontSize:"12px", fontWeight:"700"
                    }}>
                      <div style={{ width:"12px", height:"3px",
                        background:d.lc, borderRadius:"2px" }}/>
                      <span style={{ color:d.lc }}>
                        {d.day[0]}요일
                        {rate > 0 && (
                          <span style={{ fontWeight:"400", fontSize:"11px", marginLeft:"4px" }}>
                            y=-{rate}x+{total||"?"}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 그래프 그리기 버튼 */}
              <button onClick={handleDrawGraph} style={{
                width:"100%", padding:"12px",
                background:"linear-gradient(135deg,#FF8F00,#E65100)",
                color:"white", border:"none", borderRadius:"10px",
                fontSize:"14px", fontWeight:"700", cursor:"pointer",
                marginBottom:"12px"
              }}>📈 요일별 그래프 그리기</button>

              {/* ── x절편 입력 & 정오답 확인 ── */}
              {graphDrawn && activeDays.length > 0 && (
                <div style={{
                  background:"#f8f9ff", borderRadius:"12px",
                  padding:"12px 14px",
                  border:"1px solid #dde3ff"
                }}>
                  <div style={{ fontWeight:"800", fontSize:"14px",
                    color:"#3949AB", marginBottom:"10px" }}>
                    🔍 x절편을 구해봐! (배식 완료까지 몇 분?)
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {activeDays.map(d => {
                      const status = xIntChecked[d.id];
                      const inputVal = xIntAnswers[d.id] || "";
                      return (
                        <div key={d.id} style={{
                          display:"grid",
                          gridTemplateColumns:"70px 1fr auto auto",
                          gap:"8px", alignItems:"center"
                        }}>
                          {/* 요일 라벨 */}
                          <div style={{
                            display:"flex", alignItems:"center", gap:"5px"
                          }}>
                            <div style={{
                              width:"10px", height:"10px", borderRadius:"50%",
                              background:d.lc, flexShrink:0
                            }}/>
                            <span style={{ fontSize:"13px", fontWeight:"700",
                              color:d.lc }}>
                              {d.day[0]}요일
                            </span>
                          </div>

                          {/* 입력칸 */}
                          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                            <input
                              type="number"
                              value={inputVal}
                              onChange={e => {
                                setXIntAnswers(p=>({...p,[d.id]:e.target.value}));
                                setXIntChecked(p=>({...p,[d.id]:undefined}));
                              }}
                              placeholder="분 입력"
                              style={{
                                ...inp,
                                border: status==="correct"
                                  ? "2px solid #43a047"
                                  : status==="wrong"
                                  ? "2px solid #e53935"
                                  : "1px solid #e2e8f0",
                                background: status==="correct"
                                  ? "#f1f8e9"
                                  : status==="wrong"
                                  ? "#ffebee"
                                  : "white",
                                width:"90px",
                                textAlign:"center",
                              }}
                            />
                            <span style={{ fontSize:"13px", color:"#888" }}>분</span>
                          </div>

                          {/* 확인 버튼 */}
                          <button
                            onClick={()=>checkXInt(d.id)}
                            style={{
                              padding:"6px 12px", borderRadius:"8px",
                              border:"none", cursor:"pointer",
                              background: d.lc, color:"white",
                              fontSize:"12px", fontWeight:"700",
                              whiteSpace:"nowrap"
                            }}>
                            확인
                          </button>

                          {/* 정오답 표시 */}
                          <div style={{
                            fontSize:"18px", width:"24px", textAlign:"center"
                          }}>
                            {status==="correct" && "✅"}
                            {status==="wrong"   && "❌"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 전체 정답 메시지 */}
                  {activeDays.length > 0 &&
                   activeDays.every(d => xIntChecked[d.id]==="correct") && (
                    <div style={{
                      marginTop:"10px",
                      background:"linear-gradient(135deg,#e8f5e9,#c8e6c9)",
                      borderRadius:"10px", padding:"10px 14px",
                      textAlign:"center", fontSize:"14px",
                      fontWeight:"800", color:"#2e7d32"
                    }}>
                      🎉 모든 요일의 x절편을 완벽하게 구했어!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 특수 상황 분석 */}
          <div style={{
            background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
            display:"flex", flexDirection:"column", overflow:"hidden"
          }}>
            <div style={{
              padding:"14px 18px", borderBottom:"1px solid #f0f0f0",
              fontWeight:"900", fontSize:"16px", flexShrink:0,
              background:"linear-gradient(90deg,#fff3e0,white)"
            }}>🎭 특수 상황 분석</div>

            <div style={{ flex:1, padding:"14px 16px",
              overflowY:"auto", display:"flex",
              flexDirection:"column", gap:"12px" }}>

              {/* ① */}
              <div style={{
                background:"#fff8e1", borderRadius:"12px",
                padding:"12px 14px", border:"1px solid #FFE082"
              }}>
                <div style={{ fontSize:"14px", fontWeight:"900",
                  color:"#E65100", marginBottom:"8px" }}>① 추가되는 조건</div>
                <div style={{ display:"flex", flexDirection:"column",
                  gap:"6px", marginBottom:"8px" }}>
                  {SCENARIOS.map(s=>(
                    <button key={s.id} onClick={()=>handleScenario(s.id)} style={{
                      padding:"9px 12px", borderRadius:"10px", cursor:"pointer",
                      border: scenario===s.id?"2px solid #FF8F00":"1px solid #e2e8f0",
                      background: scenario===s.id?"#FFF3E0":"white",
                      fontSize:"13px",
                      fontWeight: scenario===s.id?"700":"400",
                      textAlign:"left"
                    }}>
                      <div>{s.label}</div>
                      <div style={{ fontSize:"11px", color:"#aaa",
                        marginTop:"2px" }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
                {scenario && scenario!=="custom" && (
                  <div>
                    <label style={{ fontSize:"12px", fontWeight:"700",
                      color:"#718096", display:"block", marginBottom:"4px" }}>
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
                    style={{ ...inp, minHeight:"60px", resize:"none", lineHeight:"1.6" }}/>
                )}
              </div>

              {/* ② */}
              <div style={{
                background:"#f8f0ff", borderRadius:"12px",
                padding:"12px 14px", border:"1px solid #E1BEE7"
              }}>
                <div style={{ fontSize:"14px", fontWeight:"900",
                  color:"#6A1B9A", marginBottom:"8px" }}>② 일차함수 식 구하기</div>
                <div style={{ fontSize:"12px", color:"#888", marginBottom:"8px" }}>
                  x = 시간(분),  y = 남은 학생 수
                </div>
                <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                  <span style={{ fontSize:"15px", fontWeight:"700",
                    whiteSpace:"nowrap" }}>y =</span>
                  <input value={sp3Slope}
                    onChange={e=>{ setSp3Slope(e.target.value); setSp3Drawn(false); }}
                    placeholder="기울기"
                    style={{ ...inp, fontFamily:"Courier New",
                      fontSize:"14px", textAlign:"center" }}/>
                  <span style={{ fontSize:"15px", fontWeight:"700",
                    whiteSpace:"nowrap" }}>x +</span>
                  <input value={sp3Intercept}
                    onChange={e=>{ setSp3Intercept(e.target.value); setSp3Drawn(false); }}
                    placeholder="y절편"
                    style={{ ...inp, fontFamily:"Courier New",
                      fontSize:"14px", textAlign:"center" }}/>
                </div>
              </div>

              {/* ③ */}
              <div style={{
                background:"#e8f5e9", borderRadius:"12px",
                padding:"12px 14px", border:"1px solid #A5D6A7"
              }}>
                <div style={{ fontSize:"14px", fontWeight:"900",
                  color:"#2E7D32", marginBottom:"8px" }}>③ 그래프 + 배식 완료 시간 예측</div>

                <svg viewBox={`0 0 ${TVW3} ${TVH3}`}
                  style={{
                    width:"100%", border:"1px solid #ddd",
                    borderRadius:"8px", background:"white", marginBottom:"8px"
                  }}>
                  {[0,10,20,30,40].map(x=>(
                    <g key={`sx${x}`}>
                      <line x1={gx3(x)} y1={GPT3} x2={gx3(x)} y2={GPT3+GH3}
                        stroke={x===0?"#aaa":"#ebebeb"} strokeWidth={x===0?1.5:1}/>
                      <text x={gx3(x)} y={GPT3+GH3+12} textAnchor="middle"
                        fontSize={9} fill="#888">{x}</text>
                    </g>
                  ))}
                  {[0,300,600,900,1200,1500].map(y=>(
                    <g key={`sy${y}`}>
                      <line x1={GPL3} y1={gy3(y)} x2={GPL3+GW3} y2={gy3(y)}
                        stroke={y===0?"#aaa":"#ebebeb"} strokeWidth={y===0?1.5:1}/>
                      <text x={GPL3-5} y={gy3(y)+3} textAnchor="end"
                        fontSize={9} fill="#888">{y}</text>
                    </g>
                  ))}
                  <line x1={GPL3} y1={GPT3} x2={GPL3} y2={GPT3+GH3}
                    stroke="#333" strokeWidth={1.5}/>
                  <line x1={GPL3} y1={GPT3+GH3} x2={GPL3+GW3} y2={GPT3+GH3}
                    stroke="#333" strokeWidth={1.5}/>

                  {sp3Drawn && parseFloat(sp3Slope)<0 && parseFloat(sp3Intercept)>0 && (()=>{
                    const s=parseFloat(sp3Slope), b=parseFloat(sp3Intercept);
                    const xi = -b/s;
                    const clampX = Math.min(xi, XMAX3);
                    const y0 = Math.min(b, YMAX3);
                    return (
                      <>
                        <line x1={gx3(0)} y1={gy3(y0)}
                          x2={gx3(clampX)} y2={gy3(0)}
                          stroke="#e53935" strokeWidth={2.5}/>
                        {/* y절편 점 */}
                        <circle cx={gx3(0)} cy={gy3(y0)} r={4}
                          fill="#1565C0" stroke="white" strokeWidth={1.5}/>
                        {/* x절편 점 */}
                        {xi <= XMAX3 && (
                          <circle cx={gx3(xi)} cy={gy3(0)} r={4}
                            fill="#e53935" stroke="white" strokeWidth={1.5}/>
                        )}
                        <g>
                          <rect x={GPL3+4} y={GPT3+4} width={130} height={18}
                            rx={3} fill="rgba(255,255,255,0.92)"/>
                          <text x={GPL3+8} y={GPT3+15} fontSize={11}
                            fill="#e53935" fontWeight="bold">
                            y={s}x+{b}
                          </text>
                        </g>
                      </>
                    );
                  })()}
                  {!sp3Drawn && (
                    <text x={GPL3+GW3/2} y={GPT3+GH3/2}
                      textAnchor="middle" fontSize={11} fill="#ccc">
                      ② 식 입력 후 그래프 그리기
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
                  width:"100%", padding:"10px", marginBottom:"8px",
                  background:"linear-gradient(135deg,#43a047,#2e7d32)",
                  color:"white", border:"none", borderRadius:"8px",
                  fontSize:"13px", fontWeight:"700", cursor:"pointer"
                }}>📈 그래프 그리기</button>

                <div style={{ background:"white", borderRadius:"8px", padding:"10px 12px" }}>
                  <div style={{ fontSize:"12px", fontWeight:"700",
                    color:"#718096", marginBottom:"5px" }}>배식 시작 시간 입력</div>
                  <input type="time" value={sp3StartTime}
                    onChange={e=>setSp3StartTime(e.target.value)}
                    style={{ ...inp, marginBottom:"8px" }}/>
                  {sp3Drawn && sp3_xint && sp3_xint>0 && (
                    <div style={{
                      background:"linear-gradient(135deg,#e8f5e9,#c8e6c9)",
                      borderRadius:"8px", padding:"10px 12px", textAlign:"center"
                    }}>
                      <div style={{ fontSize:"12px", color:"#555", marginBottom:"3px" }}>
                        예측 배식 완료 시간
                      </div>
                      <div style={{ fontSize:"20px", fontWeight:"900", color:"#2E7D32" }}>
                        {sp3StartTime
                          ? `${predictEndTime()} 🕐`
                          : `약 ${sp3_xint.toFixed(1)}분 후`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:"14px", marginBottom:"16px"
        }}>
          <button onClick={handleCapture} style={{
            padding:"16px",
            background:"linear-gradient(135deg,#546E7A,#37474F)",
            color:"white", border:"none", borderRadius:"14px",
            fontSize:"15px", fontWeight:"700", cursor:"pointer",
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
              fontSize:"15px", fontWeight:"700", cursor:"pointer",
              boxShadow:"0 4px 16px rgba(230,81,0,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"
            }}>🚀 패들렛 공유하기</button>
        </div>
      </div>

      <CocoChat
        systemPrompt={PROMPTS.lunch}
        initialMessage="안녕! 나는 코코야 🌀&#10;일차함수에 관해서 어려운 부분이 있다면 물어봐!"
      />
    </div>
  );
}
