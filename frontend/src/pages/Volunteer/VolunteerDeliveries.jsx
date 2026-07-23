import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Camera,
  Upload,
  CheckCircle,
  Navigation,
  ChevronRight,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context';
import { useNotifications } from '../../context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './VolunteerDeliveries.css';

const VolunteerDeliveries = () => {
  const { user } = useAuth();
  const { deliveries, refresh } = useNotifications();
  const [proofImages, setProofImages] = useState([]);
  const [foodDescription, setFoodDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  
  useEffect(() => {
    refresh('deliveries');
    const interval = setInterval(() => {
      refresh('deliveries');
    }, 10000);

    return () => clearInterval(interval);
  }, [refresh]);

  
  const deliveriesList = deliveries || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-transit':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'delivered':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const handleProofUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + proofImages.length > 5) {
      toast.error('Maximum 5 proof images allowed');
      return;
    }
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setProofImages((prev) => [...prev, ...previews]);
    toast.success(`${files.length} image(s) added for proof`);
  };

  const submitProof = async () => {
    if (proofImages.length === 0) {
      toast.error('Please upload at least one proof image');
      return;
    }
    if (!foodDescription.trim()) {
      toast.error('Please provide a food description');
      return;
    }
    setUploading(true);
    
    
    const existingProofs = JSON.parse(localStorage.getItem('volunteerDeliveryProofs') || '[]');
    const newProof = {
      id: Date.now(),
      volunteerName: user?.name || user?.email || 'Unknown Volunteer',
      volunteerId: user?.id,
      foodDescription: foodDescription.trim(),
      images: proofImages.map(img => img.preview),
      submittedAt: new Date().toISOString(),
    };
    existingProofs.push(newProof);
    localStorage.setItem('volunteerDeliveryProofs', JSON.stringify(existingProofs));
    
    await new Promise((r) => setTimeout(r, 1500));
    
    
    await refresh('deliveries');
    
    toast.success('Proof submitted! Contributor and admin notified.');
    setProofImages([]);
    setFoodDescription('');
    setUploading(false);
  };

  const updateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.success(
          `Location updated: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      () => toast.error('Unable to retrieve location')
    );
  };

  return (
    <div className="deliveries-page">
      <div className="deliveries-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">
            <MapPin size={28} />
            My Deliveries
          </h1>
          <p className="page-subtitle">
            View assigned pickups and drop-offs, update your live location, and upload delivery proofs.
          </p>
        </motion.div>
      </div>

      <Button
        variant="secondary"
        leftIcon={<Navigation size={18} />}
        onClick={updateLocation}
        style={{ marginBottom: '1rem' }}
      >
        Update Live Location
      </Button>

      <Card>
        <div className="delivery-list">
          {deliveriesList.length > 0 ? (
            deliveriesList.map((d) => (
              <div key={d.id} className="delivery-item">
                <img src={d.image} alt={d.title} className="delivery-image" />
                <div className="delivery-details">
                  <h4 className="delivery-title">{d.title}</h4>
                  <p className="delivery-info">
                    <MapPin size={14} /> {d.pickupAddress} → {d.dropAddress}
                  </p>
                  <p className="delivery-info">
                    <Clock size={14} /> {d.time}
                  </p>
                </div>
                <div className="delivery-meta">
                  <Badge variant={getStatusColor(d.status)} size="sm">
                    {d.status}
                  </Badge>
                </div>
                <button className="delivery-action">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              <p>No deliveries assigned yet.</p>
            </div>
          )}
        </div>
      </Card>

      <div className="proof-section">
        <h3>Upload Delivery Proof</h3>
        <Card className="proof-upload">
          <label htmlFor="proof-upload">
            <input
              id="proof-upload"
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleProofUpload}
            />
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Camera size={18} />}
              as="span"
              style={{ cursor: 'pointer' }}
              onClick={() => document.getElementById('proof-upload').click()}
            >
              Add Proof Image
            </Button>
          </label>
          <div className="proof-preview">
            {proofImages.map((img, idx) => (
              <img key={idx} src={img.preview} alt={`proof-${idx + 1}`} />
            ))}
          </div>
          
          <div className="food-description-section">
            <label htmlFor="food-description" className="food-description-label">
              <FileText size={18} />
              Food Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="food-description"
              className="food-description-input"
              placeholder="Describe the food contents and quantity (e.g., 2 boxes of rice, 5 water bottles, 3 vegetable curry containers...)"
              value={foodDescription}
              onChange={(e) => setFoodDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          
          <Button
            variant="primary"
            leftIcon={<Upload size={18} />}
            onClick={submitProof}
            loading={uploading}
          >
            Submit Proof
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default VolunteerDeliveries;
