import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, usersApi } from './api.service';
import { registerForPushNotificationsAsync, updateUserPushToken } from './notifications.service';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    role: 'ADMIN' | 'CLIENT';
    phoneNumber?: string;
    profilePictureUrl?: string;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    role: 'ADMIN' | 'CLIENT';
    phoneNumber?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (data: RegisterData) => Promise<{ requiresVerification?: boolean }>;
    signOut: () => Promise<void>;
    updateProfile: (data: { firstName?: string, lastName?: string, password?: string }) => Promise<void>;
    updateProfilePicture: (formData: FormData) => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@nails_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredUser();
    }, []);

    useEffect(() => {
        if (user) {
            setupNotifications();
        }
    }, [user?.id]);

    const setupNotifications = async () => {
        try {
            if (!user) return;
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await updateUserPushToken(user.id, token);
            }
        } catch (error) {
            console.error('Failed to setup notifications:', error);
        }
    };

    const loadStoredUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const response = await authApi.login(email, password);
            if (response.data.success) {
                // Si l'API ne renvoie pas d'erreur mais que le compte n'est pas vérifié,
                // le backend devrait normalement renvoyer une erreur 401 ou un flag.
                // Ici on assume que success=true signifie login OK
                setUser(response.data.user);
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur de connexion';
            throw new Error(message);
        }
    };

    const signUp = async (data: RegisterData) => {
        try {
            const response = await authApi.register(data);
            if (response.data.success) {
                if (response.data.requiresVerification && response.data.user.role !== 'ADMIN') {
                    return { requiresVerification: true };
                }

                // Si pas de verif requise ou si c'est un ADMIN, on connecte
                setUser(response.data.user);
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
                return { requiresVerification: false };
            }
            return { requiresVerification: false };
        } catch (error: any) {
            console.error('SignUp Error Details:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
            const message = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
            throw new Error(message);
        }
    };

    const signOut = async () => {
        setUser(null);
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
    };

    const updateProfile = async (data: { firstName?: string, lastName?: string, password?: string }) => {
        if (!user) return;
        try {
            const response = await usersApi.updateProfile(user.id, data);
            if (response.data.success) {
                setUser(response.data.user);
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
            throw new Error(message);
        }
    };

    const updateProfilePicture = async (formData: FormData) => {
        if (!user) return;
        try {
            const response = await usersApi.uploadProfilePicture(user.id, formData);
            if (response.data.success) {
                setUser(response.data.user);
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de la mise à jour de la photo';
            throw new Error(message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, signIn, signUp, signOut, updateProfile, updateProfilePicture }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
