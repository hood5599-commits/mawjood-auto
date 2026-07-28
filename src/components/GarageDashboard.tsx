import React, { useState, useEffect, useRef } from 'react';

interface GarageProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onSuccess: () => void;
}

export const GarageDashboard: React.FC<GarageProps> = ({ lang, carData, years, supabaseUrl, apiKey, session, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'inquiries' | 'orders'>('add_part');

  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('1');
  const [partType, setPartType] = useState('مستعمل أصلي');
  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');
  const [partImg, setPartImg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewPartDetails, setPreviewPartDetails] = useState<any | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [returnDays, setReturnDays] = useState<number>(3);
  const [warrantyDays, setWarrantyDays] = useState<number>(14);

  const previousInquiriesCount = useRef<number>(0);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';
  const isRtl = lang === 'ar';

  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
    fetchMyInquiries();

    const interval = setInterval(() => {
      fetchMyInquiries();
      fetchMyOrders();
    }, 15000);

    return () => clearInterval(interval);
  }, [session]);

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
      if (response.ok) {
        const data = await response.json();
        // تصفية الاستفسارات التي تم شراؤها مسبقاً من العداد
        const activePending = data.filter((item: any) => item.status === 'pending_check');
        if (activePending.length > previousInquiriesCount.current && previousInquiriesCount.current !== 0) {
          playChimeSound();
        }
        previousInquiriesCount.current = activePending.length;
        setMyInquiries(data);
      }
    } catch (error) {}
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingImage(true);
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
        setPartImg(`${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`);
        alert(lang === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
      }
    } catch (error) {} finally {
      setUploadingImage(false);
    }
  };

  const handlePublishSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'garage_unknown') return alert('Please login again');
    
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;
      
      const payload = { 
        name: partName, 
        part_number: partNumber.trim() || null, 
        price: parseFloat(partPrice), 
        stock: parseInt(partStock) || 1, 
        part_type: partType,
        make: partMake, 
        model: partModel, 
        year: partYear, 
        engine: partEngine || 'عام', 
        image_url: partImg || 'https://via.placeholder.com/400', 
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
        alert(lang === 'ar' ? 'تم حفظ القطعة بنجاح! 🎉' : 'Part saved successfully!');
        resetForm();
        fetchMyParts();
        onSuccess();
        setActiveTab('my_parts');
      }
    } catch (error) {}
  };

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
        alert(lang === 'ar' ? 'تم تأكيد التوافق وإرسال مهلة الضمان للعميل بنجاح! ✅' : 'Fitment confirmed!');
        setSelectedInquiry(null);
        fetchMyInquiries();
      }
    } catch (error) {}
  };

  const handleRejectFitment = async (inquiryId: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد أن القطعة لا تركب على سيارة العميل؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${inquiryId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) fetchMyInquiries();
    } catch (error) {}
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم تحديث حالة الطلب بنجاح! 🚀' : 'Status updated!');
        fetchMyOrders();
      }
    } catch (error) {}
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleEdit = (part: any) => {
    setPartName(part.name); setPartNumber(part.part_number || ''); setPartPrice(part.price ? part.price.toString() : ''); 
    setPartStock((part.stock ?? 1).toString()); setPartType(part.part_type || 'مستعمل أصلي'); setPartMake(part.make); 
    setPartModel(part.model || ''); setPartYear(part.year); setPartEngine(part.engine || ''); setPartImg(part.image_url); 
    setEditingId(part.id); setActiveTab('add_part'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { 
    setPartName(''); setPartNumber(''); setPartPrice(''); setPartStock('1'); setPartType('مستعمل أصلي'); 
    setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); setPartImg(''); setEditingId(null); 
  };

  // استبعاد الاستفسارات التي تم شراؤها بالكامل من الشاشة الرئيسية
  const activeInquiriesList = myInquiries.filter(i => i.status !== 'ordered');
  const pendingInquiriesCount = myInquiries.filter(i => i.status === 'pending_check').length;

  return (
    <>
      <style>{`
        .mwj-gd-wrap {
          max-width: 900px; margin: 30px auto; display: flex; flex-direction: column;
          gap: 24px; font-family: 'Cairo', 'Segoe UI', sans-serif;
        }

        .mwj-gd-tabbar {
          display: flex; gap: 8px; background: white; padding: 10px;
          border-radius: 18px; box-shadow: 0 6px 20px rgba(15,23,32,0.06);
          flex-wrap: wrap;
        }
        .mwj-gd-tab {
          flex: 1; min-width: 130px; padding: 13px; border-radius: 12px; border: none;
          font-weight: 800; cursor: pointer; font-size: 13.5px; position: relative;
          background: transparent; color: #4a5568; transition: all 0.2s ease;
        }
        .mwj-gd-tab:hover { background: #f7fafc; }
        .mwj-gd-tab-add-active { background: linear-gradient(135deg, #1F3A5F 0%, #16304f 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(31,58,95,0.28); }
        .mwj-gd-tab-inquiries-active { background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(107,70,193,0.28); }
        .mwj-gd-tab-parts-active { background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(34,163,90,0.28); }
        .mwj-gd-tab-orders-active { background: linear-gradient(135deg, #E0872A 0%, #c9701c 100%) !important; color: #0F1720 !important; box-shadow: 0 6px 16px rgba(224,135,42,0.28); }

        .mwj-gd-badge {
          position: absolute; top: 4px; background: #e53e3e; color: white;
          font-size: 10.5px; padding: 2px 7px; border-radius: 10px; font-weight: 800;
          animation: mwj-gd-pulse 1.8s infinite;
        }
        @keyframes mwj-gd-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(229,62,62,0.5); } 50% { box-shadow: 0 0 0 5px rgba(229,62,62,0); } }

        .mwj-gd-panel {
          background: white; padding: 32px; border-radius: 20px;
          box-shadow: 0 10px 32px rgba(15,23,32,0.06);
        }
        .mwj-gd-panel-title {
          color: #16304f; margin: 0 0 22px 0; border-bottom: 2px solid #f1f5f9;
          padding-bottom: 12px; font-size: 19px; font-weight: 800;
        }

        .mwj-gd-form { display: flex; flex-direction: column; gap: 20px; }
        .mwj-gd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mwj-gd-label { display: block; margin-bottom: 7px; font-size: 13.5px; font-weight: 700; color: #334155; }
        .mwj-gd-input, .mwj-gd-select {
          width: 100%; padding: 12px 13px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          box-sizing: border-box; font-size: 14px; font-family: inherit; color: #1F3A5F;
          transition: border-color 0.18s ease, box-shadow 0.18s ease; background: white;
        }
        .mwj-gd-input:focus, .mwj-gd-select:focus {
          outline: none; border-color: #E0872A; box-shadow: 0 0 0 3px rgba(224,135,42,0.14);
        }
        .mwj-gd-select:disabled { background: #f8fafc; cursor: not-allowed; }

        .mwj-gd-type-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .mwj-gd-type-btn {
          flex: 1; min-width: 140px; padding: 13px; border-radius: 12px; font-weight: 800;
          font-size: 13px; cursor: pointer; transition: all 0.2s ease; background: #f7fafc;
          border: 1.5px solid #e2e8f0; color: #4a5568;
        }
        .mwj-gd-type-btn:hover { transform: translateY(-1px); }

        .mwj-gd-dropzone {
          border: 2px dashed #cbd5e0; padding: 26px; border-radius: 14px; text-align: center;
          background: #f8fafc; position: relative; transition: all 0.2s ease; overflow: hidden;
        }
        .mwj-gd-dropzone:hover { border-color: #E0872A; background: #fffaf3; }
        .mwj-gd-dropzone input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .mwj-gd-dropzone p { margin: 0; color: #4a5568; font-weight: 700; font-size: 13.5px; }

        .mwj-gd-submit {
          width: 100%; padding: 15px; border: none; border-radius: 13px;
          font-weight: 800; font-size: 15.5px; cursor: pointer; color: white;
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .mwj-gd-submit:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-gd-submit-new { background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%); box-shadow: 0 8px 20px rgba(34,163,90,0.3); }
        .mwj-gd-submit-edit { background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%); box-shadow: 0 8px 20px rgba(49,130,206,0.3); }

        .mwj-gd-empty { text-align: center; color: #94a3b8; padding: 40px 0; font-size: 14px; }

        /* Inquiry cards */
        .mwj-gd-inq-card { padding: 20px; border-radius: 16px; transition: all 0.2s ease; }
        .mwj-gd-inq-pending { border: 2px solid #7c5fd0; background: linear-gradient(135deg, #faf5ff 0%, #f4ecff 100%); }
        .mwj-gd-inq-resolved { border: 1px solid #e2e8f0; background: #f8fafc; }

        .mwj-gd-inq-code {
          font-size: 11.5px; font-weight: 800; background: #e9d8fd; color: #553c9a;
          padding: 4px 10px; border-radius: 7px;
        }
        .mwj-gd-inq-status { font-size: 13px; font-weight: 800; }

        .mwj-gd-inq-preview {
          display: flex; gap: 12px; align-items: center; background: white; padding: 13px;
          border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s ease;
        }
        .mwj-gd-inq-preview:hover { border-color: #E0872A; box-shadow: 0 4px 14px rgba(224,135,42,0.12); }
        .mwj-gd-preview-tag { font-size: 11px; color: #3182ce; background: #ebf8ff; padding: 2px 7px; border-radius: 6px; font-weight: 800; }

        .mwj-gd-inq-vehicle { background: white; padding: 13px; border-radius: 12px; border: 1px solid #edf2f7; }

        .mwj-gd-doc-thumb img {
          width: 82px; height: 82px; object-fit: cover; border-radius: 10px;
          border: 1px solid #cbd5e0; transition: transform 0.2s ease;
        }
        .mwj-gd-doc-thumb:hover img { transform: scale(1.05); }

        .mwj-gd-inq-actions { display: flex; gap: 10px; }
        .mwj-gd-btn-confirm, .mwj-gd-btn-reject {
          flex: 1; padding: 11px; border: none; border-radius: 10px; font-weight: 800;
          cursor: pointer; font-size: 13.5px; color: white; transition: all 0.2s ease;
        }
        .mwj-gd-btn-confirm { background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%); box-shadow: 0 6px 14px rgba(34,163,90,0.28); }
        .mwj-gd-btn-reject { background: linear-gradient(135deg, #e05252 0%, #c53030 100%); box-shadow: 0 6px 14px rgba(229,62,62,0.28); }
        .mwj-gd-btn-confirm:hover, .mwj-gd-btn-reject:hover { transform: translateY(-2px); filter: brightness(1.05); }

        /* Modals */
        .mwj-gd-overlay {
          position: fixed; inset: 0; background: rgba(15,23,32,0.68); backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px;
          animation: mwj-gd-fade 0.18s ease;
        }
        @keyframes mwj-gd-fade { from { opacity: 0; } to { opacity: 1; } }
        .mwj-gd-modal {
          background: white; padding: 26px; border-radius: 20px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3); position: relative;
          animation: mwj-gd-modal-in 0.2s ease;
        }
        @keyframes mwj-gd-modal-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .mwj-gd-modal-close {
          position: absolute; top: 15px; border: none; background: #f1f5f9; border-radius: 50%;
          width: 32px; height: 32px; cursor: pointer; font-weight: 800; color: #64748b;
          transition: all 0.18s ease;
        }
        .mwj-gd-modal-close:hover { background: #e2e8f0; color: #1F3A5F; transform: rotate(90deg); }

        .mwj-gd-warranty-btn {
          flex: 1; padding: 13px; border: none; border-radius: 12px; font-weight: 800;
          cursor: pointer; font-size: 14px; color: white;
          background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%);
          box-shadow: 0 8px 20px rgba(34,163,90,0.3); transition: all 0.2s ease;
        }
        .mwj-gd-warranty-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-gd-cancel-btn {
          padding: 13px 22px; background: #f1f5f9; color: #4a5568; border: none;
          border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.18s ease;
        }
        .mwj-gd-cancel-btn:hover { background: #e2e8f0; }

        /* My Parts list */
        .mwj-gd-part-row {
          display: flex; justify-content: space-between; align-items: center; padding: 16px;
          border: 1px solid #eef1f5; border-radius: 14px; margin-bottom: 12px; background: #f8fafc;
          transition: all 0.2s ease; flex-wrap: wrap; gap: 12px;
        }
        .mwj-gd-part-row:hover { border-color: rgba(224,135,42,0.25); box-shadow: 0 6px 18px rgba(15,23,32,0.06); }
        .mwj-gd-part-row-img { width: 62px; height: 62px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
        .mwj-gd-part-edit-btn, .mwj-gd-part-del-btn {
          padding: 9px 15px; border-radius: 9px; cursor: pointer; font-weight: 800; font-size: 13px;
          transition: all 0.18s ease; border: 1.5px solid transparent;
        }
        .mwj-gd-part-edit-btn { background: #ebf8ff; color: #2b6cb0; border-color: #bee3f8; }
        .mwj-gd-part-edit-btn:hover { background: #dbeefd; transform: translateY(-1px); }
        .mwj-gd-part-del-btn { background: #fff5f5; color: #e53e3e; border-color: #fed7d7; }
        .mwj-gd-part-del-btn:hover { background: #fee2e2; transform: translateY(-1px); }

        /* Orders */
        .mwj-gd-order-card {
          padding: 20px; border: 1px solid #eef1f5; border-radius: 16px; margin-bottom: 15px;
          background: #f8fafc; transition: all 0.2s ease;
        }
        .mwj-gd-order-card:hover { box-shadow: 0 6px 20px rgba(15,23,32,0.06); }
        .mwj-gd-order-code { font-size: 11px; font-weight: 800; color: #3182ce; background: #ebf8ff; padding: 3px 9px; border-radius: 6px; display: inline-block; margin-bottom: 7px; }
        .mwj-gd-order-info { background: white; padding: 13px; border-radius: 10px; border: 1px solid #edf2f7; font-size: 13px; color: #4a5568; margin-bottom: 13px; }
        .mwj-gd-maps-link {
          display: inline-block; margin-top: 6px; background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%);
          color: white; padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 800;
          text-decoration: none; transition: all 0.18s ease;
        }
        .mwj-gd-maps-link:hover { transform: translateY(-1px); filter: brightness(1.08); }

        .mwj-gd-status-btn-prep {
          width: 100%; padding: 12px; border: none; border-radius: 10px; cursor: pointer;
          font-weight: 800; font-size: 13.5px; color: white;
          background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%);
          box-shadow: 0 6px 16px rgba(34,163,90,0.28); transition: all 0.2s ease;
        }
        .mwj-gd-status-btn-prep:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-gd-status-ready { padding: 9px; background: #f0fff4; color: #276749; border-radius: 8px; text-align: center; font-weight: 800; font-size: 12.5px; border: 1px solid #c6f6d5; }
        .mwj-gd-status-btn-driver {
          width: 100%; padding: 12px; border: none; border-radius: 10px; cursor: pointer;
          font-weight: 800; font-size: 13.5px; color: white;
          background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%);
          box-shadow: 0 6px 16px rgba(49,130,206,0.28); transition: all 0.2s ease;
        }
        .mwj-gd-status-btn-driver:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-gd-status-done { padding: 11px; background: #ebf8ff; color: #2b6cb0; border-radius: 10px; text-align: center; font-weight: 800; font-size: 13px; border: 1px solid #bee3f8; }

        @media (max-width: 700px) {
          .mwj-gd-wrap { margin: 16px auto; padding: 0 12px; }
          .mwj-gd-panel { padding: 20px; border-radius: 16px; }
          .mwj-gd-grid-2 { grid-template-columns: 1fr; }
          .mwj-gd-type-row { flex-direction: column; }
          .mwj-gd-tab { min-width: 100%; }
          .mwj-gd-inq-actions { flex-direction: column; }
          .mwj-gd-part-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="mwj-gd-wrap" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

        <div className="mwj-gd-tabbar">
          <button onClick={() => { resetForm(); setActiveTab('add_part'); }} className={`mwj-gd-tab ${activeTab === 'add_part' ? 'mwj-gd-tab-add-active' : ''}`}>
            ➕ {lang === 'ar' ? 'إضافة قطعة غيار' : 'Add New Part'}
          </button>

          <button onClick={() => setActiveTab('inquiries')} className={`mwj-gd-tab ${activeTab === 'inquiries' ? 'mwj-gd-tab-inquiries-active' : ''}`}>
            ❓ {lang === 'ar' ? 'فحص التوافق' : 'Fitment Check'}
            {pendingInquiriesCount > 0 && (
              <span className="mwj-gd-badge" style={{ [isRtl ? 'right' : 'left']: '10px' }}>🔴 {pendingInquiriesCount}</span>
            )}
          </button>

          <button onClick={() => setActiveTab('my_parts')} className={`mwj-gd-tab ${activeTab === 'my_parts' ? 'mwj-gd-tab-parts-active' : ''}`}>
            📦 {lang === 'ar' ? `إعلاناتي (${myParts.length})` : `My Ads (${myParts.length})`}
          </button>

          <button onClick={() => setActiveTab('orders')} className={`mwj-gd-tab ${activeTab === 'orders' ? 'mwj-gd-tab-orders-active' : ''}`}>
            📥 {lang === 'ar' ? `الطلبات (${myOrders.length})` : `Orders (${myOrders.length})`}
          </button>
        </div>

        {activeTab === 'add_part' && (
          <div className="mwj-gd-panel">
            <h2 className="mwj-gd-panel-title">
              {editingId ? (lang === 'ar' ? '✏️ تعديل بيانات القطعة' : '✏️ Edit Part') : (lang === 'ar' ? '➕ إضافة قطعة غيار جديدة' : '➕ Add New Part')}
            </h2>

            <form onSubmit={handlePublishSingle} className="mwj-gd-form">
              <div className="mwj-gd-grid-2">
                <div>
                  <label className="mwj-gd-label">الماركة:</label>
                  <select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); setPartEngine(''); }} className="mwj-gd-select" required>
                    <option value="">اختر الماركة</option>
                    {Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mwj-gd-label">الموديل:</label>
                  <select value={partModel} onChange={(e) => setPartModel(e.target.value)} className="mwj-gd-select" required disabled={!partMake}>
                    <option value="">اختر الموديل</option>
                    {partMake && carData[partMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="mwj-gd-grid-2">
                <div>
                  <label className="mwj-gd-label">سنة الصنع:</label>
                  <select value={partYear} onChange={(e) => setPartYear(e.target.value)} className="mwj-gd-select" required>
                    <option value="">اختر السنة</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mwj-gd-label">المحرك (اختياري):</label>
                  <select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} className="mwj-gd-select" disabled={!partMake}>
                    <option value="">اختر المحرك</option>
                    {partMake && carData[partMake]?.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
                  </select>
                </div>
              </div>

              <div className="mwj-gd-grid-2">
                <div>
                  <label className="mwj-gd-label">اسم قطعة الغيار:</label>
                  <input type="text" placeholder="مثال: دينمو، كمبروسر..." value={partName} onChange={(e) => setPartName(e.target.value)} className="mwj-gd-input" required />
                </div>
                <div>
                  <label className="mwj-gd-label">رقم القطعة (اختياري):</label>
                  <input type="text" placeholder="مثال: 27060-0H110" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className="mwj-gd-input" />
                </div>
              </div>

              <div>
                <label className="mwj-gd-label" style={{ marginBottom: '10px' }}>نوع / حالة القطعة:</label>
                <div className="mwj-gd-type-row">
                  {[
                    { label: '🚗 مستعمل أصلي', val: 'مستعمل أصلي', color: '#22a35a', bg: '#f0fff4', border: '#22a35a' },
                    { label: '💎 جديد أصلي (OEM)', val: 'أصلي (OEM)', color: '#2b6cb0', bg: '#ebf8ff', border: '#3182ce' },
                    { label: '⚙️ تجاري / كوبي', val: 'تجاري / كوبي', color: '#c05621', bg: '#fffaf0', border: '#E0872A' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setPartType(item.val)}
                      className="mwj-gd-type-btn"
                      style={partType === item.val ? { borderColor: item.border, backgroundColor: item.bg, color: item.color, boxShadow: `0 4px 14px ${item.color}22` } : {}}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mwj-gd-grid-2">
                <div>
                  <label className="mwj-gd-label">السعر (ر.ق):</label>
                  <input type="number" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} className="mwj-gd-input" required />
                </div>
                <div>
                  <label className="mwj-gd-label">الكمية المتوفرة:</label>
                  <input type="number" min="1" value={partStock} onChange={(e) => setPartStock(e.target.value)} className="mwj-gd-input" required />
                </div>
              </div>

              <div>
                <label className="mwj-gd-label">صورة القطعة:</label>
                <div className="mwj-gd-dropzone">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                  <p>{uploadingImage ? '⏳ جاري الرفع...' : '📸 اضغط هنا لاختيار صورة للقطعة'}</p>
                </div>
                {partImg && (
                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}
              </div>

              <button type="submit" className={`mwj-gd-submit ${editingId ? 'mwj-gd-submit-edit' : 'mwj-gd-submit-new'}`}>
                {editingId ? 'حفظ التعديلات' : '🚀 نشر القطعة للبيع'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="mwj-gd-panel">
            <h3 className="mwj-gd-panel-title">❓ استفسارات مطابقة التوافق الواردة</h3>

            {activeInquiriesList.length === 0 ? (
              <p className="mwj-gd-empty">لا توجد استفسارات جديدة حالياً.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeInquiriesList.map(inquiry => (
                  <div key={inquiry.id} className={`mwj-gd-inq-card ${inquiry.status === 'pending_check' ? 'mwj-gd-inq-pending' : 'mwj-gd-inq-resolved'}`}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '13px', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="mwj-gd-inq-code">كود الاستفسار: {inquiry.inquiry_code || `#INQ-${inquiry.id}`}</span>
                      <span className="mwj-gd-inq-status" style={{ color: inquiry.status === 'pending_check' ? '#c05621' : inquiry.status === 'confirmed_compatible' ? '#22a35a' : '#e53e3e' }}>
                        {inquiry.status === 'pending_check' ? '⏳ بانتظار ردك' : inquiry.status === 'confirmed_compatible' ? '✅ تم تأكيد التوافق' : '❌ لا تركب'}
                      </span>
                    </div>

                    <div onClick={() => setPreviewPartDetails(inquiry)} className="mwj-gd-inq-preview" style={{ marginBottom: '13px' }}>
                      <img src={inquiry.part_image || 'https://via.placeholder.com/60'} alt={inquiry.part_name} style={{ width: '66px', height: '66px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <strong style={{ fontSize: '15px', color: '#16304f' }}>📦 {inquiry.part_name || 'قطعة من معروضاتك'}</strong>
                          <span className="mwj-gd-preview-tag">🔍 اضغط للمعاينة</span>
                        </div>
                        {inquiry.part_number && <span style={{ fontSize: '12px', color: '#718096', display: 'block' }}>Part #: {inquiry.part_number}</span>}
                        <span style={{ fontSize: '13.5px', color: '#E0872A', fontWeight: 800 }}>{inquiry.part_price || 0} QAR</span>
                      </div>
                    </div>

                    <div className="mwj-gd-inq-vehicle" style={{ marginBottom: '13px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#2d3748', marginBottom: '6px' }}>
                        🚘 سيارة العميل: {inquiry.car_make} - {inquiry.car_model} ({inquiry.car_year}) {inquiry.car_engine && `[${inquiry.car_engine}]`}
                      </div>
                      {inquiry.vin_number && <div style={{ fontSize: '13px', color: '#4a5568', fontFamily: 'monospace' }}>🔑 رقم الشاصي (VIN): <strong>{inquiry.vin_number}</strong></div>}
                      {inquiry.customer_notes && <div style={{ fontSize: '13px', color: '#718096', marginTop: '6px', fontStyle: 'italic' }}>💬 ملاحظات العميل: "{inquiry.customer_notes}"</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      {inquiry.car_registration_img && (
                        <div className="mwj-gd-doc-thumb" style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '4px' }}>صورة الاستمارة</span>
                          <a href={inquiry.car_registration_img} target="_blank" rel="noreferrer"><img src={inquiry.car_registration_img} alt="Estimara" /></a>
                        </div>
                      )}
                      {inquiry.old_part_img && (
                        <div className="mwj-gd-doc-thumb" style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '4px' }}>القطعة القديمة</span>
                          <a href={inquiry.old_part_img} target="_blank" rel="noreferrer"><img src={inquiry.old_part_img} alt="Old Part" /></a>
                        </div>
                      )}
                    </div>

                    {inquiry.status === 'pending_check' && (
                      <div className="mwj-gd-inq-actions">
                        <button onClick={() => setSelectedInquiry(inquiry)} className="mwj-gd-btn-confirm">✅ تركب (تأكيد التوافق والضمان)</button>
                        <button onClick={() => handleRejectFitment(inquiry.id)} className="mwj-gd-btn-reject">❌ لا تركب (رفض الطلب)</button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {previewPartDetails && (
          <div className="mwj-gd-overlay">
            <div className="mwj-gd-modal" style={{ maxWidth: '500px', textAlign: 'center' }}>
              <button onClick={() => setPreviewPartDetails(null)} className="mwj-gd-modal-close" style={{ [isRtl ? 'left' : 'right']: '15px' }}>✕</button>
              <h3 style={{ margin: '0 0 15px 0', color: '#16304f', fontWeight: 800 }}>🔍 تفاصيل قطعة المعرض</h3>
              <img src={previewPartDetails.part_image || 'https://via.placeholder.com/300'} alt={previewPartDetails.part_name} style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '14px', border: '1px solid #cbd5e0', marginBottom: '15px' }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#2d3748' }}>{previewPartDetails.part_name}</h4>
              {previewPartDetails.part_number && <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>رقم القطعة: <strong>{previewPartDetails.part_number}</strong></div>}
              <div style={{ fontSize: '19px', fontWeight: 800, color: '#E0872A', marginBottom: '16px' }}>{previewPartDetails.part_price || 0} QAR</div>
              <button onClick={() => setPreviewPartDetails(null)} className="mwj-gd-status-btn-driver">إغلاق المعاينة</button>
            </div>
          </div>
        )}

        {selectedInquiry && (
          <div className="mwj-gd-overlay">
            <div className="mwj-gd-modal" style={{ maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2b6cb0', fontWeight: 800 }}>🛡️ تحديد شروط ضمان القطعة للعميل</h3>
              <p style={{ fontSize: '13.5px', color: '#4a5568', marginBottom: '20px', lineHeight: 1.6 }}>
                أكد أن القطعة <strong>({selectedInquiry.part_name})</strong> تطابق سيارة العميل <strong>({selectedInquiry.car_make} {selectedInquiry.car_model})</strong> وحدد مهلة الضمان:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '25px' }}>
                <div>
                  <label className="mwj-gd-label">1️⃣ مهلة الإرجاع قبل/عند التركيب (أيام):</label>
                  <select value={returnDays} onChange={(e) => setReturnDays(Number(e.target.value))} className="mwj-gd-select">
                    <option value={1}>يوم واحد</option>
                    <option value={3}>3 أيام (موصى به)</option>
                    <option value={5}>5 أيام</option>
                    <option value={7}>7 أيام</option>
                  </select>
                </div>

                <div>
                  <label className="mwj-gd-label">2️⃣ فترة ضمان التشغيل بعد التركيب (أيام):</label>
                  <select value={warrantyDays} onChange={(e) => setWarrantyDays(Number(e.target.value))} className="mwj-gd-select">
                    <option value={7}>7 أيام</option>
                    <option value={14}>14 يوماً (موصى به)</option>
                    <option value={30}>شهر كامل (30 يوماً)</option>
                    <option value={90}>3 أشهر</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleConfirmFitment} className="mwj-gd-warranty-btn">🚀 تأكيد وإرسال للعميل</button>
                <button onClick={() => setSelectedInquiry(null)} className="mwj-gd-cancel-btn">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my_parts' && (
          <div className="mwj-gd-panel">
            <h3 className="mwj-gd-panel-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>📦 جميع القطع المعروضة ({myParts.length})</h3>
            {myParts.map(part => (
              <div key={part.id} className="mwj-gd-part-row">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', minWidth: 0 }}>
                  <img src={part.image_url || 'https://via.placeholder.com/60'} alt={part.name} className="mwj-gd-part-row-img" />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '16px' }}>
                      {part.name} {part.part_number && <span style={{ fontSize: '12px', color: '#718096', fontWeight: 400 }}>[PN: {part.part_number}]</span>}
                    </h4>
                    <div style={{ fontSize: '12.5px', color: '#718096', marginBottom: '4px' }}>🚘 {part.make} - {part.model} ({part.year})</div>
                    <div><span style={{ color: '#E0872A', fontWeight: 800 }}>{part.price} QAR</span> | <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 700 }}>{part.part_type || 'مستعمل'}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(part)} className="mwj-gd-part-edit-btn">✏️ تعديل</button>
                  <button onClick={() => handleDelete(part.id)} className="mwj-gd-part-del-btn">🗑️ حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. الطلبات الواردة للشحن مع أزرار وشارات التسلسل الذكية */}
        {activeTab === 'orders' && (
          <div className="mwj-gd-panel">
            <h3 className="mwj-gd-panel-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>📥 الطلبات الواردة للشحن والاستلام</h3>
            {myOrders.length === 0 ? (
              <p className="mwj-gd-empty">لا توجد طلبات جديدة حالياً.</p>
            ) : (
              myOrders.map(order => (
                <div key={order.id} className="mwj-gd-order-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span className="mwj-gd-order-code">كود الطلب: {order.order_code || `#ORD-${order.id}`}</span>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#2d3748' }}>{order.part_name}</h4>
                    </div>
                    <span style={{ fontWeight: 800, color: '#E0872A', fontSize: '18px' }}>{order.price} QAR</span>
                  </div>

                  <div className="mwj-gd-order-info">
                    <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                      🚚 طريقة التسليم: {order.delivery_type === 'delivery' ? 'توصيل لموقع العميل' : '🏪 استلام من مقر موجود أووتو'}
                    </div>
                    {order.delivery_type === 'delivery' && (
                      <div style={{ marginTop: '6px' }}>
                        📍 العنوان: <strong>{order.address_details || 'غير محدد'}</strong>
                        {order.location_lat && order.location_lng && (
                          
                            href={`https://www.google.com/maps?q=${order.location_lat},${order.location_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mwj-gd-maps-link"
                            style={{ [isRtl ? 'marginRight' : 'marginLeft']: '10px' }}
                          >
                            🗺️ فتح موقع العميل في Google Maps
                          </a>
                        )}
                      </div>
                    )}
                    {order.pickup_code && <div style={{ color: '#22a35a', fontWeight: 800, marginTop: '6px' }}>🔑 كود تسليم المندوب: {order.pickup_code}</div>}
                  </div>

                  {/* أزرار التسلسل الذكية حسب حالة الطلب */}
                  <div>
                    {(!order.status || order.status === 'pending') && (
                      <button onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')} className="mwj-gd-status-btn-prep">
                        ✅ تأكيد توفر القطعة وتجهيزها
                      </button>
                    )}

                    {order.status === 'ready_for_pickup' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="mwj-gd-status-ready">📦 القطعة جاهزة وفي انتظار وصول المندوب</div>
                        <button onClick={() => updateOrderStatus(order.id, 'handed_to_driver')} className="mwj-gd-status-btn-driver">
                          🚚 تم تسليم القطعة للمندوب الآن
                        </button>
                      </div>
                    )}

                    {(order.status === 'handed_to_driver' || order.status === 'delivered') && (
                      <div className="mwj-gd-status-done">
                        {order.status === 'delivered' ? '✅ تم التسليم للعميل بالكامل' : '🚚 تم تسليم القطعة للمندوب (قيد التوصيل للعميل)'}
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

      </div>
    </>
  );
};
