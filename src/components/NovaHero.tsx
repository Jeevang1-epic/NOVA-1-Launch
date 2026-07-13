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
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const phase3Ref = useRef<HTMLDivElement>(null);
  const phase4Ref = useRef<HTMLDivElement>(null);
  const phase5Ref = useRef<HTMLDivElement>(null);

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

    const physicalWidth = canvas.width;
    const physicalHeight = canvas.height;
    
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

    ctx.imageSmoothingEnabled = true;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx.imageSmoothingQuality = 'high';

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
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    scheduleRender();
  }, [scheduleRender]);

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
        end: '+=500%',
        scrub: 0.1,
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

    // ---------------------------------------------------------
    // Phase 1: NOVA-1 (Early Darkness) - Masked Reveal
    // ---------------------------------------------------------
    if (phase1Ref.current) {
      const masks = phase1Ref.current.querySelectorAll('.mask-reveal');
      tl.fromTo(masks,
        { clipPath: 'inset(100% 0 0 0)', y: 10, opacity: 0 },
        { clipPath: 'inset(0% 0 0 0)', y: 0, opacity: 1, stagger: 0.1, duration: 0.8 },
        0.05
      ).to(masks, { clipPath: 'inset(0 0 100% 0)', y: -10, opacity: 0, stagger: 0.1, duration: 0.6 }, 1.5);
    }

    // ---------------------------------------------------------
    // Phase 2: FROM DARKNESS (Word-by-word bubbling)
    // ---------------------------------------------------------
    if (phase2Ref.current) {
      const words = phase2Ref.current.querySelectorAll('.word-bubble');
      tl.fromTo(words,
        { opacity: 0, y: 12, scale: 0.9, filter: 'blur(4px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', stagger: 0.15, duration: 1.2, ease: 'power2.out' },
        2.5
      ).to(words, { opacity: 0, y: -10, filter: 'blur(4px)', stagger: 0.1, duration: 0.8 }, 4.5);
    }

    // ---------------------------------------------------------
    // Phase 3: BUILT TO GO (Elastic stretch)
    // ---------------------------------------------------------
    if (phase3Ref.current) {
      const elastics = phase3Ref.current.querySelectorAll('.elastic-stretch');
      tl.fromTo(elastics,
        { opacity: 0, scaleX: 1.08, filter: 'blur(2px)' },
        { opacity: 1, scaleX: 1, filter: 'blur(0px)', stagger: 0.2, duration: 1.5, ease: 'back.out(1.2)' },
        5.5
      ).to(elastics, { opacity: 0, scaleX: 0.95, duration: 0.8 }, 7.5);
    }

    // ---------------------------------------------------------
    // Phase 4: SILENCE (Clean masked reveal with negative space)
    // ---------------------------------------------------------
    if (phase4Ref.current) {
      const masks = phase4Ref.current.querySelectorAll('.mask-horizontal');
      tl.fromTo(masks,
        { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, stagger: 0.2, duration: 1.2, ease: 'power2.inOut' },
        8.5
      ).to(masks, { opacity: 0, duration: 0.8 }, 10.5);
    }

    // ---------------------------------------------------------
    // Phase 5: BEYOND THE MAP (Off-white to Cobalt Blue)
    // ---------------------------------------------------------
    if (phase5Ref.current) {
      const beyond = phase5Ref.current.querySelector('.beyond');
      const theMap = phase5Ref.current.querySelector('.the-map');
      
      // Enter
      tl.fromTo([beyond, theMap],
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 1.2, ease: 'power2.out' },
        11.5
      );

      // Color transition synced with vehicle illumination (near end of timeline)
      // Cobalt blue sampled from premium automotive lighting: #1e3a8a (deep) / #3b82f6 (bright)
      tl.to(theMap,
        { color: '#3b82f6', textShadow: '0 0 20px rgba(59, 130, 246, 0.4)', duration: 1.5, ease: 'power2.inOut' },
        12.5
      );
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

      {/* PHASE 1 */}
      <div ref={phase1Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center px-6 md:px-24">
        <div className="mask-reveal">
          <h2 className="text-sm md:text-base font-mono tracking-[0.3em] text-white/70 mb-4">AUTONOMOUS ELECTRIC EXPLORER / 01</h2>
        </div>
        <div className="mask-reveal">
          <h1 className="text-5xl md:text-8xl font-sans font-light tracking-tight text-white mb-8">NOVA-1</h1>
        </div>
      </div>

      {/* PHASE 2 */}
      <div ref={phase2Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center px-6 md:px-24">
        <div className="max-w-3xl text-3xl md:text-6xl font-sans font-light leading-tight text-white">
          {'FROM DARKNESS,'.split(' ').map((word, i) => (
            <span key={`p2-1-${i}`} className="word-bubble inline-block mr-4 mb-2 opacity-0">{word}</span>
          ))}
          <br />
          {'A NEW INTELLIGENCE ARRIVES.'.split(' ').map((word, i) => (
            <span key={`p2-2-${i}`} className="word-bubble inline-block mr-4 mb-2 opacity-0 text-white/80">{word}</span>
          ))}
        </div>
      </div>

      {/* PHASE 3 */}
      <div ref={phase3Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center px-6 md:px-24">
        <div className="max-w-4xl text-4xl md:text-7xl font-sans font-medium tracking-tight leading-[1.1] text-white">
          <div className="elastic-stretch inline-block opacity-0 origin-left mb-2">BUILT TO GO</div>
          <br />
          <div className="elastic-stretch inline-block opacity-0 origin-left text-white/90">WHERE ROADS END.</div>
        </div>
      </div>

      {/* PHASE 4 */}
      <div ref={phase4Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end pb-32 px-6 md:px-24 items-end text-right">
        <div className="text-2xl md:text-5xl font-sans font-light tracking-wide text-white">
          <div className="mask-horizontal inline-block opacity-0">SILENCE,</div>
          <br />
          <div className="mask-horizontal inline-block opacity-0 text-white/70">ENGINEERED.</div>
        </div>
      </div>

      {/* PHASE 5 */}
      <div ref={phase5Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center items-center text-center">
        <div className="text-5xl md:text-8xl font-sans font-bold tracking-tighter uppercase text-white/90 drop-shadow-lg">
          <span className="beyond inline-block opacity-0">BEYOND</span>
          <br />
          <span className="the-map inline-block opacity-0 transition-colors duration-1000">THE MAP.</span>
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
          <div>SOURCE FPS: 18 (288 Frames @ 1280x720)</div>
        </div>
      )}
    </div>
  );
}
