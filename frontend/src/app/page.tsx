'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import EarthCanvas from '@/components/EarthCanvas';
import AuditWorkspace from '@/components/AuditWorkspace';
import DeveloperApiHub from '@/components/DeveloperApiHub';
import MultiSiteCockpit from '@/components/MultiSiteCockpit';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#030508] text-[#f4f6fa] overflow-x-clip">
      {/* Top Editorial Navigation Bar */}
      <Navbar />

      {/* SCREEN 01: Pinned 300-Frame Earth Narrative */}
      <EarthCanvas />

      {/* PRODUCTION ARCHITECTURAL SCREENS */}
      <div className="relative z-10 bg-[#030508]">
        {/* SCREEN 02: Live Material Audit Workspace & AI Vision Scanner */}
        <AuditWorkspace />

        {/* SCREEN 03: Protected Developer API Key Hub & Robotics Proxy */}
        <DeveloperApiHub />

        {/* Cross-Facility Operations Cockpit */}
        <MultiSiteCockpit />

        {/* Editorial Footer */}
        <Footer />
      </div>
    </main>
  );
}
