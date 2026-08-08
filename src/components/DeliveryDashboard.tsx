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
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const isRtl = lang === 'ar';
  const driverId = session?.user?.id || session?.phone || session?.email || 'driver_1';

  // 🛡️ توحيد وتنظيف رابط Supabase
  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  // 📦 جلب الطلبات مع جلب الموقع الحقيقي والديناميكي للكراج من قاعدة البيانات
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. جلب الطلبات
      const response = await fetch(`${restUrl}/orders?select=*&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });

      if (response.ok) {
        const rawOrders = await response.json();

        // 2. جلب جميع ملفات الكراج المحدثة من Supabase مباشرة للحصول على الموقع الصحيح
        let profilesMap: Record<string, any> = {};
        try {
          const profRes = await fetch(`${restUrl}/profiles?select=id,garage_name,garage_address,phone`, {
            headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
          });
          if (profRes.ok) {
            const profiles = await profRes.json();
            profiles.forEach((p: any) => {
              if (p.id) profilesMap[p.id] = p;
            });
          }
        } catch (e) {
          console.error("Profiles fetch failed:", e);
        }

        // 3. ربط موقع الكراج الحقيقي بكل طلب
        const updatedOrders = rawOrders.map((ord: any) => {
          const garageProfile = ord.garage_id ? profilesMap[ord.garage_id] : null;
          
          const realGarageAddress = 
            ord.garage_address || 
            ord.garage_location || 
            garageProfile?.garage_address || 
            localStorage.getItem(`garage_location_${ord.garage_id}`) || 
            'المنطقة الصناعية - الدوحة، قطر';

          const realGarageName = 
            ord.garage_name || 
            garageProfile?.garage_name || 
            'كراج السيارات المعتمد';

          return { 
            ...ord, 
            resolved_garage_address: realGarageAddress,
            resolved_garage_name: realGarageName
          };
        });

        setOrders(updatedOrders);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  // 📷 التقاط صورة الإثبات للكاميرا المباشرة
  const handleImageUpload = async (file: File, key: string): Promise<string | null> => {
    setUploadingState(prev => ({ ...prev, [key]: true }));
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setUploadingState(prev => ({ ...prev, [key]: false }));
        resolve(reader.result as string);
      };
    });
  };

  // 💬 إرسال إشعار الواتساب للعميل
  const handleSendWhatsApp = (phone: string, message: string) => {
    if (!phone) return alert(isRtl ? 'رقم الهاتف غير مسجل' : 'Phone number missing');
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('974') ? cleanPhone : `974${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 🚀 🚚 1. تأكيد استلام الشحنة من الكراج والبدء بالتوصيل
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
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
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
        const errText = await response.text();
        console.error("PATCH error:", errText);
        alert(isRtl ? 'حدث خطأ في تحديث قاعدة البيانات، تأكد من تشغيل أمر SQL في Supabase' : 'Failed to update order');
      }
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء الاستلام' : 'Error receiving order');
    }
  };

  // ✅ 2. تأكيد التسليم النهائي للعميل
  const handleConfirmDelivery = async (order: any) => {
    const enteredCode = (deliveryCodeInputs[order.id] || '').trim();
    const deliveryImgUrl = deliveryImages[order.id] || order.delivery_image_url;

    if (order.pickup_code && enteredCode !== order.pickup_code.trim()) {
      return alert(isRtl ? '❌ كود التسليم غير صحيح، يرجى التأكد من العميل!' : 'Invalid delivery code!');
    }

    if (!deliveryImgUrl) {
      return alert(isRtl ? '📸 يرجى تصوير/التقاط صورة القطعة عند التسليم للعميل أولاً!' : 'Please take a delivery photo first!');
    }

    try {
      const response = await fetch(`${restUrl}/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'delivered',
          delivery_image_url: deliveryImgUrl
        })
      });

      if (response.ok) {
        alert(isRtl ? '🎉 تم تسليم الطلب للعميل بنجاح وتوثيق صور الإثبات!' : 'Order delivered successfully!');
        fetchOrders();
      } else {
        alert(isRtl ? 'حدث خطأ أثناء إتمام التسليم' : 'Delivery failed');
      }
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تأكيد التسليم' : 'Error completing delivery');
    }
  };

  const availableOrders = orders.filter(o => (o.status === 'ready' || o.status === 'ready_for_pickup' || o.status === 'confirmed_compatible') && (o.delivery_type === 'delivery' || !o.delivery_type));
  const activeDeliveries = orders.filter(o => o.status === 'handed_to_driver' && (o.driver_id === String(driverId) || !o.driver_id));
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 15px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* هيدر الصفحة */}
      <div style={{ backgroundColor: '#1F3A5F', color: 'white', padding: '20px', borderRadius: '18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>🛵 {isRtl ? 'لوحة المندوب والتوصيل' : 'Driver Dashboard'}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cfe3ff' }}>{isRtl ? 'استلام وتوصيل الطلبات مع الملاحة الحية' : 'Manage deliveries with live map navigation'}</p>
        </div>
        <button onClick={fetchOrders} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
          🔄 {loading ? (isRtl ? 'جاري التحديث...' : 'Loading...') : (isRtl ? 'تحديث' : 'Refresh')}
        </button>
      </div>

      {/* أزرار التبويب */}
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

      {/* 1️⃣ الطلبات الجاهزة للاستلام من الكراج */}
      {activeTab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {availableOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#718096' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>📦</span>
              {isRtl ? 'لا توجد طلبات جاهزة للاستلام حالياً.' : 'No orders ready for pickup.'}
            </div>
          ) : (
            availableOrders.map(order => {
              const currentPickupImg = pickupImages[order.id] || order.pickup_image_url;

              return (
                <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', border: '1px solid #cbd5e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '3px 8px', borderRadius: '6px' }}>
                      {order.order_code || `#ORD-${order.id}`}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dd6b20' }}>{order.price || order.part_price || 0} QAR</span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2d3748' }}>📦 {order.part_name || 'قطعة غيار'}</h3>

                  {/* 📍 تفاصيل موقع الكراج وتفاصيل العميل الدقيقة والحيّة */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#4a5568', marginBottom: '14px', border: '1px solid #edf2f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <span>🏪 <strong>الكراج:</strong> {order.resolved_garage_name}</span>
                      
                      {/* 🗺️ فتح موقع الكراج الصحيح والمباشر عبر Google Maps */}
                      <a
                        href={
                          order.resolved_garage_address?.startsWith('http') 
                            ? order.resolved_garage_address 
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.resolved_garage_address)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', fontSize: '12px', backgroundColor: '#eff6ff', padding: '5px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}
                      >
                        🗺️ فتح موقع الكراج في Google Maps
                      </a>
                    </div>

                    <div style={{ marginTop: '6px' }}>📍 <strong>عنوان التسليم للعميل:</strong> {order.address_details || order.delivery_address || 'الدوحة - قطر'}</div>
                  </div>

                  {/* 💬 زر إرسال تنبيه الواتساب للعميل */}
                  {order.customer_phone && (
                    <button
                      onClick={() => handleSendWhatsApp(order.customer_phone, `مرحباً، معك مندوب منصة موجود أوتو بشأن طلبك رقم (#ORD-${order.id}). أنا في طريقي لاستلام القطعة وتوصيلها لك.`)}
                      style={{ width: '100%', padding: '9px', backgroundColor: '#25d366', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', marginBottom: '14px' }}
                    >
                      💬 إشعار العميل عبر الواتساب (تنبيه بالوصول)
                    </button>
                  )}

                  {/* 📷 التقاط صورة الإثبات للكاميرا المباشرة */}
                  <div style={{ marginBottom: '14px', padding: '12px', border: '2px dashed #cbd5e0', borderRadius: '10px', textAlign: 'center', backgroundColor: '#faf5ff' }}>
                    <label style={{ display: 'block', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#553c9a' }}>
                      📷 {uploadingState[`pickup_${order.id}`] ? (isRtl ? 'جاري رفع الصورة...' : 'Uploading...') : (isRtl ? 'اضغط لفتح الكاميرا المباشرة وتصوير القطعة في الكراج' : 'Take Garage Camera Photo')}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = await handleImageUpload(e.target.files[0], `pickup_${order.id}`);
                            if (url) setPickupImages(prev => ({ ...prev, [order.id]: url }));
                          }
                        }}
                      />
                    </label>
                    {currentPickupImg && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={currentPickupImg} alt="Pickup Proof" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #38a169' }} />
                        <span style={{ display: 'block', fontSize: '11px', color: '#38a169', fontWeight: 'bold', marginTop: '2px' }}>✅ تم التقاط الصورة بنجاح</span>
                      </div>
                    )}
                  </div>

                  {/* ⚡ زر تأكيد الاستلام المباشر والفعال */}
                  <button
                    onClick={() => handleAcceptDelivery(order)}
                    style={{ 
                      width: '100%', padding: '13px', backgroundColor: currentPickupImg ? '#16a34a' : '#94a3b8', 
                      color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14.5px', 
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s' 
                    }}
                  >
                    🚀 تأكيد الاستلام والبدء بالتوصيل
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2️⃣ الطلبات قيد التوصيل مع المندوب */}
      {activeTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {activeDeliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#718096' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🛵</span>
              {isRtl ? 'لا توجد شحنات قيد التوصيل حالياً.' : 'No active deliveries.'}
            </div>
          ) : (
            activeDeliveries.map(order => (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', border: '2px solid #dd6b20', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fffaf0', color: '#dd6b20', padding: '3px 8px', borderRadius: '6px' }}>
                    قيد التوصيل {order.order_code || `#ORD-${order.id}`}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d3748' }}>{order.price || order.part_price || 0} QAR</span>
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '16.5px', color: '#1a365d' }}>📦 {order.part_name || 'قطعة غيار'}</h3>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#4a5568', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {order.customer_phone && <div>📞 العميل: <a href={`tel:${order.customer_phone}`} style={{ color: '#3182ce', fontWeight: 'bold' }}>{order.customer_phone}</a></div>}
                  <div>📍 العنوان: <strong>{order.address_details || order.delivery_address || 'غير محدد'}</strong></div>

                  {/* 🗺️ فتح خرائط جوجل لموقع العميل */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address_details || order.delivery_address || 'Doha Qatar')}`}
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
                </div>

                {/* تصوير إثبات التسليم للعميل الكاميرا المباشرة */}
                <div style={{ marginBottom: '14px', padding: '12px', border: '2px dashed #cbd5e0', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f0fff4' }}>
                  <label style={{ display: 'block', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#276749' }}>
                    📷 {uploadingState[`delivery_${order.id}`] ? (isRtl ? 'جاري رفع الصورة...' : 'Uploading...') : (isRtl ? 'اضغط لفتح الكاميرا المباشرة وتصوير تسليم العميل' : 'Take Delivery Camera Photo')}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const url = await handleImageUpload(e.target.files[0], `delivery_${order.id}`);
                          if (url) setDeliveryImages(prev => ({ ...prev, [order.id]: url }));
                        }
                      }}
                    />
                  </label>
                  {(deliveryImages[order.id] || order.delivery_image_url) && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={deliveryImages[order.id] || order.delivery_image_url} alt="Delivery Proof" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #38a169' }} />
                      <span style={{ display: 'block', fontSize: '11px', color: '#38a169', fontWeight: 'bold', marginTop: '2px' }}>✅ تم التقاط الصورة بنجاح</span>
                    </div>
                  )}
                </div>

                {/* كود التسليم والإنهاء */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={isRtl ? 'أدخل كود العميل (إن وجد)' : 'Enter customer code'}
                    value={deliveryCodeInputs[order.id] || ''}
                    onChange={(e) => setDeliveryCodeInputs({ ...deliveryCodeInputs, [order.id]: e.target.value })}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => handleConfirmDelivery(order)}
                    style={{ backgroundColor: (deliveryImages[order.id] || order.delivery_image_url) ? '#38a169' : '#a0aec0', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✅ إتمام التسليم
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* 3️⃣ السجل المكتمل */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {completedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#718096' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🏁</span>
              {isRtl ? 'لا توجد طلبات مكتملة بعد.' : 'No completed deliveries.'}
            </div>
          ) : (
            completedOrders.map(order => (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#2d3748' }}>{order.part_name || 'قطعة غيار'}</h4>
                    <span style={{ fontSize: '12px', color: '#718096' }}>كود: {order.order_code || `#ORD-${order.id}`}</span>
                  </div>
                  <span style={{ backgroundColor: '#f0fff4', color: '#2f855a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>✅ مكتمل وموثق</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px dashed #edf2f7', paddingTop: '10px' }}>
                  {order.pickup_image_url && (
                    <div>
                      <span style={{ display: 'block', fontSize: '10.5px', color: '#718096', marginBottom: '3px' }}>صورة الكراج</span>
                      <a href={order.pickup_image_url} target="_blank" rel="noreferrer">
                        <img src={order.pickup_image_url} alt="Pickup" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
                      </a>
                    </div>
                  )}
                  {order.delivery_image_url && (
                    <div>
                      <span style={{ display: 'block', fontSize: '10.5px', color: '#718096', marginBottom: '3px' }}>صورة التسليم</span>
                      <a href={order.delivery_image_url} target="_blank" rel="noreferrer">
                        <img src={order.delivery_image_url} alt="Delivery" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default DeliveryDashboard;
