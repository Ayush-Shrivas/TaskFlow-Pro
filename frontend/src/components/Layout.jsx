import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { initiateSocketConnection, disconnectSocket, joinProjectRoom, leaveProjectRoom } from '../services/socket';
import { addTask, updateTaskInList, deleteTaskFromList } from '../redux/taskSlice';
import { addNotification } from '../redux/notificationSlice';

const Layout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentProject } = useSelector((state) => state.projects);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');

  function showToastNotification(message) {
    const toastContainer = document.getElementById('global-toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-2xl shadow-2xl flex items-center justify-between border border-slate-800 dark:border-slate-100 animate-slide-in max-w-sm pointer-events-auto';
    toast.innerHTML = `
      <div class="flex-1 mr-3 pr-2 border-r border-slate-800 dark:border-slate-200">${message}</div>
      <button class="text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 transition-colors focus:outline-none" onclick="this.parentElement.remove()">x</button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // Initialize Socket.io connection on mount/login
  useEffect(() => {
    if (user) {
      const socket = initiateSocketConnection(user._id);

      // Listen for task updates
      socket.on('taskCreated', (task) => {
        dispatch(addTask(task));
      });

      socket.on('taskUpdated', (task) => {
        dispatch(updateTaskInList(task));
      });

      socket.on('taskDeleted', (taskId) => {
        dispatch(deleteTaskFromList(taskId));
      });

      // Listen for comments
      socket.on('commentAdded', () => {
        // Comment views fetch fresh thread data on demand.
      });

      // Listen for real-time notifications
      socket.on('notificationReceived', (notification) => {
        dispatch(addNotification(notification));
        showToastNotification(notification.message);
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [user, dispatch]);

  // Sync project room membership when currentProject changes
  useEffect(() => {
    if (currentProject) {
      joinProjectRoom(currentProject._id);
      return () => {
        leaveProjectRoom(currentProject._id);
      };
    }
  }, [currentProject]);

  // Apply dark mode on mount
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  // Simple custom toast renderer
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} dark={dark} setDark={setDark} />

        {/* Dynamic Route Pages */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Fixed Toast Container */}
      <div 
        id="global-toast-container" 
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      />
    </div>
  );
};

export default Layout;
