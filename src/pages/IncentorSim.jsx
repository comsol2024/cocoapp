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

const perpBisector = (A, B, ext=360) => {
  const mx=(A.x+B.x)/2, my=(A.y+B.y)/2;
  const dx=B.x-A.x, dy=B.y-A.y, len=Math.hypot(dx,dy)||1;
  const px=-dy/len, py=dx/len;
  return { x1:mx-px*ext, y1:my-py*ext, x2:mx+px*ext, y2:my+py*ext };
};

const VW=1000, VH=580;
const RW=110, RH=60;

// ── 역 Z 평면도 방 중심 좌표 ─────────────────────────────────
const TOP_CX = [133, 275, 418, 562, 705, 850]; // 상단 수평동 (6개)
const TOP_CY = 58;
const RC_CX  = 770;                            // 우측 연결동 x
const RC_CY  = [207, 290, 368];                // 우측 연결동 y (3개)
const BOT_CX = [193, 335, 478, 622, 765, 910];      // 하단 수평동 (5개)
const BOT_CY = 513;

// ── 역 Z 건물 경계 ───────────────────────────────────────────
// 상단동: x=15~968, y=15~108
// 우측 연결동: x=840~968, y=108~463
// 하단동: x=240~968, y=463~565

// 복도 위치
const COR_H = 50; // 복도 높이
const COR_W = 138; // 우측 복도 폭
const TOP_COR_Y1=108, TOP_COR_Y2=148;    // 상단 수평 복도
const RC_COR_X1 =400, RC_COR_X2=878;    // 우측 수직 복도 (방 왼쪽)
const BOT_COR_Y1=412, BOT_COR_Y2=480;   // 하단 수평 복도

// ── 층별 방 정의 ─────────────────────────────────────────────
const ROOMS = {
  2: [
    // 상단 수평동 (6개)
    {cx:TOP_CX[0],cy:TOP_CY, w:RW,h:RH, label:"교무실",  type:"special"},
    {cx:TOP_CX[1],cy:TOP_CY, w:RW,h:RH, label:"2-1반",   type:"class"},
    {cx:TOP_CX[2],cy:TOP_CY, w:RW,h:RH, label:"2-2반",   type:"class"},
    {cx:TOP_CX[3],cy:TOP_CY, w:RW,h:RH, label:"과학실",  type:"special"},
    {cx:TOP_CX[4],cy:TOP_CY, w:RW,h:RH, label:"2-3반",   type:"class"},
    {cx:TOP_CX[5],cy:TOP_CY, w:RW,h:RH, label:"2-4반",   type:"class"},
    // 우측 연결동 (3개)
    {cx:RC_CX, cy:RC_CY[0], w:RW,h:RH, label:"2-5반",   type:"class"},
    {cx:RC_CX, cy:RC_CY[1], w:RW,h:RH, label:"2-6반",   type:"class"},
    {cx:RC_CX, cy:RC_CY[2], w:RW,h:RH, label:"보건실",  type:"special"},
    // 하단 수평동 (5개)
    {cx:BOT_CX[0],cy:BOT_CY, w:RW,h:RH, label:"2-7반",  type:"class"},
    {cx:BOT_CX[1],cy:BOT_CY, w:RW,h:RH, label:"음악실", type:"special"},
    {cx:BOT_CX[2],cy:BOT_CY, w:RW,h:RH, label:"2-8반", type:"class"},
    {cx:BOT_CX[3],cy:BOT_CY, w:RW,h:RH, label:"2-9반", type:"class"},
    {cx:BOT_CX[4],cy:BOT_CY, w:RW,h:RH, label:"2-10반", type:"class"},
  ],
  3: [
    {cx:TOP_CX[0],cy:TOP_CY, w:RW,h:RH, label:"교무실",  type:"special"},
    {cx:TOP_CX[1],cy:TOP_CY, w:RW,h:RH, label:"3-1반",   type:"class"},
    {cx:TOP_CX[2],cy:TOP_CY, w:RW,h:RH, label:"3-2반",   type:"class"},
    {cx:TOP_CX[3],cy:TOP_CY, w:RW,h:RH, label:"3-3반",   type:"class"},
    {cx:TOP_CX[4],cy:TOP_CY, w:RW,h:RH, label:"3-4반",   type:"class"},
    {cx:TOP_CX[5],cy:TOP_CY, w:RW,h:RH, label:"도서실",  type:"special"},
    {cx:RC_CX, cy:RC_CY[0], w:RW,h:RH, label:"상담실",  type:"special"},
    {cx:RC_CX, cy:RC_CY[1], w:RW,h:RH, label:"3-5반",   type:"class"},
    {cx:RC_CX, cy:RC_CY[2], w:RW,h:RH, label:"과학실",  type:"special"},
    {cx:BOT_CX[0],cy:BOT_CY, w:RW,h:RH, label:"3-6반",  type:"class"},
    {cx:BOT_CX[1],cy:BOT_CY, w:RW,h:RH, label:"기술실", type:"special"},
    {cx:BOT_CX[2],cy:BOT_CY, w:RW,h:RH, label:"가정실", type:"special"},
    {cx:BOT_CX[3],cy:BOT_CY, w:RW,h:RH, label:"3-7반",  type:"class"},
    {cx:BOT_CX[4],cy:BOT_CY, w:RW,h:RH, label:"3-8반", type:"class"},
  ],
  4: [
    {cx:TOP_CX[0],cy:TOP_CY, w:RW,h:RH, label:"컴퓨터실", type:"special"},
    {cx:TOP_CX[1],cy:TOP_CY, w:RW,h:RH, label:"1-1반",   type:"class"},
    {cx:TOP_CX[2],cy:TOP_CY, w:RW,h:RH, label:"1-2반",   type:"class"},
    {cx:TOP_CX[3],cy:TOP_CY, w:RW,h:RH, label:"1-3반",   type:"class"},
    {cx:TOP_CX[4],cy:TOP_CY, w:RW,h:RH, label:"1-4반",   type:"class"},
    {cx:TOP_CX[5],cy:TOP_CY, w:RW,h:RH, label:"1-5반",   type:"class"},
    {cx:RC_CX, cy:RC_CY[0], w:RW,h:RH, label:"체력단련실",type:"special"},
    {cx:RC_CX, cy:RC_CY[1], w:RW,h:RH, label:"1-6반",   type:"class"},
    {cx:RC_CX, cy:RC_CY[2], w:RW,h:RH, label:"1-7반",   type:"class"},
    {cx:BOT_CX[0],cy:BOT_CY, w:RW,h:RH, label:"1-8반",  type:"class"},
    {cx:BOT_CX[1],cy:BOT_CY, w:RW,h:RH, label:"1-9반", type:"class"},
    {cx:BOT_CX[2],cy:BOT_CY, w:RW,h:RH, label:"시청각실",type:"special"},
    {cx:BOT_CX[3],cy:BOT_CY, w:RW,h:RH, label:"1-10반", type:"class"},
    {cx:BOT_CX[4],cy:BOT_CY, w:RW,h:RH, label:"1-11반", type:"class"},
  ],
};

