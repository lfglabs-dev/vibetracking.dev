"use client";

interface DataPoint {
  date: string;
  value: number;
}

interface HeatmapConfig {
  data: DataPoint[];
  label: string;
  color: string;
  emptyColor?: string;
}

interface DualHeatmapProps {
  left: HeatmapConfig;
  right: HeatmapConfig;
}

interface DayData {
  date: string;
  value: number;
  dayOfWeek: number;
}

function SingleHeatmap({
  data,
  label,
  color,
  emptyColor = "#EEF0F2",
}: HeatmapConfig) {
  // Create a map of date -> value for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach((item) => {
    const existing = dataMap.get(item.date) || 0;
    dataMap.set(item.date, existing + item.value);
  });

  // Generate last 365 days
  const today = new Date();
  const days: DayData[] = [];

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      value: dataMap.get(dateStr) || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Find max value for color scaling
  const maxValue = Math.max(...days.map((d) => d.value), 1);

  // Get color intensity based on value
  const getColor = (value: number) => {
    if (value === 0) return emptyColor;
    const intensity = Math.min(value / maxValue, 1);
    // Use CSS opacity to create intensity levels
    if (intensity < 0.25) return `${color}4D`; // 30% opacity
    if (intensity < 0.5) return `${color}80`; // 50% opacity
    if (intensity < 0.75) return `${color}BF`; // 75% opacity
    return color; // 100% opacity
  };

  // Group days into weeks
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad the first week if needed
  if (days[0].dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) {
      currentWeek.push({ date: "", value: 0, dayOfWeek: i });
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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
    <div className="flex-1">
      <h4 className="text-sm font-semibold mb-2 text-[#232323]/70">{label}</h4>
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-6">
            {monthLabels.map((labelItem, i) => (
              <div
                key={i}
                className="text-[8px] text-[#232323]/50"
                style={{
                  marginLeft: i === 0 ? `${labelItem.index * 10}px` : undefined,
                  width:
                    i < monthLabels.length - 1
                      ? `${(monthLabels[i + 1].index - labelItem.index) * 10}px`
                      : "auto",
                }}
              >
                {labelItem.month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[1px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[1px] mr-1">
              <div className="w-5 h-[8px]"></div>
              <div className="w-5 h-[8px] text-[6px] text-[#232323]/50 leading-[8px]">M</div>
              <div className="w-5 h-[8px]"></div>
              <div className="w-5 h-[8px] text-[6px] text-[#232323]/50 leading-[8px]">W</div>
              <div className="w-5 h-[8px]"></div>
              <div className="w-5 h-[8px] text-[6px] text-[#232323]/50 leading-[8px]">F</div>
              <div className="w-5 h-[8px]"></div>
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[1px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-[8px] h-[8px] rounded-[2px]"
                    style={{
                      backgroundColor: day.date ? getColor(day.value) : "transparent",
                      border: day.date ? "1px solid rgba(35, 35, 35, 0.1)" : "none",
                    }}
                    title={
                      day.date
                        ? `${day.date}: ${day.value.toLocaleString()}`
                        : ""
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[8px] text-[#232323]/50">Less</span>
            <div
              className="w-[8px] h-[8px] rounded-[2px]"
              style={{ backgroundColor: emptyColor, border: "1px solid rgba(35, 35, 35, 0.1)" }}
            />
            <div
              className="w-[8px] h-[8px] rounded-[2px]"
              style={{ backgroundColor: `${color}4D`, border: "1px solid rgba(35, 35, 35, 0.1)" }}
            />
            <div
              className="w-[8px] h-[8px] rounded-[2px]"
              style={{ backgroundColor: `${color}80`, border: "1px solid rgba(35, 35, 35, 0.1)" }}
            />
            <div
              className="w-[8px] h-[8px] rounded-[2px]"
              style={{ backgroundColor: `${color}BF`, border: "1px solid rgba(35, 35, 35, 0.1)" }}
            />
            <div
              className="w-[8px] h-[8px] rounded-[2px]"
              style={{ backgroundColor: color, border: "1px solid rgba(35, 35, 35, 0.1)" }}
            />
            <span className="text-[8px] text-[#232323]/50">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DualHeatmap({ left, right }: DualHeatmapProps) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">Activity Comparison</h3>
      <div className="flex flex-col md:flex-row gap-6">
        <SingleHeatmap {...left} />
        <SingleHeatmap {...right} />
      </div>
    </div>
  );
}
