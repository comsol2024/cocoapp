// 관리자 구글 계정 이메일 목록 (최대 3개)
export const ADMIN_EMAILS = [
  "comsol2024@goedu.kr",
  "loveg6985@goedu.kr",
  "whddlfgoals@gmail.com",
];

export const isAdmin = (user) =>
  user && ADMIN_EMAILS.includes(user.email);