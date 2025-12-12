interface TradeModeToggleProps {
  value: 'Sim' | 'Live';
  onChange: (value: 'Sim' | 'Live') => void;
  disabled?: boolean;
}

export default function TradeModeToggle({ value, onChange, disabled = false }: TradeModeToggleProps) {
  const isLive = value === 'Live';
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => !disabled && onChange(isLive ? 'Sim' : 'Live')}
          disabled={disabled}
          className={`relative w-12 h-7 rounded-full transition-colors ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: isLive ? '#10b981' : '#ef4444'
          }}
        >
          <div
            className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
            style={{
              transform: isLive ? 'translateX(26px)' : 'translateX(4px)'
            }}
          />
        </button>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: isLive ? '#10b981' : '#ef4444'
          }}
        >
          {isLive ? 'Live' : 'Sim'}
        </span>
      </div>
    </div>
  );
}