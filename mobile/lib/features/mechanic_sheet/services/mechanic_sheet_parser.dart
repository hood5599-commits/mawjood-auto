import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../../config/supabase_config.dart';
import '../../../data/car_data.dart';
import '../../../services/api_client.dart';
import '../models/mechanic_sheet_models.dart';

/// Real OCR + inventory matcher for mechanic sheets / agency quotations.
class MechanicSheetParser {
  MechanicSheetParser._();
  static final MechanicSheetParser instance = MechanicSheetParser._();

  static final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
    ),
  );

  static List<String> get _scanEndpoints {
    final urls = <String>[
      // Supabase Edge Function (CORS-friendly) — preferred for Flutter web.
      '${SupabaseConfig.url}/functions/v1/scan-mechanic-sheet',
      'https://mawjood-auto.vercel.app/api/scan-mechanic-sheet',
    ];
    return urls;
  }

  static String get _geminiApiKey {
    const fromDefine = String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');
    if (fromDefine.isNotEmpty) return fromDefine;
    try {
      final fromEnv = dotenv.env['GEMINI_API_KEY']?.trim() ??
          dotenv.env['VITE_GEMINI_API_KEY']?.trim() ??
          dotenv.env['REACT_APP_GEMINI_API_KEY']?.trim() ??
          '';
      return fromEnv;
    } catch (_) {
      return '';
    }
  }

  static const _geminiModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
  ];

  static const _ocrPrompt = '''
You are an automotive spare-parts OCR engine for Qatar (Arabic + English).
Analyze this mechanic workshop sheet, handwritten parts list, OR agency quotation.
Extract EVERY spare-part line. Expand abbreviations.
Detect handwritten exclusions like "without → Piston STD".
Respond ONLY with valid JSON:
{"items":[{"nameEn":"...","nameAr":"...","rawLine":"...","qty":1,"unitPrice":null,"searchTerms":["..."]}],"exclusions":[],"unrecognized":[],"notes":""}
Do not invent parts that are not on the sheet.
''';

  static const _stop = {
    'the', 'and', 'for', 'with', 'kit', 'set', 'part', 'parts', 'auto', 'car',
    'من', 'على', 'في', 'الى', 'إلى', 'قطع', 'قطعة', 'طقم',
  };

  Future<MechanicParseResult> parseSheet({
    required Uint8List imageBytes,
    required String vehicleMake,
    required String vehicleModel,
    required String vehicleYear,
    String mimeType = 'image/jpeg',
  }) async {
    if (imageBytes.isEmpty) {
      throw Exception('image_missing');
    }

    final ocr = await _scanOcr(imageBytes, mimeType);
    final items = (ocr['items'] as List?) ?? const [];
    final unrecognized = ((ocr['unrecognized'] as List?) ?? const [])
        .map((e) => e.toString())
        .toList();
    final exclusions = ((ocr['exclusions'] as List?) ?? const [])
        .map((e) => e.toString())
        .toList();
    final notes = ocr['notes']?.toString();

    if (items.isEmpty) {
      throw Exception('no_parts_detected');
    }

    final catalog = await _fetchCatalog(vehicleMake, vehicleModel, vehicleYear);
    final recognized = <MechanicRecognizedItem>[];

    for (var i = 0; i < items.length; i++) {
      final raw = items[i];
      if (raw is! Map) continue;
      final map = Map<String, dynamic>.from(raw);
      final nameEn = (map['nameEn'] ?? map['name'] ?? 'Unknown').toString();
      final nameAr = (map['nameAr'] ?? nameEn).toString();
      final rawLine = (map['rawLine'] ?? nameEn).toString();
      final qty = int.tryParse('${map['qty']}') ?? 1;
      final unitPrice = double.tryParse('${map['unitPrice']}');
      final searchTerms = ((map['searchTerms'] as List?) ?? const [])
          .map((e) => e.toString())
          .toList();

      final ranked = catalog
          .map((p) => MapEntry(p, _score(p, nameEn, nameAr, rawLine, searchTerms)))
          .where((e) => e.value >= 0.28)
          .toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      Map<String, dynamic>? oemRow;
      Map<String, dynamic>? afterRow;
      for (final e in ranked) {
        if (_isOem(e.key) && oemRow == null) oemRow = e.key;
        if (!_isOem(e.key) && afterRow == null) afterRow = e.key;
      }
      if (oemRow == null && afterRow == null && ranked.isNotEmpty) {
        final top = ranked.first.key;
        if (_isOem(top)) {
          oemRow = top;
        } else {
          afterRow = top;
        }
      }

      final oem = _toOption(
        oemRow,
        MechanicPartQuality.oem,
        unitPrice,
      );
      final after = _toOption(
        afterRow,
        MechanicPartQuality.aftermarket,
        unitPrice,
        oemPrice: oem.isAvailable ? oem.price : null,
      );

      recognized.add(
        MechanicRecognizedItem(
          id: (map['id'] ?? 'ocr_$i').toString(),
          nameAr: nameAr,
          nameEn: (oemRow ?? afterRow)?['name']?.toString() ?? nameEn,
          rawLine: rawLine,
          oem: oem,
          aftermarket: after,
          qty: qty < 1 ? 1 : qty,
        ),
      );
    }

    final unavailableNotes = recognized
        .where((r) => !r.hasAnyAvailable)
        .map((r) => '${r.nameAr} — غير متوفرة')
        .toList();

    return MechanicParseResult(
      recognized: recognized,
      unrecognizedLines: [...unrecognized, ...unavailableNotes],
      exclusions: exclusions,
      notes: notes ??
          'Matched against $vehicleMake $vehicleModel $vehicleYear',
    );
  }

  Future<Map<String, dynamic>> _scanOcr(
    Uint8List bytes,
    String mimeType,
  ) async {
    final b64 = base64Encode(bytes);
    Object? lastError;

    for (final endpoint in _scanEndpoints) {
      try {
        final isSupabaseFn = endpoint.contains('/functions/v1/');
        final response = await _dio.post(
          endpoint,
          data: {'imageBase64': b64, 'mimeType': mimeType},
          options: Options(
            headers: {
              'Content-Type': 'application/json',
              if (isSupabaseFn) ...{
                'apikey': SupabaseConfig.apiKey,
                'Authorization': 'Bearer ${SupabaseConfig.apiKey}',
              },
            },
            validateStatus: (s) => s != null && s < 500,
          ),
        );
        if (response.statusCode == 200 && response.data is Map) {
          return Map<String, dynamic>.from(response.data as Map);
        }
        lastError = response.data;
      } catch (e) {
        lastError = e;
      }
    }

    // Direct Gemini fallback (avoids CORS / undeployed API during local web).
    final apiKey = _geminiApiKey;
    if (apiKey.isNotEmpty) {
      for (final model in _geminiModels) {
        try {
          final geminiUrl =
              'https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey';
          final geminiRes = await _dio.post(
            geminiUrl,
            data: {
              'contents': [
                {
                  'parts': [
                    {'text': _ocrPrompt},
                    {
                      'inlineData': {
                        'mimeType': mimeType,
                        'data': b64,
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
              final cleaned =
                  text.replaceAll(RegExp(r'```json|```'), '').trim();
              final decoded = jsonDecode(cleaned);
              if (decoded is Map) {
                return Map<String, dynamic>.from(decoded);
              }
            }
          }
          lastError = geminiRes.data;
        } catch (e) {
          lastError = e;
        }
      }
    }

    throw Exception(
      'ocr_failed: $lastError '
      '(deploy /api/scan-mechanic-sheet with CORS, or pass --dart-define=GEMINI_API_KEY=...)',
    );
  }

  Future<List<Map<String, dynamic>>> _fetchCatalog(
    String make,
    String model,
    String year,
  ) async {
    final makeEn = CarData.brands[make]?.en ?? make;
    final makes = <String>{make, makeEn}.where((m) => m.trim().isNotEmpty);

    // Broad fetch by make, then filter model/year client-side.
    final orParts = makes.map((m) => 'make.ilike.*$m*').join(',');
    final path =
        '/parts?or=($orParts)&select=id,name,make,model,year,price,stock,part_number,part_type,part_condition,warranty,image_url,category&limit=800';

    try {
      final res = await ApiClient().get(path);
      if (res.statusCode != 200 || res.data is! List) return [];
      final list = (res.data as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .where((p) {
            final okModel = _modelMatch('${p['model'] ?? ''}', model);
            final okYear = _yearMatch('${p['year'] ?? ''}', year);
            return okModel && okYear;
          })
          .toList();

      // Fallback: if vehicle-specific empty, still search within make only.
      if (list.isEmpty) {
        return (res.data as List)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      return list;
    } catch (_) {
      // Direct REST fallback
      try {
        final url = '${SupabaseConfig.restUrl}$path';
        final res = await _dio.get(
          url,
          options: Options(headers: SupabaseConfig.defaultHeaders),
        );
        if (res.data is! List) return [];
        return (res.data as List)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      } catch (_) {
        return [];
      }
    }
  }

  MechanicPartOption _toOption(
    Map<String, dynamic>? row,
    MechanicPartQuality quality,
    double? fallbackPrice, {
    double? oemPrice,
  }) {
    if (row == null) return MechanicPartOption.unavailable(quality);
    final stock = int.tryParse('${row['stock']}') ?? 0;
    final priceRaw = double.tryParse('${row['price']}') ?? 0;
    final price = priceRaw > 0 ? priceRaw : (fallbackPrice ?? 0);
    final oem = quality == MechanicPartQuality.oem;
    return MechanicPartOption(
      quality: quality,
      labelAr: oem ? 'أصلي وكالة' : 'تجاري معتمد / بديل أصلي',
      labelEn: oem ? 'OEM Genuine' : 'Certified aftermarket',
      price: price,
      partNumber: row['part_number']?.toString(),
      warrantyAr: row['warranty']?.toString() ?? (oem ? 'ضمان وكالة' : 'ضمان معتمد'),
      warrantyEn: row['warranty']?.toString() ?? (oem ? 'OEM warranty' : 'Certified warranty'),
      savingsVsOem: (!oem && oemPrice != null && oemPrice > price && price > 0)
          ? oemPrice - price
          : null,
      isAvailable: stock > 0,
      stock: stock,
      catalogPartId: row['id']?.toString(),
      catalogName: row['name']?.toString(),
      imageUrl: row['image_url']?.toString(),
    );
  }

  bool _isOem(Map<String, dynamic> row) {
    final blob =
        '${row['part_type'] ?? ''} ${row['part_condition'] ?? ''}'.toLowerCase();
    return RegExp(r'genuine|oem|original|أصلي|وكالة').hasMatch(blob);
  }

  double _score(
    Map<String, dynamic> part,
    String nameEn,
    String nameAr,
    String rawLine,
    List<String> searchTerms,
  ) {
    final hay = _norm([
      part['name'],
      part['category'],
      part['part_number'],
      part['part_type'],
    ].whereType<Object>().join(' '));
    final needle = _tokens([nameEn, nameAr, rawLine, ...searchTerms].join(' '));
    if (needle.isEmpty) return 0;
    var hits = 0;
    for (final t in needle) {
      if (hay.contains(t)) hits++;
    }
    return hits / needle.length + (hits >= 2 ? 0.15 : 0);
  }

  String _norm(String s) => s
      .toLowerCase()
      .replaceAll(RegExp(r'[^\w\u0600-\u06FF\s]+'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();

  List<String> _tokens(String s) => _norm(s)
      .split(' ')
      .where((t) => t.length > 1 && !_stop.contains(t))
      .toList();

  static const _modelAliases = <List<String>>[
    ['patrol', 'باترول', 'فتك'],
    ['camry', 'كامري'],
    ['corolla', 'كورولا'],
    ['land cruiser', 'landcruiser', 'لاندكروزر', 'لاند كروزر'],
    ['elantra', 'النترا', 'إلنترا'],
    ['sonata', 'سوناتا'],
    ['optima', 'k5', 'أوبتيما', 'اوبتيما'],
    ['taurus', 'تورس', 'توروس'],
    ['tahoe', 'تاهو'],
    ['altima', 'التيما', 'ألتيما'],
    ['accord', 'اكورد', 'أكورد'],
    ['6', 'مازدا 6', 'mazda 6'],
  ];

  bool _modelMatch(String partModel, String target) {
    if (partModel.isEmpty || target.isEmpty) return true;
    final a = _norm(partModel);
    final b = _norm(target);
    if (a.contains(b) || b.contains(a)) return true;
    for (final list in _modelAliases) {
      final hitTarget = list.any((x) => b.contains(_norm(x)));
      final hitPart = list.any((x) => a.contains(_norm(x)));
      if (hitTarget && hitPart) return true;
    }
    return false;
  }

  bool _yearMatch(String partYear, String target) {
    if (partYear.isEmpty || target.isEmpty) return true;
    if (partYear.contains(target)) return true;
    if (partYear.contains('-')) {
      final parts = partYear.split('-');
      if (parts.length == 2) {
        final a = int.tryParse(parts[0].trim());
        final b = int.tryParse(parts[1].trim());
        final t = int.tryParse(target.trim());
        if (a != null && b != null && t != null) {
          return t >= (a < b ? a : b) && t <= (a > b ? a : b);
        }
      }
    }
    return partYear == target;
  }
}
