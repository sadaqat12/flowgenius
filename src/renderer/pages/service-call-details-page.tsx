import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Phone, MapPin, Clock, Bot, Wrench, AlertCircle, DollarSign, Package, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useServiceCalls } from '../hooks/use-service-calls';
import { ServiceCallActions } from '../components/features/service-calls/service-call-actions';
import { EditServiceCallDialog } from '../components/features/service-calls/edit-service-call-dialog';
import { WorkLogsSection } from '../components/features/service-calls/work-logs-section';
import { WorkflowPanel } from '../components/features/workflows';
import { ServiceCall, ServiceCallUpdateData } from '../../shared/types/ipc';
import { useElectronAPI } from '../hooks/use-electron-api';

function ServiceCallDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { electronAPI } = useElectronAPI();
  const { getServiceCallById, updateServiceCall, deleteServiceCall } = useServiceCalls();
  
  const [call, setCall] = useState<ServiceCall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCall, setEditingCall] = useState<ServiceCall | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const loadCall = async () => {
      if (!id) {
        setError('No service call ID provided');
        setIsLoading(false);
        return;
      }

      // Don't reload if we already have this call loaded
      if (call && call.id === id) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
        // Wait a bit longer to ensure ElectronAPI is fully ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const serviceCall = await getServiceCallById(id);
        if (serviceCall) {
          setCall(serviceCall);
        } else {
          // Single retry after a delay
          await new Promise(resolve => setTimeout(resolve, 300));
          const retryServiceCall = await getServiceCallById(id);
          if (retryServiceCall) {
            setCall(retryServiceCall);
          } else {
            setError('Service call not found');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service call');
      } finally {
        setIsLoading(false);
      }
    };

    // Only load if we have an ID
    if (id) {
      loadCall();
    }
  }, [id, getServiceCallById]); // getServiceCallById is now stable with empty deps, safe to include

  // Listen for updates from the main process
  useEffect(() => {
    if (!electronAPI || !id) return;

    const cleanup = electronAPI.on('service-call-updated', (updatedCall: ServiceCall) => {
      // If the updated call matches the one on this page, refresh the data
      if (updatedCall && updatedCall.id === id) {
        console.log('Received updated service call from main process:', updatedCall);
        setCall(updatedCall);
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      cleanup();
    };
  }, [id, electronAPI]);

  const handleEdit = (call: ServiceCall) => {
    setEditingCall(call);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, data: ServiceCallUpdateData) => {
    const updatedCall = await updateServiceCall(id, data);
    if (updatedCall) {
      setCall(updatedCall);
    }
  };

  const handleDelete = async (callId: string) => {
    const success = await deleteServiceCall(callId);
    if (success) {
      navigate('/calls');
    }
  };

  const handleStatusChange = async (callId: string, status: ServiceCall['status']) => {
    const updatedCall = await updateServiceCall(callId, { status });
    if (updatedCall) {
      setCall(updatedCall);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/calls"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calls
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loading...</h1>
          <p className="text-muted-foreground mt-2">Loading service call details...</p>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/calls"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calls
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Error</h1>
          <p className="text-red-500 mt-2">{error || 'Service call not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/calls"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Calls
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{call.customerName}</h1>
          <p className="text-muted-foreground mt-2">Service Call Details</p>
        </div>
        <ServiceCallActions
          call={call}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Service Call Information */}
      <div className="bg-card rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{call.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{call.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span
                  className={`w-3 h-3 rounded-full ${
                    call.status === 'New'
                      ? 'bg-yellow-500'
                      : call.status === 'Scheduled'
                      ? 'bg-purple-500'
                      : call.status === 'InProgress'
                      ? 'bg-blue-500'
                      : call.status === 'Completed'
                      ? 'bg-green-500'
                      : call.status === 'OnHold'
                      ? 'bg-orange-500'
                      : 'bg-gray-500'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{call.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-400 rounded-sm" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Call Type</p>
                <p className="font-medium">{call.callType}</p>
              </div>
            </div>

            {call.landlordName && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Landlord Name</p>
                  <p className="font-medium">{call.landlordName}</p>
                </div>
              </div>
            )}

            {call.modelNumber && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-sm" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model Number</p>
                  <p className="font-medium">{call.modelNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* Dates and Timeline */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(call.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(call.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>

            {call.scheduledAt && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="font-medium">{format(new Date(call.scheduledAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Problem Description */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-2">Problem Description</h3>
          <p className="text-muted-foreground leading-relaxed">{call.problemDesc}</p>
        </div>

        {/* AI Analysis Section */}
        {call.aiAnalysisResult && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">AI Parts Analysis</h3>
            </div>
            
            <div className="space-y-6">
              {/* Analysis Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Appliance</span>
                  </div>
                  <p className="font-semibold text-lg">{call.aiAnalysisResult.appliance || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{call.aiAnalysisResult.brand || 'Unknown Brand'}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Confidence</span>
                  </div>
                  <p className="font-semibold text-lg text-green-700">
                    {call.aiAnalysisResult.confidence ? 
                      (typeof call.aiAnalysisResult.confidence === 'string' ? 
                        call.aiAnalysisResult.confidence : 
                        `${Math.round(call.aiAnalysisResult.confidence * 100)}%`)
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-green-600">Analysis Quality</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Analyzed</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {call.aiAnalysisResult.timestamp ? 
                      format(new Date(call.aiAnalysisResult.timestamp), 'MMM dd, HH:mm') : 
                      'Recently'
                    }
                  </p>
                  <p className="text-sm text-blue-600">
                    {call.aiAnalysisResult.source || 'ChatGPT'}
                  </p>
                </div>
              </div>

              {/* Analysis Notes */}
              {call.aiAnalysisResult.analysisNotes && call.aiAnalysisResult.analysisNotes.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800">Diagnostic Notes</h4>
                  </div>
                  <ul className="space-y-2">
                    {call.aiAnalysisResult.analysisNotes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span className="text-amber-800">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Parts */}
              {call.aiAnalysisResult.recommendedParts && call.aiAnalysisResult.recommendedParts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold">Recommended Parts ({call.aiAnalysisResult.recommendedParts.length})</h4>
                  </div>
                  
                  <div className="grid gap-3">
                    {call.aiAnalysisResult.recommendedParts.map((part, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold text-lg">{part.name}</h5>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                part.priority === 'high' ? 'bg-red-100 text-red-800' :
                                part.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {part.priority} priority
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <span className="text-gray-600">Part Number:</span>
                                <span className="font-mono ml-2">{part.partNumber}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Category:</span>
                                <span className="ml-2 capitalize">{part.category}</span>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 text-sm">{part.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-700">
                              {part.price ? `$${part.price}` : 'TBD'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total estimated cost */}
                  <div className="bg-gray-50 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Estimated Total Parts Cost:</span>
                      <span className="font-semibold text-lg text-green-700">
                        ${call.aiAnalysisResult.recommendedParts.reduce((total, part) => total + (part.price || 0), 0)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Prices are estimates and may vary by supplier
                    </p>
                  </div>
                </div>
              )}

              {/* Fallback to simple display if no detailed parts */}
              {(!call.aiAnalysisResult.recommendedParts || call.aiAnalysisResult.recommendedParts.length === 0) && call.suggestedParts && call.suggestedParts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold">Suggested Parts</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {call.suggestedParts.map((part, index) => (
                      <li key={index} className="text-gray-700">{part}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Likely Problem (fallback)
              {call.likelyProblem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Likely Problem</h4>
                  </div>
                  <p className="text-blue-800 whitespace-pre-wrap">{call.likelyProblem}</p>
                </div>
              )} */}
            </div>
          </div>
        )}
      </div>

      {/* Workflow Automation Panel */}
      <WorkflowPanel call={call} />

      {/* Work Logs Section */}
      <WorkLogsSection callId={call.id} customerName={call.customerName} />

      {/* Edit Dialog */}
      <EditServiceCallDialog
        call={editingCall}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

export default ServiceCallDetailsPage; 