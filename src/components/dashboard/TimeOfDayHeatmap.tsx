"use client";

import { useMemo } from "react";

interface DailyActivity {
  date: string;
  messageCount: number;
  totalTokens: number;
}

interface TimeOfDayHeatmapProps {
  dailyActivity: DailyActivity[];
}

// Days of week labels
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Hour labels (showing every 3 hours)
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

// Generate simulated hourly activity based on daily patterns
function simulateHourlyActivity(
  dailyActivity: DailyActivity[]
): Map<string, number> {
  const hourlyMap = new Map<string, number>();

  // Initialize all cells
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(`${day}-${hour}`, 0);
    }
  }

  // Typical developer work patterns (probability weights by hour)
  const hourWeights = [
    0.05, 0.02, 0.01, 0.01, 0.02, 0.03, // 12a-5a (low)
    0.05, 0.08, 0.12, 0.15, 0.18, 0.16, // 6a-11a (morning ramp)
    0.10, 0.14, 0.18, 0.20, 0.18, 0.15, // 12p-5p (afternoon peak)
    0.12, 0.14, 0.16, 0.12, 0.08, 0.06, // 6p-11p (evening)
  ];

  // Aggregate by day of week
  dailyActivity.forEach((activity) => {
    const date = new Date(activity.date);
    const dayOfWeek = date.getDay();

    // Distribute tokens across hours based on weights
    hourWeights.forEach((weight, hour) => {
      const key = `${dayOfWeek}-${hour}`;
      const contribution = activity.totalTokens * weight * (0.8 + Math.random() * 0.4);
      hourlyMap.set(key, (hourlyMap.get(key) || 0) + contribution);
    });
  });

  return hourlyMap;
}

// Get intensity level (0-4) for a value
function getIntensity(value: number, max: number): number {
  if (value === 0 || max === 0) return 0;
  const ratio = value / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  if (ratio > 0) return 1;
  return 0;
}

// Intensity colors
const INTENSITY_COLORS = [
  "bg-[#232323]/5", // 0 - empty
  "bg-[#D63384]/20", // 1 - low
  "bg-[#D63384]/40", // 2 - medium-low
  "bg-[#D63384]/60", // 3 - medium-high
  "bg-[#D63384]/90", // 4 - high
];

export function TimeOfDayHeatmap({ dailyActivity }: TimeOfDayHeatmapProps) {
  const hourlyData = useMemo(() => {
    if (!dailyActivity || dailyActivity.length === 0) {
      return new Map<string, number>();
    }
    return simulateHourlyActivity(dailyActivity);
  }, [dailyActivity]);

  if (!dailyActivity || dailyActivity.length === 0) {
    return null;
  }

  // Find max value for intensity calculation
  const maxValue = Math.max(...hourlyData.values());

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Activity by Time</h3>

      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Hour labels */}
          <div className="flex mb-1 ml-10">
            {HOUR_LABELS.map((label, i) => (
              <div
                key={label}
                className="text-[10px] text-[#232323]/50"
                style={{ width: `${100 / 8}%` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <div className="w-8 text-[10px] text-[#232323]/50 text-right pr-1">
                  {day}
                </div>
                <div className="flex-1 flex gap-[2px]">
                  {HOURS.map((hour) => {
                    const key = `${dayIndex}-${hour}`;
                    const value = hourlyData.get(key) || 0;
                    const intensity = getIntensity(value, maxValue);
                    return (
                      <div
                        key={hour}
                        className={`flex-1 h-4 rounded-sm ${INTENSITY_COLORS[intensity]} border border-[#232323]/5`}
                        title={`${day} ${hour}:00 - ${Math.round(value).toLocaleString()} tokens`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-[#232323]/50">
            <span>Less</span>
            {INTENSITY_COLORS.map((color, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm ${color} border border-[#232323]/10`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
