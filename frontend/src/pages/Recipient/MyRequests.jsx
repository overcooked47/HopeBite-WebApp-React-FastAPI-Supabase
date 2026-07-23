import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  MapPin,
  Package,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context';
import { recipientAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import './RecipientRequest.css';

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    fulfilled: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await recipientAPI.getMyRequests();
      const items = response.data.items || response.data || [];
      setRequests(items);
      
      
      setStats({
        total: items.length,
        pending: items.filter(r => r.status === 'pending').length,
        approved: items.filter(r => r.status === 'approved').length,
        fulfilled: items.filter(r => r.status === 'fulfilled').length,
        rejected: items.filter(r => r.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'fulfilled': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'primary';
      case 'fulfilled': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="my-requests-page">
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            <ClipboardList size={28} className="title-icon" />
            My Requests
          </h1>
          <p className="page-subtitle">
            Track your food assistance requests and their status
          </p>
        </motion.div>

        <Button
          variant="secondary"
          onClick={fetchMyRequests}
          leftIcon={<RefreshCw size={16} />}
        >
          Refresh
        </Button>
      </div>

      {}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--warning)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.fulfilled}</span>
            <span className="stat-label">Fulfilled</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--danger)' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </Card>
      </div>

      {}
      {requests.length === 0 ? (
        <Card className="empty-state">
          <ClipboardList size={48} className="empty-icon" />
          <h3>No Requests Yet</h3>
          <p>You haven't posted any food requests yet. Click "Post Request" in the sidebar to create one.</p>
        </Card>
      ) : (
        <div className="requests-list">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="request-card" onClick={() => setSelectedRequest(request)}>
                <div className="request-header">
                  <h3 className="request-title">{request.title}</h3>
                  <div className="request-badges">
                    <Badge variant={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span style={{ marginLeft: '4px' }}>{request.status}</span>
                    </Badge>
                    {request.urgency && (
                      <Badge variant={getUrgencyColor(request.urgency)}>
                        {request.urgency === 'high' && <AlertTriangle size={14} />}
                        <span style={{ marginLeft: request.urgency === 'high' ? '4px' : '0' }}>
                          {request.urgency}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>

                {request.description && (
                  <p className="request-description">{request.description}</p>
                )}

                <div className="request-meta">
                  <span className="meta-item">
                    <Package size={14} />
                    {request.quantity_needed} {request.unit}
                  </span>
                  <span className="meta-item">
                    <MapPin size={14} />
                    {request.city}
                  </span>
                  <span className="meta-item">
                    <Users size={14} />
                    {request.beneficiaries_count} beneficiaries
                  </span>
                  <span className="meta-item">
                    <Calendar size={14} />
                    {formatDate(request.created_at)}
                  </span>
                </div>

                {request.status === 'approved' && (
                  <div className="approval-notice" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                    <CheckCircle size={16} style={{ marginRight: '8px' }} />
                    Your request has been approved! A contributor is preparing to help.
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="rejection-notice" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
                    <XCircle size={16} style={{ marginRight: '8px' }} />
                    This request was declined. You can submit a new request.
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedRequest.title}</h2>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Status:</strong>
                <Badge variant={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <div className="detail-row">
                <strong>Urgency:</strong>
                <Badge variant={getUrgencyColor(selectedRequest.urgency)}>
                  {selectedRequest.urgency}
                </Badge>
              </div>
              <div className="detail-row">
                <strong>Quantity:</strong>
                <span>{selectedRequest.quantity_needed} {selectedRequest.unit}</span>
              </div>
              <div className="detail-row">
                <strong>Beneficiaries:</strong>
                <span>{selectedRequest.beneficiaries_count}</span>
              </div>
              <div className="detail-row">
                <strong>Address:</strong>
                <span>{selectedRequest.delivery_address}, {selectedRequest.city}</span>
              </div>
              <div className="detail-row">
                <strong>Created:</strong>
                <span>{formatDate(selectedRequest.created_at)}</span>
              </div>
              {selectedRequest.description && (
                <div className="detail-row">
                  <strong>Description:</strong>
                  <p>{selectedRequest.description}</p>
                </div>
              )}
              <div className="dietary-requirements">
                <strong>Dietary Requirements:</strong>
                <div className="dietary-badges">
                  {selectedRequest.requires_halal && <Badge variant="primary">Halal</Badge>}
                  {selectedRequest.requires_vegetarian && <Badge variant="success">Vegetarian</Badge>}
                  {selectedRequest.requires_vegan && <Badge variant="success">Vegan</Badge>}
                  {selectedRequest.requires_gluten_free && <Badge variant="warning">Gluten-Free</Badge>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
