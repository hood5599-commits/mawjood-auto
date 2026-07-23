import { useState, useEffect, useRef } from 'react';
import { t } from './utils/translations';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { GarageDashboard } from './components/GarageDashboard';
import { SidebarFilters } from './components/SidebarFilters';
import { PartCard } from './components/PartCard';
import { CustomerProfile } from './components/CustomerProfile';
import { getPartCategory } from './utils/categoryHelper';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const AUTH_URL = "https://shszpcjmhkemqwborfwy.supabase.co/auth/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";
const WHATSAPP_NUMBER = "97455555555";
const PAGE_SIZE = 12;

const TRANSLATE_MAKE: Record<string, string> = { "تويوتا": "Toyota", "هيونداي": "Hyundai", "نيسان": "Nissan", "فورد": "Ford", "شفروليه": "Chevrolet", "كيا": "Kia", "هوندا": "Honda", "لكزس": "Lexus", "ميتسوبيشي": "Mitsubishi", "مازدا": "Mazda", "جي إم سي": "GMC", "بي إم دبليو": "BMW", "مرسيدس": "Mercedes-Benz", "فولكس فاجن": "Volkswagen", "أودي": "Audi", "جيب": "Jeep", "دودج": "Dodge", "رام": "Ram", "لاند روفر": "Land Rover", "إنفينيتي": "Infiniti", "سوبارو": "Subaru", "رينو": "Renault", "سوزوكي": "Suzuki", "بورش": "Porsche", "كرايسلر": "Chrysler" };
const TRANSLATE_MODEL: Record<string, string> = { "كامري": "Camry", "كورولا": "Corolla", "يارس": "Yaris", "هيلوكس": "Hilux", "لاندكروزر": "Land Cruiser", "برادو": "Prado", "أفالون": "Avalon", "راف فور": "RAV4", "فورشنر": "Fortuner", "شاص": "LC70 (Shas)", "إلنترا": "Elantra", "سوناتا": "Sonata", "أكسنت": "Accent", "توسان": "Tucson", "سانتافي": "Santa Fe", "أزيرا": "Azera", "كريتا": "Creta", "كونا": "Kona", "باترول": "Patrol", "ألتيما": "Altima", "صني": "Sunny", "ماكسيما": "Maxima", "إكس تريل": "X-Trail", "نافارا": "Navara", "باثفايندر": "Pathfinder", "سنترا": "Sentra", "تورس": "Taurus", "إكسبلورر": "Explorer", "إف-150": "F-150", "إكسبديشن": "Expedition", "موستنج": "Mustang", "إيدج": "Edge", "رينجر": "Ranger", "تاهو": "Tahoe", "سوبربان": "Suburban", "سيلفرادو": "Silverado", "ماليبو": "Malibu", "كابتيفا": "Captiva", "ترافيرس": "Traverse", "كابرس": "Caprice", "سيراتو": "Cerato", "أوبتيما / K5": "Optima", "ريو": "Rio", "سبورتج": "Sportage", "سورينتو": "Sorento", "كادينزا / K8": "Cadenza", "بيغاس": "Pegas", "أكورد": "Accord", "سيفيك": "Civic", "سي آر في": "CR-V", "سيتي": "City", "بايلوت": "Pilot", "أوديسي": "Odyssey", "باجيرو": "Pajero", "لانسر": "Lancer", "أتراج": "Attrage", "إكليبس كروس": "Eclipse Cross", "L200": "L200", "مازدا 6": "Mazda 6", "مازدا 3": "Mazda 3", "CX-9": "CX-9", "CX-5": "CX-5", "يوكن": "Yukon", "سييرا": "Sierra", "أكاديا": "Acadia", "تيرين": "Terrain", "الفئة الثالثة": "3 Series", "الفئة الخامسة": "5 Series", "الفئة السابعة": "7 Series", "جولف": "Golf", "باسات": "Passat", "تيغوان": "Tiguan", "طوارق": "Touareg", "رانجلر": "Wrangler", "جراند شيروكي": "Grand Cherokee", "شيروكي": "Cherokee", "تشارجر": "Charger", "تشالنجر": "Challenger", "دورانجو": "Durango", "رينج روفر": "Range Rover", "ديفندر": "Defender", "ديسكفري": "Discovery", "فورستر": "Forester", "أوت باك": "Outback", "إمبريزا": "Impreza", "داستر": "Duster", "ميجان": "Megane", "كوليوس": "Koleos", "سويفت": "Swift", "جيمني": "Jimny", "فيتارا": "Vitara", "كايين": "Cayenne", "ماكان": "Macan", "911": "911" };
const CAR_DATA: Record<string, { models: string[], engines: string[] }> = { "تويوتا": { models: ["كامري", "كورولا", "يارس", "هيلوكس", "لاندكروزر", "برادو", "أفالون", "راف فور", "فورشنر", "شاص"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر", "هايبرد (الهجين)"] }, "هيونداي": { models: ["إلنترا", "سوناتا", "أكسنت", "توسان", "سانتافي", "أزيرا", "كريتا", "كونا"], engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"] }, "نيسان": { models: ["باترول", "ألتيما", "صني", "ماكسيما", "إكس تريل", "نافارا", "باثفايندر", "سنترا"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 5.6 لتر"] }, "فورد": { models: ["تورس", "إكسبلورر", "إف-150", "إكسبديشن", "موستنج", "إيدج", "رينجر"], engines: ["4 سلندر EcoBoost - 2.0 لتر", "6 سلندر - 3.5 لتر", "6 سلندر EcoBoost - 3.5 لتر", "8 سلندر - 5.0 لتر"] }, "شفروليه": { models: ["تاهو", "سوبربان", "سيلفرادو", "ماليبو", "كابتيفا", "ترافيرس", "كابرس"], engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.0 لتر", "8 سلندر - 6.2 لتر"] }, "كيا": { models: ["سيراتو", "أوبتيما / K5", "ريو", "سبورتج", "سورينتو", "كادينزا / K8", "بيغاس"], engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"] }, "هوندا": { models: ["أكورد", "سيفيك", "سي آر في", "سيتي", "بايلوت", "أوديسي"], engines: ["4 سلندر توربو - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.4 لتر", "6 سلندر - 3.5 لتر"] }, "لكزس": { models: ["ES", "LS", "LX", "RX", "GX", "IS", "UX"], engines: ["4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر توربو - 3.4 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر"] }, "ميتسوبيشي": { models: ["باجيرو", "لانسر", "أتراج", "إكليبس كروس", "L200"], engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.5 لتر"] }, "مازدا": { models: ["CX-9", "CX-5", "مازدا 6", "مازدا 3"], engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "4 سلندر توربو - 2.5 لتر"] }, "جي إم سي": { models: ["يوكن", "سييرا", "أكاديا", "تيرين"], engines: ["4 سلندر - 1.5 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.2 لتر"] }, "بي إم دبليو": { models: ["الفئة الثالثة", "الفئة الخامسة", "الفئة السابعة", "X5", "X6"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.4 لتر"] }, "مرسيدس": { models: ["C-Class", "E-Class", "S-Class", "G-Class", "GLE"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 4.0 لتر"] }, "فولكس فاجن": { models: ["جولف", "باسات", "تيغوان", "طوارق"], engines: ["4 سلندر توربو - 1.4 لتر", "4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر"] }, "أودي": { models: ["A3", "A4", "A6", "Q5", "Q7"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر"] }, "جيب": { models: ["رانجلر", "جراند شيروكي", "شيروكي"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] }, "دودج": { models: ["تشارجر", "تشالنجر", "دورانجو"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر", "8 سلندر - 6.4 لتر"] }, "رام": { models: ["1500"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] }, "لاند روفر": { models: ["رينج روفر", "ديفندر", "ديسكفري"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 5.0 لتر"] }, "إنفينيتي": { models: ["Q50", "QX50", "QX80"], engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.7 لتر", "8 سلندر - 5.6 لتر"] }, "سوبارو": { models: ["فورستر", "أوت باك", "إمبريزا"], engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر"] }, "رينو": { models: ["داستر", "ميجان", "كوليوس"], engines: ["4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر توربو - 1.3 لتر"] }, "سوزوكي": { models: ["سويفت", "جيمني", "فيتارا"], engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر"] }, "بورش": { models: ["كايين", "ماكان", "911"], engines: ["6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.0 لتر"] }, "كرايسلر": { models: ["300C"], engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"] } };
const YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => (2026 - i).toString());
const PARTS_CATEGORIES = [ "Belt Drive", "Body & Lamp Assembly", "Brake & Wheel Hub", "Cooling System", "Drivetrain", "Electrical", "Electrical-Bulb & Socket", "Electrical-Connector", "Electrical-Switch & Relay", "Engine", "Exhaust & Emission", "Fuel & Air", "Heat & Air Conditioning", "Ignition", "Interior", "Steering", "Suspension", "Transmission-Automatic", "Wheel", "Wiper & Washer" ];
const RADIUS = { sm: '10px', md: '14px', lg: '20px' };

const styles: Record<string, React.CSSProperties> = { 
  page: { fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif", backgroundColor: 'var(--mw-bg)', minHeight: '100vh', paddingBottom: '60px', color: 'var(--mw-ink)', transition: 'background-color 0.2s ease, color 0.2s ease' }, 
  main: { maxWidth: '1240px', margin: '28px auto 0', padding: '0 20px' }, 
  contentCol: { flex: '2 1 640px', minWidth: 0 }, 
  consolePanel: { backgroundColor: 'var(--mw-surface)', padding: '22px 24px', borderRadius: RADIUS.lg, boxShadow: 'var(--mw-shadow-md)', border: '1px solid var(--mw-border)', marginBottom: '18px' }, 
  panelTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }, 
  eyebrow: { display: 'inline-block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--mw-accent-dark)', backgroundColor: 'var(--mw-accent-bg)', padding: '4px 10px', borderRadius: '999px' }, 
  themeToggle: { width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--mw-border)', backgroundColor: 'var(--mw-bg)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mw-ink)' }, 
  searchLabel: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--mw-ink)' }, 
  searchInput: { width: '100%', padding: '14px 18px', borderRadius: RADIUS.sm, border: '1.5px solid var(--mw-border)', fontSize: '15px', boxSizing: 'border-box', backgroundColor: 'var(--mw-bg)', color: 'var(--mw-ink)', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }, 
  statStrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--mw-border)' }, 
  statCount: { fontSize: '13px', color: 'var(--mw-ink-muted)', fontWeight: 600 }, 
  statCountNum: { color: 'var(--mw-primary)', fontSize: '16px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }, 
  sortSelect: { fontSize: '13px', fontWeight: 700, color: 'var(--mw-ink)', backgroundColor: 'var(--mw-bg)', border: '1.5px solid var(--mw-border)', borderRadius: RADIUS.sm, padding: '8px 12px', cursor: 'pointer', outline: 'none' }, 
  chipsRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px', alignItems: 'center' }, 
  chip: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--mw-primary)', backgroundColor: 'var(--mw-accent-bg)', border: '1px solid var(--mw-border)', padding: '6px 10px', borderRadius: '999px' }, 
  chipClear: { fontSize: '12.5px', fontWeight: 800, color: 'var(--mw-ink-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '6px 4px' }, 
  stateCard: { textAlign: 'center', padding: '64px 20px', backgroundColor: 'var(--mw-surface)', borderRadius: RADIUS.lg, boxShadow: 'var(--mw-shadow-sm)' }, 
  stateCardDashed: { border: '2px dashed var(--mw-border)', boxShadow: 'none' }, 
  stateIcon: { fontSize: '46px', lineHeight: 1 }, 
  stateTitle: { color: 'var(--mw-ink)', marginTop: '16px', fontSize: '17px', fontWeight: 800 }, 
  stateBody: { color: 'var(--mw-ink-muted)', fontSize: '14px', marginTop: '8px', maxWidth: '380px', marginInline: 'auto', lineHeight: 1.7 }, 
  loadMoreBtn: { display: 'block', margin: '28px auto 0', padding: '12px 32px', borderRadius: '999px', border: '1.5px solid var(--mw-primary)', backgroundColor: 'transparent', color: 'var(--mw-primary)', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }, 
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [view, setView] = useState<'shop' | 'dashboard' | 'auth' | 'profile'>('shop');
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterEngine, setFilterEngine] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [, setShowScrollTop] = useState(false);
  const toastCounter = useRef(0);

  const isFiltering = searchTerm !== '' || filterMake !== '' || filterModel !== '' || filterYear !== '' || filterEngine !== '' || filterCategory !== '';

  const showToast = (_message: string, _type: 'success' | 'error' = 'success') => {
    toastCounter.current += 1;
  };

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedMawjood');
    if (!hasVisited) setShowWelcome(true);

    const savedSession = localStorage.getItem('mawjood_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {}
    }

    const savedTheme = localStorage.getItem('mawjood_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

    fetchParts();

    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (session) {
      const userId = session.phone || session.email || session.user?.id;
      if (userId) {
        const savedCart = localStorage.getItem(`mawjood_cart_${userId}`);
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (e) {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
    } else {
      setCartItems([]);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      const userId = session.phone || session.email || session.user?.id;
      if (userId) {
        localStorage.setItem(`mawjood_cart_${userId}`, JSON.stringify(cartItems));
      }
    }
  }, [cartItems, session]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, filterMake, filterModel, filterYear, filterEngine, filterCategory, sortBy]);

  const fetchParts = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = inventory.filter(item => {
    // شرط إضافي: عدم إظهار القطع إلا إذا تم اختيار الموديل أو استخدام البحث النصي
    if (!searchTerm && !filterModel) {
      return false;
    }

    const matchesSearchText = !searchTerm || (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) || (item.make && item.make.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMake = !filterMake || item.make === filterMake;
    const matchesModel = !filterModel || (item.model && item.model === filterModel);
    const matchesYear = !filterYear || (item.year && String(item.year) === String(filterYear));
    const matchesEngine = !filterEngine || (item.engine && item.engine === filterEngine);
    const matchesCategory = !filterCategory || getPartCategory(item.name) === filterCategory;
    
    return matchesSearchText && matchesMake && matchesModel && matchesYear && matchesEngine && matchesCategory;
  });

  const sortedParts = [...filteredParts].sort((a, b) => {
    if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
    return b.id - a.id;
  });
  const visibleParts = sortedParts.slice(0, visibleCount);

  const toggleTheme = () => { setTheme(prev => { const next = prev === 'light' ? 'dark' : 'light'; localStorage.setItem('mawjood_theme', next); return next; }); };

  const clearAllFilters = () => { setSearchTerm(''); setFilterMake(''); setFilterModel(''); setFilterYear(''); setFilterEngine(''); setFilterCategory(''); };

  const handleBuyClick = (item: any) => {
    setCartItems(prev => [...prev, item]);
    showToast(lang === 'ar' ? 'تمت إضافة القطعة للسلة 🛒' : 'Item added to cart 🛒', 'success');
  };

  const handleGeneralContact = () => {
    const text = lang === 'ar' ? `مرحباً موجود أوتو 👋\nأبحث عن قطعة غيار ولم أجدها في المتجر، هل يمكنكم المساعدة؟` : `Hello Mawjood Auto 👋\nI'm looking for a part I couldn't find in the shop — can you help?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async (item: any) => {
    const shareText = lang === 'ar' ? `🚗 *موجود أوتو*\n\n🛠️ القطعة: *${item.name}*\n🚘 السيارة: *${item.make} - ${item.model || 'عام'}*\n📅 الموديل: *${item.year}*\n💰 السعر: *${item.price} ر.ق*` : `🚗 *Mawjood Auto*\n\n🛠️ Part: *${item.name}*\n🚘 Car: *${item.make} - ${item.model || 'General'}*\n📅 Year: *${item.year}*\n💰 Price: *${item.price} QAR*`;
    if (navigator.share) { try { await navigator.share({ title: `Mawjood Auto`, text: shareText, url: window.location.href }); } catch (err) {} } else { try { await navigator.clipboard.writeText(shareText); showToast(t[lang].alertCopied, 'success'); } catch (err) { showToast('Failed to copy', 'error'); } }
  };

  const toggleCategory = (category: string) => { setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]); };

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (searchTerm) activeChips.push({ key: 'search', label: `"${searchTerm}"`, onRemove: () => setSearchTerm('') });
  if (filterMake) activeChips.push({ key: 'make', label: lang === 'ar' ? filterMake : (TRANSLATE_MAKE[filterMake] || filterMake), onRemove: () => { setFilterMake(''); setFilterModel(''); setFilterCategory(''); } });
  if (filterModel) activeChips.push({ key: 'model', label: lang === 'ar' ? filterModel : (TRANSLATE_MODEL[filterModel] || filterModel), onRemove: () => { setFilterModel(''); setFilterCategory(''); } });
  if (filterYear) activeChips.push({ key: 'year', label: filterYear, onRemove: () => { setFilterYear(''); setFilterCategory(''); } });
  if (filterCategory) activeChips.push({ key: 'cat', label: filterCategory, onRemove: () => setFilterCategory('') });
  if (filterEngine) activeChips.push({ key: 'engine', label: lang === 'ar' ? filterEngine : filterEngine.replace('سلندر', 'Cyl').replace('لتر', 'L').replace('توربو', 'Turbo').replace('هايبرد (الهجين)', 'Hybrid'), onRemove: () => setFilterEngine('') });

  const handleCheckoutDatabase = async () => {
    if (cartItems.length === 0) return;

    if (!session) {
      showToast(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لإتمام الطلب 🔒' : 'Please login to checkout 🔒', 'error');
      setIsCartOpen(false);
      setView('auth');
      return;
    }

    setIsCheckoutLoading(true);

    try {
      const ordersPayload = cartItems.map(item => ({
        part_name: `${item.name} (${item.make} ${item.model || ''})`,
        price: Number(item.price),
        garage_id: item.user_id,
        customer_phone: session.phone || session.email || 'غير معروف',
        status: 'pending',
        notes: ''
      }));

      const response = await fetch(`${SUPABASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${session.token || API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(ordersPayload)
      });

      if (response.ok) {
        showToast(lang === 'ar' ? 'تم إرسال طلبك للكراجات بنجاح! سيتم التواصل معك قريباً 🚀' : 'Order sent successfully! We will contact you soon 🚀', 'success');
        
        const userId = session.phone || session.email || session.user?.id;
        if (userId) localStorage.removeItem(`mawjood_cart_${userId}`);
        
        setCartItems([]);
        setIsCartOpen(false);
        setView('profile');
      } else {
        const err = await response.json();
        alert(`خطأ: ${err.message || err.details}`);
      }
    } catch (error: any) {
      alert('خطأ في الاتصال بقاعدة البيانات');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <>
      <style>{`
        [data-mw-theme="light"] { --mw-bg: #F5F7FA; --mw-surface: #FFFFFF; --mw-ink: #131C26; --mw-ink-muted: #5B6B7C; --mw-border: #E4E9EF; --mw-primary: #1F3A5F; --mw-accent: #E0872A; --mw-accent-dark: #C56E17; --mw-accent-bg: #FDF1E3; --mw-success: #1E9D6B; --mw-success-bg: #E8F9F1; --mw-danger: #D1453B; --mw-shadow-md: 0 8px 24px rgba(19,28,38,0.06); }
        [data-mw-theme="dark"] { --mw-bg: #0F1720; --mw-surface: #17212C; --mw-ink: #EBF1F6; --mw-ink-muted: #92A2B3; --mw-border: #263241; --mw-primary: #6C9BD1; --mw-accent: #F2A24E; --mw-accent-dark: #FFC170; --mw-accent-bg: rgba(242,162,78,0.14); --mw-success: #3FCB93; --mw-success-bg: rgba(63,203,147,0.14); --mw-danger: #FF6B61; --mw-shadow-md: 0 8px 24px rgba(0,0,0,0.35); }
        .mw-parts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(272px, 1fr)); gap: 20px; }
        .mw-shop-layout { display: flex; gap: 28px; align-items: flex-start; }
        .mw-sidebar-col { flex: 1 1 260px; max-width: 300px; position: sticky; top: 90px; }
        .mw-toast-stack { position: fixed; bottom: 24px; inset-inline-start: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
        .mw-toast { padding: 12px 20px; border-radius: 999px; font-size: 13.5px; font-weight: 700; color: #fff; white-space: nowrap; }
        @media (max-width: 900px) { .mw-shop-layout { flex-direction: column; } .mw-sidebar-col { position: static; max-width: 100%; width: 100%; } }
      `}</style>

      {showWelcome && <WelcomeModal lang={lang} onStart={() => { setShowWelcome(false); localStorage.setItem('hasVisitedMawjood', 'true'); }} />}

      <div data-mw-theme={theme} dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ ...styles.page, direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}>

        <Header 
          lang={lang} 
          setLang={setLang} 
          view={view} 
          setView={setView} 
          session={session} 
          cartCount={cartItems.length} 
          onOpenCart={() => setIsCartOpen(true)} 
          onLogout={() => { 
            setSession(null); 
            setCartItems([]); 
            localStorage.removeItem('mawjood_session'); 
            setView('shop'); 
            showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out', 'success'); 
          }} 
        />

        {isCartOpen && (
          <>
            <div onClick={() => setIsCartOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
            <div style={{ position: 'fixed', top: 0, [lang === 'ar' ? 'left' : 'right']: 0, bottom: 0, width: '380px', maxWidth: '100%', backgroundColor: 'var(--mw-surface)', zIndex: 101, boxShadow: '0 0 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', padding: '25px', boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--mw-border)', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, color: 'var(--mw-ink)', fontSize: '20px' }}>🛒 {lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--mw-ink-muted)' }}>✖</button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--mw-ink-muted)', marginTop: '60px' }}>
                    <span style={{ fontSize: '50px', display: 'block', marginBottom: '15px' }}>🛍️</span>
                    {lang === 'ar' ? 'السلة فارغة حالياً.' : 'Your cart is currently empty.'}
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px dashed var(--mw-border)' }}>
                      <img src={item.image_url || 'https://via.placeholder.com/70'} alt={item.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0', color: 'var(--mw-ink)', fontSize: '15px' }}>{item.name}</h4>
                        <p style={{ margin: '0 0 8px 0', color: 'var(--mw-ink-muted)', fontSize: '12px' }}>{item.make} - {item.model}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--mw-accent-dark)', fontWeight: 'bold', fontSize: '15px' }}>{item.price} QAR</span>
                          <button onClick={() => setCartItems(cartItems.filter((_, i) => i !== index))} style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>
                            {lang === 'ar' ? 'حذف 🗑️' : 'Remove 🗑️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cartItems.length > 0 && (
                <div style={{ borderTop: '1px solid var(--mw-border)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: 'var(--mw-ink)' }}>
                    <span>{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                    <span style={{ color: 'var(--mw-primary)' }}>{cartItems.reduce((total, item) => total + Number(item.price), 0)} QAR</span>
                  </div>
                  <button onClick={handleCheckoutDatabase} disabled={isCheckoutLoading} style={{ width: '100%', padding: '15px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', opacity: isCheckoutLoading ? 0.7 : 1 }}>
                    {isCheckoutLoading ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إتمام الطلب الآن' : 'Checkout Now')}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <main className="mw-main-container" style={styles.main}>

          {view === 'auth' && <AuthModal lang={lang} authUrl={AUTH_URL} apiKey={API_KEY} onSuccess={(newSession: any) => { setSession(newSession); localStorage.setItem('mawjood_session', JSON.stringify(newSession)); setView(newSession.role === 'garage' ? 'dashboard' : 'shop'); showToast(newSession.role === 'garage' ? t[lang].alertGarageWelcome : t[lang].alertUserWelcome); }} />}

          {view === 'dashboard' && session?.role === 'garage' && <GarageDashboard lang={lang} carData={CAR_DATA} years={YEARS} supabaseUrl={SUPABASE_URL} apiKey={API_KEY} session={session} onSuccess={() => { fetchParts(); setView('shop'); }} />}

          {view === 'profile' && session && session.role !== 'garage' && (
            <CustomerProfile lang={lang} supabaseUrl={SUPABASE_URL} apiKey={API_KEY} session={session} />
          )}

          {view === 'profile' && session && session.role === 'garage' && (
            <div className="mw-state-card" style={styles.stateCard}>
              <span style={styles.stateIcon}>⚙️</span>
              <h3 style={styles.stateTitle}>{lang === 'ar' ? 'إعدادات الكراج (قريباً)' : 'Garage Settings (Coming Soon)'}</h3>
            </div>
          )}

          {view === 'shop' && (
            <div className="mw-shop-layout" style={{ marginTop: '4px' }}>
              <div className="mw-sidebar-col">
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

              <div style={styles.contentCol}>
                <div className="mw-console-panel" style={styles.consolePanel}>
                  <div style={styles.panelTopRow}>
                    <span style={styles.eyebrow}>{lang === 'ar' ? 'بحث القطع' : 'PARTS LOOKUP'}</span>
                    <button className="mw-theme-toggle" style={styles.themeToggle} onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
                  </div>
                  <label style={styles.searchLabel}>{t[lang].searchLabel}</label>
                  <input type="text" className="mw-search-input" placeholder={t[lang].searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                  
                  <div style={styles.statStrip}>
                    <span style={styles.statCount}>
                      {t[lang].matchingParts}: <span style={styles.statCountNum}>{filteredParts.length}</span>
                    </span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={styles.sortSelect}>
                        <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
                        <option value="price_asc">{lang === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                        <option value="price_desc">{lang === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {activeChips.length > 0 && (
                  <div style={styles.chipsRow}>
                    {activeChips.map(chip => (
                      <span key={chip.key} style={styles.chip}>
                        {chip.label}
                        <button onClick={chip.onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>×</button>
                      </span>
                    ))}
                    <button onClick={clearAllFilters} style={styles.chipClear}>{lang === 'ar' ? 'مسح الكل' : 'Clear All'}</button>
                  </div>
                )}

                {!isFiltering ? (
                  <div style={{ ...styles.stateCard, ...styles.stateCardDashed, marginTop: '20px' }}>
                    <span style={styles.stateIcon}>🔍</span>
                    <h3 style={styles.stateTitle}>{lang === 'ar' ? 'اختر سيارتك أو تصفح الأقسام للبدء' : 'Select your car or browse categories to start'}</h3>
                    <p style={styles.stateBody}>
                      {lang === 'ar' 
                        ? 'يرجى اختيار شركة السيارة، الموديل، أو تحديد القسم من القائمة الجانبية (أو استخدام بحث القطع) لعرض قطع الغيار المتوفرة.' 
                        : 'Please select a car make, model, or choose a category from the sidebar to view available auto parts.'}
                    </p>
                  </div>
                ) : loading ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--mw-ink-muted)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>⏳</div>
                    {lang === 'ar' ? 'جاري تحميل القطع...' : 'Loading parts...'}
                  </div>
                ) : visibleParts.length === 0 ? (
                  <div style={{ ...styles.stateCard, ...styles.stateCardDashed, marginTop: '20px' }}>
                    <span style={styles.stateIcon}>📦</span>
                    <h3 style={styles.stateTitle}>{lang === 'ar' ? 'لا توجد قطع مطابقة لبحثك' : 'No parts match your criteria'}</h3>
                    <p style={styles.stateBody}>{lang === 'ar' ? 'جرب البحث عن اسم آخر أو تصفح قسم مختلف، أو يمكنك التواصل معنا لتوفير القطعة.' : 'Try searching for another term or browsing a different category.'}</p>
                    <button onClick={handleGeneralContact} style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: 'var(--mw-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {lang === 'ar' ? 'طلب قطعة خاصة عبر واتساب 💬' : 'Request Custom Part 💬'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mw-parts-grid" style={{ marginTop: '20px' }}>
                      {visibleParts.map(item => (
                        <PartCard 
                          key={item.id} 
                          item={item} 
                          lang={lang} 
                          onBuy={handleBuyClick} 
                          onShare={handleShare} 
                        />
                      ))}
                    </div>

                    {visibleCount < sortedParts.length && (
                      <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)} style={styles.loadMoreBtn}>
                        {lang === 'ar' ? `عرض المزيد (${sortedParts.length - visibleCount} متبقي)` : `Load More (${sortedParts.length - visibleCount} remaining)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
