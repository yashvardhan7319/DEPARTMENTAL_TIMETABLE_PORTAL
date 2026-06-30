import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });

// Always attach JWT token from localStorage on every request
API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('tt_user'));
    if (user?.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
  } catch {}
  return config;
});

// Auth
export const loginApi    = (data) => API.post('/auth/login', data);
export const registerApi = (data) => API.post('/auth/register', data);

// Schedules
export const getSchedules      = (program) => API.get('/schedules', { params: program ? { program } : {} });
export const getFacultySchedule= () => API.get('/schedules');
export const uploadCsv         = (file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post('/schedules/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const createSchedule    = (data) => API.post('/schedules', data);
export const updateSchedule    = (id, data) => API.put(`/schedules/${id}`, data);
export const deleteSchedule    = (id) => API.delete(`/schedules/${id}`);

// Admin — users
export const getStudents     = () => API.get('/admin/students');
export const getFacultyList  = () => API.get('/admin/faculty');
export const createFaculty   = (data) => API.post('/admin/faculty', data);
export const updateUser      = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteUser      = (id) => API.delete(`/admin/users/${id}`);

export default API;
