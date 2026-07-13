'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSearchParams } from 'next/navigation';
import { FRAME_CONFIG, getFramePath } from '@/utils/frame-manifest';

gsap.registerPlugin(ScrollTrigger);

export default function NovaHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('sequenceDebug') === '1';

  // UI state for initial loading and fallback only
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Debug refs (DOM elements to update without React state)
  const debugRequestedRef = useRef<HTMLDivElement>(null);
  const debugRenderedRef = useRef<HTMLDivElement>(null);
  const debugScrollRef = useRef<HTMLDivElement>(null);
  const debugLoadedRef = useRef<HTMLDivElement>(null);
  const debugFailedRef = useRef<HTMLDivElement>(null);
  const debugCanvasRef = useRef<HTMLDivElement>(null);

  // High-frequency mutable refs
  const scrollProgressRef = useRef(0);
  const requestedFrameRef = useRef(1);
  const renderedFrameRef = useRef(1);
  const loadedCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const imagesRef = useRef<Record<number, HTMLImageElement | null>>({});

  // Typography Refs
  const identityRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const updateDebugUI = useCallback(() => {
    if (!isDebug) return;
    if (debugRequestedRef.current) debugRequestedRef.current.innerText = `REQUESTED: ${requestedFrameRef.current}`;
    if (debugRenderedRef.current) debugRenderedRef.current.innerText = `RENDERED: ${renderedFrameRef.current}`;
    if (debugScrollRef.current) debugScrollRef.current.innerText = `SCROLL: ${(scrollProgressRef.current * 100).toFixed(1)}%`;
    if (debugLoadedRef.current) debugLoadedRef.current.innerText = `LOADED: ${loadedCountRef.current}`;
    if (debugFailedRef.current) debugFailedRef.current.innerText = `FAILED: ${failedCountRef.current}`;
    if (debugCanvasRef.current && canvasRef.current) {
      debugCanvasRef.current.innerText = `CANVAS: ${canvasRef.current.width}x${canvasRef.current.height}`;
    }
  }, [isDebug]);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let targetImg = imagesRef.current[frameIndex];

    if (!targetImg) {
      let offset = 1;
      while (offset < FRAME_CONFIG.totalFrames) {
        const prev = frameIndex - offset;
        const next = frameIndex + offset;
        if (prev >= 1 && imagesRef.current[prev]) {
          targetImg = imagesRef.current[prev];
          break;
        }
        if (next <= FRAME_CONFIG.totalFrames && imagesRef.current[next]) {
          targetImg = imagesRef.current[next];
          break;
        }
        offset++;
      }
    }

    if (!targetImg) return; // Never clear if we don't have a replacement

    // Using physical backing buffer coordinates
    const physicalWidth = canvas.width;
    const physicalHeight = canvas.height;
    
    // Draw calculations based on backing buffer
    const imgWidth = targetImg.width;
    const imgHeight = targetImg.height;
    
    const canvasRatio = physicalWidth / physicalHeight;
    const imgRatio = imgWidth / imgHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawWidth = physicalWidth;
      drawHeight = physicalWidth / imgRatio;
      offsetX = 0;
      offsetY = (physicalHeight - drawHeight) / 2;
    } else {
      drawHeight = physicalHeight;
      drawWidth = physicalHeight * imgRatio;
      offsetX = (physicalWidth - drawWidth) * 0.5;
      offsetY = 0;
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx.imageSmoothingQuality = 'high';

    // Clear and paint in one atomic operation
    ctx.clearRect(0, 0, physicalWidth, physicalHeight);
    ctx.drawImage(targetImg, offsetX, offsetY, drawWidth, drawHeight);

    renderedFrameRef.current = frameIndex;
    updateDebugUI();
  }, [updateDebugUI]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      drawFrame(requestedFrameRef.current);
      rafRef.current = null;
    });
  }, [drawFrame]);

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    
    // Cap DPR at 2 for performance, preventing massive GPU buffers
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // DO NOT scale the context here. 
    // We will draw directly into the physical buffer in drawFrame using physical coordinates.

    scheduleRender();
  }, [scheduleRender]);

  // Preloading Logic
  useEffect(() => {
    let active = true;
    const total = FRAME_CONFIG.totalFrames;

    const loadImage = async (index: number): Promise<void> => {
      if (imagesRef.current[index]) return;
      
      return new Promise((resolve) => {
        const img = new Image();
        img.src = getFramePath(index);
        
        img.onload = async () => {
          if (!active) return resolve();
          try {
            await img.decode();
            if (!active) return resolve();
            imagesRef.current[index] = img;
            loadedCountRef.current++;
            
            if (index === 1) setIsReady(true);
            
            if (index === requestedFrameRef.current) {
              scheduleRender();
            } else {
              updateDebugUI();
            }
          } catch {
            // Failed to decode
            if (!active) return resolve();
            failedCountRef.current++;
            imagesRef.current[index] = null;
          }
          resolve();
        };

        img.onerror = () => {
          if (!active) return resolve();
          failedCountRef.current++;
          imagesRef.current[index] = null;
          resolve();
        };
      });
    };

    const loadSequence = async () => {
      await loadImage(1);
      
      const batchPromises = [loadImage(total)];
      for (let i = 2; i <= Math.min(20, total); i++) {
        batchPromises.push(loadImage(i));
      }
      await Promise.all(batchPromises);

      for (let i = 21; i < total; i++) {
        if (!active) break;
        await loadImage(i);
      }
    };

    loadSequence();

    return () => {
      active = false;
    };
  }, [scheduleRender, updateDebugUI]);

  useEffect(() => {
    if (!isReady) return;
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, isReady]);

  // GSAP ScrollTrigger Setup
  useEffect(() => {
    if (!isReady) return;

    if (isReducedMotion) {
      requestedFrameRef.current = FRAME_CONFIG.totalFrames;
      scheduleRender();
      return;
    }

    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=300%',
        scrub: 0.2,
        pin: true,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
          const frame = Math.round(self.progress * (FRAME_CONFIG.totalFrames - 1)) + 1;
          const safeFrame = Math.max(1, Math.min(frame, FRAME_CONFIG.totalFrames));
          
          if (requestedFrameRef.current !== safeFrame) {
            requestedFrameRef.current = safeFrame;
            scheduleRender();
          } else if (isDebug) {
             updateDebugUI();
          }
        },
      },
    });

    tl.fromTo(identityRef.current, 
      { opacity: 0, y: 20, filter: 'blur(10px)' }, 
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.12 },
      0.1
    );

    if (statementRef.current) {
      const words = statementRef.current.querySelectorAll('.word');
      tl.fromTo(words,
        { opacity: 0, y: 15, filter: 'blur(5px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.02, duration: 0.15 },
        0.22
      );
    }

    tl.to(identityRef.current, { opacity: 0, y: -20, filter: 'blur(10px)', duration: 0.1 }, 0.42);
    if (statementRef.current) {
      const words = statementRef.current.querySelectorAll('.word');
      tl.to(words, { opacity: 0, y: -15, filter: 'blur(5px)', stagger: 0.01, duration: 0.1 }, 0.42);
    }

    if (labelsRef.current) {
      const labels = labelsRef.current.querySelectorAll('.label-item');
      tl.fromTo(labels,
        { opacity: 0, x: 20 },
        { opacity: 0.8, x: 0, stagger: 0.05, duration: 0.15 },
        0.62
      );
      tl.to(labels, { opacity: 0, x: 10, stagger: 0.02, duration: 0.1 }, 0.82);
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isReducedMotion, scheduleRender, isDebug, updateDebugUI, isReady]);

  if (!isReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white font-mono text-xs tracking-widest uppercase">
        NOVA-1<br />INITIALIZING VISUAL SYSTEM
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden select-none">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center px-6 md:px-24">
        <div ref={identityRef} className="opacity-0">
          <h2 className="text-sm md:text-base font-mono tracking-[0.3em] text-white/70 mb-4">SYSTEM / NOVA-01</h2>
          <h1 className="text-5xl md:text-8xl font-sans font-light tracking-tight text-white mb-8">NOVA-1</h1>
        </div>

        <div ref={statementRef} className="max-w-2xl text-2xl md:text-5xl font-sans font-medium leading-tight text-white/90">
          {'BUILT TO GO WHERE ROADS END.'.split(' ').map((word, i) => (
            <span key={i} className="word inline-block opacity-0 mr-3 mb-2">{word}</span>
          ))}
        </div>
      </div>

      <div ref={labelsRef} className="absolute bottom-12 right-6 md:right-24 pointer-events-none z-10 flex flex-col items-end space-y-3 font-mono text-xs tracking-widest text-white/60">
        <div className="label-item opacity-0 flex items-center gap-3">
          <span className="w-8 h-px bg-white/30"></span>
          AUTONOMOUS ELECTRIC EXPLORER
        </div>
        <div className="label-item opacity-0 flex items-center gap-3">
          <span className="w-8 h-px bg-white/30"></span>
          TERRAIN INTELLIGENCE
        </div>
        <div className="label-item opacity-0 flex items-center gap-3">
          <span className="w-8 h-px bg-white/30"></span>
          PERCEPTION CORE ONLINE
        </div>
      </div>

      {isDebug && (
        <div className="absolute top-4 right-4 z-50 bg-black/80 border border-white/20 p-4 font-mono text-xs text-white/80 space-y-1">
          <div>TOTAL FRAMES: {FRAME_CONFIG.totalFrames}</div>
          <div ref={debugRequestedRef}>REQUESTED: 1</div>
          <div ref={debugRenderedRef}>RENDERED: 1</div>
          <div ref={debugScrollRef}>SCROLL: 0.0%</div>
          <div ref={debugLoadedRef}>LOADED: 1</div>
          <div ref={debugFailedRef}>FAILED: 0</div>
          <div ref={debugCanvasRef}>CANVAS: 0x0</div>
          <div>VIEWPORT: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''}</div>
          <div>SOURCE FPS: 1280x720 (Reported inherent softness on high-res displays)</div>
        </div>
      )}
    </div>
  );
}
