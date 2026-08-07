import React, { useState, useEffect } from 'react';
import { ExcelPartUploader } from './ExcelPartUploader';
import { Toast } from './Toast';

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
  "Engine": { ar: "المحرك ومكوناته", en: "Engine" }
};

const FULL_CATEGORY_TREE: Record<string, string[]> = {
  "Belt Drive": ["Belt", "Belt Tensioner"],
  "Cooling System": ["Radiator", "Radiator Fan Assembly"],
  "Engine": ["Oil Filter", "Piston"]
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
  const [uploadingImages, setUploadingImages] = useState(false);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || 'garage_unknown';
  const isRtl = lang === 'ar';

  useEffect(() => {
    fetchMyParts();
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
        image_url: formData.partImages[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
        additional_images: formData.partImages,
        description: formData.partDescription || null,
        warranty: formData.partWarranty || null,
        interchange_numbers: formData.interchangeNumbers || null,
        position: formData.partPosition || null,
        weight_kg: parseFloat(formData.partWeight) || null,
        pin_count: parseInt(formData.partPinCount) || null,
        user_id: userId
      };

      const response = await fetch(url, {
        method,
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToastMessage(isEditing ? 'تم الحفظ ✅' : 'تم النشر للبيع ✅');
        setShowEditModal(false);
        setEditingPart(null);
        fetchMyParts();
        onSuccess();
        setActiveTab('my_parts');
      }
    } catch (err) {}
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* هيدر التبويبات */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px' }}>
        <button onClick={() => setActiveTab('my_parts')} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'my_parts' ? '#1f3a5f' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold' }}>
          معروضاتي ({myParts.length})
        </button>
        <button onClick={() => { setEditingPart(null); setActiveTab('add_part'); }} style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'add_part' ? '#1f3a5f' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', borderRadius: '10px', fontWeight: 'bold' }}>
          إضافة قطعة جديدة
        </button>
      </div>

      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px' }}>
          <PartFormModal isRtl={isRtl} editingPart={null} FULL_CATEGORY_TREE={FULL_CATEGORY_TREE} CATEGORY_TRANSLATIONS={CATEGORY_TRANSLATIONS} carData={carData} years={years} onSubmit={handlePublishSingle} onCancel={() => setActiveTab('my_parts')} uploadingImages={uploadingImages} onUploadImages={() => {}} />
        </div>
      )}

      {activeTab === 'my_parts' && (
        <MyPartsTab isRtl={isRtl} lang={lang} myParts={myParts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenExcelModal={() => setShowExcelModal(true)} onEditPart={(part) => { setEditingPart(part); setShowEditModal(true); }} onDeletePart={() => {}} onQuickSaveInline={() => {}} />
      )}

      {showEditModal && editingPart && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', maxWidth: '650px', width: '100%' }}>
            <PartFormModal isRtl={isRtl} editingPart={editingPart} FULL_CATEGORY_TREE={FULL_CATEGORY_TREE} CATEGORY_TRANSLATIONS={CATEGORY_TRANSLATIONS} carData={carData} years={years} onSubmit={handlePublishSingle} onCancel={() => setShowEditModal(false)} uploadingImages={uploadingImages} onUploadImages={() => {}} />
          </div>
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default GarageDashboard;
