const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email using Nodemailer
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"BikeAssist" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

  } catch (error) {

    // Don't throw — email failure should not break the API flow
  }
};

// ==========================================
// HTML Email Templates
// ==========================================

const baseStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
`;

const headerStyle = `
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  padding: 20px;
  border-radius: 8px 8px 0 0;
  text-align: center;
`;

const bodyStyle = `
  background: white;
  padding: 24px;
  border-radius: 0 0 8px 8px;
  border: 1px solid #e5e7eb;
  border-top: none;
`;

const footerStyle = `
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-size: 12px;
`;

const wrapTemplate = (title, content) => `
  <div style="${baseStyle}">
    <div style="${headerStyle}">
      <h1 style="margin: 0; font-size: 24px;">🏍️ BikeAssist</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">${title}</p>
    </div>
    <div style="${bodyStyle}">
      ${content}
    </div>
    <div style="${footerStyle}">
      <p>This is an automated email from BikeAssist. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} BikeAssist - Bike Service Management Platform</p>
    </div>
  </div>
`;

// ==========================================
// 1. Booking Accepted
// ==========================================
const bookingAccepted = ({ bookingId, bikeDetails, pickupDate, pickupTime }) => {
  const subject = `Booking Accepted - ${bookingId}`;
  const html = wrapTemplate('Booking Accepted ✅', `
    <h2 style="color: #059669;">Your booking has been accepted!</h2>
    <p>Dear Customer,</p>
    <p>We're happy to inform you that your service booking has been accepted.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Booking ID</td><td style="padding: 8px; font-weight: bold;">${bookingId}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Bike</td><td style="padding: 8px;">${bikeDetails}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Pickup Date</td><td style="padding: 8px;">${pickupDate}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Pickup Time</td><td style="padding: 8px;">${pickupTime}</td></tr>
    </table>
    <p>Our team will assign a pickup person shortly. You'll receive another notification once pickup is arranged.</p>
  `);
  return { subject, html };
};

// ==========================================
// 2. Booking Rejected
// ==========================================
const bookingRejected = ({ bookingId, rejectionReason }) => {
  const subject = `Booking Rejected - ${bookingId}`;
  const html = wrapTemplate('Booking Rejected ❌', `
    <h2 style="color: #dc2626;">Your booking has been rejected</h2>
    <p>Dear Customer,</p>
    <p>We regret to inform you that your service booking could not be accepted.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Booking ID</td><td style="padding: 8px; font-weight: bold;">${bookingId}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Reason</td><td style="padding: 8px; color: #dc2626;">${rejectionReason}</td></tr>
    </table>
    <p>You may create a new booking with updated details. If you believe this was a mistake, please contact our support team.</p>
  `);
  return { subject, html };
};

// ==========================================
// 3. Pickup Assigned
// ==========================================
const pickupAssigned = ({ bookingId, pickupPerson }) => {
  const subject = `Pickup Person Assigned - ${bookingId}`;
  const html = wrapTemplate('Pickup Assigned 🚗', `
    <h2 style="color: #2563eb;">Pickup person has been assigned!</h2>
    <p>Dear Customer,</p>
    <p>A pickup person has been assigned for your booking. Please keep your bike ready.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Booking ID</td><td style="padding: 8px; font-weight: bold;">${bookingId}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Pickup Person</td><td style="padding: 8px;">${pickupPerson.name}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Mobile</td><td style="padding: 8px;">${pickupPerson.mobile}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Vehicle Number</td><td style="padding: 8px;">${pickupPerson.vehicleNumber}</td></tr>
    </table>
    <p>The pickup person will contact you before arriving. Please ensure someone is available at the pickup address.</p>
  `);
  return { subject, html };
};

// ==========================================
// 4. Status Updated
// ==========================================
const statusUpdated = ({ bookingId, newStatus }) => {
  const subject = `Booking Status Updated - ${bookingId}`;
  const html = wrapTemplate('Status Update 📋', `
    <h2 style="color: #2563eb;">Your booking status has been updated</h2>
    <p>Dear Customer,</p>
    <p>Your booking status has been updated to:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="background: #dbeafe; color: #1d4ed8; padding: 10px 24px; border-radius: 20px; font-weight: bold; font-size: 16px;">
        ${newStatus}
      </span>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Booking ID</td><td style="padding: 8px; font-weight: bold;">${bookingId}</td></tr>
    </table>
    <p>You can check your full booking details by logging into your BikeAssist account.</p>
  `);
  return { subject, html };
};

// ==========================================
// 5. Bill Generated
// ==========================================
const billGenerated = ({ bookingId, serviceCost, partsCost, additionalCharges, totalAmount }) => {
  const subject = `Bill Generated - ${bookingId}`;
  const html = wrapTemplate('Bill Generated 💰', `
    <h2 style="color: #2563eb;">Your service bill has been generated</h2>
    <p>Dear Customer,</p>
    <p>The bill for your bike service has been generated. Please review the details below:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e5e7eb;">
      <tr style="background: #f9fafb;"><td style="padding: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Booking ID</td><td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">${bookingId}</td></tr>
      <tr><td style="padding: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Service Cost</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">₹${serviceCost}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Parts Cost</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">₹${partsCost}</td></tr>
      <tr><td style="padding: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Additional Charges</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">₹${additionalCharges}</td></tr>
      <tr style="background: #059669; color: white;"><td style="padding: 12px; font-weight: bold;">Total Amount</td><td style="padding: 12px; font-weight: bold; font-size: 18px;">₹${totalAmount}</td></tr>
    </table>
    <p>You can pay online through your BikeAssist dashboard or pay on delivery.</p>
  `);
  return { subject, html };
};

// ==========================================
// 6. Payment Received
// ==========================================
const paymentReceived = ({ bookingId, amountPaid, paymentMethod }) => {
  const subject = `Payment Received - ${bookingId}`;
  const html = wrapTemplate('Payment Confirmed ✅', `
    <h2 style="color: #059669;">Payment received successfully!</h2>
    <p>Dear Customer,</p>
    <p>We have received your payment. Thank you!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Booking ID</td><td style="padding: 8px; font-weight: bold;">${bookingId}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Amount Paid</td><td style="padding: 8px; font-weight: bold; color: #059669;">₹${amountPaid}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Payment Method</td><td style="padding: 8px;">${paymentMethod}</td></tr>
    </table>
    <p>Your booking will proceed to the delivery stage shortly.</p>
  `);
  return { subject, html };
};

// ==========================================
// 7. Loyalty Points Credited
// ==========================================
const loyaltyPointsCredited = ({ pointsAdded, expiryDate, availablePoints }) => {
  const subject = `Loyalty Points Credited - +${pointsAdded} Points`;
  const html = wrapTemplate('Loyalty Points Earned 🌟', `
    <h2 style="color: #d97706;">You've earned loyalty points!</h2>
    <p>Dear Customer,</p>
    <p>Thank you for choosing BikeAssist! Loyalty points have been credited to your account.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Points Added</td><td style="padding: 8px; font-weight: bold; color: #059669;">+${pointsAdded}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Expiry Date</td><td style="padding: 8px;">${expiryDate}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Available Points</td><td style="padding: 8px; font-weight: bold;">${availablePoints}</td></tr>
    </table>
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 16px 0;">
      <p style="margin: 0; color: #92400e;"><strong>💡 Tip:</strong> You can redeem up to 25% of your next bill amount using loyalty points!</p>
    </div>
  `);
  return { subject, html };
};

// ==========================================
// 8. Warranty Activated
// ==========================================
const warrantyActivated = ({ bookingId, warrantyStartDate, warrantyEndDate }) => {
  const subject = `Warranty Activated - ${bookingId}`;
  const html = wrapTemplate('Warranty Activated 🛡️', `
    <h2 style="color: #2563eb;">Your service warranty is now active!</h2>
    <p>Dear Customer,</p>
    <p>A 7-day warranty has been activated for your completed service.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Booking ID</td><td style="padding: 8px; font-weight: bold;">${bookingId}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Warranty Start</td><td style="padding: 8px;">${warrantyStartDate}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Warranty End</td><td style="padding: 8px; font-weight: bold; color: #dc2626;">${warrantyEndDate}</td></tr>
    </table>
    <p>If you face any issues related to this service within the warranty period, you can raise a warranty claim from your dashboard.</p>
  `);
  return { subject, html };
};

// ==========================================
// 9. Warranty Claim Accepted
// ==========================================
const warrantyClaimAccepted = ({ claimId, pickupPerson }) => {
  const subject = `Warranty Claim Accepted - ${claimId}`;
  const html = wrapTemplate('Warranty Claim Accepted ✅', `
    <h2 style="color: #059669;">Your warranty claim has been accepted!</h2>
    <p>Dear Customer,</p>
    <p>Your warranty claim has been reviewed and accepted. A pickup person will collect your bike for re-servicing.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Claim ID</td><td style="padding: 8px; font-weight: bold;">${claimId}</td></tr>
      ${pickupPerson ? `
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Pickup Person</td><td style="padding: 8px;">${pickupPerson.name}</td></tr>
      <tr><td style="padding: 8px; color: #6b7280;">Mobile</td><td style="padding: 8px;">${pickupPerson.mobile}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Vehicle Number</td><td style="padding: 8px;">${pickupPerson.vehicleNumber}</td></tr>
      ` : ''}
    </table>
    <p>This re-service is completely free under warranty coverage.</p>
  `);
  return { subject, html };
};

// ==========================================
// 10. Warranty Claim Rejected
// ==========================================
const warrantyClaimRejected = ({ claimId, rejectionReason }) => {
  const subject = `Warranty Claim Rejected - ${claimId}`;
  const html = wrapTemplate('Warranty Claim Rejected ❌', `
    <h2 style="color: #dc2626;">Your warranty claim has been rejected</h2>
    <p>Dear Customer,</p>
    <p>We regret to inform you that your warranty claim could not be accepted.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; color: #6b7280;">Claim ID</td><td style="padding: 8px; font-weight: bold;">${claimId}</td></tr>
      <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Reason</td><td style="padding: 8px; color: #dc2626;">${rejectionReason}</td></tr>
    </table>
    <p>If you have any questions, please contact our support team.</p>
  `);
  return { subject, html };
};

// ==========================================
// Export all templates and sendEmail
// ==========================================
module.exports = {
  sendEmail,
  templates: {
    bookingAccepted,
    bookingRejected,
    pickupAssigned,
    statusUpdated,
    billGenerated,
    paymentReceived,
    loyaltyPointsCredited,
    warrantyActivated,
    warrantyClaimAccepted,
    warrantyClaimRejected,
  },
};
