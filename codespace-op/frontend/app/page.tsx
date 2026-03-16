'use client';

import Hero from '@/components/Landing/Hero';
import Features from '@/components/Landing/Features';
import Footer from '@/components/Landing/Footer';
import CodeAnimation from '@/components/Landing/CodeAnimation';

export default function LandingPage() {
  return (
    <main className="animated-gradient min-h-screen overflow-hidden relative">
      <CodeAnimation />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
