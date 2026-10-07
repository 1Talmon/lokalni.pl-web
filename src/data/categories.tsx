// src/data/categories.tsx
import React from 'react';
import { Category } from '../types';
import {
    Sparkles, Car, SprayCan, Flower2, HandHelping, Scissors, Dumbbell, GraduationCap,
    Baby, Dog, Camera, Megaphone, Laptop, PartyPopper, Palette, Truck, Ellipsis
} from 'lucide-react';

// Ids are stored in the DB, used in SEO slugs (API `CATEGORY_SLUG`) and baked into app builds
// already in the stores — rename labels freely, never an existing id.
// Retired ids (mapped by the API): construction → help, garden → home, finance → other.
export const CATEGORIES_DATA: Category[] = [
    { id: 'all', name: 'Wszystko', icon: <Sparkles size={24} /> },
    { id: 'auto', name: 'Motoryzacja', icon: <Car size={24} /> },
    { id: 'cleaning', name: 'Sprzątanie', icon: <SprayCan size={24} /> },
    { id: 'home', name: 'Dom i ogród', icon: <Flower2 size={24} /> },
    { id: 'help', name: 'Pomoc i drobne prace', icon: <HandHelping size={24} /> },
    { id: 'beauty', name: 'Uroda', icon: <Scissors size={24} /> },
    { id: 'health', name: 'Sport i zdrowie', icon: <Dumbbell size={24} /> },
    { id: 'edu', name: 'Korepetycje i nauka', icon: <GraduationCap size={24} /> },
    { id: 'care', name: 'Opieka', icon: <Baby size={24} /> },
    { id: 'pets', name: 'Zwierzęta', icon: <Dog size={24} /> },
    { id: 'photo', name: 'Foto i wideo', icon: <Camera size={24} /> },
    { id: 'social', name: 'Grafika i social media', icon: <Megaphone size={24} /> },
    { id: 'tech', name: 'IT i technologia', icon: <Laptop size={24} /> },
    { id: 'events', name: 'Eventy i rozrywka', icon: <PartyPopper size={24} /> },
    { id: 'art', name: 'Rękodzieło i sztuka', icon: <Palette size={24} /> },
    { id: 'transport', name: 'Transport', icon: <Truck size={24} /> },
    { id: 'other', name: 'Inne', icon: <Ellipsis size={24} /> }
];
