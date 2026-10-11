// ─────────────────────────────────────────────────────────────────
// COCO 연습문제 데이터 (PDF 기반 개정판)
// inputType: "pair" | "number" | "text" | "essay"
//   pair  → 두 개의 입력칸 (pairLabels 참조)
//   number→ 숫자 하나
//   text  → 분수 등 자유 텍스트
//   essay → 자동 채점 없음, 해설보기로 확인
// ─────────────────────────────────────────────────────────────────

function extractNums(str) {
  if (!str) return [];
  const cleaned = String(str).replace(/,/g, "");
  const regex = /(\d+\.\d+|\d+\/\d+|\d+)\s*%?/g;
  const nums = [];
  let m;
  while ((m = regex.exec(cleaned)) !== null) {
    const token = m[1];
    let val;
    if (token.includes("/")) {
      const [a, b] = token.split("/").map(Number);
      val = b !== 0 ? a / b : NaN;
    } else {
      val = parseFloat(token);
    }
    if (m[0].includes("%")) val = val / 100;
    if (!isNaN(val)) nums.push(val);
  }
  return nums;
}

export function isAnswerCorrect(input, problem) {
  if (problem.inputType === "essay") return false;
  if (!input) return false;

  let text = "";
  if (typeof input === "object" && input !== null) {
    // pair 타입: { a, b }
    text = `${input.a || ""} ${input.b || ""}`;
  } else {
    text = String(input);
  }

  if (!text.trim()) return false;

  const nums = extractNums(text);
  const closeTo = (target) => {
    const tol = Number.isInteger(target) ? 0.5 : 0.05;
    return nums.some((n) => Math.abs(n - target) <= tol);
  };
  const allOk = !problem.requiredAll || problem.requiredAll.every(closeTo);
  const anyOk = !problem.requiredAny || problem.requiredAny.some(closeTo);
  return allOk && anyOk;
}

// ── 단원 메뉴 설정 ──
export const PRACTICE_UNITS = [
  { id: "system",       title: "연립방정식",   emoji: "🎭", color: "#1565C0", bg: "#E3F2FD", ready: true },
  { id: "linear",       title: "일차함수",     emoji: "🍱", color: "#2E7D32", bg: "#E8F5E9", ready: true },
  { id: "circumcenter", title: "외심과 내심",  emoji: "🔵", color: "#E65100", bg: "#FFF3E0", ready: true },
  { id: "probability",  title: "확률",         emoji: "⛈️", color: "#5E35B1", bg: "#EDE7F6", ready: true },
];

