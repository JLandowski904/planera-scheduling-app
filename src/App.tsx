import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from './lib/simpleRouter';
import Login from './pages/Login';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import { authAPI } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const validate = async () => {
      try {
        await authAPI.getMe();
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('auth check failed; falling back to local session', error);
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/projects" /> : <Login />}
        />
        <Route 
          path="/projects" 
          element={isAuthenticated ? <Projects /> : <Navigate to="/" />}
        />
        <Route 
          path="/project/:projectId" 
          element={isAuthenticated ? <ProjectView /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
