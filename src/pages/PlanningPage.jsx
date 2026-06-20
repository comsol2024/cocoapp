import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import CocoChat    from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";


export default function PlanningPage({ user }) {
  const navigate = useNavigate();

  // 현장조사 상태
  const [surveyRows, setSurveyRows] = useState([
    { id: 1, source: "", title: "", value: "" },
    { id: 2, source: "", title: "", value: "" },
  ]);

  // 공연기획표 상태
  const [planRows, setPlanRows] = useState([
    { id: 1, order: 1, team: "", genre: "노래", time: "5" },
    { id: 2, order: 2, team: "", genre: "댄스", time: "8" },
  ]);

  // 메모
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);

  // 불러오기
  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "users", user.uid, "chapters", "planning");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (d.surveyRows) setSurveyRows(d.surveyRows);
        if (d.planRows)   setPlanRows(d.planRows);
        if (d.memo)       setMemo(d.memo);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 자동저장
  useEffect(() => {
    const timer = setTimeout(async () => {
      await setDoc(
        doc(db, "users", user.uid, "chapters", "planning"),
        { surveyRows, planRows, memo, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyRows, planRows, memo]);

  // 현장조사 행 관리
  const addSurveyRow = () => {
    setSurveyRows(prev => [...prev, { id: Date.now(), source: "", title: "", value: "" }]);
  };
  const updateSurveyRow = (id, key, val) => {
    setSurveyRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  };
  const deleteSurveyRow = (id) => {
    if (surveyRows.length === 1) return;
    setSurveyRows(prev => prev.filter(r => r.id !== id));
  };

  const inputStyle = {
    padding: "7px 10px", borderRadius: "8px",
    border: "1px solid #e2e8f0", fontSize: "13px",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#f0f7ff,#e8f4fd)",
      paddingBottom: "120px"
    }}>

      {/* 헤더 */}
      <div style={{
        background: "white", padding: "14px 20px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        position: "sticky", top: 0, zIndex: 30
      }}>
        <button onClick={() => navigate("/classroom")} style={{
          background: "none", border: "none",
          color: "#5b9fe8", fontWeight: "700",
          fontSize: "14px", cursor: "pointer"
        }}>← 뒤로</button>
        <div style={{ fontWeight: "900", fontSize: "16px" }}>📋 공연 기획</div>
        <div style={{
          fontSize: "12px", fontWeight: "600",
          color: saved ? "#34a853" : "#bbb",
          transition: "color 0.3s"
        }}>
          {saved ? "✓ 저장됨" : "저장 중..."}
        </div>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: "680px", margin: "0 auto" }}>

        {/* 안내 배지 */}
        <div style={{
          background: "linear-gradient(135deg,#667eea,#764ba2)",
          borderRadius: "14px", padding: "14px 18px",
          marginBottom: "20px", color: "white",
          fontSize: "13px", lineHeight: "1.8"
        }}>
          🌀 <strong>코코의 미션</strong><br/>
          학교에서 직접 자료를 조사하고 기록해봐!<br/>
          <span style={{ opacity: 0.85, fontSize: "12px" }}>
            60분 안에 축제 공연이 성공적으로 진행되려면 어떤 것들을 고려해야 좋을까?
          </span>
        </div>

        {/* ── 현장조사기록 표 ── */}
        <div style={{
          background: "white", borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          marginBottom: "16px", overflow: "hidden"
        }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ fontWeight: "900", fontSize: "15px" }}>
              🔍 현장조사기록
            </div>
            <div style={{ fontSize: "12px", color: "#aaa" }}>
              {surveyRows.length}개 항목
            </div>
          </div>

          {/* 표 헤더 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 32px",
            gap: "6px", padding: "8px 14px",
            background: "#f8f9ff",
            fontSize: "12px", fontWeight: "700", color: "#718096"
          }}>
            <div>데이터 출처</div>
            <div>데이터 이름</div>
            <div>데이터 값</div>
            <div></div>
          </div>

          {/* 표 행들 */}
          {surveyRows.map((row, idx) => (
            <div key={row.id} style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 32px",
              gap: "6px", padding: "8px 14px",
              borderBottom: "1px solid #f5f5f5",
              alignItems: "center"
            }}>
              <input
                value={row.source}
                onChange={e => updateSurveyRow(row.id, "source", e.target.value)}
                placeholder={
                  idx === 0 ? "예: 학생자치회 회장" :
                  idx === 1 ? "예: 직접 측정" : "출처"
                }
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#5b9fe8"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <input
                value={row.title}
                onChange={e => updateSurveyRow(row.id, "title", e.target.value)}
                placeholder={
                  idx === 0 ? "예: 댄스곡 평균 시간" :
                  idx === 1 ? "예: 학생 식사 시간 평균" : "데이터 이름"
                }
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#5b9fe8"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <input
                value={row.value}
                onChange={e => updateSurveyRow(row.id, "value", e.target.value)}
                placeholder={
                  idx === 0 ? "예: 4팀" :
                  idx === 1 ? "예: 5분" : "값"
                }
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#5b9fe8"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <button
                onClick={() => deleteSurveyRow(row.id)}
                disabled={surveyRows.length === 1}
                style={{
                  background: "none", border: "none",
                  color: surveyRows.length === 1 ? "#eee" : "#ccc",
                  cursor: surveyRows.length === 1 ? "default" : "pointer",
                  fontSize: "15px", padding: "2px"
                }}
                onMouseEnter={e => { if (surveyRows.length > 1) e.target.style.color = "#ff5f57"; }}
                onMouseLeave={e => e.target.style.color = "#ccc"}
              >✕</button>
            </div>
          ))}

          {/* 행 추가 */}
          <div style={{ padding: "10px 14px" }}>
            <button onClick={addSurveyRow} style={{
              width: "100%", padding: "9px",
              background: "#f8f9ff", border: "1px dashed #c0d0f0",
              borderRadius: "8px", color: "#5b9fe8",
              fontSize: "13px", fontWeight: "700", cursor: "pointer"
            }}>
              ➕ 항목 추가
            </button>
          </div>
        </div>

        {/* ── 메모 ── */}
        <div style={{
          background: "white", borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          marginBottom: "16px", overflow: "hidden"
        }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f0f0f0",
            fontWeight: "900", fontSize: "15px"
          }}>📝 메모</div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="조사하면서 느낀 점, 추가로 알아낸 것, 궁금한 점 등을 자유롭게 적어봐!"
            style={{
              width: "100%", minHeight: "100px",
              padding: "14px 18px", border: "none",
              fontSize: "14px", lineHeight: "1.7",
              resize: "vertical", outline: "none",
              fontFamily: "inherit", color: "#2D3748",
              boxSizing: "border-box"
            }}
          />
        </div>

       {/* ── 공연기획표 ── 
        <div style={{
          background: "white", borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          marginBottom: "16px", overflow: "hidden"
        }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ fontWeight: "900", fontSize: "15px" }}>
              🎪 공연기획표
            </div>
            <div style={{
              fontSize: "13px", fontWeight: "700",
              color: totalTime > 60 ? "#e53e3e"
                   : totalTime === 60 ? "#34a853"
                   : "#5b9fe8"
            }}>
              {totalTime}분 / 60분
              {totalTime === 60 && " ✓"}
              {totalTime > 60 && " ⚠️ 초과!"}
            </div>
          </div>

          /* 헤더 
          <div style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr 76px 68px 32px",
            gap: "6px", padding: "8px 14px",
            background: "#f8f9ff",
            fontSize: "12px", fontWeight: "700", color: "#718096"
          }}>
            <div>순서</div>
            <div>팀명</div>
            <div>장르</div>
            <div>시간(분)</div>
            <div></div>
          </div>

          {/* 행들 
          {planRows.map(row => (
            <div key={row.id} style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 76px 68px 32px",
              gap: "6px", padding: "8px 14px",
              borderBottom: "1px solid #f5f5f5",
              alignItems: "center"
            }}>
              <div style={{
                width: "26px", height: "26px",
                background: "linear-gradient(135deg,#5b9fe8,#764ba2)",
                borderRadius: "50%", color: "white",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                fontSize: "11px", fontWeight: "700"
              }}>{row.order}</div>

              <input
                value={row.team}
                onChange={e => updatePlanRow(row.id, "team", e.target.value)}
                placeholder="팀명"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#5b9fe8"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />

              <select
                value={row.genre}
                onChange={e => updatePlanRow(row.id, "genre", e.target.value)}
                style={{
                  ...inputStyle,
                  background: row.genre === "댄스" ? "#fff0f6" : "#f0f7ff",
                }}
              >
                <option value="노래">🎤 노래</option>
                <option value="댄스">💃 댄스</option>
              </select>

              <input
                type="number" min="1" max="60"
                value={row.time}
                onChange={e => updatePlanRow(row.id, "time", e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }}
                onFocus={e => e.target.style.borderColor = "#5b9fe8"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />

              <button onClick={() => deletePlanRow(row.id)} style={{
                background: "none", border: "none",
                color: "#ccc", cursor: "pointer", fontSize: "15px"
              }}
                onMouseEnter={e => e.target.style.color = "#ff5f57"}
                onMouseLeave={e => e.target.style.color = "#ccc"}
              >✕</button>
            </div>
          ))} 

          <div style={{ padding: "10px 14px" }}>
            <button onClick={addPlanRow} style={{
              width: "100%", padding: "9px",
              background: "#f8f9ff", border: "1px dashed #c0d0f0",
              borderRadius: "8px", color: "#5b9fe8",
              fontSize: "13px", fontWeight: "700", cursor: "pointer"
            }}>
              ➕ 팀 추가
            </button>
          </div>
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={() => navigate("/equation")}
          style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg,#5b9fe8,#764ba2)",
            color: "white", border: "none",
            borderRadius: "14px", fontSize: "15px",
            fontWeight: "700", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(91,159,232,0.35)",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px"
          }}>
          다음 →
        </button>
      </div>
          <CocoChat
  systemPrompt={PROMPTS.planning}
  initialMessage="안녕! 나는 코코야 🌀&#10;연립방정식 세우는 방법이 어려우면 물어봐!"
/>
    </div>
  );
}