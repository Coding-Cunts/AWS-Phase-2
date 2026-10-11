'use client';

import React, { useState, useEffect } from 'react';

const SCREENS = [
  { id: 'hero', num: '01', label: 'Orbit' },
  { id: 'audit-workspace', num: '02', label: 'Material Audit' },
  { id: 'contamination-qa', num: '03', label: 'Sentinel QA' },
  { id: 'multi-site', num: '04', label: 'Operations Cockpit' },
  { id: 'robot-api', num: '05', label: 'Detection API' },
  { id: 'enterprise-tiers', num: '06', label: 'Deployment' },
];

export default function ScreenNav() {
  const [activeScreen, setActiveScreen] = useState<string>('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.35;

      for (let i = SCREENS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SCREENS[i].id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveScreen(SCREENS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <aside
      aria-label="Section Fast Navigation"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-4 py-4 px-2 font-mono"
    >
      <div className="flex flex-col gap-3 items-center">
        {SCREENS.map((screen) => {
          const isActive = activeScreen === screen.id;
          return (
            <a
              key={screen.id}
              href={`#${screen.id}`}
              className="group relative flex items-center justify-end"
              aria-label={`Jump to ${screen.label}`}
            >
              {/* Tooltip on Hover */}
              <span className="absolute right-7 px-2.5 py-1 rounded bg-[#0a0e14] border border-white/[0.1] text-slate-300 text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
                {screen.num} · {screen.label}
              </span>

              {/* Indicator Pip */}
              <div
                className={`transition-all duration-200 ${
                  isActive
                    ? 'w-1.5 h-6 bg-[#d4af37] rounded-full'
                    : 'w-1.5 h-1.5 bg-white/[0.25] hover:bg-white/60 rounded-full'
                }`}
              />
            </a>
          );
        })}
      </div>
    </aside>
  );
}
