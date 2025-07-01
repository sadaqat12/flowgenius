function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Service Call Manager - your central hub for managing
          service calls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats cards placeholders */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="w-6 h-6 bg-primary rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent calls section placeholder */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Service Calls</h2>
          <div className="text-center py-12 text-muted-foreground">
            <p>No service calls yet.</p>
            <p className="text-sm mt-2">
              Create your first service call to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
