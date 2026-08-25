// src/utils/istemaraScanner.ts
import { createWorker } from 'tesseract.js';

export interface IstemaraScanResult {
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  success: boolean;
  rawText?: string;
  error?: string;
}

/**
 * معالجة وتحسين وضوح الصورة عبر Canvas
 */
async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1800;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // تحويل لأبيض وأسود مع رفع التباين لتوضيح الأرقام
      for (let i = 0; i < d.length; i += 4) {
        let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        gray = (gray - 128) * 1.6 + 128;
        gray = Math.max(0, Math.min(255, gray));
        d[i] = d[i + 1] = d[i + 2] = gray;
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.95);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * الدالة الرئيسية لقراءة وفحص الاستمارة
 */
export async function scanIstemara(file: File, carData: any = {}): Promise<IstemaraScanResult> {
  try {
    const processedBlob = await preprocessImage(file);
    const worker = await createWorker('eng');
    const ret = await worker.recognize(processedBlob);
    await worker.terminate();

    const rawText = ret.data.text || '';
    let detectedVin = '';

    // 1. فحص الكلمات المنفصلة
    const words = rawText.split(/[\s\n\r\t,;:|/]+/);
    for (const word of words) {
      const clean = word.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean.length === 17) {
        const corrected = clean.replace(/O/g, '0').replace(/Q/g, '0').replace(/I/g, '1');
        if (/[A-Z]/.test(corrected) && /[0-9]/.test(corrected)) {
          detectedVin = corrected;
          break;
        }
      }
    }

    // 2. البحث في سطر Chassis No
    if (!detectedVin) {
      const lines = rawText.split(/\r?\n/);
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('chassis') || lower.includes('vin') || line.includes('قاعدة') || line.includes('هيكل')) {
          const matches = line.match(/[A-Za-z0-9]{15,20}/g);
          if (matches) {
            for (let m of matches) {
              let corrected = m.toUpperCase().replace(/O/g, '0').replace(/Q/g, '0').replace(/I/g, '1');
              if (corrected.startsWith('NO')) corrected = corrected.substring(2);
              if (corrected.length === 17) {
                detectedVin = corrected;
                break;
              } else if (corrected.length > 17) {
                detectedVin = corrected.substring(corrected.length - 17);
                break;
              }
            }
          }
        }
        if (detectedVin) break;
      }
    }

    // 3. مطابقة بادئات الشواصي الخليجية الشهيرة
    if (!detectedVin) {
      const fullCleaned = rawText.replace(/[\s\-_:.]/g, '').toUpperCase();
      const prefixes = ['6T1', '4T1', '2T1', 'JT', 'KM', 'KN', 'JN', '1F', '2F', '3F', 'WB', 'WD', 'WA', 'SA', '1G', '3G', 'VF', 'WV', 'JM', 'MA', 'NL'];
      for (const p of prefixes) {
        const idx = fullCleaned.indexOf(p);
        if (idx !== -1 && idx + 17 <= fullCleaned.length) {
          const candidate = fullCleaned.substring(idx, idx + 17).replace(/O/g, '0').replace(/Q/g, '0').replace(/I/g, '1');
          if (candidate.length === 17 && /[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
            detectedVin = candidate;
            break;
          }
        }
      }
    }

    if (detectedVin && detectedVin.length === 17) {
      return { success: true, vin: detectedVin, rawText };
    }

    // 4. استخراج احتياطي للماركة والموديل والسنة
    let foundMake = '';
    let foundModel = '';
    let foundYear = '';

    for (const m of Object.keys(carData)) {
      const enName = carData[m]?.en || '';
      if (rawText.toLowerCase().includes(m.toLowerCase()) || (enName && rawText.toLowerCase().includes(enName.toLowerCase()))) {
        foundMake = m;
        const models = carData[m]?.models || [];
        for (const mod of models) {
          if (rawText.toLowerCase().includes(mod.toLowerCase())) {
            foundModel = mod;
            break;
          }
        }
        break;
      }
    }

    const yearMatch = rawText.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) foundYear = yearMatch[0];

    if (foundMake || foundModel) {
      return {
        success: true,
        vin: detectedVin,
        make: foundMake || 'Toyota',
        model: foundModel || 'Camry',
        year: foundYear || '2015',
        rawText
      };
    }

    return { success: false, rawText };
  } catch (error: any) {
    return { success: false, error: error.message || 'Scan error' };
  }
}
