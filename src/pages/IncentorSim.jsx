import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cocoImg from "../styles/images/coco.png";
import CocoChat    from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";

const circumcenter = (A, B, C) => {
  const D = 2*(A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y));
  if (Math.abs(D)<0.01) return null;
  const ux=((A.x**2+A.y**2)*(B.y-C.y)+(B.x**2+B.y**2)*(C.y-A.y)+(C.x**2+C.y**2)*(A.y-B.y))/D;
  const uy=((A.x**2+A.y**2)*(C.x-B.x)+(B.x**2+B.y**2)*(A.x-C.x)+(C.x**2+C.y**2)*(B.x-A.x))/D;
  return { x:ux, y:uy, r:Math.hypot(ux-A.x, uy-A.y) };
};

const perpBisector = (A, B, ext=340) => {
  const mx=(A.x+B.x)/2, my=(A.y+B.y)/2;
  const dx=B.x-A.x, dy=B.y-A.y, len=Math.hypot(dx,dy)||1;
  const px=-dy/len, py=dx/len;
  return { x1:mx-px*ext, y1:my-py*ext, x2:mx+px*ext, y2:my+py*ext };
};

const VW=1000, VH=580;
const SIDE=18, GAP=7, COUNT=8;
const ROOM_W=(VW-2*SIDE-(COUNT-1)*GAP)/COUNT;
const COR_Y=210, COR_H=110;
const TOP_Y=28, TOP_H=COR_Y-TOP_Y-8;
const BOT_Y=COR_Y+COR_H+8;
const BOT_H=VH-BOT_Y-28;

const RCX = (col) => SIDE + col*(ROOM_W+GAP) + ROOM_W/2;
const RCY = (row) => row===0 ? TOP_Y+TOP_H/2 : BOT_Y+BOT_H/2;

const A1 = [
  {x:RCX(3), y:RCY(0), label:"2-4반"},
  {x:RCX(0), y:RCY(1), label:"2-9반"},
  {x:RCX(5), y:RCY(1), label:"2-14반"},
];
const A2 = [
  {x:RCX(1), y:RCY(0), label:"3-2반"},
  {x:RCX(4), y:RCY(0), label:"3-5반"},
  {x:RCX(0), y:RCY(1), label:"과학실"},
];
const A3 = [
  {x:RCX(1), y:RCY(0), label:"1-2반"},
  {x:RCX(5), y:RCY(0), label:"1-6반"},
  {x:RCX(0), y:RCY(1), label:"1-9반"},
  {x:RCX(4), y:RCY(1), label:"1-13반"},
];

const CC1  = circumcenter(A1[0], A1[1], A1[2]);
const CC2  = circumcenter(A2[0], A2[1], A2[2]);
const CC3a = circumcenter(A3[0], A3[1], A3[2]);
const CC3b = circumcenter(A3[0], A3[1], A3[3]);
const M3   = CC3a && CC3b
  ? { x:(CC3a.x+CC3b.x)/2, y:(CC3a.y+CC3b.y)/2 } : null;

