
import React from 'react';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * A simple SVG-based barcode renderer (Code 128 inspired look)
 * This doesn't require any external libraries.
 */
const Barcode: React.FC<BarcodeProps> = ({ 
  value, 
  width = 2, 
  height = 40, 
  showText = true,
  className = ""
}) => {
  if (!value) return null;

  // Simple deterministic hash to generate a "unique" bar pattern for any string
  // This makes the barcode "look" correct for the data provided
  const generateBars = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    
    const binary = Math.abs(hash).toString(2).padStart(32, '0').repeat(3);
    const pattern = binary.split('').map(b => b === '1' ? 1 : 0.5);
    // Add some static start/stop patterns
    return [1, 0, 1, ...pattern.slice(0, 40), 0, 1, 0, 1];
  };

  const bars = generateBars(value);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg 
        width={bars.length * width} 
        height={height} 
        viewBox={`0 0 ${bars.length * width} ${height}`}
        className="block"
      >
        {bars.map((weight, i) => (
          weight > 0 && (
            <rect 
              key={i} 
              x={i * width} 
              y={0} 
              width={width * weight} 
              height={height} 
              fill="currentColor" 
            />
          )
        ))}
      </svg>
      {showText && (
        <span className="text-[10px] font-mono mt-1 tracking-[0.2em] uppercase">{value}</span>
      )}
    </div>
  );
};

export default Barcode;
