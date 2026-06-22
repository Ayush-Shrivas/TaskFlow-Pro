import { createSlice } from '@reduxjs/toolkit';

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dueDate: 'all'
    }
  },
  reducers: {
    taskStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setTasks: (state, action) => {
      state.loading = false;
      state.tasks = action.payload;
    },
    addTask: (state, action) => {
      state.loading = false;
      state.tasks.unshift(action.payload);
    },
    updateTaskInList: (state, action) => {
      state.loading = false;
      state.tasks = state.tasks.map(t => 
        t._id === action.payload._id ? action.payload : t
      );
    },
    deleteTaskFromList: (state, action) => {
      state.loading = false;
      state.tasks = state.tasks.filter(t => t._id !== action.payload);
    },
    updateTaskStatusOptimistic: (state, action) => {
      const { taskId, status } = action.payload;
      const task = state.tasks.find(t => t._id === taskId);
      if (task) {
        task.status = status;
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.searchQuery = '';
      state.filters = {
        status: 'all',
        priority: 'all',
        assignee: 'all',
        dueDate: 'all'
      };
    },
    taskFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const {
  taskStart,
  setTasks,
  addTask,
  updateTaskInList,
  deleteTaskFromList,
  updateTaskStatusOptimistic,
  setSearchQuery,
  setFilter,
  clearFilters,
  taskFailure
} = taskSlice.actions;

export default taskSlice.reducer;
