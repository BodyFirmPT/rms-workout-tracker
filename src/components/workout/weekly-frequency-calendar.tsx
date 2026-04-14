import { useMemo, useState } from "react";
import { startOfWeek, endOfWeek, format, subWeeks, isWithinInterval, parseISO, isSameWeek } from "date-fns";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Workout } from "@/types/workout";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function getBarColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-pink-200 dark:bg-pink-900";
  if (count === 2) return "bg-pink-400 dark:bg-pink-600";
  return "bg-pink-600 dark:bg-pink-400";
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

  const streak = useMemo(() => {
    let count = 0;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].count > 0) count++;
      else break;
    }
    return count;
  }, [weeks]);

  const maxCount = useMemo(() => Math.max(...weeks.map(w => w.count), 1), [weeks]);

  const maxBarHeight = 32;
  const minBarHeight = 3;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full py-2">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Workout Frequency
          </h3>
          {streak > 1 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-500">
              <Flame className="h-3 w-3" />
              {streak}-week streak
            </span>
          )}
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-[3px] h-[40px]">
          {weeks.map((week, i) => {
            const isCurrentWeek = isSameWeek(new Date(), week.start, { weekStartsOn: 1 });
            const barHeight = week.count === 0
              ? minBarHeight
              : Math.max(minBarHeight + 4, (week.count / maxCount) * maxBarHeight);
            const label = `${format(week.start, "MMM d")} – ${format(week.end, "MMM d")}`;

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="flex-1 flex items-end justify-center group cursor-default"
                    style={{ height: maxBarHeight + 4 }}
                  >
                    <div
                      className={cn(
                        "w-full rounded-sm transition-all duration-150",
                        "group-hover:opacity-80 group-hover:scale-y-110 origin-bottom",
                        getBarColor(week.count),
                        isCurrentWeek && "ring-1 ring-pink-400/50 ring-offset-1 ring-offset-background"
                      )}
                      style={{ height: barHeight }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    {week.count} workout{week.count !== 1 ? "s" : ""}
                    {week.cancelled > 0 && ` · ${week.cancelled} cancelled`}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Subtle tick labels */}
        <div className="flex items-start gap-[3px] mt-1">
          {weeks.map((week, i) => {
            // Show label every 4 weeks and for the last item
            const showLabel = i % 4 === 0 || i === weeks.length - 1;
            return (
              <div key={i} className="flex-1 text-center">
                {showLabel && (
                  <span className="text-[9px] text-muted-foreground/60 leading-none">
                    {format(week.start, "M/d")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
