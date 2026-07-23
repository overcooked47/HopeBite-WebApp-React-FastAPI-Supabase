import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '../../context';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import './Auth.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await adminLogin({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-gradient" />
        <div className="auth-pattern" />
      </div>

      <div className="auth-container">
        <motion.div
          className="auth-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="auth-card" padding="xl">
            <div className="auth-header">
              <Link to="/" className="auth-logo">
                <Shield className="logo-icon" size={32} />
                <span className="logo-text">HopeBite Admin</span>
              </Link>
              <h1 className="auth-title">Admin Login</h1>
              <p className="auth-subtitle">Access the administration panel</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Admin Email"
                type="email"
                name="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail size={20} />}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<Lock size={20} />}
                rightIcon={
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                leftIcon={<Shield size={20} />}
              >
                Sign In as Admin
              </Button>
            </form>

            <p className="auth-footer">
              Not an admin?{' '}
              <Link to="/login" className="auth-link">
                Go to regular login
              </Link>
            </p>
          </Card>

          <div className="auth-image">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800"
              alt="Admin dashboard"
            />
            <div className="auth-image-overlay">
              <h2>Admin Portal</h2>
              <p>Manage users, donations, and platform settings.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
