import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Eye, 
  Clock, 
  User, 
  MapPin,
  Package,
  AlertCircle,
  RefreshCw,
  X,
  Calendar,
  Users as UsersIcon,
  Check,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI, contributorAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const CustomRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const isContributor = user?.role === 'contributor';

  useEffect(() => {
    fetchCustomRequests();
  }, []);

  const fetchCustomRequests = async () => {
    try {
      setLoading(true);
      
      const api = user?.role === 'admin' ? adminAPI : contributorAPI;
      const response = await api.getCustomRequests({ size: 100 });
      const items = response.data.items || [];
      setRequests(items);
    } catch (error) {
      console.error('Failed to fetch custom requests:', error);
      toast.error('Failed to load custom requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = selectedUrgency === 'all' || r.urgency?.toLowerCase() === selectedUrgency;
    return matchesSearch && matchesUrgency;
  });

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
    };
    return colors[urgency?.toLowerCase()] || 'secondary';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      fulfilled: 'primary',
      cancelled: 'secondary',
    };
    return colors[status?.toLowerCase()] || 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const closeModal = () => {
    setSelectedRequest(null);
  };

  const handleApprove = async (requestId) => {
    if (!isContributor) return;
    try {
      setProcessingId(requestId);
      await contributorAPI.approveCustomRequest(requestId);
      toast.success('Request approved! The recipient has been notified.');
      fetchCustomRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId) => {
    if (!isContributor) return;
    try {
      setProcessingId(requestId);
      await contributorAPI.rejectCustomRequest(requestId);
      toast.success('Request declined.');
      fetchCustomRequests();
    } catch (error) {
      console.error('Failed to decline request:', error);
      toast.error(error.response?.data?.detail || 'Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter(r => r.status?.toLowerCase() === 'pending').length;
  const highUrgencyCount = requests.filter(r => r.urgency?.toLowerCase() === 'high').length;

  return (
    <div className="admin-custom-requests">
      <div className="admin-header">
        <div className="header-title-section">
          <h1 className="admin-title">
            <ClipboardList size={24} />
            Custom Requests
          </h1>
          <p className="admin-subtitle">
            {isContributor 
              ? 'Review and approve or decline food requests from recipients'
              : 'View food requests posted by recipients'}
          </p>
        </div>
        <div className="header-actions">
          {highUrgencyCount > 0 && (
            <Badge variant="danger" size="lg">
              {highUrgencyCount} High Urgency
            </Badge>
          )}
          <Badge variant="warning" size="lg">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      <Card className="admin-filters-card">
        <div className="admin-filters">
          <div className="search-filter">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, description, city, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchCustomRequests}
          >
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="admin-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading custom requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <h3>No Custom Requests Found</h3>
            <p>
              {searchTerm || selectedUrgency !== 'all'
                ? 'No requests match your search criteria.'
                : 'No food requests have been posted by recipients yet.'}
            </p>
          </div>
        ) : (
          <div className="custom-requests-list">
            {filteredRequests.map((request) => (
              <div key={request.id} className="custom-request-card">
                <div className="custom-request-header">
                  <div className="request-title-section">
                    <h4 className="request-title">{request.title}</h4>
                    <div className="request-badges">
                      <Badge variant={getUrgencyColor(request.urgency)} size="sm">
                        {request.urgency}
                      </Badge>
                      <Badge variant={getStatusColor(request.status)} size="sm">
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="request-date">
                    <Calendar size={14} />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                </div>

                <div className="custom-request-body">
                  {request.description && (
                    <p className="request-description">{request.description}</p>
                  )}
                  
                  <div className="request-details-grid">
                    <div className="detail-item">
                      <User size={14} />
                      <span>{request.requester?.full_name || 'Unknown Requester'}</span>
                    </div>
                    <div className="detail-item">
                      <Package size={14} />
                      <span>{request.quantity_needed} {request.unit}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={14} />
                      <span>{request.city}{request.state ? `, ${request.state}` : ''}</span>
                    </div>
                    <div className="detail-item">
                      <UsersIcon size={14} />
                      <span>{request.beneficiaries_count || 1} beneficiaries</span>
                    </div>
                  </div>

                  {(request.requires_halal || request.requires_vegetarian || request.requires_vegan || request.requires_gluten_free) && (
                    <div className="dietary-requirements">
                      {request.requires_halal && <span className="dietary-badge">Halal</span>}
                      {request.requires_vegetarian && <span className="dietary-badge">Vegetarian</span>}
                      {request.requires_vegan && <span className="dietary-badge">Vegan</span>}
                      {request.requires_gluten_free && <span className="dietary-badge">Gluten Free</span>}
                    </div>
                  )}
                </div>

                <div className="custom-request-footer">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye size={14} />}
                    onClick={() => handleViewDetails(request)}
                  >
                    View Details
                  </Button>
                  
                  {}
                  {isContributor && request.status?.toLowerCase() === 'pending' && (
                    <div className="action-buttons">
                      <Button
                        variant="success"
                        size="sm"
                        leftIcon={<Check size={14} />}
                        onClick={() => handleApprove(request.id)}
                        loading={processingId === request.id}
                        disabled={processingId !== null}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<XCircle size={14} />}
                        onClick={() => handleDecline(request.id)}
                        loading={processingId === request.id}
                        disabled={processingId !== null}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {}
      {selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content custom-request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <ClipboardList size={20} />
                Request Details
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Request Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Title</label>
                    <span>{selectedRequest.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <Badge variant={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <div className="detail-item">
                    <label>Urgency</label>
                    <Badge variant={getUrgencyColor(selectedRequest.urgency)}>
                      {selectedRequest.urgency}
                    </Badge>
                  </div>
                  <div className="detail-item">
                    <label>Created At</label>
                    <span>{formatDate(selectedRequest.created_at)}</span>
                  </div>
                </div>
                {selectedRequest.description && (
                  <div className="detail-item full-width">
                    <label>Description</label>
                    <p>{selectedRequest.description}</p>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Quantity & Requirements</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Quantity Needed</label>
                    <span>{selectedRequest.quantity_needed} {selectedRequest.unit}</span>
                  </div>
                  <div className="detail-item">
                    <label>Beneficiaries</label>
                    <span>{selectedRequest.beneficiaries_count || 1} people</span>
                  </div>
                </div>
                <div className="detail-item full-width">
                  <label>Dietary Requirements</label>
                  <div className="dietary-requirements">
                    {selectedRequest.requires_halal && <span className="dietary-badge">Halal</span>}
                    {selectedRequest.requires_vegetarian && <span className="dietary-badge">Vegetarian</span>}
                    {selectedRequest.requires_vegan && <span className="dietary-badge">Vegan</span>}
                    {selectedRequest.requires_gluten_free && <span className="dietary-badge">Gluten Free</span>}
                    {!selectedRequest.requires_halal && !selectedRequest.requires_vegetarian && 
                     !selectedRequest.requires_vegan && !selectedRequest.requires_gluten_free && (
                      <span className="no-requirements">No specific requirements</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Requester Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedRequest.requester?.full_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedRequest.requester?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Delivery Location</h4>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <label>Address</label>
                    <span>{selectedRequest.delivery_address || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>City</label>
                    <span>{selectedRequest.city || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>State</label>
                    <span>{selectedRequest.state || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Country</label>
                    <span>{selectedRequest.country || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Postal Code</label>
                    <span>{selectedRequest.postal_code || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomRequests;
