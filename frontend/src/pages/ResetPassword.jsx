import { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, Save } from 'lucide-react';
import API from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await API.post('/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reset Password</h1>
          <p className="text-xs text-slate-400">Use your reset token to set a new password.</p>
        </div>

        {message && (
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border-l-4 border-indigo-500 text-indigo-800 dark:text-indigo-300 p-3 rounded-xl text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Reset token"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500 text-white font-semibold py-3 rounded-xl transition"
          >
            <span>{loading ? 'Saving...' : 'Set New Password'}</span>
            <Save size={16} />
          </button>
        </form>

        <p className="text-xs text-center text-slate-500">
          Back to{' '}
          <Link to="/login" className="taskflow-link font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
