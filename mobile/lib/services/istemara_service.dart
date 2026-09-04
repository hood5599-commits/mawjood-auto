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
  static final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 45),
      receiveTimeout: const Duration(seconds: 45),
    ),
  );

  static const String geminiApiKey = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: '',
  );

  static const List<String> _geminiModels = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
  ];

  static const String _prompt = '''
Analyze this Qatari vehicle registration card (استمارة ترخيص تسيير مركبة دولة قطر).
Extract strictly:
1. Chassis No. / رقم القاعدة (17-character VIN).
2. Make / نوع المركبة.
3. Model / الطراز.
4. Year / سنة الصنع.

Respond ONLY with a valid JSON object:
{"vin": "6T1BF9FK9FX540435", "make": "Toyota", "model": "Camry", "year": "2015"}
''';

  /// Unified Istemara/VIN OCR engine used by SmartVinScanner, RequestPartModal, Checkout.
  static Future<IstemaraScanResult> scanIstemara({
    required File imageFile,
    String? serverApiUrl,
  }) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes).replaceAll(RegExp(r'\s'), '');
      final extension = imageFile.path.split('.').last.toLowerCase();
      final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';

      // 1) Optional backend OCR proxy (same contract as web /api/scan-istemara)
      final endpoints = <String>[
        if (serverApiUrl != null && serverApiUrl.isNotEmpty) serverApiUrl,
        'https://mawjood-auto.vercel.app/api/scan-istemara',
      ];

      for (final endpoint in endpoints) {
        try {
          final response = await _dio.post(
            endpoint,
            data: {'imageBase64': base64Image, 'mimeType': mimeType},
            options: Options(
              headers: {'Content-Type': 'application/json'},
              validateStatus: (s) => s != null && s < 500,
            ),
          );
          if (response.statusCode == 200 && response.data != null) {
            final parsed = _coerceMap(response.data);
            if (parsed != null) return _parseResponse(parsed);
          }
        } catch (_) {}
      }

      // 2) Direct Gemini fallbacks
      if (geminiApiKey.isEmpty) {
        return IstemaraScanResult.failure(
          'OCR unavailable: configure GEMINI_API_KEY or server API',
        );
      }

      for (final model in _geminiModels) {
        try {
          final geminiUrl =
              'https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$geminiApiKey';
          final geminiRes = await _dio.post(
            geminiUrl,
            data: {
              'contents': [
                {
                  'parts': [
                    {'text': _prompt},
                    {
                      'inlineData': {
                        'mimeType': mimeType,
                        'data': base64Image,
                      },
                    },
                  ],
                },
              ],
              'generationConfig': {
                'responseMimeType': 'application/json',
                'temperature': 0.1,
              },
            },
            options: Options(validateStatus: (s) => s != null && s < 500),
          );

          if (geminiRes.statusCode == 200 && geminiRes.data != null) {
            final text = geminiRes.data['candidates']?[0]?['content']?['parts']
                    ?[0]?['text']
                ?.toString();
            if (text != null && text.isNotEmpty) {
              final cleaned = text
                  .replaceAll(RegExp(r'```json|```'), '')
                  .trim();
              final decoded = jsonDecode(cleaned);
              final parsed = _coerceMap(decoded);
              if (parsed != null) return _parseResponse(parsed);
            }
          }
        } catch (_) {}
      }

      return IstemaraScanResult.failure('Could not read registration card');
    } catch (e) {
      return IstemaraScanResult.failure(e.toString());
    }
  }

  static Map<String, dynamic>? _coerceMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    if (data is String) {
      try {
        final decoded = jsonDecode(data);
        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      } catch (_) {}
    }
    return null;
  }

  static IstemaraScanResult _parseResponse(Map<String, dynamic> parsed) {
    // Nested shapes from proxy APIs
    final nested = parsed['data'] is Map
        ? Map<String, dynamic>.from(parsed['data'] as Map)
        : parsed;

    String detectedVin = (nested['vin'] ?? nested['chassis'] ?? '').toString();

    final vinMatch = RegExp(
      r'[A-HJ-NPR-Z0-9]{17}',
      caseSensitive: false,
    ).firstMatch(detectedVin);
    if (vinMatch != null) {
      detectedVin = vinMatch.group(0)!.toUpperCase();
    }

    detectedVin = detectedVin
        .toUpperCase()
        .replaceAll('I', '1')
        .replaceAll('O', '0')
        .replaceAll('Q', '0');

    final rawMake = (nested['make'] ?? '').toString().trim();
    final model = (nested['model'] ?? '').toString().trim();
    final year = (nested['year'] ?? '').toString().trim();

    String matchedMake = rawMake;
    for (final brandKey in CarData.brands.keys) {
      final brand = CarData.brands[brandKey]!;
      if (brandKey.toLowerCase() == rawMake.toLowerCase() ||
          brand.en.toLowerCase() == rawMake.toLowerCase()) {
        matchedMake = brandKey;
        break;
      }
    }

    final ok = detectedVin.length == 17 ||
        rawMake.isNotEmpty ||
        model.isNotEmpty;

    if (!ok) {
      return IstemaraScanResult.failure('No vehicle data detected');
    }

    return IstemaraScanResult(
      success: true,
      vin: detectedVin.length == 17 ? detectedVin : detectedVin,
      make: matchedMake,
      model: model,
      year: year,
    );
  }
}
