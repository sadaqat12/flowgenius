import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Phone, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useServiceCalls } from '../hooks/use-service-calls';
import { ServiceCallActions } from '../components/features/service-calls/service-call-actions';
import { EditServiceCallDialog } from '../components/features/service-calls/edit-service-call-dialog';
import { WorkLogsSection } from '../components/features/service-calls/work-logs-section';
import { ServiceCall, ServiceCallUpdateData } from '../../shared/types/ipc';

function ServiceCallDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      </div>

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