import React from "react";

export const MedicalHeroIllustration: React.FC = () => (
  <svg
    viewBox="0 0 560 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-auto drop-shadow-2xl select-none"
  >
    {/* Soft ambient background glows */}
    <circle cx="280" cy="180" r="140" fill="url(#heroGlow)" opacity="0.3" />
    <circle cx="440" cy="90" r="60" fill="#38bdf8" opacity="0.15" />

    {/* Modern Floating UI Card 1: Slot Reserved */}
    <g className="animate-bounce" style={{ animationDuration: "5s" }}>
      <rect x="20" y="40" width="220" height="76" rx="16" fill="#ffffff" filter="url(#shadowSoft)" />
      <rect x="36" y="58" width="40" height="40" rx="12" fill="#e0e7ff" />
      {/* Clock icon */}
      <circle cx="56" cy="78" r="10" stroke="#4f46e5" strokeWidth="2.5" />
      <path d="M56 73V78L60 80" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
      <text x="88" y="72" fill="#0f172a" fontSize="13" fontWeight="700" fontFamily="sans-serif">
        3-Min Hold Active
      </text>
      <text x="88" y="88" fill="#10b981" fontSize="11" fontWeight="600" fontFamily="sans-serif">
        ● Lock Secured for You
      </text>
    </g>

    {/* Centerpiece: Doctor Stethoscope & Shield Vector Badge */}
    <g transform="translate(190, 70)">
      <rect width="180" height="200" rx="28" fill="url(#centerCardGrad)" filter="url(#shadowCard)" />
      {/* Shield circle */}
      <circle cx="90" cy="75" r="42" fill="#ffffff" opacity="0.95" />
      <path
        d="M90 48L112 58V76C112 90 102 102 90 106C78 102 68 90 68 76V58L90 48Z"
        fill="#4f46e5"
      />
      {/* Medical Cross in shield */}
      <rect x="87" y="66" width="6" height="22" rx="3" fill="#ffffff" />
      <rect x="79" y="74" width="22" height="6" rx="3" fill="#ffffff" />

      {/* Hospital text badge */}
      <rect x="25" y="135" width="130" height="26" rx="8" fill="#ffffff" opacity="0.15" />
      <text x="90" y="152" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
        MANILA &bull; BGC &bull; CEBU
      </text>
      <text x="90" y="180" fill="#cbd5e1" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
        Accredited Specialists
      </text>
    </g>

    {/* Floating Card 2: Doctor Card Verified */}
    <g className="animate-pulse" style={{ animationDuration: "3.5s" }}>
      <rect x="330" y="210" width="210" height="84" rx="18" fill="#ffffff" filter="url(#shadowSoft)" />
      <circle cx="365" cy="252" r="20" fill="#ecfdf5" />
      {/* Doctor avatar icon */}
      <circle cx="365" cy="246" r="7" fill="#10b981" />
      <path d="M353 262C353 256 358 253 365 253C372 253 377 256 377 262" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
      <text x="396" y="246" fill="#0f172a" fontSize="12" fontWeight="700" fontFamily="sans-serif">
        Dr. Maria Santos, MD
      </text>
      <text x="396" y="262" fill="#64748b" fontSize="10" fontWeight="500" fontFamily="sans-serif">
        St. Luke&apos;s BGC &bull; Cardiologist
      </text>
    </g>

    {/* Verified Checkmark Floating Pill */}
    <g transform="translate(130, 240)">
      <rect width="140" height="40" rx="20" fill="#10b981" filter="url(#shadowSoft)" />
      <circle cx="22" cy="20" r="10" fill="#ffffff" />
      <path d="M18 20L21 23L26 17" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="40" y="24" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="sans-serif">
        Verified Booking
      </text>
    </g>

    {/* SVG Defs for linear gradients and smooth shadows */}
    <defs>
      <linearGradient id="heroGlow" x1="140" y1="40" x2="420" y2="320" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>

      <linearGradient id="centerCardGrad" x1="0" y1="0" x2="180" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e1b4b" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>

      <filter id="shadowSoft" x="0" y="0" width="300" height="150" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
      </filter>

      <filter id="shadowCard" x="170" y="55" width="220" height="240" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#312e81" floodOpacity="0.35" />
      </filter>
    </defs>
  </svg>
);
