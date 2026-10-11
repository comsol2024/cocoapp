import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  PRACTICE_UNITS,
  PROBLEM_SETS,
  isAnswerCorrect,
} from "../data/practiceProblems";

// ── 단원 설정 ──
const UNIT_CONFIG = {
  system:       { title: "연립방정식",   emoji: "🎭", color: "#1565C0", bg: "#E3F2FD" },
  circumcenter: { title: "외심과 내심",  emoji: "🔵", color: "#E65100", bg: "#FFF3E0" },
  linear:       { title: "일차함수",     emoji: "🍱", color: "#2E7D32", bg: "#E8F5E9" },
  probability:  { title: "확률",         emoji: "⛈️", color: "#5E35B1", bg: "#EDE7F6" },
};

export default function PracticeQuiz({ user }) {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const cfg = UNIT_CONFIG[unitId] || {};
  const problems = PROBLEM_SETS[unitId] || [];
  const total = problems.length;

  const [current, setCurrent] = useState(0);
  const [inputs, setInputs] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [showSolution, setShowSolution] = useState({});
  const inputRef = useRef(null);

  const problem = problems[current] || {};
  const isSubmitted = !!submitted[current];
  const isSolShown = !!showSolution[current];
  const inputVal = inputs[current];

  // Firebase 불러오기
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "practice", unitId));
        if (snap.exists()) {
          const d = snap.data();
          if (d.inputs) setInputs(d.inputs);
          if (d.submitted) setSubmitted(d.submitted);
        }
      } catch {}
    };
    load();
  }, [user, unitId]);

  // Firebase 저장
  const save = async (newInputs, newSubmitted) => {
    if (!user?.uid) return;
    try {
      await setDoc(
        doc(db, "users", user.uid, "practice", unitId),
        { inputs: newInputs, submitted: newSubmitted, updatedAt: Date.now() },
        { merge: true }
      );
    } catch {}
  };

  // 답 제출
  const handleSubmit = () => {
    if (problem.inputType === "essay") return;
    const newSub = { ...submitted, [current]: true };
    setSubmitted(newSub);
    save(inputs, newSub);
  };

  // 다시풀기 (해당 문제만 초기화)
  const handleRetry = () => {
    const newInputs = { ...inputs };
    delete newInputs[current];
    const newSub = { ...submitted };
    delete newSub[current];
    const newSol = { ...showSolution };
    delete newSol[current];
    setInputs(newInputs);
    setSubmitted(newSub);
    setShowSolution(newSol);
    save(newInputs, newSub);
  };

  // 전체 다시하기
  const handleResetAll = () => {
    setInputs({});
    setSubmitted({});
    setShowSolution({});
    setCurrent(0);
    save({}, {});
  };

  // 단일 입력 변경
  const handleInput = (val) => {
    setInputs(prev => ({ ...prev, [current]: val }));
  };

  // pair 입력 변경
  const handlePairInput = (key, val) => {
    const prev = (typeof inputVal === "object" && inputVal !== null) ? inputVal : {};
    const newVal = { ...prev, [key]: val };
    setInputs(prevInp => ({ ...prevInp, [current]: newVal }));
  };

  // 이전/다음
  const goPrev = () => { if (current > 0) setCurrent(c => c - 1); };
  const goNext = () => { if (current < total - 1) setCurrent(c => c + 1); };

  // 상태 판별
  const getStatus = (idx) => {
    const p = problems[idx];
    if (!p) return "empty";
    if (p.inputType === "essay") {
      return showSolution[idx] ? "viewed" : "unanswered";
    }
    if (!submitted[idx]) {
      const v = inputs[idx];
      const hasInput = v && (typeof v === "object" ? (v.a || v.b) : String(v).trim());
      return hasInput ? "input" : "unanswered";
    }
    return isAnswerCorrect(inputs[idx], p) ? "correct" : "wrong";
  };

  // 전체 완료 여부
  const allDone = problems.length > 0 && problems.every((p, i) => {
    const s = getStatus(i);
    return s === "correct" || s === "wrong" || s === "viewed";
  });

  const STATUS_COLOR = {
    unanswered: { bg: "#f0f0f0", text: "#aaa",    border: "#ddd" },
    input:      { bg: "#FFF3E0", text: "#E65100",  border: "#FFB300" },
    correct:    { bg: "#E8F5E9", text: "#2E7D32",  border: "#66BB6A" },
    wrong:      { bg: "#FFEBEE", text: "#C62828",  border: "#EF9A9A" },
    viewed:     { bg: "#E3F2FD", text: "#1565C0",  border: "#90CAF9" },
  };

  const isCorrect = isSubmitted && isAnswerCorrect(inputVal, problem);

  const legend = [
    { key: "unanswered", label: "미풀이" },
    { key: "input",      label: "작성중" },
    { key: "correct",    label: "정답" },
    { key: "wrong",      label: "오답" },
    { key: "viewed",     label: "해설확인" },
  ];

  return (
    <div style={{ background: "#F5F5F7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* 헤더 */}
      <div style={{
        background: "white", padding: "22px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <button onClick={() => navigate("/practice")} style={{
          background: "none", border: "none", color: cfg.color,
          fontWeight: "700", fontSize: "22px", cursor: "pointer",
        }}>← 목록으로</button>
        <div style={{ fontWeight: "900", fontSize: "26px" }}>
          {cfg.emoji} {cfg.title}
        </div>
        <div style={{ fontSize: "22px", color: "#888", fontWeight: "700" }}>
          {current + 1} / {total}
        </div>
      </div>

      {/* 본문 */}
      <div style={{
        flex: 1, display: "flex",
        maxWidth: "1200px", width: "100%",
        margin: "0 auto", padding: "20px", gap: "20px",
        alignItems: "flex-start",
      }}>

        {/* ── 왼쪽 현황판 ── */}
        <div style={{
          width: "190px", flexShrink: 0,
          background: "white", borderRadius: "20px",
          padding: "20px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          position: "sticky", top: "80px",
        }}>
          <div style={{ fontSize: "17px", fontWeight: "800", color: "#555", marginBottom: "16px", textAlign: "center" }}>
            📋 문제 현황
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "10px", marginBottom: "20px",
          }}>
            {problems.map((_, idx) => {
              const status = getStatus(idx);
              const sc = STATUS_COLOR[status];
              const isActive = idx === current;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  style={{
                    width: "100%", aspectRatio: "1",
                    borderRadius: "12px",
                    border: isActive ? `3px solid ${cfg.color}` : `2px solid ${sc.border}`,
                    background: isActive ? cfg.bg : sc.bg,
                    color: isActive ? cfg.color : sc.text,
                    fontWeight: isActive ? "900" : "700",
                    fontSize: "20px", cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
            {legend.map(l => {
              const sc = STATUS_COLOR[l.key];
              return (
                <div key={l.key} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "5px",
                    background: sc.bg, border: `2px solid ${sc.border}`,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "16px", color: "#666" }}>{l.label}</span>
                </div>
              );
            })}
          </div>

          {/* 다시하기 버튼 */}
          <button
            onClick={allDone ? handleResetAll : undefined}
            style={{
              marginTop: "16px", width: "100%",
              padding: "14px 0", borderRadius: "12px",
              border: `2px solid ${allDone ? "#EF5350" : "#E0E0E0"}`,
              background: allDone ? "#FFEBEE" : "#F5F5F5",
              color: allDone ? "#C62828" : "#BDBDBD",
              fontSize: "17px", fontWeight: "800",
              cursor: allDone ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            🔄 전체 다시하기
          </button>
        </div>

        {/* ── 오른쪽 문제 카드 ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: "white", borderRadius: "24px",
            padding: "36px 36px 28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>
            {/* 문제 번호 + 유형 */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{
                background: cfg.bg, color: cfg.color,
                fontWeight: "900", fontSize: "28px",
                width: "68px", height: "68px", borderRadius: "18px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {current + 1}
              </div>
              <div>
                <div style={{ fontSize: "19px", color: "#888", fontWeight: "600" }}>{problem.type}</div>
                <div style={{ fontSize: "16px", color: "#bbb", marginTop: "2px" }}>
                  {problem.inputType === "essay"  ? "서술형 (해설 확인)" :
                   problem.inputType === "pair"   ? "두 값 입력" :
                   problem.inputType === "text"   ? "분수/텍스트 입력" : "숫자 입력"}
                </div>
              </div>
            </div>

            {/* 문제 본문 */}
            <div style={{
              fontSize: "21px", lineHeight: "2.1", color: "#222",
              whiteSpace: "pre-wrap", background: "#FAFAFA",
              borderRadius: "16px", padding: "26px 28px",
              marginBottom: "28px", border: "1px solid #f0f0f0",
            }}>
              {problem.question}
            </div>

            {/* 문제 이미지 (image 필드가 있을 때만 표시) */}
            {problem.image && (
              <div style={{
                marginBottom: "28px", textAlign: "center",
                background: "#FAFAFA", borderRadius: "16px",
                padding: "20px", border: "1px solid #f0f0f0",
              }}>
                <img
                  src={problem.image}
                  alt="문제 그림"
                  style={{
                    maxWidth: "100%", maxHeight: "360px",
                    borderRadius: "10px", objectFit: "contain",
                  }}
                />
              </div>
            )}

            {/* ── 입력 영역 ── */}
            {problem.inputType === "essay" ? (
              <div style={{
                background: "#F8F9FF", borderRadius: "14px",
                padding: "24px 26px", marginBottom: "24px",
                border: "2px dashed #C5CAE9",
                fontSize: "19px", color: "#5C6BC0", lineHeight: "1.9",
              }}>
                ✏️ 이 문제는 서술형입니다.<br />
                직접 풀어본 뒤 아래 <strong>해설보기</strong> 버튼을 눌러 답을 확인하세요.
              </div>
            ) : problem.inputType === "pair" ? (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#555", marginBottom: "14px" }}>
                  📝 두 값을 각각 입력하세요
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {(problem.pairLabels || ["첫 번째 값", "두 번째 값"]).map((label, li) => {
                    const key = li === 0 ? "a" : "b";
                    const pairObj = (typeof inputVal === "object" && inputVal) ? inputVal : {};
                    return (
                      <div key={li} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{
                          fontSize: "18px", fontWeight: "700", color: cfg.color,
                          width: "200px", flexShrink: 0,
                        }}>
                          {label}
                        </div>
                        <input
                          type="text"
                          value={pairObj[key] || ""}
                          disabled={isSubmitted}
                          onChange={e => handlePairInput(key, e.target.value)}
                          placeholder="숫자 입력"
                          style={{
                            flex: 1, padding: "14px 18px",
                            borderRadius: "12px",
                            border: `2px solid ${isSubmitted
                              ? (isCorrect ? "#66BB6A" : "#EF9A9A")
                              : (pairObj[key] ? cfg.color + "88" : "#E0E0E0")}`,
                            fontSize: "20px", outline: "none",
                            background: isSubmitted ? "#FAFAFA" : "white",
                            color: "#222",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#555", marginBottom: "14px" }}>
                  📝 답을 입력하세요
                  {problem.inputType === "text" && (
                    <span style={{ color: "#aaa", fontWeight: "500", marginLeft: "10px" }}>
                      (분수는 예: 2/5 형태로)
                    </span>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type={problem.inputType === "number" ? "number" : "text"}
                  value={typeof inputVal === "string" || typeof inputVal === "number" ? inputVal : ""}
                  disabled={isSubmitted}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !isSubmitted) handleSubmit(); }}
                  placeholder={problem.placeholder || (problem.inputType === "number" ? "숫자 입력" : "답 입력")}
                  style={{
                    width: "100%", padding: "16px 20px",
                    borderRadius: "14px",
                    border: `2px solid ${isSubmitted
                      ? (isCorrect ? "#66BB6A" : "#EF9A9A")
                      : (inputVal ? cfg.color + "88" : "#E0E0E0")}`,
                    fontSize: "22px", outline: "none",
                    background: isSubmitted ? "#FAFAFA" : "white",
                    color: "#222", boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* 제출 결과 */}
            {isSubmitted && problem.inputType !== "essay" && (
              <div style={{
                background: isCorrect ? "#E8F5E9" : "#FFEBEE",
                border: `2px solid ${isCorrect ? "#A5D6A7" : "#FFCDD2"}`,
                borderRadius: "14px", padding: "16px 20px",
                marginBottom: "20px", fontSize: "20px",
                fontWeight: "700", color: isCorrect ? "#2E7D32" : "#C62828",
              }}>
                {isCorrect ? "✅ 정답이에요!" : `❌ 틀렸어요. 정답: ${problem.answer}`}
              </div>
            )}

            {/* 버튼 영역 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* 제출하기 */}
              {problem.inputType !== "essay" && !isSubmitted && (
                <button
                  onClick={handleSubmit}
                  style={{
                    width: "100%", padding: "20px",
                    borderRadius: "16px", border: "none",
                    background: cfg.color, color: "white",
                    fontSize: "22px", fontWeight: "800", cursor: "pointer",
                  }}
                >
                  제출하기
                </button>
              )}

              {/* 제출 후 버튼 row: 다시풀기 + 해설보기 */}
              {(isSubmitted || problem.inputType === "essay") && (
                <div style={{ display: "flex", gap: "12px" }}>
                  {/* 다시풀기 (essay 제외) */}
                  {problem.inputType !== "essay" && (
                    <button
                      onClick={handleRetry}
                      style={{
                        flex: 1, padding: "18px",
                        borderRadius: "14px",
                        border: "2.5px solid #FF8F00",
                        background: "white",
                        color: "#FF8F00",
                        fontSize: "20px", fontWeight: "700", cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      🔁 다시풀기
                    </button>
                  )}

                  {/* 해설보기 */}
                  <button
                    onClick={() => {
                      const newSol = { ...showSolution, [current]: !isSolShown };
                      setShowSolution(newSol);
                      if (problem.inputType === "essay" && !isSolShown) {
                        const newSub = { ...submitted, [current]: true };
                        setSubmitted(newSub);
                        save(inputs, newSub);
                      }
                    }}
                    style={{
                      flex: 1, padding: "18px",
                      borderRadius: "14px",
                      border: `2.5px solid ${cfg.color}`,
                      background: isSolShown ? cfg.color : "white",
                      color: isSolShown ? "white" : cfg.color,
                      fontSize: "20px", fontWeight: "700", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSolShown ? "해설 닫기 ▲" : "해설보기 ▼"}
                  </button>
                </div>
              )}
            </div>

            {/* 해설 패널 */}
            {isSolShown && problem.solution && (
              <div style={{
                marginTop: "20px", background: "#F8F9FF",
                borderRadius: "16px", padding: "24px 28px",
                border: `2px solid ${cfg.color}33`,
              }}>
                <div style={{ fontSize: "20px", fontWeight: "800", color: cfg.color, marginBottom: "14px" }}>
                  💡 해설
                </div>
                <div style={{
                  fontSize: "19px", lineHeight: "2.1",
                  color: "#333", whiteSpace: "pre-wrap",
                }}>
                  {problem.solution}
                </div>
                {problem.answer && (
                  <div style={{
                    marginTop: "18px", padding: "14px 18px",
                    background: cfg.bg, borderRadius: "12px",
                    fontSize: "20px", fontWeight: "800", color: cfg.color,
                  }}>
                    ✅ 정답: {problem.answer}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 이전 / 다음 버튼 ── */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginTop: "20px", gap: "14px",
          }}>
            <button
              onClick={goPrev}
              disabled={current === 0}
              style={{
                flex: 1, padding: "20px", borderRadius: "16px",
                border: `2.5px solid ${current === 0 ? "#E0E0E0" : cfg.color}`,
                background: current === 0 ? "#F5F5F5" : "white",
                color: current === 0 ? "#BDBDBD" : cfg.color,
                fontSize: "22px", fontWeight: "800",
                cursor: current === 0 ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              ← 이전 문제
            </button>
            <div style={{ fontSize: "20px", color: "#aaa", fontWeight: "700", whiteSpace: "nowrap" }}>
              {current + 1} / {total}
            </div>
            <button
              onClick={goNext}
              disabled={current === total - 1}
              style={{
                flex: 1, padding: "20px", borderRadius: "16px",
                border: `2.5px solid ${current === total - 1 ? "#E0E0E0" : cfg.color}`,
                background: current === total - 1 ? "#F5F5F5" : cfg.color,
                color: current === total - 1 ? "#BDBDBD" : "white",
                fontSize: "22px", fontWeight: "800",
                cursor: current === total - 1 ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              다음 문제 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}