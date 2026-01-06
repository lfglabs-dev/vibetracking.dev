"use client";

interface ActivityDay {
  date: string;
  totalTokens: number;
}

interface ActivityHeatmapProps {
  dailyActivity: ActivityDay[];
}

export function ActivityHeatmap({ dailyActivity }: ActivityHeatmapProps) {
  // Create a map of date -> tokens for quick lookup
  const activityMap = new Map<string, number>();
  dailyActivity.forEach((day) => {
    const existing = activityMap.get(day.date) || 0;
    activityMap.set(day.date, existing + day.totalTokens);
  });

  // Generate last 365 days
  const today = new Date();
  const days: { date: string; tokens: number; dayOfWeek: number }[] = [];

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      tokens: activityMap.get(dateStr) || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Find max tokens for color scaling
  const maxTokens = Math.max(...days.map((d) => d.tokens), 1);

  // Get color intensity based on token count
  const getColor = (tokens: number) => {
    if (tokens === 0) return "bg-[#EEF0F2]";
    const intensity = Math.min(tokens / maxTokens, 1);
    if (intensity < 0.25) return "bg-[#AAE7C0]/30";
    if (intensity < 0.5) return "bg-[#AAE7C0]/50";
    if (intensity < 0.75) return "bg-[#AAE7C0]/75";
    return "bg-[#AAE7C0]";
  };

  // Group days into weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];

  // Pad the first week if needed
  if (days[0].dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) {
      currentWeek.push({ date: "", tokens: 0, dayOfWeek: i });
    }
  }

  days.forEach((day) => {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Month labels
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get month labels for x-axis
  const getMonthLabels = () => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.date);
      if (firstValidDay) {
        const month = new Date(firstValidDay.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], index: weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Activity</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-[#232323]/50"
                style={{
                  marginLeft: i === 0 ? `${label.index * 12}px` : undefined,
                  width:
                    i < monthLabels.length - 1
                      ? `${(monthLabels[i + 1].index - label.index) * 12}px`
                      : "auto",
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1">
              <div className="w-6 h-[10px]"></div>
              <div className="w-6 h-[10px] text-[8px] text-[#232323]/50 leading-[10px]">
                Mon
              </div>
              <div className="w-6 h-[10px]"></div>
              <div className="w-6 h-[10px] text-[8px] text-[#232323]/50 leading-[10px]">
                Wed
              </div>
              <div className="w-6 h-[10px]"></div>
              <div className="w-6 h-[10px] text-[8px] text-[#232323]/50 leading-[10px]">
                Fri
              </div>
              <div className="w-6 h-[10px]"></div>
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-[10px] h-[10px] rounded-sm ${
                      day.date ? getColor(day.tokens) : "bg-transparent"
                    } border border-[#232323]/10`}
                    title={
                      day.date
                        ? `${day.date}: ${day.tokens.toLocaleString()} tokens`
                        : ""
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-[#232323]/50">Less</span>
            <div className="w-[10px] h-[10px] rounded-sm bg-[#EEF0F2] border border-[#232323]/10" />
            <div className="w-[10px] h-[10px] rounded-sm bg-[#AAE7C0]/30 border border-[#232323]/10" />
            <div className="w-[10px] h-[10px] rounded-sm bg-[#AAE7C0]/50 border border-[#232323]/10" />
            <div className="w-[10px] h-[10px] rounded-sm bg-[#AAE7C0]/75 border border-[#232323]/10" />
            <div className="w-[10px] h-[10px] rounded-sm bg-[#AAE7C0] border border-[#232323]/10" />
            <span className="text-xs text-[#232323]/50">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
