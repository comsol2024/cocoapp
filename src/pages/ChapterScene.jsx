import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CHAPTERS } from "../data/chapters";
import { saveUserProgress, loadUserProgress, resetUserProgress } from "../firebase";

const checkEquation = (input, requiredNumbers) => {
  if (!input.trim()) return null;
  const normalized = input.replace(/\s/g, "");
  if (!normalized.includes("=")) return "warn";
  const hasAll = requiredNumbers.every(n => normalized.includes(String(n)));
  return hasAll ? "ok" : "warn";
};

export default function ChapterScene({ user }) {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const chapter = CHAPTERS[chapterId];

  const [phase, setPhase] = useState("cocoIntro");
  const [dialogIdx, setDialogIdx] = useState(0);
  const [collectedInfo, setCollectedInfo] = useState([]);
  const [clickedObjects, setClickedObjects] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [equations, setEquations] = useState({ eq1: "", eq2: "" });
  const [answerInput, setAnswerInput] = useState({ 노래: "", 댄스: "" });
  const [showEnding, setShowEnding] = useState(false);

  useEffect(() => {
    loadUserProgress(user.uid, chapterId).then(progress => {
      if (progress?.completed) setShowEnding(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!chapter) return <div>챕터를 찾을 수 없어요!</div>;

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
      if (phase === "cocoIntro")    { setPhase("explore");  setDialogIdx(0); }
      if (phase === "cocoAllFound") { setPhase("answer");   setDialogIdx(0); }
      if (phase === "cocoCorrect")  { setShowEnding(true); }
      if (phase === "cocoWrong")    { setPhase("answer");   setDialogIdx(0); }
    }
  };

  const handleReset = async () => {
    if (!window.confirm("처음부터 다시 할까요? 진행 기록이 사라져요!")) return;
    await resetUserProgress(user.uid, chapterId);
    setPhase("cocoIntro");
    setDialogIdx(0);
    setCollectedInfo([]);
    setClickedObjects([]);
    setActivePopup(null);
    setEquations({ eq1: "", eq2: "" });
    setAnswerInput({ 노래: "", 댄스: "" });
    setShowEnding(false);
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

    // 모든 오브젝트 정보 동일하게 수집
    setCollectedInfo(prev => [...prev, {
      name: obj.name,
      emoji: obj.emoji,
      text: obj.dialog[obj.dialog.length - 1],
    }]);

    setActivePopup(null);

    if (newClicked.length === chapter.objects.length) {
      setTimeout(() => {
        setPhase("cocoAllFound");
        setDialogIdx(0);
      }, 500);
    }
  };

  const handleAnswerSubmit = () => {
    const 노래 = parseInt(answerInput.노래);
    const 댄스 = parseInt(answerInput.댄스);
    if (isNaN(노래) || isNaN(댄스)) {
      alert("답을 숫자로 입력해주세요!");
      return;
    }
    if (노래 === chapter.answer.노래 && 댄스 === chapter.answer.댄스) {
      setPhase("cocoCorrect");
      setDialogIdx(0);
      saveUserProgress(user.uid, chapterId, {
        completed: true,
        collectedInfo: collectedInfo.map(i => i.text),
        equations,
        answer: { 노래, 댄스 },
        nextMissionCode: chapter.nextMissionCode,
      });
    } else {
      setPhase("cocoWrong");
      setDialogIdx(0);
    }
  };

  const eq1Check = checkEquation(equations.eq1, [9]);
  const eq2Check = checkEquation(equations.eq2, [5, 8, 60]);
  const showCoco = ["cocoIntro","cocoAllFound","cocoCorrect","cocoWrong"].includes(phase);

  return (
    <div className="game-screen">
      <div className="scene-auditorium">

        <div className="curtain-left" />
        <div className="curtain-right" />
        <div className="spotlight" />
        <div className="stage" />
        <div className="seats-area">
          {[...Array(30)].map((_, i) => <div key={i} className="seat" />)}
        </div>

        {/* HUD */}
        <div className="hud">
          <div className="hud-badge hud-back" onClick={() => navigate("/map")}>
            ← 지도로
          </div>
          <div className="hud-badge">
            🏛 {chapter.name} · {chapter.subject}
          </div>
          <div className="hud-badge">
            {clickedObjects.length}/{chapter.objects.length} 탐색
          </div>
        </div>

        {/* 수집 정보 패널 — 왼쪽 */}
        <div className="info-panel">
          <div className="info-panel-title">🔍 수집한 정보</div>
          {collectedInfo.length === 0
            ? <div className="info-empty">오브젝트를 클릭해서<br/>정보를 모아봐!</div>
            : collectedInfo.map((info, i) => (
              <div key={i} className="info-tag">
                {info.emoji} <strong>{info.name}</strong><br/>
                <span style={{ opacity:0.85 }}>{info.text}</span>
              </div>
            ))
          }
        </div>

        {/* 오브젝트들 */}
        {phase === "explore" && chapter.objects.map(obj => (
          <div key={obj.id}
            className={`scene-object ${clickedObjects.includes(obj.id) ? "collected" : ""}`}
            style={{ left:`${obj.position.x}%`, top:`${obj.position.y}%` }}
            onClick={() => handleObjectClick(obj)}>
            <div className={`object-bubble ${clickedObjects.includes(obj.id) ? "collected" : ""}`}>
              {obj.emoji}
            </div>
            <div className="object-name">{obj.name}</div>
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

        {/* 오브젝트 팝업 — 모든 오브젝트 동일하게 표시 */}
        {activePopup && (
          <>
            <div className="overlay" onClick={handlePopupClose} />
            <div className="object-popup">
              <div className="popup-emoji">{activePopup.emoji}</div>
              <div className="popup-title">{activePopup.name}</div>
              <div className="popup-dialog">
                {activePopup.dialog.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <button className="popup-close" onClick={handlePopupClose}>
                확인
              </button>
            </div>
          </>
        )}

        {/* 정답 입력 모달 */}
        {phase === "answer" && (
          <>
            <div className="overlay" />
            <div className="answer-modal">
              <div className="answer-title">📝 워크북을 풀고 입력해봐!</div>

              <div style={{
                fontSize:"12px", color:"var(--text-muted)",
                marginBottom:"8px", fontWeight:"600"
              }}>
                ✏️ 내가 세운 연립방정식
              </div>
              <div className="equation-inputs">
                <div className="equation-field">
                  <label>식 ①</label>
                  <input
                    value={equations.eq1}
                    onChange={e => setEquations(p => ({ ...p, eq1: e.target.value }))}
                    placeholder="수식을 직접 입력해보세요!"
                  />
                  {eq1Check && (
                    <div className={`equation-check ${eq1Check}`}>
                      {eq1Check === "ok" ? "✓ 좋아 보여요!" : "⚠ 다시 확인해봐요"}
                    </div>
                  )}
                </div>
                <div className="equation-field">
                  <label>식 ②</label>
                  <input
                    value={equations.eq2}
                    onChange={e => setEquations(p => ({ ...p, eq2: e.target.value }))}
                    placeholder="수식을 직접 입력해보세요!"
                  />
                  {eq2Check && (
                    <div className={`equation-check ${eq2Check}`}>
                      {eq2Check === "ok" ? "✓ 좋아 보여요!" : "⚠ 다시 확인해봐요"}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                fontSize:"12px", color:"var(--text-muted)",
                marginBottom:"8px", fontWeight:"600"
              }}>
                🎯 정답 입력
              </div>
              <div className="answer-inputs">
                <div className="answer-field">
                  <label>🎤 노래팀</label>
                  <input
                    type="number" min="0"
                    value={answerInput.노래}
                    onChange={e => setAnswerInput(p => ({ ...p, 노래: e.target.value }))}
                    placeholder="?"
                  />
                </div>
                <div className="answer-field">
                  <label>💃 댄스팀</label>
                  <input
                    type="number" min="0"
                    value={answerInput.댄스}
                    onChange={e => setAnswerInput(p => ({ ...p, 댄스: e.target.value }))}
                    placeholder="?"
                  />
                </div>
              </div>

              <button className="answer-submit" onClick={handleAnswerSubmit}>
                정답 제출하기 ✓
              </button>
            </div>
          </>
        )}

        {/* 엔딩 모달 */}
{showEnding && (
  <>
    <div className="overlay" />
    <div className="ending-modal">
      <div style={{ fontSize:"48px", marginBottom:"8px" }}>🎉</div>
      <div style={{ fontSize:"20px", fontWeight:"900", marginBottom:"8px" }}>
        정답이야!
      </div>
      <div style={{ fontSize:"14px", color:"#718096", marginBottom:"20px", lineHeight:"1.7" }}>
        노래팀 {chapter.answer.노래}팀, 댄스팀 {chapter.answer.댄스}팀으로<br/>
        딱 60분 공연이 완성됐어! 🎭
      </div>

      {/* 코코 스토리 전환 말풍선 */}
      <div style={{
        background:"linear-gradient(135deg,#667eea,#764ba2)",
        borderRadius:"16px", padding:"16px 20px",
        marginBottom:"20px", position:"relative"
      }}>
        <div style={{ fontSize:"28px", marginBottom:"8px" }}>🌀</div>
        <div style={{
          color:"white", fontSize:"14px",
          lineHeight:"1.7", fontWeight:"600"
        }}>
          이제 우리 학교에 대한 이야기로<br/>
          넘어가볼까?<br/>
          저기 학생자치회 아이들이 고민하고 있어 👀
        </div>
      </div>

      <button onClick={() => navigate("/classroom")} style={{
        width:"100%", padding:"13px",
        background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
        color:"white", border:"none", borderRadius:"12px",
        fontSize:"15px", fontWeight:"700", cursor:"pointer",
        marginBottom:"8px", display:"flex",
        alignItems:"center", justifyContent:"center", gap:"8px"
      }}>
        다음 장면으로 → 🏫
      </button>

      <button onClick={handleReset} style={{
        width:"100%", padding:"10px",
        background:"white", border:"2px solid #ddd",
        borderRadius:"12px", fontSize:"13px",
        fontWeight:"700", cursor:"pointer", color:"#718096"
      }}>
        🔄 처음부터 다시하기
      </button>
    </div>
  </>
)}
      </div>
    </div>
  );
}