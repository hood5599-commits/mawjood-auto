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
import { AITranslatedText } from './components/AITranslatedText';
import { AIChatbot } from './components/AIChatbot';
import { RequestPartModal } from './components/RequestPartModal';
import { AIErrorBoundary } from './components/AIErrorBoundary';

// 🛡️ استدعاء كاشف الأخطاء التلقائي والمراقبة الذكية
import { ErrorSentry } from './utils/errorSentry';
import { ErrorBoundary } from './components/ErrorBoundary';

// 🚗 استيراد بيانات السيارات المركزية والمتغيرات الآمنة
import { CAR_DATA, CAR_YEARS as YEARS, TRANSLATE_MAKE, TRANSLATE_MODEL } from './data/carData';
import { SUPABASE_URL, API_KEY } from './config/supabase';

const AUTH_URL = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '') + '/auth/v1';

const FULL_CATEGORY_TREE: Record<string, string[]> = {
  "Belt Drive": ["Belt", "Belt Removal / Installation Tool", "Belt Tensioner", "Belt Tensioner Bolt", "Idler Pulley"],
  "Body & Lamp Assembly": ["Air Deflector", "Antenna", "Bumper Cover", "Bumper Insert", "Fender", "Fog / Driving Lamp Assembly", "Grille", "Headlamp Assembly", "Hood", "Outside Mirror Glass", "Radiator Support", "Tail Lamp Assembly", "Trunk Lock Actuator"],
  "Brake & Wheel Hub": ["ABS Control Module", "ABS Wheel Speed Sensor", "Brake Bleeder Screw", "Brake Fluid", "Brake Hose", "Brake Pad", "Caliper", "Master Cylinder", "Parking Brake Shoe", "Power Brake Booster", "Rotor", "Wheel Bearing & Hub"],
  "Cooling System": ["Coolant / Antifreeze", "Coolant Hose / Pipe", "Coolant Reservoir", "Radiator", "Radiator Cap", "Radiator Fan Assembly", "Temperature Sender / Sensor", "Thermostat", "Water Pump"],
  "Drivetrain": ["Axle Shaft Seal", "CV Axle", "CV Joint Boot", "Differential Carrier", "Drive Shaft", "Gear Oil"],
  "Electrical": ["Alternator / Generator", "Battery", "Engine Control Module (ECM Computer)", "Fuse", "Horn", "Speed Sensor", "Starter Motor"],
  "Electrical-Bulb & Socket": ["Brake Light Bulb", "Fog / Driving Lamp Bulb", "Headlamp Bulb", "Tail Lamp Bulb", "Turn Signal Lamp Bulb"],
  "Electrical-Connector": ["ABS Wheel Speed Sensor Connector", "Brake Light Switch Connector", "Camshaft Position Sensor Connector", "Crankshaft Position Sensor Connector", "Fuel Injector Connector", "Ignition Coil Connector"],
  "Electrical-Switch & Relay": ["A/C System Relay", "Blower Motor Relay", "Door Lock Switch", "Fuel Pump / Circuit Opening Relay", "Headlamp Switch", "Ignition Starter Switch", "Power Window Switch", "Turn Signal Switch"],
  "Engine": ["Camshaft", "Connecting Rod", "Crankshaft", "Cylinder Head", "Cylinder Head Gasket", "Engine Block Heater", "Exhaust Valve", "Harmonic Balancer", "Intake Manifold", "Intake Valve", "Motor Mount", "Oil Cooler", "Oil Filter", "Oil Pan", "Oil Pump", "Piston", "Piston Ring", "Rocker Arm", "Timing Chain", "Valve Cover", "Variable Valve Timing (VVT) Solenoid / Actuator"],
  "Exhaust & Emission": ["Catalytic Converter", "Exhaust Header Gasket", "Exhaust Manifold", "Mass Air Flow (MAF) Sensor", "Oxygen (O2) Sensor", "Vapor Canister Purge Valve / Solenoid"],
  "Fuel & Air": ["Air Filter", "Fuel Injection Pressure Sensor", "Fuel Injector", "Fuel Line / Hose", "Fuel Pump & Housing Assembly", "Fuel Tank Cap", "Throttle Body"],
  "Heat & Air Conditioning": ["A/C Compressor", "A/C Condenser", "A/C Evaporator Core", "A/C Expansion Valve", "Ambient Air Temperature Sensor", "Blower Motor", "Cabin Air Filter", "Heater Core"],
  "Ignition": ["Camshaft Position Sensor", "Crankshaft Position Sensor", "Ignition Coil", "Spark Plug", "Spark Plug Wire"],
  "Interior": ["Accelerator Pedal Position Sensor", "Air Bag Clockspring", "Floor Mat", "Inside Door Handle", "Steering Wheel", "Window Motor", "Window Regulator"],
  "Steering": ["Power Steering Fluid", "Rack and Pinion", "Steering Wheel Position Sensor", "Tie Rod End"],
  "Suspension": ["Alignment Bolt / Camber Plate", "Coil Spring", "Control Arm", "Control Arm Bushing", "Shock / Strut", "Shock / Strut Mount", "Sway Bar Bushing", "Sway Bar Link"],
  "Transmission-Automatic": ["Automatic Transmission Control Unit (TCU)", "Clutch Housing", "Filter", "Flexplate", "Fluid Pan", "Torque Converter", "Transmission Fluid", "Transmission Mount", "Valve Body"],
  "Transmission-Manual": ["Clutch Kit", "Clutch Master Cylinder", "Clutch Slave Cylinder", "Flywheel", "Manual Transmission Fluid", "Shift Fork", "Synchro Ring"],
  "Wheel": ["Lug Nut", "Lug Stud", "Tire Pressure Monitoring System (TPMS) Sensor", "Wheel"],
  "Wiper & Washer": ["Washer Fluid Reservoir", "Washer Pump", "Wiper Arm", "Wiper Blade", "Wiper Motor"]
};

