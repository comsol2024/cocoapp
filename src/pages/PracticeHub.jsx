import { useNavigate } from "react-router-dom";
import { PRACTICE_UNITS } from "../data/practiceProblems";

export default function PracticeHub({ user }) {
  const navigate = useNavigate();

  const unitLabels = [
    "1. 연립방정식 실생활 문제",
    "2. 일차함수 실생활 문제",
    "3. 외심과 내심 실생활 문제",
    "4. 확률 실생활 문제",
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg,#F3F0FF,#E8E5FF)",
      minHeight: "100vh"
    }}>
      {/* 헤더 */}
      <div style={{
        background: "white", padding: "24px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        position: "sticky", top: 0, zIndex: 30
      }}>
        <button onClick={() => navigate("/map")} style={{
          background: "none", border: "none", color: "#5E35B1",
          fontWeight: "700", fontSize: "24px", cursor: "pointer"
        }}>← 지도로</button>
        <div style={{ fontWeight: "900", fontSize: "30px" }}>✏️ 연습문제</div>
        <div style={{ width: "100px" }} />
      </div>

      <div style={{ padding: "48px 32px 64px", maxWidth: "1000px", margin: "0 auto" }}>
        {/* 2×2 단원 버튼 그리드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "28px"
        }}>
          {PRACTICE_UNITS.map((unit, idx) => (
            <button
              key={unit.id}
              onClick={() => navigate(`/practice/${unit.id}`)}
              style={{
                background: "white",
                border: `3px solid ${unit.color}`,
                borderRadius: "28px",
                padding: "48px 32px",
                cursor: "pointer",
                textAlign: "center",
                boxShadow: `0 4px 16px ${unit.color}22`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "22px",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 10px 28px ${unit.color}44`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${unit.color}22`;
              }}
            >
              <div style={{
                width: "110px", height: "110px", borderRadius: "28px",
                background: unit.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "60px",
              }}>
                {unit.emoji}
              </div>
              <div style={{
                fontSize: "24px", fontWeight: "800",
                color: unit.color, lineHeight: "1.5",
              }}>
                {unitLabels[idx]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}