import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createStudentAccount, deleteStudent, getStudents } from "../firebase";
import * as XLSX from "xlsx";

export default function AdminAccountPage({ user }) {
  const navigate = useNavigate();

  // 단일 추가
  const [sId,   setSId]   = useState("");
  const [sName, setSName] = useState("");
  const [sPw,   setSPw]   = useState("");
  const [showPw, setShowPw] = useState(false);

  // 상태
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [msg,       setMsg]       = useState(null); // {type:"ok"|"err", text}
  const [search,    setSearch]    = useState("");
  const [bulkRows,  setBulkRows]  = useState([]); // 엑셀 파싱 결과
  const [bulkMsg,   setBulkMsg]   = useState(null);
  const [bulkDoing, setBulkDoing] = useState(false);
  const fileRef = useRef(null);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadStudents = async () => {
    setLoading(true);
    try { setStudents(await getStudents()); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, []);

  // ── 단일 계정 생성 ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!sId.trim() || !sPw.trim()) {
      flash("err","학번과 비밀번호를 입력해줘!"); return;
    }
    if (sPw.length < 6) {
      flash("err","비밀번호는 6자 이상이어야 해!"); return;
    }
    setCreating(true);
    const res = await createStudentAccount(sId.trim(), sPw.trim(), sName.trim());
    setCreating(false);
    if (res.success) {
      flash("ok",`✅ ${sId} 계정이 생성됐어!`);
      setSId(""); setSName(""); setSPw("");
      loadStudents();
    } else {
      flash("err", res.error || "생성 실패");
    }
  };

  // ── 계정 삭제 ──
  const handleDelete = async (studentId, name) => {
    if (!window.confirm(`${name}(${studentId}) 계정을 삭제할까요?`)) return;
    await deleteStudent(studentId);
    flash("ok",`🗑 ${studentId} 계정이 삭제됐어!`);
    loadStudents();
  };

  // ── 엑셀 파싱 ──
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkMsg(null); setBulkRows([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type:"binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header:1 });
        // 첫 행은 헤더로 처리, 열: 학번(0) | 이름(1, 선택) | 비밀번호(2)
        const rows = data.slice(1).filter(r => r[0] && r[r.length-1]).map(r => ({
          studentId: String(r[0]).trim(),
          name:      r.length >= 3 ? String(r[1]||"").trim() : "",
          password:  String(r[r.length-1]).trim(),
        }));
        if (rows.length === 0) {
          setBulkMsg({ type:"err", text:"유효한 데이터가 없어! 형식을 확인해줘." });
        } else {
          setBulkRows(rows);
          setBulkMsg({ type:"ok", text:`${rows.length}명 확인됨. 아래에서 일괄 생성해줘!` });
        }
      } catch {
        setBulkMsg({ type:"err", text:"파일 읽기 실패. xlsx/xls/csv 파일을 사용해줘." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── 엑셀 일괄 생성 ──
  const handleBulkCreate = async () => {
    if (bulkRows.length === 0) return;
    setBulkDoing(true);
    let ok = 0, fail = 0, failList = [];
    for (const row of bulkRows) {
      if (row.password.length < 6) { fail++; failList.push(row.studentId); continue; }
      const res = await createStudentAccount(row.studentId, row.password, row.name);
      if (res.success) ok++;
      else { fail++; failList.push(row.studentId); }
    }
    setBulkDoing(false);
    setBulkRows([]);
    loadStudents();
    const txt = `✅ ${ok}명 생성 완료` + (fail > 0 ? ` | ❌ ${fail}명 실패: ${failList.join(", ")}` : "");
    setBulkMsg({ type: fail>0?"err":"ok", text: txt });
  };

  // ── 샘플 엑셀 다운로드 ──
  const downloadSample = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["학번","이름 (선택)","비밀번호"],
      ["20301","홍길동","coco1234"],
      ["20302","김철수","coco1234"],
      ["20303","이영희","coco5678"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "학생계정");
    XLSX.writeFile(wb, "학생계정_양식.xlsx");
  };

  const filtered = students.filter(s =>
    s.studentId.includes(search) || (s.name||"").includes(search)
  );

  const inp = {
    padding:"10px 14px", borderRadius:"10px",
    border:"1.5px solid #e2e8f0", fontSize:"14px",
    outline:"none", width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ background:"#f8f9ff", minHeight:"100vh" }}>

      {/* 헤더 */}
      <div style={{
        background:"white", padding:"14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        position:"sticky", top:0, zIndex:30
      }}>
        <button onClick={()=>navigate("/map")} style={{
          background:"none", border:"none", color:"#667eea",
          fontWeight:"700", fontSize:"14px", cursor:"pointer"
        }}>← 지도로</button>
        <div style={{ fontWeight:"900", fontSize:"18px" }}>
          👨‍💼 학생 계정 관리
        </div>
        <div style={{ fontSize:"13px", color:"#888" }}>
          {students.length}명 등록됨
        </div>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:"960px", margin:"0 auto" }}>

        {/* 전체 메시지 */}
        {msg && (
          <div style={{
            padding:"12px 16px", borderRadius:"12px",
            marginBottom:"16px", fontSize:"14px", fontWeight:"700",
            background: msg.type==="ok" ? "#e8f5e9" : "#ffebee",
            color:       msg.type==="ok" ? "#2e7d32" : "#c62828",
            border:`1px solid ${msg.type==="ok"?"#a5d6a7":"#ef9a9a"}`
          }}>{msg.text}</div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>

          {/* ── 왼쪽: 계정 추가 ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            {/* 단일 추가 */}
            <div style={{
              background:"white", borderRadius:"16px",
              padding:"20px", boxShadow:"0 4px 16px rgba(0,0,0,0.07)"
            }}>
              <div style={{ fontWeight:"900", fontSize:"16px",
                color:"#3949AB", marginBottom:"16px" }}>
                ➕ 학생 계정 추가
              </div>
              <form onSubmit={handleCreate}
                style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <label style={{ fontSize:"12px", fontWeight:"700",
                    color:"#555", display:"block", marginBottom:"4px" }}>
                    학번 *
                  </label>
                  <input type="text" value={sId}
                    onChange={e=>setSId(e.target.value)}
                    placeholder="예: 20301"
                    style={inp}/>
                </div>
                <div>
                  <label style={{ fontSize:"12px", fontWeight:"700",
                    color:"#555", display:"block", marginBottom:"4px" }}>
                    이름 (선택)
                  </label>
                  <input type="text" value={sName}
                    onChange={e=>setSName(e.target.value)}
                    placeholder="예: 홍길동"
                    style={inp}/>
                </div>
                <div>
                  <label style={{ fontSize:"12px", fontWeight:"700",
                    color:"#555", display:"block", marginBottom:"4px" }}>
                    비밀번호 * (6자 이상)
                  </label>
                  <div style={{ position:"relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={sPw}
                      onChange={e=>setSPw(e.target.value)}
                      placeholder="비밀번호 입력"
                      style={{ ...inp, paddingRight:"44px" }}/>
                    <button type="button"
                      onClick={()=>setShowPw(p=>!p)} style={{
                        position:"absolute", right:"12px", top:"50%",
                        transform:"translateY(-50%)",
                        background:"none", border:"none",
                        cursor:"pointer", fontSize:"16px", color:"#aaa"
                      }}>
                      {showPw?"🙈":"👁"}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={creating} style={{
                  padding:"12px",
                  background: creating
                    ? "#ccc"
                    : "linear-gradient(135deg,#667eea,#764ba2)",
                  color:"white", border:"none", borderRadius:"10px",
                  fontSize:"14px", fontWeight:"700",
                  cursor: creating ? "not-allowed" : "pointer",
                  marginTop:"4px"
                }}>
                  {creating ? "생성 중..." : "✅ 계정 생성"}
                </button>
              </form>
            </div>

            {/* 엑셀 일괄 추가 */}
            <div style={{
              background:"white", borderRadius:"16px",
              padding:"20px", boxShadow:"0 4px 16px rgba(0,0,0,0.07)"
            }}>
              <div style={{ fontWeight:"900", fontSize:"16px",
                color:"#2E7D32", marginBottom:"8px" }}>
                📊 엑셀로 일괄 추가
              </div>
              <div style={{ fontSize:"12px", color:"#888",
                lineHeight:"1.8", marginBottom:"12px" }}>
                열 순서: <strong>학번 | 이름(선택) | 비밀번호</strong><br/>
                첫 행은 헤더로 건너뜀
              </div>

              <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                <button onClick={()=>fileRef.current?.click()} style={{
                  flex:1, padding:"10px",
                  background:"#e8f5e9", border:"1.5px solid #a5d6a7",
                  borderRadius:"10px", fontSize:"13px",
                  fontWeight:"700", color:"#2E7D32", cursor:"pointer"
                }}>
                  📂 파일 선택
                </button>
                <button onClick={downloadSample} style={{
                  padding:"10px 14px",
                  background:"white", border:"1.5px solid #e2e8f0",
                  borderRadius:"10px", fontSize:"12px",
                  fontWeight:"700", color:"#555", cursor:"pointer",
                  whiteSpace:"nowrap"
                }}>
                  📥 양식 다운
                </button>
              </div>
              <input ref={fileRef} type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display:"none" }}/>

              {bulkMsg && (
                <div style={{
                  padding:"10px 12px", borderRadius:"8px",
                  fontSize:"13px", fontWeight:"600", marginBottom:"10px",
                  background: bulkMsg.type==="ok" ? "#e8f5e9" : "#ffebee",
                  color:       bulkMsg.type==="ok" ? "#2e7d32" : "#c62828",
                }}>{bulkMsg.text}</div>
              )}

              {bulkRows.length > 0 && (
                <>
                  {/* 미리보기 */}
                  <div style={{ maxHeight:"160px", overflowY:"auto",
                    border:"1px solid #e2e8f0", borderRadius:"8px",
                    marginBottom:"10px" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse",
                      fontSize:"12px" }}>
                      <thead>
                        <tr style={{ background:"#f8f9ff" }}>
                          {["학번","이름","비밀번호"].map(h=>(
                            <th key={h} style={{ padding:"6px 10px",
                              textAlign:"left", color:"#555",
                              borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((r,i)=>(
                          <tr key={i} style={{
                            background: i%2===0?"white":"#fafafa"
                          }}>
                            <td style={{ padding:"5px 10px" }}>{r.studentId}</td>
                            <td style={{ padding:"5px 10px" }}>{r.name||"-"}</td>
                            <td style={{ padding:"5px 10px",
                              fontFamily:"Courier New" }}>
                              {"•".repeat(Math.min(r.password.length,8))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={handleBulkCreate} disabled={bulkDoing} style={{
                    width:"100%", padding:"11px",
                    background: bulkDoing
                      ? "#ccc"
                      : "linear-gradient(135deg,#2E7D32,#1B5E20)",
                    color:"white", border:"none", borderRadius:"10px",
                    fontSize:"14px", fontWeight:"700",
                    cursor: bulkDoing ? "not-allowed" : "pointer"
                  }}>
                    {bulkDoing
                      ? "생성 중..."
                      : `🚀 ${bulkRows.length}명 일괄 생성`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── 오른쪽: 학생 목록 ── */}
          <div style={{
            background:"white", borderRadius:"16px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
            display:"flex", flexDirection:"column", overflow:"hidden"
          }}>
            <div style={{
              padding:"16px 20px", borderBottom:"1px solid #f0f0f0",
              display:"flex", alignItems:"center",
              justifyContent:"space-between", gap:"10px", flexShrink:0
            }}>
              <div style={{ fontWeight:"900", fontSize:"16px" }}>
                📋 등록된 학생 ({students.length}명)
              </div>
              <button onClick={loadStudents} style={{
                background:"none", border:"1px solid #e2e8f0",
                borderRadius:"8px", padding:"5px 10px",
                fontSize:"12px", cursor:"pointer", color:"#555"
              }}>↻ 새로고침</button>
            </div>

            {/* 검색 */}
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #f5f5f5" }}>
              <input type="text" value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="학번 또는 이름 검색..."
                style={{ ...inp, fontSize:"13px" }}/>
            </div>

            {/* 목록 */}
            <div style={{ flex:1, overflowY:"auto", maxHeight:"580px" }}>
              {loading ? (
                <div style={{ padding:"40px", textAlign:"center",
                  color:"#aaa", fontSize:"14px" }}>불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding:"40px", textAlign:"center",
                  color:"#aaa", fontSize:"14px" }}>
                  {search ? "검색 결과가 없어요" : "등록된 학생이 없어요"}
                </div>
              ) : filtered.map(s => (
                <div key={s.studentId} style={{
                  display:"flex", alignItems:"center",
                  padding:"12px 16px",
                  borderBottom:"1px solid #f5f5f5",
                  gap:"12px"
                }}>
                  <div style={{
                    width:"38px", height:"38px", borderRadius:"50%",
                    background:"linear-gradient(135deg,#667eea,#764ba2)",
                    display:"flex", alignItems:"center",
                    justifyContent:"center",
                    color:"white", fontSize:"16px",
                    fontWeight:"700", flexShrink:0
                  }}>
                    {(s.name||s.studentId)[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"14px", fontWeight:"700",
                      color:"#333" }}>
                      {s.name || "이름 없음"}
                    </div>
                    <div style={{ fontSize:"12px", color:"#888",
                      fontFamily:"Courier New" }}>
                      학번: {s.studentId}
                    </div>
                  </div>
                  <button
                    onClick={()=>handleDelete(s.studentId, s.name||s.studentId)}
                    style={{
                      background:"#ffebee", border:"1px solid #ef9a9a",
                      borderRadius:"8px", padding:"5px 10px",
                      fontSize:"12px", color:"#c62828",
                      cursor:"pointer", fontWeight:"700",
                      flexShrink:0
                    }}>
                    🗑 삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 안내 박스 */}
        <div style={{
          marginTop:"20px", background:"#FFF8E1",
          borderRadius:"12px", padding:"14px 18px",
          border:"1px solid #FFE082", fontSize:"13px",
          lineHeight:"1.9", color:"#555"
        }}>
          <strong style={{ color:"#E65100" }}>💡 사용 안내</strong><br/>
          • 학생은 <strong>학번 + 비밀번호</strong>로 로그인 페이지 "학번 로그인" 탭에서 접속해요<br/>
          • 비밀번호는 <strong>6자 이상</strong>이어야 해요 (예: coco1234)<br/>
          • 삭제하면 해당 학생은 더 이상 로그인할 수 없어요<br/>
          • 엑셀 양식: 열 순서 = <strong>학번 | 이름(선택) | 비밀번호</strong>
        </div>
      </div>
    </div>
  );
}
