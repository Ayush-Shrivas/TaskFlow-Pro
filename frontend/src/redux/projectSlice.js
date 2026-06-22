import { createSlice } from '@reduxjs/toolkit';

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  },
  reducers: {
    projectStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setProjects: (state, action) => {
      state.loading = false;
      state.projects = action.payload;
    },
    setCurrentProject: (state, action) => {
      state.loading = false;
      state.currentProject = action.payload;
    },
    addProject: (state, action) => {
      state.loading = false;
      state.projects.unshift(action.payload);
    },
    updateProjectInList: (state, action) => {
      state.loading = false;
      state.projects = state.projects.map(p => 
        p._id === action.payload._id ? { ...p, ...action.payload } : p
      );
      if (state.currentProject && state.currentProject._id === action.payload._id) {
        state.currentProject = { ...state.currentProject, ...action.payload };
      }
    },
    deleteProjectFromList: (state, action) => {
      state.loading = false;
      state.projects = state.projects.filter(p => p._id !== action.payload);
      if (state.currentProject && state.currentProject._id === action.payload) {
        state.currentProject = null;
      }
    },
    projectFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { 
  projectStart, 
  setProjects, 
  setCurrentProject, 
  addProject, 
  updateProjectInList, 
  deleteProjectFromList, 
  projectFailure 
} = projectSlice.actions;

export default projectSlice.reducer;
