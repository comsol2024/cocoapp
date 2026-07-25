import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import CocoChat from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";
import {
  PRACTICE_UNITS,
  PROBLEM_SETS,
  isAnswerCorrect,
} from "../data/practiceProblems";

// 단원별로 재사용할 기존 코코 프롬프트 매핑
// (이미 만들어둔 각 챕터 프롬프트를 그대로 활용)
const PROMPT_MAP = {
  system: PROMPTS.equation, // 연립방정식 챕터 프롬프트 재사용
  linear: PROMPTS.lunch,    // 일차함수(급식) 챕터 프롬프트 재사용
  probability: PROMPTS.rain, // 확률(비) 챕터 프롬프트 재사용
};

export default function PracticeQuiz({ user }) {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const unitConfig = PRACTICE_UNITS.find(u => u.id === unitId);
  const problems   = PROBLEM_SETS[unitId] || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults]           = useState({}); // {0:"first"|"hint"}
  const [input, setInput]               = useState("");
  const [status, setStatus]             = useState("idle"); // idle|correct|wrong|hint
  const [loaded, setLoaded]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [view, setView]                 = useState("quiz"); // quiz|completed

  // ── 진행 상황 불러오기 ──
  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !unitId) return;
      const snap = await getDoc(doc(db, "users", user.uid, "practice", unitId));
      if (snap.exists()) {
        const d = snap.data();
        if (d.results) setResults(d.results);
        if (d.completed) {
          setView("completed");
        } else if (typeof d.currentIndex === "number") {
          setCurrentIndex(d.currentIndex);
        }
      }
      setLoaded(true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  // ── 진행 상황 자동 저장 ──
  useEffect(() => {
    if (!loaded || !user?.uid || !unitId) return;
    const t = setTimeout(async () => {
      await setDoc(
        doc(db, "users", user.uid, "practice", unitId),
        {
          currentIndex,
          results,
          completed: view === "completed",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, results, view, loaded]);

  if (!unitConfig || problems.length === 0) {
    return (
      <div style={{ padding:"40px", textAlign:"center" }}>
        <p>존재하지 않는 단원이에요.</p>
        <button onClick={()=>navigate("/practice")}>← 연습문제 목록으로</button>
      </div>
    );
  }

  const problem = problems[currentIndex];
  const color   = unitConfig.color;

  const handleCheck = () => {
    if (!input.trim()) return;
    if (isAnswerCorrect(input, problem)) {
      setStatus("correct");
      setResults(prev => ({
        ...prev,
        [currentIndex]: prev[currentIndex] === "hint" ? "hint" : "first",
      }));
    } else {
      setStatus("wrong");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setInput("");
  };

  const handleShowHint = () => {
    setStatus("hint");
    setResults(prev => ({ ...prev, [currentIndex]: "hint" }));
  };

  const handleNext = () => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex(i => i + 1);
      setInput("");
      setStatus("idle");
    } else {
      setView("completed");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("처음부터 다시 풀까요? 저장된 기록이 초기화돼요.")) return;
    setCurrentIndex(0);
    setResults({});
    setInput("");
    setStatus("idle");
    setView("quiz");
  };

  const inp = {
    padding:"12px 16px", borderRadius:"12px",
    border:"2px solid #e2e8f0", fontSize:"18px",
    outline:"none", width:"100%", boxSizing:"border-box",
    fontFamily:"Courier New",
  };

  // ── 완료 화면 ──
  if (view === "completed") {
    const firstCount = Object.values(results).filter(r => r === "first").length;
    const hintCount  = Object.values(results).filter(r => r === "hint").length;

    return (
      <div style={{
        background:`linear-gradient(180deg,${unitConfig.bg},white)`,
        minHeight:"100vh", display:"flex", alignItems:"center",
        justifyContent:"center", padding:"20px"
      }}>
        <div style={{
          background:"white", borderRadius:"24px",
          padding:"36px 30px", maxWidth:"420px", width:"100%",
          textAlign:"center", boxShadow:"0 12px 40px rgba(0,0,0,0.15)"
        }}>
          <div style={{ fontSize:"56px", marginBottom:"10px" }}>🎉</div>
          <div style={{ fontSize:"22px", fontWeight:"900", marginBottom:"6px" }}>
            {unitConfig.title} 완료!
          </div>
          <div style={{ fontSize:"18px", color:"#888", marginBottom:"24px" }}>
            10문제를 모두 풀었어요
          </div>

          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px",
            marginBottom:"24px"
          }}>
            <div style={{ background:"#E8F5E9", borderRadius:"14px", padding:"16px" }}>
              <div style={{ fontSize:"24px", fontWeight:"900", color:"#2E7D32" }}>
                {firstCount}
              </div>
              <div style={{ fontSize:"18px", color:"#555" }}>한 번에 맞춤 ✅</div>
            </div>
            <div style={{ background:"#FFF3E0", borderRadius:"14px", padding:"16px" }}>
              <div style={{ fontSize:"24px", fontWeight:"900", color:"#E65100" }}>
                {hintCount}
              </div>
              <div style={{ fontSize:"18px", color:"#555" }}>힌트 보고 맞춤 💡</div>
            </div>
          </div>

          <button onClick={handleReset} style={{
            width:"100%", padding:"14px", marginBottom:"10px",
            background:`linear-gradient(135deg,${color},${color}cc)`,
            color:"white", border:"none", borderRadius:"14px",
            fontSize:"17px", fontWeight:"700", padding:"14px 28px", cursor:"pointer"
          }}>
            🔄 다시 풀기
          </button>
          <button onClick={()=>navigate("/practice")} style={{
            width:"100%", padding:"12px",
            background:"white", border:"1.5px solid #e2e8f0",
            borderRadius:"14px", fontSize:"18px",
            fontWeight:"700", color:"#666", cursor:"pointer"
          }}>
            ✏️ 다른 단원 풀기
          </button>
        </div>
      </div>
    );
  }

  // ── 퀴즈 화면 ──
  return (
    <div style={{
      background:`linear-gradient(180deg,${unitConfig.bg},white)`,
      minHeight:"100vh"
    }}>
      {/* 헤더 */}
      <div style={{
        background:"white", padding:"12px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/practice")} style={{
          background:"none", border:"none", color,
          fontWeight:"700", fontSize:"18px", cursor:"pointer"
        }}>← 단원 선택</button>
        <div style={{ fontWeight:"900", fontSize:"18px" }}>
          {unitConfig.emoji} {unitConfig.title} 연습문제
        </div>
        <div style={{ fontSize:"18px", fontWeight:"600",
          color: saved ? "#34a853" : "#bbb" }}>
          {saved ? "✓ 저장됨" : ""}
        </div>
      </div>

      <div style={{ padding:"20px 20px 100px", maxWidth:"600px", margin:"0 auto" }}>

        {/* 진행 표시 */}
        <div style={{ display:"flex", gap:"5px", marginBottom:"18px" }}>
          {problems.map((_, i) => (
            <div key={i} style={{
              flex:1, height:"7px", borderRadius:"4px",
              background:
                i === currentIndex ? color :
                results[i] === "first" ? "#66BB6A" :
                results[i] === "hint"  ? "#FFB74D" :
                "#e0e0e0",
              transition:"all 0.3s"
            }}/>
          ))}
        </div>
        <div style={{ fontSize:"18px", color:"#888", marginBottom:"16px",
          textAlign:"right" }}>
          {currentIndex + 1} / {problems.length} 문제
        </div>

        {/* 문제 카드 */}
        <div style={{
          background:"white", borderRadius:"18px",
          padding:"24px 22px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)",
          marginBottom:"16px"
        }}>
          <div style={{
            display:"inline-block",
            background: unitConfig.bg, color,
            fontSize:"18px", fontWeight:"700",
            padding:"4px 12px", borderRadius:"20px",
            marginBottom:"14px"
          }}>
            {problem.type}
          </div>

          <div style={{
            fontSize:"20px", lineHeight:"2",
            color:"#2D3748", whiteSpace:"pre-line",
            marginBottom:"20px"
          }}>
            {problem.question}
          </div>

          {/* 입력창 */}
          <div style={{ display:"flex", gap:"10px", marginBottom:"6px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && status === "idle" && handleCheck()}
              disabled={status === "correct"}
              placeholder="답을 입력해줘! (예: 8000, 7/3, 0.4 등)"
              style={{
                ...inp,
                borderColor:
                  status === "correct" ? "#66BB6A" :
                  status === "wrong"   ? "#EF5350" : "#e2e8f0",
                background: status === "correct" ? "#F1F8E9" : "white",
              }}
            />
            {status === "idle" && (
              <button
                onClick={handleNext}
                style={{
                  position:"fixed",
                  bottom:"170px",   // 코코 챗봇 버튼 위에 오도록
                  right:"670px",
                  background:"rgba(38, 165, 197, 0.92)",
                  border:"1.5px solid #e2e8f0",
                  borderRadius:"20px",
                  padding:"10px 18px",
                  fontSize:"20px", fontWeight:"700",
                  color:"#ffffff", cursor:"pointer",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.1)",
                  zIndex:35,
                  backdropFilter:"blur(8px)",
                  whiteSpace:"nowrap"
                }}
              >
                다음 문제 
              </button>
            )}
          </div>

          {/* 정답 상태 */}
          {status === "correct" && (
            <div style={{ marginTop:"14px" }}>
              <div style={{
                background:"#E8F5E9", borderRadius:"12px",
                padding:"14px 16px", color:"#2E7D32",
                fontWeight:"800", fontSize:"18px",
                textAlign:"center", marginBottom:"10px"
              }}>
                🎉 정답입니다!
              </div>
              <button onClick={handleNext} style={{
                width:"100%", padding:"13px",
                background:`linear-gradient(135deg,${color},${color}cc)`,
                color:"white", border:"none", borderRadius:"12px",
                fontSize:"17px", fontWeight:"700", padding:"14px 28px", cursor:"pointer"
              }}>
                {currentIndex < problems.length - 1 ? "다음 문제 →" : "결과 보기 🎉"}
              </button>
            </div>
          )}

          {/* 오답 상태 */}
          {status === "wrong" && (
            <div style={{ marginTop:"14px" }}>
              <div style={{
                background:"#FFEBEE", borderRadius:"12px",
                padding:"12px 16px", color:"#C62828",
                fontWeight:"700", fontSize:"18px",
                textAlign:"center", marginBottom:"10px"
              }}>
                ❌ 아직 정답이 아니에요!
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <button onClick={handleRetry} style={{
                  padding:"12px", background:"white",
                  border:"1.5px solid #e2e8f0", borderRadius:"12px",
                  fontSize:"18px", fontWeight:"700", color:"#555", cursor:"pointer"
                }}>
                  🔁 다시 풀기
                </button>
                <button onClick={handleShowHint} style={{
                  padding:"12px",
                  background:"linear-gradient(135deg,#FF8F00,#E65100)",
                  color:"white", border:"none", borderRadius:"12px",
                  fontSize:"18px", fontWeight:"700", cursor:"pointer"
                }}>
                  💡 힌트 확인
                </button>
              </div>
            </div>
          )}

          {/* 힌트 + 정답 공개 */}
          {status === "hint" && (
            <div style={{ marginTop:"14px" }}>
              <div style={{
                background:"#FFF8E1", borderRadius:"12px",
                padding:"14px 16px", marginBottom:"10px",
                border:"1.5px solid #FFE082"
              }}>
                <div style={{ fontSize:"18px", fontWeight:"800",
                  color:"#E65100", marginBottom:"6px" }}>
                  💡 힌트
                </div>
                <div style={{ fontSize:"18px", color:"#555", lineHeight:"1.8" }}>
                  {problem.hint}
                </div>
              </div>

              <div style={{
                background:"#E3F2FD", borderRadius:"12px",
                padding:"14px 16px", marginBottom:"12px",
                border:"1.5px solid #90CAF9"
              }}>
                <div style={{ fontSize:"18px", fontWeight:"800",
                  color:"#1565C0", marginBottom:"6px" }}>
                  📌 정답
                </div>
                <div style={{ fontSize:"18px", color:"#333",
                  lineHeight:"1.8", fontWeight:"600" }}>
                  {problem.answer}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <button onClick={handleRetry} style={{
                  padding:"12px", background:"white",
                  border:"1.5px solid #e2e8f0", borderRadius:"12px",
                  fontSize:"18px", fontWeight:"700", color:"#555", cursor:"pointer"
                }}>
                  🔁 다시 풀어보기
                </button>
                <button onClick={handleNext} style={{
                  padding:"12px",
                  background:`linear-gradient(135deg,${color},${color}cc)`,
                  color:"white", border:"none", borderRadius:"12px",
                  fontSize:"18px", fontWeight:"700", cursor:"pointer"
                }}>
                  {currentIndex < problems.length - 1 ? "다음 문제 →" : "결과 보기 🎉"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CocoChat
        systemPrompt={PROMPT_MAP[unitId] || PROMPTS.equation}
        initialMessage={`안녕! 나는 코코야 🌀\n${unitConfig.title} 문제 풀다가 막히면 언제든 물어봐!`}
        bottomOffset="24px"
      />
    </div>
  );
}
