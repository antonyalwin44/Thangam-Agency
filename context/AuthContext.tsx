import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { onAuthChange, getUserData } from '../services/authService';
import { Session } from '@supabase/supabase-js';
import { useAuthStore } from '../store/authStore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isDriver: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isDriver: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const setStoreUser = useAuthStore(state => state.setUser);
    const setStoreLoading = useAuthStore(state => state.setLoading);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (session: Session | null) => {
            setLoading(true);
            setStoreLoading(true);

            if (session?.user) {
                try {
                    const userData = await getUserData(session.user.id, session.user.email);
                    setUser(userData);
                    setStoreUser(userData);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(null);
                    setStoreUser(null);
                }
            } else {
                setUser(null);
                setStoreUser(null);
            }
            setLoading(false);
            setStoreLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isAdmin = user?.role === 'admin';
    const isDriver = user?.role === 'driver';

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isDriver }}>
            {children}
        </AuthContext.Provider>
    );
};
