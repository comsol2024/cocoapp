import { useState } from "react";
import { useNavigate } from "react-router-dom";

const GRADE_OPTIONS = ["중1", "중2", "중3", "고1", "고2", "고3"];
const SUBJECT_OPTIONS = ["수학", "과학", "사회", "국어", "영어", "역사", "기술가정", "미술", "음악", "체육"];

export default function LessonDesign() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    schoolLevel: "중학교",
    grade: "중2",
    subject: "수학",
    topic: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const callGemini = async (prompt) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  const generate = async () => {
    if (!form.topic.trim()) return setError("단원/주제를 입력해주세요!");
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const base = `
당신은 IB 교육 전문가이자 2022 개정 교육과정 전문가입니다.
학교급: ${form.schoolLevel}, 학년: ${form.grade}, 교과: ${form.subject}, 단원/주제: ${form.topic}
`;

      const prompt1 = base + `
아래 5개 섹션만 작성하세요. 각 섹션은 반드시 ## 제목으로 시작하세요.

## 핵심 아이디어
2022 개정 교육과정의 핵심 아이디어를 2~3개 작성해주세요.

## 성취기준
관련 2022 개정 교육과정 성취기준 코드와 내용을 2~3개 작성해주세요.

## 내용체계
지식·이해 / 과정·기능 / 가치·태도로 나누어 각 2~3개씩 작성해주세요.

## 핵심어
단원과 관련된 핵심어를 5~7개 나열해주세요.

## 탐구 질문
- 사실적 질문 (Factual): 2개
- 개념적 질문 (Conceptual): 2개
- 논쟁적 질문 (Debatable): 1개
`;

      const prompt2 = base + `
아래 6개 섹션만 작성하세요. 각 섹션은 반드시 ## 제목으로 시작하세요.

## 수업 차시별 흐름
총 6~8차시로 구성하세요. 각 차시마다 차시번호, 주제, 주요활동, 수업형태를 작성해주세요.

## 평가 요소
평가할 핵심 요소를 3~4개 작성해주세요.

## 평가 과제 (GRASPS)
- Goal(목표):
- Role(역할):
- Audience(청중):
- Situation(상황):
- Product(산출물):
- Standards(기준):

## 평가 기준 (루브릭)
수행 수준을 탁월/우수/보통/미흡 4단계로 나누어 루브릭을 작성해주세요.

## 평가 과제 외 평가
형성평가, 관찰평가, 자기평가 등 다양한 평가 방법을 2~3개 제안해주세요.

## COCO Class 도구 추천
이 수업에서 활용할 수 있는 COCO Class 도구(카메라, 녹음, 메모, 외부링크 등)와
활용 방법을 구체적으로 제안해주세요.
`;

      const [text1, text2] = await Promise.all([
        callGemini(prompt1),
        callGemini(prompt2),
      ]);

      setResult(parseResult(text1 + "\n" + text2));

    } catch (e) {
      setError(`오류: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseResult = (text) => {
    const sections = [
      "핵심 아이디어", "성취기준", "내용체계", "핵심어",
      "탐구 질문", "수업 차시별 흐름", "평가 요소",
      "평가 과제 (GRASPS)", "평가 기준 (루브릭)",
      "평가 과제 외 평가", "COCO Class 도구 추천"
    ];
    const result = {};
    sections.forEach((sec, i) => {
      const next = sections[i + 1];
      const regex = next
        ? new RegExp(`## ${sec}([\\s\\S]*?)## ${next}`)
        : new RegExp(`## ${sec}([\\s\\S]*?)$`);
      const match = text.match(regex);
      result[sec] = match ? match[1].trim() : "";
    });
    return result;
  };

  const sectionConfig = [
    { key: "핵심 아이디어",        icon: "💡", color: "#fff8e1", border: "#ffe082" },
    { key: "성취기준",             icon: "📋", color: "#e8f5e9", border: "#a5d6a7" },
    { key: "내용체계",             icon: "🗂",  color: "#e3f2fd", border: "#90caf9" },
    { key: "핵심어",               icon: "🔑", color: "#f3e5f5", border: "#ce93d8" },
    { key: "탐구 질문",            icon: "❓", color: "#e0f7fa", border: "#80deea" },
    { key: "수업 차시별 흐름",     icon: "📅", color: "#fff3e0", border: "#ffcc02" },
    { key: "평가 요소",            icon: "🎯", color: "#fce4ec", border: "#f48fb1" },
    { key: "평가 과제 (GRASPS)",   icon: "📝", color: "#e8eaf6", border: "#9fa8da" },
    { key: "평가 기준 (루브릭)",   icon: "📊", color: "#e0f2f1", border: "#80cbc4" },
    { key: "평가 과제 외 평가",    icon: "➕", color: "#f1f8e9", border: "#aed581" },
    { key: "COCO Class 도구 추천", icon: "🌀", color: "#ede7f6", border: "#b39ddb" },
  ];

  return (
    <div className="coco-app">
      {/* 헤더 */}
      <div className="coco-header">
        <div className="coco-logo">🌀 COCO</div>
        <button onClick={() => navigate("/map")}
          style={{ background:"none", border:"none", color:"var(--primary-dark)",
            fontSize:"14px", cursor:"pointer", fontWeight:"600" }}>
          ← 홈으로
        </button>
      </div>

      <div style={{ padding:"4px 24px 16px" }}>
        <div style={{ fontSize:"20px", fontWeight:"900" }}>🧠 AI 수업 설계</div>
        <div style={{ fontSize:"13px", color:"var(--text-muted)", marginTop:"2px" }}>
          IB + 2022 개정교육과정 기반 수업 설계안을 자동 생성해요
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="clay-card" style={{ margin:"0 24px 20px", padding:"24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
          <div>
            <label style={{ fontSize:"12px", fontWeight:"700", color:"var(--text-muted)",
              display:"block", marginBottom:"6px" }}>학교급</label>
            <select value={form.schoolLevel} onChange={e => handleChange("schoolLevel", e.target.value)}
              className="coco-input" style={{ width:"100%" }}>
              <option>중학교</option>
              <option>고등학교</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize:"12px", fontWeight:"700", color:"var(--text-muted)",
              display:"block", marginBottom:"6px" }}>학년</label>
            <select value={form.grade} onChange={e => handleChange("grade", e.target.value)}
              className="coco-input" style={{ width:"100%" }}>
              {GRADE_OPTIONS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize:"12px", fontWeight:"700", color:"var(--text-muted)",
              display:"block", marginBottom:"6px" }}>교과</label>
            <select value={form.subject} onChange={e => handleChange("subject", e.target.value)}
              className="coco-input" style={{ width:"100%" }}>
              {SUBJECT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize:"12px", fontWeight:"700", color:"var(--text-muted)",
              display:"block", marginBottom:"6px" }}>단원 / 주제</label>
            <input className="coco-input" value={form.topic}
              onChange={e => handleChange("topic", e.target.value)}
              placeholder="예: 일차함수와 그래프"
              onKeyDown={e => e.key === "Enter" && generate()} />
          </div>
        </div>

        {error && (
          <p style={{ color:"#e53e3e", fontSize:"13px", marginBottom:"10px", textAlign:"center" }}>
            {error}
          </p>
        )}

        <button className="coco-btn full" onClick={generate} disabled={loading}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
          {loading ? (
            <>
              <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>🌀</span>
              수업 설계안 생성 중... (30초 정도 걸려요)
            </>
          ) : (
            <>🧠 수업 설계안 자동 생성</>
          )}
        </button>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>

      {/* 결과 */}
      {result && (
        <div style={{ padding:"0 24px 100px" }}>
          {/* 제목 배지 */}
          <div style={{ textAlign:"center", marginBottom:"20px" }}>
            <div style={{
              display:"inline-block",
              background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
              color:"white", padding:"10px 24px", borderRadius:"20px",
              fontSize:"15px", fontWeight:"700"
            }}>
              {form.grade} {form.subject} · {form.topic}
            </div>
          </div>

          {sectionConfig.map(({ key, icon, color, border }) => (
            result[key] ? (
              <div key={key} className="clay-card"
                style={{
                  marginBottom:"16px", background:color,
                  borderLeft:`4px solid ${border}`,
                  borderRadius:"16px", overflow:"hidden"
                }}>
                <div style={{
                  padding:"16px 20px 12px",
                  borderBottom:`1px solid ${border}40`
                }}>
                  <div style={{ fontWeight:"800", fontSize:"15px" }}>
                    {icon} {key}
                  </div>
                </div>
                <div style={{
                  padding:"16px 20px",
                  fontSize:"14px", lineHeight:"1.8",
                  whiteSpace:"pre-wrap", color:"var(--text)"
                }}>
                  {result[key]}
                </div>
              </div>
            ) : null
          ))}

          {/* 다운로드 버튼 */}
          <button className="coco-btn full"
            onClick={() => {
              const text = sectionConfig
                .map(s => `## ${s.key}\n${result[s.key]}`)
                .join("\n\n");
              const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `COCO_수업설계_${form.topic}.txt`;
              a.click();
            }}
            style={{ marginBottom:"16px" }}>
            💾 설계안 다운로드
          </button>
        </div>
      )}
    </div>
  );
}