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
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch (e) {
    // ignore
  }
  const isDebug = searchParams?.get('sequenceDebug') === '1';

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const debugRequestedRef = useRef<HTMLDivElement>(null);
  const debugRenderedRef = useRef<HTMLDivElement>(null);
  const debugScrollRef = useRef<HTMLDivElement>(null);
  const debugLoadedRef = useRef<HTMLDivElement>(null);
  const debugFailedRef = useRef<HTMLDivElement>(null);
  const debugCanvasRef = useRef<HTMLDivElement>(null);

  const scrollProgressRef = useRef(0);
  const requestedFrameRef = useRef(1);
  const renderedFrameRef = useRef(1);
  const loadedCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  
  const imagesRef = useRef<Record<number, HTMLImageElement | null>>({});
  const activeLoadsRef = useRef(0);
  const loadingFramesRef = useRef<Set<number>>(new Set());
  const frameQueueRef = useRef<number[]>([]);
  const lastRequestedFrameRef = useRef(1);
  const directionRef = useRef<1 | -1>(1);

  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const phase3Ref = useRef<HTMLDivElement>(null);
  const phase4Ref = useRef<HTMLDivElement>(null);
  const phase5Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
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

    // Never clear before a valid frame exists
    if (!targetImg) return;

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

  const processQueue = useCallback(() => {
    const MAX_CONCURRENCY = 4;
    while (activeLoadsRef.current < MAX_CONCURRENCY && frameQueueRef.current.length > 0) {
      const frame = frameQueueRef.current.shift();
      if (frame === undefined) break;
      
      activeLoadsRef.current++;
      loadingFramesRef.current.add(frame);
      
      const img = new Image();
      img.src = getFramePath(frame);
      
      img.onload = () => {
        activeLoadsRef.current--;
        loadingFramesRef.current.delete(frame);
        
        // Ensure we only keep it if it is still within the sliding window
        if (Math.abs(frame - requestedFrameRef.current) <= 15) {
          imagesRef.current[frame] = img;
          loadedCountRef.current++;
          
          if (frame === 1) setIsReady(true);
          
          if (frame === requestedFrameRef.current) {
            scheduleRender();
          } else {
            updateDebugUI();
          }
        } else {
          img.src = ''; // Cancel/discard immediately if outside window
        }
        processQueue();
      };
      
      img.onerror = () => {
        activeLoadsRef.current--;
        loadingFramesRef.current.delete(frame);
        failedCountRef.current++;
        processQueue();
      };
    }
  }, [scheduleRender, updateDebugUI]);

  const enqueueFrames = useCallback(() => {
    const current = requestedFrameRef.current;
    const dir = current >= lastRequestedFrameRef.current ? 1 : -1;
    directionRef.current = dir as 1 | -1;
    lastRequestedFrameRef.current = current;

    const WINDOW_SIZE = 15;
    const desiredFrames = new Set<number>();
    desiredFrames.add(current);
    
    // Direction-aware prefetching
    for (let i = 1; i <= WINDOW_SIZE; i++) {
      const forward = current + (i * directionRef.current);
      const backward = current - (i * directionRef.current);
      if (forward >= 1 && forward <= FRAME_CONFIG.totalFrames) desiredFrames.add(forward);
      if (backward >= 1 && backward <= FRAME_CONFIG.totalFrames) desiredFrames.add(backward);
    }

    // Evict frames outside the desired window to prevent OOM
    Object.keys(imagesRef.current).forEach(key => {
      const frameIdx = parseInt(key, 10);
      if (!desiredFrames.has(frameIdx) && imagesRef.current[frameIdx]) {
        const img = imagesRef.current[frameIdx];
        if (img) {
          img.src = ''; // Remove application reference to allow browser GC
        }
        imagesRef.current[frameIdx] = null;
        delete imagesRef.current[frameIdx];
      }
    });
    
    // Enqueue missing frames within window
    const queue = Array.from(desiredFrames).filter(f => !imagesRef.current[f] && !loadingFramesRef.current.has(f));
    
    queue.sort((a, b) => {
      if (a === current) return -1;
      if (b === current) return 1;
      const distA = Math.abs(a - current);
      const distB = Math.abs(b - current);
      const dirA = Math.sign(a - current) === directionRef.current ? 0 : 1; 
      const dirB = Math.sign(b - current) === directionRef.current ? 0 : 1;
      return (distA + dirA * 10) - (distB + dirB * 10);
    });
    
    frameQueueRef.current = queue;
    processQueue();
  }, [processQueue]);

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    
    // Cap DPR at 1.25 for 720p source frames
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    scheduleRender();
  }, [scheduleRender]);

  // Initial load and fail-safe timeout
  useEffect(() => {
    let active = true;
    enqueueFrames();

    const timeoutId = setTimeout(() => {
      if (active && !isReady) {
        setLoadFailed(true);
      }
    }, 10000); // 10s fallback

    return () => {
      active = false;
      clearTimeout(timeoutId);
      
      // Cleanup all resources on unmount
      Object.values(imagesRef.current).forEach(img => {
        if (img) img.src = '';
      });
      imagesRef.current = {};
      frameQueueRef.current = [];
      loadingFramesRef.current.clear();
      activeLoadsRef.current = 0;
    };
  }, [enqueueFrames, isReady]);

  useEffect(() => {
    if (!isReady) return;
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, isReady]);

  useEffect(() => {
    if (!isReady || loadFailed) return;

    if (isReducedMotion) {
      requestedFrameRef.current = FRAME_CONFIG.totalFrames;
      enqueueFrames();
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
            enqueueFrames(); // Dynamically update queue on scroll
            scheduleRender();
          } else if (isDebug) {
             updateDebugUI();
          }
        },
      },
    });

    if (phase1Ref.current) {
      const masks = phase1Ref.current.querySelectorAll('.mask-reveal');
      tl.fromTo(masks,
        { clipPath: 'inset(100% 0 0 0)', y: 10, opacity: 0 },
        { clipPath: 'inset(0% 0 0 0)', y: 0, opacity: 1, stagger: 0.1, duration: 0.8 },
        0.05
      ).to(masks, { clipPath: 'inset(0 0 100% 0)', y: -10, opacity: 0, stagger: 0.1, duration: 0.6 }, 1.5);
    }

    if (phase2Ref.current) {
      const words = phase2Ref.current.querySelectorAll('.word-bubble');
      tl.fromTo(words,
        { opacity: 0, y: 12, scale: 0.9, filter: 'blur(4px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', stagger: 0.15, duration: 1.2, ease: 'power2.out' },
        2.5
      ).to(words, { opacity: 0, y: -10, filter: 'blur(4px)', stagger: 0.1, duration: 0.8 }, 4.5);
    }

    if (phase3Ref.current) {
      const elastics = phase3Ref.current.querySelectorAll('.elastic-stretch');
      tl.fromTo(elastics,
        { opacity: 0, scaleX: 1.08, filter: 'blur(2px)' },
        { opacity: 1, scaleX: 1, filter: 'blur(0px)', stagger: 0.2, duration: 1.5, ease: 'back.out(1.2)' },
        5.5
      ).to(elastics, { opacity: 0, scaleX: 0.95, duration: 0.8 }, 7.5);
    }

    if (phase4Ref.current) {
      const masks = phase4Ref.current.querySelectorAll('.mask-horizontal');
      tl.fromTo(masks,
        { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, stagger: 0.2, duration: 1.2, ease: 'power2.inOut' },
        8.5
      ).to(masks, { opacity: 0, duration: 0.8 }, 10.5);
    }

    if (phase5Ref.current) {
      const beyond = phase5Ref.current.querySelector('.beyond');
      const theMap = phase5Ref.current.querySelector('.the-map');
      
      tl.fromTo([beyond, theMap],
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 1.2, ease: 'power2.out' },
        11.5
      );

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
  }, [isReducedMotion, enqueueFrames, scheduleRender, isDebug, updateDebugUI, isReady, loadFailed]);

  // Fallback UI
  if (loadFailed) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center text-white select-none">
         <img src={getFramePath(1)} alt="NOVA-1" className="absolute top-0 left-0 w-full h-full object-cover opacity-80" />
         <div className="z-10 text-center font-sans">
            <h1 className="text-5xl md:text-8xl font-light tracking-tight mb-4">NOVA-1</h1>
            <p className="text-xl md:text-2xl font-light tracking-wide text-white/70">SILENCE, ENGINEERED.</p>
         </div>
      </div>
    );
  }

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

      <div ref={phase1Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center px-6 md:px-24">
        <div className="mask-reveal">
          <h2 className="text-sm md:text-base font-mono tracking-[0.3em] text-white/70 mb-4">AUTONOMOUS ELECTRIC EXPLORER / 01</h2>
        </div>
        <div className="mask-reveal">
          <h1 className="text-5xl md:text-8xl font-sans font-light tracking-tight text-white mb-8">NOVA-1</h1>
        </div>
      </div>

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

      <div ref={phase3Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-center px-6 md:px-24">
        <div className="max-w-4xl text-4xl md:text-7xl font-sans font-medium tracking-tight leading-[1.1] text-white">
          <div className="elastic-stretch inline-block opacity-0 origin-left mb-2">BUILT TO GO</div>
          <br />
          <div className="elastic-stretch inline-block opacity-0 origin-left text-white/90">WHERE ROADS END.</div>
        </div>
      </div>

      <div ref={phase4Ref} className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end pb-32 px-6 md:px-24 items-end text-right">
        <div className="text-2xl md:text-5xl font-sans font-light tracking-wide text-white">
          <div className="mask-horizontal inline-block opacity-0">SILENCE,</div>
          <br />
          <div className="mask-horizontal inline-block opacity-0 text-white/70">ENGINEERED.</div>
        </div>
      </div>

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
