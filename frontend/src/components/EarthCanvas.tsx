'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUpRightIcon } from './Icons';

const TOTAL_FRAMES = 300;
const IDLE_ROTATION_FPS = 7.5; // Smooth cinematic orbital speed (40s per 360-deg revolution)

function formatFrameNumber(index: number): string {
  return String(index).padStart(3, '0');
}

export default function EarthCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Frame Asset Cache
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES + 1).fill(null));
  const loadedSetRef = useRef<Set<number>>(new Set());
  const lastDrawnFrameRef = useRef<number>(1);

  // Animation State Refs (Elapsed-time driven, zero React per-frame rerenders)
  const lastTimeRef = useRef<number>(0);
  const idleFrameAccumulatorRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const smoothedScrollFrameRef = useRef<number>(1);
  const smoothedCameraEaseRef = useRef<number>(0);
  const lastDrawnCameraEaseRef = useRef<number>(0);

  // UI state for scene cross-fades
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Handler to smoothly advance from opening hero into the rotational narrative
  const handleExploreGlobe = useCallback(() => {
    if (containerRef.current) {
      const scrollTarget = containerRef.current.offsetTop + window.innerHeight * 1.1;
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  }, []);

  // Prefers-reduced-motion listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Preload Frame 1 with high priority, then milestone intervals, then complete set
  useEffect(() => {
    let isCancelled = false;

    const loadFrame = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        if (imagesRef.current[index]?.complete && imagesRef.current[index]?.naturalWidth) {
          resolve(imagesRef.current[index]!);
          return;
        }

        const img = new Image();
        img.src = `/earth-rotation/frame-${formatFrameNumber(index)}.jpg`;
        if (index === 1) img.fetchPriority = 'high';

        img.onload = () => {
          if (!isCancelled) {
            imagesRef.current[index] = img;
            loadedSetRef.current.add(index);
            if (index === 1) setInitialLoaded(true);
            resolve(img);
          }
        };

        img.onerror = () => {
          const fallback = new Image();
          fallback.src = `/earth-rotation/ezgif-frame-${formatFrameNumber(index)}.jpg`;
          fallback.onload = () => {
            if (!isCancelled) {
              imagesRef.current[index] = fallback;
              loadedSetRef.current.add(index);
              if (index === 1) setInitialLoaded(true);
              resolve(fallback);
            }
          };
          fallback.onerror = () => reject(new Error(`Failed to load frame ${index}`));
        };
      });
    };

    loadFrame(1).then(() => {
      const milestoneFrames: number[] = [];
      for (let i = 10; i <= TOTAL_FRAMES; i += 10) milestoneFrames.push(i);

      const preloadMilestones = async () => {
        const chunkSize = 8;
        for (let i = 0; i < milestoneFrames.length; i += chunkSize) {
          if (isCancelled) return;
          const chunk = milestoneFrames.slice(i, i + chunkSize);
          await Promise.allSettled(chunk.map((f) => loadFrame(f)));
        }

        const remaining: number[] = [];
        for (let i = 2; i <= TOTAL_FRAMES; i++) {
          if (!loadedSetRef.current.has(i)) remaining.push(i);
        }

        for (let i = 0; i < remaining.length; i += chunkSize) {
          if (isCancelled) return;
          const batch = remaining.slice(i, i + chunkSize);
          await Promise.allSettled(batch.map((f) => loadFrame(f)));
        }
      };

      preloadMilestones();
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Draw specific frame index to canvas with camera zoom and centering
  const drawFrame = useCallback((
    frameNumber: number,
    cameraZoomMultiplier: number = 1,
    cameraCenterProgress: number = 0
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetImg = imagesRef.current[frameNumber];
    if (!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) {
      let fallback: HTMLImageElement | null = null;
      for (let delta = 1; delta < 30; delta++) {
        const lower = frameNumber - delta;
        const upper = frameNumber + delta;
        if (lower >= 1 && imagesRef.current[lower]?.complete && imagesRef.current[lower]?.naturalWidth) {
          fallback = imagesRef.current[lower]!;
          break;
        }
        if (upper <= TOTAL_FRAMES && imagesRef.current[upper]?.complete && imagesRef.current[upper]?.naturalWidth) {
          fallback = imagesRef.current[upper]!;
          break;
        }
      }
      targetImg = fallback || imagesRef.current[lastDrawnFrameRef.current] || imagesRef.current[1];
    }

    if (!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) return;

    lastDrawnFrameRef.current = frameNumber;
    lastDrawnCameraEaseRef.current = cameraCenterProgress;

    const width = canvas.width;
    const height = canvas.height;
    const imgWidth = targetImg.naturalWidth;
    const imgHeight = targetImg.naturalHeight;

    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, width, height);

    // Cover scale calculation ensuring full viewport coverage
    const baseScale = Math.max(width / imgWidth, height / imgHeight);
    const isDesktop = window.innerWidth >= 1024;
    
    // Base zoom: 1.22 on desktop, 1.05 on mobile
    // Geographic zoom into India adds up to +38% scale on desktop, +28% on mobile
    const baseZoom = isDesktop ? 1.22 : 1.05;
    const finalZoom = baseZoom * cameraZoomMultiplier;
    const scale = baseScale * finalZoom;
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const maxShiftX = (drawWidth - width) / 2;
    // During Beats 1-3, Earth is shifted to the right. As cameraCenterProgress goes from 0 to 1,
    // the camera centers horizontally on India.
    const baseDesiredShiftX = isDesktop ? maxShiftX * 0.78 : 0;
    const desiredShiftX = baseDesiredShiftX * (1 - cameraCenterProgress);

    // Strict clamping: drawX is NEVER > 0 (prevents left black void),
    // and drawX + drawWidth is NEVER < width (prevents right gap).
    const drawX = Math.min(0, Math.max(width - drawWidth, (width - drawWidth) / 2 + desiredShiftX));
    const drawY = Math.min(0, Math.max(height - drawHeight, (height - drawHeight) / 2));

    ctx.drawImage(targetImg, drawX, drawY, drawWidth, drawHeight);
  }, []);

  // Canvas Resize Listener: Adjusts dimensions and devicePixelRatio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = Math.round(displayWidth * dpr);
        canvas.height = Math.round(displayHeight * dpr);
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        drawFrame(lastDrawnFrameRef.current);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  // Scroll Progress Listener: Updates scroll ref immediately and throttles state update
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollableDistance = container.offsetHeight - window.innerHeight;
      if (scrollableDistance <= 0) return;

      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);

      const progress = Math.min(Math.max(-rect.top / scrollableDistance, 0), 1);
      scrollProgressRef.current = progress;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Stable Single Render Loop with Elapsed-Time Delta Physics
  useEffect(() => {
    let isRunning = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastTimeRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      let targetFrame = 1;
      const currentScroll = scrollProgressRef.current;

      if (reducedMotion) {
        targetFrame = 1 + Math.round(currentScroll * (TOTAL_FRAMES - 1));
      } else if (currentScroll < 0.015 && !isScrollingRef.current) {
        // Idle state: advance smoothly based on elapsed time without backwards wrapping
        idleFrameAccumulatorRef.current = (idleFrameAccumulatorRef.current + dt * IDLE_ROTATION_FPS) % TOTAL_FRAMES;
        targetFrame = Math.floor(idleFrameAccumulatorRef.current) + 1;
        smoothedScrollFrameRef.current = targetFrame;
      } else {
        // Scroll state: scrub smoothly to target frame using frame-rate independent interpolation
        const scrollTargetFrame = 1 + currentScroll * (TOTAL_FRAMES - 1);
        const lerpFactor = 1 - Math.exp(-dt * 14); // smooth exponential ease
        smoothedScrollFrameRef.current += (scrollTargetFrame - smoothedScrollFrameRef.current) * lerpFactor;
        targetFrame = Math.round(smoothedScrollFrameRef.current);
        // Sync idle accumulator to avoid jumps when user stops scrolling
        idleFrameAccumulatorRef.current = targetFrame - 1;
      }

      // India geographic zoom progress calculation (begins as Beat 3 exits at ~0.72, completes by ~0.84)
      const indiaZoomTarget = Math.min(Math.max((currentScroll - 0.72) / 0.12, 0), 1);
      // Smooth cubic easing for camera motion
      const cameraEaseTarget = indiaZoomTarget < 0.5
        ? 4 * indiaZoomTarget * indiaZoomTarget * indiaZoomTarget
        : 1 - Math.pow(-2 * indiaZoomTarget + 2, 3) / 2;

      if (reducedMotion) {
        smoothedCameraEaseRef.current = cameraEaseTarget;
      } else {
        const camLerp = 1 - Math.exp(-dt * 12);
        smoothedCameraEaseRef.current += (cameraEaseTarget - smoothedCameraEaseRef.current) * camLerp;
      }

      const currentCameraEase = smoothedCameraEaseRef.current;
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const cameraZoomMultiplier = 1 + currentCameraEase * (isDesktop ? 0.38 : 0.28);
      const cameraCenterProgress = currentCameraEase;

      // Redraw if the frame integer changes or the camera zoom/pan position changes
      const frameChanged = targetFrame !== lastDrawnFrameRef.current;
      const cameraChanged = Math.abs(currentCameraEase - lastDrawnCameraEaseRef.current) > 0.002;

      if (frameChanged || cameraChanged) {
        drawFrame(targetFrame, cameraZoomMultiplier, cameraCenterProgress);
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [drawFrame, reducedMotion]); // Stable dependencies: no scrollProgress re-triggering!

  // Initial Frame 1 draw on load
  useEffect(() => {
    if (initialLoaded) drawFrame(1);
  }, [initialLoaded, drawFrame]);

  // Continuous Cinematic Narrative Transition Calculator
  const getSceneStyle = (start: number, peakStart: number, peakEnd: number, end: number) => {
    if (scrollProgress < start || scrollProgress > end) {
      return {
        opacity: 0,
        pointerEvents: 'none' as const,
        transform: reducedMotion ? 'none' : 'translateY(10px)',
        visibility: 'hidden' as const,
      };
    }
    let opacity = 0;
    if (scrollProgress >= peakStart && scrollProgress <= peakEnd) {
      opacity = 1;
    } else if (scrollProgress < peakStart) {
      opacity = (scrollProgress - start) / (peakStart - start);
    } else {
      opacity = (end - scrollProgress) / (end - peakEnd);
    }
    opacity = Math.max(0, Math.min(1, opacity));
    const translateY = (1 - opacity) * 8;
    return {
      opacity,
      transform: reducedMotion ? 'none' : `translateY(${translateY}px)`,
      pointerEvents: opacity > 0.35 ? ('auto' as const) : ('none' as const),
      visibility: opacity > 0 ? ('visible' as const) : ('hidden' as const),
    };
  };

  // Camera zoom into India completion & Beat 4 trigger calculation
  // Trigger: Beat 4 appears only when camera has completed its geographic zoom into India (scroll >= 0.84)
  const isIndiaZoomComplete = scrollProgress >= 0.84;
  const beat4Progress = isIndiaZoomComplete
    ? Math.min(Math.max((scrollProgress - 0.84) / 0.14, 0), 1)
    : 0;

  // Choreographed reveal values:
  // Phase 1 (0.05 to 0.32): "Change begins" fades in with subtle, gentle upward ease
  const line1Opacity = Math.min(Math.max((beat4Progress - 0.05) / 0.30, 0), 1);
  const line1TranslateY = (1 - line1Opacity) * 8;

  // Phase 2 (0.32 to 0.68): "with what we leave behind." reveals
  const line2Opacity = Math.min(Math.max((beat4Progress - 0.32) / 0.36, 0), 1);
  const line2TranslateY = (1 - line2Opacity) * 8;

  // Phase 3 (0.68 to 0.88): Supporting signature fades in last
  const sigOpacity = Math.min(Math.max((beat4Progress - 0.68) / 0.20, 0), 1);
  const sigTranslateY = (1 - sigOpacity) * 6;

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full h-[460vh] bg-[#030508]"
    >
      {/* Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        
        {/* Full-Bleed 100% Canvas Background (No CSS mask clipping) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full block object-cover" />
        </div>

        {/* Directional Atmospheric Scrim for Beats 1-3 (smoothly fades out as camera centers on India) */}
        <div
          className="absolute inset-0 pointer-events-none z-[4] transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(to right, rgba(3, 5, 8, 0.92) 0%, rgba(3, 5, 8, 0.80) 28%, rgba(3, 5, 8, 0.40) 52%, transparent 75%)',
            opacity: Math.max(0, 1 - Math.min(scrollProgress / 0.75, 1) * 1.2),
          }}
        />


        {/* =========================================================================
            BEAT 1: OPENING HERO (0% - 22% Scroll)
            "Waste is a global problem. Make it visible."
           ========================================================================= */}
        <div
          style={getSceneStyle(0, 0, 0.15, 0.22)}
          className="absolute inset-0 z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center h-full pointer-events-none transition-all duration-200"
        >
          <div className="max-w-2xl text-left">
            {/* Contemporary Sans-Serif Headline with Italic Editorial Serif Accent */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] font-bold leading-[1.05] tracking-tight text-white mb-4 sm:mb-6">
              <span className="block font-sans font-bold text-white">
                Waste is a global problem.
              </span>
              <span className="block font-serif italic font-normal text-[#d4af37] text-[1.05em] tracking-normal mt-1 sm:mt-1.5">
                Make it visible.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base md:text-lg text-slate-200/90 font-sans font-light leading-relaxed mb-6 sm:mb-8 max-w-xl">
              Turn waste data into actionable intelligence. Discover what your world discards, what gets recovered, and what can change.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pointer-events-auto">
              <button
                type="button"
                onClick={handleExploreGlobe}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white text-[#030508] font-sans text-xs sm:text-sm font-semibold hover:bg-[#e2c97c] hover:text-[#030508] transition-all duration-200 active:scale-95 shadow-lg shadow-white/10"
              >
                <span>Explore the globe</span>
                <ArrowUpRightIcon size={14} />
              </button>

              <a
                href="#audit-workspace"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/20 text-white/85 hover:text-white hover:border-white/50 bg-white/[0.04] backdrop-blur-sm font-sans text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95"
              >
                <span>Discover TERRA</span>
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BEAT 2: REGIONAL OBSERVATION (25% - 49% Scroll)
            "Every region tells a story. Trace waste generated, processed, and recovered."
           ========================================================================= */}
        <div
          style={getSceneStyle(0.25, 0.32, 0.44, 0.49)}
          className="absolute inset-0 z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center h-full pointer-events-none transition-all duration-200"
        >
          <div className="max-w-2xl text-left">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.08] tracking-tight text-white mb-4 sm:mb-6">
              <span className="block font-sans font-bold text-white">
                Every region tells a story.
              </span>
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-slate-200/90 font-sans font-light leading-relaxed max-w-xl">
              Trace waste generated, processed, and recovered.
            </p>
          </div>
        </div>

        {/* =========================================================================
            BEAT 3: INSIGHT TO IMPACT (52% - 73% Scroll)
            "Turn insight into impact. Understand material flows. Find opportunities for recovery."
           ========================================================================= */}
        <div
          style={getSceneStyle(0.52, 0.58, 0.68, 0.73)}
          className="absolute inset-0 z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center h-full pointer-events-none transition-all duration-200"
        >
          <div className="max-w-2xl text-left">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.08] tracking-tight text-white mb-4 sm:mb-6">
              <span className="block font-sans font-bold text-white">
                Turn insight into impact.
              </span>
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-slate-200/90 font-sans font-light leading-relaxed mb-6 sm:mb-8 max-w-xl">
              Understand material flows. Find opportunities for recovery.
            </p>

            <div className="pointer-events-auto">
              <a
                href="#audit-workspace"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white text-[#030508] font-sans text-xs sm:text-sm font-semibold hover:bg-[#e2c97c] hover:text-[#030508] transition-all duration-200 active:scale-95 shadow-lg shadow-white/10"
              >
                <span>Explore Live Material Audit</span>
                <ArrowUpRightIcon size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BEAT 4: THE INDIA REVEAL — EMOTIONAL CLIMAX
            Revealed only when camera zoom into India completes
            Centered precisely in viewport; elegant luxury calligraphic script typography
           ========================================================================= */}
        <div
          style={{
            opacity: scrollProgress >= 0.83 ? 1 : 0,
            visibility: scrollProgress >= 0.83 ? 'visible' : 'hidden',
            pointerEvents: beat4Progress > 0.85 ? 'auto' : 'none',
          }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 sm:px-12 pt-16 pb-8 pointer-events-none transition-all duration-300"
        >
          {/* Subtly dim competing background elements directly behind letterforms without obscuring India */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background:
                'radial-gradient(ellipse 65% 48% at 50% 50%, rgba(3, 5, 8, 0.68) 0%, rgba(3, 5, 8, 0.38) 45%, rgba(3, 5, 8, 0.08) 75%, transparent 100%)',
              opacity: Math.min(Math.max((scrollProgress - 0.78) / 0.10, 0), 1) * 0.75,
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center select-none">
            {/* Slogan Line 1: Warm off-white (#FAF8F5) */}
            <div
              style={{
                opacity: line1Opacity,
                transform: reducedMotion ? 'none' : `translateY(${line1TranslateY}px)`,
                transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
              }}
              className="font-script text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] xl:text-[3.35rem] leading-[1.25] sm:leading-[1.3] text-[#FAF8F5] tracking-normal mb-1 sm:mb-2.5 py-1"
            >
              Change begins
            </div>

            {/* Slogan Line 2: Warm off-white with muted gold (#C6A66B) accent ONLY on "leave behind." */}
            <div
              style={{
                opacity: line2Opacity,
                transform: reducedMotion ? 'none' : `translateY(${line2TranslateY}px)`,
                transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
              }}
              className="font-script text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] xl:text-[3.35rem] leading-[1.25] sm:leading-[1.3] tracking-normal sm:whitespace-nowrap py-1"
            >
              <span className="text-[#FAF8F5]">with what we </span>
              <span className="text-[#C6A66B] font-normal">leave behind.</span>
            </div>

            {/* Supporting Signature: Subtle, secondary, tracked monospace */}
            <div
              style={{
                opacity: sigOpacity,
                transform: reducedMotion ? 'none' : `translateY(${sigTranslateY}px)`,
                transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
              }}
              className="font-mono text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.34em] text-white/50 uppercase mt-7 sm:mt-9 flex items-center justify-center gap-3 select-none"
            >
              <span className="w-4 sm:w-6 h-px bg-white/20" />
              <span>TERRA — SEE WASTE DIFFERENTLY.</span>
              <span className="w-4 sm:w-6 h-px bg-white/20" />
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}
