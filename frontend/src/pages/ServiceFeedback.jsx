import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { HiStar } from 'react-icons/hi2';
import { formatDate } from '../utils/helpers';

const ServiceFeedback = () => {
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({
    bookingId: null, rating: 0, serviceQuality: '', pickupExperience: '', deliveryExperience: '', additionalComments: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEligible = async () => {
    try {
      const res = await API.get('/feedback/eligible');
      setEligible(res.data.bookings);
    } catch {
      toast.error('Failed to load eligible bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEligible(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedbackForm.rating === 0) return toast.error('Please select a rating');
    setSubmitting(true);
    try {
      await API.post(`/feedback/${feedbackForm.bookingId}`, {
        rating: feedbackForm.rating,
        serviceQuality: feedbackForm.serviceQuality,
        pickupExperience: feedbackForm.pickupExperience,
        deliveryExperience: feedbackForm.deliveryExperience,
        additionalComments: feedbackForm.additionalComments,
      });
      toast.success('Feedback submitted! Thank you!');
      setFeedbackForm({ bookingId: null, rating: 0, serviceQuality: '', pickupExperience: '', deliveryExperience: '', additionalComments: '' });
      fetchEligible();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If a booking is selected, show the feedback form
  if (feedbackForm.bookingId) {
    const selectedBooking = eligible.find(b => b._id === feedbackForm.bookingId);
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => setFeedbackForm({ ...feedbackForm, bookingId: null, rating: 0 })}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4 inline-block">
          ← Back to bookings
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Feedback</h1>
        <p className="text-gray-500 mb-6">
          {selectedBooking?.bikeSnapshot?.brand} {selectedBooking?.bikeSnapshot?.model} — {selectedBooking?.bookingId}
        </p>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}>
                    <HiStar className={`text-3xl transition-colors ${
                      star <= feedbackForm.rating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'
                    }`} />
                  </button>
                ))}
              </div>
              {feedbackForm.rating > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][feedbackForm.rating]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Quality</label>
              <textarea className="input-field" rows="2" placeholder="How was the service quality?"
                value={feedbackForm.serviceQuality}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, serviceQuality: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Experience</label>
              <textarea className="input-field" rows="2" placeholder="How was the pickup process?"
                value={feedbackForm.pickupExperience}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, pickupExperience: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Experience</label>
              <textarea className="input-field" rows="2" placeholder="How was the delivery process?"
                value={feedbackForm.deliveryExperience}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, deliveryExperience: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Comments</label>
              <textarea className="input-field" rows="3" placeholder="Anything else you'd like to share..."
                value={feedbackForm.additionalComments}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, additionalComments: e.target.value })} />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Service Feedback</h1>

      {eligible.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 text-lg">No bookings eligible for feedback</p>
          <p className="text-sm text-gray-400 mt-1">Feedback can be submitted once your service is completed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eligible.map((booking) => (
            <div key={booking._id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400">{booking.bookingId}</span>
                <p className="font-medium text-gray-900">
                  {booking.bikeSnapshot?.brand} {booking.bikeSnapshot?.model}
                </p>
                <p className="text-sm text-gray-500">Booked on {formatDate(booking.createdAt)}</p>
              </div>
              <button onClick={() => setFeedbackForm({ ...feedbackForm, bookingId: booking._id })}
                className="btn-primary text-sm py-2 px-4">
                Give Feedback
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceFeedback;
