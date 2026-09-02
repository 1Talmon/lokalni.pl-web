export const Geolocation = {
    getCurrentPosition: async (_opts?: unknown) => new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    ),
    watchPosition: (_opts: unknown, cb: (pos: GeolocationPosition | null, err?: unknown) => void) => {
        const id = navigator.geolocation.watchPosition(pos => cb(pos), err => cb(null, err));
        return String(id);
    },
    clearWatch: async ({ id }: { id: string }) => navigator.geolocation.clearWatch(Number(id)),
};
