import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CHAPTERS } from "../data/chapters";
import { saveUserProgress, loadUserProgress, resetUserProgress } from "../firebase";

// ── 인트로 대화 (chapters.js와 완전히 무관하게 직접 정의) ──
const INTRO_DIALOGS = [
  { speaker:"coco",    text:"안녕! 나는 코코야 🌀" },
  { speaker:"coco",    text:"어? 저기 영양 선생님이 고민에 빠져 있어..." },
  { speaker:"teacher", text:"배식이 끝나는 시간이 메뉴나 요일마다 달라서 너무 힘들어요.. 😥" },
  { speaker:"teacher", text:"미리 배식 완료 시간을 알 수 있다면 시작 시간을 조정할 수 있을 텐데..." },
  { speaker:"coco",    text:"우리가 도와줄 수 있을 것 같아! 급식실을 둘러보면서 정보를 모아보자!" },
];

// 그래프 상수
const GW=260, GH=195, GPL=52, GPB=36, GPR=16, GPT=16;
const TVW=GPL+GW+GPR, TVH=GPT+GH+GPB;
const XMAX=60, YMAX=600;
const gx = x => GPL+(x/XMAX)*GW;
const gy = y => GPT+(1-y/YMAX)*GH;
const GRIDX=[0,10,20,30,40,50,60];
const GRIDY=[0,100,200,300,400,500,600];

