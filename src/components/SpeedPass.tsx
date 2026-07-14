'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SpeedPass() {
  const containerRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const soundControlRef = useRef<HTMLButtonElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dark runway architectural approach since no asset is provided
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=200%',
        scrub: 0.5,
        pin: true,
      }
    });

    // Animate the text and the streak representing the car
    tl.fromTo(textRef.current, 
      { opacity: 0, scale: 0.9, filter: 'blur(10px)' }, 
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }
    )
    .fromTo(streakRef.current,
      { x: '-100vw', opacity: 0, scaleX: 0 },
      { x: '100vw', opacity: 1, scaleX: 1, duration: 2, ease: 'power4.inOut' },
      0.5 // overlap slightly with text reveal
    )
    .to(textRef.current,
      { opacity: 0, filter: 'blur(5px)', duration: 0.5 },
      2.5
    );

    return () => {
      tl.kill();
    };
  }, []);

  const toggleSound = () => {
    setSoundOn(!soundOn);
    // Placeholder for actual sound architecture activation
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Subtle floor / runway grid or reflection could go here */}
      <div className="absolute bottom-0 w-full h-[30vh] bg-gradient-to-t from-zinc-900/50 to-transparent border-t border-white/5 opacity-50" />
      
      {/* Text choreography */}
      <div ref={textRef} className="relative z-10 text-center flex flex-col items-center">
        <h2 className="text-4xl md:text-7xl font-sans font-medium tracking-tight text-white mb-2 uppercase">
          Engineered for
        </h2>
        <h2 className="text-4xl md:text-7xl font-sans font-medium tracking-tight text-blue-500 uppercase">
          What lies beyond.
        </h2>
      </div>

      {/* The vehicle abstraction (cobalt streak) */}
      <div 
        ref={streakRef}
        className="absolute top-1/2 left-0 w-[40vw] h-[2px] bg-blue-500 -translate-y-1/2 z-20 pointer-events-none"
        style={{
          boxShadow: '0 0 40px 10px rgba(59, 130, 246, 0.8), 0 0 100px 20px rgba(255, 255, 255, 0.4)',
          transformOrigin: 'left center',
        }}
      />

      {/* Sound Control Architecture */}
      <div className="absolute bottom-12 right-12 z-30">
        <button 
          ref={soundControlRef}
          onClick={toggleSound}
          className="text-xs font-mono text-white/50 hover:text-white transition-colors uppercase tracking-widest"
          aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
        >
          Sound {soundOn ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
