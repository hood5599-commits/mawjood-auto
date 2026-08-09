/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { AITranslatedText } from '../AITranslatedText';

interface FitmentInquiriesTabProps {
  isRtl: boolean;
  lang: 'ar' | 'en';
  myInquiries: any[];
  onSelectInquiry: (inquiry: any) => void;
  onRejectInquiry: (id: number) => void;
  onPreviewPart: (inquiry: any) => void;
}

export const FitmentInquiriesTab: React.FC<FitmentInquiriesTabProps> = ({
  isRtl,
  lang,
  myInquiries,
  onSelectInquiry,
  onRejectInquiry,
  onPreviewPart
}) => {
  // حالة الفلتر الفرعي: استفسارات جديدة بانتظار الرد أم الأرشيف والمفحوصة
  const [subTab, setSubTab] = useState<'pending' | 'archive'>('pending');

  const activeInquiries = myInquiries.filter(i => i.status !== 'ordered');

  // فصل الاستفسارات الجديدة المعلقة عن الاستفسارات المفحوصة والمؤكدة/المرفوضة
  const pendingInquiries = activeInquiries.filter(i => i.status === 'pending_check' || !i.status);
  const archivedInquiries = activeInquiries.filter(i => i.status !== 'pending_check' && i.status);

  const displayedInquiries = subTab === 'pending' ? pendingInquiries : archivedInquiries;

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* هيدر التبويب مع الفرز الذكي لمنع التشتت */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
          {isRtl ? 'استفسارات مطابقة التوافق الواردة' : 'Incoming Fitment Inquiries'}
        </h3>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSubTab('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: subTab === 'pending' ? '#805ad5' : '#f1f5f9',
              color: subTab === 'pending' ? 'white' : '#475569'
            }}
          >
            ⏳ {isRtl ? 'بانتظار ردك' : 'Awaiting Reply'} ({pendingInquiries.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab('archive')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: subTab === 'archive' ? '#475569' : '#f1f5f9',
              color: subTab === 'archive' ? 'white' : '#475569'
            }}
          >
            📜 {isRtl ? 'الأرشيف والمفحوصة سابقاً' : 'Archive / Checked'} ({archivedInquiries.length})
          </button>
        </div>
      </div>

      {displayedInquiries.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>
          {subTab === 'pending' 
            ? (isRtl ? 'لا توجد استفسارات جديدة بانتظار ردك حالياً 🎉' : 'No new inquiries currently.') 
            : (isRtl ? 'لا توجد استفسارات مفحوصة سابقة في الأرشيف.' : 'No archived inquiries.')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {displayedInquiries.map(inquiry => {
            const isPending = inquiry.status === 'pending_check' || !inquiry.status;
            const isConfirmed = inquiry.status === 'confirmed_compatible';

            return (
              <div 
                key={inquiry.id} 
                style={{ 
                  padding: '20px', 
                  border: isPending ? '2px solid #805ad5' : '1px solid #e2e8f0', 
                  borderRadius: '15px', 
                  backgroundColor: isPending ? '#faf5ff' : '#f8fafc' 
                }}
              >
                
                {/* هيدر الكود والحالة */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e9d8fd', color: '#553c9a', padding: '4px 10px', borderRadius: '6px' }}>
                    {isRtl ? 'كود الاستفسار:' : 'Inquiry Code:'} {inquiry.inquiry_code || `#INQ-${inquiry.id}`}
                  </span>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: isPending ? '#dd6b20' : isConfirmed ? '#38a169' : '#e53e3e' 
                  }}>
                    {isPending 
                      ? (isRtl ? 'بانتظار ردك' : 'Awaiting Reply') 
                      : isConfirmed 
                      ? (isRtl ? 'تم تأكيد التوافق' : 'Confirmed Fitment') 
                      : (isRtl ? 'لا تركب (مرفوض)' : 'Incompatible')}
                  </span>
                </div>

                {/* 🔍 بطاقة القطعة لمعاينة التفاصيل */}
                <div 
                  onClick={() => onPreviewPart(inquiry)} 
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  title={isRtl ? "اضغط لمعاينة القطعة بالتفصيل" : "Click to preview part details"}
                >
                  <img src={inquiry.part_image || inquiry.image_url || 'https://via.placeholder.com/60'} alt={inquiry.part_name} style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px', color: '#1f3a5f' }}>
                        <AITranslatedText text={inquiry.part_name} lang={lang} />
                      </strong>
                      <span style={{ fontSize: '11px', color: '#3182ce', backgroundColor: '#ebf8ff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        👁️ {isRtl ? 'اضغط للمعاينة والبيانات' : 'Click to Preview'}
                      </span>
                    </div>
                    {inquiry.part_number && <span style={{ fontSize: '12px', color: '#718096', display: 'block', marginTop: '2px' }}>Part #: {inquiry.part_number}</span>}
                    <span style={{ fontSize: '13.5px', color: '#dd6b20', fontWeight: 'bold', display: 'block', marginTop: '2px' }}>{inquiry.part_price || 0} QAR</span>
                  </div>
                </div>

                {/* تفاصيل سيارة العميل والشاصي */}
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748' }}>
                    {isRtl ? 'سيارة العميل:' : 'Customer Car:'} {inquiry.car_make} - {inquiry.car_model} ({inquiry.car_year}) {inquiry.car_engine && `[${inquiry.car_engine}]`}
                  </div>
                  {inquiry.vin_number && (
                    <div style={{ fontSize: '13px', color: '#4a5568', fontFamily: 'monospace', marginTop: '4px' }}>
                      VIN: <strong>{inquiry.vin_number}</strong>
                    </div>
                  )}
                  {inquiry.customer_notes && (
                    <div style={{ fontSize: '13px', color: '#718096', marginTop: '6px', fontStyle: 'italic' }}>
                      {isRtl ? 'ملاحظات العميل:' : 'Customer Notes:'} "{inquiry.customer_notes}"
                    </div>
                  )}
                </div>

                {/* 📷 مرفقات العميل (صورة الاستمارة والقطعة القديمة إن وجدت) */}
                {(inquiry.car_registration_img || inquiry.old_part_img) && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    {inquiry.car_registration_img && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '3px' }}>{isRtl ? 'صورة الاستمارة' : 'Registration'}</span>
                        <a href={inquiry.car_registration_img} target="_blank" rel="noreferrer">
                          <img src={inquiry.car_registration_img} alt="Estimara" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                        </a>
                      </div>
                    )}
                    {inquiry.old_part_img && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '3px' }}>{isRtl ? 'القطعة القديمة' : 'Old Part'}</span>
                        <a href={inquiry.old_part_img} target="_blank" rel="noreferrer">
                          <img src={inquiry.old_part_img} alt="Old Part" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* ⚡ أزرار التفاعل واتخاذ القرار (تظهر فقط في تبويب الاستفسارات الجديدة) */}
                {subTab === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => onSelectInquiry(inquiry)} 
                      style={{ flex: 1, padding: '12px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      {isRtl ? 'تركب (تأكيد التوافق والضمان)' : 'Fits (Confirm & Warranty)'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => onRejectInquiry(inquiry.id)} 
                      style={{ flex: 1, padding: '12px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      {isRtl ? 'لا تركب (رفض الطلب)' : 'Doesn\'t Fit (Reject)'}
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
