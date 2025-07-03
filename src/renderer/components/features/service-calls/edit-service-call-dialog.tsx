import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui';
import { ServiceCall, ServiceCallUpdateData } from '../../../../shared/types/ipc';

// Helper function to format Date for datetime-local input
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface EditServiceCallDialogProps {
  call: ServiceCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: ServiceCallUpdateData) => Promise<void>;
}

export function EditServiceCallDialog({ call, open, onOpenChange, onSave }: EditServiceCallDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ServiceCallUpdateData>({
    customerName: '',
    phone: '',
    address: '',
    problemDesc: '',
    callType: 'Landlord',
    landlordName: '',
    modelNumber: '',
    status: 'New',
    scheduledAt: undefined,
  });

  // Update form data when call changes
  useEffect(() => {
    if (call) {
      setFormData({
        customerName: call.customerName,
        phone: call.phone,
        address: call.address,
        problemDesc: call.problemDesc,
        callType: call.callType,
        landlordName: call.landlordName || '',
        modelNumber: call.modelNumber || '',
        status: call.status,
        scheduledAt: call.scheduledAt ? new Date(call.scheduledAt) : undefined,
      });
    }
  }, [call]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // "2025-07-02T14:30"
    if (!value) {
      setFormData(prev => ({
        ...prev,
        scheduledAt: undefined,
      }));
      return;
    }

    // Parse datetime-local string manually to avoid timezone issues
    // Format: "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create date in local timezone
    const localDate = new Date(year, month - 1, day, hours, minutes);
    
    setFormData(prev => ({
      ...prev,
      scheduledAt: localDate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!call) return;
    
    if (!formData.customerName || !formData.phone || !formData.address || !formData.problemDesc) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(call.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating service call:', error);
      alert('Error updating service call');
    } finally {
      setIsLoading(false);
    }
  };

  if (!call) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Service Call</DialogTitle>
          <DialogDescription>
            Update the service call details for {call.customerName}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="customerName">
                Customer Name *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Call Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Call Type *
              </label>
              <Select
                value={formData.callType}
                onValueChange={(value) => handleSelectChange('callType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Landlord">Landlord</SelectItem>
                  <SelectItem value="Extra">Extra</SelectItem>
                  <SelectItem value="Warranty">Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Status *
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as ServiceCall['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="OnHold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Landlord Name */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="landlordName">
                Landlord Name
                <span className="text-muted-foreground text-xs ml-1">(optional, for billing)</span>
              </label>
              <input
                type="text"
                id="landlordName"
                name="landlordName"
                value={formData.landlordName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter landlord name for billing purposes..."
              />
            </div>

            {/* Model Number */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="modelNumber">
                Model Number
                <span className="text-muted-foreground text-xs ml-1">(optional)</span>
              </label>
              <input
                type="text"
                id="modelNumber"
                name="modelNumber"
                value={formData.modelNumber || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter appliance model number..."
              />
            </div>

            {/* Scheduled At */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="scheduledAt">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                id="scheduledAt"
                name="scheduledAt"
                value={formData.scheduledAt ? formatDateForInput(formData.scheduledAt) : ''}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="address">
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Problem Description */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="problemDesc">
              Problem Description *
            </label>
            <textarea
              id="problemDesc"
              name="problemDesc"
              value={formData.problemDesc}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the issue that needs to be addressed..."
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 