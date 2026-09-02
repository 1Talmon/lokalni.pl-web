interface Props {
    onPointerDown?: (e: React.PointerEvent) => void;
    dark?: boolean;
    compact?: boolean;
}

export const BottomSheetHandle = ({ onPointerDown, dark, compact }: Props) => (
    <div
        className={`flex justify-center touch-none select-none${compact ? ' pt-2 pb-2.5' : ' pt-4 pb-5'}${onPointerDown ? ' cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={onPointerDown}
    >
        <div className={`w-12 h-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-gray-300'}`} />
    </div>
);
