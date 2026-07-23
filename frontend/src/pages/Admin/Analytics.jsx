import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './Admin.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    
    const mockData = {
      month: {
        totalDonations: 156,
        totalRequests: 89,
        totalDeliveries: 78,
        activeUsers: 234,
        donationTrend: '+12.5%',
        requestTrend: '+8.2%',
      },
    };
    setAnalyticsData(mockData[selectedPeriod] || mockData.month);
  }, [selectedPeriod]);

  return (
    <div className="admin-analytics">
      <div className="admin-header">
        <h1 className="admin-title">
          <BarChart3 size={24} />
          Analytics & Reports
        </h1>
        <p className="admin-subtitle">View system statistics and trends</p>
      </div>

      <div className="period-selector">
        {['day', 'week', 'month', 'year'].map(period => (
          <button
            key={period}
            className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {analyticsData && (
        <div className="analytics-grid">
          <Card className="analytics-stat">
            <h3>Total Donations</h3>
            <div className="stat-value">{analyticsData.totalDonations}</div>
            <p className="stat-trend trend-up">{analyticsData.donationTrend}</p>
          </Card>

          <Card className="analytics-stat">
            <h3>Total Requests</h3>
            <div className="stat-value">{analyticsData.totalRequests}</div>
            <p className="stat-trend trend-up">{analyticsData.requestTrend}</p>
          </Card>

          <Card className="analytics-stat">
            <h3>Deliveries Completed</h3>
            <div className="stat-value">{analyticsData.totalDeliveries}</div>
            <p className="stat-trend">In Progress</p>
          </Card>

          <Card className="analytics-stat">
            <h3>Active Users</h3>
            <div className="stat-value">{analyticsData.activeUsers}</div>
            <p className="stat-trend">Last 30 days</p>
          </Card>
        </div>
      )}

      <Card className="chart-card">
        <div className="card-header">
          <h2 className="card-title">
            <TrendingUp size={20} />
            Donation Activity Chart
          </h2>
        </div>
        <div className="chart-placeholder">
          <p>Chart visualization coming soon...</p>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
