import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  Check, 
  X, 
  Eye, 
  Clock, 
  User, 
  Building2,
  DollarSign,
  RefreshCw,
  Users
} from 'lucide-react';
import { useAuth } from '../../context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const ZakatRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchZakatRequests();
  }, []);

  const fetchZakatRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getZakatRequests({ size: 100 });
      const items = response.data.items || [];
      
      const transformedRequests = items.map(req => ({
        id: req.id,
        requesterName: req.requester?.full_name || 'Unknown',
        requesterEmail: req.requester?.email || 'N/A',
        organization: req.requester?.organization_name || 'Individual',
        organizationType: req.requester?.user_type || 'individual',
        title: req.title || 'Zakat Request',
        description: req.description || '',
        amountNeeded: req.amount_needed || 0,
        amountReceived: req.amount_received || 0,
        currency: req.currency || 'BDT',
        purpose: req.purpose || 'General assistance',
        beneficiariesCount: req.beneficiaries_count || 1,
        status: req.status,
        isVerified: req.is_verified,
        createdAt: req.created_at,
        requesterId: req.requester_id,
      }));
      
      setRequests(transformedRequests);
    } catch (error) {
      console.error('Failed to fetch zakat requests:', error);
      toast.error('Failed to load zakat requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await adminAPI.approveZakatRequest(requestId);
      toast.success('Zakat request approved! Contributors can now see this request.');
      fetchZakatRequests();
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
      await adminAPI.rejectZakatRequest(requestId);
      toast.success('Zakat request rejected.');
      fetchZakatRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      verified: 'success',
      approved: 'success',
      distributed: 'purple',
      rejected: 'danger',
    };
    return colors[status] || 'gray';
  };

  const formatCurrency = (amount, currency) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-food-requests admin-zakat-requests">
      <div className="admin-header">
        <div className="header-title-section">
          <h1 className="admin-title">
            <Wallet size={24} />
            Zakat Requests Management
          </h1>
          <p className="admin-subtitle">
            Review and approve zakat requests from recipients. Approved requests will be visible to contributors.
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
              placeholder="Search by requester, organization, or title..."
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
            <option value="verified">Approved</option>
            <option value="distributed">Distributed</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button 
            variant="secondary" 
            size="sm" 
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchZakatRequests}
          >
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="users-table-card">
        <div className="table-responsive">
          <table className="users-table food-requests-table zakat-requests-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Organization</th>
                <th>Request Title</th>
                <th>Amount Needed</th>
                <th>Beneficiaries</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading zakat requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No zakat requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.id} className={r.status === 'pending' ? 'pending-row' : ''}>
                    <td>
                      <div className="recipient-info">
                        <User size={16} className="info-icon" />
                        <div>
                          <span className="font-medium">{r.requesterName}</span>
                          <span className="email-text">{r.requesterEmail}</span>
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
                      <div className="request-title-info">
                        <span className="font-medium">{r.title}</span>
                        {r.purpose && (
                          <span className="purpose-text">{r.purpose}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="amount-info">
                        <DollarSign size={14} className="info-icon" />
                        <span className="amount-badge">
                          {formatCurrency(r.amountNeeded, r.currency)}
                        </span>
                      </div>
                      {r.amountReceived > 0 && (
                        <div className="received-text">
                          Received: {formatCurrency(r.amountReceived, r.currency)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="beneficiaries-info">
                        <Users size={14} />
                        <span>{r.beneficiariesCount}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusColor(r.status)}>
                        {r.status === 'verified' ? 'Approved' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Zakat Request Details</h2>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Requester</label>
                  <span>{selectedRequest.requesterName}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{selectedRequest.requesterEmail}</span>
                </div>
                <div className="detail-item">
                  <label>Organization</label>
                  <span>{selectedRequest.organization}</span>
                </div>
                <div className="detail-item">
                  <label>Request Title</label>
                  <span>{selectedRequest.title}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Description</label>
                  <span>{selectedRequest.description || 'No description provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Amount Needed</label>
                  <span>{formatCurrency(selectedRequest.amountNeeded, selectedRequest.currency)}</span>
                </div>
                <div className="detail-item">
                  <label>Amount Received</label>
                  <span>{formatCurrency(selectedRequest.amountReceived, selectedRequest.currency)}</span>
                </div>
                <div className="detail-item">
                  <label>Purpose</label>
                  <span>{selectedRequest.purpose || 'General assistance'}</span>
                </div>
                <div className="detail-item">
                  <label>Beneficiaries</label>
                  <span>{selectedRequest.beneficiariesCount} people</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <Badge variant={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status === 'verified' ? 'Approved' : selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
                <div className="detail-item">
                  <label>Requested At</label>
                  <span>{formatDate(selectedRequest.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZakatRequests;
