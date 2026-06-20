import { useState, useEffect } from "react";
import cocoImg from "../styles/images/coco.png";

// ── 튜토리얼 스텝 (COCO 위치 + 말풍선 내용) ───────────────────
// cocoPos: 화면상 COCO 위치 (fixed 기준)
// bubble:  "left" | "right" | "top" — 말풍선이 COCO 어느 쪽에 뜰지
// lines:   대사 (배열, 한 번에 하나씩)
const STEPS = [
  {
    cocoPos: { bottom:"38%", left:"50%", transform:"translateX(-50%)" },
    bubble:  "top",
    lines: [
      "안녕! 나는 코코야\n처음 만나서 반가워!",
      "이 앱은 우리 학교에서\n실제로 일어나는 일들을\n수학으로 해결하는 탐구 앱이야!",
      "지도에 있는 장소들을 하나씩\n설명해줄게, 따라와봐!",
    ],
  },
  {
    cocoPos: { bottom:"50%", left:"15%"  },   // ← 강당 쪽
    bubble:  "right",
    lines: [
      "여기는 학교 강당이야!",
      "학생자치회 임원이 되어서\n학교 축제 공연 시간표를 짜야 해!",
      "강당 곳곳에 숨은 단서를 찾아서\n연립방정식으로 해결해보자!",
    ],
  },
  {
    cocoPos: { bottom:"58%", right:"30%"  },   // ← AED / 외심 쪽
    bubble:  "left",
    lines: [
      "이 챕터는 학교의 AED 위치에 대해 생각해볼거야!",
      "교내 요양호 학생을 위해\nAED 최적 위치를 찾아야 해!",
      "삼각형의 외심 개념을 이용하면\n가장 가까운 위치를 구할 수 있어!",
    ],
  },
  {
    cocoPos: { bottom:"60%", right:"16%"  },   // ← 급식실 쪽
    bubble:  "left",
    lines: [
      "여기는 급식실이야!",
      "배식이 너무 오래 걸린다는 민원이 들어왔어.",
      "배식 속도를 직접 측정하고\n일차함수 그래프로 분석해봐!",
    ],
  },
  {
    cocoPos: { bottom:"26%", left:"50%"  },   // ← 운동장 / 비 씬 쪽
    bubble:  "right",
    lines: [
      "여기는 운동장이야!",
      "수요일에 체육대회가 열리는데\n비가 올지 안 올지 모르겠어!",
      "과거 기상 데이터로\n확률을 직접 계산해봐!",
    ],
  },
  {
    cocoPos: { bottom:"36%", left:"50%", transform:"translateX(-50%)" },
    bubble:  "top",
    lines: [
      "자, 그럼 준비됐어? 😊",
      "지도에서 챕터를 골라서\n미션을 시작해보자!",
      "막히는 게 있으면\n언제든지 나한테 물어봐!\n자, 탐험을 시작하자!",
    ],
  },
];

