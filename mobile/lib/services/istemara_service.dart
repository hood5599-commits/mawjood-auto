import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';

import '../data/car_data.dart';

class IstemaraScanResult {
  final String? vin;
  final String? make;
  final String? model;
  final String? year;
  final bool success;
  final String? error;

  const IstemaraScanResult({
    this.vin,
    this.make,
    this.model,
    this.year,
    required this.success,
    this.error,
  });

  factory IstemaraScanResult.failure(String message) {
    return IstemaraScanResult(success: false, error: message);
  }
}

class IstemaraService {
  static final Dio _dio = Dio();

  // مفتاح Gemini الافتراضي (يمكن تمريره من البيئة String.fromEnvironment)
  static const String geminiApiKey = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: '',
  );

  static const String targetModel = 'gemini-2.5-flash';

  /// فحص الاستمارة عبر استدعاء Gemini مباشرة أو عبر السيرفر
  static Future<IstemaraScanResult> scanIstemara({
    required File imageFile,
    String? serverApiUrl,
  }) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes).replaceAll(RegExp(r'\s'), '');
      final extension = imageFile.path.split('.').last.toLowerCase();
      final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';

      String rawText = '';

      // الخيار 1: إرسال الطلب لسيرفر الموقع إن توفر الرابط
      if (serverApiUrl != null && serverApiUrl.isNotEmpty) {
        final response = await _dio.post(
          serverApiUrl,
          data: {'imageBase64': base64Image, 'mimeType': mimeType},
          options: Options(headers: {'Content-Type': 'application/json'}),
        );

        if (response.statusCode == 200 && response.data != null) {
          return _parseResponse(response.data);
        }
      }

      // الخيار 2: الاتصال المباشر بـ Google Gemini API
      if (geminiApiKey.isEmpty) {
        return IstemaraScanResult.failure(
          'يرجى ضبط مفتاح GEMINI_API_KEY في إعدادات التطبيق',
        );
      }

      const promptText = '''
Analyze this Qatari vehicle registration card (استمارة ترخيص تسيير مركبة دولة قطر).
Extract strictly:
1. Chassis No. / رقم القاعدة (17-character VIN).
2. Make / نوع المركبة.
3. Model / الطراز.
4. Year / سنة الصنع.

Respond ONLY with a valid JSON object:
{"vin": "6T1BF9FK9FX540435", "make": "Toyota", "model": "Camry", "year": "2015"}
''';

      final geminiUrl =
          'https://generativelanguage.googleapis.com/v1beta/models/$targetModel:generateContent?key=$geminiApiKey';

      final geminiRes = await _dio.post(
        geminiUrl,
        data: {
          'contents': [
            {
              'parts': [
                {'text': promptText},
                {
                  'inlineData': {'mimeType': mimeType, 'data': base64Image},
                },
              ],
            },
          ],
          'generationConfig': {
            'responseMimeType': 'application/json',
            'temperature': 0.1,
          },
        },
      );

      rawText =
          geminiRes
              .data?['candidates']?[0]?['content']?['parts']?[0]?['text'] ??
          '{}';
      final Map<String, dynamic> parsedJson = jsonDecode(rawText);
      return _parseResponse(parsedJson);
    } on DioException catch (dioErr) {
      final msg = dioErr.response?.data?['error']?['message'] ?? dioErr.message;
      return IstemaraScanResult.failure('خطأ في معالجة الاستمارة: $msg');
    } catch (e) {
      return IstemaraScanResult.failure('حدث خطأ أثناء فحص الصورة: $e');
    }
  }

  static IstemaraScanResult _parseResponse(Map<String, dynamic> parsed) {
    String detectedVin = (parsed['vin'] ?? '').toString();

    // تصحيح واستخراج رقم الشاصي (17 حرفاً ورقمياً)
    final vinMatch = RegExp(
      r'[A-HJ-NPR-Z0-9]{17}',
      caseSensitive: false,
    ).firstMatch(detectedVin);
    if (vinMatch != null) {
      detectedVin = vinMatch.group(0)!.toUpperCase();
    }

    detectedVin = detectedVin
        .replaceAll('I', '1')
        .replaceAll('O', '0')
        .replaceAll('Q', '0');

    final rawMake = (parsed['make'] ?? '').toString().trim();
    final model = (parsed['model'] ?? '').toString().trim();
    final year = (parsed['year'] ?? '').toString().trim();

    // مطابقة اسم الشركة مع قاموس CarData المعتمد
    String matchedMake = rawMake;
    for (final brandKey in CarData.brands.keys) {
      final brand = CarData.brands[brandKey]!;
      if (brandKey.toLowerCase() == rawMake.toLowerCase() ||
          brand.en.toLowerCase() == rawMake.toLowerCase()) {
        matchedMake = brandKey;
        break;
      }
    }

    return IstemaraScanResult(
      success: true,
      vin: detectedVin,
      make: matchedMake,
      model: model,
      year: year,
    );
  }
}
