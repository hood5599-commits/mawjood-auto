// src/utils/istemaraScanner.ts

export interface IstemaraScanResult {
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  success: boolean;
  error?: string;
}

/**
 * تحويل ملف الصورة إلى Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * فحص الاستمارة بالذكاء الاصطناعي عبر السيرفر
 */
export async function scanIstemara(file: File, carData: any = {}): Promise<IstemaraScanResult> {
  try {
    const base64Data = await fileToBase64(file);

    const response = await fetch('/api/scan-istemara', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: file.type || 'image/jpeg'
      })
    });

    const parsed = await response.json();

    if (!response.ok) {
      return { success: false, error: parsed.error || 'AI scan error' };
    }

    let detectedVin = (parsed.vin || '').replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();

    // تصحيح الأخطاء البصرية الشائعة
    detectedVin = detectedVin
      .replace(/I/g, '1')
      .replace(/O/g, '0')
      .replace(/Q/g, '0');

    let matchedMakeKey = Object.keys(carData).find(
      m => m.toLowerCase() === (parsed.make || '').toLowerCase() || carData[m]?.en?.toLowerCase() === (parsed.make || '').toLowerCase()
    ) || parsed.make;

    return {
      success: true,
      vin: detectedVin,
      make: matchedMakeKey || parsed.make || '',
      model: parsed.model || '',
      year: parsed.year || ''
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Server connection error' };
  }
}
