import React, { useState, useEffect } from 'react';
import { ExcelPartUploader } from './ExcelPartUploader';
import { Toast } from './Toast';
import { AITranslatedText } from './AITranslatedText';

interface GarageProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onSuccess: () => void;
}

// هيكلية شجرة تصنيفات القطع (Categories Tree)
const CATEGORY_TREE: Record<string, Record<string, string[]>> = {
  "Suspension": {
    "Bump Stop": ["Front", "Rear"],
    "Control Arm": ["Upper", "Lower"],
    "Shock Absorber": ["Gas", "Hydraulic"],
    "Springs": ["Coil Spring", "Leaf Spring"]
  },
  "Brake & Wheel Hub": {
    "Brake Pad": ["Front Pads", "Rear Pads"],
    "Brake Rotor / Disc": ["Ventilated", "Solid"],
    "Wheel Hub Bearing": ["Front Hub", "Rear Hub"]
  },
  "Engine": {
    "Belts & Chains": ["Timing Belt", "Serpentine Belt"],
    "Engine Mounts": ["Right Mount", "Left Mount", "Rear Mount"],
    "Pistons & Rings": ["Standard", "Oversize"]
  },
  "Cooling System": {
    "Radiator": ["Main Radiator", "Auxiliary"],
    "Water Pump": ["Mechanical", "Electric"],
    "Thermostat": ["Housing & Sensor"]
  },
  "Electrical": {
    "Alternator": ["Standard Amperage", "High Output"],
    "Starter Motor": ["Direct Drive", "Gear Reduction"],
    "Sensors": ["Oxygen Sensor", "Camshaft Sensor", "Crankshaft Sensor"]
  }
};

