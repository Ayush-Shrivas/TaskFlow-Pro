import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { BarChart3, AlertTriangle, ShieldCheck, Brain } from 'lucide-react';
import { setCurrentProject } from '../redux/projectSlice';
import API from '../services/api';

const Analytics = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state) => state.projects);

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  
  // AI Risk detection states
  const [riskReport, setRiskReport] = useState({
    projectRiskFactor: 'Low',
    riskyTasksCount: 0,
    risks: []
  });
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Chart data states
  const [statusChartData, setStatusChartData] = useState([]);
  const [userComparisonData, setUserComparisonData] = useState([]);
  const [timeProgressData, setTimeProgressData] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        if (!currentProject || currentProject._id !== projectId) {
          const projRes = await API.get(`/projects/${projectId}`);
          dispatch(setCurrentProject(projRes.data));
        }

        const tasksRes = await API.get(`/tasks?projectId=${projectId}`);
        const tasksData = tasksRes.data;
        setTasks(tasksData);

        // Process status distribution data
        const statuses = ['backlog', 'todo', 'in_progress', 'testing', 'done'];
        const colors = ['#64748b', '#6366f1', '#f59e0b', '#3b82f6', '#10b981'];
        const statusMap = statuses.map((status, index) => ({
          name: status.toUpperCase().replace('_', ' '),
          value: tasksData.filter(t => t.status === status).length,
          color: colors[index]
        }));
        setStatusChartData(statusMap);

        // Process team members comparison data
        const membersMap = {};
        // Initialize members list from project members to include members even if they have 0 tasks
        if (currentProject) {
          currentProject.members?.forEach(m => {
            membersMap[m.name] = { name: m.name, active: 0, completed: 0 };
          });
        }

        tasksData.forEach(task => {
          if (task.assignedTo) {
            const uName = task.assignedTo.name;
            if (!membersMap[uName]) {
              membersMap[uName] = { name: uName, active: 0, completed: 0 };
            }
            if (task.status === 'done') {
              membersMap[uName].completed += 1;
            } else {
              membersMap[uName].active += 1;
            }
          }
        });
        setUserComparisonData(Object.values(membersMap));

        // Process daily completion data over past 7 days for progress timeline chart
        const pastDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });

        // Initialize timeline
        const timeline = pastDays.map(day => ({ day, completed: 0 }));
        tasksData.forEach(task => {
          if (task.status === 'done') {
            // Find in history when it was moved to done
            const doneHistory = task.history?.find(h => h.action.includes('to "done"'));
            const dateStr = new Date(doneHistory ? doneHistory.timestamp : task.createdAt)
              .toLocaleDateString([], { month: 'short', day: 'numeric' });
            
            const match = timeline.find(t => t.day === dateStr);
            if (match) {
              match.completed += 1;
            }
          }
        });
        setTimeProgressData(timeline);

        // Run AI risk detection
        setLoadingRisk(true);
        const riskRes = await API.get(`/ai/risk-detection/${projectId}`);
        setRiskReport(riskRes.data);
        setLoadingRisk(false);

      } catch (err) {
        console.error('Error compiling project analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalyticsData();
    }
  }, [projectId, dispatch, currentProject]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-8 pb-12 text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white my-0 flex items-center gap-2">
          <BarChart3 className="text-brand-500" />
          <span>Analytics: {currentProject?.name}</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Perform statistical reviews on sprint velocities, resource workloads, and detect planning delays.
        </p>
      </div>

      {/* AI RISK DETECTION PANEL */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-violet-650 dark:text-violet-400 font-bold text-sm">
            <Brain size={18} />
            <span>AI Risk Detection Engine</span>
          </div>
          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed max-w-xl">
            This module evaluates active tasks against current timestamps and milestones. It flags backlog bottlenecks, workload blockages, and tasks requiring rescheduling.
          </p>

          <div className="space-y-2 pt-2 max-h-48 overflow-y-auto pr-1">
            {loadingRisk ? (
              <p className="text-xs text-slate-400 italic">Analyzing risks...</p>
            ) : riskReport.risks?.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <ShieldCheck size={16} />
                <span>Zero schedule risks identified. All active items are properly paced.</span>
              </div>
            ) : (
              riskReport.risks?.map((risk, index) => (
                <div key={index} className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border-l-4 border-rose-500 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle size={15} className="text-rose-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{risk.title}</span>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">{risk.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk meter indicator */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center w-full md:w-56 h-40 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Risk Level</span>
          <span className={`text-3xl font-extrabold uppercase mt-2 ${
            riskReport.projectRiskFactor === 'High' ? 'text-rose-500 animate-pulse' :
            riskReport.projectRiskFactor === 'Medium' ? 'text-amber-500' :
            'text-emerald-500'
          }`}>
            {riskReport.projectRiskFactor}
          </span>
          <span className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 font-medium">
            {riskReport.riskyTasksCount} high-risk tickets
          </span>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution Pie Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/85 dark:border-slate-850">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm mb-4">Task Status Breakdown</h3>
          {totalTasks === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">No data available</div>
          ) : (
            <div className="h-64 w-full flex flex-col md:flex-row items-center gap-4">
              <div className="h-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="value"
                    >
                      {statusChartData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Tasks`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs w-full md:w-36">
                {statusChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Velocity Line Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/85 dark:border-slate-850">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm mb-4">Task Resolution Velocity (Past 7 Days)</h3>
          {completedTasksCount === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">No task completion records found</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeProgressData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" name="Resolved Tasks" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* User Comparison workload Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200/85 dark:border-slate-850">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm mb-4">Resource Workload & Completion Ratios</h3>
          {totalTasks === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">No team data to compile</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />
                  <Bar dataKey="active" name="Active Tickets" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completed" name="Resolved Tickets" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Analytics;
