// 🛡️ نظام المراقبة الذكي وشبكة اكتشاف الأخطاء للموقع
const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

// 🤖 يمكنك وضع كود Telegram Bot للتنبيه الفوري على جوالك (اختياري)
const TELEGRAM_BOT_TOKEN = ""; // أضف التوكن هنا إن وجد
const TELEGRAM_CHAT_ID = "";   // أضف معرف الشات هنا

export interface SystemErrorLog {
  id?: number;
  error_type: 'CRASH' | 'NETWORK' | 'SUPABASE_RLS' | 'UI_BUG' | 'TIMEOUT';
  message: string;
  stack_trace?: string;
  page_url: string;
  user_info?: string;
  created_at?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class ErrorSentry {
  private static isInitialized = false;

  public static init(sessionInfo?: any) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1️⃣ التقاط أخطاء الجافاسكريبت غير الممسوكة
    window.addEventListener('error', (event) => {
      this.reportError({
        error_type: 'CRASH',
        message: event.message || 'Unknown Runtime Error',
        stack_trace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        page_url: window.location.href,
        user_info: sessionInfo?.user?.id || 'Guest User',
        severity: 'CRITICAL'
      });
    });

    // 2️⃣ التقاط الوعود المرفوضة (Unhandled Promise Rejections) مثل فشل Supabase
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.reportError({
        error_type: 'SUPABASE_RLS',
        message: typeof reason === 'string' ? reason : (reason?.message || JSON.stringify(reason)),
        stack_trace: reason?.stack || 'Promise Rejection',
        page_url: window.location.href,
        user_info: sessionInfo?.user?.id || 'Guest User',
        severity: 'HIGH'
      });
    });

    // 3️⃣ مراقبة الشبكة والاستجابات البطئة (Fetch Interceptor)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // اكتشاف استجابات البطء الشديد (أكثر من 6 ثوانٍ)
        if (duration > 6000 && !url.includes('system_errors')) {
          this.reportError({
            error_type: 'TIMEOUT',
            message: `بطء شديد في استجابة السيرفر (${(duration/1000).toFixed(1)}s): ${url}`,
            page_url: window.location.href,
            severity: 'MEDIUM'
          });
        }

        // اكتشاف أخطاء السيرفر (400, 401, 403, 500)
        if (!response.ok && !url.includes('system_errors')) {
          this.reportError({
            error_type: response.status === 401 || response.status === 403 ? 'SUPABASE_RLS' : 'NETWORK',
            message: `فشل طلب الشبكة [Status ${response.status}]: ${url}`,
            page_url: window.location.href,
            severity: response.status >= 500 ? 'CRITICAL' : 'HIGH'
          });
        }

        return response;
      } catch (error: any) {
        this.reportError({
          error_type: 'NETWORK',
          message: `انقطاع اتصال الشبكة أو خادم Supabase: ${error?.message || 'Network Disconnected'}`,
          page_url: window.location.href,
          severity: 'HIGH'
        });
        throw error;
      }
    };
  }

  // 📤 إرسال التقرير لقاعدة البيانات والتليجرام
  public static async reportError(log: SystemErrorLog) {
    console.error("🚨 [Sentry Detector]:", log.message);

    try {
      // حفظ الخطأ في جدول system_errors بـ Supabase
      await fetch(`${SUPABASE_URL}/system_errors`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          error_type: log.error_type,
          message: log.message,
          stack_trace: log.stack_trace || null,
          page_url: log.page_url,
          user_info: log.user_info || 'Anonym',
          severity: log.severity
        }])
      });

      // إرسال تنبيه للتليجرام إذا كان البوت مفعلاً
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const text = `🚨 *تنبيه خطأ في موقع موجود أوتو*\n\n📌 *النوع:* ${log.error_type}\n⚠️ *الدرجة:* ${log.severity}\n💬 *الرسالة:* ${log.message}\n🔗 *الصفحة:* ${log.page_url}`;
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
        }).catch(() => {});
      }
    } catch (e) {
      // يتجنب النظام التسبب في أخطاء دائرية
    }
  }
}
