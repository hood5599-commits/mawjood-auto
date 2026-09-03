class CategoryTree {
  static const Map<String, List<String>> fullCategoryTree = {
    'Belt Drive': ['Belt', 'Belt Removal / Installation Tool', 'Belt Tensioner', 'Belt Tensioner Bolt', 'Idler Pulley'],
    'Body & Lamp Assembly': ['Air Deflector', 'Antenna', 'Bumper Cover', 'Bumper Insert', 'Fender', 'Fog / Driving Lamp Assembly', 'Grille', 'Headlamp Assembly', 'Hood', 'Outside Mirror Glass', 'Radiator Support', 'Tail Lamp Assembly', 'Trunk Lock Actuator'],
    'Brake & Wheel Hub': ['ABS Control Module', 'ABS Wheel Speed Sensor', 'Brake Bleeder Screw', 'Brake Fluid', 'Brake Hose', 'Brake Pad', 'Caliper', 'Master Cylinder', 'Parking Brake Shoe', 'Power Brake Booster', 'Rotor', 'Wheel Bearing & Hub'],
    'Cooling System': ['Coolant / Antifreeze', 'Coolant Hose / Pipe', 'Coolant Reservoir', 'Radiator', 'Radiator Cap', 'Radiator Fan Assembly', 'Temperature Sender / Sensor', 'Thermostat', 'Water Pump'],
    'Drivetrain': ['Axle Shaft Seal', 'CV Axle', 'CV Joint Boot', 'Differential Carrier', 'Drive Shaft', 'Gear Oil'],
    'Electrical': ['Alternator / Generator', 'Battery', 'Engine Control Module (ECM Computer)', 'Fuse', 'Horn', 'Speed Sensor', 'Starter Motor'],
    'Electrical-Bulb & Socket': ['Brake Light Bulb', 'Fog / Driving Lamp Bulb', 'Headlamp Bulb', 'Tail Lamp Bulb', 'Turn Signal Lamp Bulb'],
    'Electrical-Connector': ['ABS Wheel Speed Sensor Connector', 'Brake Light Switch Connector', 'Camshaft Position Sensor Connector', 'Crankshaft Position Sensor Connector', 'Fuel Injector Connector', 'Ignition Coil Connector'],
    'Electrical-Switch & Relay': ['A/C System Relay', 'Blower Motor Relay', 'Door Lock Switch', 'Fuel Pump / Circuit Opening Relay', 'Headlamp Switch', 'Ignition Starter Switch', 'Power Window Switch', 'Turn Signal Switch'],
    'Engine': ['Camshaft', 'Connecting Rod', 'Crankshaft', 'Cylinder Head', 'Cylinder Head Gasket', 'Engine Block Heater', 'Exhaust Valve', 'Harmonic Balancer', 'Intake Manifold', 'Intake Valve', 'Motor Mount', 'Oil Cooler', 'Oil Filter', 'Oil Pan', 'Oil Pump', 'Piston', 'Piston Ring', 'Rocker Arm', 'Timing Chain', 'Valve Cover', 'Variable Valve Timing (VVT) Solenoid / Actuator'],
    'Exhaust & Emission': ['Catalytic Converter', 'Exhaust Header Gasket', 'Exhaust Manifold', 'Mass Air Flow (MAF) Sensor', 'Oxygen (O2) Sensor', 'Vapor Canister Purge Valve / Solenoid'],
    'Fuel & Air': ['Air Filter', 'Fuel Injection Pressure Sensor', 'Fuel Injector', 'Fuel Line / Hose', 'Fuel Pump & Housing Assembly', 'Fuel Tank Cap', 'Throttle Body'],
    'Heat & Air Conditioning': ['A/C Compressor', 'A/C Condenser', 'A/C Evaporator Core', 'A/C Expansion Valve', 'Ambient Air Temperature Sensor', 'Blower Motor', 'Cabin Air Filter', 'Heater Core'],
    'Ignition': ['Camshaft Position Sensor', 'Crankshaft Position Sensor', 'Ignition Coil', 'Spark Plug', 'Spark Plug Wire'],
    'Interior': ['Accelerator Pedal Position Sensor', 'Air Bag Clockspring', 'Floor Mat', 'Inside Door Handle', 'Steering Wheel', 'Window Motor', 'Window Regulator'],
    'Steering': ['Power Steering Fluid', 'Rack and Pinion', 'Steering Wheel Position Sensor', 'Tie Rod End'],
    'Suspension': ['Alignment Bolt / Camber Plate', 'Coil Spring', 'Control Arm', 'Control Arm Bushing', 'Shock / Strut', 'Shock / Strut Mount', 'Sway Bar Bushing', 'Sway Bar Link'],
    'Transmission-Automatic': ['Automatic Transmission Control Unit (TCU)', 'Clutch Housing', 'Filter', 'Flexplate', 'Fluid Pan', 'Torque Converter', 'Transmission Fluid', 'Transmission Mount', 'Valve Body'],
    'Transmission-Manual': ['Clutch Kit', 'Clutch Master Cylinder', 'Clutch Slave Cylinder', 'Flywheel', 'Manual Transmission Fluid', 'Shift Fork', 'Synchro Ring'],
    'Wheel': ['Lug Nut', 'Lug Stud', 'Tire Pressure Monitoring System (TPMS) Sensor', 'Wheel'],
    'Wiper & Washer': ['Washer Fluid Reservoir', 'Washer Pump', 'Wiper Arm', 'Wiper Blade', 'Wiper Motor'],
  };

  static List<String> get categories => fullCategoryTree.keys.toList();
}
