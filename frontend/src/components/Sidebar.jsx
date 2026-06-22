import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, BarChart3, Settings, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { setProjects, setCurrentProject } from '../redux/projectSlice';
import API from '../services/api';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { projects, currentProject } = useSelector((state) => state.projects);

  // Fetch projects on load
  useEffect(() => {
    if (user) {
      API.get('/projects')
        .then((res) => {
          dispatch(setProjects(res.data));
          // If no active project is set but we have projects, auto-set the first one
          if (res.data.length > 0 && !currentProject) {
            dispatch(setCurrentProject(res.data[0]));
          }
        })
        .catch((err) => console.error('Failed to fetch projects:', err));
    }
  }, [user, dispatch, currentProject]);

  const handleProjectSelect = (project) => {
    dispatch(setCurrentProject(project));
    // If user is currently on board or analytics, stay on same view but change param
    if (location.pathname.startsWith('/board/')) {
      navigate(`/board/${project._id}`);
    } else if (location.pathname.startsWith('/analytics/')) {
      navigate(`/analytics/${project._id}`);
    } else {
      navigate(`/board/${project._id}`);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, disabled: false },
    { name: 'Projects', path: '/projects', icon: FolderKanban, disabled: false },
    { 
      name: 'Active Board', 
      path: currentProject ? `/board/${currentProject._id}` : '#', 
      icon: Briefcase,
      disabled: !currentProject 
    },
    { 
      name: 'Analytics', 
      path: currentProject ? `/analytics/${currentProject._id}` : '#', 
      icon: BarChart3,
      disabled: !currentProject 
    },
    { name: 'Settings', path: '/settings', icon: Settings, disabled: false }
  ];

  return (
    <aside className={`relative h-screen bg-slate-900 text-slate-350 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-50 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Sidebar Header / Branding */}
      <div>
        <div className={`p-6 flex items-center justify-between border-b border-slate-800/80 ${
          collapsed ? 'justify-center' : ''
        }`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 font-bold text-white text-lg">
                T
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                TaskFlow <span className="text-brand-500">Pro</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
              T
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm text-slate-600 dark:text-slate-600 cursor-not-allowed"
                  title="Select a project first"
                >
                  <Icon size={20} />
                  {!collapsed && <span>{item.name}</span>}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/15'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Project Switcher section */}
        {!collapsed && projects.length > 0 && (
          <div className="mt-8 px-6">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              My Projects
            </h4>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {projects.map((proj) => (
                <button
                  key={proj._id}
                  onClick={() => handleProjectSelect(proj)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2.5 transition truncate ${
                    currentProject?._id === proj._id
                      ? 'bg-slate-800 text-white font-semibold border-l-2 border-brand-500'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    proj.priority === 'critical' ? 'bg-rose-500' :
                    proj.priority === 'high' ? 'bg-amber-500' :
                    proj.priority === 'medium' ? 'bg-indigo-500' :
                    'bg-emerald-500'
                  }`} />
                  <span className="truncate">{proj.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer / User role info & Collapse trigger */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700 text-xs truncate capitalize">
              {user?.role.substring(0, 2)}
            </div>
            <div className="text-left text-xs truncate max-w-[120px]">
              <p className="font-semibold text-slate-200 truncate">{user?.name}</p>
              <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 transition mx-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
