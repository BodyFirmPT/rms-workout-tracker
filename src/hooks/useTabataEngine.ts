import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorkoutExercise } from '@/types/workout';
import { playCountdownBeep, playStartBeep, playCompletionBeeps } from '@/lib/beep';

export type TabataMode = 'sets' | 'circuit';

export interface TabataSettings {
  workSeconds: number;
  restSeconds: number;
  mode: TabataMode;
  rounds: number;
  leadInSeconds: number;
}

export const DEFAULT_TABATA_SETTINGS: TabataSettings = {
  workSeconds: 20,
  restSeconds: 10,
  mode: 'sets',
  rounds: 4,
  leadInSeconds: 5,
};

export const TABATA_SETTINGS_KEY = 'tabata-settings';

export function loadTabataSettings(): TabataSettings {
  try {
    const raw = localStorage.getItem(TABATA_SETTINGS_KEY);
    if (!raw) return DEFAULT_TABATA_SETTINGS;
    return { ...DEFAULT_TABATA_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TABATA_SETTINGS;
  }
}

export function saveTabataSettings(settings: TabataSettings) {
  try {
    localStorage.setItem(TABATA_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export interface TabataInterval {
  exercise: WorkoutExercise;
  setNumber: number;
  setTotal: number;
  round: number;
  roundTotal: number;
}

export type TabataPhase = 'leadin' | 'work' | 'rest' | 'done';

export function buildIntervals(
  exercises: WorkoutExercise[],
  settings: TabataSettings
): TabataInterval[] {
  if (exercises.length === 0) return [];

  if (settings.mode === 'circuit') {
    const roundTotal = Math.max(1, settings.rounds);
    const intervals: TabataInterval[] = [];
    for (let round = 1; round <= roundTotal; round++) {
      exercises.forEach(exercise => {
        intervals.push({ exercise, setNumber: round, setTotal: roundTotal, round, roundTotal });
      });
    }
    return intervals;
  }

  const intervals: TabataInterval[] = [];
  exercises.forEach(exercise => {
    const setTotal = Math.max(1, exercise.set_count || 1);
    for (let setNumber = 1; setNumber <= setTotal; setNumber++) {
      intervals.push({ exercise, setNumber, setTotal, round: 1, roundTotal: 1 });
    }
  });
  return intervals;
}

interface UseTabataEngineArgs {
  exercises: WorkoutExercise[];
  settings: TabataSettings;
  onWorkIntervalComplete?: (interval: TabataInterval) => void;
  onFinished?: () => void;
}

export function useTabataEngine({
  exercises,
  settings,
  onWorkIntervalComplete,
  onFinished,
}: UseTabataEngineArgs) {
  const intervals = useMemo(() => buildIntervals(exercises, settings), [exercises, settings]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<TabataPhase>(
    settings.leadInSeconds > 0 ? 'leadin' : 'work'
  );
  const [remaining, setRemaining] = useState(
    settings.leadInSeconds > 0 ? settings.leadInSeconds : settings.workSeconds
  );
  const [isRunning, setIsRunning] = useState(true);

  const deadlineRef = useRef<number | null>(null);
  const lastBeepSecondRef = useRef<number | null>(null);
  const onWorkCompleteRef = useRef(onWorkIntervalComplete);
  const onFinishedRef = useRef(onFinished);
  onWorkCompleteRef.current = onWorkIntervalComplete;
  onFinishedRef.current = onFinished;

  const phaseDuration = useCallback(
    (p: TabataPhase) => {
      if (p === 'leadin') return settings.leadInSeconds;
      if (p === 'rest') return settings.restSeconds;
      return settings.workSeconds;
    },
    [settings]
  );

  const goTo = useCallback((nextIndex: number, nextPhase: TabataPhase) => {
    setIndex(nextIndex);
    setPhase(nextPhase);
    setRemaining(phaseDuration(nextPhase));
    deadlineRef.current = null;
    lastBeepSecondRef.current = null;
  }, [phaseDuration]);

  const advance = useCallback(
    (countProgress: boolean) => {
      if (phase === 'done') return;

      if (phase === 'leadin') {
        goTo(index, 'work');
        playStartBeep();
        return;
      }

      if (phase === 'work') {
        const current = intervals[index];
        if (countProgress && current) {
          onWorkCompleteRef.current?.(current);
        }
        const isLast = index >= intervals.length - 1;
        if (isLast) {
          setPhase('done');
          setRemaining(0);
          deadlineRef.current = null;
          setIsRunning(false);
          playCompletionBeeps();
          onFinishedRef.current?.();
          return;
        }
        if (settings.restSeconds > 0) {
          goTo(index, 'rest');
        } else {
          goTo(index + 1, 'work');
          playStartBeep();
        }
        return;
      }

      // rest
      goTo(index + 1, 'work');
      playStartBeep();
    },
    [phase, index, intervals, settings.restSeconds, goTo]
  );

  const back = useCallback(() => {
    if (phase === 'done') {
      goTo(Math.max(0, intervals.length - 1), 'work');
      setIsRunning(false);
      return;
    }
    if (phase === 'rest') {
      goTo(index, 'work');
      return;
    }
    if (phase === 'work' && index > 0) {
      goTo(index - 1, 'work');
      return;
    }
    goTo(index, phase);
  }, [phase, index, intervals.length, goTo]);

  // Timer loop, driven by wall-clock deadlines so it doesn't drift.
  useEffect(() => {
    if (!isRunning || phase === 'done') return;

    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + remaining * 1000;
    }

    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const secondsLeft = Math.max(0, (deadline - Date.now()) / 1000);
      const displayed = Math.ceil(secondsLeft);
      setRemaining(displayed);

      if (displayed > 0 && displayed <= 3 && lastBeepSecondRef.current !== displayed) {
        lastBeepSecondRef.current = displayed;
        playCountdownBeep();
      }

      if (secondsLeft <= 0.05) {
        advance(true);
      }
    };

    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [isRunning, phase, index, remaining, advance]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => {
      if (prev) {
        // pausing: freeze remaining
        const deadline = deadlineRef.current;
        if (deadline !== null) {
          setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        }
        deadlineRef.current = null;
        return false;
      }
      deadlineRef.current = null;
      return true;
    });
  }, []);

  const skip = useCallback(() => advance(false), [advance]);

  const total = intervals.length;
  const currentInterval = intervals[Math.min(index, Math.max(0, total - 1))] || null;
  const nextIntervals = intervals.slice(index + 1, index + 4);
  const duration = phaseDuration(phase === 'done' ? 'work' : phase) || 1;
  const progress = total > 0 ? Math.min(100, (index / total) * 100) : 0;

  return {
    intervals,
    index,
    total,
    phase,
    remaining,
    duration,
    isRunning,
    currentInterval,
    nextIntervals,
    progress,
    toggleRunning,
    skip,
    back,
  };
}
