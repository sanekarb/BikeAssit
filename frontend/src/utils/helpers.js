/**
 * Returns the Tailwind badge class for a booking status string
 */
export const getStatusBadgeClass = (status) => {
  const map = {
    'Pending': 'badge-pending',
    'Accepted': 'badge-accepted',
    'Rejected': 'badge-rejected',
    'Cancelled': 'badge-cancelled',
    'Pickup Assigned': 'badge-pickup-assigned',
    'Bike Picked Up': 'badge-bike-picked-up',
    'Service In Progress': 'badge-service-in-progress',
    'Service Completed': 'badge-service-completed',
    'Ready For Delivery': 'badge-ready-for-delivery',
    'Delivered': 'badge-delivered',
    'Completed': 'badge-completed',
  };
  return map[status] || 'badge-pending';
};

/**
 * Returns the Tailwind badge class for a payment status string
 */
export const getPaymentBadgeClass = (status) => {
  const map = {
    'Not Generated': 'badge-not-generated',
    'Pending': 'badge-payment-pending',
    'Paid Online': 'badge-paid-online',
    'Paid On Delivery': 'badge-paid-on-delivery',
  };
  return map[status] || 'badge-not-generated';
};

/**
 * Format a date string to readable Indian locale
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};
