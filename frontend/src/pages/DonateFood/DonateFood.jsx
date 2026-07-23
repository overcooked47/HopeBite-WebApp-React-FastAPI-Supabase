import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Camera,
  Calendar,
  Clock,
  MapPin,
  Package,
  Utensils,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
} from 'lucide-react';
import { useNotifications } from '../../context';
import { contributorAPI } from '../../services/api';
import { supabase } from '../../supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import './DonateFood.css';

const DonateFood = () => {
  const { donations, refresh } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    pickupDate: '',
    pickupTimeStart: '',
    pickupTimeEnd: '',
    address: '',
    additionalNotes: '',
    isPerishable: false,
    needsRefrigeration: false,
    isVegetarian: false,
    isHalal: false,
  });
  const [errors, setErrors] = useState({});

  
  useEffect(() => {
    refresh('donations');
    const interval = setInterval(() => {
      refresh('donations');
    }, 10000);

    return () => clearInterval(interval);
  }, [refresh]);

  const categories = [
    { id: 'cooked', label: 'Cooked Meals', icon: '🍲' },
    { id: 'raw', label: 'Raw Ingredients', icon: '🥬' },
    { id: 'bakery', label: 'Bakery Items', icon: '🥖' },
    { id: 'dairy', label: 'Dairy Products', icon: '🥛' },
    { id: 'fruits', label: 'Fruits & Vegetables', icon: '🍎' },
    { id: 'canned', label: 'Canned Goods', icon: '🥫' },
    { id: 'beverages', label: 'Beverages', icon: '🥤' },
    { id: 'other', label: 'Other', icon: '📦' },
  ];

  const units = ['kg', 'lbs', 'items', 'portions', 'liters', 'boxes'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const selectCategory = (categoryId) => {
    setFormData((prev) => ({ ...prev, category: categoryId }));
    setErrors((prev) => ({ ...prev, category: '' }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (images.length === 0) newErrors.images = 'Please add at least one image';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.pickupDate) newErrors.pickupDate = 'Pickup date is required';
    if (!formData.pickupTimeStart) newErrors.pickupTimeStart = 'Start time is required';
    if (!formData.pickupTimeEnd) newErrors.pickupTimeEnd = 'End time is required';
    if (!formData.address.trim()) newErrors.address = 'Pickup address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      
      
      const categoryMap = {
        cooked: 'cooked_meals',
        raw: 'raw_ingredients',
        bakery: 'bakery',
        dairy: 'dairy',
        fruits: 'fruits_vegetables',
        canned: 'packaged_food',
        beverages: 'beverages',
        other: 'other',
      };

      
      let imageUrl = null;
      if (images.length > 0 && images[0].file) {
        try {
          const file = images[0].file;
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `donations/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('food-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.warn('Image upload failed:', uploadError);
            
          } else {
            
            const { data: urlData } = supabase.storage
              .from('food-images')
              .getPublicUrl(filePath);
            imageUrl = urlData?.publicUrl || null;
            console.log('Image uploaded successfully:', imageUrl);
          }
        } catch (imgError) {
          console.warn('Image upload error:', imgError);
          
        }
      }

      const payload = {
        title: formData.title,
        description: formData.description || null,
        category: categoryMap[formData.category] || 'other', 
        quantity: parseInt(formData.quantity),
        quantity_unit: formData.unit, 
        expiry_date: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
        pickup_address: formData.address,
        city: 'Dhaka', 
        pickup_time_start: formData.pickupDate && formData.pickupTimeStart
          ? new Date(`${formData.pickupDate}T${formData.pickupTimeStart}`).toISOString()
          : new Date().toISOString(),
        pickup_time_end: formData.pickupDate && formData.pickupTimeEnd
          ? new Date(`${formData.pickupDate}T${formData.pickupTimeEnd}`).toISOString()
          : new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), 
        special_instructions: formData.additionalNotes || null,
        is_vegetarian: formData.isVegetarian,
        is_halal: formData.isHalal,
        is_vegan: false,
        image_url: imageUrl, 
      };

      console.log('Submitting donation:', payload);

      await contributorAPI.createDonation(payload);
      toast.success('Food donation posted successfully!');

      
      await refresh('donations');

      
      setFormData({
        title: '',
        description: '',
        category: '',
        quantity: '',
        unit: 'kg',
        expiryDate: '',
        pickupDate: '',
        pickupTimeStart: '',
        pickupTimeEnd: '',
        address: '',
        additionalNotes: '',
        isPerishable: false,
        needsRefrigeration: false,
        isVegetarian: false,
        isHalal: false,
      });
      setImages([]);
      setStep(1);
    } catch (error) {
      console.error('Error posting donation:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to post donation. Please try again.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-food-page">
      <div className="donate-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">
            <Plus size={28} />
            Donate Food
          </h1>
          <p className="page-subtitle">
            Help reduce food waste and feed those in need by donating your surplus food.
          </p>
        </motion.div>
      </div>

      <div className="donate-steps">
        {['Food Details', 'Pickup Info', 'Review'].map((label, index) => (
          <div
            key={label}
            className={`donate-step ${index + 1 === step ? 'active' : ''} ${index + 1 < step ? 'completed' : ''}`}
          >
            <span className="step-number">
              {index + 1 < step ? <CheckCircle size={20} /> : index + 1}
            </span>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      <Card className="donate-form-card">
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="form-step"
            >
              <h2 className="form-step-title">Food Details</h2>
              <div className="image-upload-section">
                <label className="image-upload-label">
                  <Camera size={20} />
                  Food Images
                  <span className="required">*</span>
                </label>
                <div className="image-upload-area">
                  {images.map((img, index) => (
                    <div key={index} className="image-preview">
                      <img src={img.preview} alt={`Food ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="image-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        hidden
                      />
                      <Upload size={24} />
                      <span>Add Photo</span>
                    </label>
                  )}
                </div>
                {errors.images && <span className="error-text">{errors.images}</span>}
                <p className="image-hint">Add up to 5 clear photos of the food items</p>
              </div>

              <Input
                label="Title"
                name="title"
                placeholder="e.g., Fresh Vegetable Pack, Bakery Items"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                icon={<Utensils size={20} />}
                required
              />
              <div className="form-group">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <div className="category-grid">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`category-item ${formData.category === cat.id ? 'selected' : ''}`}
                      onClick={() => selectCategory(cat.id)}
                    >
                      <span className="category-icon">{cat.icon}</span>
                      <span className="category-label">{cat.label}</span>
                    </div>
                  ))}
                </div>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-row">
                <Input
                  label="Quantity"
                  name="quantity"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.quantity}
                  onChange={handleChange}
                  error={errors.quantity}
                  icon={<Package size={20} />}
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
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Expiry Date (if applicable)"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                icon={<Calendar size={20} />}
              />

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  placeholder="Describe the food items, ingredients, cooking method, etc."
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Food Tags</label>
                <div className="tags-grid">
                  <label className="tag-checkbox">
                    <input
                      type="checkbox"
                      name="isPerishable"
                      checked={formData.isPerishable}
                      onChange={handleChange}
                    />
                    <span>🕐 Perishable</span>
                  </label>
                  <label className="tag-checkbox">
                    <input
                      type="checkbox"
                      name="needsRefrigeration"
                      checked={formData.needsRefrigeration}
                      onChange={handleChange}
                    />
                    <span>❄️ Needs Refrigeration</span>
                  </label>
                  <label className="tag-checkbox">
                    <input
                      type="checkbox"
                      name="isVegetarian"
                      checked={formData.isVegetarian}
                      onChange={handleChange}
                    />
                    <span>🥬 Vegetarian</span>
                  </label>
                  <label className="tag-checkbox">
                    <input
                      type="checkbox"
                      name="isHalal"
                      checked={formData.isHalal}
                      onChange={handleChange}
                    />
                    <span>☪️ Halal</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <Button type="button" variant="primary" size="lg" onClick={nextStep}>
                  Continue to Pickup Info
                </Button>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="form-step"
            >
              <h2 className="form-step-title">Pickup Information</h2>

              <Input
                label="Pickup Date"
                name="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={handleChange}
                error={errors.pickupDate}
                icon={<Calendar size={20} />}
                required
              />

              <div className="form-row">
                <Input
                  label="Available From"
                  name="pickupTimeStart"
                  type="time"
                  value={formData.pickupTimeStart}
                  onChange={handleChange}
                  error={errors.pickupTimeStart}
                  icon={<Clock size={20} />}
                  required
                />
                <Input
                  label="Available Until"
                  name="pickupTimeEnd"
                  type="time"
                  value={formData.pickupTimeEnd}
                  onChange={handleChange}
                  error={errors.pickupTimeEnd}
                  icon={<Clock size={20} />}
                  required
                />
              </div>

              <Input
                label="Pickup Address"
                name="address"
                placeholder="Enter full pickup address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                icon={<MapPin size={20} />}
                required
              />
              <div className="map-placeholder">
                <MapPin size={32} />
                <p>Map will be displayed here</p>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes for Pickup</label>
                <textarea
                  name="additionalNotes"
                  placeholder="e.g., Ring doorbell, ask for John, entrance is at the back"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-actions two-buttons">
                <Button type="button" variant="secondary" size="lg" onClick={prevStep}>
                  Back
                </Button>
                <Button type="button" variant="primary" size="lg" onClick={nextStep}>
                  Review Donation
                </Button>
              </div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="form-step"
            >
              <h2 className="form-step-title">Review Your Donation</h2>

              <div className="review-section">
                <h3 className="review-title">Food Details</h3>
                <div className="review-images">
                  {images.map((img, index) => (
                    <img key={index} src={img.preview} alt={`Food ${index + 1}`} />
                  ))}
                </div>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Title</span>
                    <span className="review-value">{formData.title}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Category</span>
                    <span className="review-value">
                      {categories.find((c) => c.id === formData.category)?.label}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Quantity</span>
                    <span className="review-value">{formData.quantity} {formData.unit}</span>
                  </div>
                  {formData.expiryDate && (
                    <div className="review-item">
                      <span className="review-label">Expiry Date</span>
                      <span className="review-value">{formData.expiryDate}</span>
                    </div>
                  )}
                </div>
                {formData.description && (
                  <div className="review-item full-width">
                    <span className="review-label">Description</span>
                    <span className="review-value">{formData.description}</span>
                  </div>
                )}
                <div className="review-tags">
                  {formData.isPerishable && <span className="review-tag">🕐 Perishable</span>}
                  {formData.needsRefrigeration && <span className="review-tag">❄️ Needs Refrigeration</span>}
                  {formData.isVegetarian && <span className="review-tag">🥬 Vegetarian</span>}
                  {formData.isHalal && <span className="review-tag">☪️ Halal</span>}
                </div>
              </div>

              <div className="review-section">
                <h3 className="review-title">Pickup Information</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Date</span>
                    <span className="review-value">{formData.pickupDate}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Time</span>
                    <span className="review-value">
                      {formData.pickupTimeStart} - {formData.pickupTimeEnd}
                    </span>
                  </div>
                  <div className="review-item full-width">
                    <span className="review-label">Address</span>
                    <span className="review-value">{formData.address}</span>
                  </div>
                </div>
                {formData.additionalNotes && (
                  <div className="review-item full-width">
                    <span className="review-label">Notes</span>
                    <span className="review-value">{formData.additionalNotes}</span>
                  </div>
                )}
              </div>

              <div className="review-notice">
                <AlertCircle size={20} />
                <p>
                  By posting this donation, you confirm that the food is safe for consumption
                  and the information provided is accurate.
                </p>
              </div>

              <div className="form-actions two-buttons">
                <Button type="button" variant="secondary" size="lg" onClick={prevStep}>
                  Edit
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  leftIcon={<CheckCircle size={20} />}
                >
                  Post Donation
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default DonateFood;
