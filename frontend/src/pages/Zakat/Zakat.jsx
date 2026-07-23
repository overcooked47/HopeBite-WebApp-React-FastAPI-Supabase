import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Heart,
  CheckCircle,
  ChevronRight,
  Wallet,
  History,
  Download,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { zakatAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Zakat.css';

const Zakat = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isContributor = user?.role === 'contributor';
  const isRecipient = user?.role === 'recipient';

  const [activeTab, setActiveTab] = useState(isRecipient ? 'request' : 'donate');
  const [loading, setLoading] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recipientsList, setRecipientsList] = useState([]);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  
  useEffect(() => {
    if (isContributor || isAdmin) {
      fetchRecipients();
    }
  }, [isContributor, isAdmin]);

  const fetchRecipients = async () => {
    try {
      const response = await zakatAPI.getAvailableRecipients();
      setRecipientsList(response.data || []);
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    }
  };

  const handleApplyForZakat = async () => {
    setLoading(true);
    try {
      await zakatAPI.createRequest({
        title: `Zakat Request from ${user?.full_name || user?.name || 'Recipient'}`,
        description: 'I am applying for zakat assistance.',
        amount_needed: 1000,
        currency: 'BDT',
        purpose: 'General assistance',
        beneficiaries_count: 1,
      });
      setRequestSubmitted(true);
      toast.success('Your zakat request has been posted!');
    } catch (error) {
      console.error('Failed to submit zakat request:', error);
      
      let errorMsg = 'Failed to submit request. Please try again.';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map(e => e.msg || e.message || String(e)).join(', ');
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!donationAmount || !selectedRecipient) {
      toast.error('Please enter amount and select a recipient');
      return;
    }
    setLoading(true);
    try {
      await zakatAPI.donate({
        amount: parseFloat(donationAmount),
        currency: 'BDT',
        recipient_type: 'individual',  
        recipient_id: selectedRecipient,
      });
      toast.success('Donation successful! Thank you for your generosity.');
      setDonationAmount('');
      setSelectedRecipient(null);
      fetchRecipients(); 
    } catch (error) {
      console.error('Failed to donate:', error);
      
      let errorMsg = 'Payment failed. Please try again.';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map(e => e.msg || e.message || String(e)).join(', ');
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  
  if (isRecipient) {
    return (
      <div className="zakat-page">
        <div className="zakat-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="page-title">
              <Wallet size={28} className="title-icon" />
              Request Zakat
            </h1>
            <p className="page-subtitle">
              Apply for zakat assistance if you are in need.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="zakat-apply-section"
        >
          <Card className="zakat-apply-card" padding="xl">
            {requestSubmitted ? (
              <div className="request-success">
                <CheckCircle size={64} className="success-icon" />
                <h2>Your request has been submitted!</h2>
                <p>Your zakat request is now pending admin approval. Once approved, contributors will be able to see your request and donate.</p>
                <Badge variant="warning" size="lg" style={{ marginTop: '1rem' }}>
                  Status: Pending Approval
                </Badge>
              </div>
            ) : (
              <>
                <div className="apply-question">
                  <HelpCircle size={48} className="question-icon" />
                  <h2>Do you want to apply for Zakat?</h2>
                  <p>By applying, your request will be visible to contributors who can provide assistance.</p>
                </div>
                <div className="apply-buttons">
                  <Button
                    variant="primary"
                    size="lg"
                    loading={loading}
                    onClick={handleApplyForZakat}
                    leftIcon={<CheckCircle size={20} />}
                  >
                    YES
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => window.history.back()}
                  >
                    NO
                  </Button>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  
  return (
    <div className="zakat-page">
      <div className="zakat-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title">
            <Wallet size={28} className="title-icon" />
            Zakat & Donations
          </h1>
          <p className="page-subtitle">
            Fulfill your religious obligations and make a difference in someone's life.
          </p>
        </motion.div>
      </div>

      <div className="zakat-tabs">
        <button
          className={`tab-btn ${activeTab === 'donate' ? 'active' : ''}`}
          onClick={() => setActiveTab('donate')}
        >
          <Heart size={18} />
          Donation
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} />
          History
        </button>
        {isAdmin && (
          <button
            className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <FileText size={18} />
            Ledger
          </button>
        )}
      </div>

      {activeTab === 'donate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tab-content"
        >
          <div className="donate-grid">
            <div className="recipients-section">
              <h2 className="section-title">Select a Recipient</h2>
              <p className="section-description">
                All recipients below have been verified and approved by our admin team.
              </p>
              
              <div className="recipients-list">
                {recipientsList.length > 0 ? (
                  recipientsList.map((recipient) => (
                    <Card
                      key={recipient.id}
                      hover
                      className={`recipient-card ${selectedRecipient === recipient.id ? 'selected' : ''}`}
                      onClick={() => setSelectedRecipient(recipient.id)}
                    >
                      <div className="recipient-info">
                        <div className="recipient-header">
                          <h3 className="recipient-name">{recipient.full_name || recipient.name}</h3>
                          <Badge variant="success" size="sm">
                            <Shield size={12} /> Verified
                          </Badge>
                        </div>
                        <p className="recipient-type">Zakat Applicant</p>
                      </div>
                      <div className="recipient-select">
                        {selectedRecipient === recipient.id ? (
                          <CheckCircle size={24} className="selected-icon" />
                        ) : (
                          <ChevronRight size={24} />
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No zakat recipients available at the moment.
                  </p>
                )}
              </div>
            </div>

            <Card className="payment-card">
              <h3 className="payment-title">Make a Donation</h3>
              
              <div className="amount-input">
                <label>Donation Amount</label>
                <div className="amount-field">
                  <span className="currency">BDT</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                </div>
                <div className="quick-amounts">
                  {[50, 100, 250, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      className={`quick-amount ${donationAmount === amount.toString() ? 'active' : ''}`}
                      onClick={() => setDonationAmount(amount.toString())}
                    >
                      BDT {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="payment-summary">
                <div className="summary-item">
                  <span>Donation Amount</span>
                  <span>BDT {donationAmount || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <span>Processing Fee</span>
                  <span>BDT 0.00</span>
                </div>
                <div className="summary-item total">
                  <span>Total</span>
                  <span>BDT {donationAmount || '0.00'}</span>
                </div>
              </div>

              <div className="security-notice">
                <Shield size={16} />
                <span>Your payment is secure and encrypted</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onClick={handleDonate}
                disabled={!donationAmount || !selectedRecipient}
              >
                Donate Now
              </Button>
            </Card>
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tab-content"
        >
          <Card className="history-card">
            <h2 className="history-title">Donation History</h2>
            <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No donation history available yet.
            </p>
          </Card>
        </motion.div>
      )}

      {activeTab === 'ledger' && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tab-content"
        >
          <Card className="ledger-card">
            <div className="ledger-header">
              <h2 className="ledger-title">Zakat & Donation Ledger</h2>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => toast.success('Ledger exported')}
              >
                Export
              </Button>
            </div>
            <p className="ledger-desc">
              Full record of all zakat and sadaqah transactions for admin review and reporting.
            </p>
            <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No transactions recorded yet.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Zakat;
