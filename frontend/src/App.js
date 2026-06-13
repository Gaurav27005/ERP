import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/shared/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import NotesPage from './pages/NotesPage';
import PlacementPage from './pages/PlacementPage';
import InterviewPage from './pages/InterviewPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import ProfilePage from './pages/ProfilePage';
import NoticePage from './pages/NoticePage';

function Loader() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0d1b4b',flexDirection:'column',gap:14}}>
      <div style={{width:52,height:52,background:'linear-gradient(135deg,#c8960c,#f0b429)',borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:20,color:'#0d1b4b'}}>DYP</div>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'Sora,sans-serif',fontSize:12}}>Loading…</div>
    </div>
  );
}

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="attendance"  element={<AttendancePage />} />
        <Route path="notes"       element={<NotesPage />} />
        <Route path="placements"  element={<PlacementPage />} />
        <Route path="interviews"  element={<InterviewPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="students"    element={<PrivateRoute roles={['admin','faculty','tpo']}><StudentsPage /></PrivateRoute>} />
        <Route path="faculty"     element={<FacultyPage />} />
        <Route path="notices"     element={<NoticePage />} />
        <Route path="profile"     element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition:true, v7_relativeSplatPath:true }}>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style:{ fontFamily:'Sora,sans-serif', fontSize:13, fontWeight:500, borderRadius:8 },
          success:{ iconTheme:{ primary:'#10b981', secondary:'#fff' }, duration:3000 },
          error:{ iconTheme:{ primary:'#ef4444', secondary:'#fff' }, duration:4000 },
        }}/>
      </BrowserRouter>
    </AuthProvider>
  );
}
