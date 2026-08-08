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

  const [pickupImages, setPickupImages] = useState<Record<number, string>>({});
  const [deliveryImages, setDeliveryImages] = useState<Record<number, string>>({});
  const [deliveryCodeInputs, setDeliveryCodeInputs] = useState<Record<number, string>>({});

  const isRtl = lang === 'ar';
  const driverId = session?.user?.id || session?.phone || session?.email || 'driver_1';

  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${restUrl}/orders?select=*&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) {
        const rawOrders = await response.json();
        const updatedOrders = rawOrders.map((ord: any) => {
          let address = ord.garage_address || ord.garage_location;
          if (!address && ord.garage_id) {
            address = localStorage.getItem(`garage_location_${ord.garage_id}`) || 'المنطقة الصناعية - الدوحة، قطر';
          }
          return { ...ord, resolved_garage_address: address || 'المنطقة الصناعية - الدوحة، قطر' };
        });
        setOrders(updatedOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result as string);
    });
  };

  // 🚀 🚚 تأكيد الاستلام من الكراج والبدء بالتوصيل
  const handleAcceptDelivery = async (order: any) => {
    const pickupImgUrl = pickupImages[order.id] || order.pickup_image_url;

    if (!pickupImgUrl) {
      return alert(isRtl ? '📸 يرجى تصوير/التقاط صورة القطعة في الكراج أولاً لتأكيد الاستلام!' : 'Please take a pickup photo first!');
    }

    try {
      const response = await fetch(`${restUrl}/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'handed_to_driver',
          driver_id: String(driverId),
          pickup_image_url: pickupImgUrl
        })
      });

      if (response.ok) {
        alert(isRtl ? '✅ تم تأكيد الاستلام بنجاح! الشحنة الآن قيد التوصيل.' : 'Pickup confirmed!');
        fetchOrders();
        setActiveTab('active');
      } else {
        const errorText = await response.text();
        console.error("Error Patching Order:", errorText);
        alert(isRtl ? 'فشل التحديث. تأكد من إيقاف RLS في Supabase لجدول orders' : 'PATCH Failed');
      }
    } catch (e) {
      alert(isRtl ? 'خطأ في اتصال الشبكة' : 'Network Error');
    }
  };

  const availableOrders = orders.filter(o => (o.status === 'ready' || o.status === 'ready_for_pickup' || o.status === 'confirmed_compatible') && (o.delivery_type === 'delivery' || !o.delivery_type));
  const activeDeliveries = orders.filter(o => o.status === 'handed_to_driver');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 15px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      <div style={{ backgroundColor: '#1F3A5F', color: 'white', padding: '20px', borderRadius: '18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>🛵 {isRtl ? 'لوحة المندوب والتوصيل' : 'Driver Dashboard'}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cfe3ff' }}>{isRtl ? 'استلام وتوصيل الطلبات' : 'Manage deliveries'}</p>
        </div>
        <button onClick={fetchOrders} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
          🔄 {loading ? (isRtl ? 'جاري التحديث...' : 'Loading...') : (isRtl ? 'تحديث' : 'Refresh')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('available')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'available' ? '#3182ce' : 'transparent', color: activeTab === 'available' ? 'white' : '#4a5568' }}>
          📦 جاهزة للاستلام ({availableOrders.length})
        </button>
        <button onClick={() => setActiveTab('active')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'active' ? '#dd6b20' : 'transparent', color: activeTab === 'active' ? 'white' : '#4a5568' }}>
          🚚 قيد التوصيل ({activeDeliveries.length})
        </button>
        <button onClick={() => setActiveTab('completed')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'completed' ? '#38a169' : 'transparent', color: activeTab === 'completed' ? 'white' : '#4a5568' }}>
          ✅ المكتملة ({completedOrders.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {availableOrders.map(order => {
            const currentImg = pickupImages[order.id] || order.pickup_image_url;

            return (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', border: '1px solid #cbd5e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>ORD-{order.id}#</strong>
                  <span style={{ color: '#dd6b20', fontWeight: 'bold' }}>{order.price || 0} QAR</span>
                </div>
                <h3 style={{ margin: '0 0 10px 0' }}>📦 {order.part_name || 'قطعة غيار'}</h3>

                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                  <div>🏪 <strong>الكراج:</strong> {order.garage_name || 'كراج الصناعية'}</div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.resolved_garage_address)}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold', display: 'inline-block', marginTop: '6px' }}>
                    🗺️ فتح موقع الكراج في Google Maps
                  </a>
                </div>

                <div style={{ marginBottom: '12px', textAlign: 'center', border: '2px dashed #cbd5e0', padding: '10px', borderRadius: '8px' }}>
                  <label style={{ cursor: 'pointer', fontWeight: 'bold', color: '#553c9a' }}>
                    📷 اضغط لالتقاط صورة القطعة بالكاميرا
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const img = await handleImageUpload(e.target.files[0], `p_${order.id}`);
                        if (img) setPickupImages(prev => ({ ...prev, [order.id]: img }));
                      }
                    }} />
                  </label>
                  {currentImg && <img src={currentImg} alt="Proof" style={{ width: '80px', height: '80px', marginTop: '8px', objectFit: 'cover', borderRadius: '6px' }} />}
                </div>

                <button onClick={() => handleAcceptDelivery(order)} style={{ width: '100%', padding: '12px', backgroundColor: currentImg ? '#16a34a' : '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  🚀 تأكيد الاستلام والبدء بالتوصيل
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {activeDeliveries.map(order => (
            <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', border: '2px solid #dd6b20' }}>
              <h3>📦 {order.part_name}</h3>
              <p>📍 العنوان: {order.delivery_address || 'الدوحة'}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default DeliveryDashboard;