export default function TutorialOverlay({ user, onDone }) {
  const [visible,  setVisible]  = useState(false);
  const [stepIdx,  setStepIdx]  = useState(0);
  const [lineIdx,  setLineIdx]  = useState(0);
  const [animKey,  setAnimKey]  = useState(0); // 말풍선 재등장 트리거
  const [moving,   setMoving]   = useState(false); // COCO 이동 중

  useEffect(() => {
    if (!user?.uid) return;
    const key = `coco_tutorial_${user.uid}`;
    if (!localStorage.getItem(key)) {
      setTimeout(() => setVisible(true), 600); // 맵 로드 후 잠깐 딜레이
    }
  }, [user]);

  if (!visible) return null;

  const step    = STEPS[stepIdx];
  const isLast  = stepIdx === STEPS.length - 1;
  const isLastLine = lineIdx === step.lines.length - 1;
  const curLine = step.lines[lineIdx];

  const handleNext = () => {
    if (!isLastLine) {
      // 다음 대사
      setLineIdx(l => l + 1);
      setAnimKey(k => k + 1);
    } else if (!isLast) {
      // 다음 스텝 — COCO 이동
      setMoving(true);
      setAnimKey(k => k + 1);
      setTimeout(() => {
        setStepIdx(s => s + 1);
        setLineIdx(0);
        setMoving(false);
        setAnimKey(k => k + 1);
      }, 700);
    } else {
      // 튜토리얼 종료
      setVisible(false);
      localStorage.setItem(`coco_tutorial_${user.uid}`, "done");
      onDone?.();
    }
  };

  // 말풍선 방향에 따른 위치 스타일
  const bubbleStyle = () => {
    const base = {
      position:"absolute",
      background:"white",
      borderRadius:"16px",
      padding:"14px 18px",
      boxShadow:"0 6px 24px rgba(0,0,0,0.18)",
      maxWidth:"300px", minWidth:"260px",
      fontSize:"15px", lineHeight:"1.85",
      fontWeight:"600", color:"#2D3748",
      whiteSpace:"pre-line",
      border:"2px solid #e8ecff",
      zIndex:102,
      animation:`fadeSlide 0.3s ease-out`,
    };
    switch(step.bubble) {
      case "right": return { ...base, left:"calc(100% + 14px)", top:"20%" };
      case "left":  return { ...base, right:"calc(100% + 14px)", top:"20%" };
      case "top":   return { ...base, bottom:"calc(100% + 14px)", left:"50%", transform:"translateX(-50%)" };
      default:      return { ...base, left:"calc(100% + 14px)", top:"20%" };
    }
  };

  // 말풍선 꼬리 방향
  const tailStyle = () => {
    const base = {
      position:"absolute",
      width:0, height:0,
    };
    switch(step.bubble) {
      case "right": return { ...base,
        left:"-10px", top:"24px",
        borderTop:"10px solid transparent",
        borderBottom:"10px solid transparent",
        borderRight:"10px solid white",
        filter:"drop-shadow(-2px 0 1px rgba(0,0,0,0.08))",
      };
      case "left":  return { ...base,
        right:"-10px", top:"24px",
        borderTop:"10px solid transparent",
        borderBottom:"10px solid transparent",
        borderLeft:"10px solid white",
      };
      case "top":   return { ...base,
        bottom:"-10px", left:"50%", transform:"translateX(-50%)",
        borderLeft:"10px solid transparent",
        borderRight:"10px solid transparent",
        borderTop:"10px solid white",
      };
      default: return base;
    }
  };

  // 진행 점
  const totalLines = STEPS.reduce((sum, s) => sum + s.lines.length, 0);
  const doneLines  = STEPS.slice(0, stepIdx).reduce((sum, s) => sum + s.lines.length, 0) + lineIdx;

  return (
    <>
      {/* 반투명 상단 안내바 */}
      <div style={{
        position:"fixed", top:0, left:0, right:0,
        background:"rgba(102,126,234,0.88)",
        color:"white", padding:"8px 20px",
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        zIndex:101, backdropFilter:"blur(4px)",
        fontSize:"14px", fontWeight:"700"
      }}>
        <div> CoCo 튜토리얼 — {stepIdx + 1}/{STEPS.length}</div>
        <div style={{ display:"flex", gap:"5px" }}>
          {Array.from({ length: totalLines }, (_, i) => (
            <div key={i} style={{
              width: i < doneLines ? "18px" : "8px",
              height:"6px", borderRadius:"3px",
              background: i < doneLines
                ? "white"
                : "rgba(255,255,255,0.35)",
              transition:"all 0.3s"
            }}/>
          ))}
        </div>
        <button onClick={()=>{
          setVisible(false);
          localStorage.setItem(`coco_tutorial_${user.uid}`,"done");
          onDone?.();
        }} style={{
          background:"rgba(255,255,255,0.2)", border:"none",
          color:"white", borderRadius:"20px",
          padding:"4px 12px", fontSize:"12px",
          fontWeight:"700", cursor:"pointer"
        }}>건너뛰기</button>
      </div>

      {/* COCO + 말풍선 */}
      <div style={{
        position:"fixed",
        ...step.cocoPos,
        zIndex:102,
        transition: moving ? "all 0.7s cubic-bezier(0.34,1.56,0.64,1)" : "all 0.5s ease",
        opacity: moving ? 0.6 : 1,
        display:"flex", flexDirection:"column",
        alignItems:"center",
      }}>
        {/* 말풍선 (COCO 기준 relative) */}
        <div style={{ position:"relative" }}>
          <img
            src={cocoImg} alt="COCO"
            style={{
              width:"250px", height:"250px",
              objectFit:"contain",
              filter:"drop-shadow(0 6px 16px rgba(102,126,234,0.5))",
              animation:"cocoFloat 2.4s ease-in-out infinite",
            }}
          />

          {/* 말풍선 */}
          {!moving && (
            <div key={animKey} style={bubbleStyle()}>
              {/* 꼬리 */}
              <div style={tailStyle()}/>
              {/* 텍스트 */}
              <div>{curLine}</div>
              {/* 다음 버튼 */}
              <button onClick={handleNext} style={{
                marginTop:"12px",
                padding:"8px 18px",
                background:"linear-gradient(135deg,#667eea,#764ba2)",
                color:"white", border:"none",
                borderRadius:"20px",
                fontSize:"14px", fontWeight:"800",
                cursor:"pointer",
                display:"block",
                boxShadow:"0 3px 12px rgba(102,126,234,0.4)",
              }}>
                {isLastLine && isLast
                  ? "🚀 시작!"
                  : isLastLine
                  ? "다음 장소 →"
                  : "다음 ▶"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cocoFloat {
          0%,100% { transform:translateY(0px) rotate(-2deg); }
          50%      { transform:translateY(-14px) rotate(2deg); }
        }
        @keyframes fadeSlide {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  );
}
