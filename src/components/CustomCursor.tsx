'use client';

import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouchDevice(isTouch);

    if (isTouch) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let cursorX: gsap.QuickToFunc;
    let cursorY: gsap.QuickToFunc;
    let glowX: gsap.QuickToFunc;
    let glowY: gsap.QuickToFunc;

    if (cursorRef.current && glowRef.current) {
      cursorX = gsap.quickTo(cursorRef.current, "x", { duration: 0.1, ease: "power2.out" });
      cursorY = gsap.quickTo(cursorRef.current, "y", { duration: 0.1, ease: "power2.out" });
      glowX = gsap.quickTo(glowRef.current, "x", { duration: 0.8, ease: "power3.out" });
      glowY = gsap.quickTo(glowRef.current, "y", { duration: 0.8, ease: "power3.out" });
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      if (cursorX && cursorY && glowX && glowY) {
        cursorX(e.clientX);
        cursorY(e.clientY);
        glowX(e.clientX);
        glowY(e.clientY);
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (isTouchDevice) return null;

  return (
    <>
      <div 
        ref={glowRef}
        className={`fixed top-0 left-0 w-64 h-64 -mt-32 -ml-32 rounded-full pointer-events-none z-40 transition-opacity duration-500 mix-blend-screen ${isVisible ? 'opacity-30' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(0,0,0,0) 70%)',
          willChange: 'transform'
        }}
      />
      <div 
        ref={cursorRef}
        className={`fixed top-0 left-0 w-2 h-2 -mt-1 -ml-1 bg-blue-500 rounded-full pointer-events-none z-50 transition-opacity duration-300 mix-blend-screen shadow-[0_0_10px_rgba(59,130,246,0.8)] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'transform' }}
      />
    </>
  );
}
