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
  const [isCustomPartModalOpen, setIsCustomPartModalOpen] = useState(false);

  const [inventory, setInventory] = useState<any[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
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
            background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,253,0.94) 100%);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease;
            will-change: transform;
          }
          .mw-stat-card:hover {
            transform: translateY(-5px) scale(1.015);
            box-shadow: 0 18px 34px -10px rgba(31,58,95,0.20), 0 4px 10px rgba(31,58,95,0.06);
            border-color: rgba(31,58,95,0.18) !important;
          }
          .mw-stat-card::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(135deg, rgba(31,58,95,0.10), rgba(224,135,42,0.10));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .mw-stat-card:hover::after { opacity: 1; }

          .mw-cart-overlay { animation: mwFadeIn 0.25s ease; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
          .mw-cart-drawer { animation: mwDrawerIn 0.4s cubic-bezier(0.22,1,0.36,1); }
          @keyframes mwFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mwDrawerIn { from { opacity: 0; transform: scale(0.98) translateX(6px); } to { opacity: 1; transform: scale(1) translateX(0); } }

          .mw-cart-item { transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease; }
          .mw-cart-item:hover { box-shadow: 0 8px 18px rgba(15,23,42,0.08); transform: translateY(-1px); border-color: #cbd5e0 !important; }

          .mw-cart-close-btn { transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease; }
          .mw-cart-close-btn:hover { background-color: #f1f5f9; color: #1f3a5f; transform: rotate(90deg); }

          .mw-remove-btn { transition: background-color 0.2s ease, transform 0.15s ease; }
          .mw-remove-btn:hover { background-color: #fee2e2; transform: scale(1.1); }

          .mw-checkout-btn {
            transition: transform 0.18s ease, box-shadow 0.25s ease, filter 0.2s ease;
          }
          .mw-checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -6px rgba(31,58,95,0.4); filter: brightness(1.06); }
          .mw-checkout-btn:active { transform: translateY(0); }

          .mw-track-btn { transition: transform 0.18s ease, box-shadow 0.25s ease; }
          .mw-track-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -6px rgba(31,58,95,0.35); }

          @media (max-width: 640px) {
            .mw-main-container { padding: 0 14px !important; margin-top: 18px !important; }
            .mw-stats-grid { gap: 10px !important; margin-bottom: 18px !important; }
            .mw-stat-card { padding: 16px 12px !important; }
          }
        `}</style>

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
            <div style={{ maxWidth: '1240px', margin: '14px auto -10px', padding: '0 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="mw-track-btn"
                onClick={() => setShowOrderTracker(true)}
                style={{
                  background: 'linear-gradient(135deg, #24466f 0%, #1f3a5f 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: '14px',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px -4px rgba(31,58,95,0.35)',
                  letterSpacing: '0.2px'
                }}
              >
                {isRtl ? 'متابعة استفساراتي وطلباتي' : 'Track Inquiries & Orders'}
              </button>
            </div>
          )}

          {isCartOpen && (
            <>
              <div
                className="mw-cart-overlay"
                onClick={() => setIsCartOpen(false)}
                style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', zIndex: 100 }}
              />
              <div
                className="mw-cart-drawer"
                style={{
                  position: 'fixed',
                  top: 0,
                  bottom: 0,
                  [isRtl ? 'left' : 'right']: 0,
                  width: '390px',
                  maxWidth: '100%',
                  backgroundColor: '#ffffff',
                  zIndex: 101,
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isRtl ? '12px 0 40px rgba(15,23,42,0.18)' : '-12px 0 40px rgba(15,23,42,0.18)',
                  borderRadius: isRtl ? '0 24px 24px 0' : '24px 0 0 24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef1f5', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isRtl ? 'سلة المشتريات' : 'Your Cart'}
                    <span style={{ fontSize: '13px' }}>🛒</span>
                  </h3>
                  <button
                    className="mw-cart-close-btn"
                    onClick={() => setIsCartOpen(false)}
                    style={{
                      background: '#f8fafc',
                      border: 'none',
                      borderRadius: '10px',
                      width: '32px',
                      height: '32px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✖
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 2px' }}>
                  {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '38px', marginBottom: '10px', opacity: 0.6 }}>🛒</div>
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>
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
                          border: '1px solid #eef1f5',
                          borderRadius: '14px',
                          marginBottom: '12px',
                          backgroundColor: '#fbfcfe',
                          alignItems: 'center'
                        }}
                      >
                        <img
                          src={item.image_url || item.image || item.part_image || 'https://via.placeholder.com/80'}
                          alt={item.name}
                          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', flexShrink: 0 }}
                          onError={(e: any) => { e.target.src = 'https://via.placeholder.com/80?text=Auto+Part'; }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '13.5px', color: '#1f3a5f', display: 'block', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <AITranslatedText text={item.name} lang={lang} />
                          </strong>
                          <span style={{ fontSize: '13.5px', color: '#e0872a', fontWeight: 800 }}>
                            {item.price} {isRtl ? 'ر.ق' : 'QAR'}
                          </span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
                              {isRtl ? 'الكمية:' : 'Qty:'} {item.quantity || 1}
                            </span>
                          </div>
                        </div>

                        <button 
                          className="mw-remove-btn"
                          onClick={() => setCartItems(cartItems.filter((_, i) => i !== index))} 
                          style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '6px', borderRadius: '8px', flexShrink: 0 }}
                          title={isRtl ? 'حذف من السلة' : 'Remove item'}
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div style={{ borderTop: '1px solid #eef1f5', paddingTop: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '13px', color: '#8a94a3', fontWeight: 600 }}>
                        {isRtl ? 'المبلغ الإجمالي:' : 'Total:'}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '19px', color: '#e0872a', letterSpacing: '-0.2px' }}>
                        {totalCartPrice} {isRtl ? 'ر.ق' : 'QAR'}
                      </span>
                    </div>
                    <button
                      className="mw-checkout-btn"
                      onClick={() => { setIsCartOpen(false); setSelectedPartForCheckout({ part: cartItems[0], initialStep: 'checkout' }); }}
                      style={{
                        width: '100%',
                        padding: '15px',
                        background: 'linear-gradient(135deg, #24466f 0%, #1f3a5f 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px -6px rgba(31,58,95,0.4)',
                        letterSpacing: '0.2px'
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
              <div style={{ marginTop: '20px', width: '100%' }}>

                <div className="mw-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' }}>
                  <div className="mw-stat-card" style={{ padding: '20px 16px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(15,23,42,0.04)', border: '1px solid #f1f5f9' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1f3a5f', letterSpacing: '-0.3px' }}>
                      {isRtl ? (siteSettings?.deliveryTimeText || 'ساعتان - 24 ساعة') : (siteSettings?.deliveryTimeText === 'ساعتان - 24 ساعة' ? '2 - 24 Hours' : siteSettings?.deliveryTimeText)}
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#8a94a3', fontWeight: 'bold' }}>
                      {isRtl ? 'متوسط وقت التوصيل' : 'Avg. Delivery Time'}
                    </p>
                  </div>

                  <div className="mw-stat-card" style={{ padding: '20px 16px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(15,23,42,0.04)', border: '1px solid #f1f5f9' }}>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#e0872a', letterSpacing: '-0.3px' }}>{realPartsCount.toLocaleString()}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#8a94a3', fontWeight: 'bold' }}>
                      {isRtl ? 'القطع في قاعدة البيانات' : 'Parts in Database'}
                    </p>
                  </div>

                  <div className="mw-stat-card" style={{ padding: '20px 16px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(15,23,42,0.04)', border: '1px solid #f1f5f9' }}>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#1f3a5f', direction: 'ltr', display: 'inline-block', letterSpacing: '-0.3px' }}>+{realGaragesCount || siteSettings?.garagesCount || 1}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#8a94a3', fontWeight: 'bold' }}>
                      {isRtl ? 'كراج ومعرض قطع غيار' : 'Verified Garages & Stores'}
                    </p>
                  </div>

                  <div className="mw-stat-card" style={{ padding: '20px 16px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(15,23,42,0.04)', border: '1px solid #f1f5f9' }}>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#16a34a', direction: 'ltr', display: 'inline-block', letterSpacing: '-0.3px' }}>+{siteSettings?.happyCustomersCount || 10}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#8a94a3', fontWeight: 'bold' }}>
                      {isRtl ? 'عملاء راضون' : 'Happy Customers'}
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
