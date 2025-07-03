# Troubleshooting Guide

## Common Issues and Solutions

### ❌ Webhook "POST check-stale-calls" is not registered

**Problem**: The application shows an error about webhook not being registered in n8n.

**Solution**:
1. **Setup the missing workflow**:
   ```bash
   node scripts/setup-stale-calls-workflow.js
   ```

2. **Manual setup** (if script fails):
   - Open n8n editor: http://localhost:5678
   - Import the workflow from `resources/workflows/stale-calls-workflow.json`
   - Activate the workflow using the toggle in the top-right

3. **Verify the webhook is active**:
   - Check that the workflow is "Active" in n8n
   - Test the webhook manually:
     ```bash
     curl -X POST http://localhost:5678/webhook/check-stale-calls \
       -H "Content-Type: application/json" \
       -d '{"staleCalls":[]}'
     ```

---

### ❌ N8n server not running

**Problem**: Connection refused to localhost:5678

**Solution**:
1. **Start n8n server**:
   ```bash
   npm run n8n:start
   ```

2. **Check if port is available**:
   ```bash
   lsof -i :5678
   ```

3. **Alternative port** (if 5678 is taken):
   ```bash
   N8N_PORT=5679 npm run n8n:start
   ```
   Then update the port in your application settings.

---

### ❌ Frontend server not running

**Problem**: ERR_CONNECTION_REFUSED to http://127.0.0.1:5173/

**Solution**:
1. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

2. **Check if port is available**:
   ```bash
   lsof -i :5173
   ```

3. **Clear cache and restart**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

### ❌ Workflow not responding/timing out

**Problem**: Webhooks are slow or timing out

**Solution**:
1. **Check n8n logs**:
   - Look for errors in the n8n console
   - Check workflow execution history

2. **Increase timeout**:
   ```typescript
   // In n8n-service.ts, increase timeout
   const response = await axios.post(url, data, {
     timeout: 30000, // 30 seconds
   });
   ```

3. **Test workflow manually**:
   - Use n8n editor to manually execute the workflow
   - Check each node for errors

---

### ❌ Database connection issues

**Problem**: Database queries failing

**Solution**:
1. **Check Supabase connection**:
   ```bash
   npx supabase status
   ```

2. **Restart Supabase**:
   ```bash
   npx supabase stop
   npx supabase start
   ```

3. **Check environment variables**:
   ```bash
   cat .env | grep SUPABASE
   ```

---

### ❌ Auto-tagging not working

**Problem**: Auto-tagging workflow fails

**Solution**:
1. **Setup ChatGPT workflow**:
   ```bash
   node scripts/setup-chatgpt-workflow.js
   ```

2. **Check OpenAI API key**:
   - Verify API key in n8n credentials
   - Test API key with a simple request

3. **Fallback to local analysis**:
   - The system will automatically use local analysis if ChatGPT fails
   - Check console logs for fallback messages

---

### ❌ Notifications not showing

**Problem**: Desktop notifications not appearing

**Solution**:
1. **Check system permissions**:
   - Allow notifications for your terminal/application
   - Check "Do Not Disturb" settings

2. **Test notification manually**:
   ```javascript
   // In Electron console
   new Notification('Test', { body: 'Test notification' }).show();
   ```

3. **Check notification settings**:
   - Verify notification permissions in system preferences

---

## Debugging Steps

### 1. Check Service Status
```bash
# Check what services are running
npm run status

# Check specific ports
lsof -i :5678  # n8n
lsof -i :5173  # frontend
lsof -i :54321 # supabase
```

### 2. View Logs
```bash
# Application logs
npm run electron:dev

# N8n logs
tail -f ~/.n8n/logs/n8n.log

# Supabase logs
npx supabase logs
```

### 3. Test Each Component

**Test n8n connectivity**:
```bash
curl http://localhost:5678
```

**Test webhook**:
```bash
curl -X POST http://localhost:5678/webhook/check-stale-calls \
  -H "Content-Type: application/json" \
  -d '{"staleCalls":[]}'
```

**Test database**:
```bash
npx supabase db reset
```

### 4. Reset Everything
```bash
# Complete reset
npm run clean
npm install
npx supabase stop
npx supabase start
npm run setup
```

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs** for specific error messages
2. **Search existing issues** in the project repository
3. **Create a new issue** with:
   - Error messages
   - Steps to reproduce
   - System information
   - Log output

---

## Prevention Tips

- Always start services in order: Database → n8n → Frontend → Electron
- Keep your workflows backed up in the `resources/workflows/` directory
- Regularly test your automation workflows
- Monitor system resources (CPU, memory) when running multiple services 