export default function LunchScene({ user }) {
  const navigate = useNavigate();
  const chapter  = CHAPTERS["cafeteria"];

  const [phase, setPhase]                     = useState("cocoIntro");
  const [introIdx, setIntroIdx]               = useState(0);
  const [dialogIdx, setDialogIdx]             = useState(0);
  const [collectedInfo, setCollectedInfo]     = useState([]);
  const [clickedObjects, setClickedObjects]   = useState([]);
  const [activePopup, setActivePopup]         = useState(null);
  const [showEnding, setShowEnding]           = useState(false);
  const [graphStep, setGraphStep]             = useState(1);
  const [axisChoice, setAxisChoice]           = useState(null);
  const [slopeInput, setSlopeInput]           = useState("");
  const [interceptInput, setInterceptInput]   = useState("");
  const [graphDrawn, setGraphDrawn]           = useState(false);
  const [completionInput, setCompletionInput] = useState("");

  useEffect(() => {
    loadUserProgress(user.uid, "cafeteria").then(p => {
      if (p?.completed) setShowEnding(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!chapter) return null;

  // 현재 인트로 대화
  const curIntro  = INTRO_DIALOGS[introIdx];
  const isTeacher = curIntro?.speaker === "teacher";

  // 그 외 단계 대화
  const otherDialogs = {
    cocoAllFound: chapter.cocoAllFound,
    cocoCorrect:  chapter.cocoCorrect,
    cocoWrong:    chapter.cocoWrong,
  };
  const curOtherDialog = otherDialogs[phase]?.[dialogIdx] || "";
  const totalOtherDialogs = otherDialogs[phase]?.length || 1;

  // 인트로 다음 버튼
  const handleIntroNext = () => {
    if (introIdx < INTRO_DIALOGS.length - 1) {
      setIntroIdx(introIdx + 1);
    } else {
      setPhase("explore");
    }
  };

  // 그 외 단계 다음 버튼
  const handleDialogNext = () => {
    if (dialogIdx < totalOtherDialogs - 1) {
      setDialogIdx(dialogIdx + 1);
    } else {
      if (phase === "cocoAllFound") { setPhase("graphModal"); setGraphStep(1); }
      if (phase === "cocoCorrect")  { setShowEnding(true); }
      if (phase === "cocoWrong")    {
        setPhase("graphModal"); setGraphStep(2);
        setGraphDrawn(false); setCompletionInput(""); setDialogIdx(0);
      }
    }
  };

  const handleReset = async () => {
    if (!window.confirm("처음부터 다시 할까요?")) return;
    await resetUserProgress(user.uid, "cafeteria");
    setPhase("cocoIntro"); setIntroIdx(0); setDialogIdx(0);
    setCollectedInfo([]); setClickedObjects([]);
    setActivePopup(null); setShowEnding(false);
    setGraphStep(1); setAxisChoice(null);
    setSlopeInput(""); setInterceptInput("");
    setGraphDrawn(false); setCompletionInput("");
  };

  const handleObjectClick = obj => {
    if (clickedObjects.includes(obj.id)) return;
    setActivePopup(obj);
  };

  const handlePopupClose = () => {
    if (!activePopup) return;
    const newClicked = [...clickedObjects, activePopup.id];
    setClickedObjects(newClicked);
    setCollectedInfo(prev => [...prev, {
      name: activePopup.name, emoji: activePopup.emoji,
      text: activePopup.dialog[activePopup.dialog.length - 1],
    }]);
    setActivePopup(null);
    if (newClicked.length === chapter.objects.length) {
      setTimeout(() => { setPhase("cocoAllFound"); setDialogIdx(0); }, 500);
    }
  };

  const handleAxisSubmit = () => {
    if (!axisChoice) { alert("축을 선택해주세요!"); return; }
    if (axisChoice === "correct") {
      setGraphStep(2);
    } else {
      alert("다시 생각해봐! 시간이 지나면서 남은 학생 수가 어떻게 변할까?");
      setAxisChoice(null);
    }
  };

  const handleDrawGraph = () => {
    const s = parseFloat(slopeInput), b = parseFloat(interceptInput);
    if (isNaN(s) || isNaN(b)) { alert("기울기와 y절편을 숫자로 입력해주세요!"); return; }
    setGraphDrawn(true);
    setTimeout(() => setGraphStep(3), 400);
  };

const handleCompletionSubmit = () => {
  const s = parseFloat(slopeInput);
  const b = parseFloat(interceptInput);
  const ans = parseFloat(completionInput);

  // 정확한 식: y = -20x + 500 이어야 통과
  const correctSlope     = Math.abs(s - (-20)) <= 1;
  const correctIntercept = Math.abs(b - 500)   <= 10;
  const correctTime      = !isNaN(ans) && Math.abs(ans - 25) <= 1;

  if (correctSlope && correctIntercept && correctTime) {
    setPhase("cocoCorrect"); setDialogIdx(0);
    saveUserProgress(user.uid, "cafeteria", {
      completed: true, completionTime: ans,
      equation: `y = ${s}x + ${b}`,
      nextMissionCode: chapter.nextMissionCode || "COCO-004",
    });
  } else {
    // 틀린 이유별 안내
    if (!correctSlope || !correctIntercept) {
      alert("식이 맞지 않아! 단서에서 기울기(-20)와 y절편(500)을 다시 확인해봐.");
    } else {
      alert("배식 완료 시간을 다시 그래프에서 읽어봐!");
    }
    setPhase("cocoWrong"); setDialogIdx(0);
  }
};

  const slope = parseFloat(slopeInput) || 0;
  const yInt  = parseFloat(interceptInput) || 0;
  const xInt  = slope !== 0 ? -yInt / slope : null;

  return (
    <div className="game-screen">
      <div className="scene-cafeteria">

        {/* HUD */}
        <div className="hud">
          <div className="hud-badge hud-back" onClick={() => navigate("/map")}>← 지도로</div>
          <div className="hud-badge">🍱 급식실 · 일차함수</div>
          <div className="hud-badge">{clickedObjects.length}/{chapter.objects.length} 탐색</div>
        </div>

        {/* 정보 패널 */}
        <div className="info-panel" style={{ zIndex:45 }}>
          <div className="info-panel-title">🔍 수집한 정보</div>
          {collectedInfo.length === 0
            ? <div className="info-empty">주변을 클릭해서<br/>정보를 모아봐!</div>
            : collectedInfo.map((info,i) => (
              <div key={i} className="info-tag">
                {info.emoji} <strong>{info.name}</strong><br/>
                <span style={{opacity:0.85}}>{info.text}</span>
              </div>
            ))
          }
        </div>

        {/* 오브젝트 */}
        {phase === "explore" && chapter.objects.map(obj => (
          <div key={obj.id}
            className={`scene-object ${clickedObjects.includes(obj.id)?"collected":""}`}
            style={{ left:`${obj.position.x}%`, top:`${obj.position.y}%` }}
            onClick={() => handleObjectClick(obj)}>
            <div className={`object-bubble ${clickedObjects.includes(obj.id)?"collected":""}`}>
              {obj.emoji}
            </div>
            <div className="object-name">{obj.name}</div>
          </div>
        ))}

        {/* ── 인트로: 영양 선생님 말풍선 ── */}
        {phase === "cocoIntro" && isTeacher && (
          <div key={`t-${introIdx}`} style={{
            position:"absolute", bottom:"30%", right:"8%",
            display:"flex", flexDirection:"row-reverse",
            alignItems:"flex-end", gap:"12px",
            zIndex:30, maxWidth:"55%",
            animation:"fadeSlide 0.3s ease-out"
          }}>
            <div style={{
              width:"62px", height:"62px", borderRadius:"50%",
              background:"linear-gradient(135deg,#FF8F00,#E65100)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"32px", flexShrink:0,
              boxShadow:"0 4px 16px rgba(255,143,0,0.45)"
            }}>👩‍🍳</div>
            <div style={{
              background:"white", border:"2px solid #FFB300",
              borderRadius:"16px 4px 16px 16px",
              padding:"14px 18px", maxWidth:"260px",
              fontSize:"15px", lineHeight:"1.75",
              boxShadow:"0 4px 20px rgba(0,0,0,0.12)"
            }}>
              <div style={{fontSize:"12px",fontWeight:"700",color:"#FF8F00",marginBottom:"5px"}}>
                👩‍🍳 영양 선생님
              </div>
              {curIntro?.text}
              <button className="coco-next-btn" onClick={handleIntroNext}
                style={{background:"#FF8F00", marginTop:"8px"}}>
                {introIdx < INTRO_DIALOGS.length-1 ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
          </div>
        )}

        {/* ── 인트로: 코코 말풍선 ── */}
        {phase === "cocoIntro" && !isTeacher && (
          <div key={`c-${introIdx}`} className="coco-container">
            <div className="coco-dialog">
              {curIntro?.text}
              <button className="coco-next-btn" onClick={handleIntroNext}>
                {introIdx < INTRO_DIALOGS.length-1 ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
            <div className="coco-character">🌀</div>
          </div>
        )}

        {/* ── 탐색 이후 코코 말풍선 ── */}
        {["cocoAllFound","cocoCorrect","cocoWrong"].includes(phase) && (
          <div key={`other-${dialogIdx}`} className="coco-container">
            <div className="coco-dialog">
              {curOtherDialog}
              <button className="coco-next-btn" onClick={handleDialogNext}>
                {dialogIdx < totalOtherDialogs-1 ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
            <div className="coco-character">🌀</div>
          </div>
        )}

        {/* 오브젝트 팝업 */}
        {activePopup && (
          <>
            <div className="overlay" onClick={handlePopupClose}/>
            <div className="object-popup">
              <div className="popup-emoji">{activePopup.emoji}</div>
              <div className="popup-title">{activePopup.name}</div>
              <div className="popup-dialog">
                {activePopup.dialog.map((l,i) => <div key={i}>{l}</div>)}
              </div>
              <button className="popup-close" onClick={handlePopupClose}>확인</button>
            </div>
          </>
        )}

        {/* 그래프 모달 */}
        {phase === "graphModal" && (
          <>
            <div className="overlay"/>
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              background:"white", borderRadius:"20px",
              padding:"22px", maxWidth:"430px", width:"94%",
              zIndex:50, maxHeight:"90vh", overflowY:"auto",
              boxShadow:"0 20px 60px rgba(0,0,0,0.4)",
              animation:"popIn 0.3s ease-out"
            }}>

              {graphStep === 1 && (
                <>
                  <div style={{fontSize:"18px",fontWeight:"900",textAlign:"center",marginBottom:"6px"}}>
                    📊 그래프 축 설정하기
                  </div>
                  <div style={{fontSize:"14px",color:"#718096",textAlign:"center",marginBottom:"16px",lineHeight:"1.6"}}>
                    배식 완료 시간을 예측하는 그래프를 그리려면<br/>
                    x축과 y축에 각각 무엇이 들어가야 할까?
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
                    {[
                      {id:"correct", label:"x축: 시간(분)  /  y축: 남은 학생 수"},
                      {id:"w1",      label:"x축: 학생 수  /  y축: 시간(분)"},
                      {id:"w2",      label:"x축: 메뉴 종류  /  y축: 남은 학생 수"},
                      {id:"w3",      label:"x축: 시간(분)  /  y축: 배식 속도"},
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setAxisChoice(opt.id)} style={{
                        padding:"13px 16px", borderRadius:"12px", cursor:"pointer",
                        border: axisChoice===opt.id ? "2px solid #5b9fe8" : "1px solid #e2e8f0",
                        background: axisChoice===opt.id ? "#e3f2fd" : "white",
                        fontSize:"15px", fontWeight: axisChoice===opt.id?"700":"400",
                        color: axisChoice===opt.id ? "#1565C0" : "#2D3748",
                        textAlign:"left", transition:"all 0.15s"
                      }}>{opt.label}</button>
                    ))}
                  </div>
                  <button onClick={handleAxisSubmit} style={{
                    width:"100%", padding:"13px",
                    background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
                    color:"white", border:"none", borderRadius:"12px",
                    fontSize:"15px", fontWeight:"700", cursor:"pointer",
                    opacity: axisChoice ? 1 : 0.5
                  }}>확인 →</button>
                </>
              )}

              {graphStep >= 2 && (
                <>
                  <div style={{fontSize:"17px",fontWeight:"900",textAlign:"center",marginBottom:"12px"}}>
                    📈 일차함수 그래프 그리기
                  </div>
                  <svg width="100%" viewBox={`0 0 ${TVW} ${TVH}`}
                    style={{marginBottom:"12px",border:"1px solid #f0f0f0",
                      borderRadius:"8px",background:"#fafafa"}}>
                    {GRIDX.map(x => (
                      <g key={`gx${x}`}>
                        <line x1={gx(x)} y1={GPT} x2={gx(x)} y2={GPT+GH}
                          stroke={x===0?"#aaa":"#e8e8e8"} strokeWidth={x===0?1.5:1}/>
                        <text x={gx(x)} y={GPT+GH+14} textAnchor="middle" fontSize={10} fill="#888">{x}</text>
                      </g>
                    ))}
                    {GRIDY.map(y => (
                      <g key={`gy${y}`}>
                        <line x1={GPL} y1={gy(y)} x2={GPL+GW} y2={gy(y)}
                          stroke={y===0?"#aaa":"#e8e8e8"} strokeWidth={y===0?1.5:1}/>
                        <text x={GPL-4} y={gy(y)+4} textAnchor="end" fontSize={10} fill="#888">{y}</text>
                      </g>
                    ))}
                    <line x1={GPL} y1={GPT} x2={GPL} y2={GPT+GH} stroke="#333" strokeWidth={2}/>
                    <line x1={GPL} y1={GPT+GH} x2={GPL+GW} y2={GPT+GH} stroke="#333" strokeWidth={2}/>
                    <text x={GPL+GW/2} y={TVH-4} textAnchor="middle" fontSize={11} fill="#555">시간 (분) → x</text>
                    <text x={12} y={GPT+GH/2} textAnchor="middle" fontSize={11} fill="#555"
                      transform={`rotate(-90,12,${GPT+GH/2})`}>남은 학생 수 →</text>
                    {graphDrawn && slope!==0 && (() => {
                      let x0=0, y0=yInt;
                      let x1e = xInt&&xInt>0&&xInt<=XMAX ? xInt : XMAX;
                      let y1e = slope*x1e+yInt;
                      if (y0>YMAX) { x0=(YMAX-yInt)/slope; y0=YMAX; }
                      if (y1e<0)   { x1e=-yInt/slope; y1e=0; }
                      return <line x1={gx(x0)} y1={gy(y0)} x2={gx(x1e)} y2={gy(y1e)}
                        stroke="#e53935" strokeWidth={2.5}/>;
                    })()}
                    {graphDrawn && xInt&&xInt>0&&xInt<=XMAX && (
                      <g>
                        <circle cx={gx(xInt)} cy={gy(0)} r={5} fill="#e53935" stroke="white" strokeWidth={1.5}/>
                        <rect x={gx(xInt)-18} y={gy(0)-24} width={36} height={18} rx={3} fill="rgba(229,57,53,0.9)"/>
                        <text x={gx(xInt)} y={gy(0)-12} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                          {Math.round(xInt)}분
                        </text>
                      </g>
                    )}
                    {graphDrawn && yInt>0&&yInt<=YMAX && (
                      <circle cx={gx(0)} cy={gy(yInt)} r={4} fill="#1565C0" stroke="white" strokeWidth={1.5}/>
                    )}
                    {graphDrawn && (
                      <g>
                        <rect x={GPL+8} y={GPT+8} width={148} height={20} rx={3} fill="rgba(255,255,255,0.92)"/>
                        <text x={GPL+14} y={GPT+21} fontSize={12} fill="#e53935" fontWeight="bold">
                          y = {slope}x {yInt>=0?"+":" "}{yInt}
                        </text>
                      </g>
                    )}
                  </svg>

                  <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"10px"}}>
                    <span style={{fontSize:"16px",fontWeight:"700",whiteSpace:"nowrap"}}>y =</span>
                    <input value={slopeInput} onChange={e=>setSlopeInput(e.target.value)}
                      placeholder="기울기"
                      style={{flex:1,padding:"9px",borderRadius:"8px",border:"1px solid #e2e8f0",
                        fontSize:"15px",fontFamily:"Courier New",textAlign:"center",outline:"none"}}/>
                    <span style={{fontSize:"16px",fontWeight:"700",whiteSpace:"nowrap"}}>x +</span>
                    <input value={interceptInput} onChange={e=>setInterceptInput(e.target.value)}
                      placeholder="y절편"
                      style={{flex:1,padding:"9px",borderRadius:"8px",border:"1px solid #e2e8f0",
                        fontSize:"15px",fontFamily:"Courier New",textAlign:"center",outline:"none"}}/>
                  </div>
                  <div style={{fontSize:"12px",color:"#aaa",marginBottom:"8px"}}>
                    💡 힌트: y절편 = 전체 학생 수, 기울기 = 분당 배식 수 (음수)
                  </div>
                  <button onClick={handleDrawGraph} style={{
                    width:"100%",padding:"11px",marginBottom:"10px",
                    background:"linear-gradient(135deg,#e53935,#c62828)",
                    color:"white",border:"none",borderRadius:"10px",
                    fontSize:"14px",fontWeight:"700",cursor:"pointer"
                  }}>📈 그래프 그리기</button>

                  {graphStep===3 && graphDrawn && (
                    <div style={{background:"#fff8e1",borderRadius:"12px",padding:"14px"}}>
                      <div style={{fontSize:"14px",fontWeight:"700",color:"#E65100",marginBottom:"10px"}}>
                        🤔 그래프에서 읽어봐!<br/>배식이 완료되는 데 걸리는 시간은 몇 분?
                      </div>
                      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                        <input type="number" value={completionInput}
                          onChange={e=>setCompletionInput(e.target.value)} placeholder="?"
                          style={{flex:1,padding:"11px",borderRadius:"8px",border:"2px solid #FFB300",
                            fontSize:"24px",fontWeight:"900",textAlign:"center",outline:"none"}}/>
                        <span style={{fontSize:"16px",fontWeight:"700",color:"#555"}}>분</span>
                      </div>
                      <button onClick={handleCompletionSubmit} style={{
                        width:"100%",padding:"12px",marginTop:"10px",
                        background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
                        color:"white",border:"none",borderRadius:"10px",
                        fontSize:"15px",fontWeight:"700",cursor:"pointer"
                      }}>정답 제출 ✓</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* 엔딩 모달 */}
        {showEnding && (
          <>
            <div className="overlay"/>
            <div className="ending-modal">
              <div style={{fontSize:"48px",marginBottom:"8px"}}>🍱</div>
              <div style={{fontSize:"21px",fontWeight:"900",marginBottom:"8px"}}>미션 완료!</div>
              <div style={{fontSize:"15px",color:"#718096",marginBottom:"20px",lineHeight:"1.7"}}>
                일차함수로 배식 완료 시간을 예측했어!<br/>이제 우리 학교 실제 데이터를 측정해보자 📊
              </div>
              <div style={{background:"linear-gradient(135deg,#FF8F00,#E65100)",
                borderRadius:"16px",padding:"16px 20px",marginBottom:"20px"}}>
                <div style={{fontSize:"28px",marginBottom:"8px"}}>🌀</div>
                <div style={{color:"white",fontSize:"15px",lineHeight:"1.7",fontWeight:"600"}}>
                  요일마다 메뉴가 달라지면 배식 완료 시간도 달라져!<br/>
                  직접 측정하고 그래프로 그려봐 📅
                </div>
              </div>
              <button onClick={()=>navigate("/lunch-data")} style={{
                width:"100%",padding:"13px",
                background:"linear-gradient(135deg,#FF8F00,#E65100)",
                color:"white",border:"none",borderRadius:"12px",
                fontSize:"16px",fontWeight:"700",cursor:"pointer",marginBottom:"8px"
              }}>📊 실제 데이터 측정하러 가기 →</button>
              <button onClick={()=>navigate("/map")} style={{
                width:"100%",padding:"11px",background:"white",border:"1px solid #ddd",
                borderRadius:"12px",fontSize:"14px",fontWeight:"700",
                cursor:"pointer",color:"#718096",marginBottom:"8px"
              }}>🗺 지도로 돌아가기</button>
              <button onClick={handleReset} style={{
                width:"100%",padding:"9px",background:"white",border:"2px solid #eee",
                borderRadius:"12px",fontSize:"13px",fontWeight:"700",cursor:"pointer",color:"#bbb"
              }}>🔄 처음부터 다시하기</button>
            </div>
          </>
        )}

        <style>{`
          @keyframes fadeSlide {
            from { opacity:0; transform:translateY(10px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

/*function CafeteriaBackground() {
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"18%",
        background:"linear-gradient(180deg,#FFF9E6,#FFF3CC)"}}/>
      <div style={{position:"absolute",top:"18%",left:0,right:0,bottom:"28%",background:"#FFF8E1"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"28%",
        background:"linear-gradient(180deg,#F5E6C8,#EDD9A8)"}}/>
      <div style={{position:"absolute",top:"16%",left:"10%",right:"10%",height:"30%",
        background:"linear-gradient(180deg,#D4A574,#C8956B)",
        borderRadius:"8px 8px 0 0",border:"3px solid #B8845C"}}>
        <div style={{display:"flex",gap:"10px",padding:"14px 20px"}}>
          {["🍚","🥩","🥦","🥣","🥛","🍊"].map((e,i)=>(
            <div key={i} style={{width:"40px",height:"40px",
              background:"rgba(255,255,255,0.35)",borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>{e}</div>
          ))}
        </div>
      </div>
      <div style={{position:"absolute",right:"8%",top:"8%",fontSize:"52px"}}>👩‍🍳</div>
      <div style={{position:"absolute",bottom:"6%",left:"50%",transform:"translateX(-50%)",
        width:"85%",display:"flex",gap:"14px",justifyContent:"center"}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:"88px",height:"36px",
            background:"#C8956B",borderRadius:"4px",border:"2px solid #A87050"}}/>
        ))}
      </div>
    </div>
  );
}*/