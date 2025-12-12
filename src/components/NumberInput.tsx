interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  className?: string;
}

export default function NumberInput({ 
  label, 
  value, 
  onChange, 
  placeholder = "", 
  suffix = "",
  className = "" 
}: NumberInputProps) {
  return (
    <div className={className}>
      <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>
        {label}
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9.]*"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              onChange(val);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-gray-50 rounded-xl px-4 py-3 pr-12 outline-none"
          style={{ fontSize: '16px' }}
        />
        {suffix && (
          <div 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            style={{ fontSize: '16px' }}
          >
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}