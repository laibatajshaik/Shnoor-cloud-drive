import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/shnoor-logo.png';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8">

        
        <div className="flex justify-center mb-4">
          <img
            src={logo}
            alt="Shnoor International LLC"
            className="w-32 h-32 object-contain"
          />
        </div>

        
        <h1 className="text-3xl font-bold text-center text-gray-900">
          SHNOOR INTERNATIONAL LLC
        </h1>

        
        <p className="text-center text-xl font-semibold text-orange-500 mt-2">
          Cloud · Drive
        </p>

        
        <p className="text-center text-gray-500 mt-5 mb-6">
          {mode === 'login'
            ? 'Welcome back'
            : 'Create your account'}
        </p>

        
        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full Name"
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <p className="text-center text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-semibold transition disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Log In'
              : 'Sign Up'}
          </button>

        </form>

        
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        
        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
          className="flex items-center justify-center border border-gray-300 rounded-lg py-3 text-sm hover:bg-gray-100 transition"
        >
          Continue with Google
        </a>

        
        <p className="text-center text-gray-500 mt-6">
          {mode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}

          <button
            type="button"
            onClick={() =>
              setMode(mode === 'login' ? 'signup' : 'login')
            }
            className="ml-2 text-blue-600 font-semibold hover:underline"
          >
            {mode === 'login'
              ? 'Sign Up'
              : 'Log In'}
          </button>
        </p>

      </div>
    </div>
  );
}