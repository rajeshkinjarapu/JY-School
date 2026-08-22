import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pulling if we are at the very top of the scroll container
      if (el.scrollTop <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const dy = currentY.current - startY.current;

      // If pulling down
      if (dy > 0) {
        // Prevent default scrolling when pulling down at the top
        if (e.cancelable) e.preventDefault();
        
        // Add resistance
        const distance = Math.min(dy * 0.4, MAX_PULL);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance > THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD); // Keep it visible while refreshing
        
        try {
          await onRefresh();
        } catch (e) {
          console.error(e);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Did not reach threshold, snap back
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div className="relative h-full w-full overflow-hidden print:overflow-visible print:h-auto print:block">
      {/* Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center z-10 transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance - 50}px)`,
          opacity: pullDistance / THRESHOLD
        }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg flex items-center justify-center">
          <Loader2 
            className={`w-5 h-5 text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined }}
          />
        </div>
      </div>

      {/* Content Container */}
      <div 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto print:overflow-visible print:h-auto print:!transform-none print:block"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          overscrollBehavior: 'contain'
        }}
      >
        {children}
      </div>
    </div>
  );
};
