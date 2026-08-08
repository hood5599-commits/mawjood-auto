import React from 'react';
import { AITranslatedText } from '../AITranslatedText';

interface OrdersAndCustomTabProps {
  isRtl: boolean;
  lang: 'ar' | 'en';
  tabType: 'custom_requests' | 'orders';
  customRequests: any[];
  myOrders: any[];
  onSelectCustomRequest: (req: any) => void;
  onUpdateOrderStatus: (orderId: number, status: string) => void;
}

export const OrdersAndCustomTab: React.FC<OrdersAndCustomTabProps> = ({
  isRtl,
  lang,
  tabType,
  customRequests,
  myOrders,
  onSelectCustomRequest,
  onUpdateOrderStatus
}) => {
  // 🏷️ 1. تبويب طلبات التسعير والقطع المخصصة
  if (tabType === 'custom_requests') {
    return (
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
          {isRtl ? 'طلبات القطع المخصصة الواردة من العملاء' : 'Custom Part Requests'}
        </h3>

        {customRequests.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{isRtl ? 'لا توجد طلبات تسعير حالياً.' : 'No custom requests.'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {customRequests.map((req) => (
              <div key={req.id} style={{ padding: '20px', border: '1px solid #e0872a', borderRadius: '15px', backgroundColor: '#fffdfa' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
                    {req.make || req.car_make} - {req.model || req.car_model} ({req.year || req.car_year})
                  </h4>
                  <span style={{ fontSize: '12px', color: '#805ad5', backgroundColor: '#faf5ff', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                    #{req.id}
                  </span>
                </div>

                {req.notes || req.description || req.part_name ? (
                  <p style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '13.5px', color: '#2d3748', margin: '0 0 12px 0', border: '1px solid #edf2f7' }}>
                    <strong>{isRtl ? 'القطعة المطلوبة:' : 'Requested Part:'}</strong> {req.notes || req.description || req.part_name}
                  </p>
                ) : null}

                {req.image_url && (
                  <div style={{ marginBottom: '12px' }}>
                    <a href={req.image_url} target="_blank" rel="noreferrer">
                      <img src={req.image_url} alt="Custom Request" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                    </a>
                  </div>
                )}

                <button 
                  onClick={() => onSelectCustomRequest(req)} 
                  style={{ width: '100%', padding: '11px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  {isRtl ? 'القطعة متوفرة عندي (تقديم تسعيرة) 💰' : 'Provide Quote'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 📦 2. تبويب الطلبات المباشرة الواردة للشحن والاستلام (بدون كشف بيانات العميل للكراج)
  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
        {isRtl ? 'الطلبات الواردة للشحن والاستلام' : 'Incoming Orders for Shipping'}
      </h3>

      {myOrders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{isRtl ? 'لا توجد طلبات واردة حالياً.' : 'No orders received yet.'}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myOrders.map(order => {
            const isReady = order.status === 'ready' || order.status === 'ready_for_pickup' || order.status === 'completed';

            return (
              <div key={order.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', backgroundColor: '#f8fafc' }}>
                
                {/* هيدر الطلب برقم الطلب والحالة */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#2d3748', padding: '4px 10px', borderRadius: '6px' }}>
                    {isRtl ? 'طلب رقم:' : 'Order #'} {order.order_code || `#ORD-${order.id}`}
                  </span>
                  <span style={{ 
                    fontSize: '12.5px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px',
                    backgroundColor: isReady ? '#dcfce7' : '#fef3c7',
                    color: isReady ? '#15803d' : '#92400e'
                  }}>
                    {isReady ? (isRtl ? 'تم التجهيز وفي انتظار المندوب 🚚' : 'Ready for Pickup') : (isRtl ? 'بانتظار تجهيزك' : 'Pending Processing')}
                  </span>
                </div>

                {/* 🖼️ تفاصيل القطعة والصورة والسعر */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <img 
                    src={order.part_image || order.image_url || order.image || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'} 
                    alt={order.part_name || 'Part'} 
                    style={{ width: '75px', height: '75px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #cbd5e0', flexShrink: 0, backgroundColor: '#ffffff' }} 
                    onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '16px', color: '#1f3a5f', display: 'block', marginBottom: '4px' }}>
                      <AITranslatedText text={order.part_name || (isRtl ? 'قطعة غيار' : 'Auto Part')} lang={lang} />
                    </strong>
                    {order.car_info && <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block' }}>السيارة: {order.car_info}</span>}
                    <span style={{ fontSize: '16px', color: '#e0872a', fontWeight: '800', display: 'block', marginTop: '4px' }}>
                      {order.price || order.part_price || 0} QAR
                    </span>
                  </div>
                </div>

                {/* 🔒 تم إخفاء هاتف وعنوان العميل نهائياً عن الكراج للحفاظ على الخصوصية الكاملة */}

                {/* ⚡ زر الإجراء للتأكيد والتجهيز للشحن */}
                {!isReady ? (
                  <button 
                    onClick={() => onUpdateOrderStatus(order.id, 'ready_for_pickup')}
                    style={{ 
                      width: '100%', padding: '13px', backgroundColor: '#16a34a', color: 'white', border: 'none', 
                      borderRadius: '12px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)', transition: 'all 0.2s'
                    }}
                  >
                    {isRtl ? 'تأكيد توفر القطعة وتجهيزها للشحن 📦' : 'Confirm & Mark Ready for Pickup 📦'}
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold', fontSize: '13.5px', padding: '10px', backgroundColor: '#f0fff4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    ✅ تم تأكيد التجهيز، إشعار المندوب جارٍ لتسلم القطعة!
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
