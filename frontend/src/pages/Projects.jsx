import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, Trash2, Sparkles, CheckSquare, Loader2 } from 'lucide-react';
import { addProject, setCurrentProject, deleteProjectFromList } from '../redux/projectSlice';
import API from '../services/api';

const Projects = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);

  const [usersList, setUsersList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // AI Sprint Planner states
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintProject, setSprintProject] = useState(null);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [generatingSprint, setGeneratingSprint] = useState(false);
  const [importingSprint, setImportingSprint] = useState(false);

  useEffect(() => {
    // Fetch users list for multi-select
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      API.get('/auth/users')
        .then((res) => setUsersList(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  const handleMemberToggle = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((mId) => mId !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await API.post('/projects', {
        name,
        description,
        startDate,
        endDate,
        priority,
        members: selectedMembers
      });

      dispatch(addProject(res.data));
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project and all its tasks? This action is permanent.')) return;

    try {
      await API.delete(`/projects/${id}`);
      dispatch(deleteProjectFromList(id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setPriority('medium');
    setSelectedMembers([]);
  };

  const handleProjectSelect = (project) => {
    dispatch(setCurrentProject(project));
    navigate(`/board/${project._id}`);
  };

  // AI Sprint planner functions
  const openSprintPlanner = (project, e) => {
    e.stopPropagation();
    setSprintProject(project);
    setSprintTasks([]);
    setShowSprintModal(true);
  };

  const triggerAISprintPlan = async () => {
    if (!sprintProject) return;
    setGeneratingSprint(true);
    try {
      const res = await API.post('/ai/sprint-plan', {
        projectName: sprintProject.name,
        projectDescription: sprintProject.description || 'Sprint tasks development'
      });
      setSprintTasks(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate AI sprint tasks');
    } finally {
      setGeneratingSprint(false);
    }
  };

  const importSprintTasks = async () => {
    if (!sprintProject || sprintTasks.length === 0) return;
    setImportingSprint(true);
    try {
      // Loop and create each task in the database
      for (const task of sprintTasks) {
        // Set due date to 7 days from now by default
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (task.durationDays || 4));

        await API.post('/tasks', {
          title: task.title,
          description: task.description,
          projectId: sprintProject._id,
          priority: task.priority || 'medium',
          status: task.status || 'todo',
          dueDate: dueDate.toISOString()
        });
      }
      alert(`Successfully imported ${sprintTasks.length} tasks into "${sprintProject.name}" board!`);
      setShowSprintModal(false);
      navigate(`/board/${sprintProject._id}`);
    } catch (err) {
      console.error(err);
      alert('Error importing tasks');
    } finally {
      setImportingSprint(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white my-0">Projects Workspace</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your project spaces, team directories, and run AI sprint plans.
          </p>
        </div>

        {/* Create project button (Visible only for admin and manager roles) */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj._id}
            onClick={() => handleProjectSelect(proj)}
            className="glass-card p-6 rounded-2xl shadow-sm hover:shadow-xl transition duration-200 border border-slate-200/80 dark:border-slate-850 cursor-pointer flex flex-col justify-between h-56 text-left group"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  proj.priority === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                  proj.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  proj.priority === 'medium' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {proj.priority} Priority
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                  <button
                    onClick={(e) => openSprintPlanner(proj, e)}
                    title="AI Sprint Planner"
                    className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg transition"
                  >
                    <Sparkles size={14} />
                  </button>
                  {(user?.role === 'admin' || proj.createdBy?._id === user?._id) && (
                    <button
                      onClick={(e) => handleDeleteProject(proj._id, e)}
                      title="Delete Project"
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-3 leading-tight truncate group-hover:text-brand-500 transition">
                {proj.name}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {proj.description || 'No description provided.'}
              </p>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-850 pt-3 mt-4 flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar size={13} />
                <span>Deadline: {new Date(proj.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                <span>{proj.members?.length || 0} Members</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Create New Project</h3>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E-Commerce Redesign"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain goals, timelines, and deliverables..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">End Date (Deadline)</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-650 dark:text-slate-400">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Members Selection list */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-650 dark:text-slate-400 block mb-1">Add Team Members</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1.5 bg-slate-50 dark:bg-slate-950">
                  {usersList.length === 0 ? (
                    <p className="text-xs text-slate-450 p-2 text-center">No other workspace users found</p>
                  ) : (
                    usersList.map((usr) => (
                      <div
                        key={usr._id}
                        onClick={() => handleMemberToggle(usr._id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                          selectedMembers.includes(usr._id)
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-650 dark:text-brand-400 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={usr.avatar} alt="" className="w-5 h-5 rounded-full" />
                          <span>{usr.name} ({usr.role})</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(usr._id)}
                          onChange={() => {}} // Controlled via row click
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 pointer-events-none"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold transition cursor-pointer text-slate-650 dark:text-slate-355"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-brand-500/10 cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI SPRINT PLANNER MODAL */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Sparkles size={20} />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">AI Sprint Planner</h3>
              </div>
              <button 
                onClick={() => setShowSprintModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate structured sprint items automatically based on your project description. You can preview details and import them with one click.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-850/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Project Context</span>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">{sprintProject?.name}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sprintProject?.description}</p>
            </div>

            {/* Tasks generated indicator */}
            {sprintTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                <button
                  onClick={triggerAISprintPlan}
                  disabled={generatingSprint}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white text-xs font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-75 cursor-pointer"
                >
                  {generatingSprint ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating Tasks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Run AI Sprint Generation</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400">This takes 2-4 seconds using the NLP classification model</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-400">Generated Sprint Backlog ({sprintTasks.length})</span>
                  <button
                    onClick={importSprintTasks}
                    disabled={importingSprint}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    {importingSprint ? <Loader2 size={13} className="animate-spin" /> : <CheckSquare size={13} />}
                    <span>Import All Tasks</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {sprintTasks.map((tk, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-200">{tk.title}</h5>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            tk.priority === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' :
                            tk.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30'
                          }`}>
                            {tk.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Est: {tk.durationDays}d</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{tk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
