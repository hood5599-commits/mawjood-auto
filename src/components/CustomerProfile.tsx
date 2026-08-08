import React, { useState, useEffect } from 'react';

interface CustomerProfileProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ lang, supabaseUrl, apiKey, session }) => {
  const isRtl = lang === 'ar';
  const role = session?.role || session?.user?.user_metadata?.role || 'customer';

  // 1. البيانات الشخصية العامة والعنوان
  const [fullName, setFullName] = useState(session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.garage_name || '');
  const [phone, setPhone] = useState(session?.phone || session?.user?.user_metadata?.phone || '');
  const [garageName, setGarageName] = useState(session?.user?.user_metadata?.garage_name || '');
  const [address, setAddress] = useState(session?.user?.user_metadata?.address || '');

  // 📍 حالة تحديد موقع الـ GPS التلقائي
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // 2. بيانات المندوب الخاصة
  const [vehicleType, setVehicleType] = useState(session?.user?.user_metadata?.vehicle_type || '');
  const [plateNumber, setPlateNumber] = useState(session?.user?.user_metadata?.plate_number || '');
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(session?.user?.user_metadata?.is_online ?? true);

  // 3. الصور والتوثيق
  const [documentImage, setDocumentImage] = useState<string>(
    session?.user?.user_metadata?.cr_image || session?.user?.user_metadata?.id_card_image || ''
  );

  // 4. سيارات العميل
  const [cars, setCars] = useState<any[]>(session?.user?.user_metadata?.cars || []);
  const [newCarMake, setNewCarMake] = useState('');
  const [newCarModel, setNewCarModel] = useState('');
  const [newCarYear, setNewCarYear] = useState('');

