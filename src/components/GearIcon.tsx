export default function GearIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer shadow */}
      <g transform="translate(0, 2)" opacity="0.2">
        <path
          d="M 54 8 L 66 8 L 68 18 L 72 18 L 78 10 L 88 14 L 88 20 L 94 24 L 102 18 L 110 24 L 106 32 L 112 36 L 118 42 L 112 50 L 118 54 L 118 66 L 108 68 L 108 72 L 116 78 L 112 88 L 106 88 L 102 94 L 108 102 L 102 110 L 94 106 L 90 112 L 84 118 L 76 112 L 72 118 L 60 118 L 58 108 L 54 108 L 48 116 L 38 112 L 38 106 L 32 102 L 24 108 L 16 102 L 20 94 L 14 90 L 8 84 L 14 76 L 8 72 L 8 60 L 18 58 L 18 54 L 10 48 L 14 38 L 20 38 L 24 32 L 18 24 L 24 16 L 32 20 L 36 14 L 42 8 L 50 14 L 54 8 Z"
          fill="black"
        />
      </g>
      
      {/* Main gear body - gradient */}
      <path
        d="M 54 8 L 66 8 L 68 18 L 72 18 L 78 10 L 88 14 L 88 20 L 94 24 L 102 18 L 110 24 L 106 32 L 112 36 L 118 42 L 112 50 L 118 54 L 118 66 L 108 68 L 108 72 L 116 78 L 112 88 L 106 88 L 102 94 L 108 102 L 102 110 L 94 106 L 90 112 L 84 118 L 76 112 L 72 118 L 60 118 L 58 108 L 54 108 L 48 116 L 38 112 L 38 106 L 32 102 L 24 108 L 16 102 L 20 94 L 14 90 L 8 84 L 14 76 L 8 72 L 8 60 L 18 58 L 18 54 L 10 48 L 14 38 L 20 38 L 24 32 L 18 24 L 24 16 L 32 20 L 36 14 L 42 8 L 50 14 L 54 8 Z"
        fill="url(#gearGradient)"
      />
      
      {/* Inner circle - darker */}
      <circle cx="60" cy="60" r="32" fill="url(#innerGearGradient)" />
      
      {/* Center hole */}
      <circle cx="60" cy="60" r="20" fill="white" />
      
      {/* Center hole inner shadow */}
      <circle cx="60" cy="60" r="20" fill="url(#holeShadow)" />
      
      {/* Decorative colored elements on teeth */}
      {/* Top tooth - blue */}
      <circle cx="63" cy="13" r="3" fill="#3b82f6" />
      
      {/* Top-right tooth - green */}
      <circle cx="93" cy="19" r="3" fill="#10b981" />
      
      {/* Right tooth - blue */}
      <circle cx="107" cy="45" r="3" fill="#3b82f6" />
      
      {/* Bottom-right tooth - red */}
      <circle cx="105" cy="75" r="3" fill="#ef4444" />
      
      {/* Bottom tooth - blue */}
      <circle cx="75" cy="107" r="3" fill="#3b82f6" />
      
      {/* Bottom-left tooth - green */}
      <circle cx="45" cy="107" r="3" fill="#10b981" />
      
      {/* Left tooth - red */}
      <circle cx="19" cy="93" r="3" fill="#ef4444" />
      
      {/* Top-left tooth - green */}
      <circle cx="21" cy="45" r="3" fill="#10b981" />
      
      {/* Inner circle bolts */}
      <circle cx="60" cy="35" r="2.5" fill="#6b7280" />
      <circle cx="75" cy="45" r="2.5" fill="#6b7280" />
      <circle cx="75" cy="75" r="2.5" fill="#6b7280" />
      <circle cx="60" cy="85" r="2.5" fill="#6b7280" />
      <circle cx="45" cy="75" r="2.5" fill="#6b7280" />
      <circle cx="45" cy="45" r="2.5" fill="#6b7280" />
      
      {/* Center ring - layered */}
      <circle cx="60" cy="60" r="14" fill="#374151" />
      <circle cx="60" cy="60" r="12" fill="url(#centerGradient)" />
      <circle cx="60" cy="60" r="7" fill="#374151" />
      <circle cx="60" cy="60" r="5" fill="#6b7280" />
      
      {/* Highlight on top */}
      <ellipse 
        cx="60" 
        cy="25" 
        rx="25" 
        ry="12" 
        fill="white" 
        opacity="0.15"
      />
      
      {/* Gradients */}
      <defs>
        {/* Main gear gradient */}
        <radialGradient id="gearGradient" cx="0.35" cy="0.35">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="50%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </radialGradient>
        
        {/* Inner circle gradient */}
        <radialGradient id="innerGearGradient" cx="0.4" cy="0.4">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </radialGradient>
        
        {/* Center gradient - green accent */}
        <radialGradient id="centerGradient" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>
        
        {/* Hole shadow */}
        <radialGradient id="holeShadow" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="60%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.3)" />
        </radialGradient>
      </defs>
    </svg>
  );
}