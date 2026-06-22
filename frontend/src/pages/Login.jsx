import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { authStart, authSuccess, authFailure } from '../redux/authSlice';
import { Mail, Lock, LogIn, ShieldCheck, UserCheck } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(authStart());
    try {
      const res = await API.post('/auth/login', { email, password });
      dispatch(authSuccess({ user: res.data, token: res.data.token }));
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(authFailure(errMsg));
    }
  };

  // Demo account quick login
  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-8 space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 font-bold text-white text-2xl">
            T
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome to TaskFlow Pro</h2>
          <p className="text-xs text-slate-400">Mini Jira Project Management Platform</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 text-rose-700 dark:text-rose-400 p-3 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-brand-500/10 cursor-pointer"
          >
            {loading ? 'Logging in...' : (
              <>
                <span>Sign In</span>
                <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-xs text-center text-slate-500">
          <Link to="/forgot-password" className="taskflow-link font-semibold">
            Forgot your password?
          </Link>
        </p>

        {/* Quick Seeding Demo Accounts */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Quick Demo Accounts (Seeded)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@taskflow.pro')}
              className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/10 hover:text-brand-600 dark:hover:text-brand-400 text-[10px] font-semibold text-slate-700 dark:text-slate-350 rounded-xl transition flex flex-col items-center justify-center gap-1 text-center"
            >
              <UserCheck size={12} className="text-indigo-500" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handleQuickLogin('manager@taskflow.pro')}
              className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/10 hover:text-brand-600 dark:hover:text-brand-400 text-[10px] font-semibold text-slate-700 dark:text-slate-350 rounded-xl transition flex flex-col items-center justify-center gap-1 text-center"
            >
              <UserCheck size={12} className="text-amber-500" />
              <span>Manager</span>
            </button>
            <button
              onClick={() => handleQuickLogin('dev@taskflow.pro')}
              className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/10 hover:text-brand-600 dark:hover:text-brand-400 text-[10px] font-semibold text-slate-700 dark:text-slate-350 rounded-xl transition flex flex-col items-center justify-center gap-1 text-center"
            >
              <UserCheck size={12} className="text-emerald-500" />
              <span>Developer</span>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400">Password is "password123" for all demo users</p>
        </div>

      </div>
    </div>
  );
};

export default Login;
