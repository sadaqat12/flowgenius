# Advanced Automation Workflows

## 📱 SMS + Parts Recommendation Workflow

### **Business Value**
- **Customer Experience**: Proactive communication builds trust
- **Technician Efficiency**: Right parts on first visit = faster repairs
- **Cost Savings**: Reduce return trips and customer complaints
- **Revenue Growth**: Better preparation = more jobs per day

### **Workflow Design**

#### **Step 1: Service Call Scheduled (Trigger)**
```javascript
// Webhook triggered when service call status changes to "Scheduled"
// Data received: callId, customerName, phone, address, scheduledDateTime, problemDesc
```

#### **Step 2: Send SMS Confirmation**
```javascript
// Twilio SMS Node
const message = `Hi ${customerName}! Your ${appliance} service is scheduled for ${scheduledDateTime} at ${address}. 

To help our technician bring the right parts, could you please reply with the model number? It's usually on a sticker inside the door or on the back.

Reply: MODEL [your model number]

Thanks! - Your Service Team`;

// Send SMS to customer phone number
```

#### **Step 3: Model Number Response Handler**
```javascript
// Webhook to receive SMS responses
// Parse incoming SMS for model number
const incomingText = $json.Body.toLowerCase();
const modelMatch = incomingText.match(/model\s+([a-z0-9\-]+)/i);

if (modelMatch) {
  const modelNumber = modelMatch[1];
  return {
    callId: $json.callId,
    modelNumber: modelNumber,
    customerPhone: $json.From
  };
} else {
  // Send clarification message
  return { needsHelp: true };
}
```

#### **Step 4: Parts Lookup Integration**
```javascript
// Query parts database/API
const partsRecommendations = await lookupParts({
  modelNumber: $json.modelNumber,
  problemDescription: $json.problemDesc,
  appliance: $json.appliance
});

// Available parts databases with APIs:
// - RepairClinic.com (Contact for API access)
// - AppliancePartsPros.com (Custom scraping/integration)
// - Internal parts inventory database
// - Rule-based fallback system (always works)
```

#### **Step 5: Update Service Call**
```javascript
// HTTP Request to update service call
const updateData = {
  callId: $json.callId,
  modelNumber: $json.modelNumber,
  recommendedParts: partsRecommendations,
  status: 'Ready for Service'
};

// POST to /api/service-calls/update
```

#### **Step 6: Notify Technician**
```javascript
// Email/SMS to assigned technician
const technicianMessage = `
Service Call Update: ${customerName}

Model: ${modelNumber}
Issue: ${problemDesc}

Recommended Parts to Bring:
${recommendedParts.map(p => `• ${p.name} (${p.partNumber})`).join('\n')}

Customer has been notified you'll have the right parts!
`;
```

## 🛠️ **Implementation in N8n**

### **Required Services:**

1. **SMS Service** (Choose one):
   - **Twilio** (Most popular, $0.0075/SMS)
   - **AWS SNS** (Cheap, $0.006/SMS)
   - **TextMagic** (Good international coverage)

2. **Parts Database** (Choose one):
   - **RepairClinic.com** - Contact for API partnership
   - **AppliancePartsPros.com** - Web scraping integration
   - **Custom Database** - Build your own parts lookup
   - **Rule-Based System** - Smart fallback (recommended to start)

### **N8n Workflow Setup:**

#### **1. Create SMS Confirmation Workflow**
```json
{
  "name": "SMS Confirmation + Model Request",
  "nodes": [
    {
      "name": "Call Scheduled Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "call-scheduled",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Send SMS Confirmation",
      "type": "n8n-nodes-base.twilio",
      "parameters": {
        "operation": "send",
        "from": "{{$env.TWILIO_PHONE_NUMBER}}",
        "to": "={{$json.customerPhone}}",
        "message": "Hi {{$json.customerName}}! Your service is scheduled for {{$json.scheduledDateTime}}. Please reply with MODEL [your model number] to help our tech bring the right parts. Thanks!"
      }
    }
  ]
}
```

