import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  Heart,
  Users,
  Trophy,
  Settings,
  HelpCircle,
  MapPin,
  History,
  Wallet,
  BarChart3,
  Bell,
  FileText,
  ChevronLeft,
  ChevronRight,
  Truck,
  PlusCircle,
  Shield,
  User,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isCollapsed = false, onToggle = () => { } }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getDashboardLinks = () => {
    const commonLinks = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ];

    const roleLinks = {
      contributor: [
        { path: '/profile/contributor', icon: User, label: 'My Profile' },
        { path: '/donate', icon: Utensils, label: 'Donate Food' },
        { path: '/zakat', icon: Wallet, label: 'Donate Zakat' },
        { path: '/find-food', icon: MapPin, label: 'View Listings' },
        { path: '/dashboard/custom-requests', icon: ClipboardList, label: 'Custom Requests' },
        { path: '/dashboard/my-donations', icon: Heart, label: 'My Donations' },
        { path: '/dashboard/certificates', icon: FileText, label: 'Receipts & Ledger' },
      ],
      recipient: [
        { path: '/profile/recipient', icon: User, label: 'My Profile' },
        { path: '/find-food', icon: Utensils, label: 'Find Food' },
        { path: '/recipient/request', icon: PlusCircle, label: 'Post Request' },
        { path: '/zakat', icon: Wallet, label: 'Request Zakat' },
        { path: '/dashboard/my-requests', icon: Heart, label: 'My Requests' },
      ],
      volunteer: [
        { path: '/volunteer/deliveries', icon: Truck, label: 'My Deliveries' },
        { path: '/find-food', icon: Utensils, label: 'View Listings' },
        { path: '/dashboard/history', icon: History, label: 'Delivery History' },
        { path: '/dashboard/earnings', icon: Wallet, label: 'Proof & Status' },
      ],
      admin: [
        { path: '/dashboard/users', icon: Users, label: 'Users' },
        { path: '/dashboard/food-requests', icon: Shield, label: 'Food Requests' },
        { path: '/dashboard/zakat-requests', icon: Wallet, label: 'Zakat Requests' },
        { path: '/dashboard/custom-requests', icon: ClipboardList, label: 'Custom Requests' },
        { path: '/find-food', icon: Utensils, label: 'Food Listings' },
        { path: '/dashboard/volunteer-deliveries', icon: Truck, label: 'Volunteer Deliveries' },
        { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/dashboard/reports', icon: FileText, label: 'Reports' },
      ],
    };

    const userRole = user?.role || 'contributor';
    return [...(roleLinks[userRole] || []), ...commonLinks];
  };

  const links = getDashboardLinks();

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className="sidebar-icon" size={20} />
              {!isCollapsed && <span className="sidebar-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <button className="sidebar-toggle" onClick={onToggle}>
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  );
};

export default Sidebar;