// ── 환자 위치 (기하학 검증 완료) ─────────────────────────────
// A1: 예각삼각형 → 외심 내부
const A1 = [
  {x:TOP_CX[2], y:TOP_CY,   label:"2-2반"},   // 상단 중간
  {x:RC_CX,     y:RC_CY[1], label:"2-6반"},   // 우측 중간
  {x:BOT_CX[0], y:BOT_CY,   label:"2-7반"},   // 하단 좌측
];
// A2: 둔각삼각형 → 외심 외부
const A2 = [
  {x:TOP_CX[1], y:TOP_CY,   label:"3-1반"},   // 상단 왼쪽
  {x:TOP_CX[4], y:TOP_CY,   label:"3-4반"},   // 상단 오른쪽 (둔각)
  {x:RC_CX,     y:RC_CY[0], label:"상담실"},  // 우측 위
];
// A3: 4점
const A3 = [
  {x:TOP_CX[1], y:TOP_CY,   label:"1-1반"},
  {x:TOP_CX[4], y:TOP_CY,   label:"1-4반"},
  {x:BOT_CX[2], y:BOT_CY,   label:"시청각실"},
  {x:BOT_CX[4], y:BOT_CY,   label:"1-11반"},
];

const CC1  = circumcenter(A1[0], A1[1], A1[2]);
const CC2  = circumcenter(A2[0], A2[1], A2[2]);
const CC3a = circumcenter(A3[0], A3[1], A3[2]);
const CC3b = circumcenter(A3[0], A3[1], A3[3]);
const M3   = CC3a && CC3b
  ? { x:(CC3a.x+CC3b.x)/2, y:(CC3a.y+CC3b.y)/2 } : null;

// ── STEPS / QUESTIONS (기존 유지) ───────────────────────────
const STEPS = [
  { act:1, text:"안녕! 나는 코코야 🌀\n오늘은 AED를 어디에 설치할지 수학으로 찾아볼 거야!", show:[] },
  { act:1, text:"2층에 요양호 학생 3명 발생!\n2-2반, 2-6반, 2-8반이야. 세 교실을 봐.", show:["pts1"] },
  { act:1, text:"세 교실 어디서든 같은 거리에 AED를 놓으면 가장 좋겠지?\n먼저 세 점을 꼭짓점으로 삼각형을 그려봐!", show:["pts1","tri1"] },
  { act:1, type:"question", qid:"q1",
    text:"삼각형의 세 꼭짓점에서 거리가 모두 같은 점을\n무엇이라고 할까?", show:["pts1","tri1"] },
  { act:1, text:"정답! 바로 외심이야.\n세 변의 수직이등분선을 그어볼게.", show:["pts1","tri1","perp1"] },
  { act:1, text:"세 수직이등분선이 딱 한 점에서 만났어!\n이 교점이 외심이야 ✨", show:["pts1","tri1","perp1","circ1"] },
  { act:1, text:"이 외심을 중심으로 외접원을 그리면\n세 꼭짓점까지 거리가 모두 같아. 여기에 AED를 설치!", show:["pts1","tri1","circ1"] },
  { act:1, text:"이 삼각형은 예각삼각형이라 외심이 삼각형 안에 있어.\n삼각형 모양이 달라지면 외심도 달라질까? 3층으로 가보자!", show:["pts1","tri1","circ1"] },
  { act:2, text:"3층! 이번엔 3-1반, 3-4반, 상담실에 요양호 학생이 있어.", show:["pts2"] },
  { act:2, text:"삼각형을 그려봤어.\n아까 2층이랑 모양이 좀 달라 보이지?", show:["pts2","tri2"] },
  { act:2, text:"3-1반과 3-4반이 상단 복도에 나란히 있고\n상담실이 우측 연결동에 있어서 삼각형이 납작해졌어.\n한 각이 90°보다 크면 둔각삼각형이야!", show:["pts2","tri2"] },
  { act:2, type:"question", qid:"q2",
    text:"둔각삼각형의 수직이등분선 3개는\n어디서 만날까?", show:["pts2","tri2"] },
  { act:2, text:"맞아! 삼각형 밖에서 만나.\n수직이등분선을 그어볼게.", show:["pts2","tri2","perp2"] },
  { act:2, text:"외심이 삼각형 밖에 생겼어!\n그래도 세 꼭짓점까지 거리는 여전히 같아. 여기에 AED를 설치! 🏥", show:["pts2","tri2","circ2"] },
  { act:2, text:"💡 정리\n예각삼각형 → 외심이 삼각형 내부\n직각삼각형 → 외심이 빗변의 중점\n둔각삼각형 → 외심이 삼각형 외부", show:["pts2","tri2","circ2"] },
  { act:2, text:"이제 마지막 도전!\n4층에서는 요양호 학생이 4명이야.\n삼각형 하나로는 표현이 안 되는데, 어떻게 외심을 구할까?", show:["pts2","tri2","circ2"] },
  { act:3, text:"4층! 1-1반, 1-4반, 시청각실, 1-11반에 요양호 학생이 있어.", show:["pts3"] },
  { act:3, text:"4개의 점은 삼각형 하나로 표현할 수 없어.\n그럼 삼각형 2개로 나눠볼까?\n1-1반과 1-4반을 공통 꼭짓점으로 삼각형 ①을 그려봐.", show:["pts3","tri3a"] },
  { act:3, type:"question", qid:"q3",
    text:"삼각형 ①을 잘 봐.\n이 삼각형의 외심은 삼각형 안에 있을까, 밖에 있을까?", show:["pts3","tri3a"] },
  { act:3, text:"예각삼각형이라 외심 O₁이 안에 있어!\n수직이등분선이 삼각형 내부에서 만났어.", show:["pts3","tri3a","circ3a"] },
  { act:3, text:"이번엔 삼각형 ②야.\n같은 1-1반, 1-4반에 1-11반을 연결해서\n외심 O₂를 구해봐.", show:["pts3","tri3a","tri3b","circ3a","circ3b"] },
  { act:3, type:"question", qid:"q4",
    text:"외심 O₁과 O₂를 구했어.\n4개 점의 AED 최적 위치는 어떻게 구할 수 있을까?", show:["pts3","tri3a","tri3b","circ3a","circ3b"] },
  { act:3, text:"O₁과 O₂를 이은 선분의 중점!\n두 삼각형의 균형점을 찾으면\n4개 점에서 가장 고른 거리에 있는 위치가 나와.", show:["pts3","tri3a","tri3b","circ3a","circ3b","connect3"] },
  { act:3, text:"🎉 완성!\n외심의 개념을 확장해서 4개 점에서도\n최적 AED 위치를 찾을 수 있어! 정말 잘 했어 😊", show:["pts3","tri3a","tri3b","circ3a","circ3b","complete3"] },
];

