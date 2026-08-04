import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import CocoChat from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";

const PADLET_URL = "https://padlet.com/comsol2024/coco_app";
const DAYS = [
  { id:"mon", day:"월요일", defaultMenu:"한식", color:"#e3f2fd", lc:"#1565c0" },
  { id:"tue", day:"화요일", defaultMenu:"양식", color:"#f3e5f5", lc:"#7b1fa2" },
  { id:"wed", day:"수요일", defaultMenu:"특식", color:"#fff8e1", lc:"#e65100" },
  { id:"thu", day:"목요일", defaultMenu:"한식", color:"#e8f5e9", lc:"#2e7d32" },
  { id:"fri", day:"금요일", defaultMenu:"한식", color:"#fce4ec", lc:"#c62828" },
];
const MENU_OPTIONS = ["한식","양식","중식","특식","기타"];
const MENU_EMOJI   = {"한식":"🍚","양식":"🍝","중식":"🥟","특식":"🌟","기타":"🍽"};

// ── 메인 그래프 레이아웃 상수 ──
const GW=420, GH=300, GPL=60, GPB=44, GPR=20, GPT=20;
const TVW=GPL+GW+GPR, TVH=GPT+GH+GPB;
const XMAX=40;
const gx = x => GPL+(x/XMAX)*GW;

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
  const [graphDrawn, setGraphDrawn]   = useState(false);
  const [xIntAnswers, setXIntAnswers] = useState({});
  const [xIntChecked, setXIntChecked] = useState({});
  const [saved, setSaved]             = useState(false);

  // ── 동적 YMAX / gy ──
  const total  = parseFloat(globalTotal) || 0;
  const YMAX   = total > 0 ? Math.ceil(total / 200) * 200 : 1400;
  const gy     = y => GPT+(1-y/YMAX)*GH;
  const yTicks = Array.from({ length: YMAX/200+1 }, (_,i) => i*200);

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

  const checkXInt = (dayId) => {
    const rate = parseFloat(weekData[dayId].rate);
    if (!rate || !total) return;
    const correct = total / rate;
    const answer  = parseFloat(xIntAnswers[dayId]);
    if (isNaN(answer)) return;
    setXIntChecked(p => ({ ...p, [dayId]: Math.abs(answer-correct)<=1 ? "correct":"wrong" }));
  };

  const inp = {
    padding:"8px 12px", borderRadius:"8px",
    border:"1px solid #e2e8f0", fontSize:"18px",
    outline:"none", width:"100%", boxSizing:"border-box",
  };

  const activeDays = DAYS.filter(d => parseFloat(weekData[d.id].rate) > 0);

  return (
    <div style={{ background:"linear-gradient(180deg,#FFF8E1,#FFECB3)", minHeight:"100vh" }}>

      {/* 헤더 */}
      <div style={{
        background:"white", padding:"12px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/lunch-scene")} style={{
          background:"none", border:"none", color:"#FF8F00",
          fontWeight:"700", fontSize:"18px", cursor:"pointer"
        }}>← 뒤로</button>
        <div style={{ fontWeight:"900", fontSize:"20px" }}>
          🍱 배식 속도를 측정하여 일차함수로 표현하기
        </div>
        <div style={{ fontSize:"16px", fontWeight:"600", color:saved?"#34a853":"#bbb" }}>
          {saved?"✓ 저장됨":"저장 중..."}
        </div>
      </div>

      <div style={{ padding:"16px 24px", maxWidth:"1200px", margin:"0 auto"  }}>

        {/* 안내 */}
        <div style={{
          background:"linear-gradient(135deg,#FF8F00,#E65100)",
          borderRadius:"14px", padding:"14px 20px",
          marginBottom:"20px", color:"white",
          fontSize:"18px", lineHeight:"1.8"
        }}>
          🌀 <strong>코코의 미션</strong> — 우리학교 배식 데이터를 측정하고 일차함수 그래프로 나타내봐!
        </div>
        {/* ── 좌우 2열 레이아웃 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"20px" }}>

          {/* ── 왼쪽: 배식 기록 표 ── */}
          <div style={{
            background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)", overflow:"hidden"
          }}>
            <div style={{
              padding:"16px 20px", borderBottom:"1px solid #f0f0f0",
              fontWeight:"900", fontSize:"18px"
            }}>📅 요일별 배식 기록</div>

            {/* 공통 입력 */}
            <div style={{
              display:"flex", flexDirection:"column", gap:"12px",
              padding:"16px 20px", borderBottom:"1px solid #f5f5f5",
              background:"#fffdf5"
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <label style={{ fontSize:"18px", fontWeight:"700",
                  color:"#555", whiteSpace:"nowrap", minWidth:"150px" }}>
                  🕛 배식 시작 시간
                </label>
                <input type="time" value={globalStart}
                  onChange={e=>setGlobalStart(e.target.value)}
                  style={{ ...inp, width:"150px" }}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <label style={{ fontSize:"18px", fontWeight:"700",
                  color:"#555", whiteSpace:"nowrap", minWidth:"120px" }}>
                  👥 전체 배식 인원수
                </label>
                <input type="number" value={globalTotal}
                  onChange={e=>{ setGlobalTotal(e.target.value); setGraphDrawn(false); }}
                  placeholder="예: 1300"
                  style={{ ...inp, width:"120px" }}/>
                <span style={{ fontSize:"18px", color:"#888" }}>명</span>
              </div>
            </div>

            {/* 표 헤더 */}
            <div style={{
              display:"grid", gridTemplateColumns:"80px 90px 1fr 1fr",
              gap:"8px", padding:"10px 20px",
              background:"#fffdf5", fontSize:"16px", fontWeight:"700", color:"#999"
            }}>
              <div>요일</div><div>메뉴</div>
              <div>1분당 배식 인원</div><div>비고</div>
            </div>

            {/* 표 행 */}
            {DAYS.map(d => {
              const row = weekData[d.id];
              return (
                <div key={d.id} style={{
                  display:"grid", gridTemplateColumns:"80px 90px 1fr 1fr",
                  gap:"8px", padding:"10px 20px",
                  borderBottom:"1px solid #f5f5f5",
                  background:d.color+"44", alignItems:"center"
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"50%",
                      background:d.lc, flexShrink:0 }}/>
                    <span style={{ fontSize:"17px", fontWeight:"700" }}>{d.day}</span>
                  </div>
                  <select value={row.menu}
                    onChange={e=>updateDay(d.id,"menu",e.target.value)}
                    style={{ ...inp, background:d.color, fontSize:"16px", padding:"6px 8px" }}>
                    {MENU_OPTIONS.map(m=>(
                      <option key={m} value={m}>{MENU_EMOJI[m]} {m}</option>
                    ))}
                  </select>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <input type="number" value={row.rate}
                      onChange={e=>{ updateDay(d.id,"rate",e.target.value); setGraphDrawn(false); }}
                      placeholder="예: 50"
                      style={{ ...inp }}/>
                    <span style={{ fontSize:"16px", color:"#888", whiteSpace:"nowrap" }}>명/분</span>
                  </div>
                  <input value={row.note||""}
                    onChange={e=>updateDay(d.id,"note",e.target.value)}
                    placeholder="특이사항" style={{ ...inp, fontSize:"16px" }}/>
                </div>
              );
            })}
          </div>

          {/* ── 오른쪽: 그래프 ── */}
          <div style={{
            background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
            display:"flex", flexDirection:"column", overflow:"hidden"
          }}>
            <div style={{
              padding:"16px 20px", borderBottom:"1px solid #f0f0f0",
              fontWeight:"900", fontSize:"18px", flexShrink:0
            }}>📈 요일별 일차함수 그래프</div>

            <div style={{ flex:1, padding:"16px 20px", overflowY:"auto" }}>

              {/* 설정값 안내 */}
              <div style={{
                background:"#f8f9ff", borderRadius:"12px",
                padding:"12px 16px", marginBottom:"14px",
                fontSize:"17px", lineHeight:"1.8"
              }}>
                <div style={{ fontWeight:"700", color:"#555", marginBottom:"6px" }}>📌 그래프 설정값</div>
                <div>
                  <span style={{ fontWeight:"700", color:"#1565C0" }}>y절편</span>
                  {" = 전체 배식 인원수 = "}
                  <strong>{globalTotal||"?"}</strong>명
                </div>
                <div style={{ marginTop:"4px" }}>
                  <span style={{ fontWeight:"700", color:"#e65100" }}>기울기</span>
                  {" = -(1분당 배식 인원)"}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"8px" }}>
                  {DAYS.map(d => {
                    const rate = parseFloat(weekData[d.id].rate);
                    return (
                      <span key={d.id} style={{
                        padding:"3px 10px", background:d.color,
                        borderRadius:"6px", fontSize:"16px",
                        fontWeight:"700", color:d.lc
                      }}>
                        {d.day[0]}: {rate>0?`-${rate}`:"?"}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* SVG 그래프 */}
              <svg viewBox={`0 0 ${TVW} ${TVH}`}
                style={{
                  width:"100%", border:"1px solid #f0f0f0",
                  borderRadius:"12px", background:"#fafafa", marginBottom:"12px"
                }}>
                {[0,5,10,15,20,25,30,35,40].map(x=>(
                  <g key={`gx${x}`}>
                    <line x1={gx(x)} y1={GPT} x2={gx(x)} y2={GPT+GH}
                      stroke={x===0?"#aaa":"#ebebeb"} strokeWidth={x===0?1.5:1}/>
                    <text x={gx(x)} y={GPT+GH+16} textAnchor="middle"
                      fontSize={11} fill="#888">{x}</text>
                  </g>
                ))}
                {yTicks.map(y=>(
                  <g key={`gy${y}`}>
                    <line x1={GPL} y1={gy(y)} x2={GPL+GW} y2={gy(y)}
                      stroke={y===0?"#aaa":"#ebebeb"} strokeWidth={y===0?1.5:1}/>
                    <text x={GPL-5} y={gy(y)+4} textAnchor="end"
                      fontSize={11} fill="#888">{y}</text>
                  </g>
                ))}
                <line x1={GPL} y1={GPT} x2={GPL} y2={GPT+GH} stroke="#333" strokeWidth={2}/>
                <line x1={GPL} y1={GPT+GH} x2={GPL+GW} y2={GPT+GH} stroke="#333" strokeWidth={2}/>
                <text x={GPL+GW/2} y={TVH-6} textAnchor="middle" fontSize={13} fill="#555">시간 (분) →</text>
                <text x={16} y={GPT+GH/2} textAnchor="middle" fontSize={13} fill="#555"
                  transform={`rotate(-90,16,${GPT+GH/2})`}>남은 학생 수 →</text>

                {graphDrawn && total>0 && DAYS.map(d => {
                  const rate = parseFloat(weekData[d.id].rate);
                  if (!rate||rate<=0) return null;
                  const xInt = total/rate;
                  const xEnd = Math.min(xInt,XMAX);
                  const yEnd = Math.max(0,-rate*xEnd+total);
                  return (
                    <g key={d.id}>
                      <line x1={gx(0)} y1={gy(Math.min(total,YMAX))}
                        x2={gx(xEnd)} y2={gy(yEnd)}
                        stroke={d.lc} strokeWidth={2.5}/>
                      <circle cx={gx(0)} cy={gy(Math.min(total,YMAX))} r={5}
                        fill={d.lc} stroke="white" strokeWidth={1.5}/>
                      {xInt<=XMAX && (
                        <circle cx={gx(xInt)} cy={gy(0)} r={5}
                          fill={d.lc} stroke="white" strokeWidth={1.5}/>
                      )}
                    </g>
                  );
                })}
                {!graphDrawn && (
                  <text x={GPL+GW/2} y={GPT+GH/2} textAnchor="middle" fontSize={13} fill="#ccc">
                    데이터 입력 후 그래프 그리기 버튼을 눌러봐!
                  </text>
                )}
              </svg>

              {/* 범례 */}
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"12px" }}>
                {DAYS.map(d => {
                  const rate = parseFloat(weekData[d.id].rate);
                  return (
                    <div key={d.id} style={{
                      display:"flex", alignItems:"center", gap:"5px",
                      padding:"4px 10px", background:d.color,
                      borderRadius:"8px", fontSize:"16px", fontWeight:"700"
                    }}>
                      <div style={{ width:"14px", height:"3px", background:d.lc, borderRadius:"2px" }}/>
                      <span style={{ color:d.lc }}>
                        {d.day[0]}
                        {rate>0 && (
                          <span style={{ fontWeight:"400", fontSize:"15px", marginLeft:"4px" }}>
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
                width:"100%", padding:"14px",
                background:"linear-gradient(135deg,#FF8F00,#E65100)",
                color:"white", border:"none", borderRadius:"12px",
                fontSize:"18px", fontWeight:"700", cursor:"pointer",
                marginBottom:"14px"
              }}>📈 요일별 그래프 그리기</button>

              {/* x절편 입력 & 정오답 확인 */}
              {graphDrawn && activeDays.length>0 && (
                <div style={{
                  background:"#f8f9ff", borderRadius:"12px",
                  padding:"14px 16px", border:"1px solid #dde3ff"
                }}>
                  <div style={{ fontWeight:"800", fontSize:"18px",
                    color:"#3949AB", marginBottom:"12px" }}>
                    🔍 x절편을 구해봐! (배식 완료까지 몇 분?)
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    {activeDays.map(d => {
                      const status   = xIntChecked[d.id];
                      const inputVal = xIntAnswers[d.id]||"";
                      return (
                        <div key={d.id} style={{
                          display:"grid",
                          gridTemplateColumns:"80px 1fr auto auto",
                          gap:"8px", alignItems:"center"
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                            <div style={{ width:"10px", height:"10px", borderRadius:"50%",
                              background:d.lc, flexShrink:0 }}/>
                            <span style={{ fontSize:"17px", fontWeight:"700", color:d.lc }}>
                              {d.day[0]}요일
                            </span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                            <input type="number" value={inputVal}
                              onChange={e=>{
                                setXIntAnswers(p=>({...p,[d.id]:e.target.value}));
                                setXIntChecked(p=>({...p,[d.id]:undefined}));
                              }}
                              placeholder="분 입력"
                              style={{
                                ...inp,
                                border: status==="correct"?"2px solid #43a047"
                                      : status==="wrong"?"2px solid #e53935"
                                      :"1px solid #e2e8f0",
                                background: status==="correct"?"#f1f8e9"
                                          : status==="wrong"?"#ffebee":"white",
                                width:"100px", textAlign:"center",
                              }}/>
                            <span style={{ fontSize:"17px", color:"#888" }}>분</span>
                          </div>
                          <button onClick={()=>checkXInt(d.id)} style={{
                            padding:"7px 14px", borderRadius:"8px",
                            border:"none", cursor:"pointer",
                            background:d.lc, color:"white",
                            fontSize:"17px", fontWeight:"700", whiteSpace:"nowrap"
                          }}>확인</button>
                          <div style={{ fontSize:"20px", width:"26px", textAlign:"center" }}>
                            {status==="correct"&&"✅"}
                            {status==="wrong"&&"❌"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {activeDays.length>0 && activeDays.every(d=>xIntChecked[d.id]==="correct") && (
                    <div style={{
                      marginTop:"12px",
                      background:"linear-gradient(135deg,#e8f5e9,#c8e6c9)",
                      borderRadius:"10px", padding:"12px 16px",
                      textAlign:"center", fontSize:"18px",
                      fontWeight:"800", color:"#2e7d32"
                    }}>
                      🎉 모든 요일의 x절편을 완벽하게 구했어!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ display:"flex", justifyContent:"center", gap:"14px", marginBottom:"16px" }}>

          <button onClick={()=>
            PADLET_URL
              ? window.open(PADLET_URL,"_blank")
              : alert("패들렛 링크가 아직 설정되지 않았어요!")}
            style={{
              padding:"16px", width:"680px",
              background:"linear-gradient(135deg,#FF8F00,#E65100)",
              color:"white", border:"none", borderRadius:"14px",
              fontSize:"18px", fontWeight:"700", cursor:"pointer",
              boxShadow:"0 4px 16px rgba(230,81,0,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"
            }}>🚀 패들렛 공유하기</button>
          <button onClick={()=>navigate("/lunch-special")} style={{
            padding:"16px", width:"680px",
            background:"linear-gradient(135deg,#6A1B9A,#4A148C)",
            color:"white", border:"none", borderRadius:"14px",
            fontSize:"18px", fontWeight:"700", cursor:"pointer",
            boxShadow:"0 4px 16px rgba(106,27,154,0.35)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"
          }}> 🌟 나만의 문제 만들기 </button>
        </div>
      </div>

      <CocoChat
        systemPrompt={PROMPTS.lunch}
        initialMessage="안녕! 나는 코코야 🌀&#10;일차함수에 관해서 어려운 부분이 있다면 물어봐!"
      />
    </div>
  );
}
