const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const N8N_BASE_URL = 'http://localhost:5678';
const WORKFLOW_PATH = path.join(__dirname, '../resources/workflows/stale-calls-workflow.json');

// Setup axios with authentication
const createAuthenticatedAxios = () => {
  const axiosInstance = axios.create({
    baseURL: N8N_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Use API key if available, otherwise basic auth
  if (process.env.N8N_API_KEY) {
    axiosInstance.defaults.headers['X-N8N-API-KEY'] = process.env.N8N_API_KEY;
    console.log('🔑 Using N8N API key for authentication');
  } else {
    // Fallback to basic auth
    const username = process.env.N8N_BASIC_AUTH_USER || 'admin';
    const password = process.env.N8N_BASIC_AUTH_PASSWORD || 'admin123';
    axiosInstance.defaults.auth = { username, password };
    console.log('🔑 Using basic auth for authentication');
  }

  return axiosInstance;
};

// Clean workflow data for API creation
const cleanWorkflowForApi = (workflowData) => {
  // Remove properties that n8n API doesn't accept
  const cleaned = {
    name: workflowData.name,
    nodes: workflowData.nodes.map(node => {
      // Remove node-specific properties that API doesn't accept
      const cleanNode = {
        parameters: node.parameters || {},
        id: node.id,
        name: node.name,
        type: node.type,
        typeVersion: node.typeVersion || 1,
        position: node.position || [0, 0]
      };
      
      // Remove webhookId from webhook nodes as it's auto-generated
      if (node.webhookId) {
        delete cleanNode.webhookId;
      }
      
      return cleanNode;
    }),
    connections: workflowData.connections || {}
    // Don't include 'active' property - it's read-only and set via separate activation API
  };
  
  // Always include settings (required by n8n API)
  cleaned.settings = workflowData.settings || {};
  
  return cleaned;
};

async function setupStaleCallsWorkflow() {
  try {
    console.log('🔄 Setting up Stale Calls Workflow...');
    
    // Check if n8n server is running
    try {
      await axios.get(N8N_BASE_URL);
      console.log('✅ N8n server is running');
    } catch (error) {
      console.error('❌ N8n server is not running. Please start it first:');
      console.error('   npm run dev');
      process.exit(1);
    }
    
    // Create authenticated axios instance
    const api = createAuthenticatedAxios();
    
    // Load the workflow JSON
    if (!fs.existsSync(WORKFLOW_PATH)) {
      console.error('❌ Workflow file not found:', WORKFLOW_PATH);
      process.exit(1);
    }
    
    const rawWorkflowData = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    const workflowData = cleanWorkflowForApi(rawWorkflowData);
    console.log('✅ Workflow file loaded and cleaned');
    
    // Check if workflow already exists
    try {
      const existingWorkflows = await api.get('/api/v1/workflows');
      const existingWorkflow = existingWorkflows.data.data.find(w => w.name === workflowData.name);
      
      if (existingWorkflow) {
        console.log(`⚠️  Workflow "${workflowData.name}" already exists (ID: ${existingWorkflow.id})`);
        
        try {
          // Update existing workflow
          await api.patch(`/api/v1/workflows/${existingWorkflow.id}`, {
            ...workflowData
          });
          
          console.log('✅ Workflow updated successfully');
          
          // Ensure it's activated
          if (!existingWorkflow.active) {
            await api.post(`/api/v1/workflows/${existingWorkflow.id}/activate`);
            console.log('✅ Workflow activated');
          } else {
            console.log('✅ Workflow already active');
          }
          
          return existingWorkflow.id;
        } catch (updateError) {
          console.error('❌ Failed to update existing workflow:', updateError.response?.data?.message || updateError.message);
          console.log('ℹ️  Skipping creation to avoid duplicates. Please update manually if needed.');
          return existingWorkflow.id;
        }
      }
    } catch (error) {
      console.log('📝 No existing workflows found, creating new workflow...');
    }
    
    // Create new workflow
    const response = await api.post('/api/v1/workflows', workflowData);
    const workflowId = response.data.id;
    
    console.log('✅ Workflow created successfully');
    console.log('📝 Workflow ID:', workflowId);
    
    // Activate the workflow
    try {
      await api.post(`/api/v1/workflows/${workflowId}/activate`);
      console.log('✅ Workflow activated');
    } catch (error) {
      console.warn('⚠️  Could not activate workflow automatically. Please activate it manually in the n8n editor.');
    }
    
    // Test the webhook
    console.log('🧪 Testing webhook...');
    try {
      const testData = {
        staleCalls: [
          {
            id: 'test-call-1',
            customerName: 'Test Customer',
            address: '123 Test St',
            status: 'InProgress',
            hoursSinceCreated: 25,
            hoursSinceUpdated: 25
          }
        ]
      };
      
      const testResponse = await axios.post(`${N8N_BASE_URL}/webhook/check-stale-calls`, testData);
      console.log('✅ Webhook test successful:', testResponse.data);
    } catch (error) {
      console.warn('⚠️  Webhook test failed. The workflow may need manual activation.');
      console.warn('   Error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('📋 Summary:');
    console.log('   - Stale Calls Workflow created/updated');
    console.log('   - Webhook available at: /webhook/check-stale-calls');
    console.log('   - The workflow will process stale calls and create notifications');
    console.log('\n🔗 Next steps:');
    console.log('   1. Open n8n editor: http://localhost:5678');
    console.log('   2. Verify the workflow is active (toggle should be ON)');
    console.log('   3. Test the integration in your application');
    
    return workflowId;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.response?.status === 401) {
      console.error('\n🔐 Authentication failed. Please check:');
      console.error('   1. N8N_API_KEY is set in your .env file');
      console.error('   2. API key is valid and not expired');
      console.error('   3. N8n server is properly configured');
    } else if (error.response?.status === 404) {
      console.error('\n🔍 API endpoint not found. Please check:');
      console.error('   1. N8n server is running');
      console.error('   2. N8n version supports the API endpoints');
    } else if (error.response?.status === 400) {
      console.error('\n🔍 Bad request. Error details:', error.response?.data);
    } else {
      console.error('Full error:', error);
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupStaleCallsWorkflow();
}

module.exports = setupStaleCallsWorkflow; 