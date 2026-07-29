import { useState, useEffect } from 'react';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { GarageDashboard } from './components/GarageDashboard';
import { SidebarFilters } from './components/SidebarFilters';
import { CustomerProfile } from './components/CustomerProfile';
import { CustomerFitmentCheckout } from './components/CustomerFitmentCheckout';
import { CustomerOrderTracker } from './components/CustomerOrderTracker';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { StaticPages, type StaticPageView } from './components/StaticPages';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const AUTH_URL = "https://shszpcjmhkemqwborfwy.supabase.co/auth/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

const TRANSLATE_MAKE: Record<string, string> = { "تويوتا": "Toyota", "هيونداي": "Hyundai", "نيسان": "Nissan", "فورد": "Ford", "شفروليه": "Chevrolet", "كيا": "Kia", "هوندا": "Honda", "لكزس": "Lexus", "ميتسوبيشي": "Mitsubishi", "مازدا": "Mazda", "جي إم سي": "GMC", "بي إم دبليو": "BMW", "مرسيدس": "Mercedes-Benz", "فولكس فاجن": "Volkswagen", "أودي": "Audi", "جيب": "Jeep", "دودج": "Dodge", "رام": "Ram", "لاند روفر": "Land Rover", "إنفينيتي": "Infiniti", "سوبارو": "Subaru", "رينو": "Renault", "سوزوكي": "Suzuki", "بورش": "Porsche", "كرايسلر": "Chrysler" };
const TRANSLATE_MODEL: Record<string, string> = { "كامري": "Camry", "كورولا": "Corolla", "يارس": "Yaris", "هيلوكس": "Hilux", "لاندكروزر": "Land Cruiser", "برادو": "Prado", "أفالون": "Avalon", "راف فور": "RAV4", "فورشنر": "Fortuner", "شاص": "LC70 (Shas)", "إلنترا": "Elantra", "سوناتا": "Sonata", "أكسنت": "Accent", "توسان": "Tucson", "سانتافي": "Santa Fe", "أزيرا": "Azera", "كريتا": "Creta", "كونا": "Kona", "باترول": "Patrol", "ألتيما": "Altima", "صني": "Sunny", "ماكسيما": "Maxima", "إكس تريل": "X-Trail", "نافارا": "Navara", "باثفايندر": "Pathfinder", "سنترا": "Sentra", "تورس": "Taurus", "إكسبلورر": "Explorer", "إف-150": "F-150", "إكسبديشن": "Expedition", "موستنج": "Mustang", "إيدج": "Edge", "رينجر": "Ranger", "تاهو": "Tahoe", "سوبربان": "Suburban", "سيلفرادو": "Silverado", "ماليبو": "Malibu", "كابتيفا": "Captiva", "ترافيرس": "Traverse", "كابرس": "Caprice", "سيراتو": "Cerato", "أوبتيما / K5": "Optima", "ريو": "Rio", "سبورتج": "Sportage", "سورينتو": "Sorento", "كادينزا / K8": "Cadenza", "بيغاس": "Pegas", "أكورد": "Accord", "سيفيك": "Civic", "سي آر في": "CR-V", "سيتي": "City", "بايلوت": "Pilot", "أوديسي": "Odyssey", "باجيرو": "Pajero", "لانسر": "Lancer", "أتراج": "Attrage", "إكليبس كروس": "Eclipse Cross", "L200": "L200", "مازدا 6": "Mazda 6", "مازدا 3": "Mazda 3", "CX-9": "CX-9", "CX-5": "CX-5", "يوكن": "Yukon", "سييرا": "Sierra", "أكاديا": "Acadia", "تيرين": "Terrain", "الفئة الثالثة": "3 Series", "الفئة الخامسة": "5 Series", "الفئة السابعة": "7 Series", "جولف": "Golf", "باسات": "Passat", "تيغوان": "Tiguan", "طوارق": "Touareg", "رانجلر": "Wrangler", "جراند شيروكي": "Grand Cherokee", "شيروكي": "Cherokee", "تشارجر": "Charger", "تشالنجر": "Challenger", "دورانجو": "Durango", "رينج روفر": "Range Rover", "ديفندر": "Defender", "ديسكفري": "Discovery", "فورستر": "Forester", "أوت باك": "Outback", "إمبريزا": "Impreza", "داستر": "Duster", "ميجان": "Megane", "كوليوس": "Koleos", "سويفت": "Swift", "جيمني": "Jimny", "فيتارا": "Vitara", "كايين": "Cayenne", "ماكان": "Macan", "911": "911" };
const CAR_DATA: Record<string, { models: string[], engines: string[] }> = { "تويوتا": { models: ["كامري", "كورولا", "يارس", "هيلوكس", "لاندكروزر", "برادو", "أفالون", "راف فور", "فورشنر", "شاص"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر", "هايبرد (الهجين)"] }, "هيونداي": { models: ["إلنترا", "سوناتا", "أكسنت", "توسان", "سانتافي", "أزيرا", "كريتا", "كونا"], engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"] }, "نيسان": { models: ["باترول", "ألتيما", "صني", "ماكسيما", "إكس تريل", "نافارا", "باثفايندر", "سنترا"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 5.6 لتر"] }, "فورد": { models: ["تورس", "إكسبلورر", "إف-150", "إكسبديشن", "موستنج", "إيدج", "رينجر"], engines: ["4 سلندر EcoBoost - 2.0 لتر", "6 سلندر - 3.5 لتر", "6 سلندر EcoBoost - 3.5 لتر", "8 سلندر - 5.0 لتر"] }, "شفروليه": { models: ["تاهو", "سوبربان", "سيلفرادو", "ماليبو", "كابتيفا", "ترافيرس", "كابرس"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.0 لتر", "8 سلندر - 6.2 لتر"] }, "كيا": { models: ["سيراتو", "أوبتيما / K5", "ريو", "سبورتج", "سورينتو", "كادينزا / K8", "بيغاس"], engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"] }, "هوندا": { models: ["أكورد", "سيفيك", "سي آر في", "سيتي", "بايلوت", "أوديسي"], engines: ["4 سلندر توربو - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.4 لتر", "6 سلندر - 3.5 لتر"] }, "لكزس": { models: ["ES", "LS", "LX", "RX", "GX", "IS", "UX"], engines: ["4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر توربو - 3.4 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر"] }, "ميتسوبيشي": { models: ["باجيرو", "لانسر", "أتراج", "إكليبس كروس", "L200"], engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.5 لتر"] }, "مازدا": { models: ["CX-9", "CX-5", "مازدا 6", "مازدا 3"], engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "4 سلندر توربو - 2.5 لتر"] }, "جي إم سي": { models: ["يوكن", "سييرا", "أكاديا", "تيرين"], engines: ["4 سلندر - 1.5 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.2 لتر"] }, "بي إم دبليو": { models: ["الفئة الثالثة", "الفئة الخامسة", "الفئة السابعة", "X5", "X6"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.4 لتر"] }, "مرسيدس": { models: ["C-Class", "E-Class", "S-Class", "G-Class", "GLE"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 4.0 لتر"] }, "فولكس فاجن": { models: ["جولف", "باسات", "تيغوان", "طوارق"], engines: ["4 سلندر توربو - 1.4 لتر", "4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر"] }, "أودي": { models: ["A3", "A4", "A6", "Q5", "Q7"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر"] }, "جيب": { models: ["رانجلر", "جراند شيروكي", "شيروكي"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] }, "دودج": { models: ["تشارجر", "تشالنجر", "دورانجو"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر", "8 سلندر - 6.4 لتر"] }, "رام": { models: ["1500"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] }, "لاند روفر": { models: ["رينج روفر", "ديفندر", "ديسكفري"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 5.0 لتر"] }, "إنفينيتي": { models: ["Q50", "QX50", "QX80"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.7 لتر", "8 سلندر - 5.6 لتر"] }, "سوبارو": { models: ["فورستر", "أوت باك", "إمبريزا"], engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر"] }, "رينو": { models: ["داستر", "ميجان", "كوليوس"], engines: ["4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر توربو - 1.3 لتر"] }, "سوزوكي": { models: ["سويفت", "جيمني", "فيتارا"], engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر"] }, "بورش": { models: ["كايين", "ماكان", "911"], engines: ["6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.0 لتر"] }, "كرايسلر": { models: ["300C"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] } };
const YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => (2026 - i).toString());
const PARTS_CATEGORIES = [ "Belt Drive", "Body & Lamp Assembly", "Brake & Wheel Hub", "Cooling System", "Drivetrain", "Electrical", "Electrical-Bulb & Socket", "Electrical-Connector", "Electrical-Switch & Relay", "Engine", "Exhaust & Emission", "Fuel & Air", "Heat & Air Conditioning", "Ignition", "Interior", "Steering", "Suspension", "Transmission-Automatic", "Wheel", "Wiper & Washer" ];

