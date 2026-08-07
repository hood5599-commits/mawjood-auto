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
  if (tabType === 'custom_requests') {
    return (
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          {isRtl ? 'طلبات القطع المخصصة الواردة من العملاء' : 'Custom Part Requests'}
        </h3>
        {customRequests.map((req) => (
          <div key={req.id} style={{ padding: '20px', border: '1px solid #e0872a', borderRadius: '15px', backgroundColor: '#fffdfa', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>{req.make} - {req.model} ({req.year})</h4>
            <p style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px' }}><strong>القطعة المطلوبة:</strong> {req.notes}</p>
            <button onClick={() => onSelectCustomRequest(req)} style={{ width: '100%', padding: '11px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>القطعة متوفرة عندي (تقديم تسعيرة)</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f3a5f' }}>{isRtl ? 'الطلبات الواردة للشحن والاستلام' : 'Incoming Orders'}</h3>
      {myOrders.map(order => (
        <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', marginBottom: '15px', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4><AITranslatedText text={order.part_name} lang={lang} /></h4>
            <span style={{ fontWeight: 'bold', color: '#dd6b20' }}>{order.price} QAR</span>
          </div>
          {(!order.status || order.status === 'pending') && (
            <button onClick={() => onUpdateOrderStatus(order.id, 'ready_for_pickup')} style={{ width: '100%', padding: '11px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>تأكيد توفر القطعة وتجهيزها</button>
          )}
        </div>
      ))}
    </div>
  );
};
