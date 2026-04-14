import { useMemo } from "react";
import { startOfWeek, endOfWeek, format, subWeeks, isWithinInterval, parseISO, isSameWeek } from "date-fns";
import { Flame, CalendarDays } from "lucide-react";
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

function getIntensityClasses(count: number, maxCount: number, isCurrentWeek: boolean): string {
  if (count === 0) return "bg-muted text-muted-foreground border-border";
  const ratio = count / Math.max(maxCount, 1);
  const dashedBorder = isCurrentWeek ? "" : " border-solid";
  if (ratio <= 0.25) return `bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800${dashedBorder}`;
  if (ratio <= 0.5) return `bg-pink-200 text-pink-800 border-pink-300 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700${dashedBorder}`;
  if (ratio <= 0.75) return `bg-pink-400 text-white border-pink-500 dark:bg-pink-700 dark:text-pink-100 dark:border-pink-600${dashedBorder}`;
  return `bg-pink-600 text-white border-pink-700 dark:bg-pink-500 dark:text-white dark:border-pink-400${dashedBorder}`;
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

  // Calculate current streak (consecutive weeks with ≥1 workout, counting back from current week)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].count > 0) count++;
      else break;
    }
    return count;
  }, [weeks]);

  const maxCount = useMemo(() => Math.max(...weeks.map(w => w.count), 1), [weeks]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="h-4 w-4 text-pink-500" />
        <h3 className="text-sm font-semibold text-foreground">Workout Frequency</h3>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {weeks.map((week, i) => {
          const isCurrentWeek = isSameWeek(new Date(), week.start, { weekStartsOn: 1 });
          const label = `${format(week.start, "MMM d")}–${format(week.end, "d")}`;
          return (
            <div
              key={i}
              className={cn(
                "inline-flex flex-col items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors flex-1 min-w-[72px] border",
                isCurrentWeek && "border-2 border-dashed border-pink-400",
                getIntensityClasses(week.count, maxCount, isCurrentWeek)
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
      {streak > 1 && (
        <div className="flex justify-end mt-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-500">
            <Flame className="h-3.5 w-3.5" />
            {streak} week streak!
          </span>
        </div>
      )}
    </div>
  );
}
