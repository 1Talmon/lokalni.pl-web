import type { Service } from '../../types';
import type { MarkerSpec, MarkerEntry } from './types';
import { FONT } from './constants';

// Compile-time only — erased in JS output, no runtime `google` reference at module level
export interface ILKOverlay {
    update(specs: MarkerSpec[]): void;
    setSelected(id: string | null): void;
    setHovered(id: string | null): void;
    setMap(map: google.maps.Map | null): void;
}

/**
 * Factory — class definition is deferred inside the function body.
 * `google.maps.OverlayView` is only evaluated when this function is called
 * (from onLoad, after the Maps API has loaded), never at module import time.
 */
export function makeLKOverlay(onClickMarker: (id: string) => void): ILKOverlay {
    class LKOverlay extends google.maps.OverlayView {
        private readonly markerContainer: HTMLDivElement;
        private readonly pool: Map<string, MarkerEntry> = new Map();
        private readonly removing: Set<string> = new Set();
        private selectedId: string | null = null;
        private hoveredId: string | null = null;

        constructor() {
            super();
            this.markerContainer = document.createElement('div');
            this.markerContainer.style.cssText =
                'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;';
            this.markerContainer.addEventListener('click', (e) => {
                const el = (e.target as Element).closest('[data-mid]');
                if (el) {
                    e.stopPropagation();
                    onClickMarker(el.getAttribute('data-mid')!);
                }
            });
        }

        onAdd() {
            this.getPanes()!.overlayMouseTarget.appendChild(this.markerContainer);
        }

        draw() {
            const proj = this.getProjection();
            if (!proj) return;
            this.pool.forEach((entry, id) => {
                if (this.removing.has(id)) return;
                const pt = proj.fromLatLngToDivPixel(
                    new google.maps.LatLng(entry.lat, entry.lng),
                );
                if (pt) {
                    entry.outer.style.transform = `translate(${Math.round(pt.x)}px,${Math.round(pt.y)}px)`;
                }
            });
        }

        onRemove() {
            this.markerContainer.remove();
            this.pool.clear();
            this.removing.clear();
        }

        // ── Public API ────────────────────────────────────────────────────────

        update(specs: MarkerSpec[]) {
            const incoming = new Set(specs.map((s) => s.id));

            this.pool.forEach((entry, id) => {
                if (!incoming.has(id) && !this.removing.has(id)) {
                    this.removing.add(id);
                    entry.outer.style.transition = 'opacity 160ms ease';
                    entry.outer.style.opacity = '0';
                    if (entry.pillEl) entry.pillEl.style.transform = 'scale(0.75)';
                    setTimeout(() => {
                        entry.outer.remove();
                        this.pool.delete(id);
                        this.removing.delete(id);
                    }, 160);
                }
            });

            for (const spec of specs) {
                if (this.pool.has(spec.id) || this.removing.has(spec.id)) continue;
                const entry = this.buildMarker(spec);
                this.pool.set(spec.id, entry);
                this.markerContainer.appendChild(entry.outer);
                entry.outer.style.opacity = '0';
                entry.outer.style.transition = 'opacity 180ms ease';
                requestAnimationFrame(() => {
                    entry.outer.style.opacity = '1';
                    setTimeout(() => {
                        if (entry.outer.isConnected) entry.outer.style.transition = '';
                    }, 220);
                });
            }

            this.draw();
        }

        setSelected(id: string | null) {
            const prev = this.selectedId;
            this.selectedId = id;
            if (prev) this.refreshVisual(prev);
            if (id && id !== prev) this.refreshVisual(id);
        }

        setHovered(id: string | null) {
            const prev = this.hoveredId;
            this.hoveredId = id;
            if (prev) this.refreshVisual(prev);
            if (id && id !== prev) this.refreshVisual(id);
        }

        // ── Private ───────────────────────────────────────────────────────────

        private refreshVisual(id: string) {
            const e = this.pool.get(id);
            if (!e?.pillEl) return;
            const sel = this.selectedId === id;
            const hov = !sel && this.hoveredId === id;

            const bg     = sel ? '#6366F1' : hov ? '#f1f5f9' : '#ffffff';
            const shadow = sel
                ? '0 0 0 2.5px rgba(99,102,241,.3),0 6px 20px rgba(99,102,241,.45)'
                : hov
                ? '0 4px 16px rgba(0,0,0,.22),0 1px 4px rgba(0,0,0,.1)'
                : '0 2px 8px rgba(0,0,0,.16),0 1px 3px rgba(0,0,0,.09)';
            const scale  = sel
                ? 'scale(1.1) translateY(-3px)'
                : hov
                ? 'scale(1.05) translateY(-1px)'
                : 'scale(1) translateY(0)';

            e.pillEl.style.background = bg;
            e.pillEl.style.boxShadow  = shadow;
            e.pillEl.style.transform  = scale;

            const textEl = e.pillEl.querySelector('.lk-label') as HTMLElement | null;
            if (textEl) textEl.style.color = sel ? '#fff' : '#0f172a';

            const dotEl = e.pillEl.querySelector('.lk-dot') as HTMLElement | null;
            if (dotEl) {
                const col = (dotEl as HTMLElement & { dataset: DOMStringMap }).dataset.col ?? '#6366F1';
                dotEl.style.background = sel ? 'rgba(255,255,255,.85)' : col;
            }

            if (e.arrowEl) e.arrowEl.style.borderTopColor = bg;
        }

        private buildMarker(spec: MarkerSpec): MarkerEntry {
            const outer = document.createElement('div');
            outer.setAttribute('data-mid', spec.id);
            outer.style.cssText = 'position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;';

            let pillEl: HTMLElement | null = null;
            let arrowEl: HTMLElement | null = null;

            if (spec.type === 'price' && spec.service) {
                ({ pillEl, arrowEl } = this.buildPriceBubble(outer, spec.service, spec.id));
            } else if (spec.type === 'cluster') {
                pillEl = this.buildClusterBubble(outer, spec.count ?? 0, spec.city);
            }

            return { outer, pillEl, arrowEl, lat: spec.lat, lng: spec.lng };
        }

        private buildPriceBubble(
            outer: HTMLDivElement,
            svc: Service,
            id: string,
        ): { pillEl: HTMLElement; arrowEl: HTMLElement } {
            const sel = this.selectedId === id;
            const bg  = sel ? '#6366F1' : '#ffffff';

            const wrap = document.createElement('div');
            wrap.style.cssText =
                'position:absolute;left:0;top:0;' +
                'transform:translate(-50%,-100%);' +
                'display:flex;flex-direction:column;align-items:center;' +
                'user-select:none;touch-action:none;';

            const pill = document.createElement('div');
            pill.style.cssText = [
                `background:${bg};`,
                'display:inline-flex;align-items:center;gap:5px;',
                'border-radius:20px;padding:6px 11px 6px 9px;',
                sel
                    ? 'transform:scale(1.1) translateY(-3px);box-shadow:0 0 0 2.5px rgba(99,102,241,.3),0 6px 20px rgba(99,102,241,.45);'
                    : 'transform:scale(1) translateY(0);box-shadow:0 2px 8px rgba(0,0,0,.16),0 1px 3px rgba(0,0,0,.09);',
                'transition:background .15s ease,box-shadow .15s ease,transform .22s cubic-bezier(.34,1.56,.64,1);',
                `font-family:${FONT};white-space:nowrap;`,
            ].join('');

            const priceEl = document.createElement('span');
            priceEl.className = 'lk-label';
            priceEl.style.cssText = `font-size:12px;font-weight:700;color:${sel ? '#fff' : '#0f172a'};line-height:1;letter-spacing:-.02em;`;
            priceEl.textContent = `${svc.price} zł`;

            pill.append(priceEl);

            const arrow = document.createElement('div');
            arrow.style.cssText = `width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bg};margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.08));`;

            wrap.append(pill, arrow);
            outer.appendChild(wrap);

            return { pillEl: pill, arrowEl: arrow };
        }

        private buildClusterBubble(
            outer: HTMLDivElement,
            count: number,
            city?: string,
        ): HTMLElement {
            const sz = count >= 100 ? 56 : count >= 50 ? 50 : count >= 20 ? 44 : count >= 10 ? 40 : count >= 5 ? 34 : 30;
            const fz = count >= 10 ? 13 : 12;

            const wrap = document.createElement('div');
            wrap.style.cssText =
                'position:absolute;left:0;top:0;' +
                'transform:translate(-50%,-50%);' +
                'display:flex;flex-direction:column;align-items:center;gap:5px;' +
                'user-select:none;touch-action:none;';

            const circle = document.createElement('div');
            circle.style.cssText = [
                `width:${sz}px;height:${sz}px;border-radius:50%;`,
                'background:#6366F1;border:2.5px solid #fff;',
                'box-shadow:0 2px 10px rgba(99,102,241,.5),0 1px 3px rgba(0,0,0,.12);',
                'display:flex;align-items:center;justify-content:center;',
                'transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .15s ease;',
            ].join('');

            const countEl = document.createElement('span');
            countEl.style.cssText = `font-size:${fz}px;font-weight:800;color:#fff;line-height:1;font-family:${FONT};letter-spacing:-.02em;`;
            countEl.textContent = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
            circle.appendChild(countEl);
            wrap.appendChild(circle);

            if (city) {
                const label = document.createElement('div');
                label.style.cssText =
                    'background:#fff;border-radius:8px;padding:3px 8px;' +
                    'box-shadow:0 2px 6px rgba(0,0,0,.12);';
                const lspan = document.createElement('span');
                lspan.style.cssText = `font-size:10px;font-weight:700;color:#334155;font-family:${FONT};white-space:nowrap;letter-spacing:.01em;`;
                lspan.textContent = city;
                label.appendChild(lspan);
                wrap.appendChild(label);
            }

            outer.appendChild(wrap);

            outer.addEventListener('mouseenter', () => {
                circle.style.transform = 'scale(1.12) translateY(-2px)';
                circle.style.boxShadow = '0 6px 20px rgba(99,102,241,.55),0 1px 4px rgba(0,0,0,.14)';
            });
            outer.addEventListener('mouseleave', () => {
                circle.style.transform = 'scale(1) translateY(0)';
                circle.style.boxShadow = '0 2px 10px rgba(99,102,241,.5),0 1px 3px rgba(0,0,0,.12)';
            });

            return circle;
        }
    }

    return new LKOverlay();
}
