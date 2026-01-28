import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
// Ensure API_URL ends with a slash to avoid axios path joining issues
const normalizedBaseURL = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;

export const api = axios.create({
    baseURL: normalizedBaseURL,
});

// Interceptor for logging or auth if needed later
api.interceptors.request.use((config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);

    // Ensure basic headers
    config.headers = config.headers || {};
    config.headers['Accept'] = 'application/json';

    if (config.data instanceof FormData) {
        // Essential for React Native to let the system set boundary
        delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
});

export const servicesApi = {
    getAll: () => api.get('services'),
    getOne: (id: string) => api.get(`services/${id}`),
    create: (data: any) => api.post('services', data),
    update: (id: string, data: any) => api.patch(`services/${id}`, data),
    delete: (id: string) => api.delete(`services/${id}`),
    uploadImage: (formData: FormData) => api.post('services/upload', formData),
};

export const authApi = {
    register: (data: any) => api.post('auth/register', data),
    login: (email: string, password: string) => api.post('auth/login', { email, password }),
    verify: (data: { email: string, code: string }) => api.post('auth/verify', data),
};

export const usersApi = {
    updateProfile: (id: string, data: any) => api.patch(`users/${id}`, data),
    uploadProfilePicture: (id: string, formData: FormData) => api.post(`users/${id}/profile-picture`, formData),
};

export const bookingsApi = {
    create: (data: { userId: string, serviceId: string, date: string, notes?: string }) => api.post('bookings', data),
    getByUser: (userId: string) => api.get(`bookings/user/${userId}`),
    getAll: () => api.get('bookings'),
    getBookedSlots: (date: string) => api.get(`bookings/booked-slots/${date}`),
    updateStatus: (id: string, status: 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'COMPLETED', cancellationReason?: string) =>
        api.patch(`bookings/${id}/status`, { status, cancellationReason }),
};

export const accountingApi = {
    getStats: () => api.get('accounting/stats'),
};

export const versionApi = {
    getLatestVersion: () => api.get('version'),
};

export const storiesApi = {
    getAll: () => api.get('stories'),
    create: (data: any) => api.post('stories', data),
    uploadImage: (formData: FormData) => api.post('stories/upload', formData),
    delete: (id: string) => api.delete(`stories/${id}`),
};
