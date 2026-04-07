import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40',
  };

  const renderSVGLogo = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        {/* Main Blue Gradient */}
        <linearGradient id="logo-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        
        {/* Wing Gradient */}
        <linearGradient id="wing-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        
        {/* Scanning Shimmer Gradient */}
        <linearGradient id="shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Radial Glow for Nodes and Peaks */}
        <radialGradient id="glow-rad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        
        {/* Heavy Glow Filter */}
        <filter id="glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Soft Glow Filter */}
        <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <style>
          {`
            @keyframes scan {
              0% { transform: translateX(-100%) rotate(45deg); }
              100% { transform: translateX(200%) rotate(45deg); }
            }
            @keyframes pulse-data {
              0% { offset-distance: 0%; opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { offset-distance: 100%; opacity: 0; }
            }
            .data-pulse {
              animation: pulse-data 3s infinite linear;
            }
          `}
        </style>
      </defs>
      
      {/* 1. Outer Triangle Bevel/Frame */}
      <path 
        d="M50 2 L98 88 L2 88 Z" 
        fill="none" 
        stroke="rgba(59, 130, 246, 0.4)" 
        strokeWidth="0.5" 
      />
      
      {/* 2. Main Outer Triangle with Glow */}
      <g>
        <path 
          id="main-triangle"
          d="M50 8 L92 82 L8 82 Z" 
          fill="none" 
          stroke="url(#logo-grad-main)" 
          strokeWidth="4" 
          strokeLinejoin="round"
          filter="url(#glow-heavy)"
        />
        {/* Moving Shimmer Overlay */}
        <mask id="triangle-mask">
          <path d="M50 8 L92 82 L8 82 Z" fill="white" />
        </mask>
        <rect 
          x="0" y="0" width="100" height="100" 
          fill="url(#shimmer-grad)" 
          mask="url(#triangle-mask)"
          style={{ animation: "scan 4s infinite linear" }}
          opacity="0.5"
        />
      </g>
      
      {/* 3. Inner Dark Triangle Mask Area with Starfield */}
      <g>
        <path d="M50 15 L85 78 L15 78 Z" fill="rgba(0,0,0,0.6)" />
        {/* Starfield dots */}
        <circle cx="45" cy="40" r="0.3" fill="#fff" opacity="0.4" />
        <circle cx="55" cy="45" r="0.2" fill="#fff" opacity="0.6" />
        <circle cx="50" cy="35" r="0.4" fill="#fff" opacity="0.3" />
        <circle cx="40" cy="60" r="0.2" fill="#fff" opacity="0.5" />
        <circle cx="60" cy="65" r="0.3" fill="#fff" opacity="0.4" />
        <circle cx="35" cy="70" r="0.2" fill="#fff" opacity="0.7" />
        <circle cx="65" cy="72" r="0.4" fill="#fff" opacity="0.2" />
      </g>
      
      {/* 4. Side Wings - Complex Curved Shapes */}
      <g filter="url(#glow-soft)">
        {/* Left Wing */}
        <path 
          d="M30 70 C35 55 45 45 50 42 L50 60 L30 70 Z" 
          fill="url(#wing-grad)" 
          opacity="0.9"
        />
        {/* Right Wing */}
        <path 
          d="M70 70 C65 55 55 45 50 42 L50 60 L70 70 Z" 
          fill="url(#wing-grad)" 
          opacity="0.9"
        />
        {/* Wing Highlights */}
        <path d="M35 65 C40 55 48 50 50 50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <path d="M65 65 C60 55 52 50 50 50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      </g>
      
      {/* 5. Futuristic Central Rocket - Segmented, Sharper, Energy Core */}
      <g filter="url(#glow-heavy)">
        {/* Force Field - Subtle Pulsing Aura */}
        <circle 
          cx="50" cy="45" r="28" 
          fill="none" 
          stroke="rgba(96, 165, 250, 0.15)" 
          strokeWidth="0.5" 
          className="animate-pulse"
        />

        {/* Stabilization Ring - Glowing Orbit */}
        <ellipse 
          cx="50" cy="45" rx="12" ry="3" 
          fill="none" 
          stroke="#60a5fa" 
          strokeWidth="0.8" 
          strokeDasharray="4 2"
          opacity="0.6"
          className="animate-[spin_10s_linear_infinite]"
        />
        
        {/* Energy Arcs connecting to Ring */}
        <path d="M42 45 Q45 42 48 45" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.4" className="animate-pulse" />
        <path d="M58 45 Q55 42 52 45" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.4" className="animate-pulse" />

        {/* Main Body - Segmented Plating */}
        <path 
          d="M50 12 L57 25 L57 65 L50 74 L43 65 L43 25 Z" 
          fill="url(#logo-grad-main)" 
        />
        
        {/* Nose Cone Tip - Separate Piece */}
        <path 
          d="M50 8 L54 18 L46 18 Z" 
          fill="#fff" 
          opacity="0.9"
          filter="url(#glow-soft)"
        />

        {/* Side Thrusters/Fins - More Aggressive */}
        <path d="M43 45 L38 68 L43 62" fill="url(#wing-grad)" />
        <path d="M57 45 L62 68 L57 62" fill="url(#wing-grad)" />

        {/* Hexagonal / Tech Plating Details */}
        <path d="M46 30 L50 28 L54 30 L54 35 L50 37 L46 35 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.2" />
        <path d="M46 50 L50 48 L54 50 L54 55 L50 57 L46 55 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.2" />

        {/* Micro-plating details / Sensors */}
        <circle cx="46" cy="28" r="0.3" fill="#fff" opacity="0.6" />
        <circle cx="54" cy="28" r="0.3" fill="#fff" opacity="0.6" />
        <circle cx="50" cy="62" r="0.4" fill="#60a5fa" opacity="0.8" />

        {/* Central Energy Core / Cockpit */}
        <rect x="48.5" y="22" width="3" height="15" rx="1.5" fill="#fff" opacity="0.9" filter="url(#glow-soft)" />
        
        {/* Vertical Light Streak */}
        <line x1="50" y1="15" x2="50" y2="70" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round" />
        
        {/* Engine Nozzle Detail */}
        <path d="M45 74 L55 74 L53 78 L47 78 Z" fill="#1e3a8a" />
      </g>
      
      {/* 5.1 Rocket Exhaust / Plasma Trail - Multi-layered */}
      <g filter="url(#glow-heavy)">
        {/* Outer Plasma */}
        <path 
          d="M47 78 L53 78 L58 94 L42 94 Z" 
          fill="url(#glow-rad)" 
          opacity="0.3"
          className="animate-pulse"
        />
        {/* Inner Core Plasma */}
        <path 
          d="M49 78 L51 78 L53 92 L47 92 Z" 
          fill="#fff" 
          opacity="0.6"
          className="animate-pulse"
        />
        <line x1="50" y1="78" x2="50" y2="96" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" className="animate-pulse" />
        
        {/* Rising Particles */}
        <circle cx="48" cy="85" r="0.5" fill="#fff" opacity="0.8">
          <animate attributeName="cy" from="85" to="75" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="52" cy="88" r="0.4" fill="#fff" opacity="0.6">
          <animate attributeName="cy" from="88" to="78" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* 6. Circuitry - Detailed Lines with Glowing Nodes */}
      <g stroke="url(#logo-grad-main)" strokeWidth="1.2" strokeLinecap="round">
        {/* Center Line */}
        <path id="path-center" d="M50 74 L50 94" />
        <circle cx="50" cy="94" r="2" fill="url(#glow-rad)" filter="url(#glow-heavy)" />
        <circle r="0.8" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M50 74 L50 94')" }} />
        
        {/* Left Side Lines */}
        <path id="path-l1" d="M45 76 L35 90" opacity="0.9" />
        <circle cx="35" cy="90" r="1.5" fill="#bae6fd" />
        <circle r="0.6" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M45 76 L35 90')", animationDelay: "0.5s" }} />

        <path id="path-l2" d="M42 78 L25 84" opacity="0.7" />
        <circle cx="25" cy="84" r="1.2" fill="#60a5fa" />
        <circle r="0.5" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M42 78 L25 84')", animationDelay: "1.2s" }} />

        <path id="path-l3" d="M38 80 L18 78" opacity="0.5" />
        <circle cx="18" cy="78" r="1" fill="#3b82f6" />
        <circle r="0.4" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M38 80 L18 78')", animationDelay: "2s" }} />
        
        {/* Right Side Lines */}
        <path id="path-r1" d="M55 76 L65 90" opacity="0.9" />
        <circle cx="65" cy="90" r="1.5" fill="#bae6fd" />
        <circle r="0.6" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M55 76 L65 90')", animationDelay: "0.8s" }} />

        <path id="path-r2" d="M58 78 L75 84" opacity="0.7" />
        <circle cx="75" cy="84" r="1.2" fill="#60a5fa" />
        <circle r="0.5" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M58 78 L75 84')", animationDelay: "1.5s" }} />

        <path id="path-r3" d="M62 80 L82 78" opacity="0.5" />
        <circle cx="82" cy="78" r="1" fill="#3b82f6" />
        <circle r="0.4" fill="#fff" className="data-pulse" style={{ offsetPath: "path('M62 80 L82 78')", animationDelay: "2.3s" }} />
      </g>
      
      {/* 7. Top Peak Glow - Intense Radial */}
      <circle cx="50" cy="25" r="6" fill="url(#glow-rad)" filter="url(#glow-heavy)" className="animate-pulse" />
      
      {/* 8. Bottom Horizontal Flare */}
      <g filter="url(#glow-heavy)">
        <line x1="15" y1="82" x2="85" y2="82" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1="30" y1="82" x2="70" y2="82" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );

  return (
    <div className={cn("flex items-center gap-4 group", className)}>
      <div className={cn(
        "relative shrink-0 flex items-center justify-center transition-all duration-500 group-hover:scale-110",
        sizeClasses[size]
      )}>
        {/* Background Glow Layers */}
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse group-hover:bg-blue-500/40 transition-all duration-700" />
        <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full animate-pulse [animation-delay:1s]" />
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {renderSVGLogo()}
          {/* Central Flare Effect */}
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-400 blur-md opacity-50 animate-pulse" />
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-4 h-4 bg-white blur-sm opacity-80 rounded-full" />
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <div className={cn(
            "font-black tracking-tighter leading-none flex items-center gap-3",
            size === 'xl' ? 'text-6xl md:text-8xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
          )}>
            <span className="text-zinc-900 dark:text-zinc-100 drop-shadow-[0_2px_15px_rgba(255,255,255,0.15)] uppercase">ASCEND</span>
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-blue-500 to-blue-800 uppercase">AI</span>
              <span className="absolute inset-0 bg-blue-500/40 blur-xl -z-10 animate-pulse" />
            </span>
          </div>
          {size !== 'xl' && (
            <div className="flex items-center gap-3 mt-2.5">
              <div className="h-[1px] w-8 bg-gradient-to-r from-blue-600/80 to-transparent" />
              <span className="text-[10px] font-black text-blue-400/90 uppercase tracking-[0.6em] leading-none drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
                Elite Mentor
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
