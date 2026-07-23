import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Utensils,
  Users,
  MapPin,
  Award,
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  Shield,
  Globe,
  Leaf,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import './Home.css';

const Home = () => {
  const stats = [
    { value: '50K+', label: 'Meals Donated', icon: Utensils },
    { value: '10K+', label: 'Active Donors', icon: Heart },
    { value: '500+', label: 'Partner NGOs', icon: Users },
    { value: '100+', label: 'Cities Covered', icon: MapPin },
  ];

  const features = [
    {
      icon: Utensils,
      title: 'Food Distribution',
      description: 'Connect surplus food from restaurants and events with verified shelters and NGOs.',
      color: 'purple',
    },
    {
      icon: Shield,
      title: 'Zakat Management',
      description: 'Secure, transparent Zakat payments with blockchain-inspired tracking.',
      color: 'orange',
    },
    {
      icon: Award,
      title: 'Recognition System',
      description: 'Earn badges, climb leaderboards, and get certificates for your contributions.',
      color: 'purple',
    },
    {
      icon: MapPin,
      title: 'Volunteer Network',
      description: 'Join our delivery network and help distribute food to those in need.',
      color: 'orange',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Post Food',
      description: 'Restaurants and individuals list surplus food with photos and pickup details.',
    },
    {
      step: '02',
      title: 'Match & Request',
      description: 'Verified NGOs browse and request food items based on their needs.',
    },
    {
      step: '03',
      title: 'Volunteer Pickup',
      description: 'Volunteers accept delivery tasks and pick up food from donors.',
    },
    {
      step: '04',
      title: 'Deliver & Track',
      description: 'Real-time tracking ensures food reaches those who need it most.',
    },
  ];

  const testimonials = [
    {
      quote: "HopeBite has transformed how we manage food donations. We've reduced waste by 80%!",
      author: 'Sarah Johnson',
      role: 'Restaurant Owner',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
    {
      quote: 'The platform makes it so easy to find and receive food for our shelter residents.',
      author: 'Michael Chen',
      role: 'NGO Director',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
    {
      quote: 'Volunteering on HopeBite is rewarding. I love seeing my impact in real-time.',
      author: 'Emily Brown',
      role: 'Volunteer',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    },
  ];

  const impactStats = [
    { icon: Utensils, value: '2.5M', label: 'Meals Served' },
    { icon: Leaf, value: '1,200', label: 'Tons CO₂ Saved' },
    { icon: Globe, value: '50+', label: 'Countries' },
    { icon: TrendingUp, value: '99%', label: 'Satisfaction Rate' },
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-pattern" />
        </div>
        <div className="container hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-badge">
              <Heart size={16} /> Fighting Hunger Together
            </span>
            <h1 className="hero-title">
              Transform <span className="text-gradient">Surplus Food</span> Into{' '}
              <span className="text-gradient">Hope</span>
            </h1>
            <p className="hero-subtitle">
              Connect food donors with those in need. Reduce waste, feed communities, and
              make a real impact with every donation.
            </p>
            <div className="hero-actions">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                <Link to="/register">Start Donating</Link>
              </Button>
            </div>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="hero-stat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <stat.icon className="stat-icon" size={24} />
                  <div>
                    <span className="stat-value">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="hero-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600"
                alt="Food donation"
              />
              <div className="floating-card floating-card-1">
                <Utensils size={20} />
                <span>+250 meals today</span>
              </div>
              <div className="floating-card floating-card-2">
                <Star size={20} />
                <span>Top Contributor</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="features section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">
              Everything You Need to <span className="text-gradient">Make a Difference</span>
            </h2>
            <p className="section-subtitle">
              Our comprehensive platform brings together donors, recipients, and volunteers
              for maximum impact.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover variant={feature.color} padding="lg" className="feature-card">
                  <div className={`feature-icon feature-icon-${feature.color}`}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <Link to="/features" className="feature-link">
                    Learn more <ArrowRight size={16} />
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="how-it-works section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">
              Simple Steps to <span className="text-gradient">Start Helping</span>
            </h2>
          </div>
          <div className="steps-grid">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                className="step-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <span className="step-number">{item.step}</span>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="impact section">
        <div className="impact-bg" />
        <div className="container">
          <div className="impact-content">
            <motion.div
              className="impact-text"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-badge section-badge-light">Our Impact</span>
              <h2 className="impact-title">Making a Real Difference in Communities</h2>
              <p className="impact-subtitle">
                Every donation creates a ripple effect. See how our community is changing
                lives and protecting the planet.
              </p>
              <div className="impact-stats">
                {impactStats.map((stat, index) => (
                  <div key={stat.label} className="impact-stat">
                    <stat.icon size={24} />
                    <span className="impact-value">{stat.value}</span>
                    <span className="impact-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="impact-visual"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600"
                alt="Community impact"
              />
            </motion.div>
          </div>
        </div>
      </section>
      <section className="testimonials section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">
              Loved by <span className="text-gradient">Thousands</span>
            </h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover padding="lg" className="testimonial-card">
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="var(--secondary-orange)" color="var(--secondary-orange)" />
                    ))}
                  </div>
                  <p className="testimonial-quote">"{testimonial.quote}"</p>
                  <div className="testimonial-author">
                    <img src={testimonial.avatar} alt={testimonial.author} />
                    <div>
                      <h4>{testimonial.author}</h4>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="cta section">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title">Ready to Make an Impact?</h2>
            <p className="cta-subtitle">
              Join thousands of donors, volunteers, and organizations fighting hunger together.
            </p>
            <div className="cta-actions">
              <Button variant="primary" size="xl" rightIcon={<ArrowRight size={20} />}>
                <Link to="/register">Get Started Free</Link>
              </Button>
              <Button variant="ghost" size="xl">
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
