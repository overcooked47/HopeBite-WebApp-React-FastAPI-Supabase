import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Utensils,
  TrendingUp,
  Award,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  Plus,
  Filter,
  ChevronRight,
  MapPin,
  Heart,
  Star,
} from 'lucide-react';
import { useAuth } from '../../context';
import { useNotifications } from '../../context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import './Dashboard.css';

const Dashboard = () => {
  const { user, permissions } = useAuth();
  const { donations, requests, deliveries, leaderboard, notifications } = useNotifications();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const isAdmin = user?.role === 'admin';
  const isContributor = user?.role === 'contributor';
  const isRecipient = user?.role === 'recipient';
  const isVolunteer = user?.role === 'volunteer';

  
  const achievements = [
    { id: 1, name: 'First Donation', icon: '🎉', unlocked: true },
    { id: 2, name: 'Helper', icon: '🤝', unlocked: true },
    { id: 3, name: 'Impact Maker', icon: '⭐', unlocked: true },
    { id: 4, name: 'Champion', icon: '🏆', unlocked: false },
    { id: 5, name: 'Legend', icon: '👑', unlocked: false },
  ];

  
  const calculateStats = () => {
    if (isAdmin) {
      return [
        {
          title: 'Total Donations',
          value: donations?.length || '0',
          change: '+12.5%',
          trend: 'up',
          icon: Utensils,
          color: 'purple',
        },
        {
          title: 'Total Requests',
          value: requests?.length || '0',
          change: '+8.2%',
          trend: 'up',
          icon: Users,
          color: 'orange',
        },
        {
          title: 'Deliveries',
          value: deliveries?.length || '0',
          change: '-2.4%',
          trend: 'down',
          icon: Heart,
          color: 'purple',
        },
        {
          title: 'Top Contributor',
          value: leaderboard?.[0]?.name || 'N/A',
          change: leaderboard?.[0]?.score || '0',
          trend: 'up',
          icon: Award,
          color: 'orange',
        },
      ];
    } else if (isContributor) {
      const myDonations = donations?.length || 0;
      return [
        {
          title: 'My Donations',
          value: myDonations,
          change: '+12.5%',
          trend: 'up',
          icon: Utensils,
          color: 'purple',
        },
        {
          title: 'Total Quantity',
          value: donations?.reduce((sum, d) => sum + (parseInt(d.quantity) || 0), 0) || '0',
          change: '+8.2%',
          trend: 'up',
          icon: Users,
          color: 'orange',
        },
        {
          title: 'Active Deliveries',
          value: deliveries?.filter((d) => d.status === 'in-transit')?.length || '0',
          change: '-2.4%',
          trend: 'down',
          icon: Heart,
          color: 'purple',
        },
        {
          title: 'Leaderboard Rank',
          value: leaderboard?.findIndex((u) => u.isCurrentUser) + 1 || 'N/A',
          change: leaderboard?.find((u) => u.isCurrentUser)?.change || '0',
          trend: 'up',
          icon: Award,
          color: 'orange',
        },
      ];
    } else if (isRecipient) {
      return [
        {
          title: 'My Requests',
          value: requests?.length || '0',
          change: '+12.5%',
          trend: 'up',
          icon: Utensils,
          color: 'purple',
        },
        {
          title: 'Fulfilled',
          value: requests?.filter((r) => r.status === 'fulfilled')?.length || '0',
          change: '+8.2%',
          trend: 'up',
          icon: Users,
          color: 'orange',
        },
        {
          title: 'Pending',
          value: requests?.filter((r) => r.status === 'pending')?.length || '0',
          change: '-2.4%',
          trend: 'down',
          icon: Heart,
          color: 'purple',
        },
        {
          title: 'Impact Score',
          value: '92',
          change: '+5.1%',
          trend: 'up',
          icon: Award,
          color: 'orange',
        },
      ];
    }
    return [];
  };

  const stats = calculateStats();

  
  const recentDonations = donations?.slice(0, 3) || [];

  
  const upcomingTasks = deliveries?.filter((d) => d.status !== 'delivered')?.slice(0, 3) || [];

  
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'claimed': return 'warning';
      case 'in-transit': return 'primary';
      case 'pending': return 'warning';
      case 'delivered': return 'secondary';
      case 'fulfilled': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="dashboard-title">
              Welcome back, <span className="text-gradient">{user?.name || 'User'}</span>!
            </h1>
            <p className="dashboard-subtitle">
              {isAdmin && 'You have full admin access to manage everything.'}
              {isContributor && "Here's what's happening with your donations today."}
              {isRecipient && 'Check available food and track your requests.'}
              {isVolunteer && 'Check your deliveries and keep location updated.'}
            </p>
          </motion.div>
          <div className="header-actions">
            <div className="period-selector">
              {['day', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            {isContributor && (
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                New Donation
              </Button>
            )}
            {isRecipient && (
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                Post Request
              </Button>
            )}
            {isVolunteer && (
              <Button variant="primary" leftIcon={<MapPin size={18} />}>
                View Deliveries
              </Button>
            )}
            {isAdmin && (
              <Button variant="secondary" leftIcon={<Filter size={18} />}>
                View All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className={`stat-change ${stat.trend}`}>
                  {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {stat.change}
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="content-left">
          <Card className="donations-card">
            <div className="card-header">
              <h2 className="card-title">
                <Utensils size={20} />
                Recent Donations
              </h2>
              <Button variant="ghost" size="sm" rightIcon={<Filter size={16} />}>
                Filter
              </Button>
            </div>
            <div className="donations-list">
              {recentDonations.map((donation) => (
                <div key={donation.id} className="donation-item">
                  <img src={donation.image} alt={donation.title} className="donation-image" />
                  <div className="donation-details">
                    <h4 className="donation-title">{donation.title}</h4>
                    <p className="donation-info">
                      <span>{donation.donor}</span>
                      <span className="dot">•</span>
                      <MapPin size={12} />
                      <span>{donation.location}</span>
                    </p>
                  </div>
                  <div className="donation-meta">
                    <Badge variant={getStatusColor(donation.status)} size="sm">
                      {donation.status}
                    </Badge>
                    <span className="donation-time">{donation.time}</span>
                  </div>
                  <button className="donation-action">
                    <ChevronRight size={20} />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="ghost" fullWidth className="see-all-btn">
              See All Donations
            </Button>
          </Card>

          <Card className="chart-card">
            <div className="card-header">
              <h2 className="card-title">
                <TrendingUp size={20} />
                Donation Activity
              </h2>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-dot purple"></span>
                  Donations
                </span>
                <span className="legend-item">
                  <span className="legend-dot orange"></span>
                  Deliveries
                </span>
              </div>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {[65, 45, 75, 55, 85, 70, 90].map((height, i) => (
                  <div key={i} className="chart-bar-group">
                    <div className="chart-bar purple" style={{ height: `${height}%` }}></div>
                    <div className="chart-bar orange" style={{ height: `${height * 0.7}%` }}></div>
                  </div>
                ))}
              </div>
              <div className="chart-labels">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="content-right">
          <Card className="tasks-card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar size={20} />
                Upcoming Tasks
              </h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="tasks-list">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className={`task-indicator ${task.type}`}></div>
                  <div className="task-details">
                    <h4 className="task-title">{task.title}</h4>
                    <p className="task-time">
                      <Clock size={12} />
                      {task.time} - {task.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="achievements-card">
            <div className="card-header">
              <h2 className="card-title">
                <Award size={20} />
                Achievements
              </h2>
              <Badge variant="primary" size="sm">3/5 Unlocked</Badge>
            </div>
            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <span className="achievement-icon">{achievement.icon}</span>
                  <span className="achievement-name">{achievement.name}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="leaderboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <Star size={20} />
                Leaderboard
              </h2>
              <Button variant="ghost" size="sm">
                This Week
              </Button>
            </div>
            <div className="leaderboard-list">
              {leaderboard.map((item) => (
                <div
                  key={item.rank}
                  className={`leaderboard-item ${item.isUser ? 'is-user' : ''}`}
                >
                  <span className={`leaderboard-rank rank-${item.rank}`}>
                    {item.rank}
                  </span>
                  <Avatar src={item.avatar} name={item.name} size="sm" />
                  <span className="leaderboard-name">{item.name}</span>
                  <span className="leaderboard-score">{item.score} pts</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {isAdmin && (
        <Card className="admin-panel">
          <div className="card-header">
            <h2 className="card-title">
              <Users size={20} />
              Admin Panel
            </h2>
          </div>
          <p className="admin-info">
            You have full access. View all listings, zakat ledgers, volunteer proofs and more via the sidebar.
          </p>
        </Card>
      )}

      {isContributor && (
        <Card className="contributor-panel">
          <div className="card-header">
            <h2 className="card-title">
              <Utensils size={20} />
              Contributor Tools
            </h2>
          </div>
          <p className="contributor-info">
            Track your donations, view delivery status, and download receipts from My Donations.
          </p>
        </Card>
      )}

      {isRecipient && (
        <Card className="recipient-panel">
          <div className="card-header">
            <h2 className="card-title">
              <Heart size={20} />
              Recipient Actions
            </h2>
          </div>
          <p className="recipient-info">
            Post a food/zakat request. Contributors will receive notifications. Use My Requests to track.
          </p>
        </Card>
      )}

      {isVolunteer && (
        <Card className="volunteer-panel">
          <div className="card-header">
            <h2 className="card-title">
              <MapPin size={20} />
              Volunteer Tasks
            </h2>
          </div>
          <p className="volunteer-info">
            Check your assigned deliveries, update live location, and upload proof images in Deliveries.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
