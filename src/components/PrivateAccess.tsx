'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function PrivateAccess() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%', // Start fading in when it enters the viewport
        end: 'top 20%',
        scrub: 1,
      }
    });

    tl.fromTo(contentRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    );

    return () => {
      tl.kill();
    };
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mailto fallback
    const subject = encodeURIComponent('NOVA-1 Private Preview Request');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.location.href = `mailto:hello@nova-1.com?subject=${subject}&body=${body}`;
    setIsModalOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-black flex items-center justify-center py-24">
      <div ref={contentRef} className="text-center px-6 max-w-4xl opacity-0">
        <h2 className="text-2xl md:text-4xl font-mono text-white/50 tracking-[0.3em] mb-8">NOVA-1</h2>
        
        <div className="text-5xl md:text-8xl font-sans font-bold tracking-tighter uppercase text-white mb-6">
          <div className="mb-2">BEYOND THE MAP.</div>
          <div className="text-blue-500">CLOSER THAN YOU THINK.</div>
        </div>
        
        <p className="text-lg md:text-2xl font-sans font-light text-white/70 mb-16">
          A cinematic concept of the autonomous electric explorer.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative px-8 py-4 bg-white text-black font-sans font-medium tracking-widest uppercase overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-500">Request Private Preview</span>
          </button>
          
          <button 
            className="px-8 py-4 border border-white/20 text-white font-sans font-medium tracking-widest uppercase hover:bg-white/10 transition-colors duration-300"
          >
            Discover NOVA-1
          </button>
        </div>
      </div>

      {/* Contact Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div 
            className="w-full max-w-lg bg-zinc-950 border border-white/10 p-8 md:p-12 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <h3 id="modal-title" className="text-2xl font-sans font-medium text-white mb-8 tracking-wide uppercase">Private Access</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2 text-white font-sans focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2 text-white font-sans focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">Message</label>
                <textarea 
                  id="message" 
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2 text-white font-sans focus:outline-none focus:border-blue-500 transition-colors resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full py-4 bg-white text-black font-sans font-medium tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-colors duration-300 mt-4"
              >
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