const QUESTIONS = {
  q1:{ prompt:"삼각형의 세 꼭짓점에서 거리가 모두 같은 점은?",
    options:["외심","내심","무게중심","수심"], correct:0,
    wrongHint:"삼각형의 세 꼭짓점을 지나는 원의 중심을 생각해봐!" },
  q2:{ prompt:"둔각삼각형의 수직이등분선 3개는 어디서 만날까?",
    options:["삼각형 내부","삼각형 외부","변 위에서","만나지 않음"], correct:1,
    wrongHint:"예각삼각형은 내부, 둔각삼각형은 어떨까? 반대라고 생각해봐!" },
  q3:{ prompt:"삼각형 ①은 어떤 삼각형이고, 외심은 어디 있을까?",
    options:["예각삼각형 → 내부","둔각삼각형 → 외부","직각삼각형 → 빗변 중점"], correct:0,
    wrongHint:"삼각형 ①의 각도를 잘 살펴봐. 모든 각이 90°보다 작아!" },
  q4:{ prompt:"O₁과 O₂ 두 외심으로 4개 점의 최적 위치를 구하려면?",
    options:["O₁과 O₂의 중점","O₁에 가까운 쪽","O₂에 가까운 쪽","O₁과 O₂ 중 하나 선택"], correct:0,
    wrongHint:"두 삼각형에서 균형 잡힌 위치는 두 외심의 딱 중간이야!" },
};

const PCOLORS    = ["#ef5350","#ab47bc","#42a5f5","#ff7043"];
const PB_COLORS  = [["#ef9a9a","#ce93d8","#2b72ac"],["#ef9a9a","#ce93d8","#90caf9"]];
const FREE_COLORS= ["#ef5350","#ab47bc","#194f7a"];

