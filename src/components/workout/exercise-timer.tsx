import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExerciseTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  onReset?: () => void;
}

export function ExerciseTimer({ duration, onComplete, onReset }: ExerciseTimerProps) {
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
    // Play 6 beeps with 200ms intervals for better notification
    for (let i = 0; i < 6; i++) {
      setTimeout(() => playBeep(), i * 200);
    }
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
    const wasCompleted = hasCompleted;
    setHasCompleted(false);
    
    // If it was completed, call onReset to uncheck the exercise
    if (wasCompleted && onReset) {
      onReset();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="flex items-center gap-0.5">
      <div className="relative">
        <svg className="w-10 h-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="17"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            className="text-muted/50"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 17}`}
            strokeDashoffset={`${2 * Math.PI * 17 * (1 - progress / 100)}`}
            className={cn(
              "transition-all duration-1000",
              hasCompleted ? "text-success" : "text-primary"
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-[11px] font-mono font-medium",
            hasCompleted ? "text-success" : "text-foreground"
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
      
      <div className="flex gap-1">
        {!hasCompleted && (
          // Show play/pause when not completed
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="h-9 w-9 p-0 border-2 border-primary text-primary hover:bg-primary/10 rounded-full"
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <Pause className="h-5 w-5" strokeWidth={3} />
            ) : (
              <Play className="h-5 w-5" strokeWidth={3} />
            )}
          </Button>
        )}
        
        {(timeRemaining !== duration || hasCompleted) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 w-9 p-0 border-2 border-primary text-primary hover:bg-primary/10 rounded-full"
            title="Reset"
          >
            <RotateCcw className="h-5 w-5" strokeWidth={3} />
          </Button>
        )}
        
        {hasCompleted && (
          // Show green check when completed (last position)
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 border-2 border-success bg-success text-success-foreground hover:bg-success/80 rounded-full"
            disabled
          >
            <Check className="h-5 w-5 font-bold" strokeWidth={3} />
          </Button>
        )}
      </div>
    </div>
  );
}
