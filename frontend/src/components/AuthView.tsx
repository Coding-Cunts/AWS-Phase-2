'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LockIcon,
  MailIcon,
  UserIcon,
  BuildingIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldIcon,
  SparklesIcon,
  KeyIcon,
  CheckIcon,
} from './Icons';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthView({ initialMode = 'login' }: AuthViewProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Facility Director');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Interaction & submission states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Check if session already exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem('terra_session_user');
      if (stored) {
        setAuthenticatedUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Compute password strength (0-4)
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ['Minimal', 'Basic', 'Moderate', 'Strong', 'Enterprise Grade'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-400', 'bg-[#d4af37]'];

  // Demo auto-fill helper
  const handleAutoFillDemo = () => {
    setEmail('compliance.lead@terra.eco');
    setPassword('TerraAudit2026!');
    setFullName('Elena Vance');
    setOrganization('Metro Central MRF · Facility 04');
    setRole('Facility Director');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic validation
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid enterprise work email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && (!fullName.trim() || !organization.trim())) {
      setErrorMessage('Please provide your operator full name and facility organization.');
      return;
    }

    if (mode === 'signup' && !agreeTerms) {
      setErrorMessage('You must acknowledge the ISO 14001 data telemetry charter to proceed.');
      return;
    }

    setIsLoading(true);

    // Realistic cryptographic verification simulation sequence
    const steps =
      mode === 'login'
        ? [
            'ESTABLISHING MUTUAL TLS 1.3 CONNECTION...',
            'VERIFYING CRYPTOGRAPHIC OPERATOR KEYPAIR...',
            'SYNCHRONIZING AWS IAM PERMISSION GRANTS...',
            'SESSION AUTHORIZED · PREPARING DASHBOARD...',
          ]
        : [
            'PROVISIONING TENANT ENCLAVE (AWS US-WEST-2)...',
            'REGISTERING OPERATOR CREDENTIALS WITH KMS...',
            'INITIALIZING ISO 14001 AUDIT REPOSITORY...',
            'WORKSPACE INITIALIZED · PREPARING CREDENTIALS...',
          ];

    let currentStep = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        setIsLoading(false);

        const userData = {
          email,
          fullName: mode === 'signup' ? fullName : fullName || 'Elena Vance',
          organization: mode === 'signup' ? organization : organization || 'Metro Central MRF',
          role,
          token: `terra_jwt_${Math.random().toString(36).substring(2, 15)}`,
          timestamp: new Date().toISOString(),
        };

        try {
          localStorage.setItem('terra_session_user', JSON.stringify(userData));
        } catch {
          // ignore
        }

        setAuthenticatedUser(userData);
        setSuccessMessage(
          mode === 'login'
            ? 'Authentication successful. Welcome to the TERRA intelligence terminal.'
            : 'Account provisioned successfully. Your facility terminal is live.'
        );

        setTimeout(() => {
          router.push('/#audit-workspace');
        }, 1200);
      }
    }, 450);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('terra_session_user');
    } catch {
      // ignore
    }
    setAuthenticatedUser(null);
    setSuccessMessage('Session terminated. Local token revoked.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="relative min-h-screen bg-[#030508] text-[#f4f6fa] flex flex-col justify-between selection:bg-[#d4af37]/30 selection:text-white">
      {/* Background Architectural Grid & Subtle Radial Highlights */}
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff07_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[#d4af37]/[0.035] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-emerald-500/[0.02] rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 border-b border-white/[0.08] px-6 lg:px-12 py-5 bg-[#030508]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-white/60 hover:text-white transition-colors group"
            >
              <ArrowLeftIcon size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Planetary View</span>
            </Link>
            <span className="text-white/20 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2 text-white/40 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TLS 1.3 SECURE ENCLAVE · US-WEST-2</span>
            </div>
          </div>

          <Link href="/" className="font-serif text-2xl tracking-[0.24em] text-white hover:text-[#d4af37] transition-colors">
            TERRA
          </Link>
        </div>
      </header>

      {/* Main Dual-Column Chamber */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Brand Narrative & Telemetry Proof (5 Cols) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-8 border border-white/[0.08] bg-[#060a10]/80 backdrop-blur-sm relative overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#d4af37] uppercase tracking-[0.2em]">
                <SparklesIcon size={12} />
                <span>Enterprise Identity Access</span>
              </div>

              <div>
                <h1 className="font-serif text-3xl xl:text-4xl font-light text-white leading-tight">
                  {mode === 'login'
                    ? 'Enter the intelligence terminal.'
                    : 'Provision your sorting network.'}
                </h1>
                <p className="mt-3 text-white/60 font-sans text-xs font-light leading-relaxed">
                  Transforming municipal and industrial waste streams into structured, verifiable commodity data via computer-vision intelligence.
                </p>
              </div>

              {/* Live Metric Badges */}
              <div className="space-y-3 pt-2 font-mono text-xs">
                <div className="border border-white/[0.06] bg-black/40 p-3 flex items-center justify-between">
                  <span className="text-white/50 text-[10px] uppercase">SORT ACCURACY</span>
                  <span className="text-emerald-400 font-semibold">98.4% Optical Purity</span>
                </div>
                <div className="border border-white/[0.06] bg-black/40 p-3 flex items-center justify-between">
                  <span className="text-white/50 text-[10px] uppercase">PROCESSING SPEED</span>
                  <span className="text-[#d4af37] font-semibold">&lt; 2.0s Inference</span>
                </div>
                <div className="border border-white/[0.06] bg-black/40 p-3 flex items-center justify-between">
                  <span className="text-white/50 text-[10px] uppercase">COMPLIANCE LEDGER</span>
                  <span className="text-white font-semibold">ISO 14001 / EPA</span>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="pt-8 border-t border-white/[0.08] mt-8">
              <div className="flex items-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-wider mb-2">
                <ShieldIcon size={12} className="text-[#d4af37]" />
                <span>Verified Facility Testimonial</span>
              </div>
              <blockquote className="font-serif text-sm italic text-white/80 leading-relaxed">
                &ldquo;TERRA identified 42,850 tons of recoverable polymers and cut manual sorting dockage penalties to under 4.8%.&rdquo;
              </blockquote>
              <div className="font-mono text-[10px] text-white/40 mt-2">
                — Operations Director, Site Alpha Hub
              </div>
            </div>
          </div>

          {/* Right Column: High-Precision Auth Card (7 Cols) */}
          <div className="lg:col-span-7 bg-[#060a10] border border-white/[0.12] p-6 sm:p-10 shadow-2xl relative flex flex-col justify-between">
            <div>
              {/* Mode Toggle Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
                <div className="flex items-center gap-2 p-1 bg-black/50 border border-white/10 rounded-sm">
                  <button
                    type="button"
                    id="tab-login"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className={`px-4 py-1.5 font-mono text-xs transition-all ${
                      mode === 'login'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    id="tab-signup"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    className={`px-4 py-1.5 font-mono text-xs transition-all ${
                      mode === 'signup'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* 1-Click Demo Fill Action */}
                <button
                  type="button"
                  id="btn-autofill-demo"
                  onClick={handleAutoFillDemo}
                  className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-[#d4af37] hover:text-white transition-colors border border-[#d4af37]/30 hover:border-[#d4af37] px-2.5 py-1"
                  title="Auto-populate sample enterprise credentials"
                >
                  <KeyIcon size={12} />
                  <span>Demo Auto-fill</span>
                </button>
              </div>

              {/* Active Session Status (if already logged in) */}
              {authenticatedUser && (
                <div className="mb-6 p-3.5 bg-emerald-500/[0.08] border border-emerald-500/30 flex items-center justify-between font-mono text-xs text-white">
                  <div className="flex items-center gap-2.5">
                    <CheckCircleIcon size={16} className="text-emerald-400" />
                    <div>
                      <div className="font-semibold text-[11px]">
                        Active Session: {authenticatedUser.email}
                      </div>
                      <div className="text-[10px] text-white/50">{authenticatedUser.organization}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircleIcon size={14} className="text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* The Interactive Form */}
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                
                {/* Full Name & Organization (Signup Mode Only) */}
                {mode === 'signup' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label htmlFor="name-input" className="text-white/60 text-[11px] uppercase tracking-wider block">
                        Full Name / Operator
                      </label>
                      <div className="relative">
                        <UserIcon
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                        />
                        <input
                          id="name-input"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Elena Vance"
                          className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/20 text-white placeholder-white/25 focus:border-[#d4af37] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="org-input" className="text-white/60 text-[11px] uppercase tracking-wider block">
                        Facility / Org Name
                      </label>
                      <div className="relative">
                        <BuildingIcon
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                        />
                        <input
                          id="org-input"
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="Metro Central MRF"
                          className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/20 text-white placeholder-white/25 focus:border-[#d4af37] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="text-white/60 text-[11px] uppercase tracking-wider block">
                    Enterprise Work Email
                  </label>
                  <div className="relative">
                    <MailIcon
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                    />
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="compliance@terra.eco"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/20 text-white placeholder-white/25 focus:border-[#d4af37] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Facility Operational Role (Signup Mode Only) */}
                {mode === 'signup' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label htmlFor="role-select" className="text-white/60 text-[11px] uppercase tracking-wider block">
                      Facility Role & Operational Scope
                    </label>
                    <select
                      id="role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black/60 border border-white/20 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                    >
                      <option value="Facility Director">Facility Director (All MRF Lines)</option>
                      <option value="Environmental Compliance Officer">Environmental Compliance Officer (ISO 14001)</option>
                      <option value="Optical Sorting Engineer">Optical Sorting / Optical NIR Engineer</option>
                      <option value="Municipal Sustainability Auditor">Municipal Sustainability Auditor</option>
                      <option value="Circular Commodity Trader">Circular Commodity Trader</option>
                    </select>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password-input" className="text-white/60 text-[11px] uppercase tracking-wider block">
                      {mode === 'login' ? 'Password' : 'Create Strong Password'}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => alert('Password reset link sent to your registered enterprise domain administrator.')}
                        className="text-[10px] text-white/40 hover:text-[#d4af37] transition-colors"
                      >
                        Forgot secret key?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <LockIcon
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                    />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-black/60 border border-white/20 text-white placeholder-white/25 focus:border-[#d4af37] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter (Signup Mode Only) */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="pt-1.5 space-y-1 animate-in fade-in duration-150">
                      <div className="flex gap-1 h-1">
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-full transition-colors ${
                              index < passwordStrength ? strengthColors[passwordStrength] : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>Strength: {strengthLabels[passwordStrength]}</span>
                        <span>Min 8 chars, numbers & symbols</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkbox Options */}
                <div className="pt-1">
                  {mode === 'login' ? (
                    <label className="flex items-center gap-2 cursor-pointer select-none text-white/60 hover:text-white">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/30 bg-black text-[#d4af37] focus:ring-0"
                      />
                      <span className="text-[11px]">Remember terminal authentication for 30 days</span>
                    </label>
                  ) : (
                    <label className="flex items-start gap-2 cursor-pointer select-none text-white/60 hover:text-white">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-white/30 bg-black text-[#d4af37] focus:ring-0"
                      />
                      <span className="text-[11px] leading-tight">
                        I agree to the TERRA ISO 14001 Material Telemetry Charter and data sovereignty policy.
                      </span>
                    </label>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-auth"
                  disabled={isLoading}
                  className="w-full mt-4 py-3 bg-white text-black font-semibold hover:bg-[#d4af37] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs tracking-wider uppercase active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>{loadingStep || 'AUTHENTICATING...'}</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LockIcon size={14} />
                      <span>Sign In to Terminal</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon size={14} />
                      <span>Create Enterprise Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Single Sign-On (SSO) Divider */}
              <div className="mt-6 pt-6 border-t border-white/[0.08]">
                <div className="text-[10px] text-white/40 uppercase tracking-widest text-center mb-3">
                  Or authenticate with enterprise federated ID
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('workspace.admin@cleancity.gov');
                      setPassword('GoogleWorkspace2026!');
                      handleSubmit({ preventDefault: () => {} } as any);
                    }}
                    className="py-2.5 px-3 border border-white/15 hover:border-white text-white/80 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('saml.auditor@waste-intelligence.corp');
                      setPassword('OktaSamlSecure2026!');
                      handleSubmit({ preventDefault: () => {} } as any);
                    }}
                    className="py-2.5 px-3 border border-white/15 hover:border-white text-white/80 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldIcon size={14} className="text-[#d4af37]" />
                    <span>SAML / Okta / Azure</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero-Data-Retention Vision Inference</span>
              </div>
              <div>v3.8 Production Node</div>
            </div>
          </div>

        </div>
      </main>

      {/* Editorial Footer Strip */}
      <footer className="relative z-10 border-t border-white/[0.08] px-6 lg:px-12 py-5 bg-[#030508]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-white/40">
          <div>© 2026 TERRA Waste Intelligence Systems Inc. Cryptographic ISO 14001 Protocol.</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Platform Home
            </Link>
            <span>·</span>
            <Link href="/#audit-workspace" className="hover:text-white transition-colors">
              Live AI Scanner
            </Link>
            <span>·</span>
            <Link href="/#multi-site" className="hover:text-white transition-colors">
              Operations Cockpit
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