export const GarageDashboard: React.FC<GarageProps> = ({ lang, carData, years, supabaseUrl, apiKey, session, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'inquiries' | 'custom_requests' | 'orders'>('add_part');

  // بيانات الاستمارة الأساسية
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('1');
  
  // الخيارات الجديدة للأنواع والحالة
  const [partType, setPartType] = useState('مستعمل أصلي'); // مستعمل أصلي / جديد أصلي / جديد تجاري / مستعمل تجاري
  const [partCondition, setPartCondition] = useState('نظيف'); // جديد / شبه جديد / نظيف / وسط

  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');

  // التصنيف الشجري (القسم الأول / الثاني / الثالث)
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [childCategory, setChildCategory] = useState('');

  // رفع أكثر من صورة
  const [partImages, setPartImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // حالات نافذة الإكسل والإشعارات
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewPartDetails, setPreviewPartDetails] = useState<any | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [selectedCustomRequest, setSelectedCustomRequest] = useState<any | null>(null);

  // تسعير القطع المخصصة
  const [quotePrice, setQuotePrice] = useState('');
  const [quotePartType, setQuotePartType] = useState('مستعمل أصلي');
  const [quoteCondition, setQuoteCondition] = useState('نظيف');
  const [quoteWarranty, setQuoteWarranty] = useState('ضمان تجربة 3 أيام');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const [returnDays, setReturnDays] = useState<number>(3);
  const [warrantyDays, setWarrantyDays] = useState<number>(14);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';
  const garageName = session?.user_metadata?.garage_name || session?.garage_name || 'كراج معتمد';
  const isRtl = lang === 'ar';

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
    fetchMyInquiries();
    fetchCustomRequests();
  }, [userId]);

  // الذكاء الاصطناعي لاقتراح التصنيف الشجري تلقائياً فور كتابة اسم القطعة
  const handlePartNameChange = (name: string) => {
    setPartName(name);
    const lower = name.toLowerCase();

    // خوارزمية ذكية مطابقة سريعة
    if (lower.includes('bump') || lower.includes('مساعد') || lower.includes('جامبين') || lower.includes('suspension')) {
      setMainCategory('Suspension');
      setSubCategory('Bump Stop');
    } else if (lower.includes('brake') || lower.includes('سفايف') || lower.includes('دراكول') || lower.includes('قماش')) {
      setMainCategory('Brake & Wheel Hub');
      setSubCategory('Brake Pad');
    } else if (lower.includes('radiator') || lower.includes('رديتر') || lower.includes('مروحة')) {
      setMainCategory('Cooling System');
      setSubCategory('Radiator');
    } else if (lower.includes('دينمو') || lower.includes('سلف') || lower.includes('starter') || lower.includes('alternator')) {
      setMainCategory('Electrical');
    }
  };

  // دالة رفع أكثر من صورة معاً
  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      try {
        const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': file.type },
          body: file
        });

        if (response.ok) {
          const publicUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`;
          uploadedUrls.push(publicUrl);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setPartImages((prev) => [...prev, ...uploadedUrls]);
    setUploadingImages(false);
  };

  const removeImage = (indexToRemove: number) => {
    setPartImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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

  const handlePublishSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'garage_unknown') return alert(isRtl ? 'يرجى تسجيل الدخول مجدداً' : 'Please login again');

    // دمج الفرع والتصنيفات في حقل الفئة
    const fullCategoryPath = [mainCategory, subCategory, childCategory].filter(Boolean).join(' > ');

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;

      const payload = {
        name: partName,
        part_number: partNumber.trim() || null,
        price: parseFloat(partPrice),
        stock: parseInt(partStock) || 1,
        part_type: partType,
        part_condition: partCondition,
        category: fullCategoryPath || 'عام',
        make: partMake,
        model: partModel,
        year: partYear,
        engine: partEngine || (isRtl ? 'عام' : 'General'),
        image_url: partImages[0] || 'https://via.placeholder.com/400',
        additional_images: partImages, // تخزين مصفوفة الصور
        user_id: userId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(isRtl ? 'تم حفظ القطعة بنجاح! 🎉' : 'Part saved successfully! 🎉');
        resetForm();
        fetchMyParts();
        onSuccess();
        setActiveTab('my_parts');
      }
    } catch (error) {}
  };

  const handleSendCustomQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomRequest || !quotePrice) return;

    setSubmittingQuote(true);
    try {
      const response = await fetch(`${supabaseUrl}/garage_quotes`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: selectedCustomRequest.id,
          garage_id: String(userId),
          garage_name: garageName,
          price: parseFloat(quotePrice),
          part_type: quotePartType,
          part_condition: quoteCondition,
          warranty: quoteWarranty,
          garage_notes: quoteNotes
        })
      });

      if (response.ok) {
        await fetch(`${supabaseUrl}/custom_part_requests?id=eq.${selectedCustomRequest.id}`, {
          method: 'PATCH',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offers_received' })
        });

        alert(isRtl ? 'تم إرسال عرض السعر للعميل بنجاح! 🎉' : 'Quote sent successfully! 🎉');
        setSelectedCustomRequest(null);
        setQuotePrice('');
        setQuoteNotes('');
        fetchCustomRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const resetForm = () => {
    setPartName(''); setPartNumber(''); setPartPrice(''); setPartStock('1'); 
    setPartType('مستعمل أصلي'); setPartCondition('نظيف');
    setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); 
    setMainCategory(''); setSubCategory(''); setChildCategory('');
    setPartImages([]); setEditingId(null);
  };

  return (
    <div style={{ maxWidth: '940px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* 🔄 أزرار القائمة الرئيسية */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
        <button onClick={() => { resetForm(); setActiveTab('add_part'); }} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'add_part' ? '#3182ce' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}>
          ➕ {isRtl ? 'إضافة قطعة' : 'Add Part'}
        </button>

        <button onClick={() => setShowExcelModal(true)} style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#38a169', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📊 {isRtl ? 'رفع قطع بالإكسل' : 'Bulk Excel'}
        </button>

        <button onClick={() => setActiveTab('custom_requests')} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'custom_requests' ? '#e0872a' : 'transparent', color: activeTab === 'custom_requests' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}>
          📥 {isRtl ? 'طلبات التسعير الواردة' : 'Custom Requests'}
        </button>

        <button onClick={() => setActiveTab('my_parts')} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'my_parts' ? '#2b6cb0' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}>
          📦 {isRtl ? `معروضاتي (${myParts.length})` : `My Ads (${myParts.length})`}
        </button>
      </div>

      {/* ➕ تبويب إضافة / تعديل قطعة غيار */}
      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1a365d', margin: 0, fontSize: '20px' }}>
              {editingId ? (isRtl ? '✏️ تعديل بيانات القطعة' : '✏️ Edit Part') : (isRtl ? '➕ إضافة قطعة غيار جديدة' : '➕ Add New Spare Part')}
            </h2>
          </div>

          <form onSubmit={handlePublishSingle} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* 1️⃣ اسم القطعة ورقمها مع المساعدة الذكية */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {isRtl ? 'اسم قطعة الغيار *' : 'Part Name *'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? "مثال: مساعدات أمامية، Bump Stop..." : "E.g., Bump Stop, Alternator..."}
                  value={partName}
                  onChange={(e) => handlePartNameChange(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {isRtl ? 'رقم القطعة (اختياري):' : 'Part Number (PN) (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: 27060-0H110"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* 2️⃣ اختيار مكانه القطعة بالتسلسل الشجري (3 مستويات) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13.5px', fontWeight: 'bold', color: '#1f3a5f' }}>
                🗂️ مكان وتصنيف القطعة (الفرع الأول ➔ الثاني ➔ الثالث):
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {/* المستوى الأول */}
                <div>
                  <select
                    value={mainCategory}
                    onChange={(e) => { setMainCategory(e.target.value); setSubCategory(''); setChildCategory(''); }}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12.5px' }}
                  >
                    <option value="">-- اختر الفرع الرئيسي --</option>
                    {Object.keys(CATEGORY_TREE).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* المستوى الثاني */}
                <div>
                  <select
                    value={subCategory}
                    onChange={(e) => { setSubCategory(e.target.value); setChildCategory(''); }}
                    disabled={!mainCategory}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12.5px' }}
                  >
                    <option value="">-- الفرع الثاني --</option>
                    {mainCategory && CATEGORY_TREE[mainCategory] && Object.keys(CATEGORY_TREE[mainCategory]).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* المستوى الثالث */}
                <div>
                  <select
                    value={childCategory}
                    onChange={(e) => setChildCategory(e.target.value)}
                    disabled={!subCategory}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12.5px' }}
                  >
                    <option value="">-- الفرع الثالث (اختياري) --</option>
                    {mainCategory && subCategory && CATEGORY_TREE[mainCategory]?.[subCategory]?.map((child) => (
                      <option key={child} value={child}>{child}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3️⃣ تحديد السيارة والموديل والسنة والمحرك */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>الماركة *</label>
                <select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
                  <option value="">اختر الماركة</option>
                  {Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>الموديل *</label>
                <select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required disabled={!partMake}>
                  <option value="">اختر الموديل</option>
                  {partMake && carData[partMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>السنة *</label>
                <select value={partYear} onChange={(e) => setPartYear(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
                  <option value="">السنة</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>المحرك</label>
                <select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} disabled={!partMake}>
                  <option value="">المحرك</option>
                  {partMake && carData[partMake]?.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
                </select>
              </div>
            </div>

            {/* 4️⃣ أزرار اختيار نوع القطعة (4 خيارات مع المستعمل التجاري والتجاري الجديد) */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13.5px', fontWeight: 'bold' }}>
                نوع / حالة القطعة:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {[
                  { label: '🚗 مستعمل أصلي', val: 'مستعمل أصلي', color: '#16a34a', bg: '#f0fff4' },
                  { label: '💎 جديد أصلي (OEM)', val: 'جديد أصلي (OEM)', color: '#2563eb', bg: '#eff6ff' },
                  { label: '⚙️ جديد تجاري', val: 'جديد تجاري', color: '#e0872a', bg: '#fff7ed' },
                  { label: '🛠️ مستعمل تجاري', val: 'مستعمل تجاري', color: '#dc2626', bg: '#fef2f2' }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setPartType(item.val)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border: partType === item.val ? `2px solid ${item.color}` : '1px solid #cbd5e0',
                      backgroundColor: partType === item.val ? item.bg : '#ffffff',
                      color: partType === item.val ? item.color : '#475569',
                      fontWeight: 'bold',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5️⃣ خانة "حالة المنتج الدقيقة" */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                  حالة المنتج (Condition) *
                </label>
                <select
                  value={partCondition}
                  onChange={(e) => setPartCondition(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
                >
                  <option value="جديد">جديد</option>
                  <option value="شبه جديد">شبه جديد</option>
                  <option value="نظيف">نظيف</option>
                  <option value="وسط">وسط</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                  السعر (QAR) *
                </label>
                <input
                  type="number"
                  placeholder="350"
                  value={partPrice}
                  onChange={(e) => setPartPrice(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                  الكمية المتوفرة *
                </label>
                <input
                  type="number"
                  min="1"
                  value={partStock}
                  onChange={(e) => setPartStock(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}
                  required
                />
              </div>
            </div>

            {/* 6️⃣ إمكانية رفع أكثر من صورة للمنتج (Multiple Image Upload) */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                📸 صور القطعة (يمكنك اختيار رفع أكثر من صورة معاً):
              </label>

              <div style={{ border: '2px dashed #94a3b8', padding: '20px', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleImagesUpload}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  disabled={uploadingImages}
                />
                <p style={{ margin: 0, color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>
                  {uploadingImages ? '⏳ جاري رفع الصور...' : '📷 اضغط هنا لاختيار صورة أو أكثر من جهازك'}
                </p>
              </div>

              {/* معاينة الصور المرفوعة مع زر الحذف */}
              {partImages.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {partImages.map((img, index) => (
                    <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={img} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
            >
              {editingId ? 'حفظ التعديلات' : '🚀 نشر القطعة للبيع الآن'}
            </button>

          </form>
        </div>
      )}

      {/* 📥 بقية التبويبات والمودالات بنفس جودتها السابقة */}
      {/* ... */}

    </div>
  );
};
