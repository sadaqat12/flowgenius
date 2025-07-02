import { useState } from 'react';
import { DailySheet } from '../components/features/daily-sheet';

export default function DailySheetPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Service Sheet</h1>
        <p className="text-muted-foreground">
          Generate printable service sheets for technicians with scheduled calls and work notes.
        </p>
      </div>

      <DailySheet
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  );
} 