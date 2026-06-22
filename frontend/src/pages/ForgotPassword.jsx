import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import API from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setResetToken('');

    try {
      const res = await API.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to generate a reset link right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white">
            <Mail size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Forgot Password</h1>
          <p className="text-xs text-slate-400">Generate a reset token for your TaskFlow Pro account.</p>
        </div>

        {message && (
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border-l-4 border-indigo-500 text-indigo-800 dark:text-indigo-300 p-3 rounded-xl text-xs">
            {message}
          </div>
        )}

        {resetToken && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold mb-2">Development reset token</p>
            <p className="break-all">{resetToken}</p>
            <Link to={`/reset-password?token=${resetToken}`} className="taskflow-link inline-block mt-2">
              Open reset screen
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500 text-white font-semibold py-3 rounded-xl transition"
          >
            <span>{loading ? 'Generating...' : 'Generate Reset Token'}</span>
            <Send size={16} />
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

export default ForgotPassword;
