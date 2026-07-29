import React from 'react';

interface FooterProps {
  lang: 'ar' | 'en';
  siteSettings: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
  onNavigate: (view: any) => void;
  session: any;
}

export const Footer: React.FC<FooterProps> = ({ lang, siteSettings, onNavigate, session }) => {
  const isRtl = lang === 'ar';

  const fbUrl = siteSettings?.facebook || 'https://facebook.com';
  const instaUrl = siteSettings?.instagram || 'https://instagram.com';
  const twUrl = siteSettings?.twitter || 'https://twitter.com';
  const waNum = siteSettings?.whatsapp || '97455000000';

  return (
    <footer style={{ backgroundColor: '#0b1118', color: '#e2e8f0', borderTop: '1px solid #1e293b', paddingTop: '45px', paddingBottom: '30px', marginTop: '60px', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '35px' }}>
        
        {/* 🛠️ العمود الأول: خدمة العملاء */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', marginBottom: '18px', borderInlineStart: '3px solid #e0872a', paddingInlineStart: '10px' }}>
            | {isRtl ? 'خدمة العملاء' : 'Customer Service'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '13.5px', color: '#94a3b8' }}>
            <li style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => alert(isRtl ? 'للتواصل: support@mawjood.com' : 'Contact us at support@mawjood.com')}>
              👤 {isRtl ? 'اتصل بنا' : 'Contact Us'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => alert(isRtl ? 'الأسئلة الشائعة: كيف تطلب قطعة غيار؟ يمكنك البحث بالماركة والموديل والتواصل مع الكراج مباشرة.' : 'FAQ Section')}>
              ❓ {isRtl ? 'الأسئلة الشائعة' : 'FAQ'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => alert(isRtl ? 'المقالات والنصائح الميكانيكية قريباً' : 'Articles Coming Soon')}>
              ⚙️ {isRtl ? 'المقالات والنصائح' : 'Articles'}
            </li>
          </ul>
        </div>

        {/* ℹ️ العمود الثاني: المعلومات */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', marginBottom: '18px', borderInlineStart: '3px solid #e0872a', paddingInlineStart: '10px' }}>
            | {isRtl ? 'عن موجود أوتو' : 'Information'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '13.5px', color: '#94a3b8' }}>
            <li style={{ cursor: 'pointer' }} onClick={() => alert(isRtl ? 'موجود أوتو هي المنصة الأولى لربط العملاء بالكراجات والمحلات وتوصيل قطع الغيار.' : 'About Us')}>
              ℹ️ {isRtl ? 'من نحن' : 'About Us'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => alert(isRtl ? 'سياسة الخصوصية والاسترجاع محفوظة لجميع الأطراف.' : 'Policies')}>
              📑 {isRtl ? 'السياسات والخصوصية' : 'Policies'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => alert(isRtl ? 'الشروط والأحكام الاستخدام المنصة' : 'Terms & Conditions')}>
              📜 {isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => alert(isRtl ? 'آخر أخبار السيارات والتحديثات' : 'News')}>
              📰 {isRtl ? 'الأخبار والتحديثات' : 'News'}
            </li>
          </ul>
        </div>

        {/* 👤 العمود الثالث: حسابي */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', marginBottom: '18px', borderInlineStart: '3px solid #e0872a', paddingInlineStart: '10px' }}>
            | {isRtl ? 'حسابي' : 'My Account'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '13.5px', color: '#94a3b8' }}>
            <li style={{ cursor: 'pointer' }} onClick={() => session ? onNavigate('profile') : onNavigate('auth')}>
              📦 {isRtl ? 'طلباتي واستفساراتي' : 'Orders'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => onNavigate('shop')}>
              ❤️ {isRtl ? 'المفضلة والقطع' : 'Wishlist'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => session?.role === 'garage' ? onNavigate('dashboard') : onNavigate('auth')}>
              🚘 {isRtl ? 'حساب الكراج' : 'Garage'}
            </li>
            <li style={{ cursor: 'pointer' }} onClick={() => session ? onNavigate('profile') : onNavigate('auth')}>
              👤 {isRtl ? 'الملف الشخصي' : 'Profile'}
            </li>
          </ul>
        </div>

        {/* 🌐 العمود الرابع: السوشل ميديا (مرتبطة بالأدمن) */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', marginBottom: '18px', borderInlineStart: '3px solid #e0872a', paddingInlineStart: '10px' }}>
            | {isRtl ? 'تواصل معنا' : 'Social Links'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <a href={fbUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              f {isRtl ? 'فيسبوك' : 'Facebook'}
            </a>
            <a href={instaUrl} target="_blank" rel="noreferrer" style={{ color: '#ec4899', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📷 {isRtl ? 'إنستغرام' : 'Instagram'}
            </a>
            <a href={twUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🐦 {isRtl ? 'تويتر / منصة X' : 'Twitter'}
            </a>
            <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 {isRtl ? 'واتساب التواصل' : 'Whatsapp'}
            </a>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '1240px', margin: '35px auto 0', paddingTop: '20px', borderTop: '1px solid #1e293b', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
        © {new Date().getFullYear()} {isRtl ? 'جميع الحقوق محفوظة لموقع موجود أوتو Mawjood Auto' : 'All Rights Reserved to Mawjood Auto'}.
      </div>
    </footer>
  );
};
