import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import InfinityScroller from '@/components/InfinityScroller';
import Features from '@/components/Features';


const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background text-white selection:bg-primary selection:text-black">
      {/* Mini Square Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-hero-glow z-0 pointer-events-none" />
      
      {/* Abstract Device Frame Background Effect - simulating the dark tablet frame in the image */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] md:w-[800px] md:h-[600px] border border-white/5 rounded-[40px] rotate-[-5deg] z-0 blur-[1px] opacity-50 bg-gradient-to-br from-white/5 to-transparent pointer-events-none transform scale-110" />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vh] md:w-[750px] md:h-[550px] border border-white/5 rounded-[35px] rotate-[-5deg] z-0 opacity-30 pointer-events-none" />

      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 pt-20">
        <Hero />
        <InfinityScroller />
        <div>
        <Features />
        </div>
      </main>
    </div>
  );
};

export default App;