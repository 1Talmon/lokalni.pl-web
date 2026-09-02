import { usePlatform } from '@/hooks/usePlatform';

const SIZES = {
  sm: 20,
  md: 32,
  lg: 48,
};

const SPOKE_COUNTS = 12;
const DURATION = 1.2; // seconds

function IosSpinner({ size }: { size: number }) {
  const spokes = Array.from({ length: SPOKE_COUNTS });
  const cx = size / 2;
  const cy = size / 2;
  // Spoke dimensions relative to size
  const spokeW = size * 0.075;
  const spokeH = size * 0.22;
  const spokeR = spokeW / 2;
  const innerR = size * 0.2;  // distance from center to inner end of spoke

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {spokes.map((_, i) => {
        const angle = (360 / SPOKE_COUNTS) * i;
        const delay = -((SPOKE_COUNTS - 1 - i) * (DURATION / SPOKE_COUNTS));
        const x = cx - spokeW / 2;
        const y = cy - innerR - spokeH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={spokeW}
            height={spokeH}
            rx={spokeR}
            ry={spokeR}
            fill="rgba(0,0,0,0.85)"
            transform={`rotate(${angle} ${cx} ${cy})`}
            style={{
              animation: `ios-spinner-fade ${DURATION}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes ios-spinner-fade {
          0%   { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </svg>
  );
}

function WebSpinner({ size, color = '#6366F1' }: { size: number; color?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size * 0.07)}px solid transparent`,
        borderBottomColor: color,
        borderRadius: '50%',
        animation: 'web-spin 0.75s linear infinite',
        display: 'inline-block',
      }}
    >
      <style>{`@keyframes web-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Spinner({ size = 'md', color }: SpinnerProps) {
  const { isIos } = usePlatform();
  const px = SIZES[size];
  if (isIos) return <IosSpinner size={px} />;
  return <WebSpinner size={px} color={color} />;
}
