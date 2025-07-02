import React, { useState } from 'react';
import { Plus, Clock, Edit, Trash, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui';
import { useWorkLogs } from '../../../hooks/use-work-logs';
import { WorkLog, WorkLogCreateData, WorkLogUpdateData } from '../../../../shared/types/ipc';

interface WorkLogsSectionProps {
  callId: string;
  customerName: string;
}

export function WorkLogsSection({ callId, customerName }: WorkLogsSectionProps) {
  const { workLogs, isLoading, error, createWorkLog, updateWorkLog, deleteWorkLog } = useWorkLogs(callId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingLog, setDeletingLog] = useState<WorkLog | null>(null);

  const handleCreateLog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditLog = (log: WorkLog) => {
    setEditingLog(log);
    setIsEditDialogOpen(true);
  };

  const handleDeleteLog = (log: WorkLog) => {
    setDeletingLog(log);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingLog) {
      await deleteWorkLog(deletingLog.id);
      setIsDeleteDialogOpen(false);
      setDeletingLog(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Work Logs</h3>
        </div>
        <p className="text-muted-foreground">Loading work logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Work Logs</h3>
        </div>
        <p className="text-red-500">Error loading work logs: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Work Logs</h3>
        <Button onClick={handleCreateLog} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Work Log
        </Button>
      </div>

      {workLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No work logs recorded yet.</p>
          <p className="text-sm mt-2">Add a work log to track work performed on this call.</p>
          <Button onClick={handleCreateLog} className="mt-4" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add First Work Log
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {workLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.loggedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{log.notes}</p>
                  {log.partsUsed && (
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Parts used: {log.partsUsed}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditLog(log)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLog(log)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Work Log Dialog */}
      <WorkLogDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={async (data) => {
          if ('callId' in data) {
            return await createWorkLog(data as WorkLogCreateData);
          }
          return null;
        }}
        callId={callId}
        title="Add Work Log"
        description={`Record work performed on the service call for ${customerName}.`}
      />

      {/* Edit Work Log Dialog */}
      {editingLog && (
        <WorkLogDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={async (data) => {
            if (!('callId' in data)) {
              return await updateWorkLog(editingLog.id, data as WorkLogUpdateData);
            }
            return null;
          }}
          callId={callId}
          existingLog={editingLog}
          title="Edit Work Log"
          description="Update the work log details."
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this work log? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface WorkLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: WorkLogCreateData | WorkLogUpdateData) => Promise<WorkLog | null>;
  callId: string;
  existingLog?: WorkLog;
  title: string;
  description: string;
}

function WorkLogDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  callId, 
  existingLog, 
  title, 
  description 
}: WorkLogDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    notes: existingLog?.notes || '',
    partsUsed: existingLog?.partsUsed || '',
  });

  React.useEffect(() => {
    if (existingLog) {
      setFormData({
        notes: existingLog.notes,
        partsUsed: existingLog.partsUsed || '',
      });
    } else {
      setFormData({
        notes: '',
        partsUsed: '',
      });
    }
  }, [existingLog, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.notes.trim()) {
      alert('Please provide work notes');
      return;
    }

    setIsLoading(true);
    try {
      const data = existingLog
        ? { notes: formData.notes, partsUsed: formData.partsUsed || undefined }
        : { callId, notes: formData.notes, partsUsed: formData.partsUsed || undefined };
      
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving work log:', error);
      alert('Error saving work log');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="notes">
              Work Notes *
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the work performed..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="partsUsed">
              Parts Used
            </label>
            <input
              type="text"
              id="partsUsed"
              value={formData.partsUsed}
              onChange={(e) => setFormData(prev => ({ ...prev, partsUsed: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List any parts used or replaced..."
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
              {isLoading ? 'Saving...' : 'Save Work Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 