// ── 1. 연립방정식 실생활 문제 (7문제) ──
export const SYSTEM_PROBLEMS = [
  {
    type: "나이 문제",
    inputType: "pair",
    pairLabels: ["어머니 나이 (세)", "딸 나이 (세)"],
    question:
      "현재 어머니와 딸의 나이의 합은 52세이다.\n10년 후에 어머니의 나이가 딸의 나이의 2배가 된다고 할 때,\n현재 어머니와 딸의 나이를 각각 구하시오.",
    requiredAll: [38, 14],
    answer: "어머니: 38세, 딸: 14세",
    solution:
      "어머니 나이를 x세, 딸 나이를 y세로 놓으면\n" +
      "① x + y = 52\n" +
      "② (x+10) = 2(y+10)  →  x - 2y = 10\n\n" +
      "①-②:  3y = 42  →  y = 14\n" +
      "x = 52 - 14 = 38\n\n" +
      "∴ 어머니: 38세, 딸: 14세",
  },
  {
    type: "가격·개수 문제",
    inputType: "pair",
    pairLabels: ["볼펜 (자루)", "형광펜 (자루)"],
    question:
      "문구점에서 볼펜과 형광펜을 합쳐서 12자루를 샀더니 총 15,600원이었다.\n볼펜 한 자루는 1,200원, 형광펜 한 자루는 1,800원일 때,\n볼펜과 형광펜을 각각 몇 자루 샀는지 구하시오.",
    requiredAll: [10, 2],
    answer: "볼펜: 10자루, 형광펜: 2자루",
    solution:
      "볼펜 개수를 x, 형광펜 개수를 y로 놓으면\n" +
      "① x + y = 12\n" +
      "② 1200x + 1800y = 15600\n\n" +
      "②를 600으로 나누면: 2x + 3y = 26\n" +
      "①×2: 2x + 2y = 24\n" +
      "빼면: y = 2,  x = 10\n\n" +
      "∴ 볼펜: 10자루, 형광펜: 2자루",
  },
  {
    type: "거리·속력 문제",
    inputType: "pair",
    pairLabels: ["걸은 거리 (km)", "자전거 거리 (km)"],
    question:
      "집에서 학교까지의 거리는 3 km이다.\n처음에는 시속 3 km로 걷다가, 도중에 시속 9 km로 자전거를 타서\n총 40분 만에 도착하였다.\n걸은 거리와 자전거를 탄 거리를 각각 구하시오.",
    requiredAll: [1, 2],
    answer: "걸은 거리: 1 km, 자전거 탄 거리: 2 km",
    solution:
      "걸은 거리를 x km, 자전거 거리를 y km로 놓으면\n" +
      "① x + y = 3\n" +
      "② x/3 + y/9 = 40/60 = 2/3  (시간 합)\n\n" +
      "②×9: 3x + y = 6\n" +
      "③-①: 2x = 3  →  x = 1, y = 2\n\n" +
      "∴ 걸은 거리: 1 km, 자전거 탄 거리: 2 km",
  },
  {
    type: "증가·감소 문제",
    inputType: "pair",
    pairLabels: ["남학생 (명)", "여학생 (명)"],
    question:
      "작년 전교생은 600명이었다.\n올해 남학생은 5% 증가하고 여학생은 10% 감소하여\n전체 학생 수가 597명이 되었다.\n작년 남학생과 여학생의 수를 각각 구하시오.",
    requiredAll: [380, 220],
    answer: "남학생: 380명, 여학생: 220명",
    solution:
      "작년 남학생 x명, 여학생 y명으로 놓으면\n" +
      "① x + y = 600\n" +
      "② 1.05x + 0.9y = 597\n\n" +
      "①에서 y = 600 - x를 ②에 대입:\n" +
      "1.05x + 0.9(600 - x) = 597\n" +
      "1.05x + 540 - 0.9x = 597\n" +
      "0.15x = 57  →  x = 380\n" +
      "y = 600 - 380 = 220\n\n" +
      "검증: 1.05×380 + 0.9×220 = 399 + 198 = 597 ✓\n\n" +
      "∴ 남학생: 380명, 여학생: 220명",
  },
  {
    type: "일의 양 문제",
    inputType: "pair",
    pairLabels: ["A 혼자 (일)", "B 혼자 (일)"],
    question:
      "어떤 일을 A 혼자 하면 B 혼자 할 때보다 6일 더 걸린다.\nA, B가 함께 하면 4일이 걸린다고 할 때,\nA와 B가 각각 혼자 하면 며칠이 걸리는지 구하시오.",
    requiredAll: [12, 6],
    answer: "A: 12일, B: 6일",
    solution:
      "A 혼자 x일, B 혼자 y일로 놓으면\n" +
      "① x = y + 6  (A가 B보다 6일 더 걸림)\n" +
      "② 1/x + 1/y = 1/4  (함께 하면 4일)\n\n" +
      "①을 ②에 대입: 1/(y+6) + 1/y = 1/4\n" +
      "양변에 4y(y+6)을 곱하면:\n" +
      "4y + 4(y+6) = y(y+6)\n" +
      "8y + 24 = y² + 6y\n" +
      "y² - 2y - 24 = 0\n" +
      "(y-6)(y+4) = 0  →  y = 6 (양수)\n\n" +
      "따라서 B: 6일, A: y + 6 = 12일\n\n" +
      "∴ A: 12일, B: 6일",
  },
  {
    type: "도형·둘레 문제",
    inputType: "pair",
    pairLabels: ["가로 (cm)", "세로 (cm)"],
    question:
      "직사각형의 둘레가 56 cm이다.\n가로의 길이가 세로의 길이의 2배보다 2 cm 짧을 때,\n이 직사각형의 가로와 세로의 길이를 각각 구하시오.",
    requiredAll: [18, 10],
    answer: "가로: 18 cm, 세로: 10 cm",
    solution:
      "가로 x cm, 세로 y cm로 놓으면\n" +
      "① 2(x + y) = 56  →  x + y = 28\n" +
      "② x = 2y - 2\n\n" +
      "②를 ①에 대입: (2y - 2) + y = 28\n" +
      "3y = 30  →  y = 10, x = 18\n\n" +
      "∴ 가로: 18 cm, 세로: 10 cm",
  },
  {
    type: "생활비 배분 문제",
    inputType: "pair",
    pairLabels: ["저축액 (원)", "생활비 (원)"],
    question:
      "민준이는 한 달 용돈 60,000원을 저축액과 생활비로 나누어 쓴다.\n저축액이 생활비의 3배보다 12,000원 많을 때,\n저축액과 생활비를 각각 구하시오.",
    requiredAll: [48000, 12000],
    answer: "저축액: 48,000원, 생활비: 12,000원",
    solution:
      "저축액 x원, 생활비 y원으로 놓으면\n" +
      "① x + y = 60000\n" +
      "② x = 3y + 12000\n\n" +
      "②를 ①에 대입: (3y + 12000) + y = 60000\n" +
      "4y = 48000  →  y = 12000\n" +
      "x = 48000\n\n" +
      "∴ 저축액: 48,000원, 생활비: 12,000원",
  },
];

