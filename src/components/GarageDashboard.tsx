/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { ExcelPartUploader } from './ExcelPartUploader';
import { Toast } from './Toast';
import { AITranslatedText } from './AITranslatedText';

import { PartFormModal } from './garage/PartFormModal';
import { MyPartsTab } from './garage/MyPartsTab';
import { FitmentInquiriesTab } from './garage/FitmentInquiriesTab';
import { OrdersAndCustomTab } from './garage/OrdersAndCustomTab';

// 🚗 استيراد بيانات السيارات المركزية كخيار افتراضي موحد
import { CAR_DATA as DEFAULT_CAR_DATA, CAR_YEARS as DEFAULT_CAR_YEARS } from '../data/carData';

interface GarageProps {
  lang: 'ar' | 'en';
  carData?: any;
  years?: string[];
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onSuccess: () => void;
}

const CATEGORY_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  "Belt Drive": { ar: "نظام السيور والمكرات", en: "Belt Drive" },
  "Body & Lamp Assembly": { ar: "الهيكل والإضاءة", en: "Body & Lamp Assembly" },
  "Brake & Wheel Hub": { ar: "الفرامل والفرامات", en: "Brake & Wheel Hub" },
  "Cooling System": { ar: "نظام التبريد والرديتر", en: "Cooling System" },
  "Drivetrain": { ar: "نظام الدفع والمحاور", en: "Drivetrain" },
  "Electrical": { ar: "الكهرباء والكهربائيات", en: "Electrical" },
  "Electrical-Bulb & Socket": { ar: "اللمبات والسوكتات", en: "Electrical-Bulb & Socket" },
  "Electrical-Connector": { ar: "الفيش والتوصيلات", en: "Electrical-Connector" },
  "Electrical-Switch & Relay": { ar: "المفاتيح والكتاوت", en: "Electrical-Switch & Relay" },
  "Engine": { ar: "المحرك ومكوناته", en: "Engine" },
  "Exhaust & Emission": { ar: "العادم للانبعاثات", en: "Exhaust & Emission" },
  "Fuel & Air": { ar: "الوقود وهواء المحرك", en: "Fuel & Air" },
  "Heat & Air Conditioning": { ar: "التكييف والتدفئة", en: "Heat & Air Conditioning" },
  "Ignition": { ar: "نظام الاشتعال (البواجي)", en: "Ignition" },
  "Interior": { ar: "المقصورة والديكور الداخلي", en: "Interior" },
  "Literature": { ar: "الكتالوجات والكتيبات", en: "Literature" },
  "Steering": { ar: "نظام التوجيه (الدركسون)", en: "Steering" },
  "Suspension": { ar: "المساعدات ونظام التعليق", en: "Suspension" },
  "Transmission-Automatic": { ar: "القير الأوتوماتيك", en: "Transmission-Automatic" },
  "Transmission-Manual": { ar: "القير العادي", en: "Transmission-Manual" },
  "Wheel": { ar: "الإطارات والجنوط", en: "Wheel" },
  "Wiper & Washer": { ar: "المساحات ومساحات الزجاج", en: "Wiper & Washer" }
};

