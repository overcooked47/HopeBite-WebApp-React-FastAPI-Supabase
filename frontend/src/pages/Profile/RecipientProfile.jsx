import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Award,
  TrendingUp,
  Edit2,
  Download,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context';
import { recipientAPI, zakatAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './Profile.css';

const RecipientProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState([]);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Not set',
    email: user?.email || 'Not set',
    phone: user?.phone || 'Not set',
    address: user?.address || 'Not set',
    joinDate: user?.createdAt || new Date().toISOString(),
  });

  const [requestStats, setRequestStats] = useState({
    totalRequests: 0,
    fulfilledRequests: 0,
    pendingRequests: 0,
    zakatRequests: 0,
    zakatReceived: 0,
  });

  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        
        const foodResponse = await recipientAPI.getMyRequests();
        const foodRequests = foodResponse.data?.items || foodResponse.data || [];
        
        
        let zakatRequests = [];
        let zakatReceived = 0;
        try {
          const zakatResponse = await zakatAPI.getMyRequests();
          zakatRequests = zakatResponse.data?.items || zakatResponse.data || [];
          zakatReceived = zakatRequests
            .filter(r => r.status === 'approved' || r.status === 'fulfilled')
            .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        } catch (err) {
          console.warn('Could not fetch zakat requests:', err);
        }
        
        setRequestStats({
          totalRequests: foodRequests.length,
          fulfilledRequests: foodRequests.filter(r => r.status === 'fulfilled').length,
          pendingRequests: foodRequests.filter(r => r.status === 'pending').length,
          zakatRequests: zakatRequests.length,
          zakatReceived: zakatReceived,
        });
        
        
        setRecentRequests(foodRequests.slice(0, 5));
      } catch (error) {
        console.error('Error fetching request stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            <User size={28} className="title-icon" />
            My Profile
          </h1>
          <p className="page-subtitle">View and manage your recipient profile and request history</p>
        </motion.div>
      </div>

      <div className="profile-grid">
        {}
        <Card className="profile-card">
          <div className="card-header">
            <h2 className="card-title">Personal Information</h2>
            <Button variant="secondary" size="sm" leftIcon={<Edit2 size={16} />}>
              Edit
            </Button>
          </div>

          <div className="profile-field">
            <label>Full Name</label>
            <p>{profileData.name}</p>
          </div>

          <div className="profile-field">
            <label>
              <Mail size={16} /> Email Address
            </label>
            <p>{profileData.email}</p>
          </div>

          <div className="profile-field">
            <label>
              <Phone size={16} /> Phone Number
            </label>
            <p>{profileData.phone}</p>
          </div>

          <div className="profile-field">
            <label>
              <MapPin size={16} /> Address
            </label>
            <p>{profileData.address}</p>
          </div>

          <div className="profile-field">
            <label>
              <Calendar size={16} /> Member Since
            </label>
            <p>{formatDate(profileData.joinDate)}</p>
          </div>
        </Card>

        {}
        <Card className="stats-card">
          <h2 className="card-title">Request Statistics</h2>

          <div className="stat-item">
            <div className="stat-icon">
              <Heart size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{requestStats.totalRequests}</span>
              <span className="stat-label">Total Requests Posted</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{requestStats.fulfilledRequests}</span>
              <span className="stat-label">Fulfilled Requests</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{requestStats.pendingRequests}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{requestStats.zakatRequests}</span>
              <span className="stat-label">Zakat Requests</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Heart size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">BDT {requestStats.zakatReceived}</span>
              <span className="stat-label">Zakat Received</span>
            </div>
          </div>
        </Card>

        {}
        <Card className="history-card full-width">
          <div className="card-header">
            <h2 className="card-title">Recent Donation Requests</h2>
            <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
              Export History
            </Button>
          </div>

          <div className="history-list">
            {recentRequests && recentRequests.length > 0 ? (
              recentRequests
                .slice(0, 5)
                .map((request, index) => (
                  <motion.div
                    key={request.id}
                    className="history-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="history-left">
                      <h4 className="history-title">{request.title || 'Request'}</h4>
                      <p className="history-description">
                        {request.quantity_needed || request.quantity || 'N/A'} {request.unit || 'units'} • {request.city || 'N/A'}
                      </p>
                    </div>
                    <div className="history-right">
                      <Badge
                        variant={
                          request.status === 'fulfilled'
                            ? 'success'
                            : request.status === 'pending'
                            ? 'warning'
                            : request.status === 'approved'
                            ? 'primary'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {request.status || 'Pending'}
                      </Badge>
                    </div>
                  </motion.div>
                ))
            ) : (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No requests yet. Post your first request to get started!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecipientProfile;
