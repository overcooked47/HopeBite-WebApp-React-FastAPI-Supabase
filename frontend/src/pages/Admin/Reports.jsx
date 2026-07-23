import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import './Admin.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    
    const mockReports = [
      { id: 1, title: 'Donation Summary Report', type: 'donation', date: '2025-01-24', status: 'ready', size: '2.4 MB' },
      { id: 2, title: 'Volunteer Performance Report', type: 'volunteer', date: '2025-01-23', status: 'ready', size: '1.8 MB' },
      { id: 3, title: 'Monthly Financial Report', type: 'financial', date: '2025-01-20', status: 'ready', size: '3.2 MB' },
      { id: 4, title: 'User Growth Analysis', type: 'user', date: '2025-01-18', status: 'ready', size: '1.5 MB' },
    ];
    setReports(mockReports);
  }, []);

  const filteredReports = selectedType === 'all' ? reports : reports.filter(r => r.type === selectedType);

  const getTypeColor = (type) => {
    const colors = {
      donation: 'purple',
      volunteer: 'blue',
      financial: 'orange',
      user: 'green',
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="admin-reports">
      <div className="admin-header">
        <h1 className="admin-title">
          <FileText size={24} />
          Reports
        </h1>
        <p className="admin-subtitle">Generate and download system reports</p>
      </div>

      <div className="reports-controls">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="role-filter"
        >
          <option value="all">All Reports</option>
          <option value="donation">Donation Reports</option>
          <option value="volunteer">Volunteer Reports</option>
          <option value="financial">Financial Reports</option>
          <option value="user">User Reports</option>
        </select>
        <Button variant="primary" leftIcon={<Calendar size={18} />}>
          Generate New Report
        </Button>
      </div>

      <div className="reports-list">
        {filteredReports.map(report => (
          <Card key={report.id} className="report-item">
            <div className="report-header">
              <FileText size={24} className="report-icon" />
              <div className="report-info">
                <h3 className="report-title">{report.title}</h3>
                <p className="report-meta">{report.date} • {report.size}</p>
              </div>
              <div className="report-actions">
                <Badge color={getTypeColor(report.type)}>
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </Badge>
                <button className="download-btn" title="Download">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