const FULL_CATEGORY_TREE: Record<string, string[]> = {
  "Belt Drive": ["Belt", "Belt Removal / Installation Tool", "Belt Tensioner", "Belt Tensioner Bolt", "Idler Pulley"],
  "Body & Lamp Assembly": ["Air Deflector", "Antenna", "Bumper Cover", "Bumper Insert", "Fender", "Fog / Driving Lamp Assembly", "Grille", "Headlamp Assembly", "Hood", "Outside Mirror Glass", "Radiator Support", "Tail Lamp Assembly", "Trunk Lock Actuator"],
  "Brake & Wheel Hub": ["ABS Control Module", "ABS Wheel Speed Sensor", "Brake Bleeder Screw", "Brake Fluid", "Brake Hose", "Brake Pad", "Caliper", "Master Cylinder", "Parking Brake Shoe", "Power Brake Booster", "Rotor", "Wheel Bearing & Hub"],
  "Cooling System": ["Coolant / Antifreeze", "Coolant Hose / Pipe", "Coolant Reservoir", "Radiator", "Radiator Cap", "Radiator Fan Assembly", "Temperature Sender / Sensor", "Thermostat", "Water Pump"],
  "Drivetrain": ["Axle Shaft Seal", "CV Axle", "CV Joint Boot", "Differential Carrier", "Drive Shaft", "Gear Oil"],
  "Electrical": ["Alternator / Generator", "Battery", "Engine Control Module (ECM Computer)", "Fuse", "Horn", "Speed Sensor", "Starter Motor"],
  "Electrical-Bulb & Socket": ["Back Up / Reverse Lamp Bulb", "Brake Light Bulb", "Fog / Driving Lamp Bulb", "Headlamp Bulb", "Tail Lamp Bulb"],
  "Electrical-Connector": ["ABS Wheel Speed Sensor Connector", "Brake Light Switch Connector", "Camshaft Position Sensor Connector", "Crankshaft Position Sensor Connector", "Fuel Injector Connector", "Ignition Coil Connector"],
  "Electrical-Switch & Relay": ["A/C System Relay", "Blower Motor Relay", "Door Lock Switch", "Fuel Pump / Circuit Opening Relay", "Headlamp Switch", "Ignition Starter Switch", "Power Window Switch"],
  "Engine": ["Camshaft", "Connecting Rod", "Crankshaft", "Cylinder Head", "Cylinder Head Gasket", "Engine Block Heater", "Exhaust Valve", "Harmonic Balancer", "Intake Manifold", "Intake Valve", "Motor Mount", "Oil Cooler", "Oil Filter", "Oil Pan", "Oil Pump", "Piston", "Piston Ring", "Rocker Arm", "Timing Chain", "Valve Cover", "Variable Valve Timing (VVT) Solenoid / Actuator"],
  "Exhaust & Emission": ["Catalytic Converter", "Exhaust Header Gasket", "Exhaust Manifold", "Mass Air Flow (MAF) Sensor", "Oxygen (O2) Sensor", "Vapor Canister Purge Valve / Solenoid"],
  "Fuel & Air": ["Air Filter", "Fuel Injection Pressure Sensor", "Fuel Injector", "Fuel Line / Hose", "Fuel Pump & Housing Assembly", "Fuel Tank Cap", "Throttle Body"],
  "Heat & Air Conditioning": ["A/C Compressor", "A/C Condenser", "A/C Evaporator Core", "A/C Expansion Valve", "Ambient Air Temperature Sensor", "Blower Motor", "Cabin Air Filter", "Heater Core"],
  "Ignition": ["Camshaft Position Sensor", "Crankshaft Position Sensor", "Ignition Coil", "Spark Plug", "Spark Plug Wire"],
  "Interior": ["Accelerator Pedal Position Sensor", "Air Bag Clockspring", "Floor Mat", "Inside Door Handle", "Steering Wheel", "Window Motor", "Window Regulator"],
  "Literature": ["Repair Manual"],
  "Steering": ["Power Steering Fluid", "Rack and Pinion", "Steering Wheel Position Sensor", "Tie Rod End"],
  "Suspension": ["Alignment Bolt / Camber Plate", "Coil Spring", "Control Arm", "Control Arm Bushing", "Shock / Strut", "Shock / Strut Mount", "Sway Bar Bushing", "Sway Bar Link"],
  "Transmission-Automatic": ["Automatic Transmission Control Unit (TCU)", "Clutch Housing", "Filter", "Flexplate", "Fluid Pan", "Torque Converter", "Transmission Fluid", "Transmission Mount", "Valve Body"],
  "Transmission-Manual": ["Clutch Kit", "Clutch Master Cylinder", "Clutch Slave Cylinder", "Flywheel", "Manual Transmission Fluid", "Shift Fork", "Synchro Ring"],
  "Wheel": ["Lug Nut", "Lug Stud", "Tire Pressure Monitoring System (TPMS) Sensor", "Wheel"],
  "Wiper & Washer": ["Washer Fluid Reservoir", "Washer Pump", "Wiper Arm", "Wiper Blade", "Wiper Motor"]
};

