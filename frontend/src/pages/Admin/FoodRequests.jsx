import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Check, 
  X, 
  Eye, 
  Clock, 
  User, 
  Building2,
  Utensils,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const FoodRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchFoodRequests();
  }, []);

  const fetchFoodRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFoodRequests({ size: 100 });
      const items = response.data.items || [];
      
      const transformedRequests = items.map(claim => ({
        id: claim.id,
        recipientName: claim.claimer?.full_name || 'Unknown',
        recipientEmail: claim.claimer?.email || 'N/A',
        organization: claim.claimer?.organization_name || 'Individual',
        organizationType: claim.claimer?.user_type || 'individual',
        foodTitle: claim.donation?.title || 'Unknown Food',
        foodDescription: claim.donation?.description || '',
        foodCategory: claim.donation?.category || 'other',
        quantityRequested: claim.quantity_claimed || claim.quantity_requested || 1,
        quantityUnit: claim.donation?.quantity_unit || 'servings',
        status: claim.status,
        message: claim.notes || claim.message,
        createdAt: claim.created_at,
        donationId: claim.donation_id,
        claimerId: claim.claimer_id,
        foodImageUrl: claim.donation?.image_url,
      }));
      
      setRequests(transformedRequests);
    } catch (error) {
      console.error('Failed to fetch food requests:', error);
      toast.error('Failed to load food requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await adminAPI.approveFoodRequest(requestId);
      toast.success('Food request approved! Recipient has been notified.');
      fetchFoodRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);
      await adminAPI.rejectFoodRequest(requestId);
      toast.success('Food request rejected.');
      fetchFoodRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.foodTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      completed: 'purple',
      cancelled: 'secondary',
    };
    return colors[status] || 'gray';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      cooked_meals: 'Cooked Meals',
      raw_ingredients: 'Raw Ingredients',
      packaged_food: 'Packaged Food',
      beverages: 'Beverages',
      bakery: 'Bakery',
      fruits_vegetables: 'Fruits & Vegetables',
      dairy: 'Dairy',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-food-requests">
      <div className="admin-header">
        <div className="header-title-section">
          <h1 className="admin-title">
            <ClipboardList size={24} />
            Food Requests Management
          </h1>
          <p className="admin-subtitle">
            Review and approve food requests from recipients
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" size="lg">
            {pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Card className="users-filter">
        <div className="filter-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by recipient, organization, or food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <Button 
            variant="secondary" 
            size="sm" 
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchFoodRequests}
          >
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="users-table-card">
        <div className="table-responsive">
          <table className="users-table food-requests-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Organization</th>
                <th>Food Requested</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading food requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No food requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.id} className={r.status === 'pending' ? 'pending-row' : ''}>
                    <td>
                      <div className="recipient-info">
                        <User size={16} className="info-icon" />
                        <div>
                          <span className="font-medium">{r.recipientName}</span>
                          <span className="email-text">{r.recipientEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="organization-info">
                        <Building2 size={16} className="info-icon" />
                        <div>
                          <span className="font-medium">{r.organization}</span>
                          <Badge size="sm" variant="secondary">
                            {r.organizationType}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="food-info">
                        <Utensils size={16} className="info-icon" />
                        <div>
                          <span className="font-medium">{r.foodTitle}</span>
                          <Badge size="sm" variant="purple">
                            {getCategoryLabel(r.foodCategory)}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="quantity-badge">
                        {r.quantityRequested} {r.quantityUnit}
                      </span>
                    </td>
                    <td>
                      <Badge variant={getStatusColor(r.status)}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <div className="date-info">
                        <Clock size={14} />
                        {formatDate(r.createdAt)}
                      </div>
                    </td>
                    <td className="actions-cell">
                      {r.status === 'pending' ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<Check size={14} />}
                            onClick={() => handleApprove(r.id)}
                            disabled={processingId === r.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<X size={14} />}
                            onClick={() => handleReject(r.id)}
                            disabled={processingId === r.id}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => setSelectedRequest(r)}
                        >
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Food Request Details</h2>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3><User size={18} /> Recipient Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedRequest.recipientName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedRequest.recipientEmail}</span>
                  </div>
                  <div className="detail-item">
                    <label>Organization</label>
                    <span>{selectedRequest.organization}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <Badge>{selectedRequest.organizationType}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3><Utensils size={18} /> Food Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Food Title</label>
                    <span>{selectedRequest.foodTitle}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <Badge variant="purple">{getCategoryLabel(selectedRequest.foodCategory)}</Badge>
                  </div>
                  <div className="detail-item">
                    <label>Quantity Requested</label>
                    <span>{selectedRequest.quantityRequested} {selectedRequest.quantityUnit}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <Badge variant={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
                {selectedRequest.foodDescription && (
                  <div className="detail-item full-width">
                    <label>Description</label>
                    <p>{selectedRequest.foodDescription}</p>
                  </div>
                )}
              </div>

              {selectedRequest.message && (
                <div className="detail-section">
                  <h3>Message from Recipient</h3>
                  <p className="request-message">{selectedRequest.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodRequests;
