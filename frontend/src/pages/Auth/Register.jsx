import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building,
  Heart,
  UserPlus,
  Utensils,
  Users,
  Truck,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [contributorType, setContributorType] = useState('individual');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
    address: '',
    organization: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});

  const ADMIN_EMAIL = 'adminhpbite@gmail.com';
  const ADMIN_PASSWORD = 'Admin@12345';

  const roles = [
    {
      id: 'contributor',
      icon: Utensils,
      title: 'Contributor',
      description: 'Individuals, companies, or NGOs donating food or zakat',
    },
    {
      id: 'recipient',
      icon: Users,
      title: 'Recipient',
      description: 'Organizations or NGOs requesting food or zakat',
    },
    {
      id: 'volunteer',
      icon: Truck,
      title: 'Volunteer',
      description: 'Help deliver food from donors to recipients',
    },
    {
      id: 'admin',
      icon: Shield,
      title: 'Admin Login',
      description: 'Full control to monitor and manage everything',
    },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const selectRole = (roleId) => {
    setFormData((prev) => ({ ...prev, role: roleId }));
    setErrors((prev) => ({ ...prev, role: '' }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1B = () => {
    
    if (formData.role === 'contributor' && !contributorType) {
      setErrors({ contributorType: 'Please select contributor type' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if ((contributorType !== 'individual' || formData.role === 'recipient') && !formData.organization.trim()) {
      newErrors.organization = 'Organization name is required';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      if (formData.role === 'recipient') {
        setContributorType('ngo');
        setStep(2);
      } else if (formData.role === 'contributor') {
        setStep(1.5);
      } else {
        setStep(2);
      }
    } else if (step === 1.5 && validateStep1B()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);

    
    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      organization: formData.organization ? formData.organization.trim() : '',
      
      
      userType: contributorType,
    };

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      
      navigate('/dashboard');
    }
    
  };

  return (
    <div className="auth-page auth-page-register">
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
          <Card className="auth-card auth-card-register" padding="xl">
            <div className="auth-header">
              <Link to="/" className="auth-logo">
                <Heart className="logo-icon" size={32} />
                <span className="logo-text">HopeBite</span>
              </Link>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join thousands making a difference</p>
            </div>
            <div className="register-steps">
              {[1, 2, 3].map((s) => {
                const displayStep = s;
                const currentStep = step === 1.5 ? 1.5 : Math.ceil(step);
                return (
                  <div
                    key={s}
                    className={`step-indicator ${displayStep === currentStep ? 'active' : ''} ${displayStep < currentStep ? 'completed' : ''}`}
                  >
                    <span className="step-number">{s}</span>
                    <span className="step-label">
                      {s === 1 ? 'Role' : s === 2 ? 'Account' : 'Details'}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <h3 className="step-title">How will you use HopeBite?</h3>
                  <div className="role-grid">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className={`role-card ${formData.role === role.id ? 'selected' : ''}`}
                        onClick={() => selectRole(role.id)}
                      >
                        <role.icon size={32} />
                        <h4>{role.title}</h4>
                        <p>{role.description}</p>
                      </div>
                    ))}
                  </div>
                  {errors.role && <span className="error-text">{errors.role}</span>}
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={nextStep}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {step === 1.5 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <h3 className="step-title">
                    How do you want to join as a {roles.find(r => r.id === formData.role)?.title}?
                  </h3>
                  <p className="step-description">Select whether you're joining as an individual or an organization</p>

                  <div className="contributor-type-grid">
                    <div
                      className={`contributor-card ${contributorType === 'individual' ? 'selected' : ''}`}
                      onClick={() => setContributorType('individual')}
                    >
                      <User size={40} />
                      <h4>Individual</h4>
                      <p>
                        {formData.role === 'contributor'
                          ? 'I want to donate as an individual person'
                          : 'I want to request food for myself/family'}
                      </p>
                      <ul className="feature-list">
                        <li>Personal dashboard</li>
                        <li>{formData.role === 'contributor' ? 'Donation history' : 'Request history'}</li>
                        <li>Direct communication</li>
                      </ul>
                    </div>

                    <div
                      className={`contributor-card ${contributorType === 'ngo' ? 'selected' : ''}`}
                      onClick={() => setContributorType('ngo')}
                    >
                      <Building size={40} />
                      <h4>Organization / NGO</h4>
                      <p>
                        {formData.role === 'contributor'
                          ? 'I represent a company or NGO'
                          : 'I represent a shelter or community group'}
                      </p>
                      <ul className="feature-list">
                        <li>Organization profile</li>
                        <li>Verification badge</li>
                        <li>Impact tracking</li>
                      </ul>
                    </div>
                  </div>

                  {errors.contributorType && <span className="error-text">{errors.contributorType}</span>}

                  <div className="step-actions">
                    <Button type="button" variant="secondary" onClick={() => {
                      setStep(1);
                      setContributorType('individual');
                    }}>
                      Back
                    </Button>
                    <Button type="button" variant="primary" onClick={nextStep}>
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <Input
                    label="Full Name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={<User size={20} />}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={<Mail size={20} />}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    icon={<Phone size={20} />}
                  />
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a strong password"
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
                    hint="At least 8 characters with uppercase and number"
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    icon={<Lock size={20} />}
                  />
                  <div className="step-actions">
                    <Button type="button" variant="secondary" onClick={prevStep}>
                      Back
                    </Button>
                    <Button type="button" variant="primary" onClick={nextStep}>
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <Input
                    label="Address"
                    type="text"
                    name="address"
                    placeholder="123 Main St, City, State"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    icon={<MapPin size={20} />}
                  />
                  {(contributorType !== 'individual' || formData.role === 'recipient') && (
                    <Input
                      label="Organization Name"
                      type="text"
                      name="organization"
                      placeholder="Your organization or restaurant name"
                      value={formData.organization}
                      onChange={handleChange}
                      error={errors.organization}
                      icon={<Building size={20} />}
                    />
                  )}
                  <label className="checkbox-label terms-checkbox">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/terms" className="auth-link">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="auth-link">Privacy Policy</Link>
                    </span>
                  </label>
                  {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
                  <div className="step-actions">
                    <Button type="button" variant="secondary" onClick={prevStep}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      leftIcon={<UserPlus size={20} />}
                    >
                      Create Account
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
