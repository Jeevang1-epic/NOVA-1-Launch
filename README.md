# NOVA-1 Cinematic Scroll Experience

An interactive cinematic scroll experience engineered for the NOVA-1 autonomous electric explorer. Built to showcase a deterministic canvas renderer integrated with high-performance typography choreography and 2.5D visual sequences.

## Architecture

- **Framework**: Next.js App Router (React 19)
- **Animation Engine**: GSAP (ScrollTrigger)
- **Renderer**: Deterministic Canvas Frame Engine
- **Styling**: Tailwind CSS v4

## Production Readiness

This application is configured for direct Vercel deployment with:
- DPR-aware canvas rendering
- Optimized frame preloading logic
- Immutable caching strategy for sequence assets
- Reduced-motion accessibility fallbacks
- Responsive dimensional recalculation

## Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Asset Requirements

The cinematic sequence expects 288 encoded frames (1280x720) served from `public/sequences/nova-hero-v2/` sequentially numbered from `001.jpg` to `288.jpg`.
