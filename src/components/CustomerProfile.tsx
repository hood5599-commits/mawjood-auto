import React, { useState, useEffect } from 'react';

interface CustomerProfileProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ lang, supabaseUrl, apiKey, session }) => {
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // استخراج معرّف العميل (رقم الهاتف أو الإيميل)
  const customerId = session?.phone || session?.email || session?.user?.email || null;

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!customerId) return;
      try {
        const response = await fetch(`${supabaseUrl}/orders?customer_phone=eq.${customerId}&order=id.desc`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${session?.token || apiKey}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMyOrders(data);
        }
      } catch (error) {
        console.error("Error fetching customer orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [session, customerId, supabaseUrl, apiKey]);

  if (!session || session.role === 'garage') return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px' }}>
      
      {/* بطاقة معلومات العميل */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '50px', backgroundColor: '#edf2f7', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          👤
        </div>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#1a365d' }}>{lang === 'ar' ? 'مرحباً بك' : 'Welcome'}</h2>
          <p style={{ margin: 0, color: '#718096', fontSize: '18px', fontWeight: 'bold', direction: 'ltr' }}>{customerId}</p>
        </div>
      </div>

      {/* سجل الطلبات */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '15px' }}>
          🛍️ {lang === 'ar' ? 'طلباتي السابقة' : 'My Orders'} <span style={{ fontSize: '14px', color: '#718096' }}>({myOrders.length})</span>
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#a0aec0' }}>{lang === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading orders...'}</p>
        ) : myOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🛒</span>
            <p style={{ color: '#a0aec0', margin: 0 }}>{lang === 'ar' ? 'لم تقم بإجراء أي طلبات حتى الآن.' : 'You have no orders yet.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myOrders.map(order => (
              <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  
                  <div>
                    <span style={{ fontSize: '12px', color: '#a0aec0', fontWeight: 'bold' }}>رقم الطلب: #{order.id}</span>
                    <h4 style={{ margin: '5px 0', fontSize: '18px', color: '#2d3748' }}>{order.part_name}</h4>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#dd6b20' }}>{order.price} QAR</span>
                  </div>

                  {/* حالة الطلب */}
                  <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>
                    {order.status === 'pending' && <span style={{ backgroundColor: '#fefcbf', color: '#b7791f', padding: '6px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block' }}>{lang === 'ar' ? 'قيد المراجعة من الكراج ⏳' : 'Pending ⏳'}</span>}
                    {order.status === 'confirmed' && <span style={{ backgroundColor: '#c6f6d5', color: '#2f855a', padding: '6px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block' }}>{lang === 'ar' ? 'تم التأكيد (جاري التجهيز) ✅' : 'Confirmed ✅'}</span>}
                    {order.status === 'rejected' && <span style={{ backgroundColor: '#fed7d7', color: '#c53030', padding: '6px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block' }}>{lang === 'ar' ? 'نعتذر، القطعة غير متوفرة ❌' : 'Rejected ❌'}</span>}
                  </div>
                </div>

                {/* ملاحظات الكراج (إن وجدت) */}
                {order.notes && (
                  <div style={{ marginTop: '15px', backgroundColor: '#edf2f7', padding: '12px', borderRadius: '10px', borderRight: '4px solid #3182ce' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '4px' }}>💬 {lang === 'ar' ? 'رسالة من الكراج:' : 'Message from Garage:'}</span>
                    <p style={{ margin: 0, fontSize: '14px', color: '#2d3748' }}>{order.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
