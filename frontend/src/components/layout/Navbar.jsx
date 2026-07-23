import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Heart,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, refresh } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setShowProfileMenu(false);
    setShowNotifications(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/donate', label: 'Donate Food' },
    { path: '/find-food', label: 'Find Food' },
    { path: '/zakat', label: 'Zakat' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/about', label: 'About' },
  ];

  
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  
  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      refresh('notifications');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <Heart className="logo-icon" />
          <span className="logo-text">
            Hope<span className="logo-highlight">Bite</span>
          </span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="navbar-icon-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <>
              <div className="navbar-dropdown">
                <button
                  className="navbar-icon-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      className="dropdown-menu notifications-menu"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="dropdown-header">
                        <h4>Notifications</h4>
                        <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>
                      </div>
                      <div className="notifications-list">
                        {notifications && notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <p>{notification.title || notification.message}</p>
                              <span className="notification-time">{formatTimeAgo(notification.created_at)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="notification-item">
                            <p>No notifications yet</p>
                          </div>
                        )}
                      </div>
                      <Link to="/notifications" className="dropdown-footer">
                        View all notifications
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="navbar-dropdown">
                <button
                  className="profile-trigger"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <Avatar src={user?.avatar} name={user?.name} size="sm" />
                  <span className="profile-name">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      className="dropdown-menu profile-menu"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="profile-header">
                        <Avatar src={user?.avatar} name={user?.name} size="lg" />
                        <div>
                          <h4>{user?.name}</h4>
                          <p>{user?.email}</p>
                          <Badge variant="purple" size="sm">{user?.role}</Badge>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/dashboard" className="dropdown-item">
                        <User size={18} />
                        Dashboard
                      </Link>
                      <Link to="/profile" className="dropdown-item">
                        <User size={18} />
                        My Profile
                      </Link>
                      <Link to="/settings" className="dropdown-item">
                        <Settings size={18} />
                        Settings
                      </Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button variant="primary" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          )}

          <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="navbar-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="mobile-links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {!isAuthenticated && (
              <div className="mobile-auth">
                <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>
                  Log In
                </Button>
                <Button variant="primary" fullWidth onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
