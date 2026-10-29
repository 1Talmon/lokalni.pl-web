import qrcode from 'qrcode-generator';

// Instagram story (1080×1920) drawn straight on a <canvas> — no server, no extra libraries but the QR encoder.
// Instagram covers ~250 px at the top and bottom with its own UI, so everything important sits between them.

export const STORY_W = 1080;
export const STORY_H = 1920;

export interface StoryData {
    name: string;
    /** e.g. "Motoryzacja · Kościerzyna" */
    subtitle: string;
    /** e.g. "★ 4,9 · 12 opinii" — omitted without reviews */
    rating?: string | null;
    avatar?: HTMLImageElement | null;
    /** no profile picture on the story (layout closes the gap) */
    hideAvatar?: boolean;
    /** profile link encoded in the QR code */
    url: string;
    font: string;
}

export type StoryTemplateId = 'gradient' | 'dark' | 'light' | 'card' | 'photo' | 'frame' | 'collage';

export const STORY_TEMPLATES: { id: StoryTemplateId; label: string; photos: 0 | 1 | 3 }[] = [
    { id: 'gradient', label: 'Fiolet', photos: 0 },
    { id: 'dark', label: 'Noc', photos: 0 },
    { id: 'light', label: 'Jasny', photos: 0 },
    { id: 'card', label: 'Karta', photos: 0 },
    { id: 'photo', label: 'Zdjęcie', photos: 1 },
    { id: 'frame', label: 'Ramka', photos: 1 },
    { id: 'collage', label: 'Kolaż', photos: 3 },
];

const INDIGO = '#6366F1';
const VIOLET = '#8B5CF6';
const INK = '#0F172A';

/** Loads an image for drawing; media.mylokalni.pl sends CORS per origin, the query keeps that cache entry separate. */
export function loadStoryImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
    if (!src) return Promise.resolve(null);
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        const tag = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : 'x';
        img.src = src.includes('media.mylokalni.pl') ? `${src}${src.includes('?') ? '&' : '?'}cors=${tag}` : src;
    });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r = 0) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / s, sh = h / s;
    ctx.save();
    if (r) { roundRect(ctx, x, y, w, h, r); ctx.clip(); }
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
    ctx.restore();
}

/** Lines that fit `maxW`, at most `maxLines` (the last one ellipsised). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
        const t = line ? `${line} ${w}` : w;
        if (ctx.measureText(t).width <= maxW) { line = t; continue; }
        if (line) lines.push(line);
        line = w;
        if (lines.length === maxLines) break;
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length > maxLines) lines.length = maxLines;
    const last = lines.length - 1;
    if (last >= 0 && lines.join(' ') !== words.join(' ')) {
        let l = lines[last];
        while (l.length > 1 && ctx.measureText(`${l}…`).width > maxW) l = l.slice(0, -1);
        lines[last] = `${l.trimEnd()}…`;
    }
    return lines;
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, weight: number, color: string, font: string, align: CanvasTextAlign = 'center') {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
}

function logo(ctx: CanvasRenderingContext2D, cx: number, y: number, size: number, color: string, font: string) {
    ctx.font = `800 ${size}px ${font}`;
    const w = ctx.measureText('MyLokalni').width;
    const dot = ctx.measureText('.').width;
    text(ctx, 'MyLokalni', cx - dot / 2, y, size, 800, color, font);
    ctx.font = `800 ${size}px ${font}`;
    ctx.fillStyle = color === '#FFFFFF' ? '#C7D2FE' : INDIGO;
    ctx.textAlign = 'left';
    ctx.fillText('.', cx - dot / 2 + w / 2, y);
}

function avatar(ctx: CanvasRenderingContext2D, d: StoryData, cx: number, cy: number, r: number, ring: string) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (d.avatar) {
        drawCover(ctx, d.avatar, cx - r, cy - r, r * 2, r * 2);
    } else {
        const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        g.addColorStop(0, INDIGO); g.addColorStop(1, VIOLET);
        ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        const initials = d.name.split(/\s+/).map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase();
        text(ctx, initials, cx, cy + r * 0.32, r * 0.9, 800, '#FFFFFF', d.font);
    }
    ctx.restore();
}

/** White QR card with the caption under the code. */
function qrCard(ctx: CanvasRenderingContext2D, d: StoryData, x: number, y: number, size: number, caption = 'Zeskanuj i zarezerwuj') {
    const pad = Math.round(size * 0.09);
    const capH = Math.round(size * 0.16);
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    roundRect(ctx, x, y, size, size + capH, Math.round(size * 0.09));
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.restore();

    const qr = qrcode(0, 'M');
    qr.addData(d.url);
    qr.make();
    const n = qr.getModuleCount();
    const inner = size - pad * 2;
    const cell = inner / n;
    ctx.fillStyle = INK;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (qr.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
        }
    }
    text(ctx, caption, x + size / 2, y + size + capH * 0.42, Math.round(size * 0.058), 700, INK, d.font);
}

