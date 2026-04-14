import { useMemo } from "react";
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

function getDotStyle(count: number) {
  if (count === 0) return { size: 8, className: "bg-muted-foreground/20" };
  if (count === 1) return { size: 10, className: "bg-pink-300 dark:bg-pink-800" };
  if (count === 2) return { size: 13, className: "bg-pink-400 dark:bg-pink-600" };
  return { size: 16, className: "bg-pink-600 dark:bg-pink-400" };
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
          if (w.canceled_at) cancelled++;
          else count++;
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

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full py-1.5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            Workout Frequency
          </h3>
          {streak > 1 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-500">
              <Flame className="h-3 w-3" />
              {streak}-week streak
            </span>
          )}
        </div>

        {/* Timeline */}
        <div className="relative flex items-center">
          {/* Baseline */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border/60" />

          {/* Dots */}
          <div className="relative flex items-center justify-between w-full">
            {weeks.map((week, i) => {
              const isCurrentWeek = isSameWeek(new Date(), week.start, { weekStartsOn: 1 });
              const { size, className } = getDotStyle(week.count);
              const label = `${format(week.start, "MMM d")} – ${format(week.end, "MMM d")}`;

              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex justify-center cursor-default group">
                      <div className={cn("relative flex items-center justify-center", isCurrentWeek && "animate-pulse")}>
                        {isCurrentWeek && (
                          <div
                            className="absolute rounded-full border-2 border-pink-400/60 dark:border-pink-500/50"
                            style={{ width: size + 8, height: size + 8 }}
                          />
                        )}
                        <div
                          className={cn(
                            "rounded-full transition-all duration-150",
                            "group-hover:scale-125 group-hover:brightness-110",
                            className
                          )}
                          style={{ width: size, height: size }}
                        />
                      </div>
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
        </div>

        {/* Tick labels */}
        <div className="flex items-start justify-between mt-1.5">
          {weeks.map((week, i) => {
            const showLabel = i === 0 || i === Math.floor(weeks.length / 3) || i === Math.floor(2 * weeks.length / 3) || i === weeks.length - 1;
            return (
              <div key={i} className="flex-1 text-center">
                {showLabel && (
                  <span className="text-[9px] text-muted-foreground/40">
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
