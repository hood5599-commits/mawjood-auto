import 'dart:io' show Platform;

String detectPlatformName() {
  if (Platform.isIOS) return 'ios';
  if (Platform.isAndroid) return 'android';
  return 'desktop';
}

String detectDeviceOs() => Platform.operatingSystemVersion;