export const GarageDashboard: React.FC<GarageProps> = ({ 
  lang, 
  carData, 
  years, 
  supabaseUrl, 
  apiKey, 
  session, 
  onSuccess 
}) => {
  const activeCarData = carData || DEFAULT_CAR_DATA;
  const activeYears = years || DEFAULT_CAR_YEARS;

  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'inquiries' | 'custom_requests' | 'orders' | 'profile'>('my_parts');
  
  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || 'garage_unknown';

  // 🛡️ الحذف الجماعي الآمن
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // 💰 التعديل الجماعي للأسعار
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [priceActionType, setPriceActionType] = useState<'increase' | 'decrease'>('increase');
  const [pricePercentage, setPricePercentage] = useState<number>(5);
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [smartRounding, setSmartRounding] = useState<boolean>(true);
  const [selectedPartIdsForPrice, setSelectedPartIdsForPrice] = useState<Record<number, boolean>>({});
  const [isApplyingPriceChanges, setIsApplyingPriceChanges] = useState(false);
  const [hasPriceBackup, setHasPriceBackup] = useState<boolean>(() => !!localStorage.getItem(`garage_price_backup_${userId}`));

  const [garageName, setGarageName] = useState<string>(() => localStorage.getItem(`garage_name_${userId}`) || 'كراج التخصصي للسيارات');
  const [commercialReg, setCommercialReg] = useState<string>(() => localStorage.getItem(`garage_cr_${userId}`) || '');
  const [garagePhone, setGaragePhone] = useState<string>(() => localStorage.getItem(`garage_phone_${userId}`) || session?.phone || '');
  const [garageEmail, setGarageEmail] = useState<string>(() => localStorage.getItem(`garage_email_${userId}`) || session?.email || '');
  const [garageAddress, setGarageAddress] = useState<string>(() => localStorage.getItem(`garage_location_${userId}`) || 'المنطقة الصناعية - الدوحة، قطر');
  const [garageNotes, setGarageNotes] = useState<string>(() => localStorage.getItem(`garage_notes_${userId}`) || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [previewPartDetails, setPreviewPartDetails] = useState<any | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [returnDays, setReturnDays] = useState<number>(3);
  const [warrantyDays, setWarrantyDays] = useState<number>(14);

  const isRtl = lang === 'ar';

  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
    fetchMyInquiries();
    fetchCustomRequests();
  }, [userId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`garage_name_${userId}`, garageName);
    localStorage.setItem(`garage_cr_${userId}`, commercialReg);
    localStorage.setItem(`garage_phone_${userId}`, garagePhone);
    localStorage.setItem(`garage_email_${userId}`, garageEmail);
    localStorage.setItem(`garage_location_${userId}`, garageAddress);
    localStorage.setItem(`garage_notes_${userId}`, garageNotes);

    try {
      await fetch(`${restUrl}/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          garage_name: garageName,
          commercial_registration: commercialReg,
          phone: garagePhone,
          email: garageEmail,
          garage_address: garageAddress,
          notes: garageNotes,
          updated_at: new Date().toISOString()
        })
      });
      setToastMessage(isRtl ? 'تم تحديث بيانات الكراج بنجاح 🔒' : 'Garage profile updated securely');
    } catch (err) {
      setToastMessage(isRtl ? 'تم حفظ البيانات محلياً بنجاح ✅' : 'Saved locally');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return alert(isRtl ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return alert(isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${cleanBaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (res.ok) {
        setToastMessage(isRtl ? 'تم تغيير كلمة المرور بنجاح 🔑' : 'Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(isRtl ? 'فشل تغيير كلمة المرور' : 'Failed to update password');
      }
    } catch (err) {
      alert(isRtl ? 'حدث خطأ غير متوقع' : 'Error updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDetectGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
          setGarageAddress(mapLink);
          localStorage.setItem(`garage_location_${userId}`, mapLink);
          setToastMessage(isRtl ? 'تم التقاط الموقع التلقائي بنجاح 📍' : 'GPS Location detected');
        },
        () => {
          alert(isRtl ? 'تعذر التقاط الموقع' : 'GPS failed');
        }
      );
    }
  };

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${restUrl}/parts?user_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyParts(data);
        const map: Record<number, boolean> = {};
        data.forEach((p: any) => { map[p.id] = true; });
        setSelectedPartIdsForPrice(map);
      }
    } catch (error) {}
  };

  const fetchMyOrders = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${restUrl}/orders?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyOrders(await response.json());
    } catch (error) {}
  };

  const fetchMyInquiries = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const encodedUser = encodeURIComponent(userId);
      const response = await fetch(`${restUrl}/fitment_inquiries?or=(garage_id.eq.${encodedUser},garage_id.ilike.${encodedUser})&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyInquiries(await response.json());
    } catch (error) {}
  };

  const fetchCustomRequests = async () => {
    try {
      const response = await fetch(`${restUrl}/custom_part_requests?order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setCustomRequests(await response.json());
    } catch (error) {}
  };

  // 🗑️ تنفيذ الحذف الجماعي لكامل المخزون
  const handleExecuteBulkDelete = async () => {
    if (bulkDeleteConfirmText.trim() !== 'حذف' && bulkDeleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      return alert(isRtl ? 'يرجى كتابة كلمة "حذف" للتأكيد' : 'Please type "DELETE" to confirm');
    }

    setIsBulkDeleting(true);
    try {
      const response = await fetch(`${restUrl}/parts?user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });

      if (response.ok) {
        setToastMessage(isRtl ? 'تم مسح كافة معروضات الكراج بنجاح 🗑️' : 'All parts deleted successfully');
        setShowBulkDeleteModal(false);
        setBulkDeleteConfirmText('');
        fetchMyParts();
        onSuccess();
      } else {
        alert(isRtl ? 'حدث خطأ أثناء تنفيذ الحذف الجماعي' : 'Error deleting parts');
      }
    } catch (err) {
      alert(isRtl ? 'تعذر الاتصال بالخادم' : 'Connection failed');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // 📥 تصدير كامل المخزون إلى ملف Excel / CSV
  const handleExportToExcel = () => {
    if (myParts.length === 0) {
      return alert(isRtl ? 'لا توجد قطع لتصديرها حالياً.' : 'No parts available to export.');
    }

    const headers = ['id', 'name', 'part_number', 'price', 'stock', 'make', 'model', 'year', 'engine', 'category', 'part_type', 'part_condition', 'origin'];
    const rows = [headers.join(',')];

    myParts.forEach((p: any) => {
      const row = headers.map(h => `"${String(p[h] ?? '').replace(/"/g, '""')}"`);
      rows.push(row.join(','));
    });

    const blob = new Blob(["\ufeff" + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `مخزون_${garageName || 'الكراج'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMessage(isRtl ? 'تم تصدير ملف الإكسل بنجاح 📥' : 'Excel/CSV Exported successfully');
  };

  // 💰 تصفية القطع المشمولة بتعديل السعر
  const getFilteredPartsForPricing = () => {
    return myParts.filter((p: any) => {
      const pOrigin = (p.origin || p.country_of_origin || p.part_type || p.description || '').toLowerCase();
      const matchOrigin = filterOrigin === 'all' || pOrigin.includes(filterOrigin.toLowerCase());
      const matchMake = filterMake === 'all' || p.make === filterMake;
      const matchCat = filterCategory === 'all' || (p.category || '').includes(filterCategory);
      return matchOrigin && matchMake && matchCat;
    });
  };

  // 💰 حساب السعر الجديد للقطعة
  const calculateNewPrice = (oldPrice: number) => {
    const factor = priceActionType === 'increase' 
      ? 1 + (Number(pricePercentage) / 100)
      : 1 - (Number(pricePercentage) / 100);
    
    let res = oldPrice * factor;
    if (smartRounding) res = Math.round(res);
    else res = parseFloat(res.toFixed(2));
    return Math.max(1, res);
  };

  // 💰 تطبيق التعديل الجماعي للأسعار وحفظ نسخة احتياطية للتراجع
  const handleApplyBulkPriceChanges = async () => {
    const targetParts = getFilteredPartsForPricing().filter(p => selectedPartIdsForPrice[p.id]);
    if (targetParts.length === 0) {
      return alert(isRtl ? 'لم تقم بتحديد أي قطعة لتعديل سعرها!' : 'No parts selected for price update!');
    }

    if (!window.confirm(isRtl ? `هل أنت متأكد من تعديل أسعار (${targetParts.length}) قطعة بنسبة ${pricePercentage}%؟` : `Update prices for ${targetParts.length} parts?`)) {
      return;
    }

    setIsApplyingPriceChanges(true);

    // 1. حفظ نسخة احتياطية للتراجع
    const backupData: Record<number, number> = {};
    myParts.forEach((p: any) => { backupData[p.id] = Number(p.price || 0); });
    localStorage.setItem(`garage_price_backup_${userId}`, JSON.stringify(backupData));
    setHasPriceBackup(true);

    try {
      const updates = targetParts.map(p => {
        const newPrice = calculateNewPrice(Number(p.price || 0));
        return fetch(`${restUrl}/parts?id=eq.${p.id}&user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: newPrice })
        });
      });

      await Promise.all(updates);
      setToastMessage(isRtl ? `تم تحديث أسعار ${targetParts.length} قطعة بنجاح! 🚀` : 'Prices updated successfully!');
      setShowBulkPriceModal(false);
      fetchMyParts();
      onSuccess();
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء تعديل بعض الأسعار' : 'Error updating some prices');
    } finally {
      setIsApplyingPriceChanges(false);
    }
  };

  // ↩️ التراجع الفوري عن آخر تعديل للأسعار (Undo / Rollback)
  const handleRollbackPrices = async () => {
    const rawBackup = localStorage.getItem(`garage_price_backup_${userId}`);
    if (!rawBackup) return alert(isRtl ? 'لا توجد نسخة سابقة للأسعار للتراجع إليها' : 'No price backup found');

    const backupMap: Record<number, number> = JSON.parse(rawBackup);
    if (!window.confirm(isRtl ? 'هل تريد استعادة جميع الأسعار كما كانت قبل آخر تعديل؟' : 'Restore all prices to previous state?')) {
      return;
    }

    try {
      const rollbacks = Object.entries(backupMap).map(([partId, oldPrice]) => {
        return fetch(`${restUrl}/parts?id=eq.${partId}&user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: oldPrice })
        });
      });

      await Promise.all(rollbacks);
      setToastMessage(isRtl ? 'تم التراجع واستعادة الأسعار السابقة بنجاح! ↩️' : 'Prices restored successfully!');
      localStorage.removeItem(`garage_price_backup_${userId}`);
      setHasPriceBackup(false);
      fetchMyParts();
      onSuccess();
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء استعادة الأسعار' : 'Failed to rollback prices');
    }
  };

  const handleConfirmFitment = async () => {
    if (!selectedInquiry) return;
    try {
      const payload: Record<string, any> = {
        status: 'confirmed_compatible',
        return_days: Number(returnDays) || 3,
        warranty_days: Number(warrantyDays) || 14
      };

      const response = await fetch(`${restUrl}/fitment_inquiries?id=eq.${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': apiKey, 
          'Authorization': `Bearer ${session?.token || apiKey}`, 
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToastMessage(isRtl ? 'تم تأكيد التوافق والضمان بنجاح ✅' : 'Fitment confirmed');
        setSelectedInquiry(null);
        fetchMyInquiries();
      } else {
        const errorMsg = await response.text();
        console.error("❌ خطأ Supabase:", errorMsg);
        setToastMessage(isRtl ? 'حدث خطأ أثناء حفظ التوافق ❌' : 'Error saving fitment');
      }
    } catch (error) {
      console.error("Error confirming fitment:", error);
    }
  };

  const handleRejectFitment = async (inquiryId: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد أن القطعة لا تركب على سيارة العميل؟' : 'Are you sure this part does not fit?')) return;
    try {
      const response = await fetch(`${restUrl}/fitment_inquiries?id=eq.${inquiryId}`, {
        method: 'PATCH',
        headers: { 
          'apikey': apiKey, 
          'Authorization': `Bearer ${session?.token || apiKey}`, 
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        setToastMessage(isRtl ? 'تم رفض طلب التوافق ❌' : 'Inquiry rejected');
        fetchMyInquiries();
      }
    } catch (error) {
      console.error("Error rejecting fitment:", error);
    }
  };

  const handlePreviewPart = async (inquiry: any) => {
    if (inquiry.part_id) {
      try {
        const response = await fetch(`${restUrl}/parts?id=eq.${inquiry.part_id}`, {
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
        });
        if (response.ok) {
          const parts = await response.json();
          if (parts && parts.length > 0) {
            setPreviewPartDetails(parts[0]);
            return;
          }
        }
      } catch (e) {}
    }
    setPreviewPartDetails({
      name: inquiry.part_name,
      part_number: inquiry.part_number,
      price: inquiry.part_price,
      image_url: inquiry.part_image || inquiry.image_url
    });
  };

  const handlePublishSingle = async (formData: any) => {
    try {
      const isEditing = !!editingPart;
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing 
        ? `${restUrl}/parts?id=eq.${editingPart.id}&user_id=eq.${userId}` 
        : `${restUrl}/parts`;

      const payload = {
        name: formData.partName,
        part_number: formData.partNumber || null,
        price: parseFloat(formData.partPrice) || 0,
        stock: parseInt(formData.partStock) || 1,
        part_type: formData.partType,
        part_condition: formData.partCondition,
        category: formData.fullCategoryPath || 'عام',
        make: formData.partMake,
        model: formData.partModel,
        year: formData.computedYear,
        engine: formData.partEngine || 'عام',
        image_url: formData.partImages?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
        additional_images: formData.partImages || [],
        description: formData.partDescription || null,
        warranty: formData.partWarranty || null,
        interchange_numbers: formData.interchangeNumbers || null,
        garage_address: garageAddress,
        user_id: userId
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'apikey': apiKey, 
          'Authorization': `Bearer ${session?.token || apiKey}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToastMessage(isEditing ? 'تم حفظ التعديلات بنجاح ✅' : 'تم نشر القطعة للبيع بنجاح ✅');
        setShowEditModal(false);
        setEditingPart(null);
        fetchMyParts();
        onSuccess();
        setActiveTab('my_parts');
      } else {
        setToastMessage('حدث خطأ أثناء الحفظ، يرجى مراجعة المدخلات ❌');
      }
    } catch (err) {
      setToastMessage('حدث خطأ غير متوقع في النظام ❌');
    }
  };

  const handleDeletePart = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القطعة؟')) return;
    try {
      const response = await fetch(`${restUrl}/parts?id=eq.${id}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleQuickSaveInline = async (partId: number, price: string, stock: string) => {
    try {
      const response = await fetch(`${restUrl}/parts?id=eq.${partId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(price) || 0, stock: parseInt(stock) || 0 })
      });
      if (response.ok) { setToastMessage('تم التحديث السريع بنجاح! ✅'); fetchMyParts(); onSuccess(); }
    } catch (err) {}
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const validStatus = (status === 'ready' || status === 'ready_for_pickup') ? 'ready_for_pickup' : status;

      const response = await fetch(`${restUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 
          'apikey': apiKey, 
          'Authorization': `Bearer ${session?.token || apiKey}`, 
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          status: validStatus, 
          garage_address: garageAddress 
        })
      });

      if (response.ok) {
        setToastMessage(isRtl ? 'تم تأكيد توفر القطعة وتحديث الحالة للشحن! 📦' : 'Order marked ready');
        fetchMyOrders();
      } else {
        const errText = await response.text();
        console.error("❌ خطأ تحديث الطلب:", errText);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const pendingInquiriesCount = myInquiries.filter(i => i.status === 'pending_check').length;
  const activeOrdersCount = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled').length;

  const availableMakes = Array.from(new Set(myParts.map(p => p.make).filter(Boolean)));
  const availableCategories = Array.from(new Set(myParts.map(p => (p.category || '').split('>')[0].trim()).filter(Boolean)));

  return (
    <div style={{ maxWidth: '1050px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '22px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* هيدر التبويبات المكتمل مع شارات التنبيه الملونة */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', flexWrap: 'wrap', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <button onClick={() => setActiveTab('my_parts')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'my_parts' ? '#1f3a5f' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          معروضاتي ({myParts.length})
        </button>

        <button onClick={() => { setEditingPart(null); setActiveTab('add_part'); }} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'add_part' ? '#1f3a5f' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          إضافة قطعة جديدة
        </button>

        <button onClick={() => setShowExcelModal(true)} style={{ padding: '12px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          📄 رفع إكسل
        </button>

        <button onClick={() => setActiveTab('custom_requests')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'custom_requests' ? '#e0872a' : 'transparent', color: activeTab === 'custom_requests' ? 'white' : '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          طلبات التسعير ({customRequests.length})
        </button>

        <button onClick={() => setActiveTab('inquiries')} style={{ position: 'relative', flex: 1, padding: '12px', backgroundColor: activeTab === 'inquiries' ? '#805ad5' : 'transparent', color: activeTab === 'inquiries' ? 'white' : '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          فحص التوافق ({myInquiries.length})
          {pendingInquiriesCount > 0 && (
            <span style={{ position: 'absolute', top: '-5px', [isRtl ? 'left' : 'right']: '5px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>
              {pendingInquiriesCount} {isRtl ? 'جديد' : 'New'}
            </span>
          )}
        </button>

        <button onClick={() => setActiveTab('orders')} style={{ position: 'relative', flex: 1, padding: '12px', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          الطلبات ({myOrders.length})
          {activeOrdersCount > 0 && (
            <span style={{ position: 'absolute', top: '-5px', [isRtl ? 'left' : 'right']: '5px', backgroundColor: '#16a34a', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(22,163,74,0.4)' }}>
              {activeOrdersCount} {isRtl ? 'جاري' : 'Active'}
            </span>
          )}
        </button>

        <button onClick={() => setActiveTab('profile')} style={{ padding: '12px 18px', backgroundColor: activeTab === 'profile' ? '#0284c7' : '#f0f9ff', color: activeTab === 'profile' ? 'white' : '#0369a1', border: '1px solid #bae6fd', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          ⚙️ بيانات الكراج والأمان
        </button>
      </div>

      {/* 🛠️ شريط أدوات إدارة المخزون المتقدم (يظهر داخل تبويب معروضاتي) */}
      {activeTab === 'my_parts' && (
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <strong style={{ color: '#1f3a5f', fontSize: '14px' }}>
              {isRtl ? 'أدوات التحكم الذكي بالمخزون والأسعار:' : 'Bulk Inventory & Price Controls:'}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* زر تعديل الأسعار جماعياً */}
            <button
              onClick={() => setShowBulkPriceModal(true)}
              style={{ padding: '8px 14px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              💰 {isRtl ? 'تعديل الأسعار جماعياً (%)' : 'Bulk Price %'}
            </button>

            {/* زر التراجع الفوري عن الأسعار */}
            {hasPriceBackup && (
              <button
                onClick={handleRollbackPrices}
                style={{ padding: '8px 14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ↩️ {isRtl ? 'تراجع عن آخر تعديل' : 'Undo Price Change'}
              </button>
            )}

            {/* زر تصدير Excel */}
            <button
              onClick={handleExportToExcel}
              style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📥 {isRtl ? 'تصدير نسخة إكسل' : 'Export Excel'}
            </button>

            {/* زر الحذف الجماعي لكامل المخزون */}
            <button
              onClick={() => { setBulkDeleteConfirmText(''); setShowBulkDeleteModal(true); }}
              style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🗑️ {isRtl ? 'حذف كافة المعروضات' : 'Bulk Delete All'}
            </button>
          </div>
        </div>
      )}

      {/* 💰 نافذة منبثقة: التعديل الجماعي للأسعار بالنسبة المئوية */}
      {showBulkPriceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
                💰 {isRtl ? 'أداة التعديل الجماعي للأسعار بالنسبة المئوية' : 'Bulk Price Percentage Modifier'}
              </h3>
              <button onClick={() => setShowBulkPriceModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
            </div>

            {/* فلاتر التحكم */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>نوع التعديل:</label>
                <select value={priceActionType} onChange={(e) => setPriceActionType(e.target.value as any)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontWeight: 'bold' }}>
                  <option value="increase">📈 زيادة بالأسعار (+)</option>
                  <option value="decrease">📉 تخفيض وخصم (-)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>النسبة المئوية (%):</label>
                <input type="number" min="1" max="100" value={pricePercentage} onChange={(e) => setPricePercentage(Number(e.target.value))} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontWeight: 'bold' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>بلد المنشأ / الوارد:</label>
                <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value="all">🌍 كل المصادر</option>
                  <option value="اليابان">🇯🇵 وارد اليابان</option>
                  <option value="كوريا">🇰🇷 وارد كوريا</option>
                  <option value="الصين">🇨🇳 وارد الصين</option>
                  <option value="تايوان">🇹🇼 وارد تايوان</option>
                  <option value="تايلاند">🇹🇭 وارد تايلاند</option>
                  <option value="أمريكا">🇺🇸 وارد أمريكا</option>
                  <option value="ألماني">🇩🇪 وارد ألمانيا</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>تخصيص الماركة:</label>
                <select value={filterMake} onChange={(e) => setFilterMake(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value="all">🚗 كل الماركات</option>
                  {availableMakes.map((m: any) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input type="checkbox" id="smartRound" checked={smartRounding} onChange={(e) => setSmartRounding(e.target.checked)} />
              <label htmlFor="smartRound" style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f3a5f', cursor: 'pointer' }}>
                ✨ التقريب الذكي (جبر الكسور لأقرب رقم صحيح)
              </label>
            </div>

            {/* جدول المعاينة والاستثناء */}
            <div style={{ border: '1px solid #cbd5e0', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', fontSize: '13px', fontWeight: 'bold', color: '#1f3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 معاينة التعديل على القطع ({getFilteredPartsForPricing().length} مشمولة)</span>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = getFilteredPartsForPricing();
                    const allSelected = filtered.every(p => selectedPartIdsForPrice[p.id]);
                    const nextMap = { ...selectedPartIdsForPrice };
                    filtered.forEach(p => { nextMap[p.id] = !allSelected; });
                    setSelectedPartIdsForPrice(nextMap);
                  }}
                  style={{ background: 'none', border: '1px solid #cbd5e0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                >
                  تحديد / إلغاء تحديد الكل
                </button>
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: isRtl ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px' }}>تحديد</th>
                      <th style={{ padding: '8px' }}>اسم القطعة</th>
                      <th style={{ padding: '8px' }}>الماركة</th>
                      <th style={{ padding: '8px' }}>السعر الحالي</th>
                      <th style={{ padding: '8px', color: '#16a34a' }}>السعر الجديد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPartsForPricing().map((p: any) => {
                      const oldPrice = Number(p.price || 0);
                      const newPrice = calculateNewPrice(oldPrice);
                      const isSelected = !!selectedPartIdsForPrice[p.id];

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? 'white' : '#f8fafc', opacity: isSelected ? 1 : 0.6 }}>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => setSelectedPartIdsForPrice(prev => ({ ...prev, [p.id]: e.target.checked }))}
                            />
                          </td>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.name}</td>
                          <td style={{ padding: '8px' }}>{p.make}</td>
                          <td style={{ padding: '8px', textDecoration: isSelected ? 'line-through' : 'none', color: '#64748b' }}>{oldPrice} ر.ق</td>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: priceActionType === 'increase' ? '#16a34a' : '#ea580c' }}>
                            {isSelected ? `${newPrice} ر.ق` : `${oldPrice} ر.ق`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleApplyBulkPriceChanges}
                disabled={isApplyingPriceChanges}
                style={{ flex: 1, padding: '13px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                {isApplyingPriceChanges ? 'جاري تطبيق الأسعار...' : '💾 اعتماد وتطبيق الأسعار الجديدة'}
              </button>
              <button
                type="button"
                onClick={() => setShowBulkPriceModal(false)}
                style={{ padding: '13px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ نافذة منبثقة: الحذف الجماعي الآمن للمخزون */}
      {showBulkDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', maxWidth: '480px', width: '100%', direction: isRtl ? 'rtl' : 'ltr', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '46px', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '19px', fontWeight: 'bold' }}>
              {isRtl ? 'تأكيد الحذف الجماعي لكافة المعروضات' : 'Confirm Bulk Inventory Delete'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
              {isRtl 
                ? `أنت على وشك حذف جميع القطع التابعة لكراجك (${myParts.length} قطعة) نهائياً من قاعدة البيانات. هذه العملية لا يمكن التراجع عنها.`
                : `You are about to delete all ${myParts.length} parts permanently.`}
            </p>

            <div style={{ marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '6px', color: '#1f3a5f' }}>
                {isRtl ? 'للتأكيد، اكتب كلمة "حذف" في المربع أدناه:' : 'To confirm, type "DELETE" below:'}
              </label>
              <input
                type="text"
                value={bulkDeleteConfirmText}
                onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                placeholder={isRtl ? 'اكتب كلمة: حذف' : 'Type: DELETE'}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '2px solid #ef4444', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                disabled={isBulkDeleting || (bulkDeleteConfirmText.trim() !== 'حذف' && bulkDeleteConfirmText.trim().toUpperCase() !== 'DELETE')}
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', opacity: (bulkDeleteConfirmText.trim() === 'حذف' || bulkDeleteConfirmText.trim().toUpperCase() === 'DELETE') ? 1 : 0.5 }}
              >
                {isBulkDeleting ? 'جاري المسح...' : '🗑️ حذف المخزون بالكامل'}
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
              <strong style={{ color: '#c2410c', fontSize: '14.5px', display: 'block', marginBottom: '2px' }}>
                {isRtl ? 'منطقة البيانات الخاصة والمؤمنة' : 'Secure Private Garage Data'}
              </strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#9a3412' }}>
                {isRtl ? 'ملاحظة: السجل التجاري ورقم التواصل الخاص وهيئة الحساب لا تظهر للزوار أو العملاء العامين. البيانات تستخدم فقط لعمليات التوثيق الإدارية لدى إدارة المنصة (Admin).' : 'Notice: Commercial registration and private contact details are visible to Admin only for compliance.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '35px' }}>
            <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              🏪 {isRtl ? 'تحديث بيانات ومقر الكراج' : 'Update Garage Profile & Location'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  {isRtl ? 'اسم الكراج التجاري / المعرض:' : 'Garage Name:'}
                </label>
                <input
                  type="text"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  {isRtl ? 'رقم السجل التجاري (CR Number):' : 'Commercial Reg. Number:'}
                </label>
                <input
                  type="text"
                  value={commercialReg}
                  onChange={(e) => setCommercialReg(e.target.value)}
                  placeholder="مثال: 123456"
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  {isRtl ? 'رقم هاتف الكراج المباشر:' : 'Garage Phone Number:'}
                </label>
                <input
                  type="text"
                  value={garagePhone}
                  onChange={(e) => setGaragePhone(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  {isRtl ? 'البريد الإلكتروني المعتمد:' : 'Official Garage Email:'}
                </label>
                <input
                  type="email"
                  value={garageEmail}
                  onChange={(e) => setGarageEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                  📍 {isRtl ? 'عنوان وموقع الكراج على الخريطة (يظهر للمندوب لتسلم الشحنة):' : 'Garage Google Maps Address:'}
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPSLocation}
                  style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🎯 تحديد موقعي التلقائي (GPS)
                </button>
              </div>
              <input
                type="text"
                value={garageAddress}
                onChange={(e) => setGarageAddress(e.target.value)}
                placeholder="مثال: الصناعية الشارع 24 أو رابط Google Maps..."
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                📝 {isRtl ? 'معلومات أو ملاحظات إضافية للإدارة:' : 'Additional Garage Notes:'}
              </label>
              <textarea
                rows={3}
                value={garageNotes}
                onChange={(e) => setGarageNotes(e.target.value)}
                placeholder="أوقات العمل، الماركات المتخصص بها..."
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
              />
            </div>

            <button
              type="submit"
              style={{ padding: '13px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer' }}
            >
              💾 {isRtl ? 'حفظ وتحديث بيانات الكراج' : 'Save Garage Details'}
            </button>
          </form>

          <form onSubmit={handleChangePassword} style={{ borderTop: '2px solid #f1f5f9', paddingTop: '25px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '17px' }}>
              🔑 {isRtl ? 'تغيير كلمة مرور الحساب' : 'Change Account Password'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  {isRtl ? 'كلمة المرور الجديدة:' : 'New Password:'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  {isRtl ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              style={{ padding: '12px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', maxWidth: '250px' }}
            >
              {isUpdatingPassword ? (isRtl ? 'جاري التحديث...' : 'Updating...') : (isRtl ? 'تحديث كلمة المرور 🔒' : 'Update Password 🔒')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px' }}>
          <PartFormModal 
            isRtl={isRtl} 
            editingPart={null} 
            FULL_CATEGORY_TREE={FULL_CATEGORY_TREE} 
            CATEGORY_TRANSLATIONS={CATEGORY_TRANSLATIONS} 
            carData={activeCarData} 
            years={activeYears} 
            supabaseUrl={supabaseUrl} 
            apiKey={apiKey} 
            session={session} 
            onSubmit={handlePublishSingle} 
            onCancel={() => setActiveTab('my_parts')} 
          />
        </div>
      )}

      {activeTab === 'my_parts' && (
        <MyPartsTab 
          isRtl={isRtl} 
          lang={lang} 
          myParts={myParts} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onOpenExcelModal={() => setShowExcelModal(true)} 
          onEditPart={(part) => { setEditingPart(part); setShowEditModal(true); }} 
          onDeletePart={handleDeletePart} 
          onQuickSaveInline={handleQuickSaveInline} 
        />
      )}

      {activeTab === 'inquiries' && (
        <FitmentInquiriesTab 
          isRtl={isRtl} 
          lang={lang} 
          myInquiries={myInquiries} 
          onSelectInquiry={(inquiry) => setSelectedInquiry(inquiry)} 
          onRejectInquiry={(inquiryId) => handleRejectFitment(inquiryId)} 
          onPreviewPart={(inquiry) => handlePreviewPart(inquiry)} 
        />
      )}

      {(activeTab === 'custom_requests' || activeTab === 'orders') && (
        <OrdersAndCustomTab 
          isRtl={isRtl} 
          lang={lang} 
          tabType={activeTab} 
          customRequests={customRequests} 
          myOrders={myOrders} 
          onSelectCustomRequest={() => {}} 
          onUpdateOrderStatus={handleUpdateOrderStatus} 
        />
      )}

      {previewPartDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1250, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '26px', borderRadius: '20px', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: isRtl ? 'rtl' : 'ltr' }}>
            <button onClick={() => setPreviewPartDetails(null)} style={{ position: 'absolute', top: '15px', [isRtl ? 'left' : 'right']: '15px', border: 'none', background: '#edf2f7', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>{isRtl ? 'معاينة وتفاصيل قطعة المعرض' : 'Part Details Preview'}</h3>
            <img src={previewPartDetails.image_url || previewPartDetails.part_image || 'https://via.placeholder.com/300'} alt={previewPartDetails.name || previewPartDetails.part_name} style={{ width: '100%', maxHeight: '230px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e0', marginBottom: '15px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#2d3748' }}>
              <AITranslatedText text={previewPartDetails.name || previewPartDetails.part_name} lang={lang} />
            </h4>
            {(previewPartDetails.part_number || previewPartDetails.code) && (
              <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>
                {isRtl ? 'رقم القطعة الأصلي:' : 'Part Number:'} <strong>{previewPartDetails.part_number || previewPartDetails.code}</strong>
              </div>
            )}
            {previewPartDetails.description && (
              <p style={{ fontSize: '13px', color: '#4a5568', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px', textAlign: isRtl ? 'right' : 'left' }}>
                {previewPartDetails.description}
              </p>
            )}
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dd6b20', marginBottom: '15px' }}>{previewPartDetails.price || previewPartDetails.part_price || 0} QAR</div>
            <button onClick={() => setPreviewPartDetails(null)} style={{ width: '100%', padding: '11px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'إغلاق المعاينة' : 'Close Preview'}</button>
          </div>
        </div>
      )}

      {selectedInquiry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1250, padding: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#16a34a', fontSize: '18px', fontWeight: 'bold' }}>{isRtl ? 'تأكيد التوافق وتحديد شروط الضمان' : 'Set Warranty Terms'}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              {isRtl ? `أنت تؤكد توافق هذه القطعة مع سيارة العميل: (${selectedInquiry.car_make || ''} ${selectedInquiry.car_model || ''})` : `Confirming fitment for ${selectedInquiry.car_make || ''}`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>1. {isRtl ? 'مهلة الإرجاع قبل/عند التركيب (أيام):' : 'Return Window (Days):'}</label>
                <select value={returnDays} onChange={(e) => setReturnDays(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}>
                  <option value={1}>{isRtl ? 'يوم واحد' : '1 Day'}</option>
                  <option value={3}>{isRtl ? '3 أيام (موصى به)' : '3 Days'}</option>
                  <option value={5}>{isRtl ? '5 أيام' : '5 Days'}</option>
                  <option value={7}>{isRtl ? '7 أيام' : '7 Days'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>2. {isRtl ? 'فترة ضمان التشغيل بعد التركيب (أيام):' : 'Operational Warranty Period:'}</label>
                <select value={warrantyDays} onChange={(e) => setWarrantyDays(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}>
                  <option value={7}>{isRtl ? '7 أيام' : '7 Days'}</option>
                  <option value={14}>{isRtl ? '14 يوماً (موصى به)' : '14 Days'}</option>
                  <option value={30}>{isRtl ? 'شهر كامل' : '1 Month'}</option>
                  <option value={90}>{isRtl ? '3 أشهر' : '3 Months'}</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleConfirmFitment} style={{ flex: 1, padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'تأكيد وإرسال للعميل 🚀' : 'Confirm & Send'}</button>
              <button onClick={() => setSelectedInquiry(null)} style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPart && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
                ✏️ تعديل بيانات القطعة رقم #{editingPart.id}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
            </div>
            <PartFormModal 
              isRtl={isRtl} 
              editingPart={editingPart} 
              FULL_CATEGORY_TREE={FULL_CATEGORY_TREE} 
              CATEGORY_TRANSLATIONS={CATEGORY_TRANSLATIONS} 
              carData={activeCarData} 
              years={activeYears} 
              supabaseUrl={supabaseUrl} 
              apiKey={apiKey} 
              session={session} 
              onSubmit={handlePublishSingle} 
              onCancel={() => setShowEditModal(false)} 
            />
          </div>
        </div>
      )}

      {showExcelModal && (
        <ExcelPartUploader 
          lang={lang} 
          supabaseUrl={supabaseUrl} 
          apiKey={apiKey} 
          session={session} 
          onClose={() => setShowExcelModal(false)} 
          onSuccess={() => { setShowExcelModal(false); fetchMyParts(); onSuccess(); }} 
        />
      )}

      {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default GarageDashboard;
