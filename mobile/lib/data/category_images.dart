/// Maps part category names to local asset image paths (from public/images).
class CategoryImages {
  static const Map<String, String> byCategory = {
    'Brake & Wheel Hub': 'assets/images/brakes.png.jpg',
    'Suspension': 'assets/images/Suspension.jpg',
    'Engine': 'assets/images/Engine.jpg',
    'Cooling System': 'assets/images/Cooling System.jpg',
    'Heat & Air Conditioning': 'assets/images/Heat & Air Conditioning.jpg',
    'Ignition': 'assets/images/Ignition.jpg',
    'Fuel & Air': 'assets/images/Fuel & Air.jpg',
    'Electrical': 'assets/images/Electrical.jpg',
    'Body & Lamp Assembly': 'assets/images/Body & Lamp Assembly.jpg',
    'Steering': 'assets/images/Steering.jpg',
    'Drivetrain': 'assets/images/Drivetrain.jpg',
    'Transmission-Automatic': 'assets/images/Transmission-Automatic.jpg',
    'Transmission-Manual': 'assets/images/Transmission-Automatic.jpg',
    'Wheel': 'assets/images/wheels.jpg',
    'Wiper & Washer': 'assets/images/Wiper & Washer.jpg',
    'Belt Drive': 'assets/images/Belt Drive.jpg',
    'Exhaust & Emission': 'assets/images/Exhaust & Emission.jpg',
  };

  static String? assetFor(String category) => byCategory[category];
}
