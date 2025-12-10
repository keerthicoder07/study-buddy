import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Upload, LogOut } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ChatWindow from './components/ChatWindow';
import ProctorSession from './components/ProctorSession';
import Login from './components/Login';
import Signup from './components/Signup';

function NavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className={`glass-panel`} style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
        backgroundColor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'var(--card-bg)',
        transition: 'all 0.3s'
      }}>
        <Icon size={20} color={isActive ? '#fff' : '#94a3b8'} />
        <span style={{ color: isActive ? '#fff' : '#94a3b8', fontWeight: 500 }}>{label}</span>
      </div>
    </Link>
  );
}

function Navigation({ onLogout }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '2rem',
      gap: '1.5rem',
      padding: '1rem',
      flexWrap: 'wrap'
    }}>
      <NavItem to="/" icon={Upload} label="Upload Material" />
      <NavItem to="/study" icon={BookOpen} label="Study Room" />
      <NavItem to="/exam" icon={GraduationCap} label="Exam Hall" />
      <div onClick={onLogout} className="glass-panel" style={{ padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <LogOut size={20} color="#f87171" />
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, auth }) {
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user_id: null,
    username: null,
    session_id: null
  });

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user_id: null, username: null, session_id: null });
  };

  return (
    <Router>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
          <h1 className="animate-float">Study Buddy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            Your AI-Reported Academic Assistant
          </p>
        </header>

        {auth.isAuthenticated && <Navigation onLogout={handleLogout} />}

        <main className="glass-panel" style={{ minHeight: '600px', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <Routes>
            <Route path="/login" element={<Login setAuth={setAuth} />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/" element={
              <ProtectedRoute auth={auth}>
                <FileUpload user_id={auth.user_id} />
              </ProtectedRoute>
            } />
            <Route path="/study" element={
              <ProtectedRoute auth={auth}>
                <ChatWindow session_id={auth.session_id} user_id={auth.user_id} />
              </ProtectedRoute>
            } />
            <Route path="/exam" element={
              <ProtectedRoute auth={auth}>
                <ProctorSession session_id={auth.session_id} />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