const styles: Record<string, React.CSSProperties> = { 
  page: { fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif", backgroundColor: 'var(--mw-bg, #F5F7FA)', minHeight: '100vh', paddingBottom: '60px', color: 'var(--mw-ink, #131C26)' }, 
  main: { maxWidth: '1240px', margin: '28px auto 0', padding: '0 20px' }, 
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [view, setView] = useState<'shop' | 'dashboard' | 'auth' | 'profile' | 'driver' | 'admin' | StaticPageView>('shop');
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedPartForCheckout, setSelectedPartForCheckout] = useState<{ part: any; initialStep?: 'inquire' | 'checkout' } | null>(null);
  const [showOrderTracker, setShowOrderTracker] = useState(false);

  const [inventory, setInventory] = useState<any[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // إعدادات السوشال ميديا والموقع وبوابة الدفع
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('mawjood_site_settings');
    return saved ? JSON.parse(saved) : { facebook: 'https://facebook.com', instagram: 'https://instagram.com', twitter: 'https://twitter.com', whatsapp: '97455000000' };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterEngine, setFilterEngine] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [theme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedMawjood');
    if (!hasVisited) setShowWelcome(true);

    const savedSession = localStorage.getItem('mawjood_session');
    if (savedSession) {
      try { 
        const parsed = JSON.parse(savedSession);
        setSession(parsed); 

        if (parsed.role === 'admin' || parsed.email?.endsWith('@admin.mawjood.com')) {
          setView('admin');
        } else if (parsed.role === 'driver' || parsed.email?.endsWith('@driver.mawjood.com')) {
          setView('driver');
        } else if (parsed.role === 'garage') {
          setView('dashboard');
        }
      } catch (e) {}
    }

    fetchParts();
  }, []);

  useEffect(() => {
    if (session) {
      const userId = session.phone || session.email || session.user?.id;
      if (userId) {
        const savedCart = localStorage.getItem(`mawjood_cart_${userId}`);
        if (savedCart) {
          try { setCartItems(JSON.parse(savedCart)); } catch (e) { setCartItems([]); }
        } else { setCartItems([]); }
      }
    } else { setCartItems([]); }
  }, [session]);

  useEffect(() => {
    if (session) {
      const userId = session.phone || session.email || session.user?.id;
      if (userId) {
        localStorage.setItem(`mawjood_cart_${userId}`, JSON.stringify(cartItems));
      }
    }
  }, [cartItems, session]);

  const handleUpdateSettings = (newSettings: any) => {
    setSiteSettings(newSettings);
    localStorage.setItem('mawjood_site_settings', JSON.stringify(newSettings));
  };

  const fetchParts = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/parts?select=*`, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setInventory(data.sort((a, b) => b.id - a.id));
      }
    } catch (error) { console.error(error); }
  };

  const handleBuyClick = (item: any) => {
    setSelectedPartForCheckout({ part: item, initialStep: 'inquire' });
  };

  const toggleCategory = (category: string) => { setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]); };

  const totalCartPrice = cartItems.reduce((total, item) => total + (Number(item.price) * (item.quantity || 1)), 0);
  const totalCartCount = cartItems.reduce((count, item) => count + (item.quantity || 1), 0);

  const isRtl = lang === 'ar';

  return (
    <>
      {showWelcome && (
        <WelcomeModal 
          lang={lang} 
          onStart={() => { 
            setShowWelcome(false); 
            localStorage.setItem('hasVisitedMawjood', 'true'); 
          }} 
        />
      )}

      <div className="mw-app-page" data-mw-theme={theme} dir={isRtl ? 'rtl' : 'ltr'} style={{ ...styles.page, direction: isRtl ? 'rtl' : 'ltr' }}>

        <Header 
          lang={lang} 
          setLang={setLang} 
          view={view as any} 
          setView={setView as any} 
          session={session} 
          cartCount={totalCartCount} 
          onOpenCart={() => setIsCartOpen(true)} 
          onLogout={() => { 
            setSession(null); 
            setCartItems([]); 
            localStorage.removeItem('mawjood_session'); 
            setView('shop'); 
          }} 
        />

        {session && session.role !== 'garage' && session.role !== 'driver' && session.role !== 'admin' && (
          <div style={{ maxWidth: '1240px', margin: '14px auto -10px', padding: '0 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowOrderTracker(true)} style={{ backgroundColor: '#1f3a5f', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              📦 {lang === 'ar' ? 'متابعة استفساراتي وطلباتي' : 'Track Inquiries & Orders'}
            </button>
          </div>
        )}

        {/* 🛒 السلة الجانبية Drawer */}
        {isCartOpen && (
          <>
            <div onClick={() => setIsCartOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
            <div style={{ position: 'fixed', top: 0, bottom: 0, [isRtl ? 'left' : 'right']: 0, width: '380px', maxWidth: '100%', backgroundColor: '#ffffff', zIndex: 101, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                <h3 style={{ margin: 0 }}>🛒 {lang === 'ar' ? 'سلة المشتريات' : 'Cart'}</h3>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✖</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                {cartItems.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={index} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px' }}>
                      <strong>{item.name}</strong>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>{item.price} QAR x {item.quantity || 1}</p>
                      <button onClick={() => setCartItems(cartItems.filter((_, i) => i !== index))} style={{ color: '#d1453b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        {lang === 'ar' ? 'حذف' : 'Remove'}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '12px' }}>
                    <span>{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                    <span>{totalCartPrice} QAR</span>
                  </div>
                  <button onClick={() => { setIsCartOpen(false); setSelectedPartForCheckout({ part: cartItems[0], initialStep: 'checkout' }); }} style={{ width: '100%', padding: '14px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🚀 {lang === 'ar' ? 'إتمام الشراء' : 'Checkout'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <main className="mw-main-container" style={styles.main}>

          {view === 'auth' && (
            <AuthModal 
              lang={lang} 
              authUrl={AUTH_URL} 
              apiKey={API_KEY} 
              onSuccess={(newSession: any) => { 
                setSession(newSession); 
                localStorage.setItem('mawjood_session', JSON.stringify(newSession)); 
                
                if (newSession.role === 'admin' || newSession.email?.endsWith('@admin.mawjood.com')) {
                  setView('admin');
                } else if (newSession.role === 'driver' || newSession.email?.endsWith('@driver.mawjood.com')) {
                  setView('driver');
                } else if (newSession.role === 'garage') {
                  setView('dashboard');
                } else {
                  setView('shop');
                }
              }} 
            />
          )}

          {/* 👑 واجهة مدير النظام الأدمن */}
          {view === 'admin' && (
            <AdminDashboard 
              lang={lang} 
              supabaseUrl={SUPABASE_URL} 
              apiKey={API_KEY} 
              session={session} 
              siteSettings={siteSettings} 
              onUpdateSettings={handleUpdateSettings} 
            />
          )}

          {/* 🛵 واجهة لوحة المندوب */}
          {view === 'driver' && (
            <DeliveryDashboard 
              lang={lang} 
              supabaseUrl={SUPABASE_URL} 
              apiKey={API_KEY} 
              session={session} 
            />
          )}

          {/* ⚙️ واجهة لوحة الكراج */}
          {view === 'dashboard' && session?.role === 'garage' && (
            <GarageDashboard 
              lang={lang} 
              carData={CAR_DATA} 
              years={YEARS} 
              supabaseUrl={SUPABASE_URL} 
              apiKey={API_KEY} 
              session={session} 
              onSuccess={() => { fetchParts(); setView('shop'); }} 
            />
          )}

          {/* 👤 واجهة الملف الشخصي */}
          {view === 'profile' && session && (
            <CustomerProfile 
              lang={lang} 
              supabaseUrl={SUPABASE_URL} 
              apiKey={API_KEY} 
              session={session} 
            />
          )}

          {/* 📄 عرض الصفحات التعريفية والمعلومات مع تمرير siteSettings */}
          {['contact', 'faq', 'articles', 'about', 'privacy', 'terms', 'news'].includes(view) && (
            <StaticPages 
              lang={lang} 
              view={view as StaticPageView} 
              onNavigate={(v) => setView(v as any)} 
              siteSettings={siteSettings}
            />
          )}

          {view === 'shop' && (
            <div style={{ marginTop: '20px', width: '100%' }}>
              <SidebarFilters 
                lang={lang} 
                carData={CAR_DATA} 
                years={YEARS} 
                translateMake={TRANSLATE_MAKE} 
                translateModel={TRANSLATE_MODEL} 
                categories={PARTS_CATEGORIES} 
                expandedCategories={expandedCategories} 
                toggleCategory={toggleCategory} 
                inventory={inventory} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                filterMake={filterMake} 
                setFilterMake={setFilterMake} 
                filterModel={filterModel} 
                setFilterModel={setFilterModel} 
                filterYear={filterYear} 
                setFilterYear={setFilterYear} 
                filterEngine={filterEngine} 
                setFilterEngine={setFilterEngine} 
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                addToCart={handleBuyClick}
              />
            </div>
          )}

        </main>

        {/* 💳 الشراء المباشر مع تمرير siteSettings لربط بوابات الدفع */}
        {selectedPartForCheckout && (
          <CustomerFitmentCheckout
            lang={lang}
            part={selectedPartForCheckout.part}
            initialStep={selectedPartForCheckout.initialStep || 'inquire'}
            customerPhone={session?.phone || session?.email || session?.user?.phone || '55000000'}
            supabaseUrl={SUPABASE_URL}
            apiKey={API_KEY}
            session={session}
            siteSettings={siteSettings}
            onClose={() => setSelectedPartForCheckout(null)}
            onSuccess={() => {
              const purchasedPartId = selectedPartForCheckout.part.id;
              setCartItems(prev => prev.filter(item => item.id !== purchasedPartId));
              setSelectedPartForCheckout(null);
              fetchParts();
              setShowOrderTracker(true);
            }}
          />
        )}

        {/* 📦 متابعة الطلبات */}
        {showOrderTracker && (
          <CustomerOrderTracker
            lang={lang}
            customerPhone={session?.phone || session?.email || session?.user?.phone || ''}
            supabaseUrl={SUPABASE_URL}
            apiKey={API_KEY}
            session={session}
            onClose={() => setShowOrderTracker(false)}
            onSelectPartForCheckout={(part) => {
              setSelectedPartForCheckout({ part, initialStep: 'checkout' });
            }}
          />
        )}

        {/* 🔻 الفوتر الرئيسي */}
        <Footer 
          lang={lang} 
          siteSettings={siteSettings} 
          onNavigate={(v) => setView(v as any)} 
          session={session} 
        />

      </div>
    </>
  );
}
