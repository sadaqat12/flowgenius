# N8n Workflow Automation Setup Guide

## 🎯 Quick Start (5 Minutes)

Follow these steps to get workflow automation working in your Service Call Manager:

### **Step 1: Start the Application**
```bash
npm run dev
```

### **Step 2: Verify N8n Server**
- Look for "Workflow Automation" panel in any service call details page
- You should see "n8n Server: Ready" status
- If not ready, check troubleshooting section below

### **Step 3: Access N8n Editor**
- Click **"Open Editor"** button in the workflow panel
- OR visit `http://localhost:5678` directly
- Login with: `admin` / `admin123` (default credentials)

### **Step 4: Generate API Key**
1. In n8n editor, click **Settings** (gear icon in sidebar)
2. Go to **"API Keys"** section
3. Click **"Create an API Key"**
4. Name: `Service Call Manager` 
5. **Copy the generated key** (you won't see it again!)

### **Step 5: Configure API Key**
1. Create/edit `.env` file in project root:
   ```bash
   N8N_API_KEY=your_copied_api_key_here
   ```
2. Restart the application:
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

### **Step 6: Verify Full Integration**
- Return to the workflow panel in your app
- You should now see workflow counts and full n8n features
- The amber "API Key Required" message should disappear

---

## 🔧 **What Each Feature Does**

### **Without API Key (Limited Mode):**
✅ **N8n server runs** - You can create workflows manually  
✅ **Editor access** - Full visual workflow designer available  
✅ **Webhook triggers** - Workflows can be triggered by external events  
✅ **Local fallbacks** - All features work with rule-based logic  

### **With API Key (Full Mode):**
✅ **All limited mode features** +  
🚀 **Workflow monitoring** - See active/inactive workflows in app  
🚀 **Automatic workflow creation** - App can create workflows programmatically  
🚀 **Status reporting** - Real-time execution monitoring  
🚀 **Advanced automation** - Full API access for complex workflows  

---

## 🎨 **Current Workflow Features**

### **Auto-Tagging System**
- **What**: Analyzes service call descriptions to categorize appliances
- **Triggers**: Automatically when you create a new service call
- **Appliances**: Washer, Dryer, Stove/Oven, Refrigerator
- **Output**: Category, urgency level, estimated duration, suggested parts

### **Stale Call Detection**  
- **What**: Monitors calls that need attention
- **Schedule**: Checks every hour automatically
- **Thresholds**: 
  - New calls not scheduled within 24 hours
  - In-progress calls not updated within 24 hours
  - On-hold calls not updated within 48 hours
- **Action**: Desktop notifications with customer details

### **Desktop Notifications**
- **What**: Native OS notifications for important events
- **Triggers**: Stale calls detected, workflow completions
- **Features**: Click to view details, non-intrusive alerts

---

## 🛠️ **Creating Custom Workflows**

### **Using the N8n Visual Editor:**

1. **Access Editor**: Click "Open Editor" in the workflow panel
2. **Create Workflow**: Click "New Workflow" 
3. **Add Nodes**: Drag nodes from the left panel
4. **Connect Nodes**: Click and drag between node connectors
5. **Configure**: Click nodes to set parameters and logic
6. **Test**: Use "Execute Workflow" to test your automation
7. **Activate**: Toggle the workflow to "Active" when ready

### **Useful Node Types for Service Calls:**

- **📅 Cron Trigger**: Schedule workflows (hourly, daily, etc.)
- **🔗 Webhook**: Trigger workflows from your app
- **📞 HTTP Request**: Call external APIs or your app's endpoints  
- **💻 Code**: Write custom JavaScript logic
- **📧 Email**: Send notifications to customers/technicians
- **📊 Spreadsheet**: Export data to Google Sheets/Excel
- **🗄️ Database**: Query or update your service call data

### **Example Workflows You Can Build:**

- **Customer Follow-up**: Email customers 24 hours after completion
- **Parts Reorder**: Check inventory and auto-order when low
- **Technician Assignment**: Auto-assign calls based on location/skills
- **Performance Reports**: Weekly summaries to managers
- **Emergency Escalation**: Urgent calls trigger immediate alerts

---

## 🚨 **Troubleshooting**

### **"N8n server is not ready"**
```bash
# Check if n8n is installed
npm list n8n

# Check if port is available
lsof -i :5678

# Kill any existing n8n processes
pkill -f "n8n start"

# Restart the app
npm run dev
```

### **"Cannot access n8n editor"**
- Verify URL: `http://localhost:5678`
- Check credentials: `admin` / `admin123`
- Try different browser or incognito mode
- Ensure no firewall blocking port 5678

### **"Workflows not showing in app"**
- This is normal without API key
- Follow Step 4-5 above to generate and configure API key
- Restart application after adding API key

### **"API key not working"**
- Ensure key is copied correctly (no extra spaces)
- Check `.env` file format: `N8N_API_KEY=your_key_here`
- Restart app after adding key
- Verify key hasn't expired in n8n settings

### **"Workflows not triggering"**
- Check workflow is "Active" in n8n editor
- Verify webhook URLs are correct
- Look for errors in n8n execution log
- Test workflows manually in editor first

---

## 🔐 **Security Best Practices**

### **Production Deployment:**
```bash
# Use strong passwords
N8N_BASIC_AUTH_PASSWORD=your_secure_password_123

# Use unique encryption key
N8N_ENCRYPTION_KEY=your_32_character_encryption_key_here

# Secure API key
N8N_API_KEY=your_production_api_key
```

### **Network Security:**
- N8n runs locally by default (localhost:5678)
- Change host/port for external access if needed
- Use firewall rules to restrict access
- Consider VPN for remote technician access

### **Data Privacy:**
- All workflows run locally on your machine
- No data sent to n8n cloud by default
- Telemetry disabled in our configuration
- API keys stored locally in .env file

---

## 📚 **Learning Resources**

- **N8n Documentation**: https://docs.n8n.io/
- **Workflow Examples**: https://n8n.io/workflows/
- **Node Reference**: https://docs.n8n.io/integrations/builtin/
- **Community Forum**: https://community.n8n.io/

---

## 💡 **Pro Tips**

1. **Start Simple**: Begin with basic workflows before building complex ones
2. **Test First**: Always test workflows manually before activating
3. **Use Webhooks**: Most reliable way to trigger workflows from your app
4. **Monitor Executions**: Check n8n execution log for debugging
5. **Version Control**: Export/import workflows to backup your automations
6. **Error Handling**: Add error nodes to handle failures gracefully

---

**🎉 You're now ready to automate your service call management with powerful n8n workflows!** 