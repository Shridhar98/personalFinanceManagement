import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await api.post('/auth/login');
          setDbUser(data);
        } catch (err) {
          console.error('Failed to sync user with backend', err);
        }
      } else {
        setUser(null);
        setDbUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh token on each request
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (_) {}
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => clearInterval(interval);
  }, [user]);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshDbUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setDbUser(data);
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, loginWithGoogle, logout, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
