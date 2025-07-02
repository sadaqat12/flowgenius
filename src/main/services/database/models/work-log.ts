import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { WorkLog } from '../../../../shared/types/ipc';

export interface WorkLogCreateData {
  callId: string;
  notes: string;
  partsUsed?: string;
}

export class WorkLogModel {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // Create a new work log
  async create(data: WorkLogCreateData): Promise<WorkLog> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const workLogData = {
      id,
      call_id: data.callId,
      notes: data.notes,
      parts_used: data.partsUsed || null,
      logged_at: now
    };

    const { data: insertedData, error } = await this.supabase
      .from('work_logs')
      .insert(workLogData)
      .select()
      .single();

    if (error) {
      console.error('Error creating work log:', error);
      throw new Error(`Failed to create work log: ${error.message}`);
    }

    return this.mapRowToWorkLog(insertedData);
  }

  // Get work log by ID
  async getById(id: string): Promise<WorkLog | null> {
    const { data, error } = await this.supabase
      .from('work_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching work log by ID:', error);
      throw new Error(`Failed to fetch work log: ${error.message}`);
    }

    return data ? this.mapRowToWorkLog(data) : null;
  }

  // Get all work logs for a specific service call
  async getByCallId(callId: string): Promise<WorkLog[]> {
    const { data, error } = await this.supabase
      .from('work_logs')
      .select('*')
      .eq('call_id', callId)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error fetching work logs by call ID:', error);
      throw new Error(`Failed to fetch work logs by call ID: ${error.message}`);
    }

    return (data || []).map(this.mapRowToWorkLog);
  }

  // Get all work logs
  async getAll(): Promise<WorkLog[]> {
    const { data, error } = await this.supabase
      .from('work_logs')
      .select('*')
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error fetching work logs:', error);
      throw new Error(`Failed to fetch work logs: ${error.message}`);
    }

    return (data || []).map(this.mapRowToWorkLog);
  }

  // Update work log
  async update(id: string, data: Partial<WorkLogCreateData>): Promise<WorkLog | null> {
    const updateData: any = {};

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.partsUsed !== undefined) updateData.parts_used = data.partsUsed || null;

    if (Object.keys(updateData).length === 0) {
      // No changes to make, return existing work log
      return this.getById(id);
    }

    const { data: updatedData, error } = await this.supabase
      .from('work_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows updated
        return null;
      }
      console.error('Error updating work log:', error);
      throw new Error(`Failed to update work log: ${error.message}`);
    }

    return updatedData ? this.mapRowToWorkLog(updatedData) : null;
  }

  // Delete work log
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('work_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting work log:', error);
      throw new Error(`Failed to delete work log: ${error.message}`);
    }

    return true;
  }

  // Delete all work logs for a service call (used when deleting a call)
  async deleteByCallId(callId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('work_logs')
      .delete()
      .eq('call_id', callId)
      .select();

    if (error) {
      console.error('Error deleting work logs by call ID:', error);
      throw new Error(`Failed to delete work logs by call ID: ${error.message}`);
    }

    return data ? data.length : 0;
  }

  // Get work logs by date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<WorkLog[]> {
    const { data, error } = await this.supabase
      .from('work_logs')
      .select('*')
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error fetching work logs by date range:', error);
      throw new Error(`Failed to fetch work logs by date range: ${error.message}`);
    }

    return (data || []).map(this.mapRowToWorkLog);
  }

  // Helper method to map database row to WorkLog object
  private mapRowToWorkLog(row: any): WorkLog {
    return {
      id: row.id,
      callId: row.call_id,
      notes: row.notes,
      partsUsed: row.parts_used || undefined,
      loggedAt: new Date(row.logged_at)
    };
  }
} 