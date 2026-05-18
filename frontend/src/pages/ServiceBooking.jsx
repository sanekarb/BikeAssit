import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

const ServiceBooking = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bikeId: '', pickupAddress: '', preferredPickupDate: '', preferredPickupTime: '', issueDescription: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const res = await API.get('/bikes');
        setBikes(res.data.bikes);
        if (res.data.bikes.length === 0) {
          toast.error('Please add a bike first before booking a service');
        }
      } catch {
        toast.error('Failed to load bikes');
      }
    };
    fetchBikes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/bookings', formData);
      toast.success('Booking created successfully!');
      navigate('/booking-status');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>
        <p className="text-gray-500 mt-1">Fill in the details to schedule a pickup for your bike</p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bike Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Bike</label>
            {bikes.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                No bikes found. <a href="/my-bikes" className="underline font-medium">Add a bike</a> first.
              </div>
            ) : (
              <select className="input-field" value={formData.bikeId}
                onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })} required>
                <option value="">Choose a bike...</option>
                {bikes.map((bike) => (
                  <option key={bike._id} value={bike._id}>
                    {bike.brand} {bike.model} — {bike.registrationNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pickup Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Address</label>
            <textarea className="input-field" rows="3" placeholder="Full address for bike pickup"
              value={formData.pickupAddress}
              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })} required />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
              <input type="date" className="input-field" min={today} value={formData.preferredPickupDate}
                onChange={(e) => setFormData({ ...formData, preferredPickupDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time</label>
              <select className="input-field" value={formData.preferredPickupTime}
                onChange={(e) => setFormData({ ...formData, preferredPickupTime: e.target.value })} required>
                <option value="">Select time...</option>
                <option value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 1:00 PM">11:00 AM - 1:00 PM</option>
                <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
              </select>
            </div>
          </div>

          {/* Issue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe the Issue</label>
            <textarea className="input-field" rows="4" placeholder="What's wrong with your bike? e.g., Engine making noise, brakes not working..."
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })} required />
          </div>

          <button type="submit" disabled={loading || bikes.length === 0} className="btn-primary w-full">
            {loading ? 'Booking...' : 'Book Service'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceBooking;
