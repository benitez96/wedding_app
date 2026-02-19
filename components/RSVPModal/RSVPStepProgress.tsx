"use client";

interface RSVPStepProgressProps {
  current: number; // 0-based index
  total: number;
}

// Visual step progress indicator — dots
export function RSVPStepProgress({ current, total }: RSVPStepProgressProps) {
  if (total <= 1) return null;

  return (
    <div
      className="flex justify-center gap-2"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === current
              ? "bg-primary w-4"
              : i < current
                ? "bg-primary opacity-50"
                : "bg-default-300"
          }`}
        />
      ))}
    </div>
  );
}
