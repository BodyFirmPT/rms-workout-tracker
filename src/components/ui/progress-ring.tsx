import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  cancelled?: boolean;
}

export function ProgressRing({ 
  progress, 
  size = 80, 
  strokeWidth = 8, 
  className,
  showText = true,
  textClassName,
  cancelled = false
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const iconSize = Math.max(size * 0.3, 12);

  return (
    <div className={cn("relative", className)}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className={cancelled ? "text-destructive/20" : "text-muted"}
        />
        {/* Progress circle */}
        {!cancelled && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-300 ease-in-out"
          />
        )}
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          {cancelled ? (
            <X className="text-destructive" style={{ width: iconSize, height: iconSize }} />
          ) : (
            <span className={cn("text-sm font-semibold text-foreground", textClassName)}>
              {Math.round(progress) === 100 ? (
                <Check className="text-primary" style={{ width: iconSize, height: iconSize }} />
              ) : (
                `${Math.round(progress)}%`
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
