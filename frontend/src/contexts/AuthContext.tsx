import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInApi, signUpApi, verifyTokenApi } from '../services/api';

interface UserProfile {
    name?: string;
    phone?: string;
    // Add other profile fields as needed
}

interface User {
    email: string;
    profile?: UserProfile; // Make profile optional
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => void;
    updateUser: (profile: UserProfile) => void; // Add this
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token && !user) { // Only verify if token exists and user is not already set
                try {
                    const data = await verifyTokenApi(token);
                    setUser({ email: data.user.email, profile: data.user.profile });
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Token verification failed:", error);
                    localStorage.removeItem('authToken');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, [user]); // Add user to dependency array to re-run if user changes

    const signIn = async (email: string, password: string) => {
        const data = await signInApi(email, password);
        localStorage.setItem('authToken', data.token);
        setUser({ email: data.user.email, profile: data.user.profile });
        setIsAuthenticated(true);
    };

    const signUp = async (email: string, password: string) => {
        await signUpApi(email, password);
        // Optionally, sign in the user directly after signup or redirect to login
    };

    const signOut = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (profile: UserProfile) => {
        if (user) {
            setUser({ ...user, profile });
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, signIn, signUp, signOut, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};