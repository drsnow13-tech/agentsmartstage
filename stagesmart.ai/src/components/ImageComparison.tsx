import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveLeft, MoveRight } from 'lucide-react';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
}

export function ImageComparison({ 
  beforeImage, 
  afterImage, 
  className = '',
  objectFit = 'contain'
}: ImageComparisonProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setPosition(percent);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };

    const onUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-crosshair ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* After Image (Bottom) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <img 
          src={afterImage} 
          alt="After" 
          className={`w-full h-full object-${objectFit}`}
        />
        <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm">
          Staged
        </div>
      </div>
      
      {/* Before Image (Top, clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Before" 
          className={`absolute inset-0 w-full h-full object-${objectFit}`}
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm">
          Before
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.3)] z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center gap-0.5 text-slate-800 border border-slate-200">
          <MoveLeft className="w-3 h-3" />
          <MoveRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
