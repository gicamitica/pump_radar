import React from 'react';
import heroDashboard from '@/assets/hero-login.png';
import heroChart from '@/assets/hero-chart.png';

const Hero: React.FC = () => (
  <div className="relative h-full flex flex-col justify-center">
    {/* Background decorative elements */}
    <div className="absolute inset-0 overflow-hidden">
      {/* Radial gradient overlay */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      {/* Diagonal lines pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.1) 40px,
            rgba(255,255,255,0.1) 41px
          )`,
        }}
      />
    </div>

    {/* Content */}
    <div className="relative z-10">
      {/* Headline */}
      <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
        Effortlessly manage your team<br />and operations.
      </h2>
      <p className="text-sm md:text-base text-blue-100 mb-8 max-w-sm">
        Log in to access your CRM dashboard and manage your team.
      </p>

      {/* Dashboard showcase */}
      <div className="relative pb-8 pr-8">
        {/* Main dashboard image */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
          <img 
            src={heroDashboard}
            alt="Dashboard preview"
            className="w-full h-auto"
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/20 to-transparent pointer-events-none" />
        </div>

        {/* Floating chart widget */}
        <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-32 md:w-44 transform rotate-2 hover:rotate-0 transition-transform duration-300">
          <div className="rounded-xl overflow-hidden shadow-xl shadow-black/30 border border-white/20 bg-white dark:bg-neutral-900 dark:border-neutral-800">
            <img 
              src={heroChart} 
              alt="Chart widget" 
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute -top-3 -left-3 w-6 h-6 grid grid-cols-2 gap-1">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  </div>
);

export default Hero;
