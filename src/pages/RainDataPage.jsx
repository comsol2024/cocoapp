import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import cocoImg from "../styles/images/coco.png";
import CocoChat    from "../components/CocoChat";
import { PROMPTS } from "../utils/cocoPrompts";

// ─────────────────────────────────────────────────────────────────
// 📌 실제 기상청 데이터로 교체하려면 아래 MAY_DATA만 수정하세요.
//    출처: 기상청 기상자료개방포털 (https://data.kma.go.kr)
//    URL : https://data.kma.go.kr/stcs/grnd/grndRnDay.do?pgmNo=156
//    관측소: 서울(108) / 기간: 2021~2025년 5월 / 1=비, 0=맑음
// ─────────────────────────────────────────────────────────────────
const MAY_DATA = {
  //         1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31
  2021: [    0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
  2022: [    0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  2023: [    0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0],
  2024: [    1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0],
  2025: [    0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
};
// ─────────────────────────────────────────────────────────────────

const YEARS = [2021, 2022, 2023, 2024, 2025];

// 2021~2025년 5월 1일 요일 (0=일, 1=월 ... 6=토)
const MAY_START_DOW = { 2021:6, 2022:0, 2023:1, 2024:3, 2025:4 };

const WEEKDAYS = ["일","월","화","수","목","금","토"];

// 전이 횟수 계산 (정답 확인용)
const calcTransitions = () => {
  let rr=0, rc=0, cr=0, cc=0;
  for (const y of YEARS) {
    const d = MAY_DATA[y];
    for (let i=0; i<d.length-1; i++) {
      if      (d[i]===1 && d[i+1]===1) rr++;
      else if (d[i]===1 && d[i+1]===0) rc++;
      else if (d[i]===0 && d[i+1]===1) cr++;
      else cc++;
    }
  }
  return { rr, rc, cr, cc };
};
const TRANS       = calcTransitions();
const TOTAL_RAIN  = Object.values(MAY_DATA).flat().filter(v=>v===1).length;
const TOTAL_CLEAR = Object.values(MAY_DATA).flat().filter(v=>v===0).length;
const STAT_RR     = (TRANS.rr / (TRANS.rr + TRANS.rc) * 100).toFixed(1);
const STAT_CR     = (TRANS.cr / (TRANS.cr + TRANS.cc) * 100).toFixed(1);

// CSV 다운로드
const downloadCSV = () => {
  const rows = ["연도,날짜,날씨"];
  for (const year of YEARS) {
    for (let i=0; i<MAY_DATA[year].length; i++)
      rows.push(`${year},5월 ${i+1}일,${MAY_DATA[year][i]===1?"비":"맑음"}`);
  }
  const footer = `\n출처: 기상청 기상자료개방포털 (https://data.kma.go.kr)\n관측소: 서울(108) 2021~2025년 5월 일별 강수 데이터`;
  const blob   = new Blob(["\uFEFF" + rows.join("\n") + footer],
                          { type:"text/csv;charset=utf-8;" });
  const link   = document.createElement("a");
  link.href     = URL.createObjectURL(blob);
  link.download = "서울_5월_강수데이터_2021-2025.csv";
  link.click();
};

export default function RainDataPage({ user }) {
  const navigate = useNavigate();
  const [selYear,    setSelYear]    = useState(2021);
  const [saved,      setSaved]      = useState(false);

  // 학생이 체크한 날짜 {year: [true/false * 31]}
  const [checked, setChecked] = useState(
    YEARS.reduce((a, y) => ({ ...a, [y]: Array(31).fill(false) }), {})
  );

  // ── 학생 입력값 ──
  const [rainDays,  setRainDays]  = useState("");
  const [clearDays, setClearDays] = useState("");
  const [rrDays,    setRrDays]    = useState("");
  const [crDays,    setCrDays]    = useState("");
  const [probRR,    setProbRR]    = useState("");
  const [probCR,    setProbCR]    = useState("");

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db,"users",user.uid,"chapters","rain-data"));
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.rainDays)  setRainDays(d.rainDays);
      if (d.clearDays) setClearDays(d.clearDays);
      if (d.rrDays)    setRrDays(d.rrDays);
      if (d.crDays)    setCrDays(d.crDays);
      if (d.probRR)    setProbRR(d.probRR);
      if (d.probCR)    setProbCR(d.probCR);
      if (d.checked)   setChecked(d.checked);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      await setDoc(
        doc(db,"users",user.uid,"chapters","rain-data"),
        { rainDays, clearDays, rrDays, crDays, probRR, probCR, checked,
          updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setSaved(true); setTimeout(()=>setSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rainDays, clearDays, rrDays, crDays, probRR, probCR, checked]);

  const toggleDay = (year, idx) => {
    setChecked(prev => {
      const arr = [...prev[year]];
      arr[idx] = !arr[idx];
      return { ...prev, [year]: arr };
    });
  };

  const resetChecked = (year) =>
    setChecked(prev => ({ ...prev, [year]: Array(31).fill(false) }));

  // 체크된 날 수 (현재 연도)
  const checkedCount = checked[selYear]?.filter(Boolean).length ?? 0;

  // ── 달력 렌더링 ──
  const renderCalendar = (year) => {
    const data     = MAY_DATA[year];
    const startDow = MAY_START_DOW[year];
    const cells    = [];
    for (let i=0; i<startDow; i++) cells.push(null);
    for (let i=0; i<31;       i++) cells.push(i);

    return (
      <div>
        {/* 요일 헤더 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
          gap:"3px", marginBottom:"4px" }}>
          {WEEKDAYS.map((d,i) => (
            <div key={d} style={{
              textAlign:"center", fontSize:"11px",
              fontWeight:"700", padding:"3px",
              color: i===0?"#e53935": i===6?"#1565C0":"#888"
            }}>{d}</div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px" }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`}/>;
            const isRain    = data[day] === 1;
            const isChecked = checked[year]?.[day] ?? false;
            return (
              <div
                key={day}
                onClick={() => toggleDay(year, day)}
                style={{
                  borderRadius:"8px",
                  padding:"4px 2px",
                  textAlign:"center",
                  cursor:"pointer",
                  userSelect:"none",
                  position:"relative",
                  background: isChecked
                    ? (isRain ? "#1565C0" : "#E65100")
                    : (isRain ? "#BBDEFB" : "#FFF9C4"),
                  border: isChecked
                    ? (isRain ? "2px solid #0D47A1" : "2px solid #BF360C")
                    : (isRain ? "1.5px solid #42A5F5" : "1.5px solid #F9A825"),
                  transition:"all 0.15s ease",
                  boxShadow: isChecked ? "0 2px 6px rgba(0,0,0,0.25)" : "none",
                }}>
                <div style={{
                  fontSize:"10px", fontWeight:"700",
                  color: isChecked ? "white" : "#555"
                }}>
                  {day+1}
                </div>
                <div style={{ fontSize:"13px", lineHeight:"1" }}>
                  {isRain ? "🌧" : "☀️"}
                </div>
                {isChecked && (
                  <div style={{
                    position:"absolute", top:"1px", right:"2px",
                    fontSize:"9px", color:"white", fontWeight:"900"
                  }}>✓</div>
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 + 요약 */}
        <div style={{ display:"flex", gap:"8px", marginTop:"8px",
          alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"3px",
            fontSize:"11px", color:"#555" }}>
            <span style={{ background:"#BBDEFB", borderRadius:"4px",
              padding:"1px 5px", border:"1px solid #42A5F5" }}>🌧</span> 비
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"3px",
            fontSize:"11px", color:"#555" }}>
            <span style={{ background:"#FFF9C4", borderRadius:"4px",
              padding:"1px 5px", border:"1px solid #F9A825" }}>☀️</span> 맑음
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"3px",
            fontSize:"11px", color:"#1565C0", fontWeight:"700" }}>
            <span style={{ background:"#1565C0", borderRadius:"4px",
              padding:"1px 5px", color:"white" }}>✓</span> 체크됨
          </div>
          <span style={{ fontSize:"11px", color:"#888", marginLeft:"auto" }}>
            5월 {data.length}일
          </span>
        </div>

        {/* 체크 현황 + 초기화 */}
        <div style={{
          display:"flex", justifyContent:"space-between",
          alignItems:"center", marginTop:"6px",
          background:"#f8f9ff", borderRadius:"8px",
          padding:"6px 10px"
        }}>
          <span style={{ fontSize:"12px", color:"#555" }}>
            ✓ 체크한 날: <strong style={{ color:"#1565C0" }}>{checkedCount}일</strong>
          </span>
          <button onClick={()=>resetChecked(year)} style={{
            fontSize:"11px", color:"#e53935", background:"white",
            border:"1px solid #e53935", borderRadius:"6px",
            padding:"3px 8px", cursor:"pointer", fontWeight:"700"
          }}>
            초기화
          </button>
        </div>
      </div>
    );
  };

  const inp = {
    padding:"8px 12px", borderRadius:"10px",
    border:"1.5px solid #e2e8f0", fontSize:"14px",
    outline:"none", width:"100%", boxSizing:"border-box",
  };

  const Fraction = ({ top, bottom, color="#1565C0" }) => (
    <span style={{ display:"inline-flex", flexDirection:"column",
      alignItems:"center", margin:"0 6px", verticalAlign:"middle",
      lineHeight:"1.4" }}>
      <span style={{ fontSize:"12px", fontWeight:"700", color,
        borderBottom:`1.5px solid ${color}`, paddingBottom:"1px",
        whiteSpace:"nowrap" }}>{top}</span>
      <span style={{ fontSize:"12px", fontWeight:"700", color,
        paddingTop:"1px", whiteSpace:"nowrap" }}>{bottom}</span>
    </span>
  );

  return (
    <div style={{ background:"linear-gradient(180deg,#E3F2FD,#BBDEFB)",
      minHeight:"100vh" }}>

      {/* 헤더 */}
      <div style={{
        background:"white", padding:"12px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/rain-scene")} style={{
          background:"none", border:"none", color:"#1565C0",
          fontWeight:"700", fontSize:"14px", cursor:"pointer"
        }}>← Step 1</button>
        <div style={{ fontWeight:"900", fontSize:"17px" }}>
          ⛈️ 비오는 날 체육 수업 — Step 2
        </div>
        <div style={{ fontSize:"12px", fontWeight:"600",
          color:saved?"#34a853":"#bbb" }}>
          {saved?"✓ 저장됨":"저장 중..."}
        </div>
      </div>

      <div style={{ padding:"16px 20px", maxWidth:"1200px", margin:"0 auto" }}>

        {/* 안내 */}
        <div style={{
          background:"linear-gradient(135deg,#1565C0,#0D47A1)",
          borderRadius:"14px", padding:"12px 16px",
          marginBottom:"16px", color:"white",
          display:"flex", alignItems:"center", gap:"12px"
        }}>
          <img src={cocoImg} alt="COCO"
            style={{ width:"80px", height:"80px", objectFit:"contain", flexShrink:0 }}/>
          <div style={{ fontSize:"15px", lineHeight:"1.8" }}>
            🌀 <strong>COCO 미션 — Step 2</strong><br/>
            서울·경기 지역 5월 날씨 달력을 보면서<br/>
            날씨 변화 횟수를 직접 세어 통계적 확률을 구해봐!
          </div>
        </div>

        {/* 2열 레이아웃 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

          {/* ── 왼쪽: 강수 달력 ── */}
          <div style={{ background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)", overflow:"hidden" }}>

            {/* 달력 헤더 */}
            <div style={{
              padding:"12px 16px", borderBottom:"1px solid #f0f0f0",
              background:"linear-gradient(90deg,#e3f2fd,white)"
            }}>
              <div style={{ fontWeight:"900", fontSize:"15px", marginBottom:"8px" }}>
                📅 서울·경기 5월 강수 데이터 (2021~2025)
              </div>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                <a href="https://data.kma.go.kr/stcs/grnd/grndRnDay.do?pgmNo=156"
                  target="_blank" rel="noreferrer" style={{
                    fontSize:"12px", fontWeight:"700", color:"#1565C0",
                    textDecoration:"none", background:"white",
                    padding:"5px 10px", borderRadius:"8px",
                    border:"1px solid #90CAF9", display:"inline-block"
                  }}>
                  🌐 기상청 출처
                </a>
                <button onClick={downloadCSV} style={{
                  fontSize:"12px", fontWeight:"700", color:"white",
                  background:"#1565C0", padding:"5px 12px",
                  borderRadius:"8px", border:"none", cursor:"pointer"
                }}>
                  ⬇ 데이터 다운로드
                </button>
              </div>
            </div>

            <div style={{ padding:"14px 16px" }}>
              {/* 연도 탭 */}
              <div style={{ display:"flex", gap:"5px",
                marginBottom:"12px", flexWrap:"wrap" }}>
                {YEARS.map(y=>(
                  <button key={y} onClick={()=>setSelYear(y)} style={{
                    padding:"5px 13px", borderRadius:"8px", cursor:"pointer",
                    border: selYear===y ? "2px solid #1565C0" : "1px solid #e2e8f0",
                    background: selYear===y ? "#1565C0" : "white",
                    color: selYear===y ? "white" : "#555",
                    fontSize:"13px", fontWeight: selYear===y ? "700" : "400",
                  }}>{y}</button>
                ))}
              </div>

              {renderCalendar(selYear)}

              {/* 전체 요약 */}
              <div style={{ marginTop:"12px", padding:"10px 12px",
                background:"#f8f9ff", borderRadius:"10px",
                fontSize:"13px", color:"#555", lineHeight:"1.8" }}>
                <strong>2021~2025 전체: {YEARS.length * 31}일</strong>
              </div>

              {/* 사용 안내 */}
              <div style={{ marginTop:"10px", padding:"10px 12px",
                background:"#FFF8E1", borderRadius:"10px",
                fontSize:"12px", color:"#E65100", lineHeight:"1.8",
                border:"1px solid #FFE082" }}>
                💡 <strong>체크 방법:</strong> 날짜 칸을 클릭하면 체크돼요!<br/>
                비가 온 날(🌧) 다음날도 비가 오면 <strong>비→비</strong>,<br/>
                맑은 날(☀️) 다음날 비가 오면 <strong>맑→비</strong>예요.
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 통계 데이터 추출 ── */}
          <div style={{ background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)", overflow:"hidden" }}>
            <div style={{
              padding:"12px 16px", borderBottom:"1px solid #f0f0f0",
              fontWeight:"900", fontSize:"15px",
              background:"linear-gradient(90deg,#e8f5e9,white)"
            }}>
              📊 통계 데이터 추출
            </div>

            <div style={{ padding:"14px 16px",
              display:"flex", flexDirection:"column", gap:"14px" }}>

              {/* ① 전체 날수 */}
              <div style={{ background:"#f8f9ff", borderRadius:"12px",
                padding:"14px 16px", border:"1.5px solid #dde3ff" }}>
                <div style={{ fontSize:"14px", fontWeight:"800",
                  color:"#3949AB", marginBottom:"12px" }}>
                  ① 전체 날수 세기
                  <span style={{ fontSize:"12px", fontWeight:"400",
                    color:"#888", marginLeft:"8px" }}>
                    (달력 보고 5년 합계를 세어봐!)
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  <div>
                    <label style={{ fontSize:"13px", fontWeight:"700",
                      color:"#1565C0", display:"block", marginBottom:"5px" }}>
                      🌧 비가 온 날 (일)
                    </label>
                    <input type="text" inputMode="numeric" value={rainDays}
                      onChange={e=>setRainDays(e.target.value)}
                      placeholder="예: 50"
                      style={{ ...inp, background:"#EDE7F6",
                        border:"1.5px solid #B39DDB" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:"13px", fontWeight:"700",
                      color:"#E65100", display:"block", marginBottom:"5px" }}>
                      ☀️ 맑은 날 (일)
                    </label>
                    <input type="text" inputMode="numeric" value={clearDays}
                      onChange={e=>setClearDays(e.target.value)}
                      placeholder="예: 105"
                      style={{ ...inp, background:"#FFF8E1",
                        border:"1.5px solid #FFCC02" }}/>
                  </div>
                </div>
                {rainDays && clearDays && (
                  <div style={{ marginTop:"6px", fontSize:"12px",
                    color:"#888", textAlign:"right" }}>
                    합계: {(parseFloat(rainDays)||0)+(parseFloat(clearDays)||0)}일
                    &nbsp;(전체 {YEARS.length * 31}일 중)
                  </div>
                )}
              </div>

              {/* ② 비→비 */}
              <div style={{ background:"#EDE7F6", borderRadius:"12px",
                padding:"14px 16px", border:"1.5px solid #CE93D8" }}>
                <div style={{ fontSize:"14px", fontWeight:"800",
                  color:"#6A1B9A", marginBottom:"8px" }}>
                  ② 비가 온 다음날도 비가 온 횟수 세기
                </div>
                <div style={{ fontSize:"12px", color:"#666",
                  marginBottom:"10px", lineHeight:"1.8",
                  background:"white", borderRadius:"8px",
                  padding:"8px 10px" }}>
                  달력에서 <strong style={{ color:"#1565C0" }}>🌧 비</strong>인 날을 찾고,
                  그 <strong>다음날도 🌧 비</strong>이면 체크해봐!
                </div>
                <label style={{ fontSize:"13px", fontWeight:"700",
                  color:"#6A1B9A", display:"block", marginBottom:"5px" }}>
                  비 다음날 비 횟수 (일)
                </label>
                <input type="text" inputMode="numeric" value={rrDays}
                  onChange={e=>setRrDays(e.target.value)}
                  placeholder="예: 22"
                  style={{ ...inp, background:"white",
                    border:"1.5px solid #CE93D8" }}/>
              </div>

              {/* ③ 맑→비 */}
              <div style={{ background:"#E8F5E9", borderRadius:"12px",
                padding:"14px 16px", border:"1.5px solid #A5D6A7" }}>
                <div style={{ fontSize:"14px", fontWeight:"800",
                  color:"#2E7D32", marginBottom:"8px" }}>
                  ③ 맑은 다음날 비가 온 횟수 세기
                </div>
                <div style={{ fontSize:"12px", color:"#666",
                  marginBottom:"10px", lineHeight:"1.8",
                  background:"white", borderRadius:"8px",
                  padding:"8px 10px" }}>
                  달력에서 <strong style={{ color:"#E65100" }}>☀️ 맑음</strong>인 날을 찾고,
                  그 <strong>다음날이 🌧 비</strong>이면 체크해봐!
                </div>
                <label style={{ fontSize:"13px", fontWeight:"700",
                  color:"#2E7D32", display:"block", marginBottom:"5px" }}>
                  맑은날 다음날 비 횟수 (일)
                </label>
                <input type="text" inputMode="numeric" value={crDays}
                  onChange={e=>setCrDays(e.target.value)}
                  placeholder="예: 28"
                  style={{ ...inp, background:"white",
                    border:"1.5px solid #A5D6A7" }}/>
              </div>

              {/* ④ 통계적 확률 계산 */}
              <div style={{ background:"#e3f2fd", borderRadius:"12px",
                padding:"14px 16px", border:"1.5px solid #90CAF9" }}>
                <div style={{ fontSize:"14px", fontWeight:"800",
                  color:"#1565C0", marginBottom:"12px" }}>
                  📐 통계적 확률 계산하기
                </div>

                {/* P(비→비) */}
                <div style={{ background:"white", borderRadius:"10px",
                  padding:"12px 14px", marginBottom:"10px" }}>
                  <div style={{ fontSize:"13px", color:"#555",
                    marginBottom:"8px", lineHeight:"2" }}>
                    <strong style={{ color:"#6A1B9A" }}>P(비 → 비)</strong>
                    {" = "}
                    <Fraction
                      top="비온 뒤 비온 날 횟수"
                      bottom="비온 날 횟수"
                      color="#6A1B9A"/>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"13px", fontWeight:"700",
                      color:"#6A1B9A", whiteSpace:"nowrap" }}>
                      P(비 → 비) =
                    </span>
                    <input type="text" inputMode="decimal" value={probRR}
                      onChange={e=>setProbRR(e.target.value)}
                      placeholder="0.00"
                      style={{ ...inp, maxWidth:"100px", textAlign:"center",
                        fontFamily:"Courier New", fontSize:"15px",
                        fontWeight:"700" }}/>
                  </div>
                </div>

                {/* P(맑→비) */}
                <div style={{ background:"white", borderRadius:"10px",
                  padding:"12px 14px" }}>
                  <div style={{ fontSize:"13px", color:"#555",
                    marginBottom:"8px", lineHeight:"2" }}>
                    <strong style={{ color:"#2E7D32" }}>P(맑 → 비)</strong>
                    {" = "}
                    <Fraction
                      top="맑은 뒤 비온 날 횟수"
                      bottom="맑은 날 횟수"
                      color="#2E7D32"/>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"13px", fontWeight:"700",
                      color:"#2E7D32", whiteSpace:"nowrap" }}>
                      P(맑 → 비) =
                    </span>
                    <input type="text" inputMode="decimal" value={probCR}
                      onChange={e=>setProbCR(e.target.value)}
                      placeholder="0.00"
                      style={{ ...inp, maxWidth:"100px", textAlign:"center",
                        fontFamily:"Courier New", fontSize:"15px",
                        fontWeight:"700" }}/>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 나만의 문제 만들기 버튼 */}
        <div style={{ marginTop:"20px", marginBottom:"14px" }}>
          <button onClick={()=>navigate("/rain-problem")} style={{
            width:"100%", padding:"18px",
            background:"linear-gradient(135deg,#2E7D32,#1B5E20)",
            color:"white", border:"none", borderRadius:"16px",
            fontSize:"17px", fontWeight:"700", cursor:"pointer",
            boxShadow:"0 4px 18px rgba(46,125,50,0.35)",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:"10px"
          }}>
            ✏️ 나만의 문제 만들기 →
          </button>
        </div>
      </div>

      <CocoChat
        systemPrompt={PROMPTS.rain}
        initialMessage="안녕! 나는 코코야 🌀&#10;확률을 구하는 것이 어려우면 물어봐!"
      />
    </div>
  );
}
