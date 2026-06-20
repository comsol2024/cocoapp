import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { signInStudent } from "../firebase"; // firebase.js에 추가한 함수

const provider = new GoogleAuthProvider();

export default function LoginPage({ onLogin }) {
  const [tab,      setTab]      = useState("google"); // "google" | "student"
  const [studentId, setStudentId] = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [showPw,    setShowPw]    = useState(false);

  // ── 구글 로그인 ──
  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (e) {
      setError("구글 로그인에 실패했어요. 다시 시도해줘!");
    } finally {
      setLoading(false);
    }
  };

  // ── 학번 로그인 ──
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!studentId.trim() || !password.trim()) {
      setError("학번과 비밀번호를 모두 입력해줘!"); return;
    }
    setLoading(true); setError("");
    try {
      const result = await signInStudent(studentId.trim(), password);
      // Firestore에 학생 존재 여부 확인 (비활성화 차단)
      const snap = await getDoc(doc(db, "students", studentId.trim()));
      if (!snap.exists()) {
        await auth.signOut();
        setError("계정이 비활성화되었어요. 선생님께 문의해줘!");
        return;
      }
      onLogin(result.user);
    } catch (e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        setError("학번 또는 비밀번호가 틀렸어요!");
      } else if (e.code === "auth/user-not-found") {
        setError("등록되지 않은 학번이에요. 선생님께 문의해줘!");
      } else {
        setError("로그인에 실패했어요. 다시 시도해줘!");
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width:"100%", padding:"14px 16px",
    borderRadius:"12px", border:"1.5px solid #e2e8f0",
    fontSize:"16px", outline:"none", boxSizing:"border-box",
    fontFamily:"inherit",
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"20px"
    }}>
      <div style={{
        background:"white", borderRadius:"24px",
        padding:"36px 32px", width:"100%", maxWidth:"400px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)"
      }}>
        {/* 로고 */}
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontSize:"48px", marginBottom:"8px" }}>🌀</div>
          <div style={{ fontSize:"28px", fontWeight:"900",
            background:"linear-gradient(135deg,#667eea,#764ba2)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
          }}>COCO</div>
          <div style={{ fontSize:"14px", color:"#888", marginTop:"4px" }}>
            Context On, Connect On
          </div>
        </div>

        {/* 탭 */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          background:"#f5f5f5", borderRadius:"12px",
          padding:"4px", marginBottom:"24px", gap:"4px"
        }}>
          {[
            { id:"google",  label:"🔑 구글 로그인" },
            { id:"student", label:"🎒 학번 로그인" },
          ].map(t => (
            <button key={t.id} onClick={()=>{ setTab(t.id); setError(""); }} style={{
              padding:"10px", borderRadius:"10px", border:"none",
              cursor:"pointer", fontSize:"14px", fontWeight:"700",
              background: tab===t.id ? "white" : "transparent",
              color:       tab===t.id ? "#667eea" : "#888",
              boxShadow:   tab===t.id ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              transition:"all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* 구글 로그인 탭 */}
        {tab === "google" && (
          <div>
            <button onClick={handleGoogle} disabled={loading} style={{
              width:"100%", padding:"16px",
              background: loading ? "#f0f0f0" : "white",
              border:"2px solid #e2e8f0",
              borderRadius:"14px", fontSize:"16px",
              fontWeight:"700", cursor: loading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:"12px",
              color:"#333", transition:"all 0.2s",
              boxShadow:"0 2px 8px rgba(0,0,0,0.08)"
            }}>
              {loading ? "로그인 중..." : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Google 계정으로 로그인
                </>
              )}
            </button>
            <div style={{ textAlign:"center", marginTop:"16px",
              fontSize:"13px", color:"#aaa" }}>
              선생님 · 관리자 계정
            </div>
          </div>
        )}

        {/* 학번 로그인 탭 */}
        {tab === "student" && (
          <form onSubmit={handleStudentLogin}>
            <div style={{ marginBottom:"14px" }}>
              <label style={{ fontSize:"13px", fontWeight:"700",
                color:"#555", display:"block", marginBottom:"6px" }}>
                🎒 학번
              </label>
              <input
                type="text"
                value={studentId}
                onChange={e=>{ setStudentId(e.target.value); setError(""); }}
                placeholder="학번을 입력해줘 (예: 20301)"
                autoComplete="username"
                style={inp}/>
            </div>
            <div style={{ marginBottom:"20px" }}>
              <label style={{ fontSize:"13px", fontWeight:"700",
                color:"#555", display:"block", marginBottom:"6px" }}>
                🔒 비밀번호
              </label>
              <div style={{ position:"relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e=>{ setPassword(e.target.value); setError(""); }}
                  placeholder="비밀번호를 입력해줘"
                  autoComplete="current-password"
                  style={{ ...inp, paddingRight:"48px" }}/>
                <button type="button"
                  onClick={()=>setShowPw(p=>!p)} style={{
                    position:"absolute", right:"14px", top:"50%",
                    transform:"translateY(-50%)",
                    background:"none", border:"none",
                    cursor:"pointer", fontSize:"18px", color:"#aaa"
                  }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              width:"100%", padding:"16px",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg,#667eea,#764ba2)",
              color:"white", border:"none", borderRadius:"14px",
              fontSize:"16px", fontWeight:"700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow:"0 4px 16px rgba(102,126,234,0.4)"
            }}>
              {loading ? "로그인 중..." : "로그인 →"}
            </button>
            <div style={{ textAlign:"center", marginTop:"16px",
              fontSize:"13px", color:"#aaa" }}>
              학생 전용 · 계정은 선생님께 받아줘
            </div>
          </form>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            marginTop:"14px", padding:"10px 14px",
            background:"#ffebee", borderRadius:"10px",
            fontSize:"13px", color:"#c62828", fontWeight:"600",
            textAlign:"center"
          }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}
