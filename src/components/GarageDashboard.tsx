import React, { useState, useEffect } from 'react';
import { ExcelPartUploader } from './ExcelPartUploader';
import { Toast } from './Toast';
import { AITranslatedText } from './AITranslatedText';

import { PartFormModal } from './garage/PartFormModal';
import { MyPartsTab } from './garage/MyPartsTab';
import { FitmentInquiriesTab } from './garage/FitmentInquiriesTab';
import { OrdersAndCustomTab } from './garage/OrdersAndCustomTab';

interface GarageProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
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

export const GarageDashboard: React.FC<GarageProps> = ({ lang, carData, years, supabaseUrl, apiKey, session, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'inquiries' | 'custom_requests' | 'orders'>('my_parts');
  
  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 🛠️ حالات نافذة التوافق والمعاينة المطلوبة
  const [previewPartDetails, setPreviewPartDetails] = useState<any | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [returnDays, setReturnDays] = useState<number>(3);
  const [warrantyDays, setWarrantyDays] = useState<number>(14);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || 'garage_unknown';
  const isRtl = lang === 'ar';

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
    fetchMyInquiries();
    fetchCustomRequests();
    // eslint-disable-next-line
  }, [userId]);

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?user_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyParts(await response.json());
    } catch (error) {}
  };

  const fetchMyOrders = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/orders?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyOrders(await response.json());
    } catch (error) {}
  };

  const fetchMyInquiries = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyInquiries(await response.json());
    } catch (error) {}
  };

  const fetchCustomRequests = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/custom_part_requests?order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setCustomRequests(await response.json());
    } catch (error) {}
  };

  // ⚡ تأكيد التوافق والضمان للطلب
  const handleConfirmFitment = async () => {
    if (!selectedInquiry) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed_compatible',
          return_days: returnDays,
          warranty_days: warrantyDays
        })
      });

      if (response.ok) {
        setToastMessage(isRtl ? 'تم تأكيد التوافق والضمان بنجاح ✅' : 'Fitment confirmed');
        setSelectedInquiry(null);
        fetchMyInquiries();
      }
    } catch (error) {
      console.error("Error confirming fitment:", error);
    }
  };

  // ❌ رفض طلب التوافق
  const handleRejectFitment = async (inquiryId: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد أن القطعة لا تركب على سيارة العميل؟' : 'Are you sure this part does not fit?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${inquiryId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        setToastMessage(isRtl ? 'تم رفض طلب التوافق' : 'Inquiry rejected');
        fetchMyInquiries();
      }
    } catch (error) {
      console.error("Error rejecting fitment:", error);
    }
  };

  const handlePublishSingle = async (formData: any) => {
    try {
      const isEditing = !!editingPart;
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing 
        ? `${supabaseUrl}/parts?id=eq.${editingPart.id}&user_id=eq.${userId}` 
        : `${supabaseUrl}/parts`;

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
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleQuickSaveInline = async (partId: number, price: string, stock: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${partId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(price) || 0, stock: parseInt(stock) || 0 })
      });
      if (response.ok) { setToastMessage('تم التحديث السريع بنجاح! ✅'); fetchMyParts(); onSuccess(); }
    } catch (err) {}
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) fetchMyOrders();
    } catch (error) {}
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 🚀 هيدر التبويبات المكتمل */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('my_parts')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'my_parts' ? '#1f3a5f' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          معروضاتي ({myParts.length})
        </button>
        <button onClick={() => { setEditingPart(null); setActiveTab('add_part'); }} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'add_part' ? '#1f3a5f' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          إضافة قطعة جديدة
        </button>
        <button onClick={() => setShowExcelModal(true)} style={{ padding: '12px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          📄 رفع إكسل
        </button>
        <button onClick={() => setActiveTab('custom_requests')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'custom_requests' ? '#e0872a' : 'transparent', color: activeTab === 'custom_requests' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          طلبات التسعير ({customRequests.length})
        </button>
        <button onClick={() => setActiveTab('inquiries')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'inquiries' ? '#805ad5' : 'transparent', color: activeTab === 'inquiries' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          فحص التوافق ({myInquiries.length})
        </button>
        <button onClick={() => setActiveTab('orders')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          الطلبات ({myOrders.length})
        </button>
      </div>

      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px' }}>
          <PartFormModal 
            isRtl={isRtl} 
            editingPart={null} 
            FULL_CATEGORY_TREE={FULL_CATEGORY_TREE} 
            CATEGORY_TRANSLATIONS={CATEGORY_TRANSLATIONS} 
            carData={carData} 
            years={years} 
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

      {/* 👈 تم إرسال الدوال الفعالة هنا ليعمل التفاعل بالكامل */}
      {activeTab === 'inquiries' && (
        <FitmentInquiriesTab 
          isRtl={isRtl} 
          lang={lang} 
          myInquiries={myInquiries} 
          onSelectInquiry={(inquiry) => setSelectedInquiry(inquiry)} 
          onRejectInquiry={(inquiryId) => handleRejectFitment(inquiryId)} 
          onPreviewPart={(inquiry) => setPreviewPartDetails(inquiry)} 
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

      {/* 🔍 1️⃣ نافذة معاينة بيانات القطعة بالتفصيل عند ضغط الكراج على الإعلان */}
      {previewPartDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1250, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '26px', borderRadius: '20px', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: isRtl ? 'rtl' : 'ltr' }}>
            <button onClick={() => setPreviewPartDetails(null)} style={{ position: 'absolute', top: '15px', [isRtl ? 'left' : 'right']: '15px', border: 'none', background: '#edf2f7', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>{isRtl ? 'معاينة وتفاصيل قطعة المعرض' : 'Part Details Preview'}</h3>
            <img src={previewPartDetails.part_image || previewPartDetails.image_url || 'https://via.placeholder.com/300'} alt={previewPartDetails.part_name} style={{ width: '100%', maxHeight: '230px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e0', marginBottom: '15px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#2d3748' }}>
              <AITranslatedText text={previewPartDetails.part_name} lang={lang} />
            </h4>
            {previewPartDetails.part_number && <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>{isRtl ? 'رقم القطعة الأصلي:' : 'Part Number:'} <strong>{previewPartDetails.part_number}</strong></div>}
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dd6b20', marginBottom: '15px' }}>{previewPartDetails.part_price || 0} QAR</div>
            <button onClick={() => setPreviewPartDetails(null)} style={{ width: '100%', padding: '11px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'إغلاق المعاينة' : 'Close Preview'}</button>
          </div>
        </div>
      )}

      {/* 🛡️ 2️⃣ نافذة تحديد فترة الضمان والإرجاع عند ضغط زر "تركب" */}
      {selectedInquiry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1250, padding: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#16a34a', fontSize: '18px', fontWeight: 'bold' }}>{isRtl ? 'تأكيد التوافق وتحديد شروط الضمان' : 'Set Warranty Terms'}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              {isRtl ? `أنت تؤكد توافق هذه القطعة مع سيارة العميل: (${selectedInquiry.car_make} ${selectedInquiry.car_model})` : `Confirming fitment for ${selectedInquiry.car_make}`}
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
              carData={carData} 
              years={years} 
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
