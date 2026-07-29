import React from 'react';

export type StaticPageView = 'contact' | 'faq' | 'articles' | 'about' | 'privacy' | 'terms' | 'news';

interface StaticPagesProps {
  lang: 'ar' | 'en';
  view: StaticPageView;
  onNavigate: (view: any) => void;
  siteSettings?: any;
}

export const StaticPages: React.FC<StaticPagesProps> = ({ lang, view, onNavigate, siteSettings }) => {
  const isRtl = lang === 'ar';

  // نصوص التعديل المباشر من لوحة الأدمن
  const customTerms = siteSettings?.terms;
  const customPrivacy = siteSettings?.privacy;
  const customAbout = siteSettings?.about;

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '30px', backgroundColor: '#ffffff', borderRadius: '22px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 🔄 قائمة تنقل سريعة بين الصفحات */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        {[
          { id: 'about', label: isRtl ? 'ℹ️ من نحن' : 'About Us' },
          { id: 'terms', label: isRtl ? '📜 الشروط والأحكام' : 'Terms' },
          { id: 'privacy', label: isRtl ? '📑 الخصوصية' : 'Privacy' },
          { id: 'faq', label: isRtl ? '❓ الأسئلة الشائعة' : 'FAQ' },
          { id: 'contact', label: isRtl ? '👤 اتصل بنا' : 'Contact Us' },
          { id: 'articles', label: isRtl ? '⚙️ المقالات والنصائح' : 'Articles' },
          { id: 'news', label: isRtl ? '📰 الأخبار والتحديثات' : 'News' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              backgroundColor: view === item.id ? '#1f3a5f' : '#f8fafc',
              color: view === item.id ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1️⃣ صفحة اتصل بنا */}
      {view === 'contact' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>👤 {isRtl ? 'اتصل بنا - خدمة العملاء' : 'Contact Us'}</h2>
          <p style={{ color: '#475569', lineHeight: '1.8' }}>
            نحن هنا لمساعدتك في العثور على قطعة الغيار المناسبة لسيارتك أو متابعة طلباتك مع الكراجات والمناديب.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
            <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f3a5f' }}>💬 التواصل السريع عبر الواتساب</h4>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>المساعدة الفورية والاستفسارات: <strong>{siteSettings?.whatsapp ? `+${siteSettings.whatsapp}` : '+97455000000'}</strong></p>
            </div>

            <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f3a5f' }}>✉️ البريد الإلكتروني للدعم</h4>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>support@mawjood.com</p>
            </div>

            <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f3a5f' }}>⏰ ساعات العمل</h4>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>السبت - الخميس: 8:00 صباحاً - 10:00 مساءً</p>
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ صفحة الأسئلة الشائعة */}
      {view === 'faq' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>❓ {isRtl ? 'الأسئلة الشائعة (FAQ)' : 'Frequently Asked Questions'}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>س: كيف أضمن أن قطعة الغيار مطابقة تماماً لسيارتي؟</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>ج: يقوم نظام موجود أوتو بمطابقة رقم الشاسي (VIN) والماركة والموديل وسنة الصنع تلقائياً، كما يمكنك إرسال رقم الشاسي للكراج للتأكد 100% قبل الشراء.</p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>س: كم يستغرق وصول الطلب؟</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>ج: يستغرق التوصيل داخل المناطق الرئيسية في قطر من ساعتين إلى 24 ساعة كحد أقصى فور تأكيد الكراج لتوفر القطعة.</p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>س: ماذا يحدث إذا كانت القطعة المرسلة غير مطابقة أو بها عيب؟</h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>ج: تضمن المنصة استرجاع المبلغ أو استبدال القطعة مجاناً خلال 3 أيام بشرط عدم استخدامها وإرجاعها بغلافها الأصلي.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ صفحة المقالات والنصائح */}
      {view === 'articles' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>⚙️ {isRtl ? 'دليل السيارات والمقالات الميكانيكية' : 'Articles & Car Tips'}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🔋</span>
              <h4 style={{ color: '#1f3a5f', margin: '10px 0 6px 0' }}>كيف تحافظ على بطارية سيارتك في صيف الخليج؟</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>تأثير درجات الحرارة العالية على العمر الافتراضي للبطارية، وأهمية فحص دينامو الشحن بشكل دوري.</p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🛢️</span>
              <h4 style={{ color: '#1f3a5f', margin: '10px 0 6px 0' }}>الفرق بين قطع الغيار الأصلية (OEM) والتجارية</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>متى يجب عليك اختيار القطعة الأصلية من الوكالة، ومتى تكون القطع البديلة عالية الجودة خياراً ممتازا وموفراً.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4️⃣ صفحة من نحن */}
      {view === 'about' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>ℹ️ {isRtl ? 'عن موجود أوتو (Mawjood Auto)' : 'About Us'}</h2>
          {customAbout ? (
            <div style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: '1.8', fontSize: '14.5px' }}>{customAbout}</div>
          ) : (
            <>
              <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '14.5px' }}>
                <strong>موجود أوتو</strong> هي المنصة الرقمية الرائدة في قطر المخصصة لربط ملاك السيارات بكراجات ومحلات قطع الغيار المعتمدة ومندوبي التوصيل في مكان واحد.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fdf1e3', border: '1px solid #fed7aa' }}>
                  <h4 style={{ color: '#e0872a', margin: '0 0 6px 0' }}>🎯 رؤيتنا</h4>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>تحويل عملية البحث عن قطع الغيار من رحلة استكشافية متعبة إلى تجربة بنقرة زر واحدة.</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#e8f2fc', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ color: '#1f3a5f', margin: '0 0 6px 0' }}>⚡ رسالتنا</h4>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>توفير قطع الغيار الموثوقة بأفضل الأسعار وأعلى مستويات الأمان والسرعة.</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 5️⃣ صفحة سياسة الخصوصية */}
      {view === 'privacy' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>📑 {isRtl ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy'}</h2>
          {customPrivacy ? (
            <div style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: '1.8', fontSize: '13.5px' }}>{customPrivacy}</div>
          ) : (
            <div style={{ color: '#475569', lineHeight: '1.8', fontSize: '13.5px' }}>
              <p>نحن في <strong>موجود أوتو</strong> نلتزم بأقصى درجات الحماية لبيانات مستخدمينا وفقاً للقوانين واللوائح الرقمية في دولة قطر:</p>
              <ul>
                <li><strong>البيانات المحفوظة:</strong> نجمع فقط البيانات الضرورية لتنفيذ الطلبات (رقم الهاتف، العنوان، بيانات السيارة).</li>
                <li><strong>حماية البيانات:</strong> لا يتم مشاركة بيانات التواصل الخاصة بالعميل إلا مع الكراج والمندوب المعنيين بتنفيذ الطلب.</li>
                <li><strong>السرية والأمان:</strong> جميع عمليات نقل البيانات والتسجيل مشفرة باستخدام أحدث تقنيات التشفير الرقمية.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 6️⃣ صفحة الشروط والأحكام */}
      {view === 'terms' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>📜 {isRtl ? 'الشروط والأحكام والاستخدام' : 'Terms & Conditions'}</h2>
          
          {customTerms ? (
            <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: '1.8', fontSize: '14px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              {customTerms}
            </div>
          ) : (
            <div style={{ color: '#334155', lineHeight: '1.8', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#fffbe3', border: '1px solid #fef08a' }}>
                <strong>1. طبيعة عمل منصة موجود أوتو:</strong> منصة موجود أوتو هي منصة تقنية وسيطة تُربط بين المشتري (العميل) والبائع (الكراج/المحل) ومقدم خدمة النقل (المندوب). المنصة ليست مالكاً أصلياً للقطع المعروضة، وتقتصر مسؤوليتها على تنظيم وإدارة عملية الطلب والدفع والتوصيل.
              </div>

              <div>
                <strong>2. مسؤولية مطابقة القطعة:</strong> يلتزم العميل بتزويد المنصة والكراج برقم الشاسي (VIN) الصحيح للسيارة. وفي حال أرسل العميل بيانات خاطئة، يتحمل العميل رسوم التوصيل عند الاستبدال. بينما يتكفل الكراج بالكامل بتكلفة القطعة والتوصيل إذا أرسل قطعة غير مطابقة للبيانات المزودة.
              </div>

              <div>
                <strong>3. الاسترجاع والضمان:</strong> يُسمح باسترجاع القطعة خلال <strong>3 أيام</strong> من تاريخ الاستلام، بشرط أن تكون بنفس حالتها الأصلية وبغلافها بدون تركيب أو تلف. لا تشمل سياسة الاسترجاع القطع الكهربائية التي تعرضت للاحتراق أو الفحص التجريبي الخاطئ من قبل الفنيين غير المعتمدين.
              </div>

              <div>
                <strong>4. رسوم الخدمة والتوصيل:</strong> جميع الأسعار المعروضة شاملة لأسعار القطع المحددة من الكراجات. وفي حال التراجع عن الطلب بعد تحرك المندوب، يتم خصم رسوم التوصيل الفعلية لصالح المندوب.
              </div>

              <div>
                <strong>5. حد المسؤولية:</strong> منصة موجود أوتو غير مسؤولة عن أية أضرار ميكانيكية أو تركيبية تنتج عن التركيب الخاطئ للقطعة في ورش غير معتمدة خارج المنصة.
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7️⃣ صفحة الأخبار والتحديثات */}
      {view === 'news' && (
        <div>
          <h2 style={{ color: '#1f3a5f', marginTop: 0 }}>📰 {isRtl ? 'الأخبار والتحديثات' : 'News & System Updates'}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#e0872a', fontWeight: 'bold' }}>تحديث النظام - 2026</span>
              <h4 style={{ margin: '4px 0', color: '#1f3a5f' }}>إطلاق نظام الدفع المباشر والتوثيق الرقمي للكراجات</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>تم تفعيل خدمة توثيق السجلات التجارية للكراجات وتتبع الطلبات لحظة بلحظة مع مناديب التوصيل في قطر.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
