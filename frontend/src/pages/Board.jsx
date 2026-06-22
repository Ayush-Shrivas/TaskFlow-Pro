import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Search, User, Paperclip, MessageSquare, Clock, 
  Sparkles, Calendar, Trash2, ExternalLink
} from 'lucide-react';
import { 
  setTasks, addTask, updateTaskInList, deleteTaskFromList, 
  updateTaskStatusOptimistic, setSearchQuery, setFilter, clearFilters 
} from '../redux/taskSlice';
import { setCurrentProject } from '../redux/projectSlice';
import API from '../services/api';

const Board = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state) => state.projects);
  const { tasks, searchQuery, filters } = useSelector((state) => state.tasks);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTaskDetails, setActiveTaskDetails] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  
  // Create task form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [suggestingPriority, setSuggestingPriority] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  // Drawer comment states
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Drawer attachments states
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);

  // Fetch project and tasks
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        // Hydrate project context if not present (e.g. on direct page reload)
        if (!currentProject || currentProject._id !== projectId) {
          const projRes = await API.get(`/projects/${projectId}`);
          dispatch(setCurrentProject(projRes.data));
        }

        const tasksRes = await API.get(`/tasks?projectId=${projectId}`);
        dispatch(setTasks(tasksRes.data));
      } catch (err) {
        console.error('Failed to load board details:', err);
      }
    };
    if (projectId) {
      loadBoardData();
    }
  }, [projectId, dispatch, currentProject]);

  const loadComments = async (taskId) => {
    setLoadingComments(true);
    try {
      const res = await API.get(`/comments/${taskId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  // NATIVE DRAG & DROP HANDLERS
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    if (draggedOverColumn !== columnStatus) {
      setDraggedOverColumn(columnStatus);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Check if task exists and if its status is already targetStatus
    const originalTask = tasks.find((t) => t._id === taskId);
    if (!originalTask || originalTask.status === targetStatus) return;

    // Perform instant optimistic update in Redux store
    dispatch(updateTaskStatusOptimistic({ taskId, status: targetStatus }));

    try {
      // Send updates to API
      const res = await API.put(`/tasks/${taskId}`, { status: targetStatus });
      dispatch(updateTaskInList(res.data));
      
      // If drawer is open for this task, sync details
      if (activeTaskDetails && activeTaskDetails._id === taskId) {
        setActiveTaskDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert status on API error by reloading all project tasks
      const tasksRes = await API.get(`/tasks?projectId=${projectId}`);
      dispatch(setTasks(tasksRes.data));
    }
  };

  // CREATE TASK API CALL
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;

    setCreatingTask(true);
    try {
      const res = await API.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        projectId,
        priority: taskPriority,
        dueDate: new Date(taskDueDate).toISOString(),
        assignedTo: taskAssignee || null
      });

      dispatch(addTask(res.data));
      setShowCreateModal(false);
      resetTaskForm();
    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  // AI TASK PRIORITIZATION CALL
  const getAIPriority = async () => {
    if (!taskTitle) return alert('Please enter at least a task title for AI prioritization.');
    
    setSuggestingPriority(true);
    try {
      const res = await API.post('/ai/prioritize', {
        title: taskTitle,
        description: taskDesc
      });
      setTaskPriority(res.data.priority);
    } catch (err) {
      console.error(err);
      alert('AI prioritization service unavailable');
    } finally {
      setSuggestingPriority(false);
    }
  };

  // ADD COMMENT API CALL
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await API.post('/comments', {
        taskId: activeTaskDetails._id,
        message: newComment
      });
      setComments([...comments, res.data]);
      setNewComment('');
      
      const taskRes = await API.get(`/tasks?projectId=${projectId}`);
      dispatch(setTasks(taskRes.data));
      setActiveTaskDetails(taskRes.data.find(t => t._id === activeTaskDetails._id));
    } catch (err) {
      console.error(err);
    }
  };

  // UPLOAD ATTACHMENT MOCK CALL
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentName || !attachmentUrl) return;

    try {
      const res = await API.post(`/tasks/${activeTaskDetails._id}/attachments`, {
        name: attachmentName,
        url: attachmentUrl
      });
      setActiveTaskDetails(res.data);
      dispatch(updateTaskInList(res.data));
      setAttachmentName('');
      setAttachmentUrl('');
      setShowAttachmentForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE TASK
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      dispatch(deleteTaskFromList(taskId));
      setActiveTaskDetails(null);
    } catch (err) {
      console.error(err);
    }
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setTaskAssignee('');
  };

  // FILTERING LOGIC
  const filteredTasks = tasks.filter((task) => {
    // 1. Search Query Match
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Priority Filter Match
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    
    // 3. Assignee Filter Match
    const matchesAssignee = 
      filters.assignee === 'all' || 
      (filters.assignee === 'unassigned' && !task.assignedTo) ||
      (task.assignedTo && task.assignedTo._id === filters.assignee);

    // 4. Overdue Filter Match
    const matchesOverdue = 
      filters.dueDate === 'all' || 
      (filters.dueDate === 'overdue' && task.status !== 'done' && new Date(task.dueDate) < new Date());

    return matchesSearch && matchesPriority && matchesAssignee && matchesOverdue;
  });

  // Organize tasks by columns
  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
    { id: 'todo', title: 'To Do', color: 'bg-indigo-50/40 dark:bg-indigo-950/5 border-indigo-100 dark:border-indigo-950/20' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-amber-50/40 dark:bg-amber-950/5 border-amber-100 dark:border-amber-950/20' },
    { id: 'testing', title: 'Testing', color: 'bg-blue-50/40 dark:bg-blue-950/5 border-blue-100 dark:border-blue-950/20' },
    { id: 'done', title: 'Done', color: 'bg-emerald-50/40 dark:bg-emerald-950/5 border-emerald-100 dark:border-emerald-950/20' }
  ];

  return (
    <div className="h-full flex flex-col space-y-6 text-left">
      
      {/* Top action details bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white my-0">
            {currentProject?.name || 'Project Board'}
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Drag cards between columns to update status, click cards to open details and timeline.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Task</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-250 dark:border-slate-850">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search by task title..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-850 dark:text-slate-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => dispatch(setFilter({ priority: e.target.value }))}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filters.assignee}
            onChange={(e) => dispatch(setFilter({ assignee: e.target.value }))}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned Only</option>
            {currentProject?.members?.map((mem) => (
              <option key={mem._id} value={mem._id}>{mem.name}</option>
            ))}
          </select>

          {/* Due date filter */}
          <select
            value={filters.dueDate}
            onChange={(e) => dispatch(setFilter({ dueDate: e.target.value }))}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue Tasks</option>
          </select>

          <button
            onClick={() => dispatch(clearFilters())}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-y-auto pb-8">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = draggedOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border flex flex-col max-h-[75vh] p-3 transition duration-150 ${col.color} ${
                isOver ? 'drag-over-column' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List inside Column */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-20 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-center text-[10px] text-slate-400">
                    Empty Column
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue = task.status !== 'done' && new Date(task.dueDate) < new Date();
                    
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => {
                          setActiveTaskDetails(task);
                          loadComments(task._id);
                        }}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer select-none text-left space-y-3 relative group"
                      >
                        {/* Task Priority Indicator */}
                        <div className="flex justify-between items-center">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            task.priority === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-450' :
                            task.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-450' :
                            task.priority === 'medium' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-450'
                          }`}>
                            {task.priority}
                          </span>
                          
                          {/* Attachments / comments indicators */}
                          <div className="flex gap-2 text-slate-400">
                            {task.attachments?.length > 0 && (
                              <span className="flex items-center text-[10px] gap-0.5">
                                <Paperclip size={10} />
                                {task.attachments.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Task Title */}
                        <h4 className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Task Footer (Deadline / Assignee) */}
                        <div className="border-t border-slate-100 dark:border-slate-850 pt-2 flex justify-between items-center text-[10px] text-slate-400">
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-medium' : ''}`}>
                            <Calendar size={11} />
                            <span>
                              {isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          
                          {task.assignedTo ? (
                            <img
                              src={task.assignedTo.avatar}
                              alt={task.assignedTo.name}
                              title={`Assigned to ${task.assignedTo.name}`}
                              className="w-5 h-5 rounded-full border border-slate-100 dark:border-slate-800"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400">
                              <User size={10} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Create Task</h3>
              <button 
                onClick={() => { setShowCreateModal(false); resetTaskForm(); }}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Task Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Build dashboard chart components"
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={getAIPriority}
                    disabled={suggestingPriority}
                    title="AI Priority Suggester"
                    className="px-3 bg-violet-650 hover:bg-violet-750 text-white rounded-xl flex items-center justify-center gap-1 transition text-xs font-bold shadow-md shadow-violet-550/10 cursor-pointer disabled:opacity-75"
                  >
                    <Sparkles size={14} />
                    <span>{suggestingPriority ? 'Analyzing...' : 'AI Suggest'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Requirements, criteria, edge cases..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Assign To</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {currentProject?.members?.map((mem) => (
                    <option key={mem._id} value={mem._id}>{mem.name} ({mem.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetTaskForm(); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold transition cursor-pointer text-slate-650 dark:text-slate-355"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-brand-500/10 cursor-pointer"
                >
                  {creatingTask ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS SIDE PANEL DRAWER */}
      {activeTaskDetails && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in bg-slate-950/40 backdrop-blur-xs">
          {/* Backdrop exit clickable space */}
          <div className="flex-1" onClick={() => setActiveTaskDetails(null)} />

          {/* Drawer Body */}
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between shadow-2xl p-6 overflow-hidden animate-slide-in">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Task Details</span>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mt-1 max-w-[450px]">
                  {activeTaskDetails.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/tasks/${activeTaskDetails._id}`)}
                  title="Open full task page"
                  className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 rounded-lg transition"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTask(activeTaskDetails._id)}
                  title="Delete Task"
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setActiveTaskDetails(null)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Details Content Container */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 mt-4">
              
              {/* Task Meta details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl text-xs border border-slate-100 dark:border-slate-850">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span className="capitalize block font-semibold text-slate-755 dark:text-slate-200 mt-0.5">
                    {activeTaskDetails.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Priority</span>
                  <span className="capitalize block font-semibold text-slate-755 dark:text-slate-200 mt-0.5">
                    {activeTaskDetails.priority}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Assignee</span>
                  <span className="block font-semibold text-slate-755 dark:text-slate-200 mt-0.5">
                    {activeTaskDetails.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Due Date</span>
                  <span className="block font-semibold text-slate-755 dark:text-slate-200 mt-0.5">
                    {new Date(activeTaskDetails.dueDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 text-xs md:text-sm text-left">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Requirements & Description</h4>
                <p className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl text-slate-650 dark:text-slate-350 leading-relaxed">
                  {activeTaskDetails.description || 'No description provided.'}
                </p>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3 text-xs text-left">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Paperclip size={13} /> Attachments ({activeTaskDetails.attachments?.length || 0})
                  </h4>
                  <button 
                    onClick={() => setShowAttachmentForm(!showAttachmentForm)}
                    className="text-brand-500 font-semibold hover:underline"
                  >
                    + Add Link
                  </button>
                </div>

                {showAttachmentForm && (
                  <form onSubmit={handleAddAttachment} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl space-y-2 animate-fade-in">
                    <input
                      type="text"
                      required
                      placeholder="Attachment label (e.g. Wireframe mockup)"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                    />
                    <input
                      type="url"
                      required
                      placeholder="Attachment URL (e.g. https://figma.com/...)"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowAttachmentForm(false)} 
                        className="px-2.5 py-1 text-[10px] border border-slate-200 dark:border-slate-800 rounded-md"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-2.5 py-1 text-[10px] bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1.5">
                  {activeTaskDetails.attachments?.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No attachments uploaded.</p>
                  ) : (
                    activeTaskDetails.attachments?.map((at, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl flex justify-between items-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{at.name}</span>
                        <a 
                          href={at.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-brand-500 font-medium hover:underline text-[10px] truncate max-w-[200px]"
                        >
                          View Link ↗
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comments Thread Section */}
              <div className="space-y-3 text-xs text-left border-t border-slate-100 dark:border-slate-850 pt-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MessageSquare size={13} /> Discussion Thread
                </h4>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
                  />
                  <button 
                    type="submit" 
                    className="px-3 bg-brand-650 hover:bg-brand-750 text-white font-semibold rounded-xl text-[11px] transition shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Post
                  </button>
                </form>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {loadingComments ? (
                    <div className="text-center py-4 text-[10px] text-slate-400">Loading discussion...</div>
                  ) : comments.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] py-2">No comments posted yet.</p>
                  ) : (
                    comments.map((cm) => (
                      <div key={cm._id} className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/10">
                        <img src={cm.userId?.avatar} alt="" className="w-6 h-6 rounded-full bg-slate-200" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] text-slate-700 dark:text-slate-350">{cm.userId?.name}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(cm.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">{cm.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Timeline logs */}
              <div className="space-y-3 text-xs text-left border-t border-slate-100 dark:border-slate-850 pt-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock size={13} /> Activity History
                </h4>
                
                <div className="space-y-3 border-l border-slate-200 dark:border-slate-800 ml-2.5 pl-4 relative">
                  {activeTaskDetails.history?.map((hist, idx) => (
                    <div key={idx} className="relative text-[11px] space-y-0.5 text-left">
                      {/* Timeline dot */}
                      <span className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                      
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">{hist.performedBy?.name}</strong> {hist.action}
                      </p>
                      <span className="text-[9px] text-slate-400 block">
                        {new Date(hist.timestamp).toLocaleDateString()} at {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Board;