#### **2. Create Model Number Response Handler**
```json
{
  "name": "Model Number Handler",
  "nodes": [
    {
      "name": "SMS Response Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "sms-response",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Parse Model Number",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
const incomingText = $json.Body.toLowerCase();
const modelMatch = incomingText.match(/model\\s+([a-z0-9\\-_]+)/i);

if (modelMatch) {
  return [{
    modelNumber: modelMatch[1].toUpperCase(),
    customerPhone: $json.From,
    hasModel: true
  }];
} else {
  return [{
    customerPhone: $json.From,
    hasModel: false,
    needsHelp: true
  }];
}
        `
      }
    }
  ]
}
```

#### **3. Create Parts Lookup Workflow (Rule-Based)**
```json
{
  "name": "Smart Parts Recommendation Engine",
  "nodes": [
    {
      "name": "Generate Parts Recommendations",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": `
// Smart rule-based parts recommendation system
const modelNumber = $json.modelNumber || '';
const problemDesc = ($json.problemDesc || '').toLowerCase();
const appliance = detectAppliance(problemDesc);

function detectAppliance(desc) {
  if (desc.includes('washer') || desc.includes('washing')) return 'washer';
  if (desc.includes('dryer')) return 'dryer';  
  if (desc.includes('stove') || desc.includes('oven') || desc.includes('range')) return 'stove';
  if (desc.includes('fridge') || desc.includes('refrigerator')) return 'refrigerator';
  if (desc.includes('dishwasher')) return 'dishwasher';
  return 'appliance';
}

function getRecommendedParts(appliance, problem, model) {
  const parts = [];
  const brand = model.substring(0, 2);
  
  switch (appliance) {
    case 'washer':
      if (problem.includes('leak')) {
        parts.push({
          name: 'Door Seal/Boot',
          partNumber: 'WH02X24917',
          category: 'seal',
          priority: 'high',
          price: 65.99,
          description: 'Common cause of front-load washer leaks'
        });
      }
      if (problem.includes('spin') || problem.includes('agitate')) {
        parts.push({
          name: 'Drive Belt',
          partNumber: 'WH01X24418', 
          category: 'belt',
          priority: 'high',
          price: 29.99,
          description: 'Essential for drum movement'
        });
      }
      if (problem.includes('drain') || problem.includes('water')) {
        parts.push({
          name: 'Drain Pump',
          partNumber: 'WH23X24178',
          category: 'pump',
          priority: 'medium',
          price: 89.99,
          description: 'Removes water from tub'
        });
      }
      break;
      
    case 'dryer':
      if (problem.includes('heat') || problem.includes('not drying')) {
        parts.push({
          name: 'Heating Element',
          partNumber: 'WE11M29',
          category: 'heating',
          priority: 'high',
          price: 75.99,
          description: 'Primary heat source'
        });
      }
      if (problem.includes('belt') || problem.includes('drum')) {
        parts.push({
          name: 'Drive Belt',
          partNumber: 'WE12M29',
          category: 'belt', 
          priority: 'high',
          price: 35.99,
          description: 'Rotates the drum'
        });
      }
      break;
      
    case 'refrigerator':
      if (problem.includes('ice') || problem.includes('water')) {
        parts.push({
          name: 'Water Filter',
          partNumber: 'RPWFE',
          category: 'filter',
          priority: 'medium',
          price: 45.99,
          description: 'Replace every 6 months'
        });
      }
      if (problem.includes('cool') || problem.includes('temperature')) {
        parts.push({
          name: 'Evaporator Fan Motor',
          partNumber: 'WR60X10220',
          category: 'cooling',
          priority: 'high', 
          price: 125.99,
          description: 'Circulates cold air'
        });
      }
      break;
  }
  
  // Add common parts for all appliances
  parts.push({
    name: 'Multi-meter',
    partNumber: 'TOOL-001',
    category: 'tool',
    priority: 'low',
    price: 0,
    description: 'For diagnostic testing'
  });
  
  return parts.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[b.priority] - priority[a.priority];
  });
}

const recommendedParts = getRecommendedParts(appliance, problemDesc, modelNumber);

return {
  modelNumber,
  appliance,
  recommendedParts,
  partsCount: recommendedParts.length,
  confidence: 'rule-based',
  timestamp: new Date().toISOString()
};
        `
      }
    }
  ]
}
```

## 📱 **Additional SMS Automation Ideas**

### **1. Appointment Reminders**
```javascript
// 24 hours before appointment
"Reminder: Your appliance service is tomorrow at 2 PM. Our tech will have the parts ready based on your model number. Reply STOP to cancel."
```

### **2. Technician En Route**
```javascript
// When technician starts driving
"Good news! Your technician John is on his way and should arrive in 15-20 minutes. He has your parts ready!"
```

### **3. Post-Service Follow-up**
```javascript
// 2 hours after completion
"How was your service experience today? Reply 1-5 (5=excellent) or call us with any concerns. Thanks for choosing us!"
```

### **4. Parts Availability Updates**
```javascript
// If parts need to be ordered
"Your parts are ordered and will arrive Tuesday. We'll reschedule your service for Wednesday 10 AM. Reply YES to confirm."
```

## 🎯 **ROI Calculation**

### **Cost Savings:**
- **Reduced Return Trips**: $50 per avoided return trip
- **Higher First-Time Fix Rate**: 85% → 95% = +$30 per call
- **Technician Efficiency**: +2 calls per day = +$200 daily revenue

### **Implementation Costs:**
- **Twilio SMS**: ~$30/month for 1000 calls
- **Parts Database**: FREE (rule-based system)
- **Development Time**: 1-2 days initial setup

### **Break-even**: ~30 service calls

## 🚀 **Quick Start Guide**

### **Phase 1: Basic SMS (1 day)**
1. Set up Twilio account
2. Create webhook in n8n for "call scheduled"
3. Send confirmation SMS with model number request

### **Phase 2: Model Collection (1 day)** 
1. Set up SMS response webhook
2. Parse model numbers from customer responses
3. Update service call records

### **Phase 3: Smart Parts System (1 day)**
1. Implement rule-based parts recommendation
2. Create technician notification system
3. Test end-to-end workflow

### **Phase 4: Advanced Features (ongoing)**
- Appointment reminders
- Satisfaction surveys  
- Parts ordering integration
- Route optimization

## 📊 **Success Metrics**

- **First-Time Fix Rate**: Target 95%+
- **Customer Satisfaction**: Target 4.8/5
- **Average Calls per Technician**: +25%
- **SMS Response Rate**: 70%+ to model requests
- **Customer Response Rate**: 80%+ to confirmations

**The rule-based system works immediately** and provides real value while you explore API partnerships with parts suppliers later!

Would you like me to help you implement any of these workflows in your n8n instance? 