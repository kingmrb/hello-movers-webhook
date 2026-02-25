const express = require('express');
const { Resend } = require('resend');

const app = express();
app.use(express.json());

// ===========================================
// CONFIGURATION (from environment variables)
// ===========================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = 'murad.r.bappi@gmail.com';
const FROM_EMAIL = 'Hello Movers <onboarding@resend.dev>';

// ===========================================
// HELPER FUNCTION
// ===========================================

function extractDataCollection(data) {
  // Find the data_collection array in the payload
  const dataArray = 
    data.analysis?.data_collection ||
    data.data_collection ||
    [];
  
  // Convert array format to simple key-value object
  const result = {};
  
  if (Array.isArray(dataArray)) {
    dataArray.forEach(item => {
      if (item.data_collection_id && item.value !== undefined) {
        result[item.data_collection_id] = item.value;
      }
    });
  }
  
  return result;
}

// ===========================================
// WEBHOOK ENDPOINT
// ===========================================

app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    
    // Log for debugging
    console.log('Webhook received');
    
    // Extract data using helper function
    const collectedData = extractDataCollection(data);
    
    console.log('=== EXTRACTED DATA ===');
    console.log(JSON.stringify(collectedData, null, 2));
    
    // Extract individual fields
    const callerName = collectedData.caller_name || 'Not provided';
    const phoneNumber = collectedData.phone_number || 'Not provided';
    const emailAddress = collectedData.email_address || 'Not provided';
    const reasonForCalling = collectedData.reason_for_calling || 'Not provided';
    const propertyType = collectedData.property_type || 'N/A';
    const bedrooms = collectedData.number_of_bedrooms || 'N/A';
    const pickupZip = collectedData.pickup_zip_code || 'N/A';
    const deliveryZip = collectedData.delivery_zip_code || 'N/A';
    const moveDate = collectedData.move_date || 'N/A';

    // Get call time
    const callTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    // Format the email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #2563eb; margin-bottom: 10px; font-size: 16px; }
    .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: 600; color: #6b7280; }
    .value { color: #111827; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .highlight { background-color: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📞 New Lead - Hello Movers</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">A new caller just contacted your business</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">📋 Contact Information</div>
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">${callerName}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">${phoneNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">${emailAddress}</span>
        </div>
        <div class="info-row">
          <span class="label">Reason for Call:</span>
          <span class="value">${reasonForCalling}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🚚 Move Details</div>
        <div class="info-row">
          <span class="label">Property Type:</span>
          <span class="value">${propertyType}</span>
        </div>
        <div class="info-row">
          <span class="label">Bedrooms:</span>
          <span class="value">${bedrooms}</span>
        </div>
        <div class="info-row">
          <span class="label">Pickup ZIP:</span>
          <span class="value">${pickupZip}</span>
        </div>
        <div class="info-row">
          <span class="label">Delivery ZIP:</span>
          <span class="value">${deliveryZip}</span>
        </div>
        <div class="info-row">
          <span class="label">Move Date:</span>
          <span class="value">${moveDate}</span>
        </div>
      </div>

      <div class="highlight">
        <strong>⏱️ Call Received:</strong> ${callTime} (Eastern Time)
      </div>
    </div>
    
    <div class="footer">
      This is an automated notification from your Hello Movers AI Receptionist
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email via Resend
    const resend = new Resend(RESEND_API_KEY);
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `📞 New Lead: ${callerName} - ${reasonForCalling}`,
      html: emailHtml
    });

    console.log('Email sent successfully!');
    console.log('Name:', callerName, '| Phone:', phoneNumber, '| Email:', emailAddress);
    
    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// HEALTH CHECK ENDPOINT
// ===========================================

app.get('/', (req, res) => {
  res.send('Hello Movers Email Webhook is running! (v3)');
});

// ===========================================
// START SERVER
// ===========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
