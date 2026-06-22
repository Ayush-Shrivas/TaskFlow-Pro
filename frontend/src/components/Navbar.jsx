import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, CheckCheck, User, Settings, FolderKanban, ChevronDown } from 'lucide-react';
import { logout } from '../redux/authSlice';
import { setNotifications, markRead, markAllRead } from '../redux/notificationSlice';
import API from '../services/api';

const Navbar = ({ toggleSidebar, dark, setDark }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const { currentProject } = useSelector((state) => state.projects);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      API.get('/notifications')
        .then((res) => {
          dispatch(setNotifications(res.data));
        })
        .catch((err) => console.error('Failed to fetch notifications:', err));
    }
  }, [user, dispatch]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/notifications/${id}/read`);
      dispatch(markRead(id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      dispatch(markAllRead());
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = !dark;
    setDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
        >
          <FolderKanban size={22} className="text-brand-500" />
        </button>
        {currentProject && (
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Projects</span>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
              {currentProject.name}
            </span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ml-2 ${
              currentProject.priority === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
              currentProject.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              currentProject.priority === 'medium' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {currentProject.priority}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl border border-slate-200/80 dark:border-slate-850 shadow-2xl p-4 animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2 mb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-brand-500 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={(e) => !n.isRead && handleMarkAsRead(n._id, e)}
                      className={`p-2.5 rounded-xl text-xs transition cursor-pointer flex gap-2 items-start ${
                        n.isRead 
                          ? 'bg-transparent text-slate-500 dark:text-slate-400' 
                          : 'bg-brand-50/50 dark:bg-brand-900/10 border-l-2 border-brand-500 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n._id, e)}
                          className="p-1 hover:bg-brand-100 dark:hover:bg-brand-900/20 text-brand-500 rounded-md transition"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-7 h-7 rounded-full bg-slate-200"
            />
            <div className="hidden sm:block text-left text-xs pr-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-3">{user?.name}</p>
              <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 glass-card rounded-2xl border border-slate-200/80 dark:border-slate-850 shadow-2xl p-2 animate-fade-in text-left">
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <User size={16} /> Profile Settings
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Settings size={16} /> API Integration
              </Link>
              <hr className="my-1 border-slate-100 dark:border-slate-800" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition text-left"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