// ── 2. 외심과 내심 (4문제) ──
export const CIRCUMCENTER_PROBLEMS = [
  {
    type: "외심 서술형 (문화유산 복원)",
    inputType: "essay",
    image: "/circum1.png",
    question:
      "【서술형】\n\n고대 원형 문화유산의 일부 조각이 발견되었다.\n조각의 호 위에서 세 점 A, B, C를 잡았을 때,\n원래 원의 중심을 찾는 방법을 외심의 성질을 이용하여 서술하시오.",
    solution:
      "【외심을 이용한 원의 중심 찾기】\n\n" +
      "① 세 점 A, B, C 중 두 쌍을 골라 각각 선분을 긋는다.\n" +
      "② 각 선분의 수직이등분선을 그린다.\n" +
      "③ 두 수직이등분선이 만나는 점이 원의 중심 O(외심)이다.\n\n" +
      "【이유】\n" +
      "외심은 세 꼭짓점에서 같은 거리에 있으므로\n" +
      "OA = OB = OC = 외접원의 반지름 R\n" 
  },
  {
    type: "내심 서술형 (스프링클러)",
    inputType: "essay",
    image: "/circum2.png",
    question:
      "【서술형】\n\n삼각형 모양의 정원 △ABC에 스프링클러를 설치하려고 한다.\n세 변까지의 거리가 모두 같도록 스프링클러를 설치하려면\n어느 위치에 설치해야 하는지 내심의 성질을 이용하여 서술하시오.",
    solution:
      "【내심을 이용한 스프링클러 위치】\n\n" +
      "① 세 내각 ∠A, ∠B, ∠C의 이등분선을 각각 긋는다.\n" +
      "② 세 이등분선이 만나는 점이 내심 I이다.\n" +
      "③ 내심에서 세 변까지의 거리는 모두 같으므로(내접원 반지름 r),\n" +
      "   이 점에 스프링클러를 설치하면 된다.\n" 
  },
  {
    type: "외심과 각도",
    inputType: "number",
    image: "/circum3.png",
    placeholder: "x의 값 (숫자만)",
    question:
      "삼각형 ABC에서 외심을 O라 하자.\n∠A = 60° 일 때, ∠BOC = x°를 구하시오.\n\n(외심의 성질: ∠BOC = 2∠A)",
    requiredAll: [120],
    answer: "x = 120°",
    solution:
      "외심 O에서 성립하는 성질:\n" +
      "∠BOC = 2 × ∠A\n\n" +
      "∠A = 60°이므로\n" +
      "∠BOC = 2 × 60° = 120°\n\n" +
      "∴ x = 120",
  },
  {
    type: "내심과 넓이",
    inputType: "number",
    image: "/circum4.png",
    placeholder: "넓이 (숫자만, cm²)",
    question:
      "삼각형 ABC에서 내심을 I라 하자.\nAB = 10 cm, BC = 8 cm, AC = 6 cm이고\n내접원의 반지름 r = 2 cm일 때,\n△ABC에서 내심을 꼭짓점으로 하는 세 삼각형의 넓이의 합,\n즉 △ABC의 넓이를 구하시오. (cm²)",
    requiredAll: [24],
    answer: "24 cm²",
    solution:
      "△ABC의 넓이 = 1/2 × r × (둘레)\n\n" +
      "둘레 = AB + BC + AC = 10 + 8 + 6 = 24 cm\n\n" +
      "△ABC = 1/2 × 2 × 24 = 24 cm²\n\n" +
      "∴ 24 cm²",
  },
];

