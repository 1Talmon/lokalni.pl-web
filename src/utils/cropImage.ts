const MAX_SIZE = 512;

export interface PixelCrop { x: number; y: number; width: number; height: number }

export const getCroppedImg = async (imageSrc: string, pixelCrop: PixelCrop): Promise<string> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (error) => reject(error));
        img.src = imageSrc;
    });

    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) return '';

    srcCanvas.width = pixelCrop.width;
    srcCanvas.height = pixelCrop.height;
    srcCtx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
    );

    // Skaluj do max MAX_SIZE px — zmniejsza rozmiar pliku drastycznie
    const scale = Math.min(1, MAX_SIZE / Math.max(pixelCrop.width, pixelCrop.height));
    const outW = Math.round(pixelCrop.width * scale);
    const outH = Math.round(pixelCrop.height * scale);

    const outCanvas = document.createElement('canvas');
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return '';

    outCanvas.width = outW;
    outCanvas.height = outH;
    outCtx.drawImage(srcCanvas, 0, 0, outW, outH);

    return outCanvas.toDataURL('image/jpeg', 0.82);
};
