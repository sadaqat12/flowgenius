/**
 * ChatGPT Parts Analysis Parser
 * Converts raw ChatGPT output into structured data for FlowGenius Service Call Manager
 */

/**
 * Main parser function to convert ChatGPT output to structured parts analysis
 * @param {Array} chatgptOutput - Raw output from ChatGPT n8n workflow
 * @param {string} modelNumber - Original model number from the request
 * @param {string} problemDescription - Original problem description
 * @returns {Object} Structured parts analysis data
 */
function parseChatGPTPartsAnalysis(chatgptOutput, modelNumber = '', problemDescription = '') {
  try {
    // Extract the text content from the output array
    const outputText = chatgptOutput?.[0]?.output || '';
    
    if (!outputText) {
      throw new Error('No output text found in ChatGPT response');
    }

    // Parse the structured data
    const parsedData = {
      modelNumber: extractModelNumber(outputText, modelNumber),
      appliance: extractAppliance(outputText),
      brand: extractBrand(outputText),
      confidence: extractConfidence(outputText),
      recommendedParts: extractRecommendedParts(outputText),
      analysisNotes: extractAnalysisNotes(outputText),
      timestamp: new Date().toISOString(),
      source: 'ChatGPT-4 via n8n',
      originalProblem: problemDescription,
      rawOutput: outputText
    };

    console.log('Parsed ChatGPT analysis:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error parsing ChatGPT output:', error);
    return createFallbackResponse(modelNumber, problemDescription, error.message);
  }
}

/**
 * Extract model number from text or use provided fallback
 */
function extractModelNumber(text, fallback = '') {
  // Look for model numbers in various formats
  const modelRegex = /(?:Samsung\s+)?([A-Z]{2,3}\d{2,3}[A-Z]\d{4}[A-Z]{2,3})/i;
  const match = text.match(modelRegex);
  return match ? match[1] : fallback;
}

/**
 * Extract appliance type from text
 */
function extractAppliance(text) {
  const applianceKeywords = {
    'washer': ['washer', 'washing machine', 'front door', 'boot gasket', 'spin cycle'],
    'dryer': ['dryer', 'heating element', 'lint trap', 'exhaust'],
    'refrigerator': ['refrigerator', 'freezer', 'compressor', 'evaporator'],
    'dishwasher': ['dishwasher', 'wash pump', 'drain hose', 'spray arm'],
    'stove': ['stove', 'oven', 'range', 'heating element', 'igniter'],
    'microwave': ['microwave', 'magnetron', 'turntable', 'door latch']
  };

  const textLower = text.toLowerCase();
  for (const [appliance, keywords] of Object.entries(applianceKeywords)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return appliance;
    }
  }
  return 'unknown';
}

/**
 * Extract brand from text
 */
function extractBrand(text) {
  const brandRegex = /\b(Samsung|LG|Whirlpool|GE|Maytag|Frigidaire|Bosch|KitchenAid|Electrolux|Kenmore)\b/i;
  const match = text.match(brandRegex);
  return match ? match[1] : 'Unknown';
}

/**
 * Extract confidence level (estimate based on content quality)
 */
function extractConfidence(text) {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence based on content quality indicators
  if (text.includes('OEM Part Number')) confidence += 0.1;
  if (text.includes('Diagnostic Tip')) confidence += 0.05;
  if (text.includes('Failure Mode')) confidence += 0.05;
  if (text.includes('genuine') || text.includes('verified')) confidence += 0.05;
  if (text.length > 500) confidence += 0.05; // Detailed response
  
  return Math.min(confidence, 0.95); // Cap at 95%
}

/**
 * Extract recommended parts from the text
 */
function extractRecommendedParts(text) {
  const parts = [];
  
  // First, split by the workflow section to separate parts from workflow
  const workflowSplit = text.split(/Suggested Workflow[^:]*:/i);
  const partsSection = workflowSplit[0]; // Only parse the parts section
  
  // Split text into sections by numbered items
  const sections = partsSection.split(/\d+\.\s+/);
  
  sections.forEach((section, index) => {
    if (index === 0) return; // Skip the intro section
    
    const part = parsePartSection(section, index);
    if (part && part.partNumber) { // Only include items with actual part numbers
      parts.push(part);
    }
  });
  
  return parts;
}

/**
 * Parse individual part section
 */
