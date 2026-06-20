import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CHAPTERS } from "../data/chapters";
import { saveUserProgress, loadUserProgress, resetUserProgress } from "../firebase";

export default function AEDScene({ user }) {
  const navigate = useNavigate();
  const chapter = CHAPTERS["aed"];

  const [phase, setPhase]                 = useState("cocoIntro");
  const [dialogIdx, setDialogIdx]         = useState(0);
  const [collectedInfo, setCollectedInfo] = useState([]);
  const [clickedObjects, setClickedObjects] = useState([]);
  const [activePopup, setActivePopup]     = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [reasonInput, setReasonInput]     = useState("");
  const [showEnding, setShowEnding]       = useState(false);

  useEffect(() => {
    loadUserProgress(user.uid, "aed").then(p => {
      if (p?.completed) setShowEnding(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentDialogs = {
    cocoIntro:    chapter.cocoIntro,
    cocoAllFound: chapter.cocoAllFound,
    cocoCorrect:  chapter.cocoCorrect,
    cocoWrong:    chapter.cocoWrong,
  };

  const handleDialogNext = () => {
    const dialogs = currentDialogs[phase];
    if (!dialogs) return;
    if (dialogIdx < dialogs.length - 1) {
      setDialogIdx(dialogIdx + 1);
    } else {
      if (phase === "cocoIntro")    { setPhase("explore");     setDialogIdx(0); }
      if (phase === "cocoAllFound") { setPhase("answer");      setDialogIdx(0); }
      if (phase === "cocoCorrect")  { setShowEnding(true); }
      if (phase === "cocoWrong")    { setPhase("answer");      setDialogIdx(0); setSelectedAnswer(null); }
    }
  };

  const handleReset = async () => {
    if (!window.confirm("처음부터 다시 할까요?")) return;
    await resetUserProgress(user.uid, "aed");
    setPhase("cocoIntro"); setDialogIdx(0);
    setCollectedInfo([]); setClickedObjects([]);
    setActivePopup(null); setSelectedAnswer(null);
    setReasonInput(""); setShowEnding(false);
  };

  const handleObjectClick = (obj) => {
    if (clickedObjects.includes(obj.id)) return;
    setActivePopup(obj);
  };

  const handlePopupClose = () => {
    if (!activePopup) return;
    const obj = activePopup;
    const newClicked = [...clickedObjects, obj.id];
    setClickedObjects(newClicked);
    setCollectedInfo(prev => [...prev, {
      name: obj.name, emoji: obj.emoji,
      text: obj.dialog[obj.dialog.length - 1],
    }]);
    setActivePopup(null);
    if (newClicked.length === chapter.objects.length) {
      setTimeout(() => { setPhase("cocoAllFound"); setDialogIdx(0); }, 500);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) { alert("답을 선택해주세요!"); return; }
    if (selectedAnswer === "외심") {
      setPhase("cocoCorrect"); setDialogIdx(0);
        saveUserProgress(user.uid, "aed", {
        completed: true,
        answer: selectedAnswer,
        reason: reasonInput || "",
        nextMissionCode: chapter.nextMissionCode || "COCO-003",
        });
    } else {
      setPhase("cocoWrong"); setDialogIdx(0);
    }
  };

  const showCoco = ["cocoIntro","cocoAllFound","cocoCorrect","cocoWrong"].includes(phase);

  return (
    <div className="game-screen">
      <div className="scene-aed">
        <FloorPlan clickedObjects={clickedObjects} phase={phase} />

        {/* HUD */}
        <div className="hud">
          <div className="hud-badge hud-back" onClick={() => navigate("/map")}>
            ← 지도로
          </div>
          <div className="hud-badge">🏫 4층 평면도</div>
          <div className="hud-badge">
            {clickedObjects.length}/{chapter.objects.length} 탐색
          </div>
        </div>

        {/* 수집 정보 패널 */}
        <div className="info-panel" style={{ zIndex: 45 }}>
          <div className="info-panel-title">🔍 수집한 정보</div>
          {collectedInfo.length === 0
            ? <div className="info-empty">교실과 오브젝트를<br/>클릭해서 정보를 모아봐!</div>
            : collectedInfo.map((info, i) => (
              <div key={i} className="info-tag">
                {info.emoji} <strong>{info.name}</strong><br/>
                <span style={{ opacity: 0.85 }}>{info.text}</span>
              </div>
            ))
          }
        </div>

        {/* 오브젝트들 */}
        {phase === "explore" && chapter.objects.map(obj => (
          <div key={obj.id}
            className={`scene-object ${clickedObjects.includes(obj.id) ? "collected" : ""}`}
            style={{ left: `${obj.position.x}%`, top: `${obj.position.y}%` }}
            onClick={() => handleObjectClick(obj)}>
            <div
              className={`object-bubble ${clickedObjects.includes(obj.id) ? "collected" : ""}`}
              style={obj.id.startsWith("class") ? {
                background: "rgba(255,80,80,0.9)",
                boxShadow: "0 0 15px rgba(255,80,80,0.7)",
                border: "2px solid rgba(255,150,150,0.9)"
              } : {}}>
              {obj.emoji}
            </div>
            <div className="object-name"
              style={obj.id.startsWith("class") ? {
                background: "rgba(180,0,0,0.85)"
              } : {}}>
              {obj.name}
            </div>
          </div>
        ))}

        {/* 코코 NPC */}
        {showCoco && (
          <div className="coco-container">
            <div className="coco-dialog">
              {currentDialogs[phase]?.[dialogIdx]}
              <button className="coco-next-btn" onClick={handleDialogNext}>
                {dialogIdx < (currentDialogs[phase]?.length || 1) - 1
                  ? "다음 ▶" : "확인 ✓"}
              </button>
            </div>
            <div className="coco-character">🌀</div>
          </div>
        )}

        {/* 오브젝트 팝업 */}
        {activePopup && (
          <>
            <div
              className="overlay"
              onClick={handlePopupClose}
            />

            <div
  className={`object-popup ${
    activePopup.image ? "image-popup" : ""
  }`}
>

              <div className="popup-emoji">
                {activePopup.emoji}
              </div>

              <div className="popup-title">
                {activePopup.name}
              </div>

              <div className="popup-content">

                {activePopup.image ? (
                  <img
                    src={activePopup.image}
                    alt={activePopup.name}
                    className="popup-image"
                  />
                ) : (
                  <div className="popup-dialog">
                    {activePopup.dialog.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}

              </div>

              <button
                className="popup-close"
                onClick={handlePopupClose}
              >
                확인
              </button>

            </div>
          </>
        )}

        {/* 정답 입력 모달 — 버튼 선택 방식 */}
        {phase === "answer" && (
          <>
            <div className="overlay" />
            <div className="answer-modal">
              <div className="answer-title">🏥 {chapter.answerHint}</div>

              <div style={{
                background: "#fff8e1", borderRadius: "12px",
                padding: "12px 14px", marginBottom: "16px",
                fontSize: "13px", lineHeight: "1.7", color: "#5D4037"
              }}>
                💡 세 교실을 꼭짓점으로 하는 삼각형에서,<br/>
                <strong>세 점으로부터 거리가 같은 점</strong>에 AED를 설치하면<br/>
                어느 교실에서도 같은 거리로 달려올 수 있어!
              </div>

              {/* 선택 버튼 */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "10px", marginBottom: "14px"
              }}>
                {["내심", "외심", "무게중심", "수심"].map(opt => (
                  <button key={opt}
                    onClick={() => setSelectedAnswer(opt)}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: selectedAnswer === opt
                        ? "3px solid #5b9fe8"
                        : "2px solid #e2e8f0",
                      background: selectedAnswer === opt
                        ? "#e3f2fd" : "white",
                      fontSize: "17px", fontWeight: "900",
                      cursor: "pointer",
                      color: selectedAnswer === opt ? "#1565C0" : "#2D3748",
                      transition: "all 0.15s",
                      boxShadow: selectedAnswer === opt
                        ? "0 0 0 2px rgba(91,159,232,0.3)" : "none"
                    }}>
                    {opt}
                  </button>
                ))}
              </div>

              {/* 이유 (선택) */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{
                  display: "block", fontSize: "12px",
                  fontWeight: "700", color: "#718096", marginBottom: "5px"
                }}>
                  ✏️ 그 이유는? (선택)
                </label>
                <textarea
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="왜 그 심(心)을 선택했는지 이유를 써봐!"
                  style={{
                    width: "100%", padding: "10px 12px",
                    borderRadius: "10px", border: "1px solid #e2e8f0",
                    fontSize: "13px", minHeight: "60px",
                    resize: "none", outline: "none",
                    lineHeight: "1.6", boxSizing: "border-box",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <button
                className="answer-submit"
                onClick={handleAnswerSubmit}
                style={{
                  opacity: selectedAnswer ? 1 : 0.5,
                  cursor: selectedAnswer ? "pointer" : "default"
                }}>
                정답 제출하기 
              </button>
            </div>
          </>
        )}

        {/* 엔딩 모달 */}
        {showEnding && (
          <>
            <div className="overlay" />
            <div className="ending-modal">
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>🏥</div>
              <div style={{ fontSize: "20px", fontWeight: "900", marginBottom: "8px" }}>
                미션 완료!
              </div>
              <div style={{
                fontSize: "14px", color: "#718096",
                marginBottom: "20px", lineHeight: "1.7"
              }}>
                외심을 이용해 AED의 최적 위치를 찾았어!<br/>
                세 교실 어디서든 똑같이 가까운 위치. 수학이 생명을 구할 수 있어 😊
              </div>

              <div style={{
                background: "linear-gradient(135deg,#1565C0,#0D47A1)",
                borderRadius: "16px", padding: "16px 20px", marginBottom: "20px"
              }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🌀</div>
                <div style={{
                  color: "white", fontSize: "14px",
                  lineHeight: "1.7", fontWeight: "600"
                }}>
                  우리가 배운 외심 개념으로<br/>
                  이번엔 직접 시뮬레이션 해볼까?<br/>
                  2층 평면도에서 응급환자 위치를<br/>
                  바꿔가며 외심이 어떻게 변하는지 확인해봐! 📍
                </div>
              </div>
                <button onClick={() => navigate("/incenter-sim")} style={{
                width: "100%", padding: "13px",
                background: "linear-gradient(135deg,#1565C0,#0D47A1)",
                color: "white", border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer",
                marginBottom: "8px", display: "flex",
                alignItems: "center", justifyContent: "center", gap: "8px"
                }}>
                시뮬레이션 시작하기
                </button>
              <button onClick={() => navigate("/map")} style={{
                width: "100%", padding: "13px",
                background: "linear-gradient(135deg,#5b9fe8,#764ba2)",
                color: "white", border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer",
                marginBottom: "8px"
              }}>
                지도로 돌아가기
              </button>
              <button onClick={handleReset} style={{
                width: "100%", padding: "10px",
                background: "white", border: "2px solid #ddd",
                borderRadius: "12px", fontSize: "13px",
                fontWeight: "700", cursor: "pointer", color: "#718096"
              }}>
                처음부터 다시하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 4층 평면도 컴포넌트 ── */
function FloorPlan({ clickedObjects, phase }) {
  const showTriangle = ["cocoAllFound","answer","cocoCorrect","cocoWrong"].includes(phase);

  return (
      showTriangle && (
        <svg style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          zIndex: 3, pointerEvents: "none"
        }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="84,5 84,44 18,25"
            fill="rgba(184, 23, 12, 0.12)"
            stroke="rgba(230, 0, 0, 0.7)"
            strokeWidth="0.5"
            strokeDasharray="2 1"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="56.5" cy="24" r="1.5"
            fill="rgba(230, 0, 0, 0.85)"
            stroke="white" strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"/>
        </svg>
      )
  );
}