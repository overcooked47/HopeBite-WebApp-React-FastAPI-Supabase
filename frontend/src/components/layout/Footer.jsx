import { Link } from 'react-router-dom';
import {
  Heart,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Donate Food', path: '/donate' },
      { label: 'Find Food', path: '/find-food' },
      { label: 'Zakat Portal', path: '/zakat' },
      { label: 'Volunteer', path: '/volunteer' },
      { label: 'Leaderboard', path: '/leaderboard' },
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'How It Works', path: '/how-it-works' },
      { label: 'Impact', path: '/impact' },
      { label: 'Blog', path: '/blog' },
      { label: 'Careers', path: '/careers' },
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'FAQs', path: '/faqs' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <footer className="footer">
      <div className="footer-main container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <Heart className="logo-icon" />
            <span className="logo-text">
              Hope<span className="logo-highlight">Bite</span>
            </span>
          </Link>
          <p className="footer-tagline">
            Connecting surplus food with those in need. Together, we can end hunger
            and reduce food waste.
          </p>
          <div className="footer-contact">
            <a href="mailto:hello@hopebite.com" className="contact-item">
              <Mail size={18} />
              hello@hopebite.com
            </a>
            <a href="tel: +880234567890" className="contact-item">
              <Phone size={18} />
              +880 (234) 567-890
            </a>
            <span className="contact-item">
              <MapPin size={18} />
              123 Hope Street, Charity City
            </span>
          </div>
        </div>

        <div className="footer-links-section">
          <h4 className="footer-heading">Platform</h4>
          <ul className="footer-links">
            {footerLinks.platform.map((link) => (
              <li key={link.path}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-links-section">
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-links">
            {footerLinks.company.map((link) => (
              <li key={link.path}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-links-section">
          <h4 className="footer-heading">Support</h4>
          <ul className="footer-links">
            {footerLinks.support.map((link) => (
              <li key={link.path}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p className="copyright">
            © {currentYear} HopeBite. All rights reserved. Made with{' '}
            <Heart size={14} className="heart-icon" /> for humanity.
          </p>
          <div className="social-links">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.label}
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