/** Largest name size (84 → 56 px) that fits in two lines without cutting. */
function fitName(ctx: CanvasRenderingContext2D, d: StoryData, maxW: number, sizes = [84, 76, 68, 60, 56]): { size: number; lines: string[] } {
    for (const size of sizes) {
        ctx.font = `800 ${size}px ${d.font}`;
        const lines = wrap(ctx, d.name, maxW, 2);
        if (!lines[lines.length - 1]?.endsWith('…')) return { size, lines };
    }
    const size = sizes[sizes.length - 1];
    ctx.font = `800 ${size}px ${d.font}`;
    return { size, lines: wrap(ctx, d.name, maxW, 2) };
}

function nameBlock(ctx: CanvasRenderingContext2D, d: StoryData, cx: number, y: number, color: string, sub: string, maxW = 900): number {
    const { size, lines } = fitName(ctx, d, maxW);
    const lh = Math.round(size * 1.14);
    lines.forEach((l, i) => text(ctx, l, cx, y + i * lh, size, 800, color, d.font));
    let yy = y + (lines.length - 1) * lh + 70;
    ctx.font = `600 42px ${d.font}`;
    const subLines = wrap(ctx, d.subtitle, maxW, 2);
    subLines.forEach((l, i) => text(ctx, l, cx, yy + i * 54, 42, 600, sub, d.font));
    yy += (subLines.length - 1) * 54;
    if (d.rating) { yy += 62; text(ctx, d.rating, cx, yy, 40, 700, color === '#FFFFFF' ? '#FDE68A' : '#B45309', d.font); }
    return yy;
}

function footer(ctx: CanvasRenderingContext2D, d: StoryData, color: string) {
    text(ctx, 'Rezerwuj przez MyLokalni.pl', STORY_W / 2, 1640, 40, 700, color, d.font);
}

function gradientBg(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, 0, STORY_W, STORY_H);
    g.addColorStop(0, INDIGO); g.addColorStop(1, VIOLET);
    ctx.fillStyle = g; ctx.fillRect(0, 0, STORY_W, STORY_H);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.arc(980, 260, 360, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, 1700, 300, 0, Math.PI * 2); ctx.fill();
}

/** QR under the text block, as big as fits above `limit` (where the footer starts). */
function mainQr(ctx: CanvasRenderingContext2D, d: StoryData, cx: number, textEnd: number, max: number, limit: number) {
    // without the avatar the text ends ~220 px higher — move the QR up with it instead of leaving a gap
    const top = Math.max(textEnd + 60, d.hideAvatar ? 800 : 1000);
    const size = Math.max(340, Math.min(max, Math.floor((limit - top) / 1.16)));
    qrCard(ctx, d, cx - size / 2, top, size);
}

