import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ServiceCall, ServiceCallCreateData, ServiceCallUpdateData } from '../../../../shared/types/ipc';

export class ServiceCallModel {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // Determine appropriate status based on scheduled time
  private determineStatus(scheduledAt?: Date, currentStatus?: ServiceCall['status']): ServiceCall['status'] {
    // If manually set to OnHold or Completed, keep that status
    if (currentStatus === 'OnHold' || currentStatus === 'Completed') {
      return currentStatus;
    }

    // If no scheduled time, it's a new call
    if (!scheduledAt) {
      return 'New';
    }

    const now = new Date();
    const scheduled = new Date(scheduledAt);
    
    // Get today's date boundaries (start and end of day)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // If scheduled for today or past due, it should be in progress
    if (scheduled <= todayEnd) {
      return 'InProgress';
    }

    // If scheduled for future, it's scheduled
    return 'Scheduled';
  }

  // Create a new service call
  async create(data: ServiceCallCreateData): Promise<ServiceCall> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Determine appropriate status based on scheduled time
    const status = this.determineStatus(data.scheduledAt);

    const serviceCallData = {
      id,
      customer_name: data.customerName,
      phone: data.phone,
      address: data.address,
      problem_desc: data.problemDesc,
      call_type: data.callType,
      landlord_name: data.landlordName || null,
      model_number: data.modelNumber || null,
      status,
      scheduled_at: data.scheduledAt?.toISOString() || null,
      created_at: now,
      updated_at: now
    };

    const { data: insertedData, error } = await this.supabase
      .from('service_calls')
      .insert(serviceCallData)
      .select()
      .single();

    if (error) {
      console.error('Error creating service call:', error);
      throw new Error(`Failed to create service call: ${error.message}`);
    }

