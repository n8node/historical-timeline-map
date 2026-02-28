import axios from 'axios';
import type {
  PersonMap, Person, PersonListResponse, Era, PersonYearRange, Stats, TokenResponse, WelcomeSettings,
} from '../types';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Public ──

export const getPersonsByYear = (year: number) =>
  api.get<PersonMap[]>('/persons', { params: { year } }).then((r) => r.data);

export const getPersonDetail = (id: string) =>
  api.get<Person>(`/persons/${id}`).then((r) => r.data);

export const getEras = () =>
  api.get<Era[]>('/timeline/eras').then((r) => r.data);

export const getPersonMarkers = () =>
  api.get<PersonYearRange[]>('/timeline/person-markers').then((r) => r.data);

export const getWelcomeSettings = () =>
  api.get<WelcomeSettings>('/settings/welcome').then((r) => r.data);

// ── Auth ──

export const login = (email: string, password: string) =>
  api.post<TokenResponse>('/auth/login', { email, password }).then((r) => {
    localStorage.setItem('token', r.data.access_token);
    return r.data;
  });

export const logout = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => !!localStorage.getItem('token');

// ── Admin Persons ──

export const adminListPersons = (params: {
  page?: number;
  per_page?: number;
  search?: string;
  era?: string;
}) =>
  api.get<PersonListResponse>('/admin/persons', { params }).then((r) => r.data);

export const adminGetPerson = (id: string) =>
  api.get<Person>(`/admin/persons/${id}`).then((r) => r.data);

export const adminCreatePerson = (data: Record<string, unknown>) =>
  api.post<Person>('/admin/persons', data).then((r) => r.data);

export const adminUpdatePerson = (id: string, data: Record<string, unknown>) =>
  api.put<Person>(`/admin/persons/${id}`, data).then((r) => r.data);

export const adminDeletePerson = (id: string) =>
  api.delete(`/admin/persons/${id}`);

// ── Admin Photos ──

export const adminAddPhoto = (personId: string, data: { photo_url: string; caption?: string; display_order?: number }) =>
  api.post<Person>(`/admin/persons/${personId}/photos`, data).then((r) => r.data);

export const adminDeletePhoto = (personId: string, photoId: string) =>
  api.delete(`/admin/persons/${personId}/photos/${photoId}`);

// ── Upload ──

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<{ url: string; filename: string }>('/admin/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

// ── Admin Settings ──

export const adminGetWelcome = () =>
  api.get<WelcomeSettings>('/admin/settings/welcome').then((r) => r.data);

export const adminUpdateWelcome = (data: Partial<WelcomeSettings>) =>
  api.put<WelcomeSettings>('/admin/settings/welcome', data).then((r) => r.data);

// ── Stats ──

export const getStats = () =>
  api.get<Stats>('/admin/stats').then((r) => r.data);

export default api;
