import { useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { ChevronUp } from "lucide-react";

interface SwipeUpIndicatorProps {
  onSwipeUp: () => void;
}

export default function SwipeUpIndicator({ onSwipeUp }: SwipeUpIndicatorProps) {
  const { colors } = useTheme();
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const distance = touchStartY.current - touchEndY;
    const duration = touchEndTime - touchStartTime.current;
    const velocity = distance / duration;

    // Swipe up detection: distance > 50px upward OR fast velocity upward
    if (distance > 50 || velocity > 0.5) {
      onSwipeUp();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex flex-col items-center justify-center z-30 pointer-events-none"
      style={{
        height: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))',
        background: `linear-gradient(to top, ${colors.primary}60, transparent)`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div 
        className="pointer-events-auto py-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: "none",
        }}
      >
        <ChevronUp className="w-6 h-6 text-white/50 mb-1 transition-all animate-bounce" />
        <div className="w-12 h-1 bg-white/40 rounded-full transition-all" />
      </div>
    </div>
  );
}