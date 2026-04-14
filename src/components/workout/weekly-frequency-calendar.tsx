import { useMemo } from "react";
import { startOfWeek, endOfWeek, format, subWeeks, isWithinInterval, parseISO, isSameWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { Workout } from "@/types/workout";

interface WeeklyFrequencyCalendarProps {
  workouts: Workout[];
  weeksToShow?: number;
}

interface WeekData {
  start: Date;
  end: Date;
  count: number;
  cancelled: number;
}

function getIntensityClasses(count: number, maxCount: number): string {
  if (count === 0) return "bg-muted text-muted-foreground";
  const ratio = count / Math.max(maxCount, 1);
  if (ratio <= 0.25) return "bg-primary/20 text-primary";
  if (ratio <= 0.5) return "bg-primary/40 text-primary-foreground";
  if (ratio <= 0.75) return "bg-primary/70 text-primary-foreground";
  return "bg-primary text-primary-foreground";
}

export function WeeklyFrequencyCalendar({ workouts, weeksToShow = 12 }: WeeklyFrequencyCalendarProps) {
  const weeks: WeekData[] = useMemo(() => {
    const now = new Date();
    const result: WeekData[] = [];

    for (let i = 0; i < weeksToShow; i++) {
      const refDate = subWeeks(now, weeksToShow - 1 - i);
      const start = startOfWeek(refDate, { weekStartsOn: 1 });
      const end = endOfWeek(refDate, { weekStartsOn: 1 });

      let count = 0;
      let cancelled = 0;
      workouts.forEach(w => {
        const d = parseISO(w.date);
        if (isWithinInterval(d, { start, end })) {
          if (w.canceled_at) {
            cancelled++;
          } else {
            count++;
          }
        }
      });

      result.push({ start, end, count, cancelled });
    }
    return result;
  }, [workouts, weeksToShow]);

  const maxCount = useMemo(() => Math.max(...weeks.map(w => w.count), 1), [weeks]);

  return (
    <div className="w-full">
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {weeks.map((week, i) => {
          const isCurrentWeek = isSameWeek(new Date(), week.start, { weekStartsOn: 1 });
          const label = `${format(week.start, "MMM d")}–${format(week.end, "d")}`;
          return (
            <div
              key={i}
              className={cn(
                "inline-flex flex-col items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors flex-1 min-w-[72px]",
                isCurrentWeek ? "border-2 border-dashed border-primary/50" : "border",
                getIntensityClasses(week.count, maxCount)
              )}
              title={`${label}: ${week.count} workout${week.count !== 1 ? "s" : ""}${week.cancelled ? `, ${week.cancelled} cancelled` : ""}`}
            >
              <span className="text-[10px] font-medium opacity-80 leading-tight">
                {isCurrentWeek ? "This week" : `${format(week.start, "M/d")}–${format(week.end, "M/d")}`}
              </span>
              <span className="text-sm font-bold leading-tight mt-0.5">
                {week.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
