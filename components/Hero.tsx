import React from 'react';
import { Star } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto mt-10 md:mt-0">
      
      {/* Main Headline */}
      <h1 className="text-5xl mt-28 md:text-7xl lg:text-[5.5rem] leading-[1.1] font-semibold tracking-tight text-white mb-2 drop-shadow-2xl">
      Your Private <span className="font-serif italic font-normal text-white">Autonomous DeFi </span>
        <br />
        <span className="font-serif italic font-normal text-white"></span>
        Trading Agent
      </h1>

      {/* Subheadline */}
      <p className="text-gray-200 text-base md:text-lg max-w-lg mb-32 mt-10 leading-relaxed">
      Deploy your own AI agent that executes encrypted strategies across chains, hands-free, with full privacy via NOVA vaults.
      </p>

      {/* CTA Section */}
      <div className="flex flex-col items-center gap-4">
        {/* Main Button */}
      

      </div>
    </div>
  );
};


export default Hero;