// ── 3. 일차함수 실생활 문제 (6문제) ──
export const LINEAR_PROBLEMS = [
  {
    type: "요금·비용 문제",
    inputType: "number",
    placeholder: "요금 (숫자만, 원)",
    question:
      "인터넷 쇼핑몰에서 회원 가입을 하면 기본 쿠폰 2,000원을 주고,\n구매할 때마다 구매 금액의 10%를 적립해 준다.\n어떤 물건을 x원에 구매했을 때 실제로 내는 금액을 y원이라 하면\ny = 0.9x - 2000이다.\n이 쇼핑몰에서 10,000원짜리 물건을 살 때 실제 결제 금액을 구하시오.",
    requiredAll: [7000],
    answer: "7,000원",
    solution:
      "y = 0.9x - 2000에 x = 10000 대입\n\n" +
      "y = 0.9 × 10000 - 2000\n" +
      "  = 9000 - 2000\n" +
      "  = 7000\n\n" +
      "∴ 실제 결제 금액: 7,000원",
  },
  {
    type: "거리·속력 함수",
    inputType: "number",
    placeholder: "거리 (숫자만, km)",
    question:
      "서울에서 부산까지의 거리는 400 km이다.\n시속 80 km로 달리는 자동차가 출발한 지 x시간 후에\n부산까지 남은 거리를 y km라 할 때,\ny = 400 - 80x이다.\n출발 후 3시간 30분 뒤 남은 거리를 구하시오.",
    requiredAll: [120],
    answer: "120 km",
    solution:
      "y = 400 - 80x에 x = 3.5 대입\n\n" +
      "y = 400 - 80 × 3.5\n" +
      "  = 400 - 280\n" +
      "  = 120\n\n" +
      "∴ 남은 거리: 120 km",
  },
  {
    type: "온도·변화 문제",
    inputType: "number",
    placeholder: "시간 (숫자만, 분)",
    question:
      "80℃의 물이 냉각되기 시작하여 매분 3℃씩 온도가 낮아진다.\n냉각 시작 후 x분이 지났을 때의 온도 y℃는 y = 80 - 3x이다.\n온도가 20℃가 되는 것은 냉각 시작 후 몇 분 후인지 구하시오.",
    requiredAll: [20],
    answer: "20분 후",
    solution:
      "y = 80 - 3x 에서 y = 20 으로 놓으면\n\n" +
      "20 = 80 - 3x\n" +
      "3x = 60\n" +
      "x = 20\n\n" +
      "∴ 20분 후",
  },
  {
    type: "물탱크 문제",
    inputType: "number",
    placeholder: "시간 (숫자만, 분)",
    question:
      "현재 물이 30 L 들어 있는 300 L짜리 물탱크에\n분당 9 L씩 물을 채우고 있다.\n물을 넣기 시작한 지 x분 후의 물의 양 y = 9x + 30이다.\n물탱크가 가득 찰 때까지 걸리는 시간을 구하시오.",
    requiredAll: [30],
    answer: "30분",
    solution:
      "y = 9x + 30 에서 y = 300 으로 놓으면\n\n" +
      "300 = 9x + 30\n" +
      "9x = 270\n" +
      "x = 30\n\n" +
      "∴ 30분 후에 가득 참",
  },
  {
    type: "이익 함수 문제",
    inputType: "number",
    placeholder: "개수 (숫자만, 개)",
    question:
      "원가가 2,000원인 물건을 3,500원에 판매한다.\n하루 고정 비용이 45,000원일 때,\n하루에 x개를 판매하면 순이익 y = 1500x - 45000원이다.\n순이익이 0이 되는(손익분기점) 판매량을 구하시오.",
    requiredAll: [30],
    answer: "31개 이상",
    solution:
      "y = 1500x - 45000 에서 y = 0 으로 놓으면\n\n" +
      "1500x = 45000\n" +
      "x = 30\n\n" +
      "x = 30개일 때 y = 0 (손익분기점)\n" +
      "∴ 31개 이상 팔아야 이익이 남",
  },
  {
    type: "두 요금제 비교",
    inputType: "number",
    placeholder: "횟수 (숫자만, 회)",
    question:
      "헬스장 A는 이용 횟수당 8,000원이고,\n헬스장 B는 월 회원권 50,000원을 내면 이용 횟수당 3,000원이다.\n한 달에 x회 이용할 때,\ny₁ = 8000x (A),  y₂ = 3000x + 50000 (B)\n몇 회 초과 이용 시 B 헬스장이 더 유리한지 구하시오.",
    requiredAll: [10],
    answer: "10회 이상",
    solution:
      "B가 유리한 조건: y₂ < y₁\n\n" +
      "3000x + 50000 < 8000x\n" +
      "50000 < 5000x\n" +
      "x > 10\n\n" +
      "∴ 11회 이상 이용 시 B가 유리\n(10회 초과 = 11회 이상)",
  },
];

