import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { ThemeProvider } from "./context/ThemeContext";
import { DataSourceProvider } from "./context/DataSourceContext";
import { MessagesProvider } from "./context/MessagesContext";
import FinanceScreen from "./components/FinanceScreen";
import DashboardScreen from "./components/DashboardScreen";
import OrdersScreen from "./components/OrdersScreen";
import CampaignScreen from "./components/CampaignScreen";
import SettingsScreen from "./components/SettingsScreen";
import ReportsLogsScreen from "./components/ReportsLogsScreen";
import TelegramWebAppConfig from "./components/TelegramWebAppConfig";
import BottomSheet from "./components/BottomSheet";
import { Toaster } from "sonner@2.0.3";

const SCREENS = ["finance", "dashboard", "orders"] as const;
type Screen = typeof SCREENS[number];

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [direction, setDirection] = useState(0);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showCampaignScreen, setShowCampaignScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showReportsLogsScreen, setShowReportsLogsScreen] = useState(false);
  
  const screenIndex = SCREENS.indexOf(currentScreen);

  // Prevent Telegram Web App from collapsing on swipes
  useEffect(() => {
    const preventDefaultScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow vertical scroll in scrollable areas
      if (target.closest('[data-scrollable]')) {
        return; // Don't prevent scroll in designated scrollable areas
      }
      
      // Allow only our controlled interactions
      if (e.touches.length > 1) {
        // Prevent multi-touch gestures
        e.preventDefault();
      }
    };

    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[data-scrollable]') as HTMLElement;
      
      // If inside scrollable area, check if at scroll boundary
      if (scrollableParent) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableParent;
        const isAtTop = scrollTop === 0;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
        
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          const deltaY = touch.clientY - (scrollableParent.dataset.startY ? parseFloat(scrollableParent.dataset.startY) : touch.clientY);
          
          // Prevent overscroll at boundaries
          if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
            e.preventDefault();
          }
        }
        return;
      }
      
      // Prevent pull-to-refresh and overscroll bounce outside scrollable areas
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const startY = touch.clientY;
        
        // Prevent vertical bounce at edges
        if (startY < 50 || startY > window.innerHeight - 50) {
          e.preventDefault();
        }
      }
    };

    const trackTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[data-scrollable]') as HTMLElement;
      
      if (scrollableParent && e.touches.length === 1) {
        scrollableParent.dataset.startY = e.touches[0].clientY.toString();
      }
    };

    // Lock viewport for Telegram
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    
    document.addEventListener('touchstart', trackTouchStart, { passive: true });
    document.addEventListener('touchmove', preventDefaultScroll, { passive: false });
    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    
    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('touchstart', trackTouchStart);
      document.removeEventListener('touchmove', preventDefaultScroll);
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, []);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    const offsetY = info.offset.y;

    // Only trigger horizontal navigation if horizontal movement is dominant
    const isHorizontalSwipe = Math.abs(offset) > Math.abs(offsetY) * 2;

    if (isHorizontalSwipe && (Math.abs(velocity) > 500 || Math.abs(offset) > threshold)) {
      if (offset > 0 && screenIndex > 0) {
        // Swipe right - go to previous screen
        setDirection(-1);
        setCurrentScreen(SCREENS[screenIndex - 1]);
      } else if (offset < 0 && screenIndex < SCREENS.length - 1) {
        // Swipe left - go to next screen
        setDirection(1);
        setCurrentScreen(SCREENS[screenIndex + 1]);
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
    }),
    center: {
      x: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
    }),
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "finance":
        return <FinanceScreen currentScreen={currentScreen} />;
      case "dashboard":
        return <DashboardScreen currentScreen={currentScreen} />;
      case "orders":
        return <OrdersScreen currentScreen={currentScreen} />;
    }
  };

  // Handle swipe up from bottom to open BottomSheet
  const handleSwipeUp = () => {
    setIsBottomSheetOpen(true);
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <TelegramWebAppConfig />
      <Toaster position="top-center" richColors closeButton />
      
      {/* Full Screen Content - no iPhone frame */}
      <div className="relative w-full h-full bg-black overflow-hidden">
        {showSettingsScreen ? (
          <SettingsScreen onClose={() => setShowSettingsScreen(false)} />
        ) : showCampaignScreen ? (
          <CampaignScreen onBack={() => setShowCampaignScreen(false)} isNew={true} />
        ) : showReportsLogsScreen ? (
          <ReportsLogsScreen onClose={() => setShowReportsLogsScreen(false)} />
        ) : (
          <>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentScreen}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 40,
                    mass: 0.8
                  },
                }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                className="absolute inset-0"
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>

            {/* Swipe Up Zone for BottomSheet - invisible, touch-only */}
            <SwipeUpZone onSwipeUp={handleSwipeUp} />
          </>
        )}
      </div>
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onOpenCampaign={() => {
          setShowCampaignScreen(true);
          setIsBottomSheetOpen(false);
        }}
        onOpenSettings={() => {
          setShowSettingsScreen(true);
          setIsBottomSheetOpen(false);
        }}
        onOpenReports={() => {
          setShowReportsLogsScreen(true);
          setIsBottomSheetOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataSourceProvider>
        <MessagesProvider>
          <AppContent />
        </MessagesProvider>
      </DataSourceProvider>
    </ThemeProvider>
  );
}

// Invisible swipe up zone component
function SwipeUpZone({ onSwipeUp }: { onSwipeUp: () => void }) {
  const startY = useRef<number>(0);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      const distance = startY.current - e.clientY;
      
      // Swipe up detection: distance > 50px upward
      if (distance > 50) {
        onSwipeUp();
      }
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: '80px',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
}