import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveUserProgress, loadUserProgress, resetUserProgress } from "../firebase";
import cocoImg from "../styles/images/coco.png";

const INTRO_DIALOGS = [
  { speaker:"teacher", text:"이번 주 수요일에 체육한마당을 열 계획인데... " },
  { speaker:"teacher", text:"월요일에 비가 내렸거든.\n수요일에도 비가 올지 너무 걱정이야! " },
  { speaker:"coco",    text:"안녕! 나는 코코야 \n과거 날씨 기록을 이용해서 확률로 예측할 수 있어!\n" },
  { speaker:"coco",    text:"교실 주변을 둘러보면서 필요한 정보를 모아봐!\n단서들이 숨어 있어\n " },
];

const FOUND_DIALOGS = [
  "정보를 다 모았어! 👏",
  "수집한 단서들을 보면서 확률을 직접 계산해봐!",
  "단계별로 풀어서 수요일에 비가 올 확률을 구해줘",
];
const CORRECT_DIALOGS = [
  "정답이야! 🎉",
  "월요일에 비가 왔을 때 수요일 비 올 확률은 55%야!\n수학으로 날씨를 예측할 수 있어 😊",
];
const WRONG_DIALOGS = [
  "아직 아니야! 🤔",
  "단서에서 구한 확률로 단계별 계산을 다시 해봐.",
];

// ── 단서 데이터: 비10/맑20 → 비→비 7/10 → 맑→비 4/20 ──
const OBJECTS = [
  {
    id:"data_note", emoji:"📊", name:"기상 관측 노트",
    position:{ x:42, y:52 }, isClue:true,
    dialog:[
      "기상 관측 노트를 발견했어!",
      "한 달 동안 날씨를 관측했더니...",
      "비가 온 날은 10일,\n맑은 날은 20일이었어!",
    ],
  },
  {
    id:"record_book", emoji:"📒", name:"날씨 전이 기록부",
    position:{ x:55, y:70 }, isClue:true,
    dialog:[
      "날씨 전이 기록부를 찾았어!",
      "비가 온 10일 중에...",
      "다음 날도 비가 온 날은 7일이었어!",
    ],
  },
  {
    id:"teacher_memo", emoji:"📝", name:"체육 선생님 메모",
    position:{ x:17, y:68 }, isClue:true,
    dialog:[
      "체육 선생님 수첩이야!",
      "이번 주 월요일 날씨: ☔ 비",
      "수요일 체육대회 예정 → 날씨 예측 필요!",
    ],
  },
  {
    id:"calendar", emoji:"📅", name:"이번 주 달력",
    position:{ x:90, y:18 }, isClue:true,
    dialog:[
      "이번 주 달력이야!",
      "맑은 20일 중에...",
      "다음 날 비가 온 날은 4일이었어!",
    ],
  },
  {
    id:"banner", emoji:"🏃", name:"체육한마당 개요",
    position:{ x:60, y:18 }, isClue:false,
    dialog:[
      "제12회 봄 체육한마당 기획 내용이야!",
      "올해 참가 예상 인원은 작년 350명보다 늘어날 예정이래.",
      "이 정보는 확률 계산과는 관계없을 것 같아!",
    ],
  },
  {
    id:"storage", emoji:"📋", name:"체육 창고 목록",
    position:{ x:72, y:62 }, isClue:false,
    dialog:[
      "체육 창고 재고 목록이야!",
      "줄넘기 30개, 농구공 15개, 배드민턴 채 48개...",
      "실내 수업 준비 완료! 날씨 계산과는 관련 없네.",
    ],
  },
];

