import React, { useState, useEffect } from 'react';

interface DeliveryProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
}

export const DeliveryDashboard: React.FC<DeliveryProps> = ({ lang, supabaseUrl, apiKey, session }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryCodeInputs, setDeliveryCodeInputs] = useState<Record<number, string>>({});

  const isRtl = lang === 'ar';
  const driverId = session?.user?.id || session?.phone || session?.email || 'driver_1';

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // تحديث تلقائي كل 10 ثوانٍ
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/orders?select=*&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 🚚 استلام الشحنة من الكراج
  const handleAcceptDelivery = async (orderId: number) => {
    try {
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'handed_to_driver',
          driver_id: driverId
        })
      });

      if (response.ok) {
        alert(isRtl ? 'تم استلام القطعة! هي الآن قيد التوصيل للعميل 🛵' : 'Order accepted for delivery!');
        fetchOrders();
        setActiveTab('active');
      }
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تحديث الحالة' : 'Error updating status');
    }
  };

  // ✅ تأكيد التسليم للعميل باستخدام الكود
  const handleConfirmDelivery = async (order: any) => {
    const enteredCode = (deliveryCodeInputs[order.id] || '').trim();

    if (order.pickup_code && enteredCode !== order.pickup_code.trim()) {
      return alert(isRtl ? '❌ كود التسليم غير صحيح، يرجى التأكد من العميل!' : 'Invalid code!');
    }

    try {
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'delivered' })
      });

      if (response.ok) {
        alert(isRtl ? '🎉 تم تسليم الطلب بنجاح للعميل!' : 'Order delivered successfully!');
        fetchOrders();
      }
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تأكيد التسليم' : 'Error confirming delivery');
    }
  };

  // تصنيف الطلبات حسب الحالة
  const availableOrders = orders.filter(o => o.status === 'ready_for_pickup' && o.delivery_type === 'delivery');
  const activeDeliveries = orders.filter(o => o.status === 'handed_to_driver' && (o.driver_id === driverId || !o.driver_id));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 15px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>
      
      {/* هيدر شاشة المندوب */}
      <div style={{ backgroundColor: '#1F3A5F', color: 'white', padding: '20px', borderRadius: '18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>🛵 {isRtl ? 'لوحة المندوب والتوصيل' : 'Driver Dashboard'}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cfe3ff' }}>{isRtl ? 'إدارة واستلام طلبات التوصيل المباشرة' : 'Manage & deliver customer orders'}</p>
        </div>
        <button onClick={fetchOrders} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
          🔄 {loading ? (isRtl ? 'جاري التحديث...' : 'Loading...') : (isRtl ? 'تحديث' : 'Refresh')}
        </button>
      </div>

      {/* أزرار التنقل بين الحالات */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('available')}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px',
            backgroundColor: activeTab === 'available' ? '#3182ce' : 'transparent',
            color: activeTab === 'available' ? 'white' : '#4a5568'
          }}
        >
          📦 {isRtl ? `جاهزة للاستلام (${availableOrders.length})` : `Ready (${availableOrders.length})`}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px',
            backgroundColor: activeTab === 'active' ? '#dd6b20' : 'transparent',
            color: activeTab === 'active' ? 'white' : '#4a5568'
          }}
        >
          🚚 {isRtl ? `قيد التوصيل (${activeDeliveries.length})` : `In Transit (${activeDeliveries.length})`}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px',
            backgroundColor: activeTab === 'completed' ? '#38a169' : 'transparent',
            color: activeTab === 'completed' ? 'white' : '#4a5568'
          }}
        >
          ✅ {isRtl ? `المكتملة (${completedOrders.length})` : `Completed (${completedOrders.length})`}
        </button>
      </div>

      {/* قائمة الطلبات المتاحة للاستلام من الكراج */}
      {activeTab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {availableOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#718096' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>📦</span>
              {isRtl ? 'لا توجد طلبات جاهزة للاستلام حالياً.' : 'No orders ready for pickup.'}
            </div>
          ) : (
            availableOrders.map(order => (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', border: '1px solid #cbd5e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '3px 8px', borderRadius: '6px' }}>
                    {order.order_code || `#ORD-${order.id}`}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dd6b20' }}>{order.price} QAR</span>
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2d3748' }}>📦 {order.part_name}</h3>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#4a5568', marginBottom: '14px', border: '1px solid #edf2f7' }}>
                  <div style={{ marginBottom: '4px' }}>📍 عنوان التسليم: <strong>{order.address_details || 'غير محدد'}</strong></div>
                  <div>📞 هاتف العميل: <a href={`tel:${order.customer_phone}`} style={{ color: '#3182ce', fontWeight: 'bold' }}>{order.customer_phone}</a></div>
                </div>

                <button
                  onClick={() => handleAcceptDelivery(order.id)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                >
                  🚀 استلام الشحنة للبدء بالتوصيل
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* قائمة الطلبات قيد التوصيل مع المندوب */}
      {activeTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {activeDeliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#718096' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🛵</span>
              {isRtl ? 'لا توجد شحنات قيد التوصيل مع السائق حالياً.' : 'No active deliveries.'}
            </div>
          ) : (
            activeDeliveries.map(order => (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', border: '2px solid #dd6b20', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fffaf0', color: '#dd6b20', padding: '3px 8px', borderRadius: '6px' }}>
                    قيد التوصيل {order.order_code || `#ORD-${order.id}`}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d3748' }}>{order.price} QAR</span>
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '16.5px', color: '#1a365d' }}>📦 {order.part_name}</h3>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#4a5568', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>📞 العميل: <a href={`tel:${order.customer_phone}`} style={{ color: '#3182ce', fontWeight: 'bold' }}>{order.customer_phone}</a></div>
                  <div>📍 العنوان: <strong>{order.address_details || 'غير محدد'}</strong></div>

                  {order.location_lat && order.location_lng && (
                    <a
                      href={`https://www.google.com/maps?q=${order.location_lat},${order.location_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                        backgroundColor: '#3182ce', color: 'white', padding: '8px 12px', borderRadius: '8px',
                        textDecoration: 'none', fontWeight: 'bold', fontSize: '12.5px', marginTop: '6px'
                      }}
                    >
                      🗺️ فتح موقع العميل في Google Maps
                    </a>
                  )}
                </div>

                {/* مربع إدخال كود تسليم العميل */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder={isRtl ? 'أدخل كود العميل لتأكيد التسليم (DEL-XXX)' : 'Enter customer code'}
                    value={deliveryCodeInputs[order.id] || ''}
                    onChange={(e) => setDeliveryCodeInputs({ ...deliveryCodeInputs, [order.id]: e.target.value })}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => handleConfirmDelivery(order)}
                    style={{ backgroundColor: '#38a169', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✅ تم التسليم
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* السجل المكتمل */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {completedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#718096' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🏁</span>
              {isRtl ? 'لا توجد طلبات مكتملة بعد.' : 'No completed deliveries.'}
            </div>
          ) : (
            completedOrders.map(order => (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#2d3748' }}>{order.part_name}</h4>
                  <span style={{ fontSize: '12px', color: '#718096' }}>كود: {order.order_code || `#ORD-${order.id}`} | 📞 {order.customer_phone}</span>
                </div>
                <span style={{ backgroundColor: '#f0fff4', color: '#2f855a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>✅ تم التسليم</span>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
