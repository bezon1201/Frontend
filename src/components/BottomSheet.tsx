import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import ClockIcon from "./ClockIcon";
import GearIcon from "./GearIcon";
import ReportIcon from "./ReportIcon";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCampaign?: () => void;
  onOpenSettings?: () => void;
  onOpenReports?: () => void;
}

export default function BottomSheet({ isOpen, onClose, onOpenCampaign, onOpenSettings, onOpenReports }: BottomSheetProps) {
  const { colors } = useTheme();
  const [translateY, setTranslateY] = useState(100);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const mouseStartY = useRef(0);
  const isMouseDragging = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
    } else {
      setTranslateY(100);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    
    // Only allow dragging down
    if (diff > 0) {
      const percentage = (diff / window.innerHeight) * 100;
      setTranslateY(Math.min(percentage, 100));
    }
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentY.current - touchStartY.current;
    
    // Close if dragged down more than 100px
    if (diff > 100) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartY.current = e.clientY;
    isMouseDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDragging.current) {
      const diff = e.clientY - mouseStartY.current;
      
      // Only allow dragging down
      if (diff > 0) {
        const percentage = (diff / window.innerHeight) * 100;
        setTranslateY(Math.min(percentage, 100));
      }
    }
  };

  const handleMouseUp = () => {
    if (isMouseDragging.current) {
      const diff = touchCurrentY.current - touchStartY.current;
      
      // Close if dragged down more than 100px
      if (diff > 100) {
        onClose();
      } else {
        setTranslateY(0);
      }
      isMouseDragging.current = false;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
          style={{ 
            opacity: translateY === 0 ? 1 : 0,
            pointerEvents: translateY === 0 ? 'auto' : 'none'
          }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        data-scrollable="true"
        style={{
          backgroundColor: "#000000",
          transform: `translateY(${translateY}%)`,
          touchAction: "none",
          transition: isMouseDragging.current ? 'none' : 'transform 0.3s ease-out',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
        </div>

        {/* Content */}
        <div 
          className="px-8" 
          style={{ 
            paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' 
          }}
        >
          <div className="flex justify-center items-center gap-8">
            <button
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform cursor-pointer hover:scale-110"
              style={{ backgroundColor: 'black' }}
              onClick={() => {
                if (onOpenCampaign) {
                  onOpenCampaign();
                }
              }}
            >
              <ClockIcon className="w-14 h-14" />
            </button>
            <button
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform cursor-pointer hover:scale-110"
              style={{ backgroundColor: 'black' }}
              onClick={() => {
                if (onOpenReports) {
                  onOpenReports();
                }
              }}
            >
              <ReportIcon className="w-14 h-14" />
            </button>
            <button
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform cursor-pointer hover:scale-110"
              style={{ backgroundColor: 'black' }}
              onClick={() => {
                if (onOpenSettings) {
                  onOpenSettings();
                }
              }}
            >
              <GearIcon className="w-14 h-14" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}