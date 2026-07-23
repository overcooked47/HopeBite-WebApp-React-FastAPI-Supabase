import { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Eye, 
  Clock, 
  User, 
  FileText,
  RefreshCw,
  Image,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from '../../context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import './Admin.css';

const AdminVolunteerDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchDeliveryProofs();
  }, []);

  const fetchDeliveryProofs = () => {
    setLoading(true);
    try {
      
      const proofs = JSON.parse(localStorage.getItem('volunteerDeliveryProofs') || '[]');
      
      proofs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setDeliveries(proofs);
    } catch (error) {
      console.error('Failed to fetch delivery proofs:', error);
      toast.error('Failed to load delivery proofs');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = 
      d.volunteerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.foodDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
  };

  const closeModal = () => {
    setSelectedDelivery(null);
  };

  return (
    <div className="admin-volunteer-deliveries">
      <div className="admin-header">
        <div className="header-title-section">
          <h1 className="admin-title">
            <Truck size={24} />
            Volunteer Deliveries
          </h1>
          <p className="admin-subtitle">
            View all delivery proofs submitted by volunteers
          </p>
        </div>
        <div className="header-actions">
          <Badge variant="primary" size="lg">
            {deliveries.length} {deliveries.length === 1 ? 'Delivery' : 'Deliveries'}
          </Badge>
        </div>
      </div>

      <Card className="admin-filters-card">
        <div className="admin-filters">
          <div className="search-filter">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by volunteer name or food description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchDeliveryProofs}
          >
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="admin-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading delivery proofs...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} />
            <h3>No Delivery Proofs Found</h3>
            <p>
              {searchTerm
                ? 'No deliveries match your search criteria.'
                : 'No delivery proofs have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="deliveries-list">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="delivery-card">
                <div className="delivery-card-header">
                  <div className="volunteer-info">
                    <User size={18} />
                    <span className="volunteer-name">{delivery.volunteerName}</span>
                  </div>
                  <div className="delivery-date">
                    <Calendar size={14} />
                    <span>{formatDate(delivery.submittedAt)}</span>
                  </div>
                </div>
                
                <div className="delivery-card-body">
                  <div className="delivery-images">
                    {delivery.images && delivery.images.length > 0 ? (
                      delivery.images.slice(0, 3).map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Delivery proof ${idx + 1}`}
                          className="delivery-thumbnail"
                          onClick={() => handleViewDetails(delivery)}
                        />
                      ))
                    ) : (
                      <div className="no-image">
                        <Image size={24} />
                        <span>No images</span>
                      </div>
                    )}
                    {delivery.images && delivery.images.length > 3 && (
                      <div className="more-images" onClick={() => handleViewDetails(delivery)}>
                        +{delivery.images.length - 3} more
                      </div>
                    )}
                  </div>
                  
                  <div className="food-description-preview">
                    <FileText size={16} />
                    <p>{delivery.foodDescription}</p>
                  </div>
                </div>
                
                <div className="delivery-card-footer">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye size={14} />}
                    onClick={() => handleViewDetails(delivery)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {}
      {selectedDelivery && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content delivery-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Truck size={20} />
                Delivery Proof Details
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>
                  <User size={16} />
                  Volunteer
                </h4>
                <p className="detail-value">{selectedDelivery.volunteerName}</p>
              </div>
              
              <div className="detail-section">
                <h4>
                  <Calendar size={16} />
                  Submitted At
                </h4>
                <p className="detail-value">{formatDate(selectedDelivery.submittedAt)}</p>
              </div>
              
              <div className="detail-section">
                <h4>
                  <FileText size={16} />
                  Food Description
                </h4>
                <p className="detail-value food-description-full">{selectedDelivery.foodDescription}</p>
              </div>
              
              <div className="detail-section">
                <h4>
                  <Image size={16} />
                  Proof Images
                </h4>
                <div className="proof-images-grid">
                  {selectedDelivery.images && selectedDelivery.images.length > 0 ? (
                    selectedDelivery.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Delivery proof ${idx + 1}`}
                        className="proof-image-full"
                      />
                    ))
                  ) : (
                    <p className="no-images-text">No images uploaded</p>
                  )}
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

export default AdminVolunteerDeliveries;
