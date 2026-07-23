import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context';
import { contributorAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import './DonationHistory.css';

const DonationHistory = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDonations();
  }, [currentPage, filter]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await contributorAPI.getMyContributions();
      const allDonations = response.data?.items || [];
      
      
      let filteredDonations = allDonations;
      if (filter !== 'all') {
        filteredDonations = allDonations.filter(d => d.status === filter);
      }
      
      
      setTotalPages(Math.ceil(filteredDonations.length / itemsPerPage));
      
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedDonations = filteredDonations.slice(startIndex, startIndex + itemsPerPage);
      
      setDonations(paginatedDonations);
    } catch (error) {
      console.error('Error fetching donation history:', error);
      toast.error('Failed to load donation history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <Package size={16} />;
      case 'claimed':
        return <Clock size={16} />;
      case 'in_transit':
      case 'in-transit':
        return <Truck size={16} />;
      case 'delivered':
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
      case 'expired':
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'claimed':
        return 'warning';
      case 'in_transit':
      case 'in-transit':
        return 'primary';
      case 'delivered':
      case 'completed':
        return 'secondary';
      case 'cancelled':
      case 'expired':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.replace(/_/g, ' ').replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  
  const summaryStats = {
    total: donations.length,
    available: donations.filter(d => d.status === 'available').length,
    delivered: donations.filter(d => d.status === 'delivered' || d.status === 'completed').length,
    totalQuantity: donations.reduce((sum, d) => sum + (parseInt(d.quantity) || 0), 0),
  };

  if (loading && donations.length === 0) {
    return (
      <div className="donation-history-page">
        <div className="loading-container">
          <RefreshCw className="spinning" size={32} />
          <p>Loading donation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="donation-history-page">
      <div className="page-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">
            <History size={28} className="title-icon" />
            Donation History
          </h1>
          <p className="page-subtitle">
            Track all your food donations and their delivery status
          </p>
        </motion.div>

        <div className="header-actions">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchDonations}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={16} />}
          >
            Export
          </Button>
        </div>
      </div>

      {}
      <div className="summary-grid">
        <Card className="summary-card">
          <div className="summary-icon purple">
            <Package size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summaryStats.total}</span>
            <span className="summary-label">Total Donations</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summaryStats.delivered}</span>
            <span className="summary-label">Delivered</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon orange">
            <Clock size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summaryStats.available}</span>
            <span className="summary-label">Available</span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-icon blue">
            <Package size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summaryStats.totalQuantity}</span>
            <span className="summary-label">Total Items</span>
          </div>
        </Card>
      </div>

      {}
      <Card className="filter-card">
        <div className="filter-header">
          <Filter size={18} />
          <span>Filter by Status:</span>
        </div>
        <div className="filter-buttons">
          {['all', 'available', 'claimed', 'in_transit', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => {
                setFilter(status);
                setCurrentPage(1);
              }}
            >
              {status === 'all' ? 'All' : formatStatus(status)}
            </button>
          ))}
        </div>
      </Card>

      {}
      <Card className="history-card">
        <div className="history-table-container">
          {donations.length > 0 ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Date Donated</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation, index) => (
                  <motion.tr
                    key={donation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="food-name">
                      <strong>{donation.food_name || donation.title || 'Food Donation'}</strong>
                      {donation.description && (
                        <small className="description">{donation.description.substring(0, 50)}...</small>
                      )}
                    </td>
                    <td>
                      {donation.quantity} {donation.unit || 'items'}
                    </td>
                    <td>
                      <Badge variant="secondary" size="sm">
                        {donation.category || 'General'}
                      </Badge>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        {formatDate(donation.created_at)}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Clock size={14} />
                        {formatDate(donation.expiry_date)}
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(donation.status)} size="sm">
                        {getStatusIcon(donation.status)}
                        <span style={{ marginLeft: '4px' }}>{formatStatus(donation.status)}</span>
                      </Badge>
                    </td>
                    <td className="location-cell">
                      {donation.city || donation.pickup_address || 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>No donations found</h3>
              <p>
                {filter !== 'all'
                  ? `You don't have any ${formatStatus(filter).toLowerCase()} donations.`
                  : "You haven't made any donations yet. Start by donating food!"}
              </p>
              <Button variant="primary" onClick={() => window.location.href = '/donate'}>
                Make a Donation
              </Button>
            </div>
          )}
        </div>

        {}
        {totalPages > 1 && (
          <div className="pagination">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ChevronRight size={16} />}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DonationHistory;
