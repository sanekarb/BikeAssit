import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { HiStar } from 'react-icons/hi2';
import { formatDate } from '../utils/helpers';

const LoyaltyPoints = () => {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/loyalty');
        setLoyalty(res.data.loyalty);
      } catch {
        toast.error('Failed to load loyalty data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Loyalty Points</h1>

      {/* Points Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-primary-600">{loyalty?.availablePoints || 0}</div>
          <p className="text-sm text-gray-500 mt-1">Available</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{loyalty?.earnedPoints || 0}</div>
          <p className="text-sm text-gray-500 mt-1">Total Earned</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-blue-600">{loyalty?.redeemedPoints || 0}</div>
          <p className="text-sm text-gray-500 mt-1">Redeemed</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-gray-400">{loyalty?.expiredPoints || 0}</div>
          <p className="text-sm text-gray-500 mt-1">Expired</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <HiStar className="text-amber-500 text-xl mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">How loyalty works</p>
          <p className="mt-1">Earn <strong>100 points</strong> for every completed service. Points expire after <strong>90 days</strong>.
          Redeem up to <strong>25%</strong> of your next bill using loyalty points.</p>
        </div>
      </div>

      {/* Transactions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
      {loyalty?.transactions?.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Points</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Expiry</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loyalty.transactions.map((txn, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        txn.type === 'earned' ? 'bg-green-100 text-green-700' :
                        txn.type === 'redeemed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      <span className={txn.type === 'earned' ? 'text-green-600' : 'text-red-600'}>
                        {txn.type === 'earned' ? '+' : '-'}{txn.points}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{txn.description}</td>
                    <td className="px-5 py-3 text-gray-500">{txn.expiryDate ? formatDate(txn.expiryDate) : '—'}</td>
                    <td className="px-5 py-3">
                      {txn.isExpired ? (
                        <span className="text-xs text-red-500 font-medium">Expired</span>
                      ) : (
                        <span className="text-xs text-green-500 font-medium">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No transactions yet. Complete a service to earn points!</p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPoints;
