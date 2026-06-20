import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import html2canvas from "html2canvas";
import CocoChat    from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";

const PADLET_URL = "https://padlet.com/comsol2024/coco_1_festival";
const TOTAL = 60;
const PALETTE = [
  "#5b9fe8","#ab47bc","#26a69a","#ef5350","#ff7043",
  "#66bb6a","#ffa726","#8d6e63","#78909c","#ec407a",
  "#29b6f6","#d4e157","#ffca28","#42a5f5","#26c6da",
];
const CATEGORY_PRESETS = ["공연","무대준비","퀴즈타임","기타"];

export default function EquationPage({ user }) {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [varX, setVarX]         = useState("");
  const [varY, setVarY]         = useState("");
  const [eq1, setEq1]           = useState("");
  const [reason1, setReason1]   = useState("");
  const [eq2, setEq2]           = useState("");
  const [reason2, setReason2]   = useState("");
  const [solution, setSolution] = useState("");
  const [ansX, setAnsX]         = useState("");
  const [ansY, setAnsY]         = useState("");

  const [timeRows, setTimeRows] = useState([
    { id:1, order:1, label:"", category:"공연",  time:0, color:"#5b9fe8" },
    { id:2, order:2, label:"", category:"대기",  time:0, color:"#ffa726" },
  ]);
  const [openPalette, setOpenPalette] = useState(null);

  const [saved, setSaved]         = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid, "chapters", "equation"));
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.varX)     setVarX(d.varX);
      if (d.varY)     setVarY(d.varY);
      if (d.eq1)      setEq1(d.eq1);
      if (d.reason1)  setReason1(d.reason1);
      if (d.eq2)      setEq2(d.eq2);
      if (d.reason2)  setReason2(d.reason2);
      if (d.solution) setSolution(d.solution);
      if (d.ansX)     setAnsX(d.ansX);
      if (d.ansY)     setAnsY(d.ansY);
      if (d.timeRows) setTimeRows(d.timeRows);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      await setDoc(
        doc(db, "users", user.uid, "chapters", "equation"),
        { varX, varY, eq1, reason1, eq2, reason2,
          solution, ansX, ansY, timeRows,
          updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varX, varY, eq1, reason1, eq2, reason2, solution, ansX, ansY, timeRows]);

  const addTimeRow = () => {
    const usedColors = timeRows.map(r => r.color);
    const nextColor = PALETTE.find(c => !usedColors.includes(c)) || PALETTE[timeRows.length % PALETTE.length];
    setTimeRows(p => [...p, {
      id: Date.now(), order: p.length + 1,
      label: "", category: "공연", time: 0, color: nextColor
    }]);
  };
  const updateTimeRow = (id, k, v) =>
    setTimeRows(p => p.map(r => r.id === id
      ? { ...r, [k]: k === "time" ? Number(v) : v } : r));
  const deleteTimeRow = (id) =>
    setTimeRows(p => p.filter(r => r.id !== id)
      .map((r, i) => ({ ...r, order: i + 1 })));

  const totalTime = timeRows.reduce((s, r) => s + (r.time || 0), 0);

  const handleCapture = async () => {
    if (!contentRef.current) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#f0f7ff"
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `COCO_공연기획_${new Date().toLocaleDateString("ko")}.png`;
      link.click();
      if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const tab = window.open();
        if (tab) {
          tab.document.write(`<img src="${dataUrl}" style="max-width:100%;"/>`);
          tab.document.title = "길게 눌러서 저장하세요";
        }
      }
    } catch { alert("캡처에 실패했어요!"); }
    finally { setCapturing(false); }
  };

  const inp = (extra = {}) => ({
    padding: "8px 11px", borderRadius: "9px",
    border: "1px solid #e2e8f0", fontSize: "13px",
    outline: "none", width: "100%", boxSizing: "border-box",
    fontFamily: "inherit", background: "white",
    transition: "border-color 0.2s", ...extra
  });

  const onFocus = e => e.target.style.borderColor = "#5b9fe8";
  const onBlur  = e => e.target.style.borderColor = "#e2e8f0";

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg,#f0f7ff,#e8f4fd)",
      overflow: "hidden"
    }}
      onClick={() => setOpenPalette(null)}
    >

      {/* 헤더 */}
      <div style={{
        background: "white", padding: "11px 24px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)", flexShrink: 0
      }}>
        <button onClick={() => navigate("/planning")} style={{
          background: "none", border: "none",
          color: "#5b9fe8", fontWeight: "700",
          fontSize: "14px", cursor: "pointer"
        }}>← 뒤로</button>
        <div style={{ fontWeight: "900", fontSize: "15px" }}>
          📐 해결하기 & 공연 타임테이블
        </div>
        <div style={{
          fontSize: "12px", fontWeight: "600",
          color: saved ? "#34a853" : "#bbb"
        }}>
          {saved ? "✓ 저장됨" : "저장 중..."}
        </div>
      </div>

      {/* 2열 메인 — 여백 추가 */}
      <div ref={contentRef} style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px", padding: "16px 24px",
        overflow: "hidden", minHeight: 0
      }}>

        {/* ── 왼쪽: 연립방정식 ── */}
        <div style={{
          background: "white", borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          display: "flex", flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "12px 18px",
            borderBottom: "1px solid #f0f0f0",
            fontWeight: "900", fontSize: "14px", flexShrink: 0,
            background: "linear-gradient(90deg,#f0f7ff,white)"
          }}>
            📐 연립방정식 세우기
          </div>

          <div style={{
            flex: 1, overflowY: "auto",
            padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>

            {/* 변수 정의 */}
            <div style={{
              background: "#f8f9ff", borderRadius: "12px",
              padding: "10px 14px",
              display: "flex", gap: "8px",
              alignItems: "center", flexWrap: "wrap"
            }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#718096" }}>
                변수:
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>x =</span>
              <input value={varX} onChange={e => setVarX(e.target.value)}
                style={{ ...inp(), width: "120px" }}
                onFocus={onFocus} onBlur={onBlur} />
              <span style={{ fontSize: "13px", fontWeight: "700" }}>, y =</span>
              <input value={varY} onChange={e => setVarY(e.target.value)}
                style={{ ...inp(), width: "120px" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* 식 ① */}
            <div style={{
              border: "1px solid #bbdefb",
              borderRadius: "12px", overflow: "hidden"
            }}>
              <div style={{
                background: "#e3f2fd", padding: "7px 14px",
                fontSize: "12px", fontWeight: "700", color: "#1565C0"
              }}>식 ①</div>
              <div style={{ padding: "10px 14px",
                display: "flex", flexDirection: "column", gap: "8px" }}>
                <input value={eq1} onChange={e => setEq1(e.target.value)}
                  placeholder="수식으로 작성하세요. ex) x+y=1"
                  style={{ ...inp(), fontFamily:"Courier New", fontSize:"15px" }}
                  onFocus={onFocus} onBlur={onBlur} />
                <textarea value={reason1} onChange={e => setReason1(e.target.value)}
                  placeholder="이 식을 세운 이유..."
                  style={{ ...inp(), minHeight:"52px", resize:"none",
                    lineHeight:"1.5", fontSize:"12px" }}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* 식 ② */}
            <div style={{
              border: "1px solid #e1bee7",
              borderRadius: "12px", overflow: "hidden"
            }}>
              <div style={{
                background: "#f3e5f5", padding: "7px 14px",
                fontSize: "12px", fontWeight: "700", color: "#6A1B9A"
              }}>식 ②</div>
              <div style={{ padding: "10px 14px",
                display: "flex", flexDirection: "column", gap: "8px" }}>
                <input value={eq2} onChange={e => setEq2(e.target.value)}
                  placeholder="수식으로 작성하세요. ex) x+y=1"
                  style={{ ...inp(), fontFamily:"Courier New", fontSize:"15px" }}
                  onFocus={onFocus} onBlur={onBlur} />
                <textarea value={reason2} onChange={e => setReason2(e.target.value)}
                  placeholder="이 식을 세운 이유..."
                  style={{ ...inp(), minHeight:"52px", resize:"none",
                    lineHeight:"1.5", fontSize:"12px" }}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* 풀이 */}
            <div>
              <div style={{ fontSize:"12px", fontWeight:"700",
                color:"#718096", marginBottom:"5px" }}>
                ✏️ 풀이 과정
              </div>
              <textarea value={solution} onChange={e => setSolution(e.target.value)}
                placeholder="단계별로 풀어봐!"
                style={{ ...inp(), minHeight:"62px", resize:"none",
                  lineHeight:"1.6", fontSize:"12px" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* 해 */}
            <div style={{
              background:"linear-gradient(135deg,#e8f5e9,#f1f8e9)",
              borderRadius:"12px", padding:"12px 14px",
              display:"flex", alignItems:"center",
              gap:"10px", flexWrap:"wrap"
            }}>
              <span style={{ fontSize:"12px", fontWeight:"700", color:"#2E7D32" }}>
                🎯 해:
              </span>
              <span style={{ fontSize:"14px", fontWeight:"700" }}>x =</span>
              <input value={ansX} onChange={e => setAnsX(e.target.value)}
                placeholder="?" style={{
                  ...inp(), width:"70px", textAlign:"center",
                  fontSize:"18px", fontWeight:"900", border:"2px solid #a5d6a7"
                }} onFocus={onFocus} onBlur={onBlur} />
              <span style={{ fontSize:"14px", fontWeight:"700" }}>, y =</span>
              <input value={ansY} onChange={e => setAnsY(e.target.value)}
                placeholder="?" style={{
                  ...inp(), width:"70px", textAlign:"center",
                  fontSize:"18px", fontWeight:"900", border:"2px solid #a5d6a7"
                }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        {/* ── 오른쪽: 타임테이블 ── */}
        <div style={{
          background: "white", borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{
            padding: "12px 18px", borderBottom: "1px solid #f0f0f0",
            flexShrink: 0, background: "linear-gradient(90deg,#f8f0ff,white)",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <span style={{ fontWeight:"900", fontSize:"14px" }}>
              🎪 공연 타임테이블
            </span>
            <span style={{
              fontSize:"13px", fontWeight:"700",
              color: totalTime > TOTAL ? "#e53e3e"
                   : totalTime === TOTAL ? "#34a853" : "#5b9fe8"
            }}>
              {totalTime} / {TOTAL}분
              {totalTime === TOTAL && " ✓"}
              {totalTime > TOTAL && " ⚠️"}
            </span>
          </div>

          {/* 타임라인 바 */}
          {totalTime > 0 && (
            <div style={{ padding:"10px 16px 4px", flexShrink:0 }}>
              <div style={{
                display:"flex", height:"30px",
                borderRadius:"10px", overflow:"hidden",
                background:"#f0f0f0"
              }}>
                {timeRows.map((row, i) => {
                  const pct = Math.min((row.time / TOTAL) * 100, 100);
                  if (!row.time || row.time <= 0) return null;
                  return (
                    <div key={row.id} style={{
                      width:`${pct}%`, background: row.color,
                      display:"flex", alignItems:"center",
                      justifyContent:"center",
                      fontSize:"10px", color:"white", fontWeight:"700",
                      overflow:"hidden", whiteSpace:"nowrap",
                      borderRight: i < timeRows.length - 1
                        ? "1px solid rgba(255,255,255,0.5)" : "none",
                      transition:"width 0.3s"
                    }}>
                      {pct > 7 ? (row.label || row.category) : ""}
                    </div>
                  );
                })}
                {totalTime < TOTAL && (
                  <div style={{
                    flex:1, background:"#e8e8e8",
                    display:"flex", alignItems:"center",
                    justifyContent:"center",
                    fontSize:"10px", color:"#aaa"
                  }}>{TOTAL - totalTime}분 남음</div>
                )}
              </div>
            </div>
          )}

          {/* 테이블 헤더 */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"32px 1fr 80px 52px 28px",
            gap:"6px", padding:"7px 14px",
            background:"#f8f9ff", flexShrink:0,
            fontSize:"11px", fontWeight:"700", color:"#718096"
          }}>
            <div>색상</div>
            <div>항목명</div>
            <div>구분</div>
            <div>시간(분)</div>
            <div></div>
          </div>

          {/* 테이블 행 */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {timeRows.map(row => (
              <div key={row.id} style={{
                display:"grid",
                gridTemplateColumns:"32px 1fr 80px 52px 28px",
                gap:"6px", padding:"7px 14px",
                borderBottom:"1px solid #f5f5f5",
                alignItems:"center", position:"relative"
              }}>

                {/* 색상 선택 버튼 */}
                <div style={{ position:"relative" }}
                  onClick={e => { e.stopPropagation(); setOpenPalette(openPalette === row.id ? null : row.id); }}>
                  <div style={{
                    width:"24px", height:"24px", borderRadius:"50%",
                    background: row.color, cursor:"pointer",
                    border:"2px solid rgba(0,0,0,0.1)",
                    boxShadow:"0 2px 6px rgba(0,0,0,0.15)",
                    transition:"transform 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  />

                  {/* 팔레트 팝업 */}
                  {openPalette === row.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position:"absolute", top:"30px", left:0,
                        background:"white", borderRadius:"12px",
                        padding:"8px", zIndex:100,
                        boxShadow:"0 8px 24px rgba(0,0,0,0.15)",
                        display:"grid", gridTemplateColumns:"repeat(5,1fr)",
                        gap:"5px", width:"130px"
                    }}>
                      {PALETTE.map(c => (
                        <div key={c}
                          onClick={() => {
                            updateTimeRow(row.id, "color", c);
                            setOpenPalette(null);
                          }}
                          style={{
                            width:"20px", height:"20px",
                            borderRadius:"50%", background:c,
                            cursor:"pointer",
                            border: row.color === c
                              ? "2px solid #333" : "2px solid transparent",
                            transition:"transform 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.25)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <input value={row.label}
                  onChange={e => updateTimeRow(row.id, "label", e.target.value)}
                  placeholder="예: 댄스팀, 대기..."
                  style={{ ...inp(), padding:"6px 9px", fontSize:"12px" }}
                  onFocus={onFocus} onBlur={onBlur} />

                <select value={row.category}
                  onChange={e => updateTimeRow(row.id, "category", e.target.value)}
                  style={{ ...inp(), padding:"6px 4px", fontSize:"11px" }}>
                  {CATEGORY_PRESETS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input type="number" min="0" max="120"
                  value={row.time || ""}
                  onChange={e => updateTimeRow(row.id, "time", e.target.value)}
                  placeholder="0"
                  style={{ ...inp(), padding:"6px 7px",
                    textAlign:"center", fontSize:"13px" }}
                  onFocus={onFocus} onBlur={onBlur} />

                <button onClick={() => deleteTimeRow(row.id)} style={{
                  background:"none", border:"none",
                  color:"#ccc", cursor:"pointer", fontSize:"14px"
                }}
                  onMouseEnter={e => e.target.style.color = "#ff5f57"}
                  onMouseLeave={e => e.target.style.color = "#ccc"}
                >✕</button>
              </div>
            ))}

            <div style={{ padding:"10px 14px" }}>
              <button onClick={addTimeRow} style={{
                width:"100%", padding:"8px",
                background:"#f8f9ff", border:"1px dashed #c0d0f0",
                borderRadius:"8px", color:"#5b9fe8",
                fontSize:"12px", fontWeight:"700", cursor:"pointer"
              }}>➕ 항목 추가</button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{
        padding: "12px 80px",
        background: "white",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
        display: "flex", gap: "12px", flexShrink: 0
      }}>
        <button onClick={handleCapture} disabled={capturing} style={{
          flex:1, padding:"12px",
          background: capturing ? "#ccc"
            : "linear-gradient(135deg,#f093fb,#f5576c)",
          color:"white", border:"none", borderRadius:"12px",
          fontSize:"14px", fontWeight:"700",
          cursor: capturing ? "default" : "pointer",
          boxShadow: capturing ? "none" : "0 3px 12px rgba(245,87,108,0.3)"
        }}>
          {capturing ? "📸 캡처 중..." : "📸 캡처하기"}
        </button>
        <button onClick={() => window.open(PADLET_URL, "_blank")} style={{
          flex:1, padding:"12px",
          background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
          color:"white", border:"none", borderRadius:"12px",
          fontSize:"14px", fontWeight:"700", cursor:"pointer",
          boxShadow:"0 3px 12px rgba(91,159,232,0.35)"
        }}>
          🚀 패들렛에 공유하기
        </button>
        
      </div>
          <CocoChat
  systemPrompt={PROMPTS.equation}
  initialMessage="안녕! 나는 코코야 🌀&#10;연립방정식 풀이에서 막힌 부분이 있어?"
/>  
    </div>
    
  );
}