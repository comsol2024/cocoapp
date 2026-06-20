import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../config/admins";

const SITE_MAP = [
  {
    category: "🗺 메인",
    color: "#1565C0",
    pages: [
      { label: "로그인",         path: "/"              },
      { label: "메인 맵",        path: "/map"           },
      { label: "학생 계정 관리", path:"/admin-accounts" },
      { label: "수업 설계", path:"/lesson-design" },
    ]
  },
  {
    category: "🏛 1챕터 · 연립방정식",
    color: "#6A1B9A",
    pages: [
      { label: "강당 씬",        path: "/chapter/auditorium" },
      { label: "교실 씬",        path: "/classroom"          },
      { label: "공연 기획",      path: "/planning"           },
      { label: "연립방정식",     path: "/equation"           },
    ]
  },
  {
    category: "💙 2챕터 · 외심",
    color: "#1565C0",
    pages: [
      { label: "AED 씬",         path: "/chapter/aed"   },
      { label: "외심 시뮬레이션", path: "/incenter-sim"  },
    ]
  },
  {
    category: "🍱 3챕터 · 일차함수",
    color: "#E65100",
    pages: [
      { label: "급식 씬",        path: "/lunch-scene"   },
      { label: "배식 데이터",    path: "/lunch-data"    },
    ]
  },
  {
    category: "⛈️ 4챕터 · 확률",
    color: "#2E7D32",
    pages: [
      { label: "비오는 날 씬",    path: "/rain-scene"    },
      { label: "강수 데이터",    path: "/rain-data"     },
      { label: "문제 만들기",    path: "/rain-problem"  },
    ]
  },
];

export default function AdminSiteMap({ user }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!isAdmin(user)) return null;

  return (
    <>
      {/* 플로팅 버튼 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="관리자 사이트맵"
          style={{
            position: "fixed",
            bottom: "90px",
            left: "16px",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#333,#111)",
            border: "2px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            zIndex: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          🚩
        </button>
      )}

      {/* 사이트맵 패널 */}
      {open && (
        <>
          {/* 오버레이 */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 600
            }}/>

          {/* 패널 */}
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: "#1a1a2e",
            borderRadius: "20px",
            padding: "0",
            width: "min(520px,92vw)",
            maxHeight: "82vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 700,
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>

            {/* 헤더 */}
            <div style={{
              padding: "18px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "linear-gradient(135deg,rgba(102,126,234,0.3),transparent)"
            }}>
              <div>
                <div style={{
                  color: "white", fontWeight: "900", fontSize: "17px"
                }}>
                  사이트맵
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.45)",
                  marginTop: "2px"
                }}>
                  관리자 전용 · {user?.email}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "rgba(255,255,255,0.1)",
                border: "none", color: "white",
                width: "32px", height: "32px",
                borderRadius: "50%", cursor: "pointer",
                fontSize: "14px", fontWeight: "700"
              }}>✕</button>
            </div>

            {/* 페이지 목록 */}
            <div style={{
              overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: "12px"
            }}>
              {SITE_MAP.map((section, si) => (
                <div key={si}>
                  {/* 섹션 라벨 */}
                  <div style={{
                    fontSize: "12px", fontWeight: "700",
                    color: section.color,
                    marginBottom: "6px",
                    paddingLeft: "4px",
                    letterSpacing: "0.3px"
                  }}>
                    {section.category}
                  </div>

                  {/* 페이지 버튼들 */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: "7px"
                  }}>
                    {section.pages.map((page, pi) => (
                      <button
                        key={pi}
                        onClick={() => {
                          navigate(page.path);
                          setOpen(false);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          border: `1px solid ${section.color}55`,
                          background: `${section.color}18`,
                          color: "rgba(255,255,255,0.85)",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${section.color}40`;
                          e.currentTarget.style.borderColor = section.color;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = `${section.color}18`;
                          e.currentTarget.style.borderColor = `${section.color}55`;
                        }}>
                        {page.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 현재 경로 표시 */}
            <div style={{
              padding: "10px 20px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              flexShrink: 0
            }}>
              현재 경로: {window.location.pathname}
            </div>
          </div>
        </>
      )}
    </>
  );
}