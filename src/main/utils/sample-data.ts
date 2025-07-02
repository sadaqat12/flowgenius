import { ServiceCallModel } from '../services/database/models';
import { databaseService } from '../services/database/database';

export async function addSampleData(): Promise<void> {
  try {
    // Ensure database is initialized
    await databaseService.initialize();
    const supabaseClient = databaseService.getClient();
    const serviceCallModel = new ServiceCallModel(supabaseClient);

    // Check if we already have data
    const existingCalls = await serviceCallModel.getAll();
    if (existingCalls.length > 0) {
      console.log('Sample data already exists, skipping...');
      return;
    }

    // Create sample service calls
    const sampleCalls = [
      {
        customerName: 'John Smith',
        phone: '(555) 123-4567',
        address: '123 Main St, Downtown, NY 10001',
        problemDesc: 'Refrigerator not cooling properly. Temperature seems inconsistent.',
        callType: 'Warranty' as const,
        scheduledAt: new Date('2024-01-15T10:00:00'),
      },
      {
        customerName: 'Mary Johnson',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Midtown, NY 10002',
        problemDesc: 'Washing machine making loud noise during spin cycle.',
        callType: 'Landlord' as const,
        scheduledAt: new Date('2024-01-15T14:30:00'),
      },
      {
        customerName: 'Bob Wilson',
        phone: '(555) 555-0123',
        address: '789 Pine St, Uptown, NY 10003',
        problemDesc: 'Dishwasher not draining properly. Water pools at bottom.',
        callType: 'Extra' as const,
      },
      {
        customerName: 'Alice Brown',
        phone: '(555) 246-8101',
        address: '321 Elm Dr, Eastside, NY 10004',
        problemDesc: 'Oven temperature not accurate. Overcooking food.',
        callType: 'Warranty' as const,
        scheduledAt: new Date('2024-01-16T09:00:00'),
      },
      {
        customerName: 'Charlie Davis',
        phone: '(555) 369-2580',
        address: '654 Maple Ln, Westside, NY 10005',
        problemDesc: 'Microwave turntable not rotating. Heating unevenly.',
        callType: 'Landlord' as const,
      },
    ];

    // Insert sample data
    for (const callData of sampleCalls) {
      const newCall = await serviceCallModel.create(callData);
      console.log(`Created sample call: ${newCall.customerName}`);
    }

    // Update some calls to different statuses for testing
    const allCalls = await serviceCallModel.getAll();
    if (allCalls.length >= 2) {
      await serviceCallModel.update(allCalls[0].id, { status: 'InProgress' });
      await serviceCallModel.update(allCalls[1].id, { status: 'Completed' });
      console.log('Updated call statuses for demo');
    }

    console.log('Sample data added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
} 