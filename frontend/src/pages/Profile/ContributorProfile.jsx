import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Heart,
  Award,
  TrendingUp,
  Edit2,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context';
import { contributorAPI } from '../../services/api'; 
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './Profile.css';

const ContributorProfile = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: user?.full_name || 'Not set',
    email: user?.email || 'Not set',
    phone: user?.phone || 'Not set',
    address: user?.address || 'Not set',
    organization: user?.organization_name || 'Not set',
    joinType: user?.user_type || 'individual',
    joinDate: user?.created_at || new Date().toISOString(),
  });

  const [donationStats, setDonationStats] = useState({
    totalDonations: 0,
    totalQuantity: 0,
    zakatDonations: 0,
    zakatAmount: 0,
  });

  
  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await contributorAPI.getMyContributions();
      
      const donationItems = response.data?.items || [];
      setDonations(donationItems);

      
      if (donationItems.length > 0) {
        const stats = {
          totalDonations: donationItems.length,
          totalQuantity: donationItems.reduce((sum, d) => sum + (parseInt(d.quantity) || 0), 0),
          zakatDonations: donationItems.filter((d) => d.is_zakat).length,
          zakatAmount: donationItems
            .filter((d) => d.is_zakat)
            .reduce((sum, d) => sum + (parseFloat(d.zakat_amount) || 0), 0),
        };
        setDonationStats(stats);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
      
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            <User size={28} className="title-icon" />
            My Profile
          </h1>
          <p className="page-subtitle">View and manage your contributor profile and donation history</p>
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

          {profileData.organization && profileData.organization !== 'Not set' && (
            <div className="profile-field">
              <label>
                <Building size={16} /> Organization
              </label>
              <p>{profileData.organization}</p>
            </div>
          )}

          <div className="profile-field">
            <label>Contributor Type</label>
            <Badge variant={profileData.joinType === 'ngo' ? 'primary' : 'secondary'}>
              {profileData.joinType === 'ngo' ? 'NGO / Organization' : 'Individual'}
            </Badge>
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
          <h2 className="card-title">Donation Statistics</h2>

          <div className="stat-item">
            <div className="stat-icon">
              <Heart size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{donationStats.totalDonations}</span>
              <span className="stat-label">Total Food Donations</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{donationStats.totalQuantity}</span>
              <span className="stat-label">Total Quantity Donated</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{donationStats.zakatDonations}</span>
              <span className="stat-label">Zakat Donations</span>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <Heart size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">BDT {donationStats.zakatAmount}</span>
              <span className="stat-label">Total Zakat Amount</span>
            </div>
          </div>
        </Card>

        {}
        <Card className="history-card full-width">
          <div className="card-header">
            <h2 className="card-title">Recent Food Donations</h2>
            <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
              Export History
            </Button>
          </div>

          <div className="history-list">
            {donations.length > 0 ? (
              donations.slice(0, 5).map((donation, index) => (
                <motion.div
                  key={donation.id}
                  className="history-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="history-left">
                    <h4 className="history-title">{donation.food_name || 'Food Donation'}</h4>
                    <p className="history-description">
                      {donation.quantity} {donation.unit || 'items'} • {donation.category || 'General'}
                    </p>
                    <small style={{ color: '#666' }}>
                      {new Date(donation.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="history-right">
                    <Badge variant={donation.status === 'completed' ? 'success' : 'warning'} size="sm">
                      {donation.status || 'Pending'}
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No donations yet. Start by posting your first food donation!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContributorProfile;