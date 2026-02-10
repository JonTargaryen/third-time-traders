// ============================================================
// UI Component — Ad Banner Placeholder
// ============================================================

interface AdBannerProps {
  slot: 'top' | 'bottom' | 'interstitial';
  className?: string;
}

export default function AdBanner({ slot, className = '' }: AdBannerProps) {
  // In production, this will be replaced with Google AdSense code
  // For now, render a placeholder that shows where ads will go
  const heights: Record<string, string> = {
    top: 'h-[50px]',
    bottom: 'h-[50px]',
    interstitial: 'h-[250px]',
  };

  return (
    <div
      data-ad-slot={slot}
      className={`
        flex items-center justify-center
        ${heights[slot]}
        w-full rounded-lg border border-dashed border-zinc-300
        bg-zinc-50 text-xs text-zinc-400
        dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-600
        ${className}
      `}
    >
      <span>Ad Space — {slot}</span>
    </div>
  );
}
