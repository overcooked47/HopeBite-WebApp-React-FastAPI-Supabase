import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const ROLE_PERMISSIONS = {
  admin: {
    canDonate: false,
    canViewAll: true,
    canManageUsers: true,
    canSeeZakatLedger: true,
    canTrackDeliveries: true,
    canUploadProof: false,
    canRequest: false,
  },
  contributor: {
    canDonate: true,
    canViewAll: false,
    canManageUsers: false,
    canSeeZakatLedger: true,
    canTrackDeliveries: true,
    canUploadProof: false,
    canRequest: false,
  },
  recipient: {
    canDonate: false,
    canViewAll: false,
    canManageUsers: false,
    canSeeZakatLedger: true,
    canTrackDeliveries: true,
    canUploadProof: false,
    canRequest: true,
  },
  volunteer: {
    canDonate: false,
    canViewAll: false,
    canManageUsers: false,
    canSeeZakatLedger: false,
    canTrackDeliveries: true,
    canUploadProof: true,
    canRequest: false,
  },
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      );

      const response = await Promise.race([
        authAPI.getMe(),
        timeoutPromise
      ]);

      const userData = response.data;
      userData.name = userData.full_name || userData.name;
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error.message);
      if (error.message !== 'Auth check timeout') {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, user_id, role, user_type, full_name } = response.data;

      localStorage.setItem('token', access_token);
      const userData = {
        id: user_id,
        email,
        role,
        user_type,
        full_name,
        name: full_name,
      };
      setUser(userData);

      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      let errorMsg;
      if (!error.response) {
        errorMsg = 'Cannot reach server. Please make sure the backend is running.';
      } else {
        errorMsg = error.response?.data?.detail || 'Login failed';
      }
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const response = await authAPI.adminLogin({ email, password });
      const { access_token, user_id, role, user_type, full_name } = response.data;

      localStorage.setItem('token', access_token);
      const userData = {
        id: user_id,
        email,
        role,
        user_type,
        full_name,
        name: full_name,
      };
      setUser(userData);

      toast.success('Admin login successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Admin login error:', error);
      let errorMsg;
      if (!error.response) {
        errorMsg = 'Cannot reach server. Please make sure the backend is running.';
      } else {
        errorMsg = error.response?.data?.detail || 'Invalid admin credentials';
      }
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const payload = {
        email: userData.email,
        password: userData.password,
        full_name: userData.name || userData.full_name,
        role: userData.role.toLowerCase(),
        user_type: (userData.userType || userData.user_type || 'individual').toLowerCase(),
        phone: userData.phone || null,
        address: userData.address || null,
        organization_name: userData.organization || null,
        organization_registration_number: userData.regNumber || null,
      };

      const response = await authAPI.register(payload);
      const { access_token, user_id, role, user_type, full_name } = response.data;

      localStorage.setItem('token', access_token);

      const newUser = {
        id: user_id,
        email: userData.email,
        role,
        user_type,
        full_name,
        name: full_name,
      };
      setUser(newUser);

      toast.success('Account created successfully!');
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg;
      if (!error.response) {
        errorMsg = 'Cannot reach server. Please make sure the backend is running.';
      } else {
        errorMsg = error.response?.data?.detail || 'Registration failed';
      }
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  const permissions = useMemo(() => {
    if (!user?.role) return ROLE_PERMISSIONS.contributor;
    return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.contributor;
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    adminLogin,
    register,
    logout,
    updateUser,
    permissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};