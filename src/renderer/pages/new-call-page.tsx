import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function NewCallPage() {
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
          <div className="text-center py-12 text-muted-foreground">
            <p>Service call form will be implemented here.</p>
            <p className="text-sm mt-2">This is a placeholder for Sprint 1.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewCallPage;
