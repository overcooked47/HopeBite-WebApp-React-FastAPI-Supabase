import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Package,
  Heart,
  ChevronRight,
  Grid,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context';
import api, { claimsAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import './FindFood.css';

const FindFood = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [foodListings, setFoodListings] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    distance: '',
    dietary: [],
  });

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'cooked', label: 'Cooked Meals' },
    { id: 'raw', label: 'Raw Ingredients' },
    { id: 'bakery', label: 'Bakery Items' },
    { id: 'dairy', label: 'Dairy Products' },
    { id: 'fruits', label: 'Fruits & Vegetables' },
    { id: 'canned', label: 'Canned Goods' },
    { id: 'beverages', label: 'Beverages' },
  ];

  
  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/donations/');
      const items = response.data?.items || [];

      
      const transformedListings = items.map((donation) => ({
        id: donation.id,
        title: donation.title || 'Food Donation',
        description: donation.description || '',
        donor: donation.donor?.full_name || 'Anonymous Donor',
        location: donation.city || donation.pickup_address || 'Unknown',
        distance: 'N/A', 
        quantity: `${donation.quantity} ${donation.quantity_unit || 'items'}`,
        category: (donation.category || 'other').toLowerCase(),
        expiresIn: donation.expiry_date
          ? getTimeUntil(donation.expiry_date)
          : 'N/A',
        postedAt: getTimeAgo(donation.created_at),
        image: donation.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        tags: [
          ...(donation.is_vegetarian ? ['Vegetarian'] : []),
          ...(donation.is_halal ? ['Halal'] : []),
          ...(donation.is_vegan ? ['Vegan'] : []),
        ],
        status: (donation.status || 'available').toLowerCase(),
      }));

      setFoodListings(transformedListings);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load food listings');
    } finally {
      setLoading(false);
    }
  };

  
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  
  const getTimeUntil = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    if (diffMs < 0) return 'Expired';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours} hours`;
    return `${diffDays} days`;
  };

  const filteredListings = foodListings.filter((listing) => {
    if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && listing.category !== filters.category) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', distance: '', dietary: [] });
    setSearchQuery('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'claimed': return 'warning';
      case 'expired': return 'danger';
      default: return 'default';
    }
  };

  const handleRequest = async (listing) => {
    if (user?.role !== 'recipient') {
      toast.error('Only recipients can request items.');
      return;
    }

    try {
      
      
      const quantityNum = parseInt(listing.quantity) || 1;
      
      await claimsAPI.createClaim({
        donation_id: listing.id,
        quantity_requested: quantityNum,
        message: `Requested via Find Food page`,
      });
      
      toast.success(`${listing.title} requested successfully! Admin and contributor have been notified.`);
      
      
      fetchDonations();
    } catch (error) {
      console.error('Error requesting food:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to request food. Please try again.';
      toast.error(errorMsg);
    }
  };

  const canRequest = user?.role === 'recipient';

  return (
    <div className="find-food-page">
      <div className="find-food-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">Find Food</h1>
          <p className="page-subtitle">
            Browse available food donations near you and request what you need.
          </p>
        </motion.div>
      </div>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={18} />
            </button>
          )}
        </div>
        <Button
          variant="secondary"
          leftIcon={<SlidersHorizontal size={18} />}
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'active' : ''}
        >
          Filters
        </Button>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      {showFilters && (
        <motion.div
          className="filters-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="filter-options">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-option ${filters.category === cat.id ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Distance</label>
            <div className="filter-options">
              {['1 km', '5 km', '10 km', '25 km', 'Any'].map((dist) => (
                <button
                  key={dist}
                  className={`filter-option ${filters.distance === dist ? 'active' : ''}`}
                  onClick={() => handleFilterChange('distance', dist)}
                >
                  {dist}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-actions">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </motion.div>
      )}

      <div className="results-info">
        <span>{filteredListings.length} items found</span>
        {(searchQuery || filters.category || filters.distance) && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear all filters
          </button>
        )}
      </div>
      <div className={`food-listings ${viewMode}`}>
        {filteredListings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover className="food-card">
              <div className="food-image">
                <img src={listing.image} alt={listing.title} />
                <Badge
                  variant={getStatusColor(listing.status)}
                  className="status-badge"
                >
                  {listing.status}
                </Badge>
                <button className="favorite-btn">
                  <Heart size={20} />
                </button>
              </div>
              <div className="food-content">
                <div className="food-header">
                  <h3 className="food-title">{listing.title}</h3>
                  <span className="food-posted">{listing.postedAt}</span>
                </div>
                <p className="food-description">{listing.description}</p>
                <div className="food-tags">
                  {listing.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="food-meta">
                  <span className="meta-item">
                    <MapPin size={14} />
                    {listing.distance}
                  </span>
                  <span className="meta-item">
                    <Package size={14} />
                    {listing.quantity}
                  </span>
                  <span className="meta-item">
                    <Clock size={14} />
                    Expires in {listing.expiresIn}
                  </span>
                </div>
                <div className="food-footer">
                  <div className="donor-info">
                    <span className="donor-name">{listing.donor}</span>
                    <span className="donor-location">{listing.location}</span>
                  </div>
                  <Button
                    variant={listing.status === 'available' ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={listing.status !== 'available' || !canRequest}
                    rightIcon={<ChevronRight size={16} />}
                    onClick={() => handleRequest(listing)}
                  >
                    {listing.status === 'available' ? (canRequest ? 'Request' : 'View Only') : 'Claimed'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <div className="no-results">
          <Package size={48} />
          <h3>No food items found</h3>
          <p>Try adjusting your search or filters to find what you need.</p>
          <Button variant="primary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default FindFood;
