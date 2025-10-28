import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import InterviewSection from "./pages/dashboards/InterviewSection";
import CasualSection from "./pages/dashboards/CasualSection";
import CandidateSection from "./pages/dashboards/CandidateSection";
import Authpage from './pages/login/Authpage';
import { useAuthStore } from './store/useAuthStore';
import Navbar from "./components/Navbar";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  console.log("Auth User:", authUser);

  if (isCheckingAuth) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const RequireAuth = ({ children, roles }) => {
    if (!authUser) return <Navigate to="/login" />;
    if (roles && !roles.includes(authUser.role)) return <Navigate to="/login" />; // unauthorized
    return children;
  };

  return (
    <>
      <Navbar/>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Authpage />} />

      <Route
        path="/casualSection"
        element={
          <RequireAuth roles={["casual"]}>
            <CasualSection />
          </RequireAuth>
        }
        />

      <Route
        path="/interviewSection"
        element={
          <RequireAuth roles={["interview"]}>
            <InterviewSection />
          </RequireAuth>
        }
        />

      <Route
        path="/candidateSection"
        element={
          <RequireAuth roles={["candidate"]}>
            <CandidateSection />
          </RequireAuth>
        }
        />
    </Routes>
        </>
  );
};

export default App;
