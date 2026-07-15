'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SpeedPass() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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

    // Animate the text reveal
    tl.fromTo(textRef.current, 
      { opacity: 0, scale: 0.9, filter: 'blur(10px)' }, 
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }
    )
    .to(textRef.current,
      { opacity: 0, filter: 'blur(5px)', duration: 0.5 },
      '+=1'
    );

    return () => {
      tl.kill();
    };
  }, []);


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

      {/* Dedicated Speed Pass Asset will be injected here once available */}
      {/* Specification: 16:9, left-to-right, dark background, 4-6 seconds */}
    </div>
  );
}
