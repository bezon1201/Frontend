interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function SegmentedControl({ options, value, onChange, className = "", disabled = false }: SegmentedControlProps) {
  return (
    <div className={`flex bg-gray-100 rounded-xl p-1 ${className} ${disabled ? 'opacity-50' : ''}`}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => !disabled && onChange(option)}
          disabled={disabled}
          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
            value === option
              ? 'bg-white shadow-sm'
              : 'bg-transparent text-gray-500'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ fontSize: '16px' }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}