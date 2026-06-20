import auditoriumImg from "../styles/images/icon-auditorium.png";
import aedImg from "../styles/images/icon-aed.png";
import cafeteriaImg from "../styles/images/icon-cafeteria.png";
import rainImg from "../styles/images/icon-rain.png";
import fireImg from "../styles/images/fire_safety_map.png";
import secureImg from "../styles/images/evacuation_route.png";

export const CHAPTERS = {
  auditorium: {
    id: "auditorium",
    name: "강당",
    subject: "연립방정식",
    locked: false,
    position: { x: 50, y: 45 },

    cocoIntro: [
      "안녕! 나는 코코야! ",
      "학교 축제가 다가오고 있어! ",
      "점심시간 동안 공연을 기획해야 하는데... ",
      "댄스팀이랑 노래팀을 몇 팀씩 섭외해야 할지 모르겠어. ",
      "강당 안을 둘러보면서 필요한 정보를 모아볼까? ",
    ],
    cocoAllFound: [
      "오! 정보를 다 모았구나! 👏 ",
      "수집한 정보를 보면서 식을 세워볼 수 있겠어? ",
      "워크북에 연립방정식을 써보고, 답을 입력해줘! ",
    ],
    cocoCorrect: [
      "정답이야! 🎉 ",
      "노래팀 4팀, 댄스팀 5팀으로 ",
      "딱 60분 공연이 완성됐어! ",
      "수고했어! 다음 미션 쪽지가 도착했어 👀",
    ],
    cocoWrong: [
      "음... 조금 더 생각해볼까? 🤔",
      "수집한 정보를 다시 확인해봐! ",
      "어떤 정보가 필요한지 잘 생각해봐. ",
    ],

    objects: [
      {
        id: "poster",
        emoji: "📋",
        name: "공연 포스터",
        position: { x: 20, y: 35 },
        isClue: true,
        dialog: [
          "공연 포스터를 발견했어! ",
          "『제12회 학교 축제 공연』",
          "총 공연 시간은 60분이야. ",
        ],
      },
      {
        id: "roster",
        emoji: "📝",
        name: "출연진 명단",
        position: { x: 72, y: 38 },
        isClue: true,
        dialog: [
          "출연진 명단이 붙어 있어!",
          "지원한 팀들을 확인해보니...",
          "댄스팀과 노래팀을 합치면 총 9팀이야.",
        ],
      },
      {
        id: "program",
        emoji: "📖",
        name: "프로그램 책자",
        position: { x: 45, y: 62 },
        isClue: true,
        dialog: [
          "지난 축제 프로그램 책자야!",
          "팀별 공연 시간이 나와 있네.",
          "노래팀은 1팀당 5분, 댄스팀은 1팀당 8분이야.",
        ],
      },
      {
        id: "mic",
        emoji: "🎤",
        name: "마이크",
        position: { x: 28, y: 58 },
        isClue: false,
        dialog: [
          "음향 장비 점검 목록이야.",
          "유선 마이크 4개, 무선 마이크 2개가 필요하대.",
          "총 6개의 마이크를 준비해야 해.",
        ],
      },
      {
        id: "light",
        emoji: "💡",
        name: "조명 장치",
        position: { x: 63, y: 26 },
        isClue: false,
        dialog: [
          "조명 큐시트야!",
          "공연 중 3번 조명이 바뀌고, 색상은 7가지래.",
          "조명 교체에 걸리는 시간은 총 5분이야.",
        ],
      },
      {
        id: "chair",
        emoji: "🪑",
        name: "좌석 배치도",
        position: { x: 54, y: 44 },
        isClue: false,
        dialog: [
          "좌석 배치도야!",
          "VIP석 20개 포함해서 총 200석이야.",
          "학생들이 앉을 수 있는 일반석은 180개야.",
        ],
      },
    ],

    answer: { 노래: 4, 댄스: 5 },
    answerHint: "노래팀과 댄스팀의 수를 입력해줘!",
    nextMissionCode: "COCO-002",
    nextMissionHint: "다음 미션은 운동장에서 기다리고 있어...",
  },

    aed: {
    id: "aed",
    name: "우리 학교 AED 위치는 어디가 적절할까?",
    subject: "외심",
    locked: false,

    cocoIntro: [
      "안녕! 나는 코코야 🌀 ",
      "여기는 우리 학교 4층이야. ",
      "이 층에는 요양호 학생들이 여러 반에 걸쳐 있어. ",
      "만약 동시에 응급상황이 발생한다면?  ",
      "AED(자동심장충격기)가 어디에 있어야 세 교실 모두에 빠르게 닿을 수 있을까?  ",
      "먼저 층을 살펴보면서 필요한 정보를 모아봐!  ",
    ],
    cocoAllFound: [
      "정보를 다 모았구나! 👏",
      "요양호 학생이 있는 세 교실의 위치를 파악했어.  ",
      "이 세 곳의 위치는 삼각형을 이루고 있어.  ",
      "삼각형의 세 점으로부터 거리가 같은 점은 어디일까?  ",
      "워크북에서 외심을 구해보고 아래에 답을 입력해봐!  ",
    ],
    cocoCorrect: [
      "정답이야! 🎉 ",
      "외심은 삼각형의 세 점으로부터 거리가 같은 점이야.  ",
      "세 교실 사이 어디서든 똑같이 가까운 위치가 바로 AED를 놓을 최적의 장소!  ",
      "수학이 실제 생명을 구하는 데 쓰일 수 있어. 멋지지? 😊  ",
      "다음 미션 쪽지가 도착했어 👀  ",
    ],
    cocoWrong: [
      "음... 다시 생각해볼까? 🤔  ",
      "세 꼭짓점(교실)에서 같은 거리에 있는 점과  ",
      "세 변(복도)에서 같은 거리에 있는 점은 달라!  ",
      "AED는 복도를 따라 달려가야 하니까 어느 쪽이 맞을까?  ",
    ],

    objects: [
      {
        id: "class1", emoji: "🚨", name: "과학실",
        position: { x: 84, y: 5 }, isClue: true,
        dialog: [
          "과학실이야.",
          "과학 선생님 말씀으로는...",
          "지금 과학실에서 수업하고 있는 반에 요양호 학생이 1명 있어. 심장 질환을 가지고 있대.",
        ],
      },
      {
        id: "class3", emoji: "🚨", name: "미술실",
        position: { x: 84, y: 44 }, isClue: true,
        dialog: [
          "미술실이야.",
          "건강 기록을 확인해보니...",
          "이 반에서 지금 2-3 아이들이 수업을 듣고 있는데\n 요양호 학생이 1명 있어. \n갑작스러운 쇼크 위험이 있대.",
        ],
      },
      {
        id: "class5", emoji: "🚨", name: "2-2반",
        position: { x: 18, y: 25 }, isClue: true,
        dialog: [
          "2-5반 교실이야.",
          "보건 선생님 기록에 따르면...",
          "이 반에 요양호 학생이 2명 있어. \n부정맥 증상이 있다고 해.",
        ],
      },
      {
        id: "health", emoji: "📋", name: "1층 보건 일지",
        position: { x: 35, y: 25 }, isClue: true,
        dialog: [
          "보건실 일지야!",
          "요양호 학생 현황을 보니...",
          "2-1반, 2-3반, 2-5반에 총 5명의 요양호 학생이 있어.",
          "동시 응급상황을 대비해 AED 위치 선정이 필요해.",
        ],
      },
      {
        id: "fire", emoji: "🔴", name: "소방 안전 지도",
        position: { x: 23, y: 65 }, isClue: false,
        dialog: [
          "소방 안전 지도야!",
          "소화기는 복도 양 끝 2개소에 배치되어 있어.",
          "소화기 위치는 이미 정해져 있으니 AED 위치와는 별개야.",
        ],
        type: "image",
        image: fireImg
      },
      {
        id: "facility", emoji: "🗺", name: "비상 대피로",
        position: { x: 68, y: 55 }, isClue: false,
        dialog: [
          "학교 시설 안내도야!",
          "엘리베이터는 1층 로비에만 있고...",
          "4층에는 계단 2개소만 있어. ",
        ],
        type: "image",
        image: secureImg
      },
    ],

    answer: { type: "외심" },
    answerType: "text",
    answerHint: "세 교실이 이루는 삼각형에서 AED를 놓을 최적의 위치에 쓰이는 삼각형의 심(心)은?",
  },
    cafeteria: {
    id: "cafeteria",
    name: "급식 배식 문제를 해결하자!",
    subject: "일차함수",
    locked: false,

    cocoAllFound: [
      "정보를 다 모았어! 👏",
      "전체 학생 수와 배식 속도 데이터가 있으면 배식 완료 시간을 예측할 수 있어.",
      "일차함수 그래프로 나타내보자!",
    ],
    cocoCorrect: [
      "정답이야! 🎉",
      "그래프에서 x절편이 바로 배식 완료까지 걸리는 시간이야.",
      "일차함수 y = -20x + 500으로 25분이 걸린다는 걸 알 수 있어!",
      "이제 실제 우리 학교 데이터를 직접 측정해보자 📊",
    ],
    cocoWrong: [
      "조금 더 생각해볼까? 🤔",
      "그래프에서 y = 0이 되는 x값이 배식 완료 시간이야.",
      "수집한 정보를 다시 확인해봐!",
    ],

    objects: [
      {
        id: "student_board", emoji: "📊", name: "학생 현황판",
        position: { x: 18, y: 22 }, isClue: true,
        dialog: ["학생 현황판이야!", "전체 학생 현황을 확인해보니...", "우리 학교 전체 학생 수는 500명이야."],
      },
      {
        id: "speed_table", emoji: "⏱", name: "배식 속도 측정표",
        position: { x: 37, y: 25 }, isClue: true,
        dialog: ["배식 속도 측정 기록이야!", "지난달 평균을 내보니...", "1분에 평균 20명씩 배식이 돼."],
      },
      {
        id: "schedule", emoji: "🕛", name: "급식 시간표",
        position: { x: 90, y: 35 }, isClue: true,
        dialog: ["급식 시간표야!", "배식은 12시에 시작해.", "급식 시간은 총 60분(12:00~13:00)이야."],
      },
      {
        id: "record_book", emoji: "📖", name: "배식 기록부",
        position: { x: 30, y: 83 }, isClue: true,
        dialog: ["지난주 배식 기록부야!", "한식 25분, 양식 32분, 특식 38분...", "메뉴에 따라 배식 완료 시간이 달라지네."],
      },
      {
        id: "menu_board", emoji: "🍱", name: "오늘의 메뉴판",
        position: { x: 52, y: 62 }, isClue: false,
        dialog: ["오늘의 메뉴판이야!", "불고기 덮밥과 된장국이래. 인기 메뉴야!", "메뉴 이름 자체는 배식 시간 계산과는 직접 관계없을 것 같아."],
      },
      {
        id: "nutrition_note", emoji: "📝", name: "영양사 노트",
        position: { x: 80, y: 75 }, isClue: false,
        dialog: ["영양사 선생님 노트야!", "단백질 30g, 탄수화물 80g, 나트륨 800mg...", "영양 분석 자료네. 배식 시간 계산엔 필요하지 않겠어!"],
      },
    ],

    answer: { completionTime: 25 },
    nextMissionCode: "COCO-004",
    nextMissionHint: "이제 직접 우리 학교 배식 시간을 측정해보자!",
  },
};




export const CHAPTER_LIST = [
  { 
    id: "auditorium",   
    name: "1. 학교 축제 공연 일정표를 설계하기!",          
    emoji: "🎊",  
    image: auditoriumImg, // ✨ 이미지 경로 직접 추가
    locked: false, 
    x: 15, y: 35 
  },
  { 
    id: "aed",          
    name: "3. 생명을 살리는 AED, 어디에 설치할까?",  
    emoji: "🏥",  
    image: aedImg,        // ✨ 이미지 경로 직접 추가
    locked: false, 
    x: 50, y: 32 
  },
  { 
    id: "cafeteria",    
    name: "2. 급식 배식 속도를 일차함수로 분석하기!",  
    emoji: "🍱",  
    image: cafeteriaImg,  // ✨ 이미지 경로 직접 추가
    locked: false, 
    x: 85, y: 25 
  },
  { 
    id: "rain", 
    name: "4. 체육 활동, 내일 날씨를 예측할 수 있을까?", 
    emoji: "⛈️", 
    image: rainImg,       // ✨ 이미지 경로 직접 추가
    locked: false, 
    x: 50, y: 60 
  }
];