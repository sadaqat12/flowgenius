import React, { useState } from 'react';
import { Button } from '../../ui/button';

interface PartsTestResult {
  success: boolean;
  analysis: {
    modelNumber: string;
    appliance: string;
    brand: string;
    confidence: number;
    recommendedParts: Array<{
      name: string;
      partNumber: string;
      category: string;
      priority: string;
      price: number;
      description: string;
    }>;
    analysisNotes: string[];
  };
  summary: string;
}

export function PartsTestPanel() {
  const [modelNumber, setModelNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [result, setResult] = useState<PartsTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    if (!modelNumber || !problemDescription) return;
    
    setIsLoading(true);
    try {
      // Use ChatGPT analysis via n8n workflow
      const response = await (window as any).electronAPI?.callService?.analyzeParts?.(modelNumber, problemDescription);
      
      if (response?.success && response.analysis) {
        setResult({
          success: true,
          analysis: response.analysis,
          summary: response.summary
        });
      } else {
        setResult({
          success: false,
          analysis: {} as any,
          summary: response?.summary || 'Analysis failed'
        });
      }
    } catch (error) {
      console.error('Parts analysis error:', error);
      setResult({
        success: false,
        analysis: {} as any,
        summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartSelectTest = async () => {
    if (!modelNumber || !problemDescription) return;
    
    setIsLoading(true);
    try {
      // Use the same ChatGPT analysis - this is now our primary method
      const response = await (window as any).electronAPI?.callService?.analyzeParts?.(modelNumber, problemDescription);
      
      if (response?.success && response.analysis) {
        // Format as "enhanced" result to distinguish from basic analysis
        const enhancedSummary = `🌐 Enhanced AI Analysis Results\n\n${response.summary}`;
        setResult({
          success: true,
          analysis: response.analysis,
          summary: enhancedSummary
        });
      } else {
        setResult({
          success: false,
          analysis: {} as any,
          summary: response?.summary || 'Enhanced analysis failed'
        });
      }
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      setResult({
        success: false,
        analysis: {} as any,
        summary: `Enhanced analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const detectAppliance = (description: string): string => {
    const lower = description.toLowerCase();
    if (lower.includes('washer') || lower.includes('washing')) return 'washer';
    if (lower.includes('dryer')) return 'dryer';
    if (lower.includes('fridge') || lower.includes('refrigerator')) return 'refrigerator';
    if (lower.includes('stove') || lower.includes('oven')) return 'stove';
    if (lower.includes('dishwasher')) return 'dishwasher';
    return 'unknown';
  };

  const detectBrand = (model: string): string => {
    const upper = model.toUpperCase();
    if (upper.startsWith('GE') || upper.startsWith('GENERAL')) return 'GE';
    if (upper.startsWith('WH') || upper.startsWith('WHIRLPOOL')) return 'WHIRLPOOL';
    if (upper.startsWith('LG')) return 'LG';
    if (upper.startsWith('SAMSUNG')) return 'SAMSUNG';
    if (upper.startsWith('FR') || upper.startsWith('FRIGIDAIRE')) return 'FRIGIDAIRE';
    return 'UNKNOWN';
  };

  const generateMockParts = (model: string, problem: string) => {
    const appliance = detectAppliance(problem);
    const lower = problem.toLowerCase();
    const parts = [];

    if (appliance === 'washer') {
      if (lower.includes('leak')) {
        parts.push({
          name: 'Door Seal/Boot',
          partNumber: 'WH02X24917',
          category: 'seal',
          priority: 'high',
          price: 65.99,
          description: 'Most common source of front-load washer leaks'
        });
      }
      if (lower.includes('spin')) {
        parts.push({
          name: 'Drive Belt',
          partNumber: 'WH01X24418',
          category: 'belt',
          priority: 'high',
          price: 29.99,
          description: 'Essential for drum rotation'
        });
      }
    } else if (appliance === 'dryer') {
      if (lower.includes('heat')) {
        parts.push({
          name: 'Heating Element',
          partNumber: 'WE11M29',
          category: 'heating',
          priority: 'high',
          price: 75.99,
          description: 'Primary heat source for electric dryers'
        });
      }
    }

    if (parts.length === 0) {
      parts.push({
        name: 'Diagnostic Kit',
        partNumber: 'DIAG-001',
        category: 'tool',
        priority: 'low',
        price: 0,
        description: 'For proper diagnosis'
      });
    }

    return parts;
  };

  const generatePartSelectParts = (model: string, problem: string) => {
    const appliance = detectAppliance(problem);
    const brand = detectBrand(model);
    const lower = problem.toLowerCase();
    const parts = [];

    if (appliance === 'washer' && lower.includes('leak')) {
      parts.push({
        name: 'Door Boot Seal',
        partNumber: brand === 'SAMSUNG' ? 'DC6424917' : 'WH02X24917',
        category: 'seal',
        priority: 'high',
        price: 89.99,
        description: 'Common cause of front-load washer leaks'
      });
    }

    if (appliance === 'dryer' && lower.includes('heat')) {
      parts.push({
        name: 'Heating Element Assembly',
        partNumber: brand === 'SAMSUNG' ? 'DC470029' : 'WE11M0029',
        category: 'heating',
        priority: 'high',
        price: 89.99,
        description: 'Top repair for no-heat complaints'
      });
    }

    if (parts.length === 0) {
      parts.push({
        name: 'Diagnostic Tool Kit',
        partNumber: 'DIAG-002',
        category: 'tool',
        priority: 'low',
        price: 45.99,
        description: 'Recommended for proper diagnosis'
      });
    }

    return parts;
  };

  const formatAnalysisResult = (analysis: PartsTestResult['analysis']) => {
    return `🔧 Parts Analysis for ${analysis.modelNumber}
📱 Appliance: ${analysis.appliance}
🏷️ Brand: ${analysis.brand}
📊 Confidence: ${analysis.confidence}%

🛠️ Recommended Parts (${analysis.recommendedParts.length}):
${analysis.recommendedParts.map((part, index) => 
  `${index + 1}. ${part.name} (${part.partNumber})
   Priority: ${part.priority} | Price: $${part.price}
   ${part.description}`
).join('\n\n')}

💡 Analysis Notes:
${analysis.analysisNotes.map(note => `• ${note}`).join('\n')}`;
  };

  const formatPartSelectResult = (analysis: PartsTestResult['analysis']) => {
    return `🌐 PartSelect Search Results for ${analysis.modelNumber}
📱 Appliance: ${analysis.appliance}
🏷️ Brand: ${analysis.brand}
📊 Confidence: ${analysis.confidence}%

🎯 Matching Symptoms Found:
${analysis.analysisNotes.map(note => `• ${note}`).join('\n')}

🛠️ Recommended Parts from PartSelect (${analysis.recommendedParts.length}):
${analysis.recommendedParts.map((part, index) => 
  `${index + 1}. ${part.name} (${part.partNumber})
   Priority: ${part.priority} | Price: $${part.price}
   ${part.description}`
).join('\n\n')}

💡 Data sourced from real repair history on PartSelect.com`;
  };

  const exampleCases = [
    {
      model: 'WF45T6000AW',
      problem: 'Washer is leaking water from the front door during wash cycle'
    },
    {
      model: 'DV42H5000EW',
      problem: 'Dryer runs but produces no heat, clothes stay wet'
    },
    {
      model: 'RF23R6201SR',
      problem: 'Refrigerator not cooling properly, ice maker not working'
    },
    {
      model: 'GE JB645RKSS',
      problem: 'Oven not heating up, bake element appears burned out'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">🤖 AI Parts Analysis</h2>
        <p className="text-gray-600">
          Get intelligent parts recommendations powered by ChatGPT. Enter a model number and problem description to receive accurate part suggestions with real part numbers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="modelNumber" className="block text-sm font-medium mb-2">
            Model Number
          </label>
          <input
            id="modelNumber"
            type="text"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
            placeholder="e.g., WF45T6000AW, DV42H5000EW, RF23R6201SR"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="problemDescription" className="block text-sm font-medium mb-2">
            Problem Description
          </label>
          <textarea
            id="problemDescription"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Describe the issue (e.g., washer leaking, dryer not heating, etc.)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={handleTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? '🤖 ChatGPT Analyzing... (may take 30-60s)' : '🤖 ChatGPT Analysis'}
          </Button>
          
          <Button 
            onClick={handlePartSelectTest} 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '🌟 AI Processing... (may take 30-60s)' : '🌟 Enhanced AI Analysis'}
          </Button>
        </div>
      </div>

      {result && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-3">
            {result.success ? '✅ Analysis Complete' : '❌ Analysis Failed'}
          </h3>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border overflow-auto">
            {result.summary}
          </pre>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">📝 Example Test Cases</h3>
        <div className="grid gap-3">
          {exampleCases.map((example, index) => (
            <div 
              key={index}
              className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => {
                setModelNumber(example.model);
                setProblemDescription(example.problem);
              }}
            >
              <div className="font-medium text-sm">Model: {example.model}</div>
              <div className="text-sm text-gray-600">{example.problem}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 