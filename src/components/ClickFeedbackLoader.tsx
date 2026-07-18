import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ClickInstance {
  id: number;
  x: number;
  y: number;
}

export const ClickFeedbackLoader: React.FC = () => {
  const [clicks, setClicks] = useState<ClickInstance[]>([]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Determine if the clicked element or any parent is clickable/interactive
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'OPTION' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        window.getComputedStyle(target).cursor === 'pointer';

      if (!isClickable) return;

      // Show the progress/wait cursor globally on the document
      document.documentElement.style.cursor = 'progress';
      const cursorTimer = setTimeout(() => {
        document.documentElement.style.cursor = '';
      }, 500);

      // Create a visual feedback ring/spinner at the click coordinate
      const id = Date.now() + Math.random();
      const newClick = { id, x: e.clientX, y: e.clientY };
      setClicks((prev) => [...prev, newClick]);

      // Remove after animation finishes
      const removeTimer = setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== id));
      }, 600);

      return () => {
        clearTimeout(cursorTimer);
        clearTimeout(removeTimer);
      };
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden">
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 1, scale: 0.3, rotate: 0 }}
            animate={{ opacity: [1, 0.8, 0], scale: [0.3, 1.2, 1.5], rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: 'fixed',
              left: click.x - 16, // Center the 32px spinner
              top: click.y - 16,
            }}
            className="flex items-center justify-center"
          >
            {/* Spinning micro loading ring */}
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-spin" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