export default function RainScene({ user }) {
  const navigate = useNavigate();

  const [phase, setPhase]                   = useState("intro");
  const [introIdx, setIntroIdx]             = useState(0);
  const [dialogIdx, setDialogIdx]           = useState(0);
  const [collectedInfo, setCollectedInfo]   = useState([]);
  const [clickedObjects, setClickedObjects] = useState([]);
  const [activePopup, setActivePopup]       = useState(null);
  const [showEnding, setShowEnding]         = useState(false);

  const [pRR,  setPRR]  = useState("");
  const [pNR,  setPNR]  = useState("");
  const [pTue, setPTue] = useState("");
  const [pWed, setPWed] = useState("");
  const [ansError, setAnsError] = useState("");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    loadUserProgress(user?.uid, "rain").then(p => {
      if (p?.completed) setShowEnding(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curIntro  = INTRO_DIALOGS[introIdx];
  const isTeacher = curIntro?.speaker === "teacher";

  const otherMap = {
    cocoAllFound: FOUND_DIALOGS,
    cocoCorrect:  CORRECT_DIALOGS,
    cocoWrong:    WRONG_DIALOGS,
  };
  const curOtherDialogs = otherMap[phase] || [];
  const showOtherCoco   = ["cocoAllFound","cocoCorrect","cocoWrong"].includes(phase);

  const handleIntroNext = () => {
    if (introIdx < INTRO_DIALOGS.length - 1) setIntroIdx(i => i + 1);
    else setPhase("explore");
  };

  const handleOtherNext = () => {
    if (dialogIdx < curOtherDialogs.length - 1) {
      setDialogIdx(d => d + 1);
    } else {
      if (phase === "cocoAllFound") { setPhase("answer"); setDialogIdx(0); }
      if (phase === "cocoCorrect")  { setShowEnding(true); }
      if (phase === "cocoWrong")    {
        setPhase("answer"); setDialogIdx(0);
        setAnsError(""); setShowHint(false);
      }
    }
  };

  const handleObjectClick = (obj) => {
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
    if (newClicked.length === OBJECTS.length) {
      setTimeout(() => { setPhase("cocoAllFound"); setDialogIdx(0); }, 500);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("처음부터 다시 할까요?")) return;
    await resetUserProgress(user?.uid, "rain");
    setPhase("intro"); setIntroIdx(0); setDialogIdx(0);
    setCollectedInfo([]); setClickedObjects([]);
    setActivePopup(null); setShowEnding(false);
    setPRR(""); setPNR(""); setPTue(""); setPWed("");
    setAnsError(""); setShowHint(false);
  };

  const checkNum = (val, expected, tol=0.03) =>
    Math.abs(parseFloat(val) - expected) <= tol;

  const handleAnswerSubmit = () => {
    const rr = parseFloat(pRR), nr = parseFloat(pNR);
    const tue = parseFloat(pTue), wed = parseFloat(pWed);

    if ([rr,nr,tue,wed].some(isNaN)) {
      setAnsError("모든 칸을 채워줘!"); return;
    }
    const correctRR  = checkNum(rr,  0.7,  0.01);
    const correctNR  = checkNum(nr,  0.2,  0.01);
    const correctTue = checkNum(tue, 0.7,  0.01);
    const correctWed = checkNum(wed, 0.55, 0.02);

    if (correctRR && correctNR && correctTue && correctWed) {
      setPhase("cocoCorrect"); setDialogIdx(0);
      saveUserProgress(user?.uid, "rain", {
        completed: true, answer: wed, nextPage: "rain-data",
      });
    } else {
      setAnsError(
        !correctRR  ? "비→비 확률을 다시 계산해봐! (7 ÷ 10 = ?)" :
        !correctNR  ? "맑→비 확률을 다시 계산해봐! (4 ÷ 20 = ?)" :
        !correctTue ? "화요일: 월요일에 비가 왔으니 P(화 비) = P(비→비) 야!" :
                      "수요일 확률을 다시 계산해봐! 힌트 버튼을 눌러봐 😊"
      );
    }
  };

  // 스피너 숨기기 + 공통 스타일
  const inp = {
    padding:"8px 12px", borderRadius:"10px",
    border:"2px solid #e2e8f0", fontSize:"15px",
    fontWeight:"700", textAlign:"center",
    outline:"none", width:"90px",
    fontFamily:"Courier New",
    MozAppearance:"textfield",
    WebkitAppearance:"none",
    appearance:"textfield",
  };

  return (
    <div className="game-screen">
      <div className="scene-rain">

        <RainBackground />

        {/* HUD */}
        <div className="hud">
          <div className="hud-badge hud-back" onClick={()=>navigate("/map")}>
            ← 지도로
          </div>
          <div className="hud-badge">⛈️ 체육대회 날씨 예측 · 확률</div>
          <div className="hud-badge">
            {clickedObjects.length}/{OBJECTS.length} 탐색
          </div>
        </div>

        {/* 정보 패널 */}
        <div className="info-panel" style={{ zIndex:45 }}>
          <div className="info-panel-title">🔍 수집한 정보</div>
          {collectedInfo.length === 0
            ? <div className="info-empty">주변을 클릭해서<br/>단서를 모아봐!</div>
            : collectedInfo.map((info,i) => (
              <div key={i} className="info-tag">
                {info.emoji} <strong>{info.name}</strong><br/>
                <span style={{ opacity:0.85, whiteSpace:"pre-line" }}>{info.text}</span>
              </div>
            ))
          }
        </div>

        {/* 오브젝트 */}
        {phase === "explore" && OBJECTS.map(obj => (
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

        {/* 인트로: 선생님 말풍선 */}
        {phase === "intro" && isTeacher && (
          <div key={`t-${introIdx}`} style={{
            position:"absolute", bottom:"70%", right:"30%",
            display:"flex", flexDirection:"row-reverse",
            alignItems:"flex-end", gap:"12px",
            zIndex:30, maxWidth:"70%",
            animation:"fadeSlide 0.3s ease-out"
          }}>
            <div style={{
              background:"white", border:"2px solid #90CAF9",
              borderRadius:"16px 4px 16px 16px",
              padding:"14px 18px", maxWidth:"400px",
              fontSize:"16px", lineHeight:"1.75",
              boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
              whiteSpace:"pre-line"
            }}>
              <div style={{ fontSize:"12px", fontWeight:"700",
                color:"#1565C0", marginBottom:"5px" }}>🏃‍♂️ 체육 선생님</div>
              {curIntro?.text}
              <button className="coco-next-btn"
                onClick={handleIntroNext}
                style={{ background:"#1565C0", marginTop:"8px" }}>
                {introIdx < INTRO_DIALOGS.length-1 ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
          </div>
        )}

        {/* 인트로: 코코 말풍선 */}
        {phase === "intro" && !isTeacher && (
          <div key={`c-${introIdx}`}
            style={{
              position:"absolute", bottom:"50%", left:"500px",
              display:"flex", flexDirection:"column",
              alignItems:"flex-start",
              zIndex:30, width:"min(420px,55%)",
              animation:"fadeSlide 0.3s ease-out"
            }}>
            <div className="coco-dialog" style={{ whiteSpace:"pre-line" }}>
              {curIntro?.text}
              <button className="coco-next-btn" onClick={handleIntroNext}>
                {introIdx < INTRO_DIALOGS.length-1 ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
            <img src={cocoImg} alt="COCO"
              style={{ width:"250px", height:"250px", objectFit:"contain",
                filter:"drop-shadow(0 4px 12px rgba(102,126,234,0.5))" }}/>
          </div>
        )}

        {/* 탐색 이후 코코 */}
        {showOtherCoco && (
          <div key={`other-${dialogIdx}`}
            style={{
              position:"absolute", bottom:"50%", left:"500px",
              display:"flex", flexDirection:"column",
              alignItems:"flex-start", gap:"8px",
              zIndex:30, width:"min(420px,55%)"
            }}>
            <div className="coco-dialog" style={{ whiteSpace:"pre-line" }}>
              {curOtherDialogs[dialogIdx]}
              <button className="coco-next-btn" onClick={handleOtherNext}>
                {dialogIdx < curOtherDialogs.length-1 ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
            <img src={cocoImg} alt="COCO"
              style={{ width:"250px", height:"250px", objectFit:"contain",
                filter:"drop-shadow(0 4px 12px rgba(102,126,234,0.5))" }}/>
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
                {activePopup.dialog.map((l,i) => (
                  <div key={i} style={{ whiteSpace:"pre-line" }}>{l}</div>
                ))}
              </div>
              <button className="popup-close" onClick={handlePopupClose}>확인</button>
            </div>
          </>
        )}

        {/* ── 정답 입력 모달 ── */}
        {phase === "answer" && (
          <>
            <div className="overlay"/>
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              background:"white", borderRadius:"20px",
              padding:"22px", maxWidth:"460px", width:"94%",
              zIndex:50, maxHeight:"90vh", overflowY:"auto",
              boxShadow:"0 20px 60px rgba(0,0,0,0.4)",
              animation:"popIn 0.3s ease-out"
            }}>
              <div style={{ fontSize:"17px", fontWeight:"900",
                textAlign:"center", marginBottom:"12px" }}>
                🌧️ 단계별 확률 계산
              </div>

              {/* 수집 단서 요약 */}
              <div style={{
                background:"#e3f2fd", borderRadius:"12px",
                padding:"12px 16px", marginBottom:"14px",
                fontSize:"13px", lineHeight:"2"
              }}>
                <div style={{ fontWeight:"800", color:"#1565C0",
                  marginBottom:"4px" }}>📒 수집한 데이터 요약</div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr",
                  gap:"6px"
                }}>
                  <div style={{ background:"white", borderRadius:"8px",
                    padding:"8px 10px", fontSize:"12px" }}>
                    <div style={{ fontWeight:"700", color:"#555",
                      marginBottom:"3px" }}>📊 한 달 관측</div>
                    <div>비가 온 날: <strong>10</strong>일</div>
                    <div>맑은 날: <strong>20</strong>일</div>
                  </div>
                  <div style={{ background:"white", borderRadius:"8px",
                    padding:"8px 10px", fontSize:"12px" }}>
                    <div style={{ fontWeight:"700", color:"#1565C0",
                      marginBottom:"3px" }}>☔ 비온 날 다음날</div>
                    <div>총 <strong>10</strong>일 중</div>
                    <div>다음날 비: <strong>7</strong>일</div>
                  </div>
                  <div style={{ background:"white", borderRadius:"8px",
                    padding:"8px 10px", fontSize:"12px" }}>
                    <div style={{ fontWeight:"700", color:"#E65100",
                      marginBottom:"3px" }}>☀️ 맑은 날 다음날</div>
                    <div>총 <strong>20</strong>일 중</div>
                    <div>다음날 비: <strong>4</strong>일</div>
                  </div>
                </div>
                <div style={{ marginTop:"8px", background:"white",
                  borderRadius:"8px", padding:"8px 10px",
                  fontSize:"12px", fontWeight:"700", color:"#C62828" }}>
                  📌 조건: 이번 주 <strong>월요일에 비가 왔음</strong> → 수요일 비 올 확률은?
                </div>
              </div>

              {/* STEP 1 */}
              <div style={{
                border:"2px solid #90CAF9", borderRadius:"12px",
                overflow:"hidden", marginBottom:"10px"
              }}>
                <div style={{ background:"#e3f2fd", padding:"8px 14px",
                  fontSize:"13px", fontWeight:"800", color:"#1565C0" }}>
                  STEP 1. 전이 확률 구하기
                </div>
                <div style={{ padding:"12px 14px",
                  display:"flex", flexDirection:"column", gap:"10px" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    gap:"8px", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"13px", fontWeight:"600" }}>
                      P(비 → 비) = 7 ÷ 10 =
                    </span>
                    <input type="text" inputMode="decimal" value={pRR}
                      onChange={e=>{ setPRR(e.target.value); setAnsError(""); }}
                      placeholder="?"
                      style={inp}/>
                  </div>
                  <div style={{ display:"flex", alignItems:"center",
                    gap:"8px", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"13px", fontWeight:"600" }}>
                      P(맑 → 비) = 4 ÷ 20 =
                    </span>
                    <input type="text" inputMode="decimal" value={pNR}
                      onChange={e=>{ setPNR(e.target.value); setAnsError(""); }}
                      placeholder="?"
                      style={inp}/>
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div style={{
                border:"2px solid #CE93D8", borderRadius:"12px",
                overflow:"hidden", marginBottom:"10px"
              }}>
                <div style={{ background:"#f3e5f5", padding:"8px 14px",
                  fontSize:"13px", fontWeight:"800", color:"#6A1B9A" }}>
                  STEP 2. 요일별 확률 계산
                </div>
                <div style={{ padding:"12px 14px",
                  display:"flex", flexDirection:"column", gap:"10px" }}>
                  {/* 화요일 */}
                  <div style={{ background:"#faf5ff", borderRadius:"8px",
                    padding:"8px 10px" }}>
                    <div style={{ fontSize:"12px", color:"#888",
                      marginBottom:"5px" }}>
                      💡 월요일이 비였으니까 → 화요일은 "비 → ?" 확률이야
                    </div>
                    <div style={{ display:"flex", alignItems:"center",
                      gap:"8px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"13px", fontWeight:"600" }}>
                        P(화요일 비) =
                      </span>
                      <input type="text" inputMode="decimal" value={pTue}
                        onChange={e=>{ setPTue(e.target.value); setAnsError(""); }}
                        placeholder="?"
                        style={inp}/>
                    </div>
                  </div>
                  {/* 수요일 */}
                  <div style={{ background:"#faf5ff", borderRadius:"8px",
                    padding:"8px 10px" }}>
                    <div style={{ fontSize:"12px", color:"#888",
                      marginBottom:"5px" }}>
                      💡 화요일이 비일 수도, 맑을 수도 있어 → 두 경우를 모두 더해줘
                    </div>
                    <div style={{ display:"flex", alignItems:"center",
                      gap:"8px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"13px", fontWeight:"600" }}>
                        P(수요일 비) =
                      </span>
                      <input type="text" inputMode="decimal" value={pWed}
                        onChange={e=>{ setPWed(e.target.value); setAnsError(""); }}
                        placeholder="?"
                        style={inp}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* 힌트 버튼 */}
              <button
                onClick={()=>setShowHint(h=>!h)}
                style={{
                  width:"100%", padding:"9px",
                  background: showHint ? "#fff3e0" : "white",
                  border:"2px solid #FF8F00",
                  borderRadius:"10px", marginBottom:"8px",
                  fontSize:"13px", fontWeight:"700",
                  color:"#E65100", cursor:"pointer"
                }}>
                {showHint ? "💡 힌트 닫기" : "💡 힌트 보기"}
              </button>

              {showHint && (
                <div style={{
                  background:"#fff8e1", borderRadius:"10px",
                  padding:"12px 14px", marginBottom:"10px",
                  fontSize:"13px", lineHeight:"1.9",
                  border:"1px solid #FFE082"
                }}>
                  <div style={{ fontWeight:"800", color:"#E65100",
                    marginBottom:"4px" }}>📐 수요일 확률 구하는 방법</div>
                  <div style={{ fontFamily:"Courier New", fontSize:"12px",
                    background:"white", borderRadius:"8px",
                    padding:"8px 12px", lineHeight:"2" }}>
                    P(수) = P(화 비오고 수 비)<br/>
                    {"      "}+ P(화 비 안오고 수 비)
                  </div>
                </div>
              )}

              {/* 오류 메시지 */}
              {ansError && (
                <div style={{ background:"#ffebee", borderRadius:"8px",
                  padding:"8px 12px", marginBottom:"10px",
                  fontSize:"12px", color:"#c62828", fontWeight:"600" }}>
                  ❌ {ansError}
                </div>
              )}

              <button onClick={handleAnswerSubmit} style={{
                width:"100%", padding:"13px",
                background:"linear-gradient(135deg,#1565C0,#0D47A1)",
                color:"white", border:"none", borderRadius:"12px",
                fontSize:"15px", fontWeight:"700", cursor:"pointer"
              }}>정답 제출하기 ✓</button>
            </div>
          </>
        )}

        {/* 엔딩 모달 */}
        {showEnding && (
          <>
            <div className="overlay"/>
            <div className="ending-modal">
              <div style={{ fontSize:"48px", marginBottom:"8px" }}>☀️</div>
              <div style={{ fontSize:"20px", fontWeight:"900", marginBottom:"8px" }}>
                미션 완료!
              </div>
              <div style={{ fontSize:"14px", color:"#718096",
                marginBottom:"20px", lineHeight:"1.7" }}>
                월요일 비 → 수요일 비 확률 = <strong>55%</strong><br/>
                수학으로 날씨를 예측할 수 있어! 🌦️
              </div>
              <div style={{
                background:"linear-gradient(135deg,#1565C0,#0D47A1)",
                borderRadius:"16px", padding:"16px 20px", marginBottom:"20px"
              }}>
                <div style={{ fontSize:"28px", marginBottom:"8px" }}>🌀</div>
                <div style={{ color:"white", fontSize:"14px",
                  lineHeight:"1.7", fontWeight:"600" }}>
                  이번엔 실제 배곧 지역<br/>
                  5월 강수 데이터를 직접 분석해봐!<br/>
                  통계 확률로 나만의 문제를 만들어보자 📊
                </div>
              </div>
              <button onClick={()=>navigate("/rain-data")} style={{
                width:"100%", padding:"13px",
                background:"linear-gradient(135deg,#1565C0,#0D47A1)",
                color:"white", border:"none", borderRadius:"12px",
                fontSize:"15px", fontWeight:"700", cursor:"pointer",
                marginBottom:"8px"
              }}>
                📊 Step 2: 실제 데이터 분석하러 가기 →
              </button>
              <button onClick={()=>navigate("/map")} style={{
                width:"100%", padding:"10px", background:"white",
                border:"1px solid #ddd", borderRadius:"12px",
                fontSize:"13px", fontWeight:"700",
                cursor:"pointer", color:"#718096", marginBottom:"8px"
              }}>🗺 지도로 돌아가기</button>
              <button onClick={handleReset} style={{
                width:"100%", padding:"9px", background:"white",
                border:"2px solid #eee", borderRadius:"12px",
                fontSize:"12px", fontWeight:"700", cursor:"pointer", color:"#bbb"
              }}>🔄 처음부터 다시하기</button>
            </div>
          </>
        )}

        <style>{`
          @keyframes fadeSlide {
            from { opacity:0; transform:translateY(10px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @keyframes popIn {
            from { transform:translate(-50%,-50%) scale(0.85); opacity:0; }
            to   { transform:translate(-50%,-50%) scale(1); opacity:1; }
          }
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `}</style>
      </div>
    </div>
  );
}

function RainBackground() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
    </div>
  );
}
