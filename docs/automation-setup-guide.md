# SMS + Parts Automation Setup Guide

## 🚀 **Quick Start (30 minutes)**

### **Step 1: Set Up Twilio SMS Service (10 min)**

1. **Create Twilio Account**
   - Visit [twilio.com](https://twilio.com) and sign up
   - Get $15 free trial credit
   - Verify your phone number

2. **Get Twilio Credentials**
   ```bash
   # Add to your .env file:
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   TECHNICIAN_PHONE_NUMBER=+1987654321
   BUSINESS_PHONE=+1555123456
   ```

3. **Configure Webhooks**
   - In Twilio Console, go to Phone Numbers → Manage → Active Numbers
   - Click your Twilio number
   - Set webhook URL to: `http://localhost:5678/webhook/sms-response`

### **Step 2: Choose Parts API Service (5 min)**

**Option A: PartSelect API (Recommended)**
```bash
# Add to .env:
PARTSELECT_API_KEY=your_api_key_here
```
- Sign up at [partselect.com/api](https://www.partselect.com/api)
- $50/month for 1000+ requests
- Comprehensive appliance parts database

**Option B: RepairClinic API**
```bash
# Add to .env:  
REPAIRCLINIC_API_KEY=your_api_key_here
```

**Option C: Start Without Parts API**
- Workflow includes smart fallback system
- Uses rule-based parts recommendations
- Add API later for enhanced suggestions

### **Step 3: Import N8n Workflow (10 min)**

1. **Open N8n Editor** 
   ```bash
   # Your n8n should be running at:
   http://localhost:5678
   ```

2. **Import Workflow Template**
   - Click "+" → Import from file
   - Select `resources/templates/sms-parts-workflow.json`
   - Click Import

3. **Configure Credentials**
   - Click on any Twilio node
   - Add new Twilio credential with your Account SID + Auth Token
   - Save and activate workflow

### **Step 4: Connect to Your App (5 min)**

Add webhook endpoint to your service call status updates:

```typescript
// In your CallService or wherever you update call status
async updateServiceCallStatus(callId: number, status: string) {
  // ... existing update logic ...
  
  // If status changed to "Scheduled", trigger SMS workflow
  if (status === 'Scheduled') {
    const serviceCall = await this.getServiceCall(callId);
    
    // Trigger n8n workflow
    const webhookData = {
      callId: serviceCall.id,
      customerName: serviceCall.customerName,
      customerPhone: serviceCall.phone,
      address: serviceCall.address,
      problemDesc: serviceCall.problemDescription,
      scheduledDateTime: serviceCall.scheduledAt
    };
    
    // POST to n8n webhook
    fetch('http://localhost:5678/webhook/call-scheduled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
  }
}
```

## 🧪 **Testing Your Automation**

### **Test SMS Confirmation**
1. Create a service call in your app
2. Change status to "Scheduled"  
3. Check that SMS is sent to customer
4. Verify message includes model number request

### **Test Model Number Collection**
1. Reply to the SMS with: `MODEL ABC123XYZ`
2. Check that response is parsed correctly
3. Verify parts lookup is triggered
4. Confirm customer and technician get follow-up messages

### **Test Fallback System**
1. Reply with: `help` or `I can't find it`
2. Verify helpful guidance message is sent
3. Test with various model number formats

## 📊 **Advanced Configuration**

### **Custom Parts Recommendations**
Edit the `Process Parts Data` node to add your specific logic:

```javascript
// Add custom rules based on your experience
function generateFallbackParts(model, problem) {
  const parts = [];
  const lowerProblem = problem.toLowerCase();
  
  // Add your specific brand/model knowledge
  if (model.startsWith('LG')) {
    // LG-specific common parts
    if (lowerProblem.includes('drain')) {
      parts.push({
        name: 'LG Drain Pump Assembly',
        partNumber: 'LG-DP-' + model.substring(0, 3),
        price: 89.99
      });
    }
  }
  
  return parts;
}
```

### **Message Customization**
Update SMS templates in the Twilio nodes:

```javascript
// Professional service message
const smsMessage = `Hello ${customerName},

Your ${applianceType} service appointment is confirmed for ${formattedDateTime}.

To ensure our technician brings the correct parts for a successful first-visit repair, please reply with your appliance model number.

You can find this on a label:
• Inside the door frame
• On the back panel  
• Behind the bottom drawer

Reply: MODEL [your number]

Thank you,
${process.env.BUSINESS_NAME}
${process.env.BUSINESS_PHONE}`;
```

### **Multi-Language Support**
Add language detection and templates:

```javascript
// Detect customer language preference
const customerLang = detectLanguage(customerPhone) || 'en';

const messages = {
  en: "Hi! Your service is scheduled...",
  es: "¡Hola! Su servicio está programado...",
  fr: "Bonjour! Votre service est programmé..."
};

const smsMessage = messages[customerLang];
```

## 💡 **Business Optimization Tips**

### **Timing Optimization**
```javascript
// Send confirmations at optimal times
const now = new Date();
const hour = now.getHours();

// Don't send SMS too early or late
if (hour < 8 || hour > 20) {
  // Schedule for 9 AM next day
  const tomorrow9AM = new Date(now);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  
  // Schedule SMS instead of sending immediately
  scheduleMessage(smsMessage, tomorrow9AM);
}
```

### **Customer Segmentation**
```javascript
// Different message styles for different customer types
const customerType = await getCustomerType(customerId);

if (customerType === 'premium') {
  smsMessage = `${customerName}, your priority service...`;
} else if (customerType === 'maintenance_plan') {
  smsMessage = `Hello ${customerName}, as part of your maintenance plan...`;
}
```

### **Seasonal Adaptations**
```javascript
// Adjust messaging based on season/weather
const season = getCurrentSeason();
const weather = await getLocalWeather();

if (season === 'summer' && applianceType === 'ac') {
  urgencyLevel = 'high';
  additionalMessage = "Due to high demand, having your model number ready helps us serve you faster.";
}
```

## 📈 **Success Metrics to Track**

### **Key Performance Indicators**
```javascript
// Add tracking to your workflow
const metrics = {
  smsDeliveryRate: deliveredSMS / sentSMS,
  modelNumberResponseRate: modelsReceived / sentRequests,
  firstTimeFixRate: completedFirstVisit / totalVisits,
  customerSatisfactionIncrease: newRating - oldRating,
  technicianEfficiency: callsPerDay - previousAverage
};

// Goal targets:
// - SMS response rate: 70%+
// - First-time fix rate: 95%+  
// - Customer satisfaction: 4.8/5+
// - Technician efficiency: +25%
```

### **A/B Testing**
```javascript
// Test different message formats
const messageVariants = {
  formal: "Dear Mr./Ms. {lastName}, your service appointment...",
  casual: "Hi {firstName}! Your {appliance} service is set for...",
  urgent: "CONFIRMED: {appliance} repair {date} - Need model # for parts"
};

// Randomly assign and track conversion rates
```

### **ROI Calculation**
```javascript
const monthlyROI = {
  costs: {
    twilioSMS: 30,        // $30/month for SMS
    partsAPI: 100,        // $100/month for parts data
    developmentTime: 500  // One-time setup cost
  },
  savings: {
    reducedReturnTrips: 800,    // 16 avoided trips × $50
    increasedEfficiency: 1200,  // 2 extra calls/day × $30 × 20 days  
    higherSatisfaction: 400,    // Better reviews = more referrals
    reducedComplaint: 200       // Less time handling complaints
  },
  netMonthlyGain: 2600 - 130 // $2,470/month
};

// Break-even: ~3 weeks
// Annual ROI: ~2,000%
```

## 🎯 **Next Steps**

### **Week 1: Basic Implementation**
- [x] Set up Twilio account and test SMS
- [x] Import and configure n8n workflow  
- [x] Connect to service call status updates
- [x] Test end-to-end with real phone numbers

### **Week 2: Optimization**
- [ ] Add parts API integration
- [ ] Customize message templates
- [ ] Set up success metrics tracking
- [ ] Train staff on new process

### **Week 3: Advanced Features**  
- [ ] Add appointment reminders (24h before)
- [ ] Implement post-service satisfaction surveys
- [ ] Create technician performance dashboards
- [ ] Set up emergency response automation

### **Week 4: Scale & Monitor**
- [ ] Analyze first month's metrics
- [ ] A/B test different message formats
- [ ] Expand to additional workflow types
- [ ] Plan next automation projects

## 🆘 **Troubleshooting**

### **Common Issues**

**SMS Not Sending**
```bash
# Check Twilio credentials
curl -X GET "https://api.twilio.com/2010-04-01/Accounts.json" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN

# Expected: 200 OK with account info
```

**Model Numbers Not Parsing**
```javascript
// Test regex patterns with common formats
const testCases = [
  "MODEL ABC123",
  "abc123xyz",
  "The model is GE500X",  
  "It says WF45T6000AW on the label"
];

testCases.forEach(test => {
  const result = parseModelNumber(test);
  console.log(`"${test}" → ${result}`);
});
```

**Parts API Errors**
```javascript
// Add error handling and fallbacks
try {
  const parts = await partsAPI.search(modelNumber);
  return parts;
} catch (error) {
  console.log('Parts API failed, using fallback logic');
  return generateFallbackParts(modelNumber, problemDesc);
}
```

Ready to revolutionize your service business? Start with the basic SMS confirmation and build from there! 🚀 