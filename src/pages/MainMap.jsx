import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { resetUserProgress } from "../firebase";
import { CHAPTER_LIST } from "../data/chapters";
import React, { useState } from "react";
import { SlopeCamera, ActivityCamera, ExploreTimer, ExploreMemo } from "./ExploreTools";
import TutorialModal from "../components/TutorialModal";

const RESOURCE_URL = "https://sites.google.com/goedu.kr/aicoco/%ED%99%88";
const LEARNING_ITEMS = [
  { icon:"📐", label:"데스모스 활동",    desc:"인터랙티브 그래프 탐구" },
  { icon:"🤖", label:"서술형 AI 도우미", desc:"AI와 함께 수학 풀기"    },
  { icon:"📝", label:"연습문제",          desc:"단원별 연습문제"         },
];

export default function MainMap({ user }) {
  const navigate = useNavigate();
  const [showLearning, setShowLearning] = useState(false);
  const [showExplore, setShowExplore] = useState(false); 
  const [activeTool, setActiveTool] = useState(null);
  const EXPLORE_NODES = [
  { icon:"📐", label:"경사로\n기울기", angle:150, radius:130,
    onClick:()=>{ setShowExplore(false); setActiveTool("slope"); } },
  { icon:"📷", label:"활동\n사진",   angle:110, radius:130,
    onClick:()=>{ setShowExplore(false); setActiveTool("photo"); } },
  { icon:"⏱️", label:"타이머",       angle:70,  radius:130,
    onClick:()=>{ setShowExplore(false); setActiveTool("timer"); } },
  { icon:"📝", label:"메모",         angle:30,  radius:130,
    onClick:()=>{ setShowExplore(false); setActiveTool("memo");  } },
];

  const handleLocation = (chapter) => {
    if (chapter.locked) {
      alert("🔒 아직 잠긴 장소예요!\n앞 챕터를 완료하면 열려요.");
      return;
    }
      // 챕터별 라우팅
    if (chapter.id === "aed") {
      navigate("/chapter/aed");
      
    } 
    else if (chapter.id === "cafeteria") navigate("/lunch-scene");
    else if (chapter.id === "rain") navigate("/rain-scene");
    else {
      navigate(`/chapter/${chapter.id}`);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("챕터 진행 기록을 초기화할까요?")) return;
    await resetUserProgress(user.uid, "auditorium");
    alert("초기화됐어요! 다시 클릭해서 시작하세요 😊");
  };

  return (
    <div className="game-screen">
      <TutorialModal user={user} />   {/* ← 이 한 줄 */}
      <div className="main-map">
        {/* HUD */}
        <div className="hud">
          <div className="hud-badge">👤 {user.displayName}</div>
          <div style={{ display:"flex", gap:"8px" }}>
            <div className="hud-badge hud-back" onClick={handleReset}>
              🔄 초기화
            </div>
            <div className="hud-badge hud-back"
              onClick={() => signOut(auth)}>
              로그아웃
            </div>
          </div>
        </div>

        {/* 타이틀 */}
        <div style={{
          position:"absolute", top:"60px", left:"50%",
          transform:"translateX(-50%)",
          textAlign:"center", zIndex:10
        }}>
          <div style={{
            fontSize:"28px", fontWeight:"900", color:"rgba(36, 36, 36, 0.9)",
            background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",
            textShadow:"0 30px 15px rgba(0,0,0,0.3)"
          }}> 현실과 수학을 잇는 AI 학습메이트 CoCo </div>
          <div style={{
            fontSize:"20px", color:"rgba(255,255,255,0.9)",
            marginTop:"4px", textShadow:"0 13px 8px rgba(0,0,0,0.3)"
          }}> 순서대로 미션을 클릭해보세요!</div>
        </div>



        {/* 장소 핀들 */}
        {CHAPTER_LIST.map(chapter => (
          <div key={chapter.id}
            className={`location-pin ${chapter.locked ? "locked" : ""}`}
            style={{ left:`${chapter.x}%`, top:`${chapter.y}%` }}
            onClick={() => handleLocation(chapter)}>
            <div className={`pin-circle ${chapter.locked ? "locked" : ""}`}>
              {chapter.locked ? (
                "🔒"
              ) : chapter.image ? (
                /* 이미지가 설정되어 있다면 img 태그를 출력하고, 없으면 백업으로 기존 이모지 출력 */
                <img 
                  src={chapter.image} 
                  alt={chapter.name} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" , borderRadius: "50%", imageRendering: "auto", transform: "scale(1.02)", backfaceVisibility: "hidden",}} 
                />
              ) : (
                chapter.emoji
              )}
            </div>
            <div className="pin-label">
              {chapter.locked ? "잠금" : chapter.name}
            </div>
          </div>
        ))}
{/* ── 실생활 탐구 도구 모달 ── */}
{activeTool==="slope" &&
  <SlopeCamera onClose={()=>setActiveTool(null)}/>}
{activeTool==="photo" &&
  <ActivityCamera onClose={()=>setActiveTool(null)} user={user}/>}
{activeTool==="timer" &&
  <ExploreTimer onClose={()=>setActiveTool(null)}/>}
{activeTool==="memo" &&
  <ExploreMemo onClose={()=>setActiveTool(null)} user={user}/>}

{/* ── 나의 학습 펼침 패널 ── */}
{showLearning && (
  <>
    <div
      onClick={() => setShowLearning(false)}
      style={{
        position:"fixed", inset:0, zIndex:90,
        background:"rgba(0,0,0,0.25)"
      }}
    />
    <div style={{
      position:"fixed", bottom:"76px", left:"16px",
      zIndex:100, display:"flex", flexDirection:"column",
      gap:"8px", animation:"slideUp 0.22s ease-out"
    }}>
      {LEARNING_ITEMS.map((item,i) => (
        <button key={i} onClick={() => {
          setShowLearning(false);
          // 추후 기능 연결 예정
          alert(`${item.label} 준비 중이야! 🌀`);
        }} style={{
          display:"flex", alignItems:"center", gap:"12px",
          padding:"13px 18px",
          background:"white",
          border:"none", borderRadius:"14px",
          boxShadow:"0 4px 20px rgba(0,0,0,0.14)",
          cursor:"pointer", textAlign:"left",
          minWidth:"200px",
          transition:"transform 0.15s",
          animationDelay:`${i*0.05}s`
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{
            width:"42px", height:"42px", borderRadius:"12px",
            background:"linear-gradient(135deg,#E3F2FD,#BBDEFB)",
            display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:"20px", flexShrink:0
          }}>{item.icon}</div>
          <div>
            <div style={{ fontSize:"14px", fontWeight:"700",
              color:"#1a1a2e" }}>{item.label}</div>
            <div style={{ fontSize:"11px", color:"#999",
              marginTop:"1px" }}>{item.desc}</div>
          </div>
        </button>
      ))}
    </div>
  </>
)}
{/* ── 실생활 탐구 오버레이 ── */}
{showExplore && (
  <div onClick={()=>setShowExplore(false)}
    style={{
      position:"fixed", inset:0, zIndex:190,
      background:"rgba(0,0,0,0.45)"
    }}/>
)}

{/* ── 실생활 탐구 FAB + 라디얼 메뉴 ── */}
<div style={{
  position:"fixed",
  bottom:"55px",   /* FAB 중심 높이 */
  left:"50%",
  transform:"translateX(-50%)",
  zIndex:200,
  pointerEvents:"none"
}}>

  {/* 연결선 SVG */}
  {showExplore && (
    <svg style={{
      position:"absolute",
      left:"-200px", top:"-200px",
      width:"400px", height:"400px",
      pointerEvents:"none", zIndex:0
    }}>
      {EXPLORE_NODES.map((node,i)=>{
        const rad = node.angle * Math.PI / 180;
        const x = Math.cos(rad) * node.radius;
        const y = -Math.sin(rad) * node.radius;
        return (
          <line key={i}
            x1={200} y1={200}
            x2={200+x} y2={200+y}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.5}
            strokeDasharray="5 3"/>
        );
      })}
    </svg>
  )}

  {/* 노드 버튼 4개 */}
  {showExplore && EXPLORE_NODES.map((node,i)=>{
    const rad = node.angle * Math.PI / 180;
    const x   = Math.cos(rad) * node.radius;
    const y   = -Math.sin(rad) * node.radius;
    return (
      <div key={i} style={{
        position:"absolute",
        left:`${x}px`, top:`${y}px`,
        transform:"translate(-50%,-50%)",
        display:"flex", flexDirection:"column",
        alignItems:"center", gap:"5px",
        pointerEvents:"auto",
        animation:`nodePopIn 0.28s cubic-bezier(.34,1.56,.64,1) ${i*0.06}s both`
      }}>
        <button onClick={()=>{
          setShowExplore(false);
          node.onClick?.();
        }} style={{
          width:"58px", height:"58px", borderRadius:"50%",
          background:"rgba(24,24,36,0.92)",
          border:"2px solid rgba(255,255,255,0.28)",
          display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:"26px",
          cursor:"pointer",
          boxShadow:"0 6px 20px rgba(0,0,0,0.5)",
          transition:"transform 0.15s"
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          {node.icon}
        </button>
        <div style={{
          fontSize:"10px", fontWeight:"700",
          color:"white", textAlign:"center",
          lineHeight:"1.4", whiteSpace:"pre-line",
          textShadow:"0 1px 6px rgba(0,0,0,0.9)"
        }}>{node.label}</div>
      </div>
    );
  })}

  {/* FAB 버튼 */}
  <button
    onClick={()=>setShowExplore(s=>!s)}
    style={{
      position:"absolute",
      left:"-33px", top:"-33px",
      width:"66px", height:"66px",
      borderRadius:"50%",
      background: showExplore
        ? "linear-gradient(145deg,#e53935,#c62828)"
        : "linear-gradient(145deg,#1a73e8,#0D47A1)",
      border:"4px solid rgba(255,255,255,0.3)",
      boxShadow:"0 6px 24px rgba(21,101,192,0.5), 0 2px 8px rgba(0,0,0,0.2)",
      cursor:"pointer",
      display:"flex", alignItems:"center",
      justifyContent:"center",
      pointerEvents:"auto",
      transition:"all 0.3s cubic-bezier(.34,1.56,.64,1)",
      transform: showExplore ? "rotate(45deg) scale(1.08)" : "rotate(0deg) scale(1)"
    }}>
    <div style={{
      position:"absolute",
      top:"62px",
      left:"50%",
      transform:"translateX(-50%)",
      whiteSpace:"nowrap",
      fontSize:"11px",
      fontWeight:"700",
      color:"rgba(255,255,255,0.85)",
      textShadow:"0 1px 4px rgba(0,0,0,0.6)",
      pointerEvents:"none"
    }}>
      실생활 도구
    </div>
    {showExplore
      ? <span style={{fontSize:"22px",color:"white",fontWeight:"300"}}>✕</span>
      : (
        <svg viewBox="0 0 32 32" width="28" height="28">
          <circle cx="13" cy="13" r="7"
            fill="none" stroke="white" strokeWidth="2.5"/>
          <line x1="18.5" y1="18.5" x2="26" y2="26"
            stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
          <circle cx="11" cy="11" r="2.5"
            fill="rgba(255,255,255,0.35)"/>
        </svg>
      )
    }
  </button>
</div>
{/* ── 하단 네비게이션 바 ── */}
<div style={{
  position:"fixed", bottom:0, left:0, right:0,
  height:"68px", zIndex:95, pointerEvents:"none"
}}>
  {/* SVG 배경 (가운데 반원 노치) */}
  <svg
    viewBox="0 0 100 42"
    preserveAspectRatio="none"
    style={{
      position:"absolute", bottom:0, left:0,
      width:"100%", height:"70px", pointerEvents:"none"
    }}>
    <defs>
      <filter id="navShadow" x="-5%" y="-30%" width="110%" height="160%">
        <feDropShadow dx="0" dy="-3" stdDeviation="3"
          floodColor="rgba(31, 30, 30, 0.12)"/>
      </filter>
    </defs>
    <path
      d="M0,18 L36,18 Q40,0 50,0 Q60,0 64,18 L100,18 L100,42 L0,42 Z"
      fill="rgba(40, 40, 41, 0.88)" filter="url(#navShadow)"/>
  </svg>

  {/* 왼쪽: 나의 학습 */}
  <button
    onClick={() => setShowLearning(s=>!s)}
    style={{
      position:"absolute", bottom:"6px", left:"12px",
      width:"100px", height:"52px",
      background:"none", border:"none",
      cursor:"pointer", pointerEvents:"auto",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:"2px",
    }}>
    <div style={{
      width:"36px", height:"36px", borderRadius:"12px",
      background: showLearning
        ? "linear-gradient(135deg,#1565C0,#0D47A1)"
        : "linear-gradient(135deg,#E3F2FD,#BBDEFB)",
      display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:"18px",
      transition:"all 0.2s",
      boxShadow: showLearning?"0 4px 12px rgba(21,101,192,0.35)":"none"
    }}>
      {showLearning ? "✕" : "📚"}
    </div>
    <span style={{
      fontSize:"11px", fontWeight:"700",
      color: showLearning ? "#1565C0" : "#ffffff"
    }}>나의 학습</span>
  </button>

  {/* 가운데: 실생활 탐구 도구 (반원 돋보기 FAB) */}
  <div style={{ width:"80px" }}/>    
  <style>{`
  @keyframes slideUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes nodePopIn {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.2); }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
  }
`}</style>


  {/* 오른쪽: 자료실 */}
  <button
    onClick={() =>
      RESOURCE_URL
        ? window.open(RESOURCE_URL, "_blank")
        : alert("자료실 링크가 아직 설정되지 않았어요!\nMainMap.jsx의 RESOURCE_URL에 구글 사이트 주소를 입력해주세요.")
    }
    style={{
      position:"absolute", bottom:"6px", right:"12px",
      width:"100px", height:"52px",
      background:"none", border:"none",
      cursor:"pointer", pointerEvents:"auto",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:"2px",
    }}>
    <div style={{
      width:"36px", height:"36px", borderRadius:"12px",
      background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",
      display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:"18px"
    }}>📂</div>
    <span style={{ fontSize:"11px", fontWeight:"700", color:"#ffffff" }}>
      자료실
    </span>
  </button>
</div>

{/* 하단 바 높이만큼 여백 */}
<div style={{ height:"80px" }}/>

<style>{`
  @keyframes slideUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
`}</style>
      </div>
    </div>
  );
}