const STEPS = [
  { act:1, text:"안녕! 나는 코코야 🌀\n오늘은 AED를 어디에 설치할지 수학으로 찾아볼 거야!", show:[] },
  { act:1, text:"2층에 요양호 학생 3명 발생!\n2-4반, 2-9반, 2-14반이야. 세 교실을 봐.", show:["pts1"] },
  { act:1, text:"세 교실 어디서든 같은 거리에 AED를 놓으면 가장 좋겠지?\n먼저 세 점을 꼭짓점으로 삼각형을 그려봐!", show:["pts1","tri1"] },
  { act:1, type:"question", qid:"q1",
    text:"삼각형의 세 꼭짓점에서 거리가 모두 같은 점을\n무엇이라고 할까?", show:["pts1","tri1"] },
  { act:1, text:"정답! 바로 외심이야.\n세 변의 수직이등분선을 그어볼게.", show:["pts1","tri1","perp1"] },
  { act:1, text:"세 수직이등분선이 딱 한 점에서 만났어!\n이 교점이 외심이야 ✨", show:["pts1","tri1","perp1","circ1"] },
  { act:1, text:"이 외심을 중심으로 외접원을 그리면\n세 꼭짓점까지 거리가 모두 같아. 여기에 AED를 설치!", show:["pts1","tri1","circ1"] },
  { act:1, text:"이 삼각형은 예각삼각형이라 외심이 삼각형 안에 있어.\n삼각형 모양이 달라지면 외심도 달라질까? 3층으로 가보자!", show:["pts1","tri1","circ1"] },
  { act:2, text:"3층! 이번엔 3-2반, 3-5반, 과학실에 요양호 학생이 있어.", show:["pts2"] },
  { act:2, text:"삼각형을 그려봤어.\n아까 2층이랑 모양이 좀 달라 보이지?", show:["pts2","tri2"] },
  { act:2, text:"3-2반과 3-5반이 같은 층에 나란히 있고\n과학실이 한쪽 끝에 있어서 삼각형이 납작하게 생겼어.\n한 각이 90°보다 크면 둔각삼각형이야!", show:["pts2","tri2"] },
  { act:2, type:"question", qid:"q2",
    text:"둔각삼각형의 수직이등분선 3개는\n어디서 만날까?", show:["pts2","tri2"] },
  { act:2, text:"맞아! 삼각형 밖에서 만나.\n수직이등분선을 그어볼게.", show:["pts2","tri2","perp2"] },
  { act:2, text:"외심이 삼각형 밖에 생겼어!\n그래도 세 꼭짓점까지 거리는 여전히 같아. 여기에 AED를 설치! 🏥", show:["pts2","tri2","circ2"] },
  { act:2, text:"💡 정리\n예각삼각형 → 외심이 삼각형 내부\n직각삼각형 → 외심이 빗변의 중점\n둔각삼각형 → 외심이 삼각형 외부", show:["pts2","tri2","circ2"] },
  { act:2, text:"이제 마지막 도전!\n4층에서는 요양호 학생이 4명이야.\n삼각형 하나로는 표현이 안 되는데, 어떻게 외심을 구할까?", show:["pts2","tri2","circ2"] },
  { act:3, text:"4층! 1-2반, 1-6반, 1-9반, 1-13반에 요양호 학생이 있어.", show:["pts3"] },
  { act:3, text:"4개의 점은 삼각형 하나로 표현할 수 없어.\n그럼 삼각형 2개로 나눠볼까?\n1-2반과 1-6반을 공통 꼭짓점으로 삼각형 ①을 그려봐.", show:["pts3","tri3a"] },
  { act:3, type:"question", qid:"q3",
    text:"삼각형 ①을 잘 봐.\n이 삼각형의 외심은 삼각형 안에 있을까, 밖에 있을까?", show:["pts3","tri3a"] },
  { act:3, text:"둔각삼각형이라 외심 O₁이 밖에 있어!\n수직이등분선이 삼각형 밖에서 만났어.", show:["pts3","tri3a","circ3a"] },
  { act:3, text:"이번엔 삼각형 ②야.\n같은 1-2반, 1-6반에 1-13반을 연결해서\n외심 O₂를 구해봐.", show:["pts3","tri3a","tri3b","circ3a","circ3b"] },
  { act:3, type:"question", qid:"q4",
    text:"외심 O₁과 O₂를 구했어.\n4개 점의 AED 최적 위치는 어떻게 구할 수 있을까?", show:["pts3","tri3a","tri3b","circ3a","circ3b"] },
  { act:3, text:"O₁과 O₂를 이은 선분의 중점!\n두 삼각형의 균형점을 찾으면\n4개 점에서 가장 고른 거리에 있는 위치가 나와.", show:["pts3","tri3a","tri3b","circ3a","circ3b","connect3"] },
  { act:3, text:"🎉 완성!\n외심의 개념을 확장해서 4개 점에서도\n최적 AED 위치를 찾을 수 있어! 정말 잘 했어 😊", show:["pts3","tri3a","tri3b","circ3a","circ3b","complete3"] },
];

const QUESTIONS = {
  q1: { prompt:"삼각형의 세 꼭짓점에서 거리가 모두 같은 점은?",
    options:["외심","내심","무게중심","수심"], correct:0,
    wrongHint:"삼각형의 세 꼭짓점을 지나는 원의 중심을 생각해봐!" },
  q2: { prompt:"둔각삼각형의 수직이등분선 3개는 어디서 만날까?",
    options:["삼각형 내부","삼각형 외부","변 위에서","만나지 않음"], correct:1,
    wrongHint:"예각삼각형은 내부, 둔각삼각형은 어떨까? 반대라고 생각해봐!" },
  q3: { prompt:"삼각형 ①은 어떤 삼각형이고, 외심은 어디 있을까?",
    options:["예각삼각형 → 내부","둔각삼각형 → 외부","직각삼각형 → 빗변 중점"], correct:1,
    wrongHint:"삼각형 ①의 각도를 눈으로 확인해봐. 90°보다 큰 각이 있어!" },
  q4: { prompt:"O₁과 O₂ 두 외심으로 4개 점의 최적 위치를 구하려면?",
    options:["O₁과 O₂의 중점","O₁에 가까운 쪽","O₂에 가까운 쪽","O₁과 O₂ 중 하나 선택"], correct:0,
    wrongHint:"두 삼각형에서 균형 잡힌 위치는 두 외심의 딱 중간이야!" },
};

const PCOLORS   = ["#ef5350","#ab47bc","#42a5f5","#ff7043"];
const PB_COLORS = [["#ef9a9a","#ce93d8","#90caf9"],["#ef9a9a","#ce93d8","#90caf9"]];
const FREE_COLORS = ["#ef5350","#ab47bc","#42a5f5"];

