import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('cropai_token');
    const savedUser = localStorage.getItem('cropai_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: jwt, name, email: userEmail, role } = res.data.data;
    const userData = { name, email: userEmail, role };
    localStorage.setItem('cropai_token', jwt);
    localStorage.setItem('cropai_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password, role = 'FARMER') => {
    const res = await authApi.signup({ name, email, password, role });
    const { token: jwt, name: userName, email: userEmail, role: userRole } = res.data.data;
    const userData = { name: userName, email: userEmail, role: userRole };
    localStorage.setItem('cropai_token', jwt);
    localStorage.setItem('cropai_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('cropai_token');
    localStorage.removeItem('cropai_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
