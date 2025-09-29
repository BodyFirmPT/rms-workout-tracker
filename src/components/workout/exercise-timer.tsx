import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExerciseTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
}

export function ExerciseTimer({ duration, onComplete }: ExerciseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play beep sound
  const playBeep = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  };

  const playCompletionBeeps = () => {
    playBeep();
    setTimeout(() => playBeep(), 150);
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasCompleted(true);
            playCompletionBeeps();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(duration);
    setHasCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <svg className="w-8 h-8 -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-muted/50"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 14}`}
            strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
            className={cn(
              "transition-all duration-1000",
              hasCompleted ? "text-success" : "text-primary"
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-[10px] font-mono font-medium",
            hasCompleted ? "text-success" : "text-foreground"
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
      
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-5 w-5 p-0"
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="h-2.5 w-2.5" />
          ) : (
            <Play className="h-2.5 w-2.5" />
          )}
        </Button>
        
        {(timeRemaining !== duration || hasCompleted) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-5 w-5 p-0"
            title="Reset"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