const PARTS_CATEGORIES = Object.keys(FULL_CATEGORY_TREE);

const styles: Record<string, React.CSSProperties> = { 
  page: { 
    fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif", 
    backgroundColor: '#f8fafc', 
    minHeight: '100vh', 
    paddingBottom: '60px', 
    color: '#0f172a' 
  }, 
  main: { 
    maxWidth: '1280px', 
    margin: '24px auto 0', 
    padding: '0 20px' 
  }, 
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [view, setView] = useState<'shop' | 'dashboard' | 'auth' | 'profile' | 'driver' | 'admin' | StaticPageView>('shop');
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedPartForCheckout, setSelectedPartForCheckout] = useState<{ part: any; initialStep?: 'inquire' | 'checkout' } | null>(null);
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [isCustomPartModalOpen, setIsCustomPartModalOpen] = useState(false);

  const [inventory, setInventory] = useState<any[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('mawjood_site_settings');
    return saved ? JSON.parse(saved) : { 
      facebook: 'https://facebook.com', 
      instagram: 'https://instagram.com', 
      twitter: 'https://twitter.com', 
      whatsapp: '97455000000',
      deliveryTimeText: 'ساعتان - 24 ساعة',
      happyCustomersCount: 15,
      garagesCount: 5
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterEngine, setFilterEngine] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [theme] = useState<'light' | 'dark'>('light');

  const isRtl = lang === 'ar';

  // 🚀 استخراج معرف العميل بالصيغة الدقيقة الشاملة
  const currentCustomerPhone = 
    session?.email || 
    session?.user?.email || 
    session?.user?.user_metadata?.phone || 
    session?.phone || 
    session?.user?.phone || 
    localStorage.getItem('customer_phone') || 
    '';

  // 🚀 تفعيل كاشف الأخطاء التلقائي والمراقبة عند بداية التشغيل
  useEffect(() => {
    ErrorSentry.init(session);
  }, [session]);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  useEffect(() => {
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
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleAddToCartDirect = (part: any) => {
    const formattedPart = {
      ...part,
      id: part.id,
      name: part.name || 'قطعة غيار',
      price: Number(part.price) || 0,
      image_url: part.image_url || part.image || part.part_image || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
      quantity: 1
    };

    setCartItems(prevCart => {
      const existingIndex = prevCart.findIndex((item) => item.id === part.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + 1;
        return updated;
      }
      return [...prevCart, formattedPart];
    });

    setIsCartOpen(true);
  };

  const handleInquireClick = (item: any) => {
    setSelectedPartForCheckout({ part: item, initialStep: 'inquire' });
  };

  const toggleCategory = (category: string) => { 
    setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]); 
  };

  const totalCartPrice = cartItems.reduce((total, item) => total + (Number(item.price) * (item.quantity || 1)), 0);
  const totalCartCount = cartItems.reduce((count, item) => count + (item.quantity || 1), 0);

  const realPartsCount = inventory.length;
  const realGaragesCount = Array.from(new Set(inventory.map(p => p.garage_id || p.garage_name || 'عام').filter(Boolean))).length;

  return (
    <ErrorBoundary>
      <AIErrorBoundary supabaseUrl={SUPABASE_URL} apiKey={API_KEY}>
        <style>{`
          .mw-stat-card {
            position: relative;
            background: #ffffff;
            border-radius: 18px;
            padding: 20px 16px;
            text-align: center;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
            transition: all 0.25s ease;
          }
          .mw-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
            border-color: #cbd5e0;
          }
          .mw-cart-overlay { animation: mwFadeIn 0.25s ease; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
          .mw-cart-drawer { animation: mwDrawerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes mwFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mwDrawerIn { from { opacity: 0; transform: translateX(${isRtl ? '-100%' : '100%'}); } to { opacity: 1; transform: translateX(0); } }

          .mw-cart-item { transition: all 0.2s ease; }
          .mw-cart-item:hover { transform: translateY(-1px); border-color: #cbd5e0 !important; }

          .mw-cart-close-btn { transition: all 0.2s ease; }
          .mw-cart-close-btn:hover { background-color: #fee2e2; color: #dc2626; transform: rotate(90deg); }

          .mw-checkout-btn { transition: all 0.2s ease; }
          .mw-checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.3); }

          .mw-track-btn { transition: all 0.2s ease; }
          .mw-track-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25); }

          @media (max-width: 640px) {
            .mw-main-container { padding: 0 12px !important; margin-top: 14px !important; }
            .mw-stats-grid { gap: 10px !important; margin-bottom: 16px !important; }
            .mw-stat-card { padding: 14px 10px !important; }
          }
        `}</style>

        {showWelcome && (
          <WelcomeModal 
            lang={lang} 
            onStart={() => { 
              setShowWelcome(false); 
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
            onRequestCustomPart={() => setIsCustomPartModalOpen(true)}
            onOpenOrdersTracker={() => setShowOrderTracker(true)}
            onLogout={() => { 
              setSession(null); 
              setCartItems([]); 
              localStorage.removeItem('mawjood_session'); 
              setView('shop'); 
            }} 
          />

          {session && session.role !== 'garage' && session.role !== 'driver' && session.role !== 'admin' && (
            <div style={{ maxWidth: '1280px', margin: '14px auto -6px', padding: '0 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="mw-track-btn"
                onClick={() => setShowOrderTracker(true)}
                style={{
                  backgroundColor: '#0f172a',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📦</span>
                <span>{isRtl ? 'متابعة استفساراتي وطلباتي' : 'Track Inquiries & Orders'}</span>
              </button>
            </div>
          )}

          {isCartOpen && (
            <>
              <div
                className="mw-cart-overlay"
                onClick={() => setIsCartOpen(false)}
                style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 110 }}
              />
              <div
                className="mw-cart-drawer"
                style={{
                  position: 'fixed',
                  top: 0,
                  bottom: 0,
                  [isRtl ? 'left' : 'right']: 0,
                  width: '400px',
                  maxWidth: '100%',
                  backgroundColor: '#ffffff',
                  zIndex: 111,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isRtl ? '12px 0 40px rgba(0,0,0,0.18)' : '-12px 0 40px rgba(0,0,0,0.18)',
                  borderRadius: isRtl ? '0 24px 24px 0' : '24px 0 0 24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛒</span>
                    <span>{isRtl ? 'سلة المشتريات' : 'Your Shopping Cart'}</span>
                  </h3>
                  <button
                    className="mw-cart-close-btn"
                    onClick={() => setIsCartOpen(false)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      width: '32px',
                      height: '32px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 2px' }}>
                  {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>🛒</div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                        {isRtl ? 'السلة فارغة حالياً' : 'Your cart is currently empty'}
                      </p>
                    </div>
                  ) : (
                    cartItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="mw-cart-item"
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          border: '1px solid #f1f5f9',
                          borderRadius: '14px',
                          marginBottom: '10px',
                          backgroundColor: '#f8fafc',
                          alignItems: 'center'
                        }}
                      >
                        <img
                          src={item.image_url || item.image || item.part_image || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'}
                          alt={item.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', flexShrink: 0 }}
                          onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'; }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <AITranslatedText text={item.name} lang={lang} />
                          </strong>
                          <span style={{ fontSize: '13.5px', color: '#ea580c', fontWeight: '800' }}>
                            {item.price} {isRtl ? 'ر.ق' : 'QAR'}
                          </span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                              {isRtl ? 'الكمية:' : 'Qty:'} {item.quantity || 1}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setCartItems(cartItems.filter((_, i) => i !== index))} 
                          style={{ color: '#dc2626', background: '#fee2e2', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '6px 8px', borderRadius: '8px', flexShrink: 0, fontWeight: 'bold' }}
                          title={isRtl ? 'حذف من السلة' : 'Remove item'}
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 'bold' }}>
                        {isRtl ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                      </span>
                      <span style={{ fontWeight: '900', fontSize: '20px', color: '#ea580c' }}>
                        {totalCartPrice} {isRtl ? 'ر.ق' : 'QAR'}
                      </span>
                    </div>
                    <button
                      className="mw-checkout-btn"
                      onClick={() => { setIsCartOpen(false); setSelectedPartForCheckout({ part: cartItems[0], initialStep: 'checkout' }); }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontWeight: '900',
                        fontSize: '14.5px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.25)'
                      }}
                    >
                      {isRtl ? '🚀 إتمام الشراء والدفع' : '🚀 Checkout & Pay'}
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

            {view === 'driver' && (
              <DeliveryDashboard 
                lang={lang} 
                supabaseUrl={SUPABASE_URL} 
                apiKey={API_KEY} 
                session={session} 
              />
            )}

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

            {view === 'profile' && session && (
              <CustomerProfile 
                lang={lang} 
                supabaseUrl={SUPABASE_URL} 
                apiKey={API_KEY} 
                session={session} 
              />
            )}

            {['contact', 'faq', 'articles', 'about', 'privacy', 'terms', 'news'].includes(view) && (
              <StaticPages 
                lang={lang} 
                view={view as StaticPageView} 
                onNavigate={(v) => setView(v as any)} 
                siteSettings={siteSettings}
              />
            )}

            {view === 'shop' && (
              <div style={{ marginTop: '10px', width: '100%' }}>

                {/* 📊 البطاقات الإحصائية الفاخرة */}
                <div className="mw-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                  
                  <div className="mw-stat-card">
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                      {isRtl ? (siteSettings?.deliveryTimeText || 'ساعتان - 24 ساعة') : (siteSettings?.deliveryTimeText === 'ساعتان - 24 ساعة' ? '2 - 24 Hours' : siteSettings?.deliveryTimeText)}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                      ⚡ {isRtl ? 'متوسط سرعة التوصيل' : 'Avg. Delivery Speed'}
                    </p>
                  </div>

                  <div className="mw-stat-card">
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#ea580c' }}>
                      {realPartsCount.toLocaleString()}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                      📦 {isRtl ? 'القطع المتوفرة بالمستودعات' : 'Parts in Stock'}
                    </p>
                  </div>

                  <div className="mw-stat-card">
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a', direction: 'ltr', display: 'inline-block' }}>
                      +{realGaragesCount || siteSettings?.garagesCount || 1}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                      🏪 {isRtl ? 'كراج ومعرض قطع غيار' : 'Verified Garages & Stores'}
                    </p>
                  </div>

                  <div className="mw-stat-card">
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#16a34a', direction: 'ltr', display: 'inline-block' }}>
                      +{siteSettings?.happyCustomersCount || 10}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                      ⭐ {isRtl ? 'عملاء راضون وموثوقون' : 'Happy Customers'}
                    </p>
                  </div>

                </div>

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
                  addToCart={handleAddToCartDirect}
                  onInquire={handleInquireClick}
                />
              </div>
            )}

          </main>

          {selectedPartForCheckout && (
            <CustomerFitmentCheckout
              lang={lang}
              part={selectedPartForCheckout.part}
              initialStep={selectedPartForCheckout.initialStep || 'inquire'}
              customerPhone={currentCustomerPhone || '55000000'}
              supabaseUrl={SUPABASE_URL}
              apiKey={API_KEY}
              session={session}
              siteSettings={siteSettings}
              onClose={() => setSelectedPartForCheckout(null)}
              onSuccess={(addedPart?: any) => {
                if (addedPart) {
                  handleAddToCartDirect(addedPart);
                } else {
                  const purchasedPartId = selectedPartForCheckout.part.id;
                  setCartItems(prev => prev.filter(item => item.id !== purchasedPartId));
                }
                setSelectedPartForCheckout(null);
                fetchParts();
                setShowOrderTracker(true);
              }}
            />
          )}

          {showOrderTracker && (
            <CustomerOrderTracker
              lang={lang}
              customerPhone={currentCustomerPhone}
              supabaseUrl={SUPABASE_URL}
              apiKey={API_KEY}
              session={session}
              onClose={() => setShowOrderTracker(false)}
              onSelectPartForCheckout={(part) => {
                setSelectedPartForCheckout({ part, initialStep: 'checkout' });
              }}
            />
          )}

          <Footer 
            lang={lang} 
            siteSettings={siteSettings} 
            onNavigate={(v) => setView(v as any)} 
            session={session} 
          />

          <AIChatbot 
            lang={lang} 
            carData={CAR_DATA}
            categoryTree={FULL_CATEGORY_TREE}
            onApplyFilters={(filters) => {
              setView('shop');
              
              if (filters.mainCategory && !expandedCategories.includes(filters.mainCategory)) {
                setExpandedCategories(prev => [...prev, filters.mainCategory as string]);
              }
              if (filters.mainCategory && filters.subCategory) {
                setFilterCategory(`${filters.mainCategory} > ${filters.subCategory}`);
              } else {
                setFilterCategory('');
              }
              
              if (filters.query) setSearchTerm(filters.query);
              if (filters.make) setFilterMake(filters.make);
              if (filters.model) setFilterModel(filters.model);
              if (filters.year) setFilterYear(filters.year);

              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
            onCloseFilters={() => {
              setSearchTerm('');
              setFilterMake('');
              setFilterModel('');
              setFilterYear('');
              setFilterCategory('');
              setExpandedCategories([]);
            }}
          />

          <RequestPartModal
            isOpen={isCustomPartModalOpen}
            onClose={() => setIsCustomPartModalOpen(false)}
            supabaseUrl={SUPABASE_URL}
            supabaseKey={API_KEY}
            customerPhone={currentCustomerPhone}
          />

        </div>
      </AIErrorBoundary>
    </ErrorBoundary>
  );
}
