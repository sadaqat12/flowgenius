#!/usr/bin/env node

/**
 * Script to update the ChatGPT Parts Analysis workflow in n8n
 * This script uploads the workflow with the integrated parser
 */

const fs = require('fs');
const path = require('path');

// Configuration
const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
const WORKFLOW_FILE = path.join(__dirname, '../resources/workflows/chatgpt-parts-analysis.json');

async function updateWorkflow() {
  try {
    console.log('🔄 Updating ChatGPT Parts Analysis workflow in n8n...');
    
    // Read the workflow file
    if (!fs.existsSync(WORKFLOW_FILE)) {
      throw new Error(`Workflow file not found: ${WORKFLOW_FILE}`);
    }
    
    const workflowData = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
    console.log(`📄 Loaded workflow: ${workflowData.name}`);
    
    // Try to update existing workflow or create new one
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });
    
    if (!response.ok) {
      // If workflow already exists, try to update it
      const existingWorkflows = await fetch(`${N8N_BASE_URL}/api/v1/workflows`);
      const workflows = await existingWorkflows.json();
      
      const existing = workflows.data?.find(w => w.name === workflowData.name);
      if (existing) {
        console.log(`📝 Found existing workflow with ID: ${existing.id}`);
        
        // Update the existing workflow
        const updateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${existing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ ...workflowData, id: existing.id })
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update workflow: ${updateResponse.status} ${updateResponse.statusText}`);
        }
        
        console.log('✅ Workflow updated successfully!');
      } else {
        throw new Error(`Failed to create workflow: ${response.status} ${response.statusText}`);
      }
    } else {
      console.log('✅ Workflow created successfully!');
    }
    
    // Activate the workflow
    const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowData.id}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (activateResponse.ok) {
      console.log('✅ Workflow activated successfully!');
    } else {
      console.log('⚠️ Note: Could not activate workflow automatically');
    }
    
    console.log('🎉 ChatGPT workflow update complete!');
    console.log('');
    console.log('The workflow now includes:');
    console.log('• 🤖 Direct ChatGPT API integration');
    console.log('• 🔧 Embedded parts analysis parser');
    console.log('• 📊 Structured response formatting');
    console.log('• 🔄 Proper error handling and fallbacks');
    console.log('');
    console.log('Test the workflow with:');
    console.log(`curl -X POST ${N8N_BASE_URL}/webhook/chatgpt-parts-analysis \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"modelNumber": "WF45T6000AW", "problemDescription": "water leaking from front door", "appliance": "washer"}\'');
    
  } catch (error) {
    console.error('❌ Error updating workflow:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('• n8n server is running on http://localhost:5678');
    console.log('• API access is enabled in n8n settings');
    console.log('• You have the correct permissions');
    process.exit(1);
  }
}

// Run the update
updateWorkflow(); 