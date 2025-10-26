import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from './lib/simpleRouter';
import Login from './pages/Login';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import { supabase } from './services/supabase';
import './App.css';

const getHasToken = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(localStorage.getItem('authToken'));
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getHasToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.warn('auth check failed', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    validate();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setIsAuthenticated(!!session);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleAuthChanged = (event: Event) => {
      const custom = event as CustomEvent<{ isAuthenticated?: boolean }>;
      if (typeof custom.detail?.isAuthenticated === 'boolean') {
        setIsAuthenticated(custom.detail.isAuthenticated);
        if (loading) {
          setLoading(false);
        }
      } else {
        const hasToken = getHasToken();
        setIsAuthenticated(hasToken);
        if (loading) {
          setLoading(false);
        }
      }
    };

    window.addEventListener('planner:auth-changed', handleAuthChanged);
    return () => {
      window.removeEventListener('planner:auth-changed', handleAuthChanged);
    };
  }, [loading]);

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
