'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PRINCIPLES = [
  {
    label: 'NOVA SYSTEM / 01',
    title: 'AUTONOMY',
    subtitle: 'SEES BEFORE YOU DO.',
    desc: 'A concept built around awareness, perception, and intelligent navigation.'
  },
  {
    label: 'PERCEPTION / ACTIVE',
    title: 'ELECTRIC SILENCE',
    subtitle: 'POWER WITHOUT THE NOISE.',
    desc: 'Quiet movement. Immediate response. Controlled presence.'
  },
  {
    label: 'ELECTRIC ARCHITECTURE / CONCEPT',
    title: 'EXPLORATION',
    subtitle: 'BEYOND THE EDGE OF THE MAP.',
    desc: 'Created as a vision for unfamiliar roads, remote landscapes, and what comes next.'
  }
];

export default function Principles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${PRINCIPLES.length * 100}%`,
        scrub: 0.5,
        pin: true,
      }
    });

    sectionsRef.current.forEach((section, index) => {
      if (!section) return;

      const content = section.querySelector('.principle-content');
      const bgLine = section.querySelector('.bg-line');

      // Entry animation for this principle
      tl.fromTo(content,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
        index * 2
      );

      tl.fromTo(bgLine,
        { scaleY: 0 },
        { scaleY: 1, duration: 1, ease: 'power2.inOut' },
        index * 2
      );

      // Exit animation (except for the last one which stays until the section unpins)
      if (index < PRINCIPLES.length - 1) {
        tl.to(content,
          { opacity: 0, y: -50, duration: 1, ease: 'power2.in' },
          index * 2 + 1.5
        );
        tl.to(bgLine,
          { opacity: 0, duration: 0.5 },
          index * 2 + 1.5
        );
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">
      {PRINCIPLES.map((principle, idx) => (
        <div
          key={idx}
          ref={(el) => {
            sectionsRef.current[idx] = el;
          }}
          className="absolute inset-0 flex items-center justify-center px-6 md:px-24 pointer-events-none"
        >
          {/* Subtle shifting line work */}
          <div 
            className="bg-line absolute left-6 md:left-24 top-1/4 bottom-1/4 w-[1px] bg-blue-500/30 origin-top"
          />

          <div className="principle-content max-w-4xl w-full text-left ml-6 md:ml-12 opacity-0">
            <p className="text-xs md:text-sm font-mono text-blue-500 mb-6 tracking-[0.2em]">
              {principle.label}
            </p>
            
            <h2 className="text-5xl md:text-8xl lg:text-9xl font-sans font-bold tracking-tighter text-white mb-4 uppercase">
              {principle.title}
            </h2>
            
            <h3 className="text-2xl md:text-4xl font-sans font-light text-white/80 mb-8 uppercase tracking-wide">
              {principle.subtitle}
            </h3>
            
            <p className="text-base md:text-xl font-sans font-light text-white/60 max-w-xl">
              {principle.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
