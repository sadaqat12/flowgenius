import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash, Play, Pause, CheckCircle, Clock, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui';
import { ServiceCall } from '../../../../shared/types/ipc';

interface ServiceCallActionsProps {
  call: ServiceCall;
  onEdit: (call: ServiceCall) => void;
  onDelete: (callId: string) => Promise<void>;
  onStatusChange: (callId: string, status: ServiceCall['status']) => Promise<void>;
}

export function ServiceCallActions({ call, onEdit, onDelete, onStatusChange }: ServiceCallActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: ServiceCall['status']) => {
    setIsLoading(true);
    try {
      await onStatusChange(call.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(call.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ServiceCall['status']) => {
    switch (status) {
      case 'New':
        return <Clock className="w-4 h-4" />;
      case 'Scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'InProgress':
        return <Play className="w-4 h-4" />;
      case 'OnHold':
        return <Pause className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const availableStatuses: ServiceCall['status'][] = ['New', 'Scheduled', 'InProgress', 'OnHold', 'Completed'];
  const nextStatuses = availableStatuses.filter(status => status !== call.status);

  return (
    <div className="flex items-center gap-2">
      {/* Quick Status Buttons */}
      {call.status === 'New' && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange('Scheduled')}
            disabled={isLoading}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange('InProgress')}
            disabled={isLoading}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Play className="w-4 h-4 mr-1" />
            Start
          </Button>
        </>
      )}
      
      {call.status === 'Scheduled' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('InProgress')}
          disabled={isLoading}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Play className="w-4 h-4 mr-1" />
          Start
        </Button>
      )}
      
      {call.status === 'InProgress' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('Completed')}
          disabled={isLoading}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Complete
        </Button>
      )}

      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(call)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Call
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          {nextStatuses.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isLoading}
            >
              {getStatusIcon(status)}
              <span className="ml-2">{status}</span>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete Call
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Service Call</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this service call for {call.customerName}? 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 