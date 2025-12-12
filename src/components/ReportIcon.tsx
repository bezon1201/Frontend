export default function ReportIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="28" cy="28" r="26" fill="white" fillOpacity="0.1" />
      
      {/* Bar Chart Icon */}
      {/* Bar 1 - Short */}
      <rect x="16" y="30" width="4" height="8" rx="2" fill="white" />
      
      {/* Bar 2 - Tall */}
      <rect x="22" y="22" width="4" height="16" rx="2" fill="white" />
      
      {/* Bar 3 - Medium */}
      <rect x="28" y="26" width="4" height="12" rx="2" fill="white" />
      
      {/* Bar 4 - Tallest */}
      <rect x="34" y="18" width="4" height="20" rx="2" fill="white" />
      
      {/* Baseline */}
      <line x1="14" y1="40" x2="42" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