const makeRooms = (floor) =>
  Array.from({length:8},(_,col)=>[
    {col, row:0, label:`${floor}-${col+1}반`},
    {col, row:1, label:`${floor}-${col+9}반`},
  ]).flat();

export default function IncentorSim() {
  const navigate  = useNavigate();
  const svgRef    = useRef(null);
  const containerRef = useRef(null);

  const [step,      setStep]    = useState(0);
  const [wrong,     setWrong]   = useState(false);
  const [completed, setComp]    = useState(false);
  const [freeMode,  setFreeMode] = useState(false);
  const [freePts,   setFreePts]  = useState([]);
  const [dragging,  setDragging] = useState(null); // 드래그 중인 점 인덱스

  // ── 터치 이벤트 passive:false 등록 ──────────────
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (dragging === null) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const touch = e.touches[0];
      const x = Math.max(0, Math.min(VW,
        (touch.clientX - rect.left) / rect.width * VW));
      const y = Math.max(0, Math.min(VH,
        (touch.clientY - rect.top) / rect.height * VH));
      setFreePts(prev => prev.map((p,i) => i===dragging ? {x,y} : p));
    };
    el.addEventListener("touchmove", onTouchMove, { passive:false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [dragging]);

  const cur    = STEPS[step] ?? STEPS[STEPS.length-1];
  const show   = new Set(cur.show ?? []);
  const isQ    = cur.type === "question";
  const qData  = isQ ? QUESTIONS[cur.qid] : null;
  const act    = cur.act;
  const floor  = act===1?2:act===2?3:4;

  const rooms = makeRooms(floor);
  if (act===2) {
    const sci = rooms.find(r=>r.col===0&&r.row===1);
    if (sci) sci.label="과학실";
  }

  const patients  = act===1?A1:act===2?A2:A3;
  const showPts   = show.has(`pts${act}`);
  const patLabels = new Set(patients.map(p=>p.label));

  const pb1 = (show.has("perp1")&&CC1)
    ? [A1[0],A1[1],A1[2]].map((_,i,arr)=>perpBisector(arr[i],arr[(i+1)%3])) : [];
  const pb2 = (show.has("perp2")&&CC2)
    ? [A2[0],A2[1],A2[2]].map((_,i,arr)=>perpBisector(arr[i],arr[(i+1)%3])) : [];

  // 자유 모드 외심 (실시간 계산)
  const freeCC = freePts.length===3
    ? circumcenter(freePts[0], freePts[1], freePts[2]) : null;
  const freePB = freePts.length===3 ? [
    perpBisector(freePts[0], freePts[1]),
    perpBisector(freePts[1], freePts[2]),
    perpBisector(freePts[0], freePts[2]),
  ] : [];

  const handleNext = () => {
    if (step >= STEPS.length-1) setComp(true);
    else { setStep(s=>s+1); setWrong(false); }
  };

  const handleAnswer = (idx) => {
    if (!qData) return;
    if (idx===qData.correct) { setWrong(false); setStep(s=>s+1); }
    else setWrong(true);
  };

  const reset = () => {
    setStep(0); setComp(false); setWrong(false);
    setFreeMode(false); setFreePts([]); setDragging(null);
  };

  // SVG 좌표 변환 헬퍼
  const toSVGCoords = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(VW, (clientX-rect.left)/rect.width*VW)),
      y: Math.max(0, Math.min(VH, (clientY-rect.top)/rect.height*VH)),
    };
  };

  // 클릭: 새 점 추가
  const handleSVGClick = (e) => {
    if (!freeMode || freePts.length>=3 || dragging!==null) return;
    const pt = toSVGCoords(e.clientX, e.clientY);
    if (!pt) return;
    setFreePts(prev => [...prev, pt]);
  };

  // 마우스 드래그
  const handleMouseMove = (e) => {
    if (dragging===null) return;
    const pt = toSVGCoords(e.clientX, e.clientY);
    if (!pt) return;
    setFreePts(prev => prev.map((p,i) => i===dragging ? pt : p));
  };

  const handleMouseUp   = () => setDragging(null);

  // 점 드래그 시작 (마우스)
  const startDrag = (e, idx) => {
    e.stopPropagation();
    setDragging(idx);
  };

  // 점 드래그 시작 (터치)
  const startDragTouch = (e, idx) => {
    e.stopPropagation();
    setDragging(idx);
  };

  const floorBg    = act===1?"#1a1a2e":act===2?"#0d1f2d":"#1a2a1a";
  const roomBase   = act===1?"#252438":act===2?"#1a2535":"#1e2e1e";
  const roomStroke = act===1?"#5A5880":act===2?"#3a5570":"#3a5a3a";
  const textColor  = act===1?"#9B99C8":act===2?"#7eb8d4":"#7ec87e";

  const svgCursor = dragging!==null ? "grabbing"
    : (freeMode && freePts.length<3 ? "crosshair" : "default");

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      background:"#0a0a14", overflow:"hidden", userSelect:"none"
    }}>

      {/* 헤더 */}
      <div style={{
        background:"rgba(0,0,0,0.75)", padding:"10px 20px",
        display:"flex", alignItems:"center",
        justifyContent:"space-between", flexShrink:0,
        borderBottom:"1px solid rgba(255,255,255,0.08)"
      }}>
        <button onClick={()=>navigate("/map")} style={{
          background:"none", border:"none", color:"#90caf9",
          fontWeight:"700", fontSize:"14px", cursor:"pointer"
        }}>← 지도로</button>
        <div style={{color:"white", fontWeight:"900", fontSize:"16px"}}>
          🏥 외심 시뮬레이션
          <span style={{
            fontSize:"13px", fontWeight:"400",
            color:"rgba(255,255,255,0.5)", marginLeft:"8px"
          }}>
            {freeMode ? "✏️ 자유 그리기 모드"
              : act===1?"Act 1 · 2층 (내부 외심)"
              : act===2?"Act 2 · 3층 (외부 외심)"
              : "Act 3 · 4층 (4점 문제)"}
          </span>
        </div>
        <button onClick={reset} style={{
          background:"rgba(255,255,255,0.1)", border:"none",
          color:"white", padding:"5px 12px", borderRadius:"8px",
          fontSize:"12px", cursor:"pointer", fontWeight:"600"
        }}>초기화</button>
      </div>

      {/* SVG 본문 */}
      <div ref={containerRef}
        style={{flex:1, position:"relative", overflow:"hidden"}}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width:"100%", height:"100%", cursor:svgCursor }}
          onClick={handleSVGClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchEnd={()=>setDragging(null)}
        >
          {/* 배경 */}
          <rect width={VW} height={VH} fill={floorBg}/>
          <rect x={8} y={6} width={VW-16} height={VH-12}
            fill={floorBg} stroke="#4A4870" strokeWidth={2} rx={6}/>

          {/* 방 렌더링 */}
          {rooms.map((rm,i)=>{
            const rx=SIDE+rm.col*(ROOM_W+GAP);
            const ry=rm.row===0?TOP_Y:BOT_Y;
            const rh=rm.row===0?TOP_H:BOT_H;
            const cx=rx+ROOM_W/2, cy=ry+rh/2;
            // 자유 모드에서는 환자 강조 없음
            const isPt = !freeMode && showPts && patLabels.has(rm.label);
            return (
              <g key={i}>
                <rect x={rx} y={ry} width={ROOM_W} height={rh}
                  fill={isPt?"rgba(239,83,80,0.22)":roomBase}
                  stroke={isPt?"#ef5350":roomStroke}
                  strokeWidth={isPt?2.5:1.5} rx={4}/>
                <text x={cx} y={cy+(isPt?-8:-3)} textAnchor="middle"
                  fill={isPt?"#ff8a80":textColor}
                  fontSize={isPt?13:11} fontWeight={isPt?"900":"bold"}
                  style={{userSelect:"none"}}>{rm.label}</text>
                {isPt && (
                  <text x={cx} y={cy+12} textAnchor="middle"
                    fontSize={15} style={{userSelect:"none"}}>🚨</text>
                )}
              </g>
            );
          })}

          {/* 복도 */}
          <rect x={8} y={COR_Y} width={VW-16} height={COR_H}
            fill="rgba(0,0,0,0.35)"/>
          <text x={VW/2} y={COR_Y+COR_H/2+5} textAnchor="middle"
            fill="rgba(150,148,200,0.18)" fontSize={14} letterSpacing={16}
            style={{userSelect:"none"}}>{floor}층 복도</text>
          {[22,VW-82].map((sx,i)=>(
            <g key={i}>
              <rect x={sx} y={COR_Y+10} width={60} height={COR_H-20}
                fill="rgba(0,0,0,0.4)" stroke="#444468" strokeWidth={1} rx={3}/>
              <text x={sx+30} y={COR_Y+COR_H/2+5} textAnchor="middle"
                fill="#555580" fontSize={9} style={{userSelect:"none"}}>계단</text>
            </g>
          ))}

          {/* ── 튜토리얼 기하 요소 (자유 모드에서는 전부 숨김) ── */}
          {!freeMode && (
            <>
              {show.has("tri1") && (
                <polygon points={A1.map(p=>`${p.x},${p.y}`).join(" ")}
                  fill="rgba(255,213,79,0.07)" stroke="rgba(255,213,79,0.7)"
                  strokeWidth={2.5} strokeDasharray="10 5"/>
              )}
              {show.has("tri2") && (
                <polygon points={A2.map(p=>`${p.x},${p.y}`).join(" ")}
                  fill="rgba(255,152,0,0.07)" stroke="rgba(255,152,0,0.7)"
                  strokeWidth={2.5} strokeDasharray="10 5"/>
              )}
              {show.has("tri3a") && (
                <polygon points={[A3[0],A3[1],A3[2]].map(p=>`${p.x},${p.y}`).join(" ")}
                  fill="rgba(100,181,246,0.07)" stroke="rgba(100,181,246,0.7)"
                  strokeWidth={2.5} strokeDasharray="10 5"/>
              )}
              {show.has("tri3b") && (
                <polygon points={[A3[0],A3[1],A3[3]].map(p=>`${p.x},${p.y}`).join(" ")}
                  fill="rgba(129,199,132,0.07)" stroke="rgba(129,199,132,0.7)"
                  strokeWidth={2} strokeDasharray="8 5"/>
              )}

              {pb1.map((pb,i)=>(
                <line key={`pb1${i}`}
                  x1={pb.x1} y1={pb.y1} x2={pb.x2} y2={pb.y2}
                  stroke={PB_COLORS[0][i]} strokeWidth={1.5}
                  strokeDasharray="7 4" opacity={0.75}/>
              ))}
              {pb2.map((pb,i)=>(
                <line key={`pb2${i}`}
                  x1={pb.x1} y1={pb.y1} x2={pb.x2} y2={pb.y2}
                  stroke={PB_COLORS[1][i]} strokeWidth={1.5}
                  strokeDasharray="7 4" opacity={0.75}/>
              ))}

              {show.has("circ1") && CC1 && (
                <g>
                  <circle cx={CC1.x} cy={CC1.y} r={CC1.r}
                    fill="rgba(76,175,80,0.07)"
                    stroke="rgba(76,175,80,0.55)" strokeWidth={2}
                    strokeDasharray="8 5"/>
                  <circle cx={CC1.x} cy={CC1.y} r={20}
                    fill="none" stroke="rgba(76,175,80,0.35)" strokeWidth={1.5}>
                    <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={CC1.x} cy={CC1.y} r={13}
                    fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                  <text x={CC1.x} y={CC1.y+4} textAnchor="middle"
                    fill="white" fontSize={10} fontWeight="bold"
                    style={{userSelect:"none"}}>AED</text>
                  <rect x={CC1.x+16} y={CC1.y-20} width={66} height={18}
                    rx={4} fill="rgba(0,0,0,0.8)"/>
                  <text x={CC1.x+49} y={CC1.y-8} textAnchor="middle"
                    fill="#81C784" fontSize={11} fontWeight="bold"
                    style={{userSelect:"none"}}>외심 (내부)</text>
                </g>
              )}

              {show.has("circ2") && CC2 && (
                <g>
                  <circle cx={CC2.x} cy={CC2.y} r={CC2.r}
                    fill="rgba(76,175,80,0.07)"
                    stroke="rgba(76,175,80,0.55)" strokeWidth={2}
                    strokeDasharray="8 5"/>
                  <circle cx={CC2.x} cy={CC2.y} r={20}
                    fill="none" stroke="rgba(76,175,80,0.35)" strokeWidth={1.5}>
                    <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={CC2.x} cy={CC2.y} r={13}
                    fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                  <text x={CC2.x} y={CC2.y+4} textAnchor="middle"
                    fill="white" fontSize={10} fontWeight="bold"
                    style={{userSelect:"none"}}>AED</text>
                  <rect x={CC2.x+16} y={CC2.y-20} width={66} height={18}
                    rx={4} fill="rgba(0,0,0,0.8)"/>
                  <text x={CC2.x+49} y={CC2.y-8} textAnchor="middle"
                    fill="#81C784" fontSize={11} fontWeight="bold"
                    style={{userSelect:"none"}}>외심 (외부)</text>
                </g>
              )}

              {show.has("circ3a") && CC3a && (
                <g>
                  <circle cx={CC3a.x} cy={CC3a.y} r={CC3a.r}
                    fill="none" stroke="rgba(100,181,246,0.4)"
                    strokeWidth={1.5} strokeDasharray="8 5"/>
                  <circle cx={CC3a.x} cy={CC3a.y} r={10}
                    fill="#1565C0" stroke="#90CAF9" strokeWidth={2}/>
                  <rect x={CC3a.x+13} y={CC3a.y-11} width={32} height={20}
                    rx={4} fill="rgba(0,0,0,0.8)"/>
                  <text x={CC3a.x+29} y={CC3a.y+3} textAnchor="middle"
                    fill="#90CAF9" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none"}}>O₁</text>
                </g>
              )}

              {show.has("circ3b") && CC3b && (
                <g>
                  <circle cx={CC3b.x} cy={CC3b.y} r={CC3b.r}
                    fill="none" stroke="rgba(129,199,132,0.4)"
                    strokeWidth={1.5} strokeDasharray="8 5"/>
                  <circle cx={CC3b.x} cy={CC3b.y} r={10}
                    fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                  <rect x={CC3b.x+13} y={CC3b.y-11} width={32} height={20}
                    rx={4} fill="rgba(0,0,0,0.8)"/>
                  <text x={CC3b.x+29} y={CC3b.y+3} textAnchor="middle"
                    fill="#81C784" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none"}}>O₂</text>
                </g>
              )}

              {(show.has("connect3")||show.has("complete3")) && CC3a && CC3b && M3 && (
                <g>
                  <line x1={CC3a.x} y1={CC3a.y} x2={CC3b.x} y2={CC3b.y}
                    stroke="rgba(255,213,79,0.8)" strokeWidth={2.5}
                    strokeDasharray="8 4"/>
                  {show.has("connect3") && !show.has("complete3") && (
                    <g>
                      <circle cx={M3.x} cy={M3.y} r={8}
                        fill="rgba(255,213,79,0.9)" stroke="white" strokeWidth={2}/>
                      <rect x={M3.x+12} y={M3.y-11} width={68} height={20}
                        rx={4} fill="rgba(0,0,0,0.8)"/>
                      <text x={M3.x+46} y={M3.y+3} textAnchor="middle"
                        fill="#FFD54F" fontSize={11} fontWeight="bold"
                        style={{userSelect:"none"}}>중점 = ?</text>
                    </g>
                  )}
                  {show.has("complete3") && (
                    <g>
                      <circle cx={M3.x} cy={M3.y} r={22}
                        fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth={1.5}>
                        <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx={M3.x} cy={M3.y} r={15}
                        fill="#2E7D32" stroke="#81C784" strokeWidth={2.5}/>
                      <text x={M3.x} y={M3.y+4} textAnchor="middle"
                        fill="white" fontSize={10} fontWeight="bold"
                        style={{userSelect:"none"}}>AED</text>
                      <rect x={M3.x+18} y={M3.y-22} width={102} height={20}
                        rx={5} fill="rgba(0,0,0,0.85)"/>
                      <text x={M3.x+69} y={M3.y-9} textAnchor="middle"
                        fill="#81C784" fontSize={11} fontWeight="bold"
                        style={{userSelect:"none"}}>O₁O₂ 선분의 중점</text>
                    </g>
                  )}
                </g>
              )}

              {/* 환자 점 */}
              {showPts && patients.map((p,i)=>(
                <g key={`pt${i}`}>
                  <circle cx={p.x} cy={p.y} r={16}
                    fill={`${PCOLORS[i]}30`} stroke="none">
                    <animate attributeName="r" values="12;20;12"
                      dur="1.6s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={p.x} cy={p.y} r={12}
                    fill={PCOLORS[i]} stroke="white" strokeWidth={2.5}/>
                  <text x={p.x} y={p.y+5} textAnchor="middle"
                    fill="white" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none"}}>{i+1}</text>
                </g>
              ))}

              {/* 완료 배너 */}
              {completed && (
                <g>
                  <rect x={VW/2-220} y={VH-54} width={440} height={42}
                    rx={12} fill="rgba(46,125,50,0.92)"/>
                  <text x={VW/2} y={VH-29} textAnchor="middle"
                    fill="white" fontSize={14} fontWeight="bold">
                    🎉 모든 층에서 외심으로 AED 최적 위치를 찾았어!
                  </text>
                  <text x={VW/2} y={VH-13} textAnchor="middle"
                    fill="rgba(255,255,255,0.7)" fontSize={11}>
                    아래 [삼각형 그리기] 버튼으로 직접 그려봐!
                  </text>
                </g>
              )}
            </>
          )}

          {/* ── 자유 그리기 모드 요소 ── */}
          {freeMode && (
            <>
              {/* 삼각형 */}
              {freePts.length===3 && (
                <polygon
                  points={freePts.map(p=>`${p.x},${p.y}`).join(" ")}
                  fill="rgba(255,213,79,0.08)"
                  stroke="rgba(255,213,79,0.85)"
                  strokeWidth={2.5}/>
              )}

              {/* 수직이등분선 */}
              {freePB.map((pb,i)=>(
                <line key={`fpb${i}`}
                  x1={pb.x1} y1={pb.y1} x2={pb.x2} y2={pb.y2}
                  stroke={["#ef9a9a","#ce93d8","#90caf9"][i]}
                  strokeWidth={1.5} strokeDasharray="6 4" opacity={0.85}/>
              ))}

              {/* 외접원 + 외심 */}
              {freeCC && (
                <g>
                  <circle cx={freeCC.x} cy={freeCC.y} r={freeCC.r}
                    fill="rgba(76,175,80,0.08)"
                    stroke="rgba(76,175,80,0.8)"
                    strokeWidth={2.5} strokeDasharray="8 4"/>
                  <circle cx={freeCC.x} cy={freeCC.y} r={22}
                    fill="none" stroke="rgba(76,175,80,0.4)" strokeWidth={1.5}>
                    <animate attributeName="r" values="13;23;13"
                      dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0;0.5"
                      dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={freeCC.x} cy={freeCC.y} r={13}
                    fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                  <text x={freeCC.x} y={freeCC.y+4} textAnchor="middle"
                    fill="white" fontSize={10} fontWeight="bold"
                    style={{userSelect:"none"}}>외심</text>
                </g>
              )}

              {/* 드래그 가능한 꼭짓점 점 3개 */}
              {freePts.map((p,i)=>(
                <g key={`fp${i}`}
                  style={{cursor: dragging===i ? "grabbing" : "grab"}}
                  onMouseDown={e=>startDrag(e,i)}
                  onTouchStart={e=>startDragTouch(e,i)}
                >
                  {/* 넓은 히트 영역 */}
                  <circle cx={p.x} cy={p.y} r={24}
                    fill="transparent" stroke="none"/>
                  {/* 외곽 글로우 */}
                  <circle cx={p.x} cy={p.y} r={18}
                    fill={`${FREE_COLORS[i]}30`} stroke="none"/>
                  {/* 메인 점 */}
                  <circle cx={p.x} cy={p.y} r={13}
                    fill={FREE_COLORS[i]} stroke="white" strokeWidth={2.5}/>
                  <text x={p.x} y={p.y+5} textAnchor="middle"
                    fill="white" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none", pointerEvents:"none"}}>
                    {i+1}
                  </text>
                  {/* 드래그 힌트 아이콘 */}
                  {dragging===null && (
                    <text x={p.x+16} y={p.y-14} textAnchor="middle"
                      fontSize={12} style={{userSelect:"none", pointerEvents:"none"}}
                      opacity={0.7}>⠿</text>
                  )}
                </g>
              ))}

              {/* 점 찍기 안내 */}
              {freePts.length < 3 && (
                <g>
                  <rect x={VW/2-175} y={VH-50} width={350} height={34}
                    rx={9} fill="rgba(21,101,192,0.85)"/>
                  <text x={VW/2} y={VH-29} textAnchor="middle"
                    fill="white" fontSize={13} fontWeight="bold">
                    🖱 원하는 위치를 클릭해서 점을 찍어봐! ({freePts.length}/3)
                  </text>
                </g>
              )}

              {/* 드래그 안내 */}
              {freePts.length===3 && !freeCC && (
                <g>
                  <rect x={VW/2-160} y={VH-50} width={320} height={34}
                    rx={9} fill="rgba(0,0,0,0.65)"/>
                  <text x={VW/2} y={VH-29} textAnchor="middle"
                    fill="rgba(255,255,255,0.8)" fontSize={12}>
                    ⠿ 점을 드래그해서 위치를 바꿔봐!
                  </text>
                </g>
              )}
            </>
          )}
        </svg>

        {/* 코코 대화창 */}
        {!isQ && !completed && !freeMode && (
          <div style={{
            position:"absolute", bottom:"40%", left:"70%",
            display:"flex", flexDirection:"column",
            alignItems:"flex-start", gap:"0px",
            zIndex:20, width:"min(460px,46%)"
          }}>
            <div style={{
              background:"white", borderRadius:"16px",
              padding:"16px 20px", width:"100%",
              boxShadow:"0 4px 24px rgba(0,0,0,0.35)",
              border:"2px solid #5b9fe8",
              fontSize:"14px", lineHeight:"1.8",
              whiteSpace:"pre-line"
            }}>
              {cur.text}
              <div style={{marginTop:"12px"}}>
                <button onClick={handleNext} style={{
                  padding:"8px 24px",
                  background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
                  color:"white", border:"none", borderRadius:"20px",
                  fontSize:"13px", fontWeight:"700", cursor:"pointer"
                }}>
                  {step>=STEPS.length-1?"완료 ✓":"다음 ▶"}
                </button>
              </div>
            </div>
            <img src={cocoImg} alt="COCO" style={{
              width:"200px", height:"200px", objectFit:"contain",
              filter:"drop-shadow(0 4px 14px rgba(102,126,234,0.55))"
            }}/>
          </div>
        )}

        {/* 질문 팝업 */}
        {isQ && qData && (
          <>
            <div style={{
              position:"absolute", inset:0,
              background:"rgba(0,0,0,0.55)", zIndex:40
            }}/>
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              background:"white", borderRadius:"22px",
              padding:"28px 30px", maxWidth:"420px", width:"90%",
              zIndex:50, boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
              animation:"popIn 0.3s ease-out"
            }}>
              <div style={{
                display:"flex", alignItems:"flex-start",
                gap:"14px", marginBottom:"20px"
              }}>
                <img src={cocoImg} alt="COCO" style={{
                  width:"54px", height:"54px",
                  objectFit:"contain", flexShrink:0
                }}/>
                <div>
                  <div style={{
                    fontSize:"11px", color:"#888",
                    marginBottom:"4px", fontWeight:"600"
                  }}>🌀 코코의 질문</div>
                  <div style={{
                    fontSize:"16px", fontWeight:"900",
                    lineHeight:"1.55", whiteSpace:"pre-line"
                  }}>
                    {qData.prompt}
                  </div>
                </div>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"9px"}}>
                {qData.options.map((opt,i)=>(
                  <button key={i} onClick={()=>handleAnswer(i)} style={{
                    padding:"13px 18px", borderRadius:"12px",
                    border:"2px solid #e2e8f0", background:"white",
                    fontSize:"15px", fontWeight:"600",
                    cursor:"pointer", textAlign:"left", transition:"all 0.15s"
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.background="#f0f4ff";
                    e.currentTarget.style.borderColor="#5b9fe8";
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.background="white";
                    e.currentTarget.style.borderColor="#e2e8f0";
                  }}>
                    {opt}
                  </button>
                ))}
              </div>
              {wrong && (
                <div style={{
                  marginTop:"14px", background:"#fff3e0",
                  borderRadius:"10px", padding:"11px 14px",
                  fontSize:"13px", color:"#E65100",
                  fontWeight:"600", lineHeight:"1.6"
                }}>
                  🤔 {qData.wrongHint}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 하단 바 */}
      <div style={{
        background:"rgba(0,0,0,0.75)", padding:"8px 16px",
        display:"flex", gap:"8px", alignItems:"center",
        flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.07)"
      }}>
        {[
          {a:1, label:"Act 1 · 2층 (내부 외심)"},
          {a:2, label:"Act 2 · 3층 (외부 외심)"},
          {a:3, label:"Act 3 · 4층 (4점)"},
        ].map(({a,label})=>(
          <div key={a} style={{
            padding:"4px 12px", borderRadius:"8px", fontSize:"12px",
            background: act===a&&!freeMode
              ?"rgba(76,175,80,0.35)":"rgba(255,255,255,0.05)",
            color: act===a&&!freeMode
              ?"#81C784":"rgba(255,255,255,0.35)",
            fontWeight: act===a&&!freeMode?"700":"400"
          }}>{label}</div>
        ))}

        {/* 진행 점 */}
        <div style={{
          marginLeft:"auto", display:"flex",
          gap:"3px", alignItems:"center"
        }}>
          {STEPS.map((_,i)=>(
            <div key={i} style={{
              width: i===step?16:7, height:7,
              borderRadius:"4px",
              background: i<step
                ?"rgba(76,175,80,0.6)"
                :i===step?"#81C784":"rgba(255,255,255,0.12)",
              transition:"all 0.3s"
            }}/>
          ))}
        </div>

        {/* 자유 그리기 버튼 */}
        {completed && (
          <div style={{display:"flex", gap:"6px", marginLeft:"8px"}}>
            {!freeMode ? (
              <button onClick={()=>{ setFreeMode(true); setFreePts([]); setDragging(null); }}
                style={{
                  padding:"5px 16px", borderRadius:"8px",
                  background:"linear-gradient(135deg,#42a5f5,#1565C0)",
                  color:"white", border:"none",
                  fontSize:"12px", fontWeight:"700", cursor:"pointer",
                  boxShadow:"0 2px 8px rgba(21,101,192,0.4)"
                }}>
                ✏️ 삼각형 그리기
              </button>
            ) : (
              <>
                <button onClick={()=>{ setFreePts([]); setDragging(null); }}
                  style={{
                    padding:"5px 12px", borderRadius:"8px",
                    background:"rgba(255,255,255,0.15)",
                    color:"white", border:"1px solid rgba(255,255,255,0.2)",
                    fontSize:"12px", fontWeight:"600", cursor:"pointer"
                  }}>🔄 점 초기화</button>
                <button onClick={()=>{ setFreeMode(false); setFreePts([]); setDragging(null); }}
                  style={{
                    padding:"5px 12px", borderRadius:"8px",
                    background:"rgba(229,57,53,0.5)",
                    color:"white", border:"none",
                    fontSize:"12px", fontWeight:"600", cursor:"pointer"
                  }}>✕ 종료</button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { transform:translate(-50%,-50%) scale(0.85); opacity:0 }
          to   { transform:translate(-50%,-50%) scale(1);    opacity:1 }
        }
      `}</style>

      <CocoChat
        systemPrompt={PROMPTS.aed}
        initialMessage="안녕! 나는 코코야 🌀&#10;외심의 개념이 어려우면 물어봐!"
      />
    </div>
  );
}