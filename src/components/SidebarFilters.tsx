import React, { useState } from 'react';
import { getPartCategory, matchesSmartSearch } from '../utils/categoryHelper';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

interface SidebarProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  translateMake: Record<string, string>;
  translateModel: Record<string, string>;
  categories: string[];
  expandedCategories: string[];
  toggleCategory: (category: string) => void;
  inventory: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterMake: string;
  setFilterMake: (make: string) => void;
  filterModel: string;
  setFilterModel: (model: string) => void;
  filterYear: string;
  setFilterYear: (year: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  filterEngine?: string;
  setFilterEngine?: (engine: string) => void;
  addToCart?: (item: any, quantity: number) => void;
}

const CATEGORY_TRANSLATION: Record<string, string> = {
  "Belt Drive": "السيور والبكرات",
  "Body & Lamp Assembly": "الهيكل والإضاءة",
  "Brake & Wheel Hub": "الفرامل ومحاور العجلات",
  "Cooling System": "نظام التبريد (الراديتر)",
  "Drivetrain": "نظام الدفع",
  "Electrical": "الكهرباء",
  "Engine": "المحرك (الماكينة)",
  "Exhaust & Emission": "نظام العادم (الشكمان)",
  "Fuel & Air": "نظام الوقود والهواء",
  "Heat & Air Conditioning": "التكييف والتدفئة",
  "Ignition": "نظام الإشعال (البواجي)",
  "Interior": "المقصورة الداخلية",
  "Steering": "نظام التوجيه",
  "Suspension": "نظام التعليق",
  "Transmission-Automatic": "ناقل الحركة",
  "Wheel": "العجلات والجنوط",
  "Wiper & Washer": "المساحات وبخاخات المياه"
};

const MAKE_DOMAINS: Record<string, string> = {
  "تويوتا": "toyota.com", "هيونداي": "hyundai.com", "نيسان": "nissan-global.com",
  "فورد": "ford.com", "شفروليه": "chevrolet.com", "كيا": "kia.com",
  "هوندا": "honda.com", "لكزس": "lexus.com", "ميتسوبيشي": "mitsubishicars.com",
  "مازدا": "mazda.com", "جي إم سي": "gmc.com", "بي إم دبليو": "bmw.com",
  "مرسيدس": "mercedes-benz.com", "فولكس فاجن": "vw.com", "أودي": "audi.com",
  "جيب": "jeep.com", "دودج": "dodge.com", "رام": "ramtrucks.com",
  "لاند روفر": "landrover.com", "إنفينيتي": "infinitiusa.com", "سوبارو":
