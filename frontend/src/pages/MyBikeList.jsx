import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';

const BIKE_BRANDS = [
  'Honda', 'Yamaha', 'Suzuki', 'Bajaj', 'TVS', 'Royal Enfield',
  'KTM', 'Hero', 'Kawasaki', 'BMW', 'Ducati', 'Harley-Davidson', 'Other',
];

const MyBikeList = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', bikeId: null });
  const [formData, setFormData] = useState({ brand: '', model: '', registrationNumber: '', manufacturingYear: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchBikes = async () => {
    try {
      const res = await API.get('/bikes');
      setBikes(res.data.bikes);
    } catch {
      toast.error('Failed to load bikes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBikes(); }, []);

  const openAddModal = () => {
    setFormData({ brand: '', model: '', registrationNumber: '', manufacturingYear: '' });
    setModal({ open: true, mode: 'add', bikeId: null });
  };

  const openEditModal = (bike) => {
    setFormData({
      brand: bike.brand, model: bike.model,
      registrationNumber: bike.registrationNumber, manufacturingYear: bike.manufacturingYear,
    });
    setModal({ open: true, mode: 'edit', bikeId: bike._id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal.mode === 'add') {
        await API.post('/bikes', formData);
        toast.success('Bike added!');
      } else {
        await API.put(`/bikes/${modal.bikeId}`, formData);
        toast.success('Bike updated!');
      }
      setModal({ open: false, mode: 'add', bikeId: null });
      fetchBikes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bike?')) return;
    try {
      await API.delete(`/bikes/${id}`);
      toast.success('Bike deleted');
      fetchBikes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bikes</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 text-sm">
          <HiPlus /> Add Bike
        </button>
      </div>

      {bikes.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 text-lg">No bikes added yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your bike to start booking services</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bikes.map((bike) => (
            <div key={bike._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{bike.brand} {bike.model}</h3>
                  <p className="text-sm text-gray-500 mt-1">{bike.registrationNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Year: {bike.manufacturingYear}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(bike)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <HiPencil />
                  </button>
                  <button onClick={() => handleDelete(bike._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <HiTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === 'add' ? 'Add New Bike' : 'Edit Bike'}
              </h3>
              <button onClick={() => setModal({ ...modal, open: false })} className="p-1 hover:bg-gray-100 rounded-lg">
                <HiX className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                <select className="input-field" value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required>
                  <option value="">Select brand...</option>
                  {BIKE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                <input type="text" className="input-field" placeholder="e.g., Splendor Plus" value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number</label>
                <input type="text" className="input-field" placeholder="MH12AB1234" value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacturing Year</label>
                <input type="number" className="input-field" placeholder="2023" min="1990" max={new Date().getFullYear()}
                  value={formData.manufacturingYear}
                  onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })} required />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal({ ...modal, open: false })} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-sm">
                  {submitting ? 'Saving...' : modal.mode === 'add' ? 'Add Bike' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBikeList;