// ── 4. 확률 실생활 문제 (6문제) ──
export const PROBABILITY_PROBLEMS = [
  {
    type: "경우의 수",
    inputType: "number",
    placeholder: "경우의 수 (숫자만, 가지)",
    question:
      "A, B 두 개의 주사위를 동시에 던질 때,\n두 눈의 수의 합이 5가 되는 경우의 수를 구하시오.",
    requiredAll: [4],
    answer: "4가지",
    solution:
      "두 눈의 합이 5인 경우:\n\n" +
      "(A, B) = (1,4), (2,3), (3,2), (4,1)\n\n" +
      "∴ 4가지",
  },
  {
    type: "독립 사건 확률",
    inputType: "text",
    placeholder: "확률 (예: 9/10000)",
    question:
      "어느 공장에서 제품 불량률이 1/100 이다.\n임의로 제품 두 개를 뽑을 때,\n두 제품 모두 불량품일 확률을 구하시오.",
    requiredAll: [1, 10000],
    answer: "1/10000",
    solution:
      "두 제품 모두 불량품일 확률\n" +
      "= (불량 확률) × (불량 확률)\n\n" +
      "= 1/100 × 1/100\n\n" +
      "= 1/10000\n\n" +
      "∴ 1/10000",
  },
  {
    type: "여사건 확률",
    inputType: "text",
    placeholder: "확률 (예: 9/25)",
    question:
      "어느 시험에 합격할 확률이 4/5 이다.\n불합격할 확률을 여사건을 이용하여 구하시오.\n\n또한, 두 번 시험을 봐서 두 번 모두 불합격할 확률을 구하시오.",
    requiredAll: [1, 25],
    answer: "1/25",
    solution:
      "불합격 확률 = 1 - 4/5 = 1/5\n\n" +
      "두 번 모두 불합격할 확률\n" +
      "= 1/5 × 1/5 = 1/25\n\n" +
      "∴ 1/25",
  },
  {
    type: "통계적 확률",
    inputType: "text",
    placeholder: "확률 (예: 2/5)",
    question:
      "어느 학교 학생 300명의 혈액형을 조사한 결과이다.\n\n  A형: 93명,  B형: 87명,  O형: 95명,  AB형: 25명\n\n이 학교에서 임의로 한 명을 선택했을 때,\n혈액형이 O형이거나 AB형일 확률을 구하시오.",
    requiredAll: [2, 5],
    answer: "2/5",
    solution:
      "O형 또는 AB형의 수 = 95 + 25 = 120명\n\n" +
      "확률 = 120/300 = 2/5\n\n" +
      "∴ 2/5",
  },
  {
    type: "연속 확률",
    inputType: "text",
    placeholder: "확률 (예: 5/18)",
    question:
      "주머니 안에 빨간 공 3개, 파란 공 3개가 있다.\n공을 한 개씩 두 번 꺼낼 때 (꺼낸 공은 다시 넣지 않음),\n첫 번째는 빨간 공, 두 번째는 파란 공이 나올 확률을 구하시오.",
    requiredAll: [3, 10],
    answer: "3/10",
    solution:
      "전체 공: 6개\n\n" +
      "첫 번째 빨간 공: 3/6 = 1/2\n" +
      "두 번째 파란 공 (5개 남음): 3/5\n\n" +
      "1/2 × 3/5 = 3/10\n\n" +
      "∴ 3/10",
  },
  {
    type: "주사위 확률",
    inputType: "text",
    placeholder: "확률 (예: 5/36)",
    question:
      "두 개의 주사위를 동시에 던질 때,\n두 눈의 수의 합이 8이 될 확률을 구하시오.",
    requiredAll: [5, 36],
    answer: "5/36",
    solution:
      "전체 경우의 수: 6 × 6 = 36\n\n" +
      "합이 8인 경우:\n" +
      "(2,6), (3,5), (4,4), (5,3), (6,2) → 5가지\n\n" +
      "확률 = 5/36\n\n" +
      "∴ 5/36",
  },
];

// ── 단원 ID → 문제 세트 매핑 ──
export const PROBLEM_SETS = {
  system:       SYSTEM_PROBLEMS,
  circumcenter: CIRCUMCENTER_PROBLEMS,
  linear:       LINEAR_PROBLEMS,
  probability:  PROBABILITY_PROBLEMS,
};