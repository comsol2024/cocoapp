import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveUserProgress } from "../firebase";

const DIALOGS = [
  {
    speaker: "학생 1",
    emoji: "🧑",
    text: "이번 축제에 공연 스케줄을 짜야하는데 어떤식으로 짜야할지 도무지 모르겠어.",
    position: "left",
  },
  {
    speaker: "학생 2",
    emoji: "👧",
    text: "댄스팀, 노래팀은 몇팀씩 받을거야?",
    position: "right",
  },
  {
    speaker: "학생 3",
    emoji: "👦",
    text: "애들이 점심먹고 오면... 몇분 정도로 공연 구성하면 좋을려나?",
    position: "left",
  },
  {
    speaker: "COCO",
    emoji: "🌀",
    text: "자 이번에는 실제 학교에서의 축제 공연 일정표를 우리가 설계해보자!",
    position: "coco",
  },
];

export default function ClassroomScene({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    saveUserProgress(user.uid, "classroom", {
      reached: true,
      reachedAt: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (step < DIALOGS.length - 1) {
      setStep(s => s + 1);
    } else {
      navigate("/planning");
    }
  };

  const current = DIALOGS[step];
  const isCoco = current.position === "coco";
  const isRight = current.position === "right";

  return (
    <div className="game-screen">
      <div className="scene-classroom">

        {/* 칠판 */}
        <div className="blackboard">
          <div style={{
            color:"rgba(255,255,255,0.6)",
            fontSize:"40px", fontWeight:"700",
            textAlign:"center", padding:"12px"
          }}>
            🎪 학교 축제 공연 기획회의
          </div>
          <div style={{
            display:"flex", justifyContent:"center",
            gap:"16px", padding:"4px 12px"
          }}>
            {["댄스팀 ??팀", "노래팀 ??팀", "총 ??분"].map((t, i) => (
              <div key={i} style={{
                background:"rgba(255,255,255,0.1)",
                borderRadius:"15px", padding:"4px 12px",
                color:"rgba(255,255,255,0.7)", fontSize:"20px"
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* 책상들 */}
        <div className="desks-area">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="desk" />
          ))}
        </div>

        {/* HUD */}
        <div className="hud">
          <div className="hud-badge hud-back" onClick={() => navigate("/map")}>
            ← 지도로
          </div>
          <div className="hud-badge">🏫 교실 · 학생자치회</div>
          <div className="hud-badge">
            {step + 1} / {DIALOGS.length}
          </div>
        </div>

        {/* 대화 말풍선 */}
        <div
          key={step}
          style={{
            position:"absolute",
            bottom: isCoco ? "22%" : "38%",
            left: isCoco ? "50%" : isRight ? "auto" : "10%",
            right: isRight ? "10%" : "auto",
            transform: isCoco ? "translateX(-50%)" : "none",
            display:"flex",
            flexDirection: isRight ? "row-reverse" : "row",
            alignItems:"flex-end",
            gap:"10px",
            zIndex:20,
            maxWidth:"70%",
            animation:"fadeSlide 0.3s ease-out",
          }}
        >
          {/* 캐릭터 아이콘 */}
          <div style={{
            width: isCoco ? "64px" : "48px",
            height: isCoco ? "64px" : "48px",
            borderRadius:"50%",
            background: isCoco
              ? "linear-gradient(135deg,#667eea,#764ba2)"
              : "linear-gradient(135deg,#f093fb,#f5576c)",
            display:"flex", alignItems:"center",
            justifyContent:"center",
            fontSize: isCoco ? "32px" : "24px",
            flexShrink:0,
            boxShadow:"0 4px 14px rgba(0,0,0,0.2)",
          }}>
            {current.emoji}
          </div>

          {/* 말풍선 */}
          <div style={{
            background: isCoco
              ? "linear-gradient(135deg,#667eea,#764ba2)"
              : "white",
            color: isCoco ? "white" : "#2D3748",
            borderRadius: isRight
              ? "16px 4px 16px 16px"
              : isCoco ? "16px" : "4px 16px 16px 16px",
            padding:"14px 18px",
            fontSize:"14px", lineHeight:"1.7",
            boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
            maxWidth:"280px",
            border: isCoco ? "none" : "2px solid #e2e8f0",
          }}>
            <div style={{
              fontSize:"11px", fontWeight:"700",
              marginBottom:"4px",
              color: isCoco ? "rgba(255,255,255,0.8)" : "#718096"
            }}>
              {current.speaker}
            </div>
            {current.text}
          </div>
        </div>

        {/* 다음 버튼 */}
        <button onClick={handleNext} style={{
          position:"absolute",
          bottom:"8%", right:"5%",
          padding:"12px 28px",
          background: step === DIALOGS.length - 1
            ? "linear-gradient(135deg,#5b9fe8,#764ba2)"
            : "rgba(255,255,255,0.92)",
          color: step === DIALOGS.length - 1 ? "white" : "#2D3748",
          border:"none", borderRadius:"24px",
          fontSize:"14px", fontWeight:"700",
          cursor:"pointer", zIndex:20,
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
          transition:"background 0.2s",
        }}>
          {step === DIALOGS.length - 1 ? "기획 시작하기 →" : "다음 ▶"}
        </button>

        <style>{`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .coco-container { bottom: 28%; }
        `}</style>
      </div>
    </div>
  );
}