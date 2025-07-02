import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Phone, MapPin, Search } from 'lucide-react';
import { useServiceCalls } from '../hooks/use-service-calls';
import { ServiceCallActions } from '../components/features/service-calls/service-call-actions';
import { EditServiceCallDialog } from '../components/features/service-calls/edit-service-call-dialog';
import { Button } from '../components/ui';
import { format } from 'date-fns';
import { ServiceCall, ServiceCallUpdateData } from '../../shared/types/ipc';

function CallsPage() {
  const { serviceCalls, isLoading, error, updateServiceCall, deleteServiceCall } = useServiceCalls();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceCall['status'] | 'All'>('All');
  const [editingCall, setEditingCall] = useState<ServiceCall | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter service calls based on search and status
  const filteredCalls = serviceCalls.filter(call => {
    const matchesSearch = searchTerm === '' || 
      call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.problemDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || call.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (call: ServiceCall) => {
    setEditingCall(call);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, data: ServiceCallUpdateData) => {
    await updateServiceCall(id, data);
  };

  const handleDelete = async (callId: string) => {
    await deleteServiceCall(callId);
  };

  const handleStatusChange = async (callId: string, status: ServiceCall['status']) => {
    await updateServiceCall(callId, { status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Service Calls</h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Service Calls</h1>
            <p className="text-red-500 mt-2">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Calls</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your service calls. ({filteredCalls.length} of {serviceCalls.length} shown)
          </p>
        </div>
        <Link
          to="/calls/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Call
        </Link>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search calls by customer, address, phone, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ServiceCall['status'] | 'All')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Scheduled">Scheduled</option>
          <option value="InProgress">In Progress</option>
          <option value="OnHold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          {filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {serviceCalls.length === 0 ? (
                <>
                  <p>No service calls found.</p>
                  <p className="text-sm mt-2">
                    Create your first service call to get started.
                  </p>
                  <Link
                    to="/calls/new"
                    className="inline-flex items-center px-4 py-2 mt-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Call
                  </Link>
                </>
              ) : (
                <>
                  <p>No service calls match your search criteria.</p>
                  <p className="text-sm mt-2">
                    Try adjusting your search terms or filters.
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('All');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{call.customerName}</h3>
                          {call.landlordName && (
                            <p className="text-sm text-muted-foreground">Landlord: {call.landlordName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              call.status === 'New'
                                ? 'bg-yellow-100 text-yellow-800'
                                : call.status === 'Scheduled'
                                ? 'bg-purple-100 text-purple-800'
                                : call.status === 'InProgress'
                                ? 'bg-blue-100 text-blue-800'
                                : call.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : call.status === 'OnHold'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {call.status}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {call.callType}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{call.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{call.address}</span>
                        </div>
                      </div>

                      {/* Problem Description */}
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">Problem:</p>
                        <p className="text-sm">{call.problemDesc}</p>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {format(new Date(call.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        {call.scheduledAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Scheduled: {format(new Date(call.scheduledAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="ml-4 flex items-center gap-2">
                      <Link
                        to={`/calls/${call.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View Details
                      </Link>
                      <ServiceCallActions
                        call={call}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

export default CallsPage;
