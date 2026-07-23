import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  Filter,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context';
import { receiptsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import './ReceiptsLedger.css';

const ReceiptsLedger = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    verified: 0,
  });

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await receiptsAPI.getMyReceipts();
      const items = response.data?.items || [];
      setReceipts(items);

      
      setStats({
        total: items.length,
        totalAmount: items.reduce((sum, r) => sum + (r.amount || 0), 0),
        verified: items.filter((r) => r.is_verified).length,
      });
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'BDT') => {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  };

  const generatePDF = (receipt) => {
    
    const printWindow = window.open('', '_blank');
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receipt_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #8b5cf6; }
          .receipt-title { font-size: 18px; color: #666; margin-top: 10px; }
          .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-block { }
          .info-label { color: #666; font-size: 12px; text-transform: uppercase; }
          .info-value { font-size: 16px; font-weight: 500; margin-top: 4px; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .details-row:last-child { border-bottom: none; }
          .amount-section { text-align: center; padding: 30px; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; border-radius: 8px; margin-bottom: 30px; }
          .amount { font-size: 36px; font-weight: bold; }
          .currency { font-size: 20px; opacity: 0.9; }
          .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          .verified { color: #10b981; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">❤️ HopeBite</div>
          <div class="receipt-title">${receipt.receipt_type === 'zakat' ? 'Zakat Donation Receipt' : 'Donation Receipt'}</div>
        </div>
        
        <div class="receipt-info">
          <div class="info-block">
            <div class="info-label">Receipt Number</div>
            <div class="info-value">${receipt.receipt_number}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Date</div>
            <div class="info-value">${formatDate(receipt.donation_date)}</div>
          </div>
        </div>

        <div class="amount-section">
          <div class="currency">${receipt.currency}</div>
          <div class="amount">${(receipt.amount || 0).toLocaleString()}</div>
        </div>

        <div class="details">
          <div class="details-row">
            <span>Description</span>
            <strong>${receipt.description}</strong>
          </div>
          <div class="details-row">
            <span>Recipient</span>
            <strong>${receipt.recipient_name || 'N/A'}</strong>
          </div>
          <div class="details-row">
            <span>Recipient Type</span>
            <strong>${receipt.recipient_type || 'N/A'}</strong>
          </div>
          <div class="details-row">
            <span>Donation Type</span>
            <strong>${receipt.receipt_type === 'zakat' ? 'Zakat' : 'General Donation'}</strong>
          </div>
        </div>

        ${receipt.is_verified ? '<div class="verified">✓ Verified Donation</div>' : ''}

        <div class="footer">
          <p><strong>${receipt.issuer_name}</strong></p>
          <p>${receipt.issuer_address || ''}</p>
          <p style="margin-top: 20px;">Thank you for your generous contribution!</p>
          <p style="color: #8b5cf6;">This receipt is digitally generated and valid for tax purposes.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();

    
    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast.success('Receipt opened for printing/download');
  };

  const filteredReceipts = receipts.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'zakat') return r.receipt_type === 'zakat';
    if (filter === 'donation') return r.receipt_type === 'donation';
    if (filter === 'verified') return r.is_verified;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading receipts...</p>
      </div>
    );
  }

  return (
    <div className="receipts-page">
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            <FileText size={28} className="title-icon" />
            Receipts & Ledger
          </h1>
          <p className="page-subtitle">
            Download receipts for your zakat and food donations
          </p>
        </motion.div>

        <Button variant="secondary" onClick={fetchReceipts} leftIcon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)' }}>
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Receipts</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
            <span className="stat-label">Total Donated</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--info)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.verified}</span>
            <span className="stat-label">Verified</span>
          </div>
        </Card>
      </div>

      {}
      <div className="filter-section">
        <Filter size={16} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Receipts</option>
          <option value="zakat">Zakat Only</option>
          <option value="donation">Food Donations</option>
          <option value="verified">Verified Only</option>
        </select>
      </div>

      {}
      {filteredReceipts.length === 0 ? (
        <Card className="empty-state">
          <FileText size={48} className="empty-icon" />
          <h3>No Receipts Yet</h3>
          <p>
            When you donate zakat or food, receipts will appear here for download.
          </p>
        </Card>
      ) : (
        <div className="receipts-list">
          {filteredReceipts.map((receipt, index) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="receipt-card">
                <div className="receipt-header">
                  <div className="receipt-number">
                    <FileText size={20} />
                    <span>{receipt.receipt_number}</span>
                  </div>
                  <Badge variant={receipt.receipt_type === 'zakat' ? 'primary' : 'success'}>
                    {receipt.receipt_type === 'zakat' ? 'Zakat' : 'Donation'}
                  </Badge>
                </div>

                <div className="receipt-body">
                  <div className="receipt-amount">
                    <span className="currency">{receipt.currency}</span>
                    <span className="amount">{(receipt.amount || 0).toLocaleString()}</span>
                  </div>

                  <div className="receipt-details">
                    <div className="detail-item">
                      <User size={14} />
                      <span>{receipt.recipient_name || 'Anonymous'}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={14} />
                      <span>{formatDate(receipt.donation_date)}</span>
                    </div>
                    {receipt.is_verified && (
                      <div className="detail-item verified">
                        <CheckCircle size={14} />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="receipt-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => generatePDF(receipt)}
                    leftIcon={<Download size={14} />}
                  >
                    Download Receipt
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <motion.div
            className="modal-content receipt-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Receipt Details</h2>
              <button className="modal-close" onClick={() => setSelectedReceipt(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="receipt-preview">
                <div className="preview-header">
                  <span className="logo">❤️ HopeBite</span>
                  <Badge variant={selectedReceipt.receipt_type === 'zakat' ? 'primary' : 'success'}>
                    {selectedReceipt.receipt_type === 'zakat' ? 'Zakat Receipt' : 'Donation Receipt'}
                  </Badge>
                </div>

                <div className="preview-amount">
                  <span className="currency">{selectedReceipt.currency}</span>
                  <span className="amount">{(selectedReceipt.amount || 0).toLocaleString()}</span>
                </div>

                <div className="preview-details">
                  <div className="detail-row">
                    <span>Receipt Number</span>
                    <strong>{selectedReceipt.receipt_number}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Date</span>
                    <strong>{formatDate(selectedReceipt.donation_date)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Recipient</span>
                    <strong>{selectedReceipt.recipient_name}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Description</span>
                    <strong>{selectedReceipt.description}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Status</span>
                    <strong>
                      {selectedReceipt.is_verified ? (
                        <span style={{ color: 'var(--success)' }}>✓ Verified</span>
                      ) : (
                        <span style={{ color: 'var(--warning)' }}>Pending</span>
                      )}
                    </strong>
                  </div>
                </div>

                <div className="preview-footer">
                  <p>Issued by: {selectedReceipt.issuer_name}</p>
                  <p>{selectedReceipt.issuer_address}</p>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  variant="primary"
                  onClick={() => generatePDF(selectedReceipt)}
                  leftIcon={<Download size={16} />}
                >
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    generatePDF(selectedReceipt);
                  }}
                  leftIcon={<Printer size={16} />}
                >
                  Print
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsLedger;
