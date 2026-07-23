import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Star,
  Award,
  TrendingUp,
  Filter,
  ChevronDown,
  Utensils,
  Heart,
  Truck,
} from 'lucide-react';
import { useNotifications } from '../../context';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './Leaderboard.css';

const Leaderboard = () => {
  const { leaderboard, refresh } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [displayData, setDisplayData] = useState([]);

  
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      
      let filtered = [...leaderboard];

      if (selectedCategory !== 'all') {
        filtered = filtered.filter((user) => user.category === selectedCategory || selectedCategory === 'donors');
      }

      
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));

      
      filtered = filtered.map((user, index) => ({
        ...user,
        rank: user.rank || index + 1,
      }));

      setDisplayData(filtered);
    } else {
      setDisplayData([]);
    }
  }, [leaderboard, selectedCategory, selectedPeriod]);

  
  useEffect(() => {
    refresh('leaderboard');
    const interval = setInterval(() => {
      refresh('leaderboard');
    }, 10000); 

    return () => clearInterval(interval);
  }, [refresh]);

  const categories = [
    { id: 'all', label: 'All Users', icon: Star },
    { id: 'donors', label: 'Top Donors', icon: Utensils },
    { id: 'volunteers', label: 'Top Volunteers', icon: Truck },
    { id: 'ngos', label: 'Top NGOs', icon: Heart },
  ];

  const periods = ['week', 'month', 'year', 'all-time'];

  
  const topThree = displayData.slice(0, 3).map((user) => {
    const badges = ['gold', 'silver', 'bronze'];
    return { ...user, badge: badges[user.rank - 1] || 'default' };
  });

  
  const leaderboardTableData = displayData.slice(3, 13);

  
  const userRank = displayData.find((u) => u.isCurrentUser) || {
    rank: Math.max(...displayData.map((u) => u.rank || 0), 0) + 1,
    name: 'You',
    score: 0,
    donations: 0,
    change: '0',
    isCurrentUser: true,
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return 'default';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy size={24} />;
      case 2: return <Medal size={24} />;
      case 3: return <Award size={24} />;
      default: return rank;
    }
  };

  
  const achievements = [
    { id: 1, name: 'First Donation', icon: '🎉', description: 'Made your first donation', unlocked: true },
    { id: 2, name: 'Helper', icon: '🤝', description: 'Completed 5 deliveries', unlocked: true },
    { id: 3, name: 'Impact Maker', icon: '⭐', description: 'Reached 100 points', unlocked: true },
    { id: 4, name: 'Champion', icon: '🏆', description: 'Reached top 10 leaderboard', unlocked: false },
    { id: 5, name: 'Legend', icon: '👑', description: 'Become #1 contributor', unlocked: false },
  ];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">
            <Trophy size={28} className="title-icon" />
            Leaderboard
          </h1>
          <p className="page-subtitle">
            See who's making the biggest impact in our community.
          </p>
        </motion.div>
      </div>
      <div className="leaderboard-filters">
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>
        <div className="period-select">
          <Filter size={16} />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period.charAt(0).toUpperCase() + period.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="leaderboard-content">
        <div className="leaderboard-main">
          {displayData.length === 0 ? (
            <Card className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <Trophy size={48} style={{ marginBottom: '1rem', color: 'var(--gray-400)' }} />
              <h3>No Contributors Yet</h3>
              <p style={{ color: 'var(--gray-500)' }}>
                Be the first to donate food and appear on the leaderboard!
              </p>
            </Card>
          ) : (
            <>
              <div className="podium-section">
                {topThree.map((user, index) => (
                  <motion.div
                    key={user.rank || index}
                    className={`podium-item rank-${user.rank}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`podium-icon ${user.badge}`}>
                      {getRankIcon(user.rank)}
                    </div>
                    <h3 className="podium-name">{user.name || 'Anonymous'}</h3>
                    <span className="podium-score">{(user.score || 0).toLocaleString()} pts</span>
                    <span className="podium-donations">{user.donations || 0} donations</span>
                    <div className="podium-base">
                      <span className="podium-rank">{user.rank}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Card className="leaderboard-table-card">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Donations</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardTableData.map((user, index) => (
                  <motion.tr
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>
                      <span className="table-rank">{user.rank}</span>
                    </td>
                    <td>
                      <div className="table-user">
                        <span className="user-name">{user.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-score">{(user.score || 0).toLocaleString()}</span>
                    </td>
                    <td>{user.donations || 0}</td>
                    <td>
                      <span className={`rank-change ${parseInt(user.change || '0') > 0 ? 'up' : parseInt(user.change || '0') < 0 ? 'down' : ''}`}>
                        {parseInt(user.change || '0') > 0 ? '↑' : parseInt(user.change || '0') < 0 ? '↓' : '–'} {Math.abs(parseInt(user.change || '0')) || 0}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="user-rank-card">
            <div className="user-rank-content">
              <span className="user-rank-label">Your Position</span>
              <div className="user-rank-info">
                <span className="user-rank-number">#{userRank.rank || 'N/A'}</span>
                <div className="user-rank-details">
                  <span className="user-rank-name">{userRank.name || 'You'}</span>
                  <span className="user-rank-score">{(userRank.score || 0).toLocaleString()} pts</span>
                </div>
              </div>
              <div className="user-rank-progress">
                <span>Next rank in {500 - ((userRank.score || 0) % 500)} pts</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${((userRank.score || 0) % 500) / 5}%` }}></div>
                </div>
              </div>
            </div>
          </Card>
            </>
          )}
        </div>

        <div className="leaderboard-sidebar">
          <Card className="stats-card">
            <h3 className="sidebar-title">Your Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <Utensils size={20} />
                <span className="stat-value">{userRank.donations || 0}</span>
                <span className="stat-label">Donations</span>
              </div>
              <div className="stat-item">
                <Star size={20} />
                <span className="stat-value">{userRank.score || 0}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="stat-item">
                <TrendingUp size={20} />
                <span className="stat-value change-up">{userRank.change || '0'}</span>
                <span className="stat-label">This Week</span>
              </div>
            </div>
          </Card>

          <Card className="achievements-card">
            <h3 className="sidebar-title">Achievements</h3>
            <div className="achievements-list">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <span className="achievement-icon">{achievement.icon}</span>
                  <div className="achievement-info">
                    <span className="achievement-name">{achievement.name}</span>
                    <span className="achievement-desc">{achievement.description}</span>
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="success" size="sm">Earned</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card className="points-info-card">
            <h3 className="sidebar-title">How Points Work</h3>
            <ul className="points-list">
              <li>
                <span className="point-value">+50</span>
                <span>Per donation made</span>
              </li>
              <li>
                <span className="point-value">+25</span>
                <span>Per delivery completed</span>
              </li>
              <li>
                <span className="point-value">+10</span>
                <span>Per food request fulfilled</span>
              </li>
              <li>
                <span className="point-value">+100</span>
                <span>7 day streak bonus</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
