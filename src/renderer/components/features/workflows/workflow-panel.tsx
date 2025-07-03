import React, { useState } from 'react';
import { Bot, RefreshCw, MessageSquarePlus } from 'lucide-react';
import { Button } from '../../ui/button';
import { useElectronAPI } from '../../../hooks/use-electron-api';
import { ServiceCall } from '../../../../shared/types/ipc';

interface WorkflowPanelProps {
  call: ServiceCall;
}

export function WorkflowPanel({ call }: WorkflowPanelProps) {
  const { electronAPI } = useElectronAPI();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingModel, setIsRequestingModel] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalysis = async () => {
    if (!electronAPI || !call.id || !call.modelNumber || !call.problemDesc) return;

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      
      const result = await electronAPI.callService.analyzeParts(call.modelNumber, call.problemDesc);
      setAnalysisResult(result);
      
      console.log('Manual analysis result:', result);
      // Re-fetch call data to show updated AI fields
      // This is a simple way, a more robust solution might involve a state management library
      window.location.reload();
    } catch (error) {
      console.error('Error in manual analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestModelNumber = async () => {
    if (!electronAPI || !call.id) return;

    try {
      setIsRequestingModel(true);
      await electronAPI.workflows.trigger('request-model-number', {
        callId: call.id,
        customerPhone: call.phone,
      });
      alert('A request for the model number has been sent to the customer.');
    } catch (error) {
      console.error('Error requesting model number:', error);
      alert('Failed to request model number. See console for details.');
    } finally {
      setIsRequestingModel(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Workflow Automation</h3>
      </div>

      <div className="space-y-3">
        {/* Request Model Number */}
        {call.id && !call.modelNumber && (
          <div className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Request Model Number</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestModelNumber}
                disabled={isRequestingModel}
                className="flex items-center gap-1"
              >
                {isRequestingModel ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="h-3 w-3" />
                    Send SMS Request
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Send an SMS to the customer to ask for the appliance model number.
            </p>
          </div>
        )}

        {/* AI Parts Analysis */}
        {call.id && (
          <div className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-green-600" />
                <span className="font-medium">AI Parts Analysis</span>
              </div>
              <Button
                size="sm"
                onClick={handleAnalysis}
                disabled={isAnalyzing || !call.modelNumber}
                title={!call.modelNumber ? 'A model number is required to run analysis' : 'Run AI Parts Analysis'}
                className="flex items-center gap-1"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3" />
                    Analyze Manually
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Manually trigger AI analysis. This is done automatically when a model # is added.
            </p>
            
            {analysisResult && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border overflow-auto">
                  {analysisResult.summary}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 