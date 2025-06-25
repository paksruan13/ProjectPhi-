import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const checkAuth =async () => {
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                try {
                    const response = await fetch('http://localhost:4243/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${savedToken}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                        setToken(savedToken);
                    } else {
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth Check Failed:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:4243/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if(response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return {success: true};
            } else {
                return { success: false, error: data.error};
            }
        } catch (error) {
            return { success: false, error: 'Login failed'};
        }
    };

    const register = async (name, email, password, role = 'STUDENT', teamId = null) => {
        try {
            const response = await fetch ('http://localhost:4243/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role, teamId }),
            });
            const data = await response.json();
            if(response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Registration failed' };
        }
    };

    const registerWithTeam = async (name, email, password, teamCode) => {
        try {
            const response = await fetch('http://localhost:4243/auth/register-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, teamCode }),
            });
            const data = await response.json();

            if(response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return { success: true };
            } else {
                return { success: false, error: data.error};
            }
        } catch (error) {
            console.error('Team Registration Failed:', error);
            return { success: false, error: 'Team registration failed' };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');

        
    };

    const value = {
        user, token, loading, login, register, logout, registerWithTeam, isAuthenticated: !!user,
        isCoach: user?.role === 'COACH', isAdmin: user?.role === 'ADMIN',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>);
}