function parsePartSection(section, index) {
  try {
    // Extract part name (first line)
    const lines = section.split('\n').map(line => line.trim()).filter(line => line);
    const partName = lines[0] || `Part ${index}`;
    
    // Extract OEM part number
    const partNumberMatch = section.match(/(?:OEM\s+)?Part\s+Number:\s*([A-Z0-9-]+)/i);
    const partNumber = partNumberMatch ? partNumberMatch[1] : '';
    
    // Extract alternate part number
    const alternateMatch = section.match(/Alternate:\s*([A-Z0-9-]+)/i);
    const alternateNumber = alternateMatch ? alternateMatch[1] : '';
    
    // Extract failure mode
    const failureModeMatch = section.match(/Failure Mode:\s*([^•\n]+)/i);
    const failureMode = failureModeMatch ? failureModeMatch[1].trim() : '';
    
    // Extract diagnostic tip
    const diagnosticMatch = section.match(/Diagnostic Tip:\s*([^•\n]+(?:\n[^•\n]*)*)/i);
    const diagnosticTip = diagnosticMatch ? diagnosticMatch[1].trim() : '';
    
    // Determine category and priority
    const category = determinePartCategory(partName);
    const priority = determinePriority(failureMode, index);
    
    // Estimate price (placeholder - could be enhanced with real pricing data)
    const price = estimatePartPrice(partName, category);
    
    return {
      name: partName,
      partNumber: partNumber,
      alternatePartNumber: alternateNumber,
      category: category,
      priority: priority,
      price: price,
      description: `${failureMode} ${diagnosticTip}`.trim(),
      failureMode: failureMode,
      diagnosticTip: diagnosticTip
    };
  } catch (error) {
    console.error('Error parsing part section:', error);
    return null;
  }
}

/**
 * Determine part category based on name
 */
function determinePartCategory(partName) {
  const categoryMap = {
    'gasket': 'Seals & Gaskets',
    'seal': 'Seals & Gaskets',
    'clamp': 'Hardware',
    'spring': 'Hardware',
    'lock': 'Door & Latch',
    'latch': 'Door & Latch',
    'pump': 'Pumps & Motors',
    'motor': 'Pumps & Motors',
    'element': 'Heating Elements',
    'control': 'Electronics',
    'board': 'Electronics',
    'hose': 'Hoses & Connections',
    'valve': 'Valves & Controls'
  };
  
  const nameLower = partName.toLowerCase();
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (nameLower.includes(keyword)) {
      return category;
    }
  }
  return 'General';
}

/**
 * Determine priority based on failure mode and order
 */
function determinePriority(failureMode, index) {
  const priorityMap = {
    1: 'High',
    2: 'Medium',
    3: 'Low'
  };
  
  // High priority for water leaks, safety issues
  if (failureMode.toLowerCase().includes('leak') || 
      failureMode.toLowerCase().includes('water') ||
      failureMode.toLowerCase().includes('safety')) {
    return 'High';
  }
  
  return priorityMap[index] || 'Medium';
}

/**
 * Estimate part price (placeholder function)
 */
function estimatePartPrice(partName, category) {
  const priceRanges = {
    'Seals & Gaskets': [25, 85],
    'Hardware': [15, 45],
    'Door & Latch': [45, 120],
    'Pumps & Motors': [80, 250],
    'Heating Elements': [35, 95],
    'Electronics': [60, 200],
    'Hoses & Connections': [20, 60],
    'Valves & Controls': [30, 90],
    'General': [25, 75]
  };
  
  const range = priceRanges[category] || priceRanges['General'];
  return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
}

/**
 * Extract analysis notes and tips
 */