  // 5. كلمة المرور
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 6. حالات الواجهة
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      if (meta.full_name) setFullName(meta.full_name);
      if (meta.garage_name) setGarageName(meta.garage_name);
      if (meta.phone) setPhone(meta.phone);
      if (meta.address) setAddress(meta.address);
      if (meta.vehicle_type) setVehicleType(meta.vehicle_type);
      if (meta.plate_number) setPlateNumber(meta.plate_number);
      if (meta.cars) setCars(meta.cars);
      if (meta.cr_image || meta.id_card_image) setDocumentImage(meta.cr_image || meta.id_card_image);
    }
  }, [session]);

  // 🎯 1. دالة التحديد التلقائي لموقع العميل الجغرافي (GPS Auto-Detect)
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      return setMsg({
        text: isRtl ? 'خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك' : 'Geolocation is not supported by your browser',
        type: 'error'
      });
    }

    setIsDetectingGPS(true);
    setMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        
        setAddress(mapUrl);
        setIsDetectingGPS(false);
        setMsg({
          text: isRtl ? '🎯 تم التقاط موقعك الجغرافي بنجاح! اضغط "حفظ التحديثات" للتأكيد' : 'GPS location detected! Click save to confirm',
          type: 'success'
        });
      },
      (error) => {
        setIsDetectingGPS(false);
        console.error("GPS Detection Error:", error);
        setMsg({
          text: isRtl ? '⚠️ تعذر التقاط موقعك تلقائياً، تأكد من تفعيل الـ GPS بالجوال أو ادخل العنوان يدوياً' : 'Failed to detect location automatically',
          type: 'error'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 📸 رفع الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return setMsg({ text: isRtl ? 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت' : 'Image size exceeds 5MB', type: 'error' });
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🚗 إضافة سيارة جديدة
  const handleAddCar = () => {
    if (!newCarMake || !newCarModel || !newCarYear) {
      return setMsg({ text: isRtl ? 'يرجى تعبئة كافة بيانات السيارة' : 'Please fill all car details', type: 'error' });
    }
    const updatedCars = [...cars, { id: Date.now(), make: newCarMake, model: newCarModel, year: newCarYear }];
    setCars(updatedCars);
    setNewCarMake('');
    setNewCarModel('');
    setNewCarYear('');
    setMsg({ text: isRtl ? 'تم إضافة السيارة للقائمة، احفظ التغييرات لتأكيدها' : 'Car added to list', type: 'success' });
  };

  // 🗑️ حذف سيارة
  const handleRemoveCar = (carId: number) => {
    setCars(cars.filter(c => c.id !== carId));
  };

  // 💾 حفظ تحديثات الملف الشخصي وموقع العميل
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const updatedData: any = {
      full_name: fullName,
      phone: phone,
      address: address, // 👈 حفظ رابط أو عنوان الـ GPS التلقائي
      updated_at: new Date().toISOString()
    };

    if (role === 'customer') {
      updatedData.cars = cars;
    } else if (role === 'garage') {
      updatedData.garage_name = garageName;
      updatedData.cr_image = documentImage;
    } else if (role === 'driver') {
      updatedData.vehicle_type = vehicleType;
      updatedData.plate_number = plateNumber;
      updatedData.is_online = isDriverOnline;
      updatedData.id_card_image = documentImage;
    }

    try {
      const authEndpoint = `${supabaseUrl.replace('/rest/v1', '')}/auth/v1/user`;
      const response = await fetch(authEndpoint, {
        method: 'PUT',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: updatedData })
      });

      if (response.ok) {
        setMsg({ text: isRtl ? 'تم حفظ التحديثات والموقع بنجاح 🎉' : 'Profile and location updated successfully!', type: 'success' });
        
        const savedSession = JSON.parse(localStorage.getItem('mawjood_session') || '{}');
        if (savedSession.user) {
          savedSession.user.user_metadata = { ...savedSession.user.user_metadata, ...updatedData };
          localStorage.setItem('mawjood_session', JSON.stringify(savedSession));
        }
      } else {
        const errorData = await response.json();
        setMsg({ text: errorData.msg || (isRtl ? 'حدث خطأ أثناء حفظ البيانات' : 'Failed to save changes'), type: 'error' });
      }
    } catch (err) {
      setMsg({ text: isRtl ? 'خطأ في الاتصال بالخادم' : 'Connection error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 🔐 تغيير كلمة المرور
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!newPassword || newPassword.length < 6) {
      return setMsg({ text: isRtl ? 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 chars', type: 'error' });
    }

    if (newPassword !== confirmPassword) {
      return setMsg({ text: isRtl ? 'كلمة المرور الجديدة غير متطابقة' : 'Passwords do not match', type: 'error' });
    }

    setPasswordLoading(true);

    try {
      const authEndpoint = `${supabaseUrl.replace('/rest/v1', '')}/auth/v1/user`;
      const response = await fetch(authEndpoint, {
        method: 'PUT',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (response.ok) {
        setMsg({ text: isRtl ? 'تم تغيير كلمة المرور بنجاح! 🔐' : 'Password updated successfully!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errData = await response.json();
        setMsg({ text: errData.msg || (isRtl ? 'تعذر تغيير كلمة المرور' : 'Failed to update password'), type: 'error' });
      }
    } catch (err) {
      setMsg({ text: isRtl ? 'حدث خطأ في الاتصال' : 'Connection error', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '20px auto', padding: '0 15px', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 👤 الهيدر الرئيسي */}
      <div style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '24px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', backgroundColor: '#1f3a5f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold' }}>
            {role === 'garage' ? '⚙️' : role === 'driver' ? '🛵' : '👤'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'var(--mw-ink, #131c26)' }}>
              {fullName || garageName || (isRtl ? 'المستخدم' : 'User')}
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              {session?.email || phone}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {role === 'driver' && (
            <button
              onClick={() => setIsDriverOnline(!isDriverOnline)}
              style={{
                padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px',
                backgroundColor: isDriverOnline ? '#e8f9f1' : '#fdecec',
                color: isDriverOnline ? '#1e9d6b' : '#d1453b',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isDriverOnline ? '#1e9d6b' : '#d1453b' }} />
              {isDriverOnline ? (isRtl ? 'متاح للطلبات 🟢' : 'Online 🟢') : (isRtl ? 'غير متاح 🔴' : 'Offline 🔴')}
            </button>
          )}

          <span style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 'bold', backgroundColor: role === 'garage' ? '#fdf1e3' : role === 'driver' ? '#e8f2fc' : '#f1f5f9', color: role === 'garage' ? '#e0872a' : role === 'driver' ? '#1f3a5f' : '#475569' }}>
            {role === 'garage' && (isRtl ? '⚙️ كراج معتمد' : '⚙️ Garage')}
            {role === 'driver' && (isRtl ? '🛵 مندوب توصيل' : '🛵 Driver')}
            {role === 'customer' && (isRtl ? '👤 عميل مميز' : '👤 Customer')}
          </span>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', fontSize: '13.5px', textAlign: 'center', backgroundColor: msg.type === 'success' ? '#e8f9f1' : '#fdecec', color: msg.type === 'success' ? '#1e9d6b' : '#d1453b', border: `1px solid ${msg.type === 'success' ? '#a3e6cd' : '#f8b4b4'}` }}>
          {msg.text}
        </div>
      )}

      {/* 📝 1. نموذج تعديل البيانات وتحديد موقع التسليم الـ GPS */}
      <div style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '26px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--mw-ink, #131c26)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          📝 {isRtl ? 'تعديل البيانات الأساسية وموقع التسليم' : 'Edit Personal Details & Delivery Location'}
        </h3>

        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          
          {role === 'garage' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                {isRtl ? 'اسم الكراج / المحل' : 'Garage Name'}
              </label>
              <input
                type="text"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                required
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                {isRtl ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
              {isRtl ? 'رقم الهاتف / التواصل' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
              required
            />
          </div>

          {/* 📍 حقل العنوان التلقائي مع زر الـ GPS الفوري */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                📍 {isRtl ? 'عنوان وموقع التسليم (يظهر للمندوب مباشرة):' : 'Delivery Address:'}
              </label>

              {/* 🎯 زر الالتقاط التلقائي لموقع GPS العميل */}
              <button
                type="button"
                onClick={handleAutoDetectGPS}
                disabled={isDetectingGPS}
                style={{
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🎯 {isDetectingGPS ? (isRtl ? 'جاري التقاط الموقع...' : 'Detecting...') : (isRtl ? 'تحديد موقعي التلقائي (GPS)' : 'Auto-Detect Location')}
              </button>
            </div>

            <input
              type="text"
              placeholder={isRtl ? 'اضغط زر التحديد التلقائي أعلاه أو ادخل رابط/عنوان منطقتك...' : 'Enter your address or use auto-detect above'}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {/* حقول المندوب الخاصة */}
          {role === 'driver' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                  {isRtl ? 'نوع المركبة' : 'Vehicle Type'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: تويوتا هايس / بيك أب' : 'Vehicle type'}
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                  {isRtl ? 'رقم اللوحة' : 'Plate Number'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: 123456"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px 28px', backgroundColor: '#1f3a5f', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer' }}
            >
              {loading ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التحديثات والموقع 💾' : 'Save Changes & Location')}
            </button>
          </div>
        </form>
      </div>

      {/* 📄 2. قسم التوثيق (خاص بالكراج والمندوب) */}
      {(role === 'garage' || role === 'driver') && (
        <div style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '26px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--mw-ink, #131c26)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            📄 {role === 'garage' ? (isRtl ? 'صورة السجل التجاري' : 'Commercial Registration (CR)') : (isRtl ? 'صورة البطاقة الشخصية' : 'Civil ID Card')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px' }}
            />

            {documentImage && (
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#1e9d6b' }}>
                  ✅ {isRtl ? 'تم رفع المستند المعاين:' : 'Uploaded Document Preview:'}
                </span>
                <img
                  src={documentImage}
                  alt="Document"
                  style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '14px', border: '2px dashed #cbd5e0', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🚗 3. قسم إدارة السيارات (خاص بالعميل) */}
      {role === 'customer' && (
        <div style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '26px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--mw-ink, #131c26)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            🚗 {isRtl ? 'سياراتي المحفوظة' : 'My Saved Cars'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder={isRtl ? 'الماركة (تويوتا)' : 'Make (e.g. Toyota)'}
              value={newCarMake}
              onChange={(e) => setNewCarMake(e.target.value)}
              style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
            />
            <input
              type="text"
              placeholder={isRtl ? 'الموديل (كامري)' : 'Model (e.g. Camry)'}
              value={newCarModel}
              onChange={(e) => setNewCarModel(e.target.value)}
              style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
            />
            <input
              type="text"
              placeholder={isRtl ? 'السنة (2022)' : 'Year (e.g. 2022)'}
              value={newCarYear}
              onChange={(e) => setNewCarYear(e.target.value)}
              style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={handleAddCar}
              style={{ padding: '9px 16px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              ➕ {isRtl ? 'إضافة سيارة' : 'Add Car'}
            </button>
          </div>

          {cars.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', margin: '10px 0' }}>
              {isRtl ? 'لم تقم بإضافة أية سيارات لملفك بعد.' : 'No saved cars yet.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cars.map((car) => (
                <div key={car.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                    🚘 {car.make} - {car.model} ({car.year})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCar(car.id)}
                    style={{ backgroundColor: '#fdecec', color: '#d1453b', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🗑️ {isRtl ? 'حذف' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔐 4. قسم تغيير كلمة المرور */}
      <div style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '26px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '30px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--mw-ink, #131c26)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          🔐 {isRtl ? 'تغيير كلمة المرور' : 'Change Password'}
        </h3>

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
              {isRtl ? 'كلمة المرور الحالية' : 'Current Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
              {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
              {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={passwordLoading}
              style={{ padding: '12px 28px', backgroundColor: '#e0872a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer' }}
            >
              {passwordLoading ? (isRtl ? 'جاري التحديث...' : 'Updating...') : (isRtl ? 'تحديث كلمة المرور 🔐' : 'Update Password')}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default CustomerProfile;