// 층별 색상
const THEME = {
  // 2층: 따뜻하고 안정감 있는 샌드 베이지 & 웜 브라운 톤
  2: { 
    bg: "#f4f1ea",        // 전체 배경 (화사한 아이보리)
    wall: "#e2ddd5",      // 건물 외벽
    class_f: "#ffffff",   // 일반 교실 채우기 (깨끗한 흰색)
    class_s: "#d1c7bd",   // 일반 교실 테두리
    special_f: "#eaf0e6", // 특별실 채우기 (연한 은은한 연두)
    special_s: "#b8cca6", // 특별실 테두리
    text: "#4a4238",      // 텍스트 (시독성 높은 웜 그레이)
    corridor: "#ded6cb",  // 복도 (밝은 샌드)
    court: "#f9f8f6"      // 안뜰 (완전한 오프화이트)
  },

  // 3층: 차분하고 집중력 높은 세이지 그린 & 페일 민트 톤
  3: { 
    bg: "#eff5f1",        // 전체 배경 (연한 파스텔 그린)
    wall: "#d3e3d9",      // 건물 외벽
    class_f: "#ffffff",   // 일반 교실 채우기
    class_s: "#a8c8b4",   // 일반 교실 테두리
    special_f: "#e1edea", // 특별실 채우기 (연한 민트)
    special_s: "#8ebbb0", // 특별실 테두리
    text: "#2c4235",      // 텍스트 (딥 세이지)
    corridor: "#cfebd9",  // 복도
    court: "#f6faf8"      // 안뜰
  },

  // 4층: 시원하고 청량한 스카이 블루 & 소프트 픽셀 톤
  4: { 
    bg: "#f0f4f9",        // 전체 배경 (소프트 블루 아이보리)
    wall: "#d5e0ea",      // 건물 외벽
    class_f: "#ffffff",   // 일반 교실 채우기
    class_s: "#abc2d6",   // 일반 교실 테두리
    special_f: "#e4ecf5", // 특별실 채우기 (연한 블루)
    special_s: "#8cb2d6", // 특별실 테두리
    text: "#22384a",      // 텍스트 (딥 블루 그레이)
    corridor: "#cadbf0",  // 복도
    court: "#f7f9fc"      // 안뜰
  },
};
export default function IncentorSim() {
  const navigate     = useNavigate();
  const svgRef       = useRef(null);
  const containerRef = useRef(null);

  const [step,      setStep]     = useState(0);
  const [wrong,     setWrong]    = useState(false);
  const [completed, setComp]     = useState(false);
  const [freeMode,  setFreeMode] = useState(false);
  const [freePts,   setFreePts]  = useState([]);
  const [dragging,  setDragging] = useState(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onTM = (e) => {
      if (dragging===null) return;
      e.preventDefault();
      const rect=el.getBoundingClientRect();
      const t=e.touches[0];
      const x=Math.max(0,Math.min(VW,(t.clientX-rect.left)/rect.width*VW));
      const y=Math.max(0,Math.min(VH,(t.clientY-rect.top)/rect.height*VH));
      setFreePts(prev=>prev.map((p,i)=>i===dragging?{x,y}:p));
    };
    el.addEventListener("touchmove",onTM,{passive:false});
    return ()=>el.removeEventListener("touchmove",onTM);
  },[dragging]);

  const cur   = STEPS[step]??STEPS[STEPS.length-1];
  const show  = new Set(cur.show??[]);
  const isQ   = cur.type==="question";
  const qData = isQ?QUESTIONS[cur.qid]:null;
  const act   = cur.act;
  const floor = act===1?2:act===2?3:4;
  const theme = THEME[floor];

  const patients  = act===1?A1:act===2?A2:A3;
  const rooms     = ROOMS[floor];
  const showPts   = show.has(`pts${act}`);
  const patLabels = new Set(patients.map(p=>p.label));

  const pb1=(show.has("perp1")&&CC1)?[A1[0],A1[1],A1[2]].map((_,i,arr)=>perpBisector(arr[i],arr[(i+1)%3])):[];
  const pb2=(show.has("perp2")&&CC2)?[A2[0],A2[1],A2[2]].map((_,i,arr)=>perpBisector(arr[i],arr[(i+1)%3])):[];

  const freeCC=freePts.length===3?circumcenter(freePts[0],freePts[1],freePts[2]):null;
  const freePB=freePts.length===3?[
    perpBisector(freePts[0],freePts[1]),
    perpBisector(freePts[1],freePts[2]),
    perpBisector(freePts[0],freePts[2]),
  ]:[];

  const handleNext=()=>{
    if(step>=STEPS.length-1)setComp(true);
    else{setStep(s=>s+1);setWrong(false);}
  };
  const handleAnswer=(idx)=>{
    if(!qData)return;
    if(idx===qData.correct){setWrong(false);setStep(s=>s+1);}
    else setWrong(true);
  };
  const reset=()=>{setStep(0);setComp(false);setWrong(false);setFreeMode(false);setFreePts([]);setDragging(null);};
  const toSVG=(cx,cy)=>{
    const svg=svgRef.current;if(!svg)return null;
    const r=svg.getBoundingClientRect();
    return{x:Math.max(0,Math.min(VW,(cx-r.left)/r.width*VW)),
           y:Math.max(0,Math.min(VH,(cy-r.top)/r.height*VH))};
  };
  const handleClick=(e)=>{
    if(!freeMode||freePts.length>=3||dragging!==null)return;
    const pt=toSVG(e.clientX,e.clientY);if(pt)setFreePts(p=>[...p,pt]);
  };
  const handleMM=(e)=>{
    if(dragging===null)return;
    const pt=toSVG(e.clientX,e.clientY);
    if(pt)setFreePts(p=>p.map((v,i)=>i===dragging?pt:v));
  };
  const handleMU=()=>setDragging(null);
  const startDrag=(e,i)=>{e.stopPropagation();setDragging(i);};
  const startDragT=(e,i)=>{e.stopPropagation();setDragging(i);};

  const cursor=dragging!==null?"grabbing":(freeMode&&freePts.length<3?"crosshair":"default");

  const rFill=(rm,isPt)=>{
    if(isPt)return"rgba(239,83,80,0.25)";
    return rm.type==="special"?"rgba(231, 205, 243, 0.9)":theme.class_f;
  };
  const rStroke=(rm,isPt)=>{
    if(isPt)return"#ef5350";
    return rm.type==="special"?theme.special_s:theme.class_s;
  };

  // ── 역 Z 건물 폴리곤 ─────────────────────────────────────────
  // 상단동: 좌상~우상, 우측 연결동: 위에서 아래, 하단동: 우에서 좌
  const bldPoly = [
    [15,  12], [968, 12], [968,108],   // 상단 상면
    [968,463], [968,568], [15,568],   // 우측+하단 우하면
    [15,463], [840,463], [840,108],   // 하단 좌면 → 연결부 하단 → 연결부 좌면
    [15, 108], [15,  12],              // 상단 좌면
  ].map(([x,y])=>`${x},${y}`).join(" ");

  // 비건물 영역 (역 Z 바깥) - 두 개의 빈 사각형
  // 좌하 빈 공간: x=15-840, y=108-463
  // 우상 빈 공간: 없음 (상단동이 전체 폭 사용)
  // → 좌하 공간만 site 색으로 채우면 됨

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",
      background:"#0a0a14",overflow:"hidden",userSelect:"none"}}>

      {/* 헤더 */}
      <div style={{background:"rgba(0,0,0,0.75)",padding:"10px 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>navigate("/map")} style={{background:"none",border:"none",
          color:"#90caf9",fontWeight:"700",fontSize:"18px",cursor:"pointer"}}>← 지도로</button>
        <div style={{color:"white",fontWeight:"900",fontSize:"18px"}}>
          🏥 외심 시뮬레이션
          <span style={{fontSize:"15px",fontWeight:"400",
            color:"rgba(255,255,255,0.5)",marginLeft:"10px"}}>
            {freeMode?"✏️ 자유 그리기 모드"
              :act===1?"Act 1 · 2층 (예각삼각형 — 내부 외심)"
              :act===2?"Act 2 · 3층 (둔각삼각형 — 외부 외심)"
              :"Act 3 · 4층 (4점 문제)"}
          </span>
        </div>
        <button onClick={reset} style={{background:"rgba(255,255,255,0.1)",border:"none",
          color:"white",padding:"5px 14px",borderRadius:"8px",
          fontSize:"16px",cursor:"pointer",fontWeight:"600"}}>초기화</button>
      </div>

      {/* SVG */}
      <div ref={containerRef} style={{flex:1,position:"relative",overflow:"hidden"}}>
        <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`}
          style={{width:"100%",height:"100%",cursor}}
          onClick={handleClick} onMouseMove={handleMM}
          onMouseUp={handleMU} onMouseLeave={handleMU}
          onTouchEnd={()=>setDragging(null)}>

          {/* ── 배경 (대지) ── */}
          <rect width={VW} height={VH} fill={theme.bg}/>

          {/* ── 역 Z 건물 외벽 폴리곤 ── */}
          <polygon points={bldPoly} fill={theme.wall}
            stroke="rgba(100,110,180,0.5)" strokeWidth={2.5}/>

          {/* ── 좌하단 빈 공간 (역 Z 안쪽, 비건물) ── */}
          <rect x={15} y={108} width={825} height={355}
            fill={theme.bg} opacity={0.9}/>

          {/* ── 복도 영역 ── */}
          {/* 상단 수평 복도 */}
          <rect x={15} y={TOP_COR_Y1} width={820} height={COR_H}
            fill={theme.corridor} rx={2}/>
          {/* 우측 수직 복도 */}
          <rect x={RC_COR_X1} y={TOP_COR_Y1} width={COR_W} height={BOT_COR_Y1-TOP_COR_Y1}
            fill={theme.corridor} rx={2}/>
          {/* 하단 수평 복도 */}
          <rect x={15} y={BOT_COR_Y1} width={820} height={COR_H}
            fill={theme.corridor} rx={2}/>

          {/* ── 계단 ── */}
          {/* 상단동 좌상 계단 */}
          <g>
            <rect x={16} y={15} width={55} height={92} rx={3}
              fill="rgba(0,0,0,0.5)" stroke={`${theme.class_s}80`} strokeWidth={1}/>
            {[0,1,2,3,4].map(i=>(
              <line key={i} x1={16} y1={15+i*18} x2={71} y2={15+i*18}
                stroke={`${theme.text}40`} strokeWidth={0.8}/>
            ))}
            <text x={43} y={64} textAnchor="middle" fill={`${theme.text}70`}
              fontSize={9} style={{userSelect:"none"}}>계단</text>
          </g>
          {/* 상단동↔우측연결동 접합부 계단 */}
          <g>
            <rect x={840} y={110} width={55} height={38} rx={3}
              fill="rgba(0,0,0,0.5)" stroke={`${theme.class_s}80`} strokeWidth={1}/>
            {[0,1,2].map(i=>(
              <line key={i} x1={840} y1={110+i*12} x2={895} y2={110+i*12}
                stroke={`${theme.text}40`} strokeWidth={0.8}/>
            ))}
            <text x={867} y={133} textAnchor="middle" fill={`${theme.text}70`}
              fontSize={8} style={{userSelect:"none"}}>계단</text>
          </g>
          {/* 우측연결동↔하단동 접합부 계단 */}
          <g>
            <rect x={840} y={464} width={55} height={38} rx={3}
              fill="rgba(0,0,0,0.5)" stroke={`${theme.class_s}80`} strokeWidth={1}/>
            {[0,1,2].map(i=>(
              <line key={i} x1={840} y1={464+i*12} x2={895} y2={464+i*12}
                stroke={`${theme.text}40`} strokeWidth={0.8}/>
            ))}
            <text x={867} y={487} textAnchor="middle" fill={`${theme.text}70`}
              fontSize={8} style={{userSelect:"none"}}>계단</text>
          </g>

          {/* 층 표시 */}
          <text x={470} y={282} textAnchor="middle"
            fill={`${theme.text}55`} fontSize={20} fontWeight="600"
            style={{userSelect:"none"}}>{floor}층 중앙 복도 </text>

          {/* ── 방 렌더링 ── */}
          {rooms.map((rm,i)=>{
            const isPt=!freeMode&&showPts&&patLabels.has(rm.label);
            const rx=rm.cx-rm.w/2, ry=rm.cy-rm.h/2;
            const isTop=rm.cy===TOP_CY, isBot=rm.cy===BOT_CY, isRC=rm.cx===RC_CX;
            return (
              <g key={i}>
                <rect x={rx} y={ry} width={rm.w} height={rm.h}
                  fill={rFill(rm,isPt)} stroke={rStroke(rm,isPt)}
                  strokeWidth={isPt?2.5:1.5} rx={4}/>
                {/* 창문 라인 */}
                {rm.type==="class"&&!isPt&&(
                  isTop ? <rect x={rx+8} y={ry+2} width={rm.w-16} height={7}
                    fill={`${theme.class_s}60`} rx={2}/> :
                  isBot ? <rect x={rx+8} y={ry+rm.h-9} width={rm.w-16} height={7}
                    fill={`${theme.class_s}60`} rx={2}/> :
                  isRC  ? <rect x={rx+2} y={ry+8} width={7} height={rm.h-16}
                    fill={`${theme.class_s}60`} rx={2}/> : null
                )}
                <text x={rm.cx} y={rm.cy+(isPt?-10:3)} textAnchor="middle"
                  fill={isPt?"#ff8a80":theme.text}
                  fontSize={isPt?13:11} fontWeight={isPt?"900":"700"}
                  style={{userSelect:"none"}}>{rm.label}</text>
                {isPt&&(
                  <text x={rm.cx} y={rm.cy+14} textAnchor="middle"
                    fontSize={16} style={{userSelect:"none"}}>🚨</text>
                )}
              </g>
            );
          })}

          {/* 자유모드 방 (단순화) */}
          {freeMode&&rooms.map((rm,i)=>(
            <g key={i}>
              <rect x={rm.cx-rm.w/2} y={rm.cy-rm.h/2} width={rm.w} height={rm.h}
                fill={theme.class_f} stroke={theme.class_s} strokeWidth={1} rx={4}/>
              <text x={rm.cx} y={rm.cy+4} textAnchor="middle"
                fill={`${theme.text}70`} fontSize={9}
                style={{userSelect:"none"}}>{rm.label}</text>
            </g>
          ))}

          {/* ── 기하 요소 (튜토리얼) ── */}
          {!freeMode&&(
            <>
              {show.has("tri1")&&<polygon points={A1.map(p=>`${p.x},${p.y}`).join(" ")}
                fill="rgba(255,213,79,0.07)" stroke="#D81B60"
                strokeWidth={2.5} strokeDasharray="10 5"/>}
              {show.has("tri2")&&<polygon points={A2.map(p=>`${p.x},${p.y}`).join(" ")}
                fill="rgba(255,152,0,0.07)" stroke="#8E24AA"
                strokeWidth={2.5} strokeDasharray="10 5"/>}
              {show.has("tri3a")&&<polygon points={[A3[0],A3[1],A3[2]].map(p=>`${p.x},${p.y}`).join(" ")}
                fill="rgba(100,181,246,0.07)" stroke="#1E88E5"
                strokeWidth={2.5} strokeDasharray="10 5"/>}
              {show.has("tri3b")&&<polygon points={[A3[0],A3[1],A3[3]].map(p=>`${p.x},${p.y}`).join(" ")}
                fill="rgba(129,199,132,0.07)" stroke="rgba(4, 90, 9, 0.75)"
                strokeWidth={2} strokeDasharray="8 5"/>}
              {pb1.map((pb,i)=><line key={i} x1={pb.x1} y1={pb.y1} x2={pb.x2} y2={pb.y2}
                stroke={PB_COLORS[0][i]} strokeWidth={1.5} strokeDasharray="7 4" opacity={0.8}/>)}
              {pb2.map((pb,i)=><line key={i} x1={pb.x1} y1={pb.y1} x2={pb.x2} y2={pb.y2}
                stroke={PB_COLORS[1][i]} strokeWidth={1.5} strokeDasharray="7 4" opacity={0.8}/>)}

              {/* Act1 AED */}
              {show.has("circ1")&&CC1&&<g>
                <circle cx={CC1.x} cy={CC1.y} r={CC1.r}
                  fill="rgba(76,175,80,0.06)" stroke="rgba(76,175,80,0.5)"
                  strokeWidth={2} strokeDasharray="8 5"/>
                <circle cx={CC1.x} cy={CC1.y} r={20} fill="none"
                  stroke="rgba(76,175,80,0.35)" strokeWidth={1.5}>
                  <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx={CC1.x} cy={CC1.y} r={14} fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                <text x={CC1.x} y={CC1.y+4} textAnchor="middle"
                  fill="white" fontSize={10} fontWeight="bold" style={{userSelect:"none"}}>AED</text>
                <rect x={CC1.x+17} y={CC1.y-22} width={70} height={20} rx={4} fill="rgba(0,0,0,0.8)"/>
                <text x={CC1.x+52} y={CC1.y-9} textAnchor="middle"
                  fill="#81C784" fontSize={11} fontWeight="bold" style={{userSelect:"none"}}>외심 (내부)</text>
              </g>}

              {/* Act2 AED */}
              {show.has("circ2")&&CC2&&<g>
                <circle cx={CC2.x} cy={CC2.y} r={CC2.r}
                  fill="rgba(76,175,80,0.06)" stroke="rgba(76,175,80,0.5)"
                  strokeWidth={2} strokeDasharray="8 5"/>
                <circle cx={CC2.x} cy={CC2.y} r={20} fill="none"
                  stroke="rgba(76,175,80,0.35)" strokeWidth={1.5}>
                  <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx={CC2.x} cy={CC2.y} r={14} fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                <text x={CC2.x} y={CC2.y+4} textAnchor="middle"
                  fill="white" fontSize={10} fontWeight="bold" style={{userSelect:"none"}}>AED</text>
                <rect x={CC2.x+17} y={CC2.y-22} width={70} height={20} rx={4} fill="rgba(0,0,0,0.8)"/>
                <text x={CC2.x+52} y={CC2.y-9} textAnchor="middle"
                  fill="#81C784" fontSize={11} fontWeight="bold" style={{userSelect:"none"}}>외심 (외부)</text>
              </g>}

              {/* Act3 O₁ */}
              {show.has("circ3a")&&CC3a&&<g>
                <circle cx={CC3a.x} cy={CC3a.y} r={CC3a.r}
                  fill="none" stroke="#D81B60"
                  strokeWidth={1.5} strokeDasharray="8 5"/>
                <circle cx={CC3a.x} cy={CC3a.y} r={11}
                  fill="#1565C0" stroke="#90CAF9" strokeWidth={2}/>
                <rect x={CC3a.x+14} y={CC3a.y-12} width={34} height={22}
                  rx={4} fill="rgba(0,0,0,0.8)"/>
                <text x={CC3a.x+31} y={CC3a.y+4} textAnchor="middle"
                  fill="#90CAF9" fontSize={13} fontWeight="bold" style={{userSelect:"none"}}>O₁</text>
              </g>}

              {/* Act3 O₂ */}
              {show.has("circ3b")&&CC3b&&<g>
                <circle cx={CC3b.x} cy={CC3b.y} r={CC3b.r}
                  fill="none" stroke="#9406a7"
                  strokeWidth={1.5} strokeDasharray="8 5"/>
                <circle cx={CC3b.x} cy={CC3b.y} r={11}
                  fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
                <rect x={CC3b.x+14} y={CC3b.y-12} width={34} height={22}
                  rx={4} fill="rgba(0,0,0,0.8)"/>
                <text x={CC3b.x+31} y={CC3b.y+4} textAnchor="middle"
                  fill="#81C784" fontSize={13} fontWeight="bold" style={{userSelect:"none"}}>O₂</text>
              </g>}

              {/* Act3 연결 + 중점 */}
              {(show.has("connect3")||show.has("complete3"))&&CC3a&&CC3b&&M3&&<g>
                <line x1={CC3a.x} y1={CC3a.y} x2={CC3b.x} y2={CC3b.y}
                  stroke="rgba(255,213,79,0.8)" strokeWidth={2.5} strokeDasharray="8 4"/>
                {show.has("connect3")&&!show.has("complete3")&&<g>
                  <circle cx={M3.x} cy={M3.y} r={9}
                    fill="rgba(255,213,79,0.9)" stroke="white" strokeWidth={2}/>
                  <rect x={M3.x+12} y={M3.y-12} width={72} height={22}
                    rx={4} fill="rgba(0,0,0,0.8)"/>
                  <text x={M3.x+48} y={M3.y+3} textAnchor="middle"
                    fill="#FFD54F" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none"}}>중점 = ?</text>
                </g>}
                {show.has("complete3")&&<g>
                  <circle cx={M3.x} cy={M3.y} r={22} fill="none"
                    stroke="rgba(76,175,80,0.4)" strokeWidth={1.5}>
                    <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={M3.x} cy={M3.y} r={16}
                    fill="#2E7D32" stroke="#81C784" strokeWidth={2.5}/>
                  <text x={M3.x} y={M3.y+4} textAnchor="middle"
                    fill="white" fontSize={10} fontWeight="bold"
                    style={{userSelect:"none"}}>AED</text>
                  <rect x={M3.x+20} y={M3.y-24} width={108} height={22}
                    rx={5} fill="rgba(0,0,0,0.85)"/>
                  <text x={M3.x+74} y={M3.y-10} textAnchor="middle"
                    fill="#81C784" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none"}}>O₁O₂ 선분의 중점</text>
                </g>}
              </g>}

              {/* 환자 점 */}
              {showPts&&patients.map((p,i)=>(
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={16} fill={`${PCOLORS[i]}30`}>
                    <animate attributeName="r" values="12;20;12" dur="1.6s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={p.x} cy={p.y} r={12}
                    fill={PCOLORS[i]} stroke="white" strokeWidth={2.5}/>
                  <text x={p.x} y={p.y+5} textAnchor="middle"
                    fill="white" fontSize={12} fontWeight="bold"
                    style={{userSelect:"none"}}>{i+1}</text>
                </g>
              ))}

              {/* 완료 배너 */}
              {completed&&<g>
                <rect x={VW/2-230} y={VH-58} width={460} height={44}
                  rx={12} fill="rgba(46,125,50,0.92)"/>
                <text x={VW/2} y={VH-32} textAnchor="middle"
                  fill="white" fontSize={14} fontWeight="bold">
                  🎉 모든 층에서 외심으로 AED 최적 위치를 찾았어!
                </text>
                <text x={VW/2} y={VH-14} textAnchor="middle"
                  fill="rgba(255,255,255,0.7)" fontSize={12}>
                  아래 [삼각형 그리기] 버튼으로 직접 그려봐!
                </text>
              </g>}
            </>
          )}

          {/* ── 자유 그리기 ── */}
          {freeMode&&<>
            {freePts.length===3&&<polygon
              points={freePts.map(p=>`${p.x},${p.y}`).join(" ")}
              fill="rgba(255,213,79,0.08)" stroke="rgba(255,213,79,0.85)"
              strokeWidth={2.5}/>}
            {freePB.map((pb,i)=><line key={i}
              x1={pb.x1} y1={pb.y1} x2={pb.x2} y2={pb.y2}
              stroke={["#ef9a9a","#ce93d8","#90caf9"][i]}
              strokeWidth={1.5} strokeDasharray="6 4" opacity={0.85}/>)}
            {freeCC&&<g>
              <circle cx={freeCC.x} cy={freeCC.y} r={freeCC.r}
                fill="rgba(76,175,80,0.08)" stroke="rgba(76,175,80,0.8)"
                strokeWidth={2.5} strokeDasharray="8 4"/>
              <circle cx={freeCC.x} cy={freeCC.y} r={22} fill="none"
                stroke="rgba(76,175,80,0.4)" strokeWidth={1.5}>
                <animate attributeName="r" values="13;23;13" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx={freeCC.x} cy={freeCC.y} r={14}
                fill="#2E7D32" stroke="#81C784" strokeWidth={2}/>
              <text x={freeCC.x} y={freeCC.y+4} textAnchor="middle"
                fill="white" fontSize={10} fontWeight="bold"
                style={{userSelect:"none"}}>외심</text>
            </g>}
            {freePts.map((p,i)=>(
              <g key={i} style={{cursor:dragging===i?"grabbing":"grab"}}
                onMouseDown={e=>startDrag(e,i)} onTouchStart={e=>startDragT(e,i)}>
                <circle cx={p.x} cy={p.y} r={24} fill="transparent"/>
                <circle cx={p.x} cy={p.y} r={18} fill={`${FREE_COLORS[i]}30`}/>
                <circle cx={p.x} cy={p.y} r={13}
                  fill={FREE_COLORS[i]} stroke="white" strokeWidth={2.5}/>
                <text x={p.x} y={p.y+5} textAnchor="middle"
                  fill="white" fontSize={12} fontWeight="bold"
                  style={{userSelect:"none",pointerEvents:"none"}}>{i+1}</text>
              </g>
            ))}
            {freePts.length<3&&<g>
              <rect x={VW/2-180} y={VH-54} width={360} height={36}
                rx={10} fill="rgba(21,101,192,0.85)"/>
              <text x={VW/2} y={VH-32} textAnchor="middle"
                fill="white" fontSize={13} fontWeight="bold">
                🖱 원하는 위치를 클릭해서 점을 찍어봐! ({freePts.length}/3)
              </text>
            </g>}
          </>}
        </svg>

        {/* 코코 말풍선 */}
        {!isQ&&!completed&&!freeMode&&(
          <div style={{position:"absolute",bottom:"35%",left:"4%",
            display:"flex",flexDirection:"column",alignItems:"flex-start",
            zIndex:20,width:"min(420px,38%)"}}>
            <div style={{background:"white",borderRadius:"16px",
              padding:"16px 20px",width:"100%",
              boxShadow:"0 4px 24px rgba(0,0,0,0.35)",
              border:"2px solid #5b9fe8",
              fontSize:"17px",lineHeight:"1.85",whiteSpace:"pre-line"}}>
              {cur.text}
              <div style={{marginTop:"12px"}}>
                <button onClick={handleNext} style={{
                  padding:"8px 24px",
                  background:"linear-gradient(135deg,#5b9fe8,#764ba2)",
                  color:"white",border:"none",borderRadius:"20px",
                  fontSize:"17px",fontWeight:"700",cursor:"pointer"}}>
                  {step>=STEPS.length-1?"완료 ✓":"다음 ▶"}
                </button>
              </div>
            </div>
            <img src={cocoImg} alt="COCO" style={{
              width:"160px",height:"160px",objectFit:"contain",
              filter:"drop-shadow(0 4px 14px rgba(102,126,234,0.55))"}}/>
          </div>
        )}

        {/* 질문 팝업 */}
        {isQ&&qData&&<>
          <div style={{position:"absolute",inset:0,
            background:"rgba(0,0,0,0.55)",zIndex:40}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",
            transform:"translate(-50%,-50%)",
            background:"white",borderRadius:"22px",
            padding:"28px 30px",maxWidth:"420px",width:"90%",
            zIndex:50,boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
            animation:"popIn 0.3s ease-out"}}>
            <div style={{display:"flex",alignItems:"flex-start",
              gap:"14px",marginBottom:"20px"}}>
              <img src={cocoImg} alt="COCO" style={{width:"54px",height:"54px",
                objectFit:"contain",flexShrink:0}}/>
              <div>
                <div style={{fontSize:"16px",color:"#888",
                  marginBottom:"4px",fontWeight:"600"}}>🌀 코코의 질문</div>
                <div style={{fontSize:"18px",fontWeight:"900",
                  lineHeight:"1.55",whiteSpace:"pre-line"}}>{qData.prompt}</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
              {qData.options.map((opt,i)=>(
                <button key={i} onClick={()=>handleAnswer(i)} style={{
                  padding:"13px 18px",borderRadius:"12px",
                  border:"2px solid #e2e8f0",background:"white",
                  fontSize:"17px",fontWeight:"600",
                  cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#f0f4ff";
                    e.currentTarget.style.borderColor="#5b9fe8";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="white";
                    e.currentTarget.style.borderColor="#e2e8f0";}}>
                  {opt}
                </button>
              ))}
            </div>
            {wrong&&<div style={{marginTop:"14px",background:"#fff3e0",
              borderRadius:"10px",padding:"11px 14px",
              fontSize:"17px",color:"#E65100",
              fontWeight:"600",lineHeight:"1.6"}}>
              🤔 {qData.wrongHint}
            </div>}
          </div>
        </>}
      </div>

      {/* 하단 바 */}
      <div style={{background:"rgba(0,0,0,0.75)",padding:"8px 16px",
        display:"flex",gap:"8px",alignItems:"center",
        flexShrink:0,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        {[{a:1,label:"Act 1 · 2층 (예각)"},{a:2,label:"Act 2 · 3층 (둔각)"},{a:3,label:"Act 3 · 4층 (4점)"}]
          .map(({a,label})=>(
          <div key={a} style={{padding:"4px 12px",borderRadius:"8px",fontSize:"16px",
            background:act===a&&!freeMode?"rgba(76,175,80,0.35)":"rgba(255,255,255,0.05)",
            color:act===a&&!freeMode?"#81C784":"rgba(255,255,255,0.35)",
            fontWeight:act===a&&!freeMode?"700":"400"}}>{label}</div>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:"3px",alignItems:"center"}}>
          {STEPS.map((_,i)=>(
            <div key={i} style={{
              width:i===step?16:7,height:7,borderRadius:"4px",
              background:i<step?"rgba(76,175,80,0.6)":i===step?"#81C784":"rgba(255,255,255,0.12)",
              transition:"all 0.3s"}}/>
          ))}
        </div>
        {completed&&<div style={{display:"flex",gap:"6px",marginLeft:"8px"}}>
          {!freeMode?(
            <button onClick={()=>{setFreeMode(true);setFreePts([]);setDragging(null);}}
              style={{padding:"5px 16px",borderRadius:"8px",
                background:"linear-gradient(135deg,#42a5f5,#1565C0)",
                color:"white",border:"none",fontSize:"16px",
                fontWeight:"700",cursor:"pointer",
                boxShadow:"0 2px 8px rgba(21,101,192,0.4)"}}>
              ✏️ 삼각형 그리기
            </button>
          ):<>
            <button onClick={()=>{setFreePts([]);setDragging(null);}}
              style={{padding:"5px 12px",borderRadius:"8px",
                background:"rgba(255,255,255,0.15)",color:"white",
                border:"1px solid rgba(255,255,255,0.2)",
                fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>🔄 점 초기화</button>
            <button onClick={()=>{setFreeMode(false);setFreePts([]);setDragging(null);}}
              style={{padding:"5px 12px",borderRadius:"8px",
                background:"rgba(229,57,53,0.5)",color:"white",border:"none",
                fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>✕ 종료</button>
          </>}
        </div>}
      </div>

      <style>{`
        @keyframes popIn {
          from{transform:translate(-50%,-50%) scale(0.85);opacity:0}
          to{transform:translate(-50%,-50%) scale(1);opacity:1}
        }
      `}</style>
      <CocoChat systemPrompt={PROMPTS.aed}
        initialMessage="안녕! 나는 코코야 🌀&#10;외심의 개념이 어려우면 물어봐!"/>
    </div>
  );
}
