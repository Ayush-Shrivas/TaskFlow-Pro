import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Key, User, Sparkles } from 'lucide-react';
import { updateProfile } from '../redux/authSlice';
import API from '../services/api';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // States
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'member');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_key') || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const res = await API.put('/auth/profile', { name, role });
      dispatch(updateProfile(res.data));
      setFeedbackMsg({ type: 'success', text: 'Profile details updated successfully.' });
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to save profile details.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleKeySave = (e) => {
    e.preventDefault();
    setSavingKey(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      if (geminiKey.trim()) {
        localStorage.setItem('gemini_key', geminiKey.trim());
        setFeedbackMsg({ type: 'success', text: 'Gemini API Key saved. Real AI features are now active!' });
      } else {
        localStorage.removeItem('gemini_key');
        setFeedbackMsg({ type: 'success', text: 'API Key cleared. Reverted to local rule-based AI.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update API credentials.' });
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 text-left animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white my-0">Settings</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure profile details, manage theme options, and configure Gemini AI credentials.
        </p>
      </div>

      {/* Global alert feedback */}
      {feedbackMsg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold border-l-4 animate-fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-800 dark:text-rose-400'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Profile Form card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
          <User size={16} className="text-indigo-500" />
          <span>Profile Configuration</span>
        </h3>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Workspace Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100 cursor-pointer"
            >
              <option value="member">Team Member</option>
              <option value="manager">Project Manager</option>
              <option value="admin">Workspace Administrator</option>
            </select>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-brand-500/10 cursor-pointer"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Key Form Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 my-0">
            <Key size={16} className="text-violet-500" />
            <span>AI Service Credentials</span>
          </h3>

          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full flex items-center gap-1 ${
            geminiKey.trim() 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-450' 
              : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <Sparkles size={8} />
            {geminiKey.trim() ? 'Gemini AI Active' : 'Local NLP Active'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          TaskFlow Pro incorporates custom local classification rules for task suggestions. Add your official <strong className="text-slate-800 dark:text-slate-200">Google Gemini API Key</strong> below to unlock full conversational LLM prioritizing, report generations, and sprint plans.
        </p>

        <form onSubmit={handleKeySave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="taskflow-link text-xs font-semibold"
            >
              Get Gemini API Key
            </a>
            
            <button
              type="submit"
              disabled={savingKey}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-750 disabled:bg-violet-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-violet-500/10 cursor-pointer"
            >
              {savingKey ? 'Validating...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Settings;
