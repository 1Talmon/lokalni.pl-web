'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { Service } from '../../types';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { FONT } from './constants';

const SHEET_STYLE: React.CSSProperties = {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    background: '#fff', borderRadius: '20px 20px 0 0',
    boxShadow: '0 -6px 28px rgba(0,0,0,.13)', fontFamily: FONT,
};

// ── Karta pojedynczej usługi ────────────────────────────────────────────────
export const ServiceBottomSheet = ({
    svc, onView, onClose,
}: {
    svc: Service;
    onView: (s: Service) => void;
    onClose: () => void;
}) => {
    const { sheetDragProps, startDrag, handleClose, y } = useBottomSheet(onClose, true);
    return (
        <motion.div {...sheetDragProps}
            style={{ ...SHEET_STYLE, padding: '0 16px 24px', y }}
            onClick={(e) => e.stopPropagation()}
        >
            <BottomSheetHandle onPointerDown={startDrag} compact />
            <div
                onPointerDown={startDrag}
                style={{ display: 'flex', gap: 14, alignItems: 'flex-start', touchAction: 'none', cursor: 'grab' }}
            >
                <Image src={svc.image} alt="" width={80} height={80}
                    style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}>{svc.title}</p>
                    <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b' }}>{svc.provider.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {svc.rating > 0 && (
                            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>★ {svc.rating}</span>
                        )}
                        {svc.city && (
                            <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MapPin size={9} style={{ display: 'inline' }} />{svc.city}
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={handleClose} style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f1f5f9',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 16, color: '#64748b', lineHeight: 1,
                }}>×</button>
            </div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9',
            }}>
                <div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-.03em' }}>
                        {svc.price}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>{svc.priceUnit || 'zł'}</span>
                </div>
                <button onClick={() => onView(svc)} style={{
                    background: '#6366F1', color: '#fff', border: 'none',
                    padding: '11px 24px', borderRadius: 14, fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', fontFamily: FONT, boxShadow: '0 4px 14px rgba(99,102,241,.35)',
                    letterSpacing: '-.01em',
                }}>Sprawdź →</button>
            </div>
        </motion.div>
    );
};

// ── Karta klastra (kilka usług) ─────────────────────────────────────────────
export const ClusterBottomSheet = ({
    city, services, onView, onClose,
}: {
    city: string;
    services: Service[];
    onView: (s: Service) => void;
    onClose: () => void;
}) => {
    const { sheetDragProps, startDrag, handleClose, y } = useBottomSheet(onClose, true);
    return (
        <motion.div {...sheetDragProps}
            style={{ ...SHEET_STYLE, paddingBottom: 24, y }}
            onClick={(e) => e.stopPropagation()}
        >
            <BottomSheetHandle onPointerDown={startDrag} compact />
            <div
                onPointerDown={startDrag}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '4px 16px 12px', touchAction: 'none', cursor: 'grab',
                }}
            >
                <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>
                        {city || 'Różne lokalizacje'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                        {services.length}{' '}
                        {services.length === 1 ? 'oferta' : services.length < 5 ? 'oferty' : 'ofert'} w okolicy
                    </p>
                </div>
                <button onClick={handleClose} style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f1f5f9',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#64748b', lineHeight: 1,
                }}>×</button>
            </div>
            <div style={{
                display: 'flex', gap: 10, overflowX: 'auto',
                padding: '4px 16px 0',
                WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
            } as React.CSSProperties}>
                {services.slice(0, 12).map((s) => (
                    <div key={s.publicId} onClick={() => onView(s)}
                        style={{ flexShrink: 0, width: 136, cursor: 'pointer' }}
                    >
                        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 7 }}>
                            <Image src={s.image} alt="" width={136} height={96}
                                style={{ objectFit: 'cover', display: 'block' }}
                            />
                            {s.rating > 0 && (
                                <div style={{
                                    position: 'absolute', top: 6, right: 6,
                                    background: 'rgba(0,0,0,.52)', color: '#fff',
                                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px',
                                }}>★ {s.rating}</div>
                            )}
                        </div>
                        <p style={{
                            margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: '#0f172a',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{s.title}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#6366F1', fontWeight: 700 }}>{s.price} zł</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
