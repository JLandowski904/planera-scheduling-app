import React, { useState, useEffect } from 'react';
import { useNavigate } from '../lib/simpleRouter';
import { LogIn, UserPlus } from 'lucide-react';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const session = await authAPI.getSession();
      if (session) {
        navigate('/projects');
      }
    };
    checkSession();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        const response = await authAPI.signup({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName
        });
        // Supabase handles session storage automatically
        navigate('/projects');
      } else {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        // Supabase handles session storage automatically
        navigate('/projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="ml-3 text-2xl font-bold text-gray-900">Schedule Planner</h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="johndoe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-900 transition"
          >
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

