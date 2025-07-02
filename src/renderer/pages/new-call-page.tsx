import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useServiceCalls } from '../hooks/use-service-calls';
import type { ServiceCallCreateData } from '../../shared/types/ipc';

// Helper function to format Date for datetime-local input
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function NewCallPage() {
  const navigate = useNavigate();
  const { createServiceCall } = useServiceCalls();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceCallCreateData>({
    customerName: '',
    phone: '',
    address: '',
    problemDesc: '',
    callType: 'Landlord',
    landlordName: '',
    scheduledAt: undefined,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
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
    
    if (!formData.customerName || !formData.phone || !formData.address || !formData.problemDesc) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newCall = await createServiceCall(formData);
      if (newCall) {
        alert('Service call created successfully!');
        navigate('/calls');
      } else {
        alert('Failed to create service call');
      }
    } catch (error) {
      console.error('Error creating service call:', error);
      alert('Error creating service call');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-foreground">
          Create New Service Call
        </h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new service call.
        </p>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="customerName">
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
                <label className="block text-sm font-medium mb-2" htmlFor="phone">
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
                <label className="block text-sm font-medium mb-2" htmlFor="callType">
                  Call Type *
                </label>
                <select
                  id="callType"
                  name="callType"
                  value={formData.callType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Landlord">Landlord</option>
                  <option value="Extra">Extra</option>
                  <option value="Warranty">Warranty</option>
                </select>
              </div>

              {/* Landlord Name */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="landlordName">
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

              {/* Scheduled At */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="scheduledAt">
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
              <label className="block text-sm font-medium mb-2" htmlFor="address">
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
              <label className="block text-sm font-medium mb-2" htmlFor="problemDesc">
                Problem Description *
              </label>
              <textarea
                id="problemDesc"
                name="problemDesc"
                value={formData.problemDesc}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the issue that needs to be addressed..."
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Service Call'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewCallPage;
