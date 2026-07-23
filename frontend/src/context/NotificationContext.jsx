import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';


console.log('API_URL:', API_URL);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastPolled, setLastPolled] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  
  const pollNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${API_URL}/notifications/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || data.items || []);
      }
    } catch (error) {
      console.warn('Notification poll error:', error);
    }
  }, [isAuthenticated]);

  
  const pollDonations = useCallback(async () => {
    
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/donations/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setDonations(data.donations || data.items || []);
      }
    } catch (error) {
      console.warn('Donations poll error:', error);
    }
  }, []);

  
  const pollRequests = useCallback(async () => {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      
      const response = await fetch(`${API_URL}/food-requests/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || data.items || []);
      }
    } catch (error) {
      console.warn('Requests poll error:', error);
    }
  }, []);

  
  const pollDeliveries = useCallback(async () => {
    if (!isAuthenticated) return;
    
    
    
    const userRole = user?.role;
    if (userRole !== 'volunteer' && userRole !== 'admin') {
      return; 
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${API_URL}/volunteer/deliveries`, { headers });
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || data.items || []);
      }
      
    } catch (error) {
      
    }
  }, [isAuthenticated, user]);

  
  const pollLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/leaderboard/`);
      if (response.ok) {
        const data = await response.json();
        
        const entries = data.entries || data.items || data.leaderboard || [];
        const mappedEntries = entries.map(entry => ({
          id: entry.user?.id || entry.id,
          name: entry.user?.full_name || entry.name || 'Unknown',
          city: entry.user?.city || entry.city,
          avatar_url: entry.user?.avatar_url || entry.avatar_url,
          score: entry.donation_points || entry.score || 0,
          donations: entry.total_donations || entry.donations || 0,
          meals: entry.total_meals_donated || entry.meals || 0,
          rank: entry.rank,
          category: entry.user?.role === 'contributor' ? 'donors' : 'all',
          change: '0',
        }));
        setLeaderboard(mappedEntries);
      }
    } catch (error) {
      console.warn('Leaderboard poll error:', error);
    }
  }, []);

  
  useEffect(() => {
    
    const testConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/health`); 
        if (response.ok) {
          setIsConnected(true);
          console.log('✓ Connected to backend');
        } else {
          setIsConnected(false);
          console.warn('✗ Backend returned error:', response.status);
        }
      } catch (error) {
        setIsConnected(false);
        console.warn('✗ Cannot connect to backend:', error.message);
      }
    };

    testConnection();

    
    
    if (!isAuthenticated) {
      
      setNotifications([]);
      setDeliveries([]);
      return;
    }

    const pollInterval = setInterval(() => {
      pollNotifications();
      pollDonations();
      pollRequests();
      pollDeliveries();
      pollLeaderboard();
      setLastPolled(new Date());
    }, 7000); 

    
    pollNotifications();
    pollDonations();
    pollRequests();
    pollDeliveries();
    pollLeaderboard();

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, pollNotifications, pollDonations, pollRequests, pollDeliveries, pollLeaderboard]);

  
  const markAsRead = useCallback(async (notificationId) => {
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
    }
  }, []);

  
  const refresh = useCallback(async (type) => {
    switch (type) {
      case 'notifications':
        return pollNotifications();
      case 'donations':
        return pollDonations();
      case 'requests':
        return pollRequests();
      case 'deliveries':
        return pollDeliveries();
      case 'leaderboard':
        return pollLeaderboard();
      case 'all':
        pollNotifications();
        pollDonations();
        pollRequests();
        pollDeliveries();
        pollLeaderboard();
        break;
      default:
        break;
    }
  }, [pollNotifications, pollDonations, pollRequests, pollDeliveries, pollLeaderboard]);

  const value = {
    notifications,
    donations,
    requests,
    deliveries,
    leaderboard,
    lastPolled,
    isConnected,
    markAsRead,
    refresh,
    
    pollNotifications,
    pollDonations,
    pollRequests,
    pollDeliveries,
    pollLeaderboard,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
