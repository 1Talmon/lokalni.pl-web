export const Share = { share: async (opts: { url?: string; text?: string; title?: string }) => { if (navigator.share) await navigator.share(opts); } };
