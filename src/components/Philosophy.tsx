'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text1Ref.current || !text2Ref.current) return;

    const words1 = text1Ref.current.querySelectorAll('.phil-word-1');
    const words2 = text2Ref.current.querySelectorAll('.phil-word-2');
    const roadEndsWords = text2Ref.current.querySelectorAll('.road-ends');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=250%',
        scrub: 0.5,
        pin: true,
      }
    });

    // Reveal first sentence word by word
    tl.fromTo(words1,
      { opacity: 0, y: 20, rotateX: 20 },
      { opacity: 1, y: 0, rotateX: 0, stagger: 0.1, duration: 1, ease: 'power2.out' }
    )
    .to(words1, { opacity: 0, y: -20, duration: 1, stagger: 0.05 }, '+=0.5')
    
    // Reveal second sentence word by word
    .fromTo(words2,
      { opacity: 0, y: 20, rotateX: 20 },
      { opacity: 1, y: 0, rotateX: 0, stagger: 0.1, duration: 1, ease: 'power2.out' }
    )
    
    // Gradually inherit cobalt blue for "ROAD ENDS"
    .to(roadEndsWords, {
      color: '#3b82f6',
      textShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
      duration: 1,
      ease: 'power2.inOut'
    }, '+=0.2');

    return () => {
      tl.kill();
    };
  }, []);

  const line1 = 'WE DIDN\'T BUILD ANOTHER ELECTRIC CAR.'.split(' ');
  const line2Part1 = 'WE BUILT FOR WHERE THE '.split(' ');
  const line2Part2 = 'ROAD ENDS.'.split(' ');

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <div className="max-w-5xl px-6 md:px-24 text-center perspective-1000">
        
        {/* First Line */}
        <div ref={text1Ref} className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-sans font-light tracking-tight text-white/90">
            {line1.map((word, i) => (
              <span key={`l1-${i}`} className="phil-word-1 inline-block mr-3 md:mr-4 opacity-0">
                {word}
              </span>
            ))}
          </h2>
        </div>

        {/* Second Line */}
        <div ref={text2Ref} className="absolute inset-0 flex flex-wrap items-center justify-center px-6 pointer-events-none content-center">
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-sans font-light tracking-tight text-white/90 leading-tight">
            {line2Part1.map((word, i) => (
              <span key={`l2-p1-${i}`} className="phil-word-2 inline-block mr-3 md:mr-4 opacity-0">
                {word}
              </span>
            ))}
            {line2Part2.map((word, i) => (
              <span key={`l2-p2-${i}`} className="phil-word-2 road-ends inline-block mr-3 md:mr-4 opacity-0 transition-colors">
                {word}
              </span>
            ))}
          </h2>
        </div>

      </div>
    </div>
  );
}
