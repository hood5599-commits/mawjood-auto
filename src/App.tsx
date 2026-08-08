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

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const AUTH_URL = "https://shszpcjmhkemqwborfwy.supabase.co/auth/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

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

const TRANSLATE_MAKE: Record<string, string> = { "تويوتا": "Toyota", "هيونداي": "Hyundai", "نيسان": "Nissan", "فورد": "Ford", "شفروليه": "Chevrolet", "كيا": "Kia", "هوندا": "Honda", "لكزس": "Lexus", "ميتسوبيشي": "Mitsubishi", "مازدا": "Mazda", "جي إم سي": "GMC", "بي إم دبليو": "BMW", "مرسيدس": "Mercedes-Benz", "فولكس فاجن": "Volkswagen", "أودي": "Audi", "جيب": "Jeep", "دودج": "Dodge", "رام": "Ram", "لاند روفر": "Land Rover", "إنفينيتي": "Infiniti", "سوبارو": "Subaru", "رينو": "Renault", "سوزوكي": "Suzuki", "بورش": "Porsche", "كرايسلر": "Chrysler" };
const TRANSLATE_MODEL: Record<string, string> = { "كامري": "Camry", "كورولا": "Corolla", "يارس": "Yaris", "هيلوكس": "Hilux", "لاندكروزر": "Land Cruiser", "برادو": "Prado", "أفالون": "Avalon", "راف فور": "RAV4", "فورشنر": "Fortuner", "شاص": "LC70 (Shas)", "إلنترا": "Elantra", "سوناتا": "Sonata", "أكسنت": "Accent", "توسان": "Tucson", "سانتافي": "Santa Fe", "أزيرا": "Azera", "كريتا": "Creta", "كونا": "Kona", "باترول": "Patrol", "ألتيما": "Altima", "صني": "Sunny", "ماكسيما": "Maxima", "إكس تريل": "X-Trail", "نافارا": "Navara", "باثفايندر": "Pathfinder", "سنترا": "Sentra", "تورس": "Taurus", "إكسبلورر": "Explorer", "إف-150": "F-150", "إكسبديشن": "Expedition", "موستنج": "Mustang", "إيدج": "Edge", "رينجر": "Ranger", "تاهو": "Tahoe", "سوبربان": "Suburban", "سيلفرادو": "Silverado", "ماليبو": "Malibu", "كابتيفا": "Captiva", "ترافيرس": "Traverse", "كابرس": "Caprice", "سيراتو": "Cerato", "أوبتيما / K5": "Optima", "ريو": "Rio", "سبورتج": "Sportage", "سورينتو": "Sorento", "كادينزا / K8": "Cadenza", "بيغاس": "Pegas", "أكورد": "Accord", "سيفيك": "Civic", "سي آر في": "CR-V", "سيتي": "City", "بايلوت": "Pilot", "أوديسي": "Odyssey", "باجيرو": "Pajero", "لانسر": "Lancer", "أتراج": "Attrage", "إكليبس كروس": "Eclipse Cross", "L200": "L200", "مازدا 6": "Mazda 6", "مازدا 3": "Mazda 3", "CX-9": "CX-9", "CX-5": "CX-5", "يوكن": "Yukon", "سييرا": "Sierra", "أكاديا": "Acadia", "تيرين": "Terrain", "الفئة الثالثة": "3 Series", "الفئة الخامسة": "5 Series", "الفئة السابعة": "7 Series", "جولف": "Golf", "باسات": "Passat", "تيغوان": "Tiguan", "طوارق": "Touareg", "رانجلر": "Wrangler", "جراند شيروكي": "Grand Cherokee", "شيروكي": "Cherokee", "تشارجر": "Charger", "تشالنجر": "Challenger", "دورانجو": "Durango", "رينج روفر": "Range Rover", "ديفندر": "Defender", "ديسكفري": "Discovery", "فورستر": "Forester", "أوت باك": "Outback", "إمبريزا": "Impreza", "داستر": "Duster", "ميجان": "Megane", "كوليوس": "Koleos", "سويفت": "Swift", "جيمني": "Jimny", "فيتارا": "Vitara", "كايين": "Cayenne", "ماكان": "Macan", "911": "911" };
const CAR_DATA: Record<string, { models: string[], engines: string[] }> = { "تويوتا": { models: ["كامري", "كورولا", "يارس", "هيلوكس", "لاندكروزر", "برادو", "أفالون", "راف فور", "فورشنر", "شاص"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر", "هايبرد (الهجين)"] }, "هيونداي": { models: ["إلنترا", "سوناتا", "أكسنت", "توسان", "سانتافي", "أزيرا", "كريتا", "كونا"], engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"] }, "نيسان": { models: ["باترول", "ألتيما", "صني", "ماكسيما", "إكس تريل", "نافارا", "باثفايندر", "سنترا"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 5.6 لتر"] }, "فورد": { models: ["تورس", "إكسبلورر", "إف-150", "إكسبديشن", "موستنج", "إيدج", "رينجر"], engines: ["4 سلندر EcoBoost - 2.0 لتر", "6 سلندر - 3.5 لتر", "6 سلندر EcoBoost - 3.5 لتر", "8 سلندر - 5.0 لتر"] }, "شفروليه": { models: ["تاهو", "سوبربان", "سيلفرادو", "ماليبو", "كابتيفا", "ترافيرس", "كابرس"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.0 لتر", "8 سلندر - 6.2 لتر"] }, "كيا": { models: ["سيراتو", "أوبتيما / K5", "ريو", "سبورتج", "سورينتو", "كادينزا / K8", "بيغاس"], engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"] }, "هوندا": { models: ["أكورد", "سيفيك", "سي آر في", "سيتي", "بايلوت", "أوديسي"], engines: ["4 سلندر توربو - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.4 لتر", "6 سلندر - 3.5 لتر"] }, "لكزس": { models: ["ES", "LS", "LX", "RX", "GX", "IS", "UX"], engines: ["4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر توربو - 3.4 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر"] }, "ميتسوبيشي": { models: ["باجيرو", "لانسر", "أتراج", "إكليبس كروس", "L200"], engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.5 لتر"] }, "مازدا": { models: ["CX-9", "CX-5", "مازدا 6", "مازدا 3"], engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "4 سلندر توربو - 2.5 لتر"] }, "جي إم سي": { models: ["يوكن", "سييرا", "أكاديا", "تيرين"], engines: ["4 سلندر - 1.5 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.2 لتر"] }, "بي إم دبليو": { models: ["الفئة الثالثة", "الفئة الخامسة", "الفئة السابعة", "X5", "X6"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.4 لتر"] }, "مرسيدس": { models: ["C-Class", "E-Class", "S-Class", "G-Class", "GLE"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 4.0 لتر"] }, "فولكس فاجن": { models: ["جولف", "باسات", "تيغوان", "طوارق"], engines: ["4 سلندر توربو - 1.4 لتر", "4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر"] }, "أودي": { models: ["A3", "A4", "A6", "Q5", "Q7"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر"] }, "جيب": { models: ["رانجلر", "جراند شيروكي", "شيروكي"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] }, "دودج": { models: ["تشارجر", "تشالنجر", "دورانجو"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر", "8 سلندر - 6.4 لتر"] }, "رام": { models: ["1500"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] }, "لاند روفر": { models: ["رينج روفر", "ديفندر", "ديسكفري"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 5.0 لتر"] }, "إنفينيتي": { models: ["Q50", "QX50", "QX80"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.7 لتر", "8 سلندر - 5.6 لتر"] }, "سوبارو": { models: ["فورستر", "أوت باك", "إمبريزا"], engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر"] }, "رينو": { models: ["داستر", "ميجان", "كوليوس"], engines: ["4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر توربو - 1.3 لتر"] }, "سوزوكي": { models: ["سويفت", "جيمني", "فيتارا"], engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر"] }, "بورش": { models: ["كايين", "ماكان", "911"], engines: ["6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.0 لتر"] }, "كرايسلر": { models: ["300C"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] } };
const YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => (2026 - i).toString());
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

 // 1. استخراج رقم الهاتف الحقيقي فقط
const currentCustomerPhone = 
  session?.user?.user_metadata?.phone || 
  session?.phone || 
  session?.user?.phone || 
  localStorage.getItem('customer_phone') || 
  '';

// 2. استخراج البريد الإلكتروني الحقيقي فقط
const currentCustomerEmail = 
  session?.user?.email || 
  session?.email || 
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
    // 🛡️ تغليف الصفحة بنظام الحماية ومنع التعطل الرئيسي
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
