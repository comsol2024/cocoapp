import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import cocoImg from "../styles/images/coco.png";

const PADLET_URL = "https://padlet.com/comsol2024/coco_1_festival";

export default function RainProblemPage({ user }) {
  const navigate   = useNavigate();
  const captureRef = useRef(null);

  const [saved, setSaved] = useState(false);

  // 문제 만들기
  const [myProblem,  setMyProblem]  = useState("");
  const [myAnswer,   setMyAnswer]   = useState("");
  const [peActivity, setPeActivity] = useState("");
  const [memo,       setMemo]       = useState("");

  // 특수 상황 그래프
  const [sp3Slope,     setSp3Slope]     = useState("");
  const [sp3Intercept, setSp3Intercept] = useState("");
  const [sp3StartTime, setSp3StartTime] = useState("");

  // 통계값 (RainDataPage에서 넘어온 참고용)
  const [statRR, setStatRR] = useState("?");
  const [statCR, setStatCR] = useState("?");

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(
        doc(db,"users",user.uid,"chapters","rain-problem")
      );
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.myProblem)  setMyProblem(d.myProblem);
      if (d.myAnswer)   setMyAnswer(d.myAnswer);
      if (d.peActivity) setPeActivity(d.peActivity);
      if (d.memo)       setMemo(d.memo);
      if (d.sp3Slope)     setSp3Slope(d.sp3Slope);
      if (d.sp3Intercept) setSp3Intercept(d.sp3Intercept);
      if (d.sp3StartTime) setSp3StartTime(d.sp3StartTime);
    };
    // RainDataPage 저장값에서 통계 읽기
    const loadStats = async () => {
      const snap = await getDoc(
        doc(db,"users",user.uid,"chapters","rain-data")
      );
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.probRR) setStatRR(d.probRR);
      if (d.probCR) setStatCR(d.probCR);
    };
    load(); loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      await setDoc(
        doc(db,"users",user.uid,"chapters","rain-problem"),
        { myProblem, myAnswer, peActivity, memo,
          sp3Slope, sp3Intercept, sp3StartTime,
          updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSaved(true); setTimeout(()=>setSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProblem, myAnswer, peActivity, memo, sp3Slope, sp3Intercept, sp3StartTime]);



  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor:"#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = "비오는날_체육수업_나만의문제.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      alert("캡처 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const inp = {
    padding:"12px 14px", borderRadius:"12px",
    border:"1.5px solid #e2e8f0", fontSize:"15px",
    outline:"none", width:"100%", boxSizing:"border-box",
    lineHeight:"1.7", fontFamily:"inherit",
    background:"white"
  };

  return (
    <div style={{
      background:"linear-gradient(180deg,#E3F2FD,#BBDEFB)",
      minHeight:"100vh"
    }}>

      {/* 헤더 */}
      <div style={{
        background:"white", padding:"14px 28px",
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/rain-data")} style={{
          background:"none", border:"none", color:"#1565C0",
          fontWeight:"700", fontSize:"16px", cursor:"pointer"
        }}>← 데이터 분석</button>
        <div style={{ fontWeight:"900", fontSize:"20px" }}>
          ✏️ 나만의 확률 문제 만들기
        </div>
        <div style={{ fontSize:"14px", fontWeight:"600",
          color:saved?"#34a853":"#bbb" }}>
          {saved ? "✓ 저장됨" : "저장 중..."}
        </div>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:"960px", margin:"0 auto" }}>

        {/* 코코 안내 */}
        <div style={{
          background:"linear-gradient(135deg,#1565C0,#0D47A1)",
          borderRadius:"18px", padding:"20px 26px",
          marginBottom:"24px", color:"white",
          display:"flex", alignItems:"center", gap:"18px"
        }}>
          <img src={cocoImg} alt="COCO"
            style={{ width:"60px", height:"60px", objectFit:"contain",
              flexShrink:0,
              filter:"drop-shadow(0 4px 12px rgba(102,126,234,0.5))" }}/>
          <div>
            <div style={{ fontSize:"17px", fontWeight:"900", marginBottom:"5px" }}>
              🌀 COCO 미션 — 나만의 문제 만들기
            </div>
            <div style={{ fontSize:"15px", lineHeight:"1.8", opacity:0.92 }}>
              앞에서 구한 통계 확률({statRR}%, {statCR}%)을 이용해서<br/>
              나만의 날씨 확률 문제를 직접 만들고 풀어봐!
            </div>
          </div>
        </div>

        {/* ── 캡처 영역 시작 ── */}
        <div ref={captureRef} style={{
          background:"white", borderRadius:"20px",
          padding:"30px 32px",
          boxShadow:"0 6px 24px rgba(0,0,0,0.08)"
        }}>

          {/* 캡처 영역 제목 */}
          <div style={{
            display:"flex", alignItems:"center",
            gap:"12px", marginBottom:"24px",
            paddingBottom:"16px",
            borderBottom:"2px solid #E3F2FD"
          }}>
            <div style={{ fontSize:"28px" }}>⛈️</div>
            <div>
              <div style={{ fontSize:"20px", fontWeight:"900" }}>
                비오는 날 체육 수업 — 나만의 확률 문제
              </div>
              <div style={{ fontSize:"14px", color:"#888", marginTop:"2px" }}>
                통계 확률 P(비→비): {statRR}%,  P(맑→비): {statCR}%
              </div>
            </div>
          </div>

          {/* 2열 레이아웃 (문제+풀이 / 그래프+활동) */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"1fr 1fr",
            gap:"22px"
          }}>

            {/* 왼쪽 열 */}
            <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

              {/* 내 확률 문제 */}
              <div style={{
                background:"#FFF8E1", borderRadius:"16px",
                padding:"18px 20px", border:"1.5px solid #FFE082"
              }}>
                <div style={{ fontSize:"16px", fontWeight:"700",
                  color:"#E65100", marginBottom:"10px" }}>
                  📝 내가 만든 확률 문제
                </div>
                <div style={{ fontSize:"13px", color:"#BDBDBD",
                  marginBottom:"10px", lineHeight:"1.7",
                  fontStyle:"italic" }}>
                  예) "5월 기준 비가 온 다음날 비가 올 확률이 {statRR}%,<br/>
                  맑은 날 다음날 비가 올 확률이 {statCR}%일 때,<br/>
                  월요일에 비가 왔다면 수요일에 비가 올 확률은?"
                </div>
                <textarea value={myProblem}
                  onChange={e=>setMyProblem(e.target.value)}
                  placeholder="나만의 확률 문제를 여기에 써봐!"
                  style={{ ...inp, minHeight:"120px", resize:"vertical" }}/>
              </div>

              {/* 풀이와 답 */}
              <div style={{
                background:"#F3E5F5", borderRadius:"16px",
                padding:"18px 20px", border:"1.5px solid #CE93D8"
              }}>
                <div style={{ fontSize:"16px", fontWeight:"700",
                  color:"#6A1B9A", marginBottom:"10px" }}>
                  🔢 풀이 과정과 답
                </div>
                <textarea value={myAnswer}
                  onChange={e=>setMyAnswer(e.target.value)}
                  placeholder="단계별 풀이 과정과 최종 답을 적어봐!"
                  style={{ ...inp, minHeight:"140px", resize:"vertical" }}/>
              </div>

              {/* 기타 메모 */}
              <div>
                <div style={{ fontSize:"15px", fontWeight:"700",
                  color:"#718096", marginBottom:"8px" }}>📝 기타 메모</div>
                <textarea value={memo}
                  onChange={e=>setMemo(e.target.value)}
                  placeholder="분석하면서 느낀 점, 궁금한 점..."
                  style={{ ...inp, minHeight:"80px", resize:"vertical" }}/>
              </div>
            </div>

            {/* 오른쪽 열 */}
            <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
              {/* 체육 활동 계획 */}
              <div style={{
                background:"#EDE7F6", borderRadius:"16px",
                padding:"18px 20px", border:"1.5px solid #B39DDB"
              }}>
                <div style={{ fontSize:"16px", fontWeight:"700",
                  color:"#4527A0", marginBottom:"10px" }}>
                  🏃‍♂️ 3일 전 비가 왔을 때 체육 활동 계획
                </div>
                <div style={{
                  background:"white", borderRadius:"10px",
                  padding:"10px 14px", marginBottom:"10px",
                  fontSize:"14px", lineHeight:"1.8", color:"#555"
                }}>
                  목요일 기준, 월요일 비 → 목요일 비 확률 ≈{" "}
                  <strong style={{ color:"#1565C0" }}>47.5%</strong><br/>
                  ☔ 비 올 때 실내 / ☀️ 맑을 때 야외
                </div>
                <textarea value={peActivity}
                  onChange={e=>setPeActivity(e.target.value)}
                  placeholder="비가 올 경우와 안 올 경우 활동 계획을 모두 써봐!"
                  style={{ ...inp, minHeight:"100px", resize:"vertical" }}/>
              </div>
            </div>
          </div>

          {/* 캡처 영역 푸터 */}
          <div style={{
            marginTop:"20px", paddingTop:"16px",
            borderTop:"1px solid #E3F2FD",
            display:"flex", justifyContent:"flex-end",
            alignItems:"center", gap:"8px"
          }}>
            <div style={{ fontSize:"13px", color:"#bbb" }}>
              ⛈️ 비오는 날 체육 수업 — 나만의 문제 활동지
            </div>
          </div>
        </div>
        {/* ── 캡처 영역 끝 ── */}

        {/* 하단 버튼 영역 */}
        <div style={{
          marginTop:"22px",
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          gap:"14px"
        }}>

          {/* 캡처 버튼 */}
          <button onClick={handleCapture} style={{
            padding:"18px",
            background:"linear-gradient(135deg,#546E7A,#37474F)",
            color:"white", border:"none", borderRadius:"16px",
            fontSize:"16px", fontWeight:"700", cursor:"pointer",
            boxShadow:"0 4px 16px rgba(84,110,122,0.35)",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:"10px"
          }}>
            📷 활동지 캡처하기
          </button>

          {/* 패들렛 공유 버튼 */}
          <button onClick={()=>
            PADLET_URL
              ? window.open(PADLET_URL,"_blank")
              : alert("패들렛 링크가 아직 설정되지 않았어요!")
          } style={{
            padding:"18px",
            background:"linear-gradient(135deg,#1565C0,#0D47A1)",
            color:"white", border:"none", borderRadius:"16px",
            fontSize:"16px", fontWeight:"700", cursor:"pointer",
            boxShadow:"0 4px 18px rgba(21,101,192,0.35)",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:"10px"
          }}>
            🚀 패들렛에 공유하기
          </button>
        </div>
      </div>
    </div>
  );
}