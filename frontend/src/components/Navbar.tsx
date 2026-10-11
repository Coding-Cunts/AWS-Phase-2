'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MenuIcon,
  XIcon,
  LockIcon,
  SparklesIcon,
  InfoIcon,
  UsersIcon,
  GlobeIcon,
  TerminalIcon,
  UserIcon,
  BuildingIcon,
  ArrowUpRightIcon,
} from './Icons';
import AboutModal from './AboutModal';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [aboutModalState, setAboutModalState] = useState<{
    isOpen: boolean;
    tab: 'website' | 'creators' | 'mission';
  }>({
    isOpen: false,
    tab: 'website',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Check for active local session
    const loadUser = () => {
      try {
        const stored = localStorage.getItem('terra_session_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser(null);
        }
      } catch {
        // ignore
      }
    };

    loadUser();

    // Listen for storage events across tabs or local updates
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem('terra_session_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsDropdownOpen(false);
  };

  const openAbout = (tab: 'website' | 'creators' | 'mission') => {
    setIsDropdownOpen(false);
    setAboutModalState({ isOpen: true, tab });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40">
        <nav
          aria-label="Primary Navigation"
          className={`w-full transition-all duration-300 ${
            scrolled
              ? 'bg-[#030508]/85 backdrop-blur-md border-b border-white/[0.08] py-3.5'
              : 'bg-transparent border-b border-transparent py-5 sm:py-6'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
            {/* Brand Identity */}
            <Link
              href="/#hero"
              className="flex items-center gap-3 group focus-visible:outline-none"
              aria-label="TERRA Home"
            >
              <span className="font-serif font-black text-xl tracking-[0.24em] text-white group-hover:text-[#d4af37] transition-colors">
                TERRA
              </span>
            </Link>

            {/* Right Controls & Dropdown Trigger */}
            <div className="flex items-center gap-3 font-mono text-xs" ref={dropdownRef}>
              {/* Active user status pill (when signed in) */}
              {currentUser && (
                <div className="hidden sm:flex items-center gap-2 border border-emerald-500/30 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[140px]">
                    {currentUser.fullName || currentUser.email}
                  </span>
                </div>
              )}

              {/* THREE-LINE HAMBURGER MENU BUTTON (BORDERLESS) */}
              <div className="relative">
                <button
                  type="button"
                  id="navbar-menu-trigger"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label={isDropdownOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  className={`p-1.5 sm:p-2 flex items-center justify-center transition-colors focus:outline-none select-none ${
                    isDropdownOpen
                      ? 'text-[#d4af37]'
                      : 'text-white/80 hover:text-[#d4af37]'
                  }`}
                  title="Navigation Menu"
                >
                  {isDropdownOpen ? (
                    <XIcon size={22} />
                  ) : (
                    <MenuIcon size={22} />
                  )}
                </button>

                {/* DROPDOWN MENU PANEL */}
                {isDropdownOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="navbar-menu-trigger"
                    className="absolute right-0 top-full mt-2.5 w-[320px] sm:w-[380px] bg-[#05080e] border border-white/[0.18] shadow-2xl shadow-black/90 p-4 font-mono text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                        <span className="text-[10px] tracking-widest uppercase text-[#d4af37] font-semibold">
                          TERRA NAVIGATION NODE
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">ESC to exit</span>
                    </div>

                    {/* SECTION 1: USER ACCOUNT / AUTHENTICATION */}
                    <div className="mb-4">
                      <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                        <UserIcon size={11} className="text-white/40" />
                        <span>Authentication & Credentials</span>
                      </div>

                      {currentUser ? (
                        <div className="border border-white/[0.08] bg-[#080d15] p-3 space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-white text-[12px] truncate max-w-[200px]">
                                {currentUser.fullName || 'Authorized Inspector'}
                              </div>
                              <div className="text-[10px] text-white/50 truncate max-w-[200px]">
                                {currentUser.email}
                              </div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">
                              ONLINE
                            </span>
                          </div>

                          {currentUser.organization && (
                            <div className="flex items-center gap-1.5 text-[10px] text-white/60 border-t border-white/[0.06] pt-2">
                              <BuildingIcon size={12} className="text-[#d4af37]" />
                              <span className="truncate">{currentUser.organization}</span>
                              <span className="text-white/30">·</span>
                              <span className="text-white/40">{currentUser.role || 'Operator'}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full text-center py-1.5 border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 transition-colors text-[11px] mt-1"
                          >
                            Sign Out of Session
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/login"
                            onClick={() => setIsDropdownOpen(false)}
                            className="border border-white/15 hover:border-white bg-[#080d15] hover:bg-white/[0.04] p-3 transition-all group flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between text-white group-hover:text-[#d4af37] transition-colors">
                              <span className="font-semibold text-xs">Sign In</span>
                              <LockIcon size={13} className="text-white/50 group-hover:text-[#d4af37]" />
                            </div>
                            <div className="text-[10px] text-white/40 mt-1 font-sans leading-tight">
                              Access portal & audits
                            </div>
                          </Link>

                          <Link
                            href="/signup"
                            onClick={() => setIsDropdownOpen(false)}
                            className="border border-[#d4af37]/40 hover:border-[#d4af37] bg-[#d4af37]/5 hover:bg-[#d4af37]/15 p-3 transition-all group flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between text-[#d4af37]">
                              <span className="font-semibold text-xs">Sign Up</span>
                              <SparklesIcon size={13} className="text-[#d4af37]" />
                            </div>
                            <div className="text-[10px] text-white/50 mt-1 font-sans leading-tight">
                              Create inspector ID
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: ABOUT THE WEBSITE & CREATORS */}
                    <div className="mb-4">
                      <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                        <TerminalIcon size={11} className="text-white/40" />
                        <span>Intelligence Dossier & Origin</span>
                      </div>

                      <div className="space-y-1.5">
                        {/* About the Website */}
                        <button
                          type="button"
                          onClick={() => openAbout('website')}
                          className="w-full text-left p-2.5 border border-white/[0.08] hover:border-white/30 bg-[#080d15]/80 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-none border border-white/15 group-hover:border-[#d4af37] flex items-center justify-center text-white/70 group-hover:text-[#d4af37] transition-colors bg-black/40">
                              <InfoIcon size={13} />
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-[#d4af37] transition-colors text-[11px]">
                                About the Website
                              </div>
                              <div className="text-[10px] text-white/40 font-sans">
                                Multimodal vision & material telemetry
                              </div>
                            </div>
                          </div>
                          <ArrowUpRightIcon size={13} className="text-white/30 group-hover:text-white transition-colors" />
                        </button>

                        {/* About the Creators */}
                        <button
                          type="button"
                          onClick={() => openAbout('creators')}
                          className="w-full text-left p-2.5 border border-white/[0.08] hover:border-white/30 bg-[#080d15]/80 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-none border border-white/15 group-hover:border-[#d4af37] flex items-center justify-center text-white/70 group-hover:text-[#d4af37] transition-colors bg-black/40">
                              <UsersIcon size={13} />
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-[#d4af37] transition-colors text-[11px]">
                                About the Creators
                              </div>
                              <div className="text-[10px] text-white/40 font-sans">
                                Architecture, designers & builders
                              </div>
                            </div>
                          </div>
                          <ArrowUpRightIcon size={13} className="text-white/30 group-hover:text-white transition-colors" />
                        </button>

                        {/* Mission & Philosophy */}
                        <button
                          type="button"
                          onClick={() => openAbout('mission')}
                          className="w-full text-left p-2.5 border border-white/[0.08] hover:border-white/30 bg-[#080d15]/80 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-none border border-white/15 group-hover:border-[#d4af37] flex items-center justify-center text-white/70 group-hover:text-[#d4af37] transition-colors bg-black/40">
                              <GlobeIcon size={13} />
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-[#d4af37] transition-colors text-[11px]">
                                Mission & Impact
                              </div>
                              <div className="text-[10px] text-white/40 font-sans">
                                Zero-landfill circularity manifesto
                              </div>
                            </div>
                          </div>
                          <ArrowUpRightIcon size={13} className="text-white/30 group-hover:text-white transition-colors" />
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: PLATFORM JUMP DIRECTORY */}
                    <div className="pt-3 border-t border-white/[0.08]">
                      <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2">
                        Platform Sections Directory
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                        <Link
                          href="/#hero"
                          onClick={() => setIsDropdownOpen(false)}
                          className="border border-white/[0.08] hover:border-white/30 p-2 text-center text-white/70 hover:text-white transition-colors bg-[#080d15]/60 hover:bg-white/[0.04]"
                        >
                          <div className="text-[#d4af37] text-[9px] uppercase">01 Orbit</div>
                          <div className="truncate mt-0.5">Planetary</div>
                        </Link>
                        <Link
                          href="/#audit-workspace"
                          onClick={() => setIsDropdownOpen(false)}
                          className="border border-white/[0.08] hover:border-white/30 p-2 text-center text-white/70 hover:text-white transition-colors bg-[#080d15]/60 hover:bg-white/[0.04]"
                        >
                          <div className="text-emerald-400 text-[9px] uppercase">02 Vision</div>
                          <div className="truncate mt-0.5">AI Scanner</div>
                        </Link>
                        <Link
                          href="/#developer-hub"
                          onClick={() => setIsDropdownOpen(false)}
                          className="border border-white/[0.08] hover:border-[#d4af37] p-2 text-center text-white/70 hover:text-[#d4af37] transition-colors bg-[#080d15]/60 hover:bg-white/[0.04]"
                        >
                          <div className="text-[#d4af37] text-[9px] uppercase">03 API Hub</div>
                          <div className="truncate mt-0.5">Proxy Engine</div>
                        </Link>
                        <Link
                          href="/#multi-site"
                          onClick={() => setIsDropdownOpen(false)}
                          className="border border-white/[0.08] hover:border-white/30 p-2 text-center text-white/70 hover:text-white transition-colors bg-[#080d15]/60 hover:bg-white/[0.04]"
                        >
                          <div className="text-sky-400 text-[9px] uppercase">04 Ledger</div>
                          <div className="truncate mt-0.5">Cockpit</div>
                        </Link>
                      </div>
                    </div>

                    {/* DROPDOWN FOOTER */}
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-white/40">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>v2.4.0 Production Edge</span>
                      </div>
                      <span className="text-[#d4af37]">ISO 14001 Compliant</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* About The Website & Creators Modal */}
      <AboutModal
        isOpen={aboutModalState.isOpen}
        onClose={() => setAboutModalState((prev) => ({ ...prev, isOpen: false }))}
        initialTab={aboutModalState.tab}
      />
    </>
  );
}
