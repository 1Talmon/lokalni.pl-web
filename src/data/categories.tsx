// src/data/categories.tsx
import React from 'react';
import { Category } from '../types';
import {
    Home, Hammer, Zap, Truck, Scissors, Laptop, GraduationCap,
    HeartPulse, Dog, Calculator, Baby, Palette, Coffee, Settings,
    Sparkles, SprayCan, Flower2
} from 'lucide-react';

export const CATEGORIES_DATA: Category[] = [
    { id: 'all', name: 'Wszystko', icon: <Sparkles size={24} />, count: 999 },
    { id: 'cleaning', name: 'Sprzątanie', icon: <SprayCan size={24} />, count: 128 },
    { id: 'home', name: 'Dom i Ogród', icon: <Home size={24} />, count: 145 },
    { id: 'construction', name: 'Budowa', icon: <Hammer size={24} />, count: 89 },
    { id: 'auto', name: 'Auto', icon: <Zap size={24} />, count: 56 },
    { id: 'transport', name: 'Transport', icon: <Truck size={24} />, count: 42 },
    { id: 'beauty', name: 'Uroda', icon: <Scissors size={24} />, count: 112 },
    { id: 'tech', name: 'IT/Naprawy', icon: <Laptop size={24} />, count: 34 },
    { id: 'edu', name: 'Edukacja', icon: <GraduationCap size={24} />, count: 67 },
    { id: 'health', name: 'Zdrowie', icon: <HeartPulse size={24} />, count: 28 },
    { id: 'pets', name: 'Zwierzęta', icon: <Dog size={24} />, count: 45 },
    { id: 'finance', name: 'Finanse', icon: <Calculator size={24} />, count: 19 },
    { id: 'care', name: 'Opieka', icon: <Baby size={24} />, count: 53 },
    { id: 'art', name: 'Sztuka', icon: <Palette size={24} />, count: 22 },
    { id: 'events', name: 'Eventy', icon: <Coffee size={24} />, count: 25 },
    { id: 'garden', name: 'Ogród', icon: <Flower2 size={24} />, count: 31 },
    { id: 'other', name: 'Inne', icon: <Settings size={24} />, count: 76 }
];