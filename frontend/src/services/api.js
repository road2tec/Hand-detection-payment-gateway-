import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', new URLSearchParams(credentials)),
    getProfile: () => api.get('/auth/profile'),
    secureRegister: (formData) => api.post('/auth/secure-register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const biometricService = {
    registerHand: (formData) => api.post('/biometric/register-hand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    verifyHand: (formData) => api.post('/biometric/verify-hand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const paymentService = {
    createOrder: (formData) => api.post('/payment/create-order', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    verifyPayment: (data) => api.post('/payment/verify-payment', data),
    verifyOTP: (data) => api.post('/payment/verify-otp', data),
    verifyPIN: (data) => api.post('/payment/verify-pin', data),
};

export const dashboardService = {
    getMetrics: () => api.get('/dashboard/metrics'),
    getActivity: () => api.get('/dashboard/activity-feed'),
    getPayments: () => api.get('/dashboard/payments'),
    getBiometricStats: () => api.get('/dashboard/biometric-stats'),
};

export const adminService = {
    getLogs: (status) => api.get(`/admin/logs${status ? `?status=${status}` : ''}`),
    getStats: () => api.get('/admin/stats'),
    getHealth: () => api.get('/admin/health'),
    getUsers: () => api.get('/admin/users'),
    getAlerts: () => api.get('/admin/alerts'),
};

export default api;
