import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LoginPage from "./pages/LoginPage";
import MainMap from "./pages/MainMap";
import ChapterScene from "./pages/ChapterScene";
import ClassroomScene from "./pages/ClassroomScene";
import PlanningPage from "./pages/PlanningPage";
import EquationPage from "./pages/EquationPage";
import AEDScene from "./pages/AEDScene";
import IncentorSim from "./pages/IncentorSim";
import LunchScene    from "./pages/LunchScene";
import LunchDataPage from "./pages/LunchDataPage";
import RainScene    from "./pages/RainScene";
import RainDataPage from "./pages/RainDataPage";
import RainProblemPage from "./pages/RainProblemPage";
import AdminSiteMap from "./components/AdminSiteMap";
import "./styles/coco.css";
import AdminAccountPage from "./pages/AdminAccountPage";
import { isAdmin } from "./config/admins";
import LessonDesign from "./pages/LessonDesign";


function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) return (
    <div style={{
      width:"100vw", height:"100vh",
      background:"linear-gradient(180deg,#87CEEB,#90EE90)",
      display:"flex", alignItems:"center",
      justifyContent:"center", flexDirection:"column", gap:"16px"
    }}>
      <div style={{ fontSize:"64px", animation:"float 1s ease-in-out infinite" }}>🌀</div>
      <div style={{ color:"white", fontWeight:"700", fontSize:"16px" }}>COCO 로딩 중...</div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </div>
  );

  return (
    <BrowserRouter>
      <AdminSiteMap user={user}/>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/map" replace /> : <LoginPage />} />
        <Route path="/map" element={user ? <MainMap user={user} /> : <Navigate to="/" replace />} />
        <Route path="/chapter/:chapterId" element={user ? <ChapterScene user={user} /> : <Navigate to="/" replace />} />
        <Route path="/classroom" element={user ? <ClassroomScene user={user} /> : <Navigate to="/" replace />} />
        <Route path="/planning" element={user ? <PlanningPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/equation" element={user ? <EquationPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/chapter/aed" element={user ? <AEDScene user={user} /> : <Navigate to="/" replace />} />
        <Route path="/incenter-sim" element={user ? <IncentorSim user={user} /> : <Navigate to="/" replace />} />
        <Route path="/lunch-scene" element={user ? <LunchScene user={user} /> : <Navigate to="/" replace />} />
        <Route path="/lunch-data"  element={user ? <LunchDataPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/rain-scene" element={user ? <RainScene user={user} /> : <Navigate to="/" replace />} />
        <Route path="/rain-data"  element={user ? <RainDataPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/rain-problem" element={user ? <RainProblemPage user={user}/> : <Navigate to="/" replace/>}/>
        <Route path="/admin-accounts" element={user && isAdmin(user)? <AdminAccountPage user={user} />: <Navigate to="/" />}/>
        <Route path="/lesson-design" element={<LessonDesign />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;