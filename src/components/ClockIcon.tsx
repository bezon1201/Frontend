export default function ClockIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer shadow circle */}
      <circle 
        cx="60" 
        cy="62" 
        r="52" 
        fill="rgba(0, 0, 0, 0.15)"
      />
      
      {/* Outer ring - dark gray gradient */}
      <circle 
        cx="60" 
        cy="60" 
        r="52" 
        fill="url(#clockGradient)"
      />
      
      {/* Inner white face */}
      <circle 
        cx="60" 
        cy="60" 
        r="45" 
        fill="white"
      />
      
      {/* Inner shadow for depth */}
      <circle 
        cx="60" 
        cy="60" 
        r="45" 
        fill="url(#innerShadow)"
      />
      
      {/* Small hour dots */}
      <circle cx="60" cy="20" r="2" fill="#9ca3af" />
      <circle cx="77" cy="25" r="2" fill="#9ca3af" />
      <circle cx="91" cy="39" r="2" fill="#9ca3af" />
      <circle cx="95" cy="60" r="2" fill="#9ca3af" />
      <circle cx="91" cy="81" r="2" fill="#9ca3af" />
      <circle cx="77" cy="95" r="2" fill="#9ca3af" />
      <circle cx="60" cy="100" r="2" fill="#9ca3af" />
      <circle cx="43" cy="95" r="2" fill="#9ca3af" />
      <circle cx="29" cy="81" r="2" fill="#9ca3af" />
      <circle cx="25" cy="60" r="2" fill="#9ca3af" />
      <circle cx="29" cy="39" r="2" fill="#9ca3af" />
      <circle cx="43" cy="25" r="2" fill="#9ca3af" />
      
      {/* Hour hand - green */}
      <g transform="rotate(-60 60 60)">
        <rect 
          x="57.5" 
          y="35" 
          width="5" 
          height="25" 
          rx="2.5" 
          fill="#10b981"
        />
      </g>
      
      {/* Minute hand - blue */}
      <g transform="rotate(90 60 60)">
        <rect 
          x="58.5" 
          y="25" 
          width="3" 
          height="35" 
          rx="1.5" 
          fill="#3b82f6"
        />
      </g>
      
      {/* Second hand - red */}
      <g transform="rotate(210 60 60)">
        <line 
          x1="60" 
          y1="60" 
          x2="60" 
          y2="22" 
          stroke="#ef4444" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
      </g>
      
      {/* Center circle - layered */}
      <circle cx="60" cy="60" r="6" fill="#374151" />
      <circle cx="60" cy="60" r="4" fill="#10b981" />
      <circle cx="60" cy="60" r="2" fill="white" />
      
      {/* Gradients */}
      <defs>
        {/* Outer ring gradient */}
        <radialGradient id="clockGradient" cx="0.3" cy="0.3">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </radialGradient>
        
        {/* Inner shadow for depth */}
        <radialGradient id="innerShadow" cx="0.5" cy="0.3">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="70%" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.05)" />
        </radialGradient>
      </defs>
    </svg>
  );
}