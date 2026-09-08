
const SIZES = {
  sm: 20,
  md: 32,
  lg: 48,
};

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
  const px = SIZES[size];
  return <WebSpinner size={px} color={color} />;
}
