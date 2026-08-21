import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pause, Play, SkipForward, SkipBack, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWorkoutStore } from "@/stores/workoutStore";
import {
  TabataSettings,
  loadTabataSettings,
  useTabataEngine,
} from "@/hooks/useTabataEngine";
import { WorkoutExercise } from "@/types/workout";
import {
  normalizeBandType,
  resolveBandColor,
  ResistanceLevel,
} from "@/lib/band-colors";
import { cn } from "@/lib/utils";

const TabataMode = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    workouts,
    workoutExercises,
    muscleGroups,
    bandColors,
    clientBandMappings,
    loadData,
    loadWorkoutExercises,
    completeExerciseSet,
  } = useWorkoutStore();

  const [settings] = useState<TabataSettings>(() => loadTabataSettings());

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (id) loadWorkoutExercises(id);
  }, [id, loadWorkoutExercises]);

  const workout = workouts.find(w => w.id === id) || null;
  const exercises = useMemo(() => (id ? workoutExercises[id] || [] : []), [id, workoutExercises]);

  // Freeze the exercise list once loaded so mid-session edits don't reshuffle the timer.
  const [sequenceExercises, setSequenceExercises] = useState<WorkoutExercise[]>([]);
  useEffect(() => {
    if (exercises.length > 0 && sequenceExercises.length === 0) {
      setSequenceExercises(exercises);
    }
  }, [exercises, sequenceExercises.length]);

  const engine = useTabataEngine({
    exercises: sequenceExercises,
    settings,
    onWorkIntervalComplete: interval => {
      if (!id) return;
      const live = (useWorkoutStore.getState().workoutExercises[id] || []).find(
        e => e.id === interval.exercise.id
      );
      if (live && live.completed_sets < live.set_count) {
        void completeExerciseSet(id, interval.exercise.id);
      }
    },
  });

  // Keep the screen awake while the timer runs.
  useEffect(() => {
    let sentinel: any = null;
    let released = false;
    const request = async () => {
      try {
        sentinel = await (navigator as any).wakeLock?.request('screen');
      } catch {
        /* not supported */
      }
    };
    void request();
    return () => {
      released = true;
      try {
        sentinel?.release?.();
      } catch {
        /* ignore */
      }
      void released;
    };
  }, []);

  const muscleGroupName = (muscleGroupId: string) =>
    muscleGroups.find(mg => mg.id === muscleGroupId)?.name || '';

  const bandInfo = (exercise: WorkoutExercise) => {
    if (exercise.type !== 'band' || !exercise.resistance_level) return null;
    const bandType = normalizeBandType(exercise.band_type);
    if (!bandType) return null;
    return resolveBandColor({
      clientId: workout?.client_id,
      bandType,
      resistanceLevel: exercise.resistance_level as ResistanceLevel,
      palette: bandColors,
      mappings: clientBandMappings,
    });
  };

  const exit = () => navigate(id ? `/workout/${id}` : '/dashboard');

  if (!workout || sequenceExercises.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading workout…</p>
      </div>
    );
  }

  const { phase, remaining, duration, currentInterval, nextIntervals, index, total, isRunning } = engine;
  const isWork = phase === 'work';
  const isRest = phase === 'rest';
  const isDone = phase === 'done';
  const current = currentInterval;
  const band = current ? bandInfo(current.exercise) : null;

  const ratio = duration > 0 ? Math.min(1, Math.max(0, remaining / duration)) : 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;

  const phaseLabel = isDone ? 'Complete' : isRest ? 'Rest' : phase === 'leadin' ? 'Get ready' : 'Work';

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-500",
        isDone ? "bg-success-gradient" : isRest ? "bg-secondary" : isWork ? "bg-primary-gradient" : "bg-muted"
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className={cn("text-sm font-medium", isWork || isDone ? "text-primary-foreground/80" : "text-foreground/70")}>
          {settings.mode === 'circuit'
            ? `Round ${current?.round ?? 1} of ${current?.roundTotal ?? 1}`
            : current
              ? `Set ${current.setNumber} of ${current.setTotal}`
              : ''}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={exit}
          className={cn(isWork || isDone ? "text-primary-foreground hover:bg-white/10" : "")}
          aria-label="Exit tabata mode"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <span
          className={cn(
            "mb-4 text-sm font-semibold uppercase tracking-[0.3em]",
            isWork || isDone ? "text-primary-foreground/80" : "text-foreground/60"
          )}
        >
          {phaseLabel}
        </span>

        <div className="relative">
          <svg width={300} height={300} className="-rotate-90">
            <circle
              cx={150}
              cy={150}
              r={radius}
              fill="none"
              strokeWidth={10}
              className={cn(isWork || isDone ? "stroke-white/20" : "stroke-foreground/10")}
            />
            <circle
              cx={150}
              cy={150}
              r={radius}
              fill="none"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              className={cn(
                "transition-[stroke-dashoffset] duration-200 ease-linear",
                isWork || isDone ? "stroke-white" : "stroke-primary"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isDone ? (
              <CheckCircle2 className="h-24 w-24 text-primary-foreground" />
            ) : (
              <span
                className={cn(
                  "font-mono text-7xl font-bold tabular-nums",
                  isWork ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {remaining}
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          {isDone ? (
            <h1 className="text-4xl font-bold text-primary-foreground">Workout complete</h1>
          ) : (
            <>
              <h1
                className={cn(
                  "text-4xl sm:text-5xl font-bold leading-tight",
                  isWork ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {isRest ? 'Rest' : current?.exercise.exercise_name}
              </h1>
              {!isRest && current && (
                <p
                  className={cn(
                    "mt-3 text-lg",
                    isWork ? "text-primary-foreground/80" : "text-foreground/70"
                  )}
                >
                  {muscleGroupName(current.exercise.muscle_group_id)}
                  {current.exercise.reps_count ? ` · ${current.exercise.reps_count} ${current.exercise.reps_unit}` : ''}
                  {current.exercise.weight_count ? ` · ${current.exercise.weight_count} ${current.exercise.weight_unit}` : ''}
                  {band && (
                    <span className="ml-2 inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-white/40"
                        style={{ backgroundColor: band.hex }}
                      />
                      {band.name}
                    </span>
                  )}
                </p>
              )}
              {isRest && nextIntervals[0] && (
                <p className="mt-3 text-lg text-foreground/70">
                  Next up: {nextIntervals[0].exercise.exercise_name}
                </p>
              )}
            </>
          )}
        </div>

        {/* Upcoming */}
        {!isDone && nextIntervals.length > 0 && (
          <div className="mt-10 w-full max-w-md space-y-2">
            {nextIntervals.map((interval, i) => (
              <div
                key={`${interval.exercise.id}-${interval.setNumber}-${i}`}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                  isWork || isDone ? "bg-white/10 text-primary-foreground/80" : "bg-foreground/5 text-foreground/70"
                )}
              >
                <span className="truncate">{interval.exercise.exercise_name}</span>
                <span className="ml-3 shrink-0 opacity-70">
                  {settings.mode === 'circuit'
                    ? `R${interval.round}`
                    : `Set ${interval.setNumber}/${interval.setTotal}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-8 pt-4 space-y-4">
        <div className="mx-auto max-w-md space-y-1">
          <Progress
            value={engine.progress}
            className={cn(isWork || isDone ? "bg-white/20 [&>div]:bg-white" : "")}
          />
          <p
            className={cn(
              "text-center text-xs",
              isWork || isDone ? "text-primary-foreground/70" : "text-foreground/60"
            )}
          >
            Interval {Math.min(index + 1, total)} of {total}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={engine.back}
            className="h-14 w-14 rounded-full"
            aria-label="Previous interval"
          >
            <SkipBack className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            onClick={engine.toggleRunning}
            disabled={isDone}
            className="h-20 w-20 rounded-full"
            aria-label={isRunning ? "Pause" : "Resume"}
          >
            {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={engine.skip}
            disabled={isDone}
            className="h-14 w-14 rounded-full"
            aria-label="Skip interval"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {isDone && (
          <div className="flex justify-center">
            <Button variant="secondary" size="lg" onClick={exit}>
              Back to workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabataMode;
