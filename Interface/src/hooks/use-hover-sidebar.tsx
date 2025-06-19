
import { useState, useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function useHoverSidebar(options = { threshold: 50, delay: 300 }) {
  const { state, setOpen, isMobile } = useSidebar();
  const [isNearEdge, setIsNearEdge] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Skip behavior on mobile devices
    if (isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const isMouseNearLeftEdge = mouseX <= options.threshold;
      
      if (isMouseNearLeftEdge && !isNearEdge) {
        // Clear any existing timer
        if (hoverTimer) clearTimeout(hoverTimer);
        
        // Set a timer to open the sidebar after a short delay
        const timer = setTimeout(() => {
          setIsNearEdge(true);
          setOpen(true);
        }, options.delay);
        
        setHoverTimer(timer as NodeJS.Timeout);
      } else if (!isMouseNearLeftEdge && isNearEdge) {
        // Clear any existing timer
        if (hoverTimer) clearTimeout(hoverTimer);
        
        // Set a timer to close the sidebar after a delay
        // This prevents the sidebar from closing immediately when the mouse moves slightly away
        const timer = setTimeout(() => {
          setIsNearEdge(false);
          setOpen(false);
        }, options.delay * 1.5); // Slightly longer delay for closing
        
        setHoverTimer(timer as NodeJS.Timeout);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [isNearEdge, hoverTimer, setOpen, options.threshold, options.delay, isMobile]);

  return { isNearEdge };
}
