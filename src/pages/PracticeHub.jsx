import { useNavigate } from "react-router-dom";
import { PRACTICE_UNITS } from "../data/practiceProblems";

export default function PracticeHub() {
  const navigate = useNavigate();

  return (
    <div style={{
      background:"linear-gradient(180deg,#F3F0FF,#E8E5FF)",
      minHeight:"100vh"
    }}>
      {/* 헤더 */}
      <div style={{
        background:"white", padding:"14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/map")} style={{
          background:"none", border:"none", color:"#5E35B1",
          fontWeight:"700", fontSize:"14px", cursor:"pointer"
        }}>← 지도로</button>
        <div style={{ fontWeight:"900", fontSize:"17px" }}>
          ✏️ 연습문제
        </div>
        <div style={{ width:"50px" }}/>
      </div>

      <div style={{ padding:"24px 20px", maxWidth:"720px", margin:"0 auto" }}>

        {/* 안내 */}
        <div style={{
          background:"linear-gradient(135deg,#5E35B1,#7B1FA2)",
          borderRadius:"16px", padding:"18px 22px",
          marginBottom:"24px", color:"white",
          fontSize:"15px", lineHeight:"1.8"
        }}>
          🌀 <strong>코코의 미션</strong> — 단원을 선택해서 연습문제 10개를 풀어봐!
          <br></br>
          틀리면 힌트를 볼 수 있고, 진행 상황은 자동으로 저장돼.
        </div>

        {/* 단원 선택 그리드 */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr",
          gap:"16px"
        }}>
        {PRACTICE_UNITS.map(unit => (
          <button
            key={unit.id}
            onClick={() => {
              if (unit.ready) navigate(`/practice/${unit.id}`);
              else alert("이 단원은 곧 추가될 예정이에요! 🛠");
            }}
            style={{
              background: unit.ready ? "white" : "#f5f5f5",
              border: `2px solid ${unit.ready ? unit.color : "#ddd"}`,
              borderRadius:"18px",
              padding:"22px 24px",
              cursor:"pointer",
              textAlign:"left",
              opacity: unit.ready ? 1 : 0.65,
              boxShadow: unit.ready ? `0 4px 16px ${unit.color}33` : "none",
              display:"flex",
              alignItems:"center",
              gap:"20px",
              width:"100%",
            }}
          >
            {/* 이모지 */}
            <div style={{
              width:"60px", height:"60px", borderRadius:"16px",
              background: unit.bg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"32px", flexShrink:0,
            }}>
              {unit.emoji}
            </div>

            {/* 텍스트 */}
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:"20px", fontWeight:"900",
                color: unit.ready ? unit.color : "#999",
                marginBottom:"4px"
              }}>
                {unit.title}
              </div>
              <div style={{ fontSize:"15px", color:"#888" }}>
                {unit.desc}
              </div>
            </div>

            {/* 화살표 */}
            {unit.ready && (
              <div style={{
                fontSize:"20px", color: unit.color, fontWeight:"700"
              }}>→</div>
            )}
            {!unit.ready && (
              <div style={{
                fontSize:"11px", fontWeight:"700", color:"#999",
                background:"#f0f0f0", borderRadius:"8px",
                padding:"4px 10px", whiteSpace:"nowrap"
              }}>
                🔒 준비중
              </div>
            )}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
