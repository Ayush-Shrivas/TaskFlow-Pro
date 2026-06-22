import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MessageSquare, Paperclip } from 'lucide-react';
import API from '../services/api';

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const taskRes = await API.get(`/tasks/${taskId}`);
        setTask(taskRes.data);
        const commentsRes = await API.get(`/comments/${taskId}`);
        setComments(commentsRes.data);
      } catch (error) {
        console.error('Failed to load task details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await API.post('/comments', {
        taskId,
        message: commentText
      });
      setComments((current) => [...current, res.data]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="taskflow-link text-sm font-semibold flex items-center gap-2">
          <ArrowLeft size={16} /> Go back
        </button>
        <div className="glass-card p-6 rounded-3xl">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Task not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <button onClick={() => navigate(-1)} className="taskflow-link text-sm font-semibold flex items-center gap-2">
        <ArrowLeft size={16} /> Back to workspace
      </button>

      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-850 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-slate-400">Task Details</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{task.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{task.description || 'No description provided.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs min-w-[220px]">
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-3">
              <p className="text-slate-400">Status</p>
              <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{task.status.replace('_', ' ')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-3">
              <p className="text-slate-400">Priority</p>
              <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{task.priority}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-3">
              <p className="text-slate-400">Assignee</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{task.assignedTo?.name || 'Unassigned'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-3">
              <p className="text-slate-400">Due Date</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Paperclip size={16} /> Attachments
            </h2>
            <div className="space-y-3">
              {task.attachments?.length ? task.attachments.map((attachment, index) => (
                <div key={`${attachment.name}-${index}`} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{attachment.name}</p>
                    <p className="text-xs text-slate-400">{attachment.url}</p>
                  </div>
                  <a href={attachment.url} target="_blank" rel="noreferrer" className="taskflow-link text-xs font-semibold">
                    Open
                  </a>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No attachments added yet.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare size={16} /> Comments
            </h2>
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button type="submit" className="px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
                Post
              </button>
            </form>
            <div className="space-y-3">
              {comments.length ? comments.map((comment) => (
                <div key={comment._id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{comment.userId?.name}</p>
                    <p className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{comment.message}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No discussion yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock size={16} /> Activity Log
          </h2>
          <div className="space-y-3">
            {task.history?.map((entry, index) => (
              <div key={`${entry.action}-${index}`} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">{entry.performedBy?.name}</span> {entry.action}
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <Calendar size={12} /> {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TaskDetails;
