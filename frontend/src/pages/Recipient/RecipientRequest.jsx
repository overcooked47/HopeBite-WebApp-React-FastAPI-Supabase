import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Upload,
  MapPin,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context';
import { recipientAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import './RecipientRequest.css';

const RecipientRequest = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity_needed: '',
    unit: 'kg',
    delivery_address: '',
    city: '',
    state: '',
    country: 'Bangladesh',
    postal_code: '',
    urgency: 'medium',
    beneficiaries_count: '1',
    requires_halal: true,
    requires_vegetarian: false,
    requires_vegan: false,
    requires_gluten_free: false,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await recipientAPI.getMyRequests();
      setRequests(response.data.items || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.quantity_needed || parseInt(formData.quantity_needed) <= 0) {
      toast.error('Valid quantity is required');
      return;
    }
    if (!formData.delivery_address.trim()) {
      toast.error('Delivery address is required');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return;
    }

    try {
      setSubmitting(true);
      
      // Build payload with only required and populated optional fields
      const payload = {
        title: formData.title.trim(),
        quantity_needed: parseInt(formData.quantity_needed),
        unit: formData.unit || 'kg',
        delivery_address: formData.delivery_address.trim(),
        city: formData.city.trim(),
        urgency: formData.urgency.toLowerCase(),
        beneficiaries_count: parseInt(formData.beneficiaries_count) || 1,
        requires_vegetarian: formData.requires_vegetarian,
        requires_vegan: formData.requires_vegan,
        requires_halal: formData.requires_halal,
        requires_gluten_free: formData.requires_gluten_free,
      };

      // Only include optional fields if they have values
      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.state?.trim()) payload.state = formData.state.trim();
      if (formData.country?.trim()) payload.country = formData.country.trim();
      if (formData.postal_code?.trim()) payload.postal_code = formData.postal_code.trim();

      console.log('Sending payload:', payload);
      
      await recipientAPI.createRequest(payload);
      toast.success('Request posted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        quantity_needed: '',
        unit: 'kg',
        delivery_address: '',
        city: '',
        state: '',
        country: 'Bangladesh',
        postal_code: '',
        urgency: 'medium',
        beneficiaries_count: '1',
        requires_halal: true,
        requires_vegetarian: false,
        requires_vegan: false,
        requires_gluten_free: false,
      });
      
      // Refresh the requests list
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      console.error('Error response data:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to create request';
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return 'warning';
    if (status === 'fulfilled' || status === 'completed') return 'success';
    return 'secondary';
  };

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="request-page">
      <div className="request-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            <PlusCircle size={28} />
            Post a Food Request
          </h1>
          <p className="page-subtitle">Request food assistance. Contributors and admins will be notified.</p>
        </motion.div>
      </div>

      <Card className="request-form-card">
        <form onSubmit={handleSubmit}>
          {}
          <Input
            label="Title *"
            name="title"
            placeholder="e.g., Rice for 20 families"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              placeholder="Provide details of your request..."
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <Input
              label="Quantity Needed *"
              name="quantity_needed"
              type="number"
              placeholder="e.g., 10"
              value={formData.quantity_needed}
              onChange={handleChange}
              icon={<Package size={18} />}
              required
            />
            
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select 
                name="unit" 
                value={formData.unit} 
                onChange={handleChange}
                className="form-select"
              >
                <option value="kg">kg</option>
                <option value="servings">servings</option>
                <option value="packets">packets</option>
                <option value="boxes">boxes</option>
              </select>
            </div>
          </div>

          <Input
            label="Delivery Address *"
            name="delivery_address"
            placeholder="Full street address"
            value={formData.delivery_address}
            onChange={handleChange}
            icon={<MapPin size={18} />}
            required
          />

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="City *"
              name="city"
              placeholder="e.g., Dhaka"
              value={formData.city}
              onChange={handleChange}
              required
            />
            
            <Input
              label="State/Province"
              name="state"
              placeholder="e.g., Dhaka Division"
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select 
                name="urgency" 
                value={formData.urgency} 
                onChange={handleChange}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <Input
              label="Beneficiaries Count"
              name="beneficiaries_count"
              type="number"
              value={formData.beneficiaries_count}
              onChange={handleChange}
            />
          </div>

          {}
          <div className="form-group">
            <label className="form-label">Dietary Requirements</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requires_halal"
                  checked={formData.requires_halal}
                  onChange={handleChange}
                />
                Halal
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requires_vegetarian"
                  checked={formData.requires_vegetarian}
                  onChange={handleChange}
                />
                Vegetarian
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requires_vegan"
                  checked={formData.requires_vegan}
                  onChange={handleChange}
                />
                Vegan
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requires_gluten_free"
                  checked={formData.requires_gluten_free}
                  onChange={handleChange}
                />
                Gluten Free
              </label>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={submitting} leftIcon={<Upload size={18} />}>
            Submit Request
          </Button>
        </form>
      </Card>

      <h2>My Requests ({requests.length})</h2>
      <Card>
        <div className="my-requests-list">
          {requests.length === 0 ? (
            <p>No requests yet. Create your first request above!</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="request-item">
                <div className="request-details">
                  <h4 className="request-title">{r.title}</h4>
                  <p className="request-info">
                    {r.quantity_needed} {r.unit} • {r.city} • {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <p className="request-address">{r.delivery_address}</p>
                </div>
                <div className="request-meta">
                  <Badge variant={getStatusColor(r.status)} size="sm">
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default RecipientRequest;