function extractAnalysisNotes(text) {
  const notes = [];
  
  // Extract workflow suggestions
  const workflowMatch = text.match(/Suggested Workflow[^:]*:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  if (workflowMatch) {
    const workflowText = workflowMatch[1].trim();
    const steps = workflowText.split(/\d+\.\s+/).filter(step => step.trim());
    steps.forEach(step => {
      if (step.trim()) {
        notes.push(`Workflow: ${step.trim()}`);
      }
    });
  }
  
  // Extract diagnostic tips
  const diagnosticMatches = text.match(/Diagnostic Tip:\s*([^•\n]+(?:\n[^•\n]*)*)/gi);
  if (diagnosticMatches) {
    diagnosticMatches.forEach(match => {
      const tip = match.replace(/Diagnostic Tip:\s*/i, '').trim();
      if (tip) {
        notes.push(`Diagnostic: ${tip}`);
      }
    });
  }
  
  // Extract general notes
  const generalNotes = text.match(/(?:Note|Important|Warning):\s*([^•\n]+)/gi);
  if (generalNotes) {
    generalNotes.forEach(note => {
      notes.push(note.trim());
    });
  }
  
  return notes;
}

/**
 * Create fallback response when parsing fails
 */
function createFallbackResponse(modelNumber, problemDescription, errorMessage) {
  return {
    modelNumber: modelNumber || 'Unknown',
    appliance: 'unknown',
    brand: 'Unknown',
    confidence: 0.3,
    recommendedParts: [],
    analysisNotes: [
      'Error parsing ChatGPT response',
      `Error: ${errorMessage}`,
      'Manual analysis recommended'
    ],
    timestamp: new Date().toISOString(),
    source: 'ChatGPT-4 via n8n (parsing failed)',
    originalProblem: problemDescription,
    rawOutput: null
  };
}

/**
 * Convert to AutoTagResult format for workflow integration
 */
function convertToAutoTagResult(partsAnalysis) {
  const categories = {
    'washer': 'Washing Machine',
    'dryer': 'Dryer',
    'refrigerator': 'Refrigerator',
    'dishwasher': 'Dishwasher',
    'stove': 'Stove/Oven',
    'microwave': 'Microwave'
  };
  
  const urgencyMap = {
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low'
  };
  
  // Determine overall urgency from parts
  const priorities = partsAnalysis.recommendedParts.map(part => part.priority);
  const overallUrgency = priorities.includes('High') ? 'High' : 
                        priorities.includes('Medium') ? 'Medium' : 'Low';
  
  return {
    category: categories[partsAnalysis.appliance] || 'General Appliance',
    urgency: overallUrgency,
    estimatedDuration: estimateDuration(partsAnalysis.recommendedParts.length, overallUrgency),
    suggestedParts: partsAnalysis.recommendedParts.map(part => part.name),
    confidence: partsAnalysis.confidence
  };
}

/**
 * Estimate repair duration based on parts count and urgency
 */
function estimateDuration(partsCount, urgency) {
  const baseTime = partsCount * 30; // 30 minutes per part
  const urgencyMultiplier = urgency === 'High' ? 1.5 : urgency === 'Low' ? 0.8 : 1.0;
  
  const totalMinutes = Math.ceil(baseTime * urgencyMultiplier);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Export functions for use in other modules
module.exports = {
  parseChatGPTPartsAnalysis,
  convertToAutoTagResult,
  extractModelNumber,
  extractAppliance,
  extractBrand,
  extractRecommendedParts,
  extractAnalysisNotes
};

// Example usage:
if (require.main === module) {
  // Test data
  const testOutput = [
    {
      "output": "Below are the three most common service-replaceable parts that allow water to escape from the front door of a Samsung WF45T6000AW. All numbers are genuine Samsung OEMs I've verified against Samsung parts documentation and aftermarket catalogs.  \n\n1. Front Door (Boot) Gasket  \n   • OEM Part Number: DC64-03788A  \n   • Alternate: AP6884238  \n   • Failure Mode: Tears, pinholes or hardened rubber will dribble water during the high-speed fill or spin.  \n   • Diagnostic Tip: Peel back the gasket lip all around (12 o'clock through 6 o'clock) and look for nicks or creases. Shine a flashlight behind the shell during a short rinse to spot fine leaks.  \n\n2. Boot Retaining (Spring) Clamp  \n   • OEM Part Number: DC97-04981D  \n   • Failure Mode: Loss of spring tension or corrosion lets the boot lip unseat from the stainless tub flange.  \n   • Diagnostic Tip: With the door open, push the spring inward; it should snap very tightly around the gasket bead. If it slips or you see rust points, replace.  \n\n3. Door Lock / Latch Assembly  \n   • OEM Part Number: DC64-00519D  \n   • Failure Mode: A mis-seated latch can prevent full gasket engagement or allow the door to sit slightly open under load.  \n   • Diagnostic Tip: Manually activate the lock switch with a multimeter on continuity mode—engaged it should be closed. Also cycle the lock a few times to feel for worn or rough action.  \n\nSuggested Workflow for Leak Diagnoses:  \n 1. Run a quick spin/drain only (no clothes), watch the boot–tub interface at eye level to pinpoint leak location.  \n 2. If you see weeping around the gasket body, follow step 1 above.  \n 3. If the gasket looks intact, remove the spring clamp (careful—tensioned!), inspect it and check its spring action.  \n 4. If both seal and clamp look good but the door isn't pulling tight, swap in the lock assembly last.  \n\nOrdering these three parts will cover >95 % of front-door leaks on this model. If you replace in the sequence above and still see a drip, re-verify leak source to ensure there's no tub crack or glass fault—those are extremely rare on this series."
    }
  ];
  
  const result = parseChatGPTPartsAnalysis(testOutput, 'WF45T6000AW', 'Water leaking from front door');
  console.log('Test Result:', JSON.stringify(result, null, 2));
  
  const autoTagResult = convertToAutoTagResult(result);
  console.log('AutoTag Result:', JSON.stringify(autoTagResult, null, 2));
} 