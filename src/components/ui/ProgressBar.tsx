// ============================================================
// UI Component — Progress Bar (for reputation, resources)
// ============================================================

interface ProgressBarProps {
  value: number;
  max: number;
  min?: number;
  label: string;
  color?: string;
  showValue?: boolean;
}

export default function ProgressBar({
  value,
  max,
  min = 0,
  label,
  color = 'bg-blue-500',
  showValue = true,
}: ProgressBarProps) {
  const range = max - min;
  const percentage = range > 0 ? Math.max(0, Math.min(100, ((value - min) / range) * 100)) : 0;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-medium">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        {showValue && (
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
            {value}
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
