interface Props {
    onPointerDown?: (e: React.PointerEvent) => void;
    dark?: boolean;
}

/**
 * The one grab handle for every bottom sheet. 44 px touch zone (Apple's minimum), no size variants:
 * a sheet that really can't spare the space should say why next to its own markup.
 */
export const BottomSheetHandle = ({ onPointerDown, dark }: Props) => (
    <div
        className={`flex justify-center items-center h-11 touch-none select-none${onPointerDown ? ' cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={onPointerDown}
    >
        <div className={`w-12 h-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-gray-300'}`} />
    </div>
);
