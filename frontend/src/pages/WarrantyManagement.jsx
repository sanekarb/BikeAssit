import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const WarrantyManagement = () => {
  const [data, setData] = useState({ active: [], claimed: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [claimModal, setClaimModal] = useState({ open: false, bookingId: null, description: '' });

  const fetchWarranties = async () => {
    try {
      const res = await API.get('/warranty');
      setData(res.data);
    } catch {
      toast.error('Failed to load warranty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarranties(); }, []);

  const handleRaiseClaim = async () => {
    if (!claimModal.description.trim()) return toast.error('Please describe the issue');
    try {
      await API.post(`/warranty/claim/${claimModal.bookingId}`, { claimDescription: claimModal.description });
      toast.success('Warranty claim raised successfully');
      setClaimModal({ open: false, bookingId: null, description: '' });
      fetchWarranties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to raise claim');
    }
  };

  const tabs = [
    { key: 'active', label: 'Active', count: data.active.length },
    { key: 'claimed', label: 'Claimed', count: data.claimed.length },
    { key: 'expired', label: 'Expired', count: data.expired.length },
  ];

  const renderCard = (item, showClaim = false) => (
    <div key={item.bookingObjectId} className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-xs text-gray-400">{item.bookingId}</span>
          <p className="font-medium text-gray-900">{item.bikeSnapshot?.brand} {item.bikeSnapshot?.model}</p>
        </div>
        {item.remainingDays > 0 ? (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            {item.remainingDays} days left
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">Expired</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-500">Delivered</span>
          <p className="font-medium">{formatDate(item.deliveredAt)}</p>
        </div>
        <div>
          <span className="text-gray-500">Warranty Until</span>
          <p className="font-medium">{formatDate(item.warrantyExpiry)}</p>
        </div>
        <div>
          <span className="text-gray-500">Registration</span>
          <p className="font-medium">{item.bikeSnapshot?.registrationNumber}</p>
        </div>
      </div>
      {showClaim && (
        <button onClick={() => setClaimModal({ open: true, bookingId: item.bookingObjectId, description: '' })}
          className="btn-primary text-sm py-2 px-4">
          Raise Warranty Claim
        </button>
      )}
      {item.claim && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              item.claim.status === 'Claim Accepted' ? 'bg-green-100 text-green-700' :
              item.claim.status === 'Claim Rejected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {item.claim.status}
            </span>
            {item.claim.claimWorkflowStatus && item.claim.status === 'Claim Accepted' && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                {item.claim.claimWorkflowStatus}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{item.claim.claimDescription}</p>
          {item.claim.rejectionReason && (
            <p className="text-sm text-red-600 mt-1">Reason: {item.claim.rejectionReason}</p>
          )}
          {item.claim.pickupPerson?.name && (
            <p className="text-sm text-gray-600 mt-1">
              Pickup: {item.claim.pickupPerson.name} ({item.claim.pickupPerson.mobile})
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Warranty Management</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'active' && (data.active.length > 0
          ? data.active.map((item) => renderCard(item, true))
          : <div className="card p-12 text-center"><p className="text-gray-500">No active warranties</p></div>
        )}
        {activeTab === 'claimed' && (data.claimed.length > 0
          ? data.claimed.map((item) => renderCard(item))
          : <div className="card p-12 text-center"><p className="text-gray-500">No warranty claims</p></div>
        )}
        {activeTab === 'expired' && (data.expired.length > 0
          ? data.expired.map((item) => renderCard(item))
          : <div className="card p-12 text-center"><p className="text-gray-500">No expired warranties</p></div>
        )}
      </div>

      {/* Claim Modal */}
      {claimModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Raise Warranty Claim</h3>
            <textarea className="input-field mb-4" rows="4" placeholder="Describe the issue you're facing..."
              value={claimModal.description}
              onChange={(e) => setClaimModal({ ...claimModal, description: e.target.value })} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setClaimModal({ open: false, bookingId: null, description: '' })} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleRaiseClaim} className="btn-primary text-sm">Submit Claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyManagement;