    return this.mapRowToServiceCall(insertedData);
  }

  // Get all service calls
  async getAll(): Promise<ServiceCall[]> {
    const { data, error } = await this.supabase
      .from('service_calls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service calls:', error);
      throw new Error(`Failed to fetch service calls: ${error.message}`);
    }

    return (data || []).map(this.mapRowToServiceCall);
  }

  // Get service call by ID
  async getById(id: string): Promise<ServiceCall | null> {
    const { data, error } = await this.supabase
      .from('service_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching service call by ID:', error);
      throw new Error(`Failed to fetch service call: ${error.message}`);
    }

    return data ? this.mapRowToServiceCall(data) : null;
  }

  // Get service calls by status
  async getByStatus(status: ServiceCall['status']): Promise<ServiceCall[]> {
    const { data, error } = await this.supabase
      .from('service_calls')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service calls by status:', error);
      throw new Error(`Failed to fetch service calls by status: ${error.message}`);
    }

    return (data || []).map(this.mapRowToServiceCall);
  }

  // Get service calls by multiple statuses
  async getByStatusRange(statuses: ServiceCall['status'][]): Promise<ServiceCall[]> {
    const { data, error } = await this.supabase
      .from('service_calls')
      .select('*')
      .in('status', statuses)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service calls by status range:', error);
      throw new Error(`Failed to fetch service calls by status range: ${error.message}`);
    }

    return (data || []).map(this.mapRowToServiceCall);
  }

  // Get service calls by date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<ServiceCall[]> {
    const { data, error } = await this.supabase
      .from('service_calls')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service calls by date range:', error);
      throw new Error(`Failed to fetch service calls by date range: ${error.message}`);
    }

    return (data || []).map(this.mapRowToServiceCall);
  }

  // Get today's service calls
  async getTodaysCalls(): Promise<ServiceCall[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getByDateRange(today, tomorrow);
  }

  // Update service call
  async update(id: string, data: ServiceCallUpdateData): Promise<ServiceCall | null> {
    // Get current service call to understand current state
    const currentCall = await this.getById(id);
    if (!currentCall) {
      return null;
    }

    const updateData: any = {};

    // Build update object
    if (data.customerName !== undefined) updateData.customer_name = data.customerName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.problemDesc !== undefined) updateData.problem_desc = data.problemDesc;
    if (data.callType !== undefined) updateData.call_type = data.callType;
    if (data.landlordName !== undefined) updateData.landlord_name = data.landlordName || null;
    if (data.modelNumber !== undefined) updateData.model_number = data.modelNumber || null;
    if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt?.toISOString() || null;
    if (data.aiAnalysisResult !== undefined) updateData.ai_analysis_result = data.aiAnalysisResult || null;
    if (data.likelyProblem !== undefined) updateData.likely_problem = data.likelyProblem || null;
    if (data.suggestedParts !== undefined) updateData.suggested_parts = data.suggestedParts || null;

    // Smart status logic: If status is explicitly provided, use it. Otherwise, determine based on scheduled time.
    if (data.status !== undefined) {
      // Explicit status change
      updateData.status = data.status;
    } else if (data.scheduledAt !== undefined) {
      // Scheduled time changed, determine appropriate status
      const newScheduledAt = data.scheduledAt;
      const newStatus = this.determineStatus(newScheduledAt, currentCall.status);
      updateData.status = newStatus;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: updatedData, error } = await this.supabase
      .from('service_calls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows updated
        return null;
      }
      console.error('Error updating service call:', error);
      throw new Error(`Failed to update service call: ${error.message}`);
    }

    return updatedData ? this.mapRowToServiceCall(updatedData) : null;
  }

  // Delete service call
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('service_calls')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service call:', error);
      throw new Error(`Failed to delete service call: ${error.message}`);
    }

    return true;
  }

  // Get statistics
  async getStats(): Promise<{
    total: number;
    new: number;
    scheduled: number;
    inProgress: number;
    onHold: number;
    completed: number;
    todaysTotal: number;
  }> {
    try {
      // Get total count
      const { count: total, error: totalError } = await this.supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get counts by status
      const statusCounts = await Promise.all([
        this.supabase.from('service_calls').select('*', { count: 'exact', head: true }).eq('status', 'New'),
        this.supabase.from('service_calls').select('*', { count: 'exact', head: true }).eq('status', 'Scheduled'),
        this.supabase.from('service_calls').select('*', { count: 'exact', head: true }).eq('status', 'InProgress'),
        this.supabase.from('service_calls').select('*', { count: 'exact', head: true }).eq('status', 'OnHold'),
        this.supabase.from('service_calls').select('*', { count: 'exact', head: true }).eq('status', 'Completed')
      ]);

      // Check for errors in status counts
      statusCounts.forEach((result, _index) => {
        if (result.error) throw result.error;
      });

      // Get today's calls count
      const todaysCalls = await this.getTodaysCalls();

      return {
        total: total || 0,
        new: statusCounts[0].count || 0,
        scheduled: statusCounts[1].count || 0,
        inProgress: statusCounts[2].count || 0,
        onHold: statusCounts[3].count || 0,
        completed: statusCounts[4].count || 0,
        todaysTotal: todaysCalls.length
      };
    } catch (error) {
      console.error('Error getting service call stats:', error);
      // Return default stats if there's an error
      return {
        total: 0,
        new: 0,
        scheduled: 0,
        inProgress: 0,
        onHold: 0,
        completed: 0,
        todaysTotal: 0
      };
    }
  }

  // Fix existing service calls with incorrect statuses (run once to clean up data)
  async fixIncorrectStatuses(): Promise<{ updated: number; errors: number }> {
    try {
      const allCalls = await this.getAll();
      let updated = 0;
      let errors = 0;

      for (const call of allCalls) {
        // Skip completed calls - they should stay completed
        if (call.status === 'Completed') {
          continue;
        }

        const correctStatus = this.determineStatus(call.scheduledAt, call.status);
        
        // Only update if status should change
        if (correctStatus !== call.status) {
          try {
            await this.update(call.id, { status: correctStatus });
            updated++;
            console.log(`Updated call ${call.id} from ${call.status} to ${correctStatus}`);
          } catch (error) {
            console.error(`Failed to update call ${call.id}:`, error);
            errors++;
          }
        }
      }

      console.log(`Status fix complete: ${updated} updated, ${errors} errors`);
      return { updated, errors };
    } catch (error) {
      console.error('Error fixing incorrect statuses:', error);
      return { updated: 0, errors: 1 };
    }
  }

  // Helper method to map database row to ServiceCall object
  private mapRowToServiceCall(row: any): ServiceCall {
    return {
      id: row.id,
      customerName: row.customer_name,
      phone: row.phone,
      address: row.address,
      problemDesc: row.problem_desc,
      callType: row.call_type,
      landlordName: row.landlord_name || undefined,
      modelNumber: row.model_number || undefined,
      status: row.status,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      aiAnalysisResult: row.ai_analysis_result || undefined,
      likelyProblem: row.likely_problem || undefined,
      suggestedParts: row.suggested_parts || undefined,
    };
  }
} 