/** Avatar on the photo's edge, name, then the QR — sized to end above Instagram's bottom bar (~1680). */
function photoBottom(ctx: CanvasRenderingContext2D, d: StoryData, cx: number) {
    if (!d.hideAvatar) avatar(ctx, d, cx, 920, 80, '#FFFFFF');
    const y = nameBlock(ctx, d, cx, d.hideAvatar ? 1020 : 1090, '#FFFFFF', 'rgba(255,255,255,0.85)');
    const top = y + 44;
    const size = Math.max(320, Math.min(400, Math.floor((1690 - top) / 1.16)));
    qrCard(ctx, d, cx - size / 2, top, size, 'Zeskanuj i zarezerwuj');
}

/** Draws `template` for `d` on a 1080×1920 canvas; `photos` are the user's pictures for the photo templates. */
export function renderStory(canvas: HTMLCanvasElement, template: StoryTemplateId, d: StoryData, photos: (HTMLImageElement | null)[] = []) {
    canvas.width = STORY_W; canvas.height = STORY_H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, STORY_W, STORY_H);
    const cx = STORY_W / 2;
    const p = photos.filter(Boolean) as HTMLImageElement[];

    // photo templates without a photo fall back to the plain look
    if ((template === 'photo' || template === 'frame') && !p[0]) template = 'gradient';
    if (template === 'collage' && !p[0]) template = 'gradient';

    switch (template) {
        case 'gradient': {
            gradientBg(ctx);
            logo(ctx, cx, 330, 64, '#FFFFFF', d.font);
            if (!d.hideAvatar) avatar(ctx, d, cx, 540, 120, 'rgba(255,255,255,0.35)');
            const y = nameBlock(ctx, d, cx, d.hideAvatar ? 560 : 780, '#FFFFFF', 'rgba(255,255,255,0.85)');
            mainQr(ctx, d, cx, y, 500, 1570);
            footer(ctx, d, '#FFFFFF');
            break;
        }
        case 'dark': {
            ctx.fillStyle = INK; ctx.fillRect(0, 0, STORY_W, STORY_H);
            const glow = ctx.createRadialGradient(cx, 560, 40, cx, 560, 700);
            glow.addColorStop(0, 'rgba(99,102,241,0.55)'); glow.addColorStop(1, 'rgba(99,102,241,0)');
            ctx.fillStyle = glow; ctx.fillRect(0, 0, STORY_W, STORY_H);
            logo(ctx, cx, 330, 64, '#FFFFFF', d.font);
            if (!d.hideAvatar) avatar(ctx, d, cx, 540, 120, INDIGO);
            const y = nameBlock(ctx, d, cx, d.hideAvatar ? 560 : 780, '#FFFFFF', '#A5B4FC');
            mainQr(ctx, d, cx, y, 500, 1570);
            footer(ctx, d, '#C7D2FE');
            break;
        }
        case 'light': {
            ctx.fillStyle = '#F4F4F9'; ctx.fillRect(0, 0, STORY_W, STORY_H);
            ctx.fillStyle = 'rgba(99,102,241,0.10)';
            ctx.beginPath(); ctx.arc(1000, 200, 380, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(60, 1760, 320, 0, Math.PI * 2); ctx.fill();
            logo(ctx, cx, 330, 64, INK, d.font);
            if (!d.hideAvatar) avatar(ctx, d, cx, 540, 120, '#FFFFFF');
            const y = nameBlock(ctx, d, cx, d.hideAvatar ? 560 : 780, INK, '#64748B');
            mainQr(ctx, d, cx, y, 500, 1570);
            footer(ctx, d, INDIGO);
            break;
        }
        case 'card': {
            gradientBg(ctx);
            logo(ctx, cx, 330, 60, '#FFFFFF', d.font);
            ctx.save();
            ctx.shadowColor = 'rgba(15,23,42,0.25)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
            roundRect(ctx, 90, 430, 900, d.hideAvatar ? 960 : 1150, 72); ctx.fillStyle = '#FFFFFF'; ctx.fill();
            ctx.restore();
            if (!d.hideAvatar) avatar(ctx, d, cx, 600, 110, '#EEF2FF');
            const y = nameBlock(ctx, d, cx, d.hideAvatar ? 600 : 820, INK, '#64748B', 780);
            mainQr(ctx, d, cx, y, 420, 1545);
            footer(ctx, d, '#FFFFFF');
            break;
        }
        case 'photo': {
            drawCover(ctx, p[0], 0, 0, STORY_W, STORY_H);
            const shade = ctx.createLinearGradient(0, 700, 0, STORY_H);
            shade.addColorStop(0, 'rgba(15,23,42,0)'); shade.addColorStop(0.45, 'rgba(15,23,42,0.75)'); shade.addColorStop(1, 'rgba(15,23,42,0.92)');
            ctx.fillStyle = shade; ctx.fillRect(0, 0, STORY_W, STORY_H);
            const topShade = ctx.createLinearGradient(0, 0, 0, 480);
            topShade.addColorStop(0, 'rgba(15,23,42,0.55)'); topShade.addColorStop(1, 'rgba(15,23,42,0)');
            ctx.fillStyle = topShade; ctx.fillRect(0, 0, STORY_W, 480);
            logo(ctx, cx, 330, 60, '#FFFFFF', d.font);
            const tx = d.hideAvatar ? 90 : 280;
            const tw = d.hideAvatar ? 900 : 760;
            if (!d.hideAvatar) avatar(ctx, d, 170, 1110, 80, '#FFFFFF');
            const { size: ns, lines } = fitName(ctx, d, tw, [70, 62, 56, 50]);
            const lh = Math.round(ns * 1.14);
            lines.forEach((l, i) => text(ctx, l, tx, 1100 + i * lh, ns, 800, '#FFFFFF', d.font, 'left'));
            let y = 1100 + (lines.length - 1) * lh + 58;
            ctx.font = `600 38px ${d.font}`;
            wrap(ctx, d.subtitle, tw, 1).forEach(l => text(ctx, l, tx, y, 38, 600, 'rgba(255,255,255,0.85)', d.font, 'left'));
            if (d.rating) { y += 54; text(ctx, d.rating, tx, y, 36, 700, '#FDE68A', d.font, 'left'); }
            const top = Math.max(1280, y + 50);
            const size = Math.max(280, Math.min(330, Math.floor((1690 - top) / 1.16)));
            qrCard(ctx, d, 90, top, size, 'Zeskanuj i zarezerwuj');
            ctx.font = `700 40px ${d.font}`;
            wrap(ctx, 'Rezerwuj przez MyLokalni.pl', 520, 2).forEach((l, i) => text(ctx, l, 140 + size, top + size / 2 + i * 52, 40, 700, '#FFFFFF', d.font, 'left'));
            break;
        }
        case 'frame': {
            gradientBg(ctx);
            logo(ctx, cx, 330, 60, '#FFFFFF', d.font);
            ctx.save();
            ctx.shadowColor = 'rgba(15,23,42,0.3)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
            roundRect(ctx, 90, 400, 900, 520, 64); ctx.fillStyle = '#FFFFFF'; ctx.fill();
            ctx.restore();
            drawCover(ctx, p[0], 90, 400, 900, 520, 64);
            photoBottom(ctx, d, cx);
            break;
        }
        case 'collage': {
            gradientBg(ctx);
            logo(ctx, cx, 330, 60, '#FFFFFF', d.font);
            const [a, b, c] = [p[0], p[1] ?? p[0], p[2] ?? p[1] ?? p[0]];
            drawCover(ctx, a, 90, 400, 560, 520, 48);
            drawCover(ctx, b, 670, 400, 320, 250, 40);
            drawCover(ctx, c, 670, 670, 320, 250, 40);
            photoBottom(ctx, d, cx);
            break;
        }
    }
}
