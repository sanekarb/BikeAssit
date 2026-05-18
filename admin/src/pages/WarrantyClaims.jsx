import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const WARRANTY_REJECTION_REASONS = [
  'Issue Not Covered Under Warranty', 'Warranty Period Expired',
  'Physical Damage Found', 'Terms & Conditions Violation', 'Other',
];

const WORKFLOW_STATUSES = ['Pending', 'Pickup Assigned', 'Bike Picked Up', 'Issue Resolution', 'Bike Delivered'];

const WarrantyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, claimId: null, reason: '' });
  const [acceptModal, setAcceptModal] = useState({ open: false, claimId: null, name: '', mobile: '', vehicleNumber: '' });
  const [submitting, setSubmitting] = useState(null);

  const fetchClaims = async () => {
    try {
      const res = await API.get('/admin/warranty-claims');
      setClaims(res.data.claims);
    } catch {
      toast.error('Failed to load warranty claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleAccept = async () => {
    const { claimId, name, mobile, vehicleNumber } = acceptModal;
    setSubmitting('accept');
    try {
      const body = {};
      if (name && mobile && vehicleNumber) {
        body.name = name;
        body.mobile = mobile;
        body.vehicleNumber = vehicleNumber;
      }
      await API.put(`/admin/warranty-claims/${claimId}/accept`, body);
      toast.success('Claim accepted');
      setAcceptModal({ open: false, claimId: null, name: '', mobile: '', vehicleNumber: '' });
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason) return toast.error('Please select a reason');
    setSubmitting('reject');
    try {
      await API.put(`/admin/warranty-claims/${rejectModal.claimId}/reject`, { rejectionReason: rejectModal.reason });
      toast.success('Claim rejected');
      setRejectModal({ open: false, claimId: null, reason: '' });
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setSubmitting(null);
    }
  };

  const handleWorkflowUpdate = async (claimId, newStatus) => {
    setSubmitting(claimId);
    try {
      await API.put(`/admin/warranty-claims/${claimId}/workflow`, { claimWorkflowStatus: newStatus });
      toast.success(`Workflow updated to '${newStatus}'`);
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(null);
    }
  };

  const getClaimBadgeClass = (status) => {
    if (status === 'Claim Accepted') return 'bg-green-100 text-green-700 border border-green-200';
    if (status === 'Claim Rejected') return 'bg-red-100 text-red-700 border border-red-200';
    return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Warranty Claims <span className="text-gray-400 text-lg font-normal">({claims.length})</span>
      </h1>

      {claims.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-gray-500">No warranty claims</p></div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim._id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs text-gray-400">Claim ID: {claim._id.slice(-8)}</span>
                  <p className="font-semibold text-gray-900">
                    {claim.booking?.bookingId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">{claim.user?.name} • {claim.user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClaimBadgeClass(claim.status)}`}>
                    {claim.status}
                  </span>
                  {claim.status === 'Claim Accepted' && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      {claim.claimWorkflowStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Bike</span>
                  <p className="font-medium">
                    {claim.booking?.bikeSnapshot?.brand} {claim.booking?.bikeSnapshot?.model}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Warranty Expiry</span>
                  <p className="font-medium">{formatDate(claim.booking?.warrantyExpiry)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Filed On</span>
                  <p className="font-medium">{formatDate(claim.createdAt)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <span className="text-xs text-gray-500 font-medium">Issue Description</span>
                <p className="text-sm text-gray-700 mt-1">{claim.claimDescription}</p>
              </div>

              {claim.rejectionReason && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">Reason: {claim.rejectionReason}</p>
              )}

              {claim.pickupPerson?.name && (
                <p className="text-sm text-gray-600 mb-3">
                  Pickup: {claim.pickupPerson.name} ({claim.pickupPerson.mobile}) — {claim.pickupPerson.vehicleNumber}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {claim.status === 'Claim Under Review' && (
                  <>
                    <button onClick={() => setAcceptModal({ open: true, claimId: claim._id, name: '', mobile: '', vehicleNumber: '' })}
                      className="btn-primary text-sm py-2 px-3">Accept</button>
                    <button onClick={() => setRejectModal({ open: true, claimId: claim._id, reason: '' })}
                      className="btn-danger text-sm py-2 px-3">Reject</button>
                  </>
                )}

                {claim.status === 'Claim Accepted' && (
                  <select
                    className="input-field text-sm py-2 w-auto"
                    value={claim.claimWorkflowStatus}
                    onChange={(e) => handleWorkflowUpdate(claim._id, e.target.value)}
                    disabled={submitting === claim._id}
                  >
                    {WORKFLOW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {acceptModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Accept Warranty Claim</h3>
            <p className="text-sm text-gray-500 mb-4">Optionally assign a pickup person for the warranty service.</p>
            <div className="space-y-3">
              <input type="text" className="input-field" placeholder="Pickup Person Name (optional)"
                value={acceptModal.name} onChange={(e) => setAcceptModal({ ...acceptModal, name: e.target.value })} />
              <input type="tel" className="input-field" placeholder="Mobile (optional)"
                value={acceptModal.mobile} onChange={(e) => setAcceptModal({ ...acceptModal, mobile: e.target.value })} />
              <input type="text" className="input-field" placeholder="Vehicle Number (optional)"
                value={acceptModal.vehicleNumber} onChange={(e) => setAcceptModal({ ...acceptModal, vehicleNumber: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setAcceptModal({ ...acceptModal, open: false })} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAccept} disabled={submitting === 'accept'} className="btn-primary text-sm">
                {submitting === 'accept' ? 'Accepting...' : 'Accept Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Warranty Claim</h3>
            <select className="input-field mb-4" value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}>
              <option value="">Select reason...</option>
              {WARRANTY_REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal({ ...rejectModal, open: false })} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleReject} disabled={submitting === 'reject'} className="btn-danger text-sm">
                {submitting === 'reject' ? 'Rejecting...' : 'Reject Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyClaims;
