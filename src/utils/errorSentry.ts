/* eslint-disable @typescript-eslint/no-unused-vars */

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

// 🤖 إعدادات التليجرام للبوت للتنبيه الفوري
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
  private static lastLoggedErrors: Map<string, number> = new Map();

  public static init(sessionInfo?: any) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1️⃣ التقاط أخطاء الجافاسكريبت والـ React الرسومية
    window.addEventListener('error', (event) => {
      this.reportError({
        error_type: 'CRASH',
        message: event.message || 'Unknown Runtime Error',
        stack_trace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        page_url: window.location.href,
        user_info: this.extractUserInfo(sessionInfo),
        severity: 'CRITICAL'
      });
    });

    // 2️⃣ التقاط الوعود المرفوضة (Unhandled Promise Rejections)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : (reason?.message || JSON.stringify(reason));
      
      this.reportError({
        error_type: 'SUPABASE_RLS',
        message: msg || 'Unhandled Promise Rejection',
        stack_trace: reason?.stack || 'Promise Rejection Stack Unavailable',
        page_url: window.location.href,
        user_info: this.extractUserInfo(sessionInfo),
        severity: 'HIGH'
      });
    });

    // 3️⃣ الاعتراض الأسطوري للشبكة (Ultra Fetch Interceptor) مع قراءة الـ Response Body
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // تجاهل أخطاء تسجيل الأخطاء نفسها لمنع Loops
        if (url.includes('system_errors') || url.includes('telegram.org')) {
          return response;
        }

        // ⏱️ اكتشاف البطء الشديد في الاستجابة (أكثر من 6 ثوانٍ)
        if (duration > 6000) {
          this.reportError({
            error_type: 'TIMEOUT',
            message: `بطء شديد في استجابة السيرفر (${(duration / 1000).toFixed(1)} ثانية): ${url}`,
            page_url: window.location.href,
            user_info: this.extractUserInfo(sessionInfo),
            severity: 'MEDIUM'
          });
        }

        // 🚨 اكتشاف أخطاء HTTP والاستخراج الفوري لرسالة السيرفر النصية (Server Response Body)
        if (!response.ok) {
          const clonedResponse = response.clone();
          let serverResponseBody = "";

          try {
            serverResponseBody = await clonedResponse.text();
          } catch (e) {
            serverResponseBody = "تعذر استخراج نص الاستجابة من السيرفر";
          }

          const httpStatus = response.status;
          const isRLS = httpStatus === 401 || httpStatus === 403;

          this.reportError({
            error_type: isRLS ? 'SUPABASE_RLS' : 'NETWORK',
            message: `فشل طلب الشبكة [Status ${httpStatus}]: ${url}`,
            stack_trace: `🔍 [تفاصيل الرد الصريح من السيرفر]:\n${serverResponseBody}`,
            page_url: window.location.href,
            user_info: this.extractUserInfo(sessionInfo),
            severity: httpStatus >= 500 ? 'CRITICAL' : 'HIGH'
          });
        }

        return response;
      } catch (error: any) {
        if (!url.includes('system_errors')) {
          this.reportError({
            error_type: 'NETWORK',
            message: `انقطاع اتصال الشبكة أو خادم Supabase: ${error?.message || 'Network Error'}`,
            stack_trace: error?.stack || 'Network Failure Stack',
            page_url: window.location.href,
            user_info: this.extractUserInfo(sessionInfo),
            severity: 'HIGH'
          });
        }
        throw error;
      }
    };
  }

  // 👤 استخراج معلومات المستخدم بشكل شامل بدقة
  private static extractUserInfo(sessionInfo?: any): string {
    if (!sessionInfo) return 'Guest User';
    return sessionInfo?.user?.email || 
           sessionInfo?.email || 
           sessionInfo?.user?.phone || 
           sessionInfo?.phone || 
           sessionInfo?.user?.id || 
           'Logged User';
  }

  // 📤 إرسال تقرير الخطأ بقاعدة البيانات وبوت التليجرام مع تصفية التكرار
  public static async reportError(log: SystemErrorLog) {
    // 🛡️ تصفية الأخطاء المكررة خلال 5 ثوانٍ لمنع إغراق السيرفر
    const errorKey = `${log.error_type}_${log.message}`;
    const now = Date.now();
    if (this.lastLoggedErrors.has(errorKey)) {
      const lastTime = this.lastLoggedErrors.get(errorKey)!;
      if (now - lastTime < 5000) return; // منع التكرار في غضون 5 ثوانٍ
    }
    this.lastLoggedErrors.set(errorKey, now);

    console.error("🚨 [Sentry Ultra Detector]:", log.message, log.stack_trace);

    try {
      // 1. حفظ الخطأ بجدول system_errors في Supabase
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
          severity: log.severity,
          created_at: new Date().toISOString()
        }])
      });

      // 2. إرسال إشعار التليجرام الفوري إذا تم إدخال التوكن والشات آيدي
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const telegramText = 
          `🚨 *تنبيه خطأ في موقع موجود أوتو*\n\n` +
          `📌 *النوع:* ${log.error_type}\n` +
          `⚠️ *الدرجة:* ${log.severity}\n` +
          `👤 *المستخدم:* ${log.user_info}\n` +
          `💬 *الرسالة:* ${log.message}\n` +
          (log.stack_trace ? `🔍 *التفاصيل:* \`${log.stack_trace.slice(0, 300)}\`\n` : '') +
          `🔗 *الصفحة:* ${log.page_url}`;

        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: TELEGRAM_CHAT_ID, 
            text: telegramText, 
            parse_mode: 'Markdown' 
          })
        }).catch(() => {});
      }
    } catch (e) {
      // تجنب حدوث أخطاء دائرية
    }
  }
}
