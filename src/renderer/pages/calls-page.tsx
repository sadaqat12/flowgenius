import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

function CallsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Calls</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your service calls.
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

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="text-center py-12 text-muted-foreground">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallsPage;
