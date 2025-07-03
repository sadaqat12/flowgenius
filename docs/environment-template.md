# Environment Configuration

Create a `.env` file in the project root with the following variables:

## Database Configuration (Supabase)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Example (replace with your actual values):
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## N8n Workflow Engine Configuration
```bash
# N8n Server Configuration
N8N_PORT=5678
N8N_HOST=localhost

# N8n Authentication (Basic Auth for UI access)
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123

# N8n Security
N8N_ENCRYPTION_KEY=service-call-manager-n8n-key

# N8n API Key (Required for n8n v1.100+)
# Generate this from the n8n UI: Settings → API Keys → Create
# N8N_API_KEY=your_generated_api_key_here

# Optional: External n8n instance (if not using embedded server)
# N8N_EXTERNAL_URL=https://your-n8n-instance.com
```

## OpenAI API Configuration
```bash
# OpenAI API Key (Required for ChatGPT Parts Analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Example:
# OPENAI_API_KEY=sk-1234567890abcdef...
```

## Setting Up N8n API Access

### **For First-Time Setup (n8n v1.100+):**

1. **Start the Application**:
   ```bash
   npm run dev
   ```

2. **Access N8n Editor**:
   - Open your browser to `http://localhost:5678`
   - Login with credentials: `admin` / `admin123` (or your configured values)

3. **Generate API Key**:
   - Go to **Settings** → **API Keys** in the n8n interface
   - Click **"Create an API Key"**
   - Give it a name like "Service Call Manager"
   - Copy the generated API key

4. **Update Environment**:
   ```bash
   # Add to your .env file
   N8N_API_KEY=your_copied_api_key_here
   ```

5. **Restart Application**:
   ```bash
   # Stop the app (Ctrl+C) and restart
   npm run dev
   ```

### **What Works Without API Key:**
- ✅ N8n server starts and runs
- ✅ Web interface accessible 
- ✅ Manual workflow creation in n8n editor
- ✅ Webhook triggers work
- ✅ Local workflow fallbacks

### **What Requires API Key:**
- ❌ Automatic workflow creation via API
- ❌ Workflow status monitoring via API  
- ❌ Programmatic workflow execution
- ❌ Workflow list display in app

## Setting Up OpenAI API Access

### **For ChatGPT Parts Analysis:**

1. **Get OpenAI API Key**:
   - Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign in or create an OpenAI account
   - Click **"Create new secret key"**
   - Give it a name like "Service Call Manager"
   - Copy the generated API key (starts with `sk-`)

2. **Add to Environment**:
   ```bash
   # Add to your .env file
   OPENAI_API_KEY=sk-your_copied_api_key_here
   ```

3. **Restart Application**:
   ```bash
   # Stop the app (Ctrl+C) and restart
   npm run dev
   ```

### **What Works Without OpenAI API Key:**
- ✅ Application starts normally
- ✅ All service call management features
- ✅ Fallback parts analysis with basic recommendations
- ✅ Workflow system with local fallbacks

### **What Requires OpenAI API Key:**
- ❌ ChatGPT-powered parts analysis
- ❌ AI-generated part recommendations with real part numbers
- ❌ Enhanced diagnostic insights from AI

## Troubleshooting N8n Issues

**"n8n server is not ready":**
- The server starts but API access is limited without API key
- This is normal behavior for n8n v1.100+
- Generate an API key as described above

**Port already in use:**
```bash
# Check what's using port 5678
lsof -i :5678

# Kill existing n8n processes
pkill -f "n8n start"
```

**Can't access n8n editor:**
- Verify the server is running: `curl http://localhost:5678`
- Check basic auth credentials in your `.env` file
- Try different port if 5678 is blocked

**API key not working:**
- Ensure the key is correctly copied (no extra spaces)
- Restart the application after adding the key
- Check the key hasn't expired in n8n settings

## Application Configuration
```bash
# Development Mode
NODE_ENV=development

# Security Settings
ELECTRON_SECURITY_WARNINGS=false

# AI Integration (Required for Parts Analysis)
OPENAI_API_KEY=your_openai_api_key

# Optional: Additional AI providers
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Security Notes

1. **Never commit the `.env` file** - it's already in `.gitignore`
2. **Use strong passwords** for N8n basic auth in production
3. **Change default encryption key** for production deployments
4. **API keys** should be kept secret and rotated regularly

## Default Configuration

The application will work with default values if no `.env` file is provided:
- N8n will run on `localhost:5678` with `admin/admin123` credentials
- Local SQLite database will be used for development
- All workflow features will have local fallbacks

## Production Configuration

For production deployments:
```bash
NODE_ENV=production
N8N_BASIC_AUTH_PASSWORD=your_secure_password_here
N8N_ENCRYPTION_KEY=your_unique_32_character_encryption_key
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key
```

## Validation

The application will validate configuration on startup and show warnings for:
- Missing required environment variables
- Insecure default passwords in production
- Invalid URLs or keys

## Troubleshooting

**N8n won't start:**
- Check if port 5678 is available
- Verify n8n is installed: `npm list n8n`
- Check the main process logs in the Electron console

**Database connection issues:**
- Verify Supabase URL and key format
- Check network connectivity
- Ensure Supabase project is active

**Workflow authentication errors:**
- Verify N8n basic auth credentials
- Check if N8n server is running and accessible
- Confirm encryption key matches server configuration 