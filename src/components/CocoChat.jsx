import { useState, useEffect, useRef } from "react";
import { callGemini } from "../utils/gemini";
import cocoImg from "../styles/images/coco.png";

export default function CocoChat({
  systemPrompt,
  initialMessage,
  bottomOffset = "44px",
  rightOffset  = "20px",
}) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([
    { role:"bot", text: initialMessage ||
      "안녕! 나는 코코야 🌀\n궁금한 게 있으면 뭐든 물어봐!" }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const next = [...msgs, { role:"user", text }];
    setMsgs(next);
    setLoading(true);
    try {
      const reply = await callGemini(next, systemPrompt);
      setMsgs(p => [...p, { role:"bot", text:reply }]);
    } catch(e) {
      setMsgs(p => [...p, {
        role:"bot",
        text:`앗, 잠깐 후에 다시 시도해줘! (${e.message})`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!open && (
        <button onClick={()=>setOpen(true)} style={{
          position:"fixed",
          bottom: bottomOffset,
          right:  rightOffset,
          width:"64px", height:"64px",
          borderRadius:"50%",
          background:"linear-gradient(135deg,#667eea,#764ba2)",
          border:"none", cursor:"pointer",
          boxShadow:"0 4px 20px rgba(102,126,234,0.5)",
          zIndex:40,
          display:"flex", alignItems:"center", justifyContent:"center",
          overflow:"hidden"
        }}>
          <img src={cocoImg} alt="COCO"
            style={{ width:"48px", height:"48px", objectFit:"contain" }}/>
        </button>
      )}

      {/* 채팅창 */}
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{
            position:"fixed", inset:0,
            background:"rgba(0,0,0,0.3)", zIndex:45
          }}/>

          <div style={{
            position:"fixed", bottom:0, left:0, right:0,
            height:"72vh", background:"white",
            borderRadius:"24px 24px 0 0",
            boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",
            zIndex:50, display:"flex", flexDirection:"column",
            maxWidth:"720px", margin:"0 auto",
            animation:"cocoChatUp 0.3s ease-out"
          }}>

            {/* 헤더 */}
            <div style={{
              padding:"16px 22px",
              borderBottom:"1px solid #f0f0f0",
              display:"flex", alignItems:"center",
              justifyContent:"space-between", flexShrink:0
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{
                  width:"44px", height:"44px", borderRadius:"50%",
                  background:"linear-gradient(135deg,#667eea,#764ba2)",
                  display:"flex", alignItems:"center",
                  justifyContent:"center", overflow:"hidden"
                }}>
                  <img src={cocoImg} alt="COCO"
                    style={{ width:"36px", height:"36px", objectFit:"contain" }}/>
                </div>
                <div>
                  <div style={{ fontWeight:"900", fontSize:"17px" }}>AI COCO</div>
                  <div style={{ fontSize:"14px", color:"#718096" }}>수학 학습 도우미</div>
                </div>
              </div>
              <button onClick={()=>setOpen(false)} style={{
                background:"none", border:"none",
                fontSize:"28px", cursor:"pointer", color:"#aaa",
                lineHeight:"1"
              }}>×</button>
            </div>

            {/* 메시지 영역 */}
            <div style={{ flex:1, overflowY:"auto", padding:"18px 16px" }}>
              {msgs.map((msg,i)=>(
                <div key={i} style={{
                  display:"flex",
                  flexDirection: msg.role==="user" ? "row-reverse" : "row",
                  gap:"10px", marginBottom:"14px", alignItems:"flex-start"
                }}>
                  {msg.role==="bot" && (
                    <div style={{
                      width:"36px", height:"36px", borderRadius:"50%",
                      background:"linear-gradient(135deg,#667eea,#764ba2)",
                      display:"flex", alignItems:"center",
                      justifyContent:"center", overflow:"hidden", flexShrink:0
                    }}>
                      <img src={cocoImg} alt="COCO"
                        style={{ width:"28px", height:"28px", objectFit:"contain" }}/>
                    </div>
                  )}
                  <div style={{
                    maxWidth:"78%", padding:"13px 17px",
                    borderRadius: msg.role==="user"
                      ? "16px 4px 16px 16px"
                      : "4px 16px 16px 16px",
                    background: msg.role==="user"
                      ? "linear-gradient(135deg,#5b9fe8,#764ba2)"
                      : "#f8f9ff",
                    color: msg.role==="user" ? "white" : "#2D3748",
                    fontSize:"16px", lineHeight:"1.85",
                    whiteSpace:"pre-wrap"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                  <div style={{
                    width:"36px", height:"36px", borderRadius:"50%",
                    background:"linear-gradient(135deg,#667eea,#764ba2)",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", overflow:"hidden"
                  }}>
                    <img src={cocoImg} alt="COCO"
                      style={{ width:"28px", height:"28px", objectFit:"contain" }}/>
                  </div>
                  <div style={{
                    padding:"13px 17px",
                    borderRadius:"4px 16px 16px 16px",
                    background:"#f8f9ff",
                    fontSize:"16px", color:"#718096"
                  }}>생각하는 중... 💭</div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* 입력창 */}
            <div style={{
              padding:"14px 16px",
              borderTop:"1px solid #f0f0f0",
              display:"flex", gap:"10px", flexShrink:0,
              alignItems:"center"
            }}>
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&send()}
                placeholder="궁금한 것을 물어봐!"
                style={{
                  flex:1, padding:"13px 18px",
                  borderRadius:"24px",
                  border:"1.5px solid #e2e8f0",
                  fontSize:"16px", outline:"none",
                  background:"#f8f9ff"
                }}/>
              <button onClick={send}
                disabled={loading||!input.trim()}
                style={{
                  width:"46px", height:"46px",
                  borderRadius:"50%",
                  background: input.trim()
                    ? "linear-gradient(135deg,#5b9fe8,#764ba2)"
                    : "#ddd",
                  border:"none",
                  cursor: input.trim() ? "pointer" : "default",
                  fontSize:"18px",
                  display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0
                }}>➤</button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes cocoChatUp {
          from { transform:translateY(100%); }
          to   { transform:translateY(0); }
        }
      `}</style>
    </>
  );
}
