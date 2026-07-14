'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function FinalIdentity() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current || !reflectionRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'top top',
        scrub: 1,
      }
    });

    tl.fromTo(reflectionRef.current,
      { opacity: 0, scaleY: 0 },
      { opacity: 1, scaleY: 1, duration: 1, ease: 'power2.inOut' }
    )
    .fromTo(contentRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
      0.5
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <footer ref={containerRef} className="relative w-full h-[60vh] bg-black flex flex-col items-center justify-center overflow-hidden">
      
      {/* Minimal cobalt reflection */}
      <div 
        ref={reflectionRef}
        className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none opacity-0 origin-bottom"
      />

      <div ref={contentRef} className="text-center z-10 opacity-0 px-6">
        <h1 className="text-6xl md:text-9xl font-sans font-light tracking-tighter text-white mb-6">
          NOVA-1
        </h1>
        
        <p className="text-sm md:text-base font-mono tracking-[0.4em] text-white/50 uppercase mb-4">
          Autonomous Electric Explorer
        </p>
        
        <p className="text-lg md:text-2xl font-sans font-medium tracking-widest text-blue-500 uppercase">
          Beyond the Map.
        </p>
      </div>

      {/* Very minimal footer links if genuinely needed, here just copyright to keep it clean */}
      <div className="absolute bottom-8 text-xs font-mono text-white/30 tracking-widest uppercase">
        © {new Date().getFullYear()} NOVA SYSTEM
      </div>
    </footer>
  );
}
