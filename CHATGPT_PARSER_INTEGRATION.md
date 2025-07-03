# ChatGPT Parts Analysis Parser Integration Guide

## 🎯 Overview

This guide explains how to integrate the new ChatGPT Parts Analysis Parser into FlowGenius Service Call Manager to properly handle ChatGPT output and convert it into structured data that your application expects.

## 🔧 **IMPORTANT FIX: Parser Location**

**Issue:** The application was trying to import the ChatGPT parser directly, causing a module error:
```
Error: Cannot find module '../utils/chatgpt-parser'
```

**Solution:** The parsing should happen **in the n8n workflow**, not in the application code. The n8n workflow contains the parser code and returns already-structured data to the application.

## 📦 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   n8n Workflow  │───▶│   ChatGPT API   │
│  (FlowGenius)   │    │  (with parser)  │    │   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │
         │                       ▼
         │              ┌─────────────────┐
         └──────────────│ Structured Data │
                        │   (PartsAnalysis)   │
                        └─────────────────┘
```

## 🚀 **Fixed Implementation**

### 1. **N8n Workflow** (`resources/workflows/chatgpt-parts-analysis.json`)
- **Complete workflow** with embedded parser code
- **Direct ChatGPT API integration** with proper authentication
- **Structured response formatting** that matches application expectations
- **Error handling** and fallback mechanisms

### 2. **Application Integration** (`src/main/services/call-service.ts`)
- **Removed parser import** (no longer needed in application)
- **Enhanced response handling** to process structured data from n8n
- **Fallback support** if n8n workflow fails
- **Detailed logging** for debugging and monitoring

## 🔄 **How It Works**

1. **User triggers parts analysis** in FlowGenius application
2. **Application sends request** to n8n webhook with model number and problem description
3. **N8n workflow processes request**:
   - Calls ChatGPT API with structured prompt
   - Runs embedded parser on ChatGPT response
   - Formats response as structured `PartsAnalysis` object
4. **Application receives structured data** and displays results

## 🛠️ **Installation Steps**

### Step 1: Update n8n Workflow
```bash
# Run the workflow update script
node scripts/update-chatgpt-workflow.js
```

### Step 2: Verify Workflow is Active
1. Open n8n editor: http://localhost:5678
2. Check "ChatGPT Parts Analysis" workflow is active
3. Verify webhook URL: `/webhook/chatgpt-parts-analysis`

### Step 3: Test the Integration
```bash
# Test the workflow directly
curl -X POST http://localhost:5678/webhook/chatgpt-parts-analysis \
  -H "Content-Type: application/json" \
  -d '{"modelNumber": "WF45T6000AW", "problemDescription": "water leaking from front door", "appliance": "washer"}'
```

### Step 4: Test in Application
1. Open FlowGenius application
2. Navigate to service call details
3. Click "Test ChatGPT Analysis" in workflow panel
4. Verify structured response is displayed

## 🔍 **Expected Response Format**

The n8n workflow returns this structure:
```json
{
  "success": true,
  "analysis": {
    "modelNumber": "WF45T6000AW",
    "appliance": "washer",
    "brand": "Samsung",
    "confidence": 90,
    "recommendedParts": [
      {
        "name": "Front Door (Boot) Gasket",
        "partNumber": "DC64-03788A",
        "category": "seal",
        "priority": "high",
        "price": 65,
        "description": "Tears, pinholes or hardened rubber will dribble water during the high-speed fill or spin"
      }
    ],
    "analysisNotes": [
      "Analyzed 3 recommended parts",
      "Detected appliance: washer",
      "Confidence level: 90%"
    ],
    "timestamp": "2025-01-05T10:30:00.000Z",
    "source": "ChatGPT"
  }
}
```

## 🐛 **Troubleshooting**

### Common Issues:

1. **"Module not found" Error**
   - ✅ **Fixed**: Parser code is now in n8n workflow, not application
   - No longer imports `../utils/chatgpt-parser`

2. **N8n Workflow Not Responding**
   - Check n8n server is running: `http://localhost:5678`
   - Verify workflow is active in n8n editor
   - Check webhook URL is correct

3. **Fallback Analysis Instead of ChatGPT**
   - Check n8n logs for errors
   - Verify OpenAI API key is configured in n8n credentials
   - Test workflow directly with curl command

4. **Incomplete Analysis Data**
   - Check ChatGPT response format matches expected structure
   - Verify parser code is working correctly in n8n workflow

## 🎯 **Benefits of This Approach**

1. **✅ No Module Dependencies**: Application doesn't need to import parser
2. **✅ Centralized Processing**: All ChatGPT logic contained in n8n workflow
3. **✅ Easy Updates**: Modify parser by updating workflow, not application code
4. **✅ Better Error Handling**: Fallback mechanisms at both n8n and application levels
5. **✅ Scalable**: Can add more AI-powered workflows without touching application code

## 📋 **Next Steps**

1. **Add More Workflows**: Create additional n8n workflows for other AI tasks
2. **Enhance Parser**: Improve part detection and categorization logic
3. **Add Validation**: Implement response validation in n8n workflow
4. **Monitor Performance**: Track workflow execution times and success rates
5. **Custom Prompts**: Allow customization of ChatGPT prompts per appliance type

## 🔧 **Development Notes**

- The parser code is embedded in the n8n workflow's Code Node
- All parsing logic is contained in the workflow, not the application
- The application only handles the structured response from n8n
- Fallback mechanisms ensure the application continues working even if ChatGPT fails

## 🎉 **Success!**

The ChatGPT parser integration is now working correctly:
- ✅ No module import errors
- ✅ Parsing happens in n8n workflow
- ✅ Application receives structured data
- ✅ Fallback mechanisms in place
- ✅ Ready for production use

You can now trigger ChatGPT parts analysis from the FlowGenius application and receive properly structured, actionable parts recommendations! 