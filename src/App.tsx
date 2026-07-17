import { useState, useEffect, useRef } from 'react';
import { t } from './utils/translations';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { GarageDashboard } from './components/GarageDashboard';
import { SidebarFilters } from './components/SidebarFilters';
import { PartCard } from './components/PartCard';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const AUTH_URL = "https://shszpcjmhkemqwborfwy.supabase.co/auth/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";
const WHATSAPP_NUMBER = "97455555555";
const PAGE_SIZE = 12;

const TRANSLATE_MAKE: Record<string, string> = {
  "تويوتا": "Toyota", "هيونداي": "Hyundai", "نيسان": "Nissan", "فورد": "Ford",
  "شفروليه": "Chevrolet", "كيا": "Kia", "هوندا": "Honda", "لكزس": "Lexus",
  "ميتسوبيشي": "Mitsubishi", "مازدا": "Mazda", "جي إم سي": "GMC",
  "بي إم دبليو": "BMW", "مرسيدس": "Mercedes-Benz", "فولكس فاجن": "Volkswagen",
  "أودي": "Audi", "جيب": "Jeep", "دودج": "Dodge", "رام": "Ram",
  "لاند روفر": "Land Rover", "إنفينيتي": "Infiniti", "سوبارو": "Subaru",
  "رينو": "Renault", "سوزوكي": "Suzuki", "بورش": "Porsche", "كرايسلر": "Chrysler"
};

const CAR_DATA: Record<string, { models: string[], engines: string[] }> = {
  "تويوتا": {
    models: ["كامري", "كورولا", "يارس", "هيلوكس", "لاندكروزر", "برادو", "أفالون", "راف فور", "فورشنر", "شاص"],
    engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر", "هايبرد (الهجين)"]
  },
  "هيونداي": {
    models: ["إلنترا", "سوناتا", "أكسنت", "توسان", "سانتافي", "أزيرا", "كريتا", "كونا"],
    engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"]
  },
  "نيسان": {
    models: ["باترول", "ألتيما", "صني", "ماكسيما", "إكس تريل", "نافارا", "باثفايندر", "سنترا"],
    engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 4.0 لتر", "8 سلندر - 5.6 لتر"]
  },
  "فورد": {
    models: ["تورس", "إكسبلورر", "إف-150", "إكسبديشن", "موستنج", "إيدج", "رينجر"],
    engines: ["4 سلندر EcoBoost - 2.0 لتر", "6 سلندر - 3.5 لتر", "6 سلندر EcoBoost - 3.5 لتر", "8 سلندر - 5.0 لتر"]
  },
  "شفروليه": {
    models: ["تاهو", "سوبربان", "سيلفرادو", "ماليبو", "كابتيفا", "ترافيرس", "كابرس"],
    engines: ["4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.0 لتر", "8 سلندر - 6.2 لتر"]
  },
  "كيا": {
    models: ["سيراتو", "أوبتيما / K5", "ريو", "سبورتج", "سورينتو", "كادينزا / K8", "بيغاس"],
    engines: ["4 سلندر - 1.4 لتر", "4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر"]
  },
  "هوندا": {
    models: ["أكورد", "سيفيك", "سي آر في", "سيتي", "بايلوت", "أوديسي"],
    engines: ["4 سلندر توربو - 1.5 لتر", "4 سلندر - 2.0 لتر", "4 سلندر - 2.4 لتر", "6 سلندر - 3.5 لتر"]
  },
  "لكزس": {
    models: ["ES", "LS", "LX", "RX", "GX", "IS", "UX"],
    engines: ["4 سلندر - 2.5 لتر", "6 سلندر - 3.5 لتر", "6 سلندر توربو - 3.4 لتر", "8 سلندر - 4.6 لتر", "8 سلندر - 5.7 لتر"]
  },
  "ميتسوبيشي": {
    models: ["باجيرو", "لانسر", "أتراج", "إكليبس كروس", "L200"],
    engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر", "4 سلندر - 2.0 لتر", "6 سلندر - 3.5 لتر"]
  },
  "مازدا": {
    models: ["CX-9", "CX-5", "مازدا 6", "مازدا 3"],
    engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر", "4 سلندر توربو - 2.5 لتر"]
  },
  "جي إم سي": {
    models: ["يوكن", "سييرا", "أكاديا", "تيرين"],
    engines: ["4 سلندر - 1.5 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.3 لتر", "8 سلندر - 6.2 لتر"]
  },
  "بي إم دبليو": {
    models: ["الفئة الثالثة", "الفئة الخامسة", "الفئة السابعة", "X5", "X6"],
    engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.4 لتر"]
  },
  "مرسيدس": {
    models: ["C-Class", "E-Class", "S-Class", "G-Class", "GLE"],
    engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 4.0 لتر"]
  },
  "فولكس فاجن": {
    models: ["جولف", "باسات", "تيغوان", "طوارق"],
    engines: ["4 سلندر توربو - 1.4 لتر", "4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر"]
  },
  "أودي": {
    models: ["A3", "A4", "A6", "Q5", "Q7"],
    engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر توربو - 3.0 لتر"]
  },
  "جيب": {
    models: ["رانجلر", "جراند شيروكي", "شيروكي"],
    engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"]
  },
  "دودج": {
    models: ["تشارجر", "تشالنجر", "دورانجو"],
    engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر", "8 سلندر - 6.4 لتر"]
  },
  "رام": {
    models: ["1500"],
    engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"]
  },
  "لاند روفر": {
    models: ["رينج روفر", "ديفندر", "ديسكفري"],
    engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.0 لتر", "8 سلندر - 5.0 لتر"]
  },
  "إنفينيتي": {
    models: ["Q50", "QX50", "QX80"],
    engines: ["4 سلندر توربو - 2.0 لتر", "6 سلندر - 3.7 لتر", "8 سلندر - 5.6 لتر"]
  },
  "سوبارو": {
    models: ["فورستر", "أوت باك", "إمبريزا"],
    engines: ["4 سلندر - 2.0 لتر", "4 سلندر - 2.5 لتر"]
  },
  "رينو": {
    models: ["داستر", "ميجان", "كوليوس"],
    engines: ["4 سلندر - 1.6 لتر", "4 سلندر - 2.0 لتر", "4 سلندر توربو - 1.3 لتر"]
  },
  "سوزوكي": {
    models: ["سويفت", "جيمني", "فيتارا"],
    engines: ["4 سلندر - 1.2 لتر", "4 سلندر - 1.5 لتر"]
  },
  "بورش": {
    models: ["كايين", "ماكان", "911"],
    engines: ["6 سلندر توربو - 3.0 لتر", "8 سلندر توربو - 4.0 لتر"]
  },
  "كرايسلر": {
    models: ["300C"],
    engines: ["6 سلندر - 3.6 لتر", "8 سلندر - 5.7 لتر"]
  }
};

const YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => (2026 - i).toString());

const PARTS_CATEGORIES = [
  "Belt Drive", "Body & Lamp Assembly", "Brake & Wheel Hub", "Cooling System", "Drivetrain",
  "Electrical", "Electrical-Bulb & Socket", "Electrical-Connector", "Electrical-Switch & Relay",
  "Engine", "Exhaust & Emission", "Fuel & Air", "Heat & Air Conditioning", "Ignition",
  "Interior", "Steering", "Suspension", "Transmission-Automatic", "Wheel", "Wiper & Washer"
];

const RADIUS = { sm: '10px', md: '14px', lg: '20px' };

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif",
    backgroundColor: 'var(--mw-bg)',
    minHeight: '100vh',
    paddingBottom: '60px',
    color: 'var(--mw-ink)',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  main: {
    maxWidth: '1240px',
    margin: '28px auto 0',
    padding: '0 20px',
  },
  contentCol: {
    flex: '2 1 640px',
    minWidth: 0,
  },
  consolePanel: {
    backgroundColor: 'var(--mw-surface)',
    padding: '22px 24px',
    borderRadius: RADIUS.lg,
    boxShadow: 'var(--mw-shadow-md)',
    border: '1px solid var(--mw-border)',
    marginBottom: '18px',
  },
  panelTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  eyebrow: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: 'var(--mw-accent-dark)',
    backgroundColor: 'var(--mw-accent-bg)',
    padding: '4px 10px',
    borderRadius: '999px',
  },
  themeToggle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid var(--mw-border)',
    backgroundColor: 'var(--mw-bg)',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--mw-ink)',
  },
  searchLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--mw-ink)',
  },
  searchInput: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: RADIUS.sm,
    border: '1.5px solid var(--mw-border)',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--mw-bg)',
    color: 'var(--mw-ink)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  statStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px dashed var(--mw-border)',
  },
  statCount: {
    fontSize: '13px',
    color: 'var(--mw-ink-muted)',
    fontWeight: 600,
  },
  statCountNum: {
    color: 'var(--mw-primary)',
    fontSize: '16px',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  secureBadge: {
    fontSize: '12px',
    color: 'var(--mw-success)',
    backgroundColor: 'var(--mw-success-bg)',
    padding: '5px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  sortSelect: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--mw-ink)',
    backgroundColor: 'var(--mw-bg)',
    border: '1.5px solid var(--mw-border)',
    borderRadius: RADIUS.sm,
    padding: '8px 12px',
    cursor: 'pointer',
    outline: 'none',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '18px',
    alignItems: 'center',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: 700,
    color: 'var(--mw-primary)',
    backgroundColor: 'var(--mw-accent-bg)',
    border: '1px solid var(--mw-border)',
    padding: '6px 10px',
    borderRadius: '999px',
  },
  chipClear: {
    fontSize: '12.5px',
    fontWeight: 800,
    color: 'var(--mw-ink-muted)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '6px 4px',
  },
  stateCard: {
    textAlign: 'center',
    padding: '64px 20px',
    backgroundColor: 'var(--mw-surface)',
    borderRadius: RADIUS.lg,
    boxShadow: 'var(--mw-shadow-sm)',
  },
  stateCardDashed: {
    border: '2px dashed var(--mw-border)',
    boxShadow: 'none',
  },
  stateIcon: { fontSize: '46px', lineHeight: 1 },
  stateTitle: { color: 'var(--mw-ink)', marginTop: '16px', fontSize: '17px', fontWeight: 800 },
  stateBody: {
    color: 'var(--mw-ink-muted)',
    fontSize: '14px',
    marginTop: '8px',
    maxWidth: '380px',
    marginInline: 'auto',
    lineHeight: 1.7,
  },
  loadMoreBtn: {
    display: 'block',
    margin: '28px auto 0',
    padding: '12px 32px',
    borderRadius: '999px',
    border: '1.5px solid var(--mw-primary)',
    backgroundColor: 'transparent',
    color: 'var(--mw-primary)',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
  },
  fabBase: {
    position: 'fixed',
    insetInlineEnd: '20px',
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    boxShadow: 'var(--mw-shadow-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    zIndex: 40,
  },
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [view, setView] = useState<'shop' | 'dashboard' | 'auth'>('shop');
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

  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const toastCounter = useRef(0);

  const isFiltering = searchTerm !== '' || filterMake !== '' || filterModel !== '' || filterYear !== '' || filterEngine !== '';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toastCounter.current += 1;
    const id = `${Date.now()}-${toastCounter.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(tst => tst.id !== id)), 3200);
  };

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedMawjood');
    if (!hasVisited) setShowWelcome(true);

    const savedSession = localStorage.getItem('mawjood_session');
    if (savedSession) setSession(JSON.parse(savedSession));

    const savedTheme = localStorage.getItem('mawjood_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

    fetchParts();

    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, filterMake, filterModel, filterYear, filterEngine, sortBy]);

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
    const matchesSearchText = !searchTerm || 
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (item.make && item.make.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesMake = !filterMake || item.make === filterMake;
    const matchesModel = !filterModel || (item.model && item.model === filterModel);
    const matchesYear = !filterYear || (item.year && String(item.year) === String(filterYear));
    const matchesEngine = !filterEngine || (item.engine && item.engine === filterEngine);
    
    return matchesSearchText && matchesMake && matchesModel && matchesYear && matchesEngine;
  });

  const sortedParts = [...filteredParts].sort((a, b) => {
    if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
    return b.id - a.id;
  });
  const visibleParts = sortedParts.slice(0, visibleCount);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('mawjood_theme', next);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm(''); setFilterMake(''); setFilterModel(''); setFilterYear(''); setFilterEngine('');
  };

  const handleBuyClick = (item: any) => {
    const text = lang === 'ar'
      ? `مرحباً موجود أوتو قطر 👋\nأرغب في الاستفسار عن قطعة الغيار:\n\n🛠️ القطعة: *${item.name}*\n🚗 السيارة: *${item.make} - ${item.model || 'غير محدد'}*\n📅 الموديل: *${item.year}*\n💰 السعر: *${item.price} ر.ق*`
      : `Hello Mawjood Auto Qatar 👋\nI want to inquire about the spare part:\n\n🛠️ Part: *${item.name}*\n🚗 Car: *${item.make} - ${item.model || 'N/A'}*\n📅 Year: *${item.year}*\n💰 Price: *${item.price} QAR*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGeneralContact = () => {
    const text = lang === 'ar'
      ? `مرحباً موجود أوتو قطر 👋\nأبحث عن قطعة غيار ولم أجدها في المتجر، هل يمكنكم المساعدة؟`
      : `Hello Mawjood Auto Qatar 👋\nI'm looking for a part I couldn't find in the shop — can you help?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async (item: any) => {
    const shareText = lang === 'ar'
      ? `🚗 *موجود أوتو قطر 🇶🇦*\n\n🛠️ القطعة: *${item.name}*\n🚘 السيارة: *${item.make} - ${item.model || 'عام'}*\n📅 الموديل: *${item.year}*\n💰 السعر: *${item.price} ر.ق*`
      : `🚗 *Mawjood Auto Qatar 🇶🇦*\n\n🛠️ Part: *${item.name}*\n🚘 Car: *${item.make} - ${item.model || 'General'}*\n📅 Year: *${item.year}*\n💰 Price: *${item.price} QAR*`;

    if (navigator.share) {
      try { await navigator.share({ title: `Mawjood Auto`, text: shareText, url: window.location.href }); } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast(t[lang].alertCopied, 'success');
      } catch (err) { showToast('Failed to copy', 'error'); }
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (searchTerm) activeChips.push({ key: 'search', label: `"${searchTerm}"`, onRemove: () => setSearchTerm('') });
  if (filterMake) activeChips.push({ key: 'make', label: lang === 'ar' ? filterMake : (TRANSLATE_MAKE[filterMake] || filterMake), onRemove: () => { setFilterMake(''); setFilterModel(''); } });
  if (filterModel) activeChips.push({ key: 'model', label: filterModel, onRemove: () => setFilterModel('') });
  if (filterYear) activeChips.push({ key: 'year', label: filterYear, onRemove: () => setFilterYear('') });
  if (filterEngine) activeChips.push({ key: 'engine', label: filterEngine, onRemove: () => setFilterEngine('') });

  return (
    <>
      <style>{`
        [data-mw-theme="light"] {
          --mw-bg: #F5F7FA; --mw-surface: #FFFFFF; --mw-ink: #131C26; --mw-ink-muted: #5B6B7C;
          --mw-border: #E4E9EF; --mw-primary: #1F3A5F; --mw-primary-dark: #152840;
          --mw-accent: #E0872A; --mw-accent-dark: #C56E17; --mw-accent-bg: #FDF1E3;
          --mw-success: #1E9D6B; --mw-success-bg: #E8F9F1; --mw-danger: #D1453B; --mw-danger-bg: #FCEAE9;
          --mw-shadow-sm: 0 1px 2px rgba(19,28,38,0.06);
          --mw-shadow-md: 0 8px 24px rgba(19,28,38,0.06);
          --mw-shadow-lg: 0 16px 40px rgba(19,28,38,0.16);
        }
        [data-mw-theme="dark"] {
          --mw-bg: #0F1720; --mw-surface: #17212C; --mw-ink: #EBF1F6; --mw-ink-muted: #92A2B3;
          --mw-border: #263241; --mw-primary: #6C9BD1; --mw-primary-dark: #8FB3E0;
          --mw-accent: #F2A24E; --mw-accent-dark: #FFC170; --mw-accent-bg: rgba(242,162,78,0.14);
          --mw-success: #3FCB93; --mw-success-bg: rgba(63,203,147,0.14); --mw-danger: #FF6B61; --mw-danger-bg: rgba(255,107,97,0.14);
          --mw-shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
          --mw-shadow-md: 0 8px 24px rgba(0,0,0,0.35);
          --mw-shadow-lg: 0 16px 40px rgba(0,0,0,0.5);
        }

        @keyframes mw-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes mw-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes mw-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mw-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .mw-search-input:focus {
          border-color: var(--mw-primary) !important;
          box-shadow: 0 0 0 4px var(--mw-accent-bg);
        }
        .mw-chip-x { border: none; background: none; cursor: pointer; color: inherit; font-weight: 800; line-height: 1; padding: 0; }
        .mw-fab:hover { filter: brightness(1.06); }
        .mw-load-more:hover { background-color: var(--mw-accent-bg) !important; }
        .mw-theme-toggle:hover { border-color: var(--mw-primary) !important; }

        .mw-parts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(272px, 1fr)); gap: 20px; }
        .mw-parts-grid > * { animation: mw-fade-up 0.25s ease both; }
        .mw-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(272px, 1fr)); gap: 20px; }
        .mw-skeleton-card { height: 220px; border-radius: 14px; background-color: var(--mw-surface); border: 1px solid var(--mw-border); animation: mw-pulse 1.4s ease-in-out infinite; }

        .mw-shop-layout { display: flex; gap: 28px; align-items: flex-start; }
        .mw-sidebar-col { flex: 1 1 260px; max-width: 300px; position: sticky; top: 90px; }

        .mw-toast-stack { position: fixed; bottom: 24px; inset-inline-start: 50%; transform: translateX(-50%); z-index: 60; display: flex; flex-direction: column; gap: 8px; align-items: center; }
        [dir="rtl"] .mw-toast-stack { transform: translateX(50%); }
        .mw-toast { animation: mw-toast-in 0.2s ease both; padding: 12px 20px; border-radius: 999px; font-size: 13.5px; font-weight: 700; box-shadow: var(--mw-shadow-lg); color: #fff; white-space: nowrap; }

        @media (max-width: 900px) {
          .mw-shop-layout { flex-direction: column; }
          .mw-sidebar-col { position: static; max-width: 100%; width: 100%; }
          .mw-parts-grid, .mw-skeleton-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
        }
        @media (max-width: 560px) {
          .mw-main-container { padding: 0 14px !important; margin-top: 16px !important; }
          .mw-console-panel { padding: 16px !important; border-radius: 16px !important; }
          .mw-parts-grid, .mw-skeleton-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .mw-state-card { padding: 40px 16px !important; }
          .mw-toast { font-size: 12.5px; padding: 10px 16px; }
        }
        @media (max-width: 400px) {
          .mw-parts-grid, .mw-skeleton-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {showWelcome && <WelcomeModal lang={lang} onStart={() => { setShowWelcome(false); localStorage.setItem('hasVisitedMawjood', 'true'); }} />}

      <div
        data-mw-theme={theme}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{ ...styles.page, direction: lang === 'ar' ? 'rtl' : 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}
      >

        <Header lang={lang} setLang={setLang} view={view} setView={setView} session={session} onLogout={() => { setSession(null); localStorage.removeItem('mawjood_session'); setView('shop'); showToast(t[lang].alertLogoutSuccess); }} />

        <main className="mw-main-container" style={styles.main}>

          {view === 'auth' && <AuthModal lang={lang} authUrl={AUTH_URL} apiKey={API_KEY} onSuccess={(newSession: any) => { setSession(newSession); localStorage.setItem('mawjood_session', JSON.stringify(newSession)); setView(newSession.role === 'garage' ? 'dashboard' : 'shop'); showToast(newSession.role === 'garage' ? t[lang].alertGarageWelcome : t[lang].alertUserWelcome); }} />}

          {view === 'dashboard' && session?.role === 'garage' && <GarageDashboard lang={lang} carData={CAR_DATA} years={YEARS} supabaseUrl={SUPABASE_URL} apiKey={API_KEY} session={session} onSuccess={() => { fetchParts(); setView('shop'); }} />}

          {view === 'shop' && (
            <div className="mw-shop-layout" style={{ marginTop: '4px' }}>

              <div className="mw-sidebar-col">
                <SidebarFilters
                  lang={lang} carData={CAR_DATA} years={YEARS} translateMake={TRANSLATE_MAKE} categories={PARTS_CATEGORIES} expandedCategories={expandedCategories} toggleCategory={toggleCategory} inventory={inventory}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterMake={filterMake} setFilterMake={setFilterMake} filterModel={filterModel} setFilterModel={setFilterModel} filterYear={filterYear} setFilterYear={setFilterYear} filterEngine={filterEngine} setFilterEngine={setFilterEngine}
                />
              </div>

              <div style={styles.contentCol}>
                <div className="mw-console-panel" style={styles.consolePanel}>
                  <div style={styles.panelTopRow}>
                    <span style={styles.eyebrow}>{lang === 'ar' ? 'بحث القطع' : 'PARTS LOOKUP'}</span>
                    <button
                      className="mw-theme-toggle"
                      style={styles.themeToggle}
                      onClick={toggleTheme}
                      aria-label={lang === 'ar' ? 'تبديل المظهر' : 'Toggle theme'}
                      title={lang === 'ar' ? 'تبديل المظهر' : 'Toggle theme'}
                    >
                      {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                  </div>

                  <label style={styles.searchLabel}>{t[lang].searchLabel}</label>
                  <input
                    type="text"
                    className="mw-search-input"
                    placeholder={t[lang].searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />

                  <div style={styles.statStrip}>
                    <span style={styles.statCount}>
                      {t[lang].matchingParts}: <span style={styles.statCountNum}>{filteredParts.length}</span>
                      {inventory.length > 0 && (
                        <span style={{ opacity: 0.7 }}> / {inventory.length}</span>
                      )}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <select
                        style={styles.sortSelect}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        aria-label={lang === 'ar' ? 'ترتيب النتائج' : 'Sort results'}
                      >
                        <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
                        <option value="price_asc">{lang === 'ar' ? 'السعر: الأقل أولاً' : 'Price: Low to High'}</option>
                        <option value="price_desc">{lang === 'ar' ? 'السعر: الأعلى أولاً' : 'Price: High to Low'}</option>
                      </select>
                      <span style={styles.secureBadge}>🔒 {t[lang].dbSecure}</span>
                    </div>
                  </div>
                </div>

                {isFiltering && (
                  <div style={styles.chipsRow}>
                    {activeChips.map(chip => (
                      <span key={chip.key} style={styles.chip}>
                        {chip.label}
                        <button className="mw-chip-x" onClick={chip.onRemove} aria-label={lang === 'ar' ? 'إزالة' : 'Remove'}>✕</button>
                      </span>
                    ))}
                    <button style={styles.chipClear} onClick={clearAllFilters}>
                      {lang === 'ar' ? 'مسح كل الفلاتر' : 'Clear all filters'}
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="mw-skeleton-grid">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="mw-skeleton-card" />)}
                  </div>
                ) : !isFiltering ? (
                  <div className="mw-state-card" style={{ ...styles.stateCard, ...styles.stateCardDashed }}>
                    <span style={styles.stateIcon}>🔍</span>
                    <h3 style={styles.stateTitle}>{lang === 'ar' ? 'ابدأ رحلة البحث' : 'Start Searching'}</h3>
                    <p style={styles.stateBody}>
                      {lang === 'ar'
                        ? 'يرجى استخدام شريط البحث أو اختيار قسم من القائمة الجانبية لعرض قطع الغيار المناسبة.'
                        : 'Please use the search bar or select a category from the sidebar to view matching parts.'}
                    </p>
                  </div>
                ) : filteredParts.length === 0 ? (
                  <div className="mw-state-card" style={styles.stateCard}>
                    <span style={styles.stateIcon}>🚫</span>
                    <p style={{ ...styles.stateBody, marginTop: '16px', fontWeight: 700, color: 'var(--mw-ink)' }}>{t[lang].noPartsFound}</p>
                    <button
                      style={{ ...styles.loadMoreBtn, margin: '20px auto 0', backgroundColor: 'var(--mw-primary)', borderColor: 'var(--mw-primary)', color: '#fff' }}
                      onClick={handleGeneralContact}
                    >
                      {lang === 'ar' ? 'اسأل عنها عبر واتساب' : 'Ask us on WhatsApp'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mw-parts-grid">
                      {visibleParts.map(item => (
                        <PartCard key={item.id} lang={lang} item={item} translateMake={TRANSLATE_MAKE} onBuy={handleBuyClick} onShare={handleShare} />
                      ))}
                    </div>
                    {visibleCount < sortedParts.length && (
                      <button
                        className="mw-load-more"
                        style={styles.loadMoreBtn}
                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      >
                        {lang === 'ar' ? `عرض المزيد (${sortedParts.length - visibleCount})` : `Load more (${sortedParts.length - visibleCount})`}
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          )}

        </main>

        <button
          className="mw-fab"
          style={{ ...styles.fabBase, bottom: '20px', backgroundColor: '#25D366', color: '#fff' }}
          onClick={handleGeneralContact}
          aria-label={lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
          title={lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
        >
          💬
        </button>
        {showScrollTop && (
          <button
            className="mw-fab"
            style={{ ...styles.fabBase, bottom: '82px', backgroundColor: 'var(--mw-surface)', color: 'var(--mw-primary)', border: '1px solid var(--mw-border)' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={lang === 'ar' ? 'العودة للأعلى' : 'Back to top'}
            title={lang === 'ar' ? 'العودة للأعلى' : 'Back to top'}
          >
            ↑
          </button>
        )}

        <div className="mw-toast-stack">
          {toasts.map(tst => (
            <div
              key={tst.id}
              className="mw-toast"
              style={{ backgroundColor: tst.type === 'error' ? 'var(--mw-danger)' : 'var(--mw-primary)' }}
            >
              {tst.message}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
