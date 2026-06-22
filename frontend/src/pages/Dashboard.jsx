import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  Hourglass, 
  Users, 
  Sparkles, 
  ArrowRight,
  TrendingUp, 
  FileWarning 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import API from '../services/api';
import { setProjects } from '../redux/projectSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects, currentProject } = useSelector((state) => state.projects);
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    teamSize: 0,
    overdueTasks: 0
  });

  const [statusDistribution, setStatusDistribution] = useState([]);
  const [userContribution, setUserContribution] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Refresh projects list
        const projRes = await API.get('/projects');
        dispatch(setProjects(projRes.data));

        if (projRes.data.length > 0) {
          // If there is no current project, default to first
          const activeProj = currentProject || projRes.data[0];
          
          // Get all tasks for this project to calculate stats
          const tasksRes = await API.get(`/tasks?projectId=${activeProj._id}`);
          const tasks = tasksRes.data;

          const active = tasks.filter(t => t.status !== 'done').length;
          const completed = tasks.filter(t => t.status === 'done').length;
          const overdue = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length;
          
          setStats({
            activeTasks: active,
            completedTasks: completed,
            teamSize: activeProj.members?.length || 0,
            overdueTasks: overdue
          });

          // 1. Status distribution for charts
          const statuses = ['backlog', 'todo', 'in_progress', 'testing', 'done'];
          const counts = statuses.reduce((acc, status) => {
            acc[status] = tasks.filter(t => t.status === status).length;
            return acc;
          }, {});

          setStatusDistribution([
            { name: 'Backlog', value: counts.backlog, color: '#64748b' },
            { name: 'To Do', value: counts.todo, color: '#6366f1' },
            { name: 'In Progress', value: counts.in_progress, color: '#f59e0b' },
            { name: 'Testing', value: counts.testing, color: '#3b82f6' },
            { name: 'Done', value: counts.done, color: '#10b981' }
          ]);

          // 2. User contributions chart
          const userTaskCounts = {};
          tasks.forEach(task => {
            if (task.assignedTo && task.status === 'done') {
              const uName = task.assignedTo.name;
              userTaskCounts[uName] = (userTaskCounts[uName] || 0) + 1;
            }
          });

          const contributionData = Object.keys(userTaskCounts).map(name => ({
            name,
            completed: userTaskCounts[name]
          }));
          setUserContribution(contributionData.length > 0 ? contributionData : [{ name: 'No Data', completed: 0 }]);
        }
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, currentProject, dispatch]);

  const generateReport = async () => {
    const activeProj = currentProject || projects[0];
    if (!activeProj) return;

    setGeneratingSummary(true);
    setAiSummary('');
    try {
      const res = await API.get(`/ai/project-summary/${activeProj._id}`);
      setAiSummary(res.data.summaryText);
    } catch {
      setAiSummary('Failed to generate AI weekly report. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
        <div className="p-6 bg-brand-50 dark:bg-brand-900/10 rounded-full text-brand-500">
          <FolderKanban size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No Projects Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create your first project workspace to unlock the task boards, real-time collaboration, and AI summary modules.
          </p>
        </div>
        <Link 
          to="/projects" 
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition shadow-lg shadow-brand-500/10 flex items-center gap-2"
        >
          <span>Get Started</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const activeProj = currentProject || projects[0];
  const totalTasks = stats.activeTasks + stats.completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
    { name: 'Pending', value: stats.activeTasks, color: '#6366f1' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white my-0">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's a breakdown of the workspace health for <strong className="text-slate-800 dark:text-slate-200">"{activeProj.name}"</strong>
          </p>
        </div>

        {/* AI summary button */}
        <button
          onClick={generateReport}
          disabled={generatingSummary}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-750 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 cursor-pointer disabled:opacity-75"
        >
          <Sparkles size={15} />
          {generatingSummary ? 'Analyzing Workspace...' : 'Generate AI Weekly Summary'}
        </button>
      </div>

      {/* AI summary text display block */}
      {aiSummary && (
        <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl relative animate-fade-in text-left">
          <button 
            onClick={() => setAiSummary('')} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 mb-3 text-sm font-bold text-indigo-700 dark:text-indigo-400">
            <Sparkles size={16} />
            <span>AI-Generated Health Report</span>
          </div>
          <div className="prose dark:prose-invert text-xs md:text-sm text-slate-700 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Projects Card */}
        <div className="glass-card p-5 rounded-2xl shadow-sm text-left flex items-start gap-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/10 text-brand-500 rounded-xl">
            <FolderKanban size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Total Projects</span>
            <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 block mt-1">
              {projects.length}
            </span>
          </div>
        </div>

        {/* Active Tasks Card */}
        <div className="glass-card p-5 rounded-2xl shadow-sm text-left flex items-start gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-500 rounded-xl">
            <Hourglass size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Active Tasks</span>
            <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 block mt-1">
              {stats.activeTasks}
            </span>
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div className="glass-card p-5 rounded-2xl shadow-sm text-left flex items-start gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Completed Tasks</span>
            <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 block mt-1">
              {stats.completedTasks}
            </span>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="glass-card p-5 rounded-2xl shadow-sm text-left flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Team Members</span>
            <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 block mt-1">
              {stats.teamSize}
            </span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Progress Circle (PieChart) */}
        <div className="lg:col-span-1 glass-card p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 self-start">Project Completion Rate</h3>
          {totalTasks === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">No tasks created yet</div>
          ) : (
            <div className="relative w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Tasks`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">{progressPercent}%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Done</span>
              </div>
            </div>
          )}
          <div className="flex gap-4 text-xs mt-4">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Done ({stats.completedTasks})</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-500">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Pending ({stats.activeTasks})</span>
            </div>
          </div>
        </div>

        {/* Task Status Distribution (BarChart) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm text-left">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Task Status Distribution</h3>
          {totalTasks === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">No tasks created yet</div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(139, 92, 246, 0.04)' }} />
                  <Bar dataKey="value" name="Tasks Count" radius={[4, 4, 0, 0]}>
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity / Task completed per User (LineChart/BarChart) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm text-left">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Team Productivity (Tasks Completed)</h3>
          {stats.completedTasks === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">No tasks completed yet</div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userContribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completed" name="Completed Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Project Health Alerts Panel */}
        <div className="lg:col-span-1 glass-card p-6 rounded-2xl shadow-sm text-left">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 flex items-center gap-1.5">
            <FileWarning size={16} className="text-amber-500" />
            <span>Workspace Alerts</span>
          </h3>
          
          <div className="space-y-4">
            {stats.overdueTasks > 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-xl flex items-start gap-3">
                <span className="text-lg">🚨</span>
                <div>
                  <h4 className="text-xs font-semibold text-rose-800 dark:text-rose-400">Overdue Tasks Detected</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    There are {stats.overdueTasks} active tasks past their target end date. Check active board to review schedule risk.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border-l-4 border-emerald-500 rounded-xl flex items-start gap-3">
                <span className="text-lg">✅</span>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Schedule on track</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    No active tasks are currently overdue. Keep up the high velocity!
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border-l-4 border-indigo-500 rounded-xl">
              <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 flex items-center gap-1">
                <TrendingUp size={12} strokeWidth={2.5} /> Velocity
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Current completion rate of <strong>{progressPercent}%</strong> has been recorded. Complete active tasks in progress to improve sprint output.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
