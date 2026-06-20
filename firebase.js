import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc,
         collection, getDocs } from "firebase/firestore";

// ── Firebase 설정: 환경변수에서 불러오기 ──
// 실제 값은 .env 파일에 저장하고, .env는 절대 git에 올리지 않습니다.
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ★ Secondary App (관리자 세션 유지하며 학생 계정 생성)
const secondaryApp  = initializeApp(firebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

// ── 사용자 정보 저장 ──
export const saveUserProgress = async (userId, chapterId, data) => {
  const ref = doc(db, "users", userId, "chapters", chapterId);
  await setDoc(ref, { ...data, updatedAt: new Date() }, { merge: true });
};

// ── 사용자 정보 불러오기 ──
export const loadUserProgress = async (userId, chapterId) => {
  const ref = doc(db, "users", userId, "chapters", chapterId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const resetUserProgress = async (userId, chapterId) => {
  const ref = doc(db, "users", userId, "chapters", chapterId);
  await deleteDoc(ref);
};

// ── 학생 계정 생성 ──
export const createStudentAccount = async (studentId, password, name = "") => {
  const email = `${studentId}@coco.app`;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name || studentId });
    await secondaryAuth.signOut();
    await setDoc(doc(db, "students", studentId), {
      studentId,
      name: name || studentId,
      email,
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    if (e.code === "auth/email-already-in-use")
      return { success: false, error: "이미 존재하는 학번이에요." };
    return { success: false, error: e.message };
  }
};

// ── 학번으로 로그인 ──
export const signInStudent = async (studentId, password) => {
  const email = `${studentId}@coco.app`;
  return signInWithEmailAndPassword(auth, email, password);
};

// ── 학생 목록 조회 ──
export const getStudents = async () => {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(d => d.data())
    .sort((a, b) => a.studentId.localeCompare(b.studentId));
};

// ── 학생 계정 삭제 (Firestore에서 제거 = 로그인 차단) ──
export const deleteStudent = async (studentId) => {
  await deleteDoc(doc(db, "students", studentId));
};
