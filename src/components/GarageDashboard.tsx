import React, { useState, useEffect } from 'react';
import { ExcelPartUploader } from './ExcelPartUploader';
import { Toast } from './Toast';
import { AITranslatedText } from './AITranslatedText';

interface GarageProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onSuccess: () => void;
}

const FULL_CATEGORY_TREE: Record<string, string[]> = {
  "Belt Drive": [
    "Belt", "Belt Removal / Installation Tool", "Belt Tensioner", "Belt Tensioner Bolt", "Idler Pulley"
  ],
  "Body & Lamp Assembly": [
    "Air Deflector", "Antenna", "Antenna Cable", "Bumper Cover", "Bumper Cover Retainer", "Bumper Cover Support",
    "Bumper Energy Absorber", "Bumper Insert", "Bumper Reinforcement", "Bumper Trim / Molding",
    "Convertible Top Hydraulic Pump Fluid", "Door Hinge", "Door Hinge Pin & Bushing Kit", "Door Latch Striker Plate",
    "Door Lock Actuator", "Door Lock Rod Grommet", "Fender", "Fender Vent", "Fog / Driving Lamp Assembly",
    "Fog / Driving Lamp Bezel", "Grille", "Grille Molding", "Grille Retainer / Clip", "Headlamp Assembly",
    "Headlamp Level Sensor", "High Mount Brake Light", "Hood", "Hood Bumper", "Hood Insulator Retainer / Clip",
    "Impact / Crash Sensor", "Inner Fender", "Key Blank", "License Plate Bracket", "License Plate Retainer / Clip",
    "Lift Support", "Molding Retainer / Clip", "Outside Door Handle", "Outside Door Handle Reinforcement",
    "Outside Mirror & Glass Assembly", "Outside Mirror Glass", "Park Assist (PAS) Camera", "Radiator Support",
    "Side Marker Lamp Assembly", "Splash Shield Retainer / Clip", "Tail Lamp Assembly", "Tailgate Lock",
    "Touch-Up Paint", "Tow Hook Cover", "Trailer Hitch", "Trailer Hitch Ball & Mount Kit",
    "Truck Bed Mat / Liner Retainer", "Trunk Latch", "Trunk Lock Actuator", "Valance Panel"
  ],
  "Brake & Wheel Hub": [
    "ABS Control Module", "ABS Control Module Insulator", "ABS Control Module Nut / Bolt", "ABS Tone Ring",
    "ABS Wheel Speed Sensor", "Banjo Bolt / Washer", "Brake Bleeder Screw", "Brake Fluid", "Brake Hose",
    "Brake Pad", "Brake Pedal Position Sensor", "Caliper", "Caliper Bracket Bolt", "Caliper Piston",
    "Caliper Piston Seal", "Caliper Repair Kit", "Caliper Slide Pin", "Caliper Slide Pin Boot / Bushing",
    "Disc Brake Hardware Kit", "Master Cylinder", "Master Cylinder Cap", "Master Cylinder Reservoir",
    "Parking Brake Adjuster", "Parking Brake Cable", "Parking Brake Cable Bracket Nut/Bolt",
    "Parking Brake Hardware Kit", "Parking Brake Lever", "Parking Brake Shoe", "Power Brake Booster",
    "Power Brake Booster Check Valve", "Power Brake Booster Sensor", "Rotor", "Rotor & Brake Pad Kit",
    "Rotor Retaining Screw", "Spindle Nut", "Vacuum Hose", "Vacuum Pump", "Wheel Bearing & Hub",
    "Wheel Hub Mounting Bolt", "Wheel Seal"
  ],
  "Cooling System": [
    "Coolant / Antifreeze", "Coolant Air Bleed Hose / Pipe", "Coolant Air Bleeder", "Coolant Filler Neck",
    "Coolant Hose / Pipe", "Coolant Hose / Pipe Seal", "Coolant Reservoir", "Coolant Reservoir Cap",
    "Coolant Water Crossover Mounting Set", "Cooling System Tester Adapter", "Hose Clamp", "Radiator",
    "Radiator Cap", "Radiator Fan Assembly", "Radiator Fan Blade", "Radiator Fan Motor", "Radiator Hose",
    "Radiator Upper Air Baffle Retainer / Clip", "Temperature Sender / Sensor", "Thermostat",
    "Thermostat / Thermostat Housing / Water Outlet Seal", "Water Inlet Gasket", "Water Pump",
    "Water Pump Gasket", "Water Pump Seal / O-Ring"
  ],
  "Drivetrain": [
    "Axle Shaft Seal", "CV Axle", "CV Joint Boot", "CV Joint Boot Band", "Differential Carrier",
    "Differential Carrier Bearing / Race", "Differential Carrier Bushing", "Differential Carrier Shim",
    "Differential Cover Bolt", "Differential Cover Gasket", "Differential Crush Sleeve", "Differential Fill / Drain Plug",
    "Differential Gear Installation Kit", "Differential Housing Bolt", "Differential Pinion Bearing / Race",
    "Differential Pinion Bearing Baffle", "Differential Pinion Flange", "Differential Pinion Nut",
    "Differential Pinion Repair Sleeve", "Differential Pinion Seal", "Differential Pinion Shim",
    "Differential Rebuild Kit", "Differential Ring Gear Bolt", "Differential Ring and Pinion",
    "Differential Seal", "Differential Washer", "Drive Shaft", "Drive Shaft Bolt",
    "Drive Shaft Center Support Bearing", "Drive Shaft Center Support Bearing Bracket", "Drive Shaft Flex Joint",
    "Drive Shaft Seal", "Drive Shaft Slip Yoke Seal", "Gear Oil", "Gear Oil Additive",
    "Transfer Case Main Shaft Pilot Bearing"
  ],
  "Electrical": [
    "Alternator / Generator", "Anti-Theft Control Module", "Automatic Headlamp Sensor", "Battery",
    "Battery Cable", "Battery Current Sensor", "Battery Terminal Bolt / Nut", "Body Control Module (BCM)",
    "Circuit Breaker", "Engine Control Module (ECM Computer)", "Fuse", "HID Lighting Ballast", "Horn",
    "Keyless Entry Module / Receiver", "Keyless Entry Remote", "Keyless Entry Remote Case", "Parking Aid Sensor",
    "Speed Sensor", "Speed Sensor Seal", "Starter Bolt", "Starter Motor", "Starter Motor Heat Shield", "Yaw Sensor"
  ],
  "Electrical-Bulb & Socket": [
    "Back Up / Reverse Lamp Bulb", "Brake Light Bulb", "Daytime Running Light Bulb", "Dome Light Bulb",
    "Fog / Driving Lamp Bulb", "Fog / Driving Lamp Socket", "Headlamp Bulb", "Headlamp Socket",
    "LED Bulb Adapter", "License Plate Lamp Bulb", "Parking Brake Warning Light Bulb", "Parking Lamp Bulb",
    "Side Marker Lamp Socket", "Side Marker Light Bulb", "Step / Courtesy Light Bulb", "Tail Lamp Bulb",
    "Trunk / Cargo Area Light Bulb", "Turn Signal Lamp Bulb", "Turn Signal Lamp Socket"
  ],
  "Electrical-Connector": [
    "A/C Compressor Clutch Coil Connector", "A/C Refrigerant Pressure Switch Connector", "ABS Wheel Speed Sensor Connector",
    "AIR / Smog Pump Relay", "Accelerator Pedal Position Sensor Connector", "Air Bag Clockspring Connector",
    "Air Injection Relay Connector", "Ambient Air Temperature Sensor Connector", "Blower Motor Control Module / Resistor Connector",
    "Body Wiring Harness / Connector", "Brake Light Switch Connector", "Brake Pedal Connector",
    "Camshaft Position Sensor Connector", "Crankshaft Position Sensor Connector", "Cylinder Deactivation Solenoid Connector",
    "Door Lock Actuator Connector", "Fog / Driving Lamp Connector", "Fuel Injection Pressure Sensor Connector",
    "Fuel Injector Connector", "Fuel Sending Unit Connector", "Fuel Tank Pressure Sensor Connector",
    "Ignition Coil Connector", "Ignition Control Module (ICM) Connector", "Ignition Starter Switch Connector",
    "Knock / Detonation Sensor Connector", "Manifold Pressure (MAP) Sensor Connector", "Oil Pressure Sender / Switch Connector",
    "Park Assist (PAS) Camera Connector", "Parking Aid Sensor Connector", "Power Brake Booster Connector",
    "Power Window Switch Connector", "Radiator Fan Motor Connector", "Radio Connector", "Side Marker Lamp Connector",
    "Speed Sensor Connector", "Starter Solenoid Connector", "Supercharger Bypass Solenoid / Valve Connector",
    "Temperature Sender / Sensor Connector", "Throttle Control Actuator Connector", "Throttle Position Sensor (TPS) Connector",
    "Trailer Connector", "Turn Signal Switch Connector", "Vacuum Pump Connector", "Vapor Canister Connector",
    "Vapor Canister Purge Valve / Solenoid Connector", "Vapor Canister Vent Valve / Solenoid Connector",
    "Variable Valve Timing (VVT) Solenoid Connector", "Window Defroster Motor Connector", "Wiper / Washer Switch Connector",
    "Wiper Motor Connector"
  ],
  "Electrical-Switch & Relay": [
    "A/C Compressor Relay", "A/C Refrigerant Pressure Switch", "A/C System Relay", "ABS Relay", "AIR / Smog Pump Relay",
    "Accelerator Relay", "Accessory Delay Relay", "Accessory Power Relay", "Air Injection Relay", "Blower Motor Relay",
    "Clutch Pedal Position / Starter Safety Switch", "Cornering Lamp Relay", "Cruise Control Switch",
    "Daytime Running Light Relay", "Dimmer Switch", "Door Lock Switch", "Driver Information Display Switch",
    "Driving Light Relay", "Engine Control Module Relay", "Fog / Driving Lamp Relay", "Fog / Driving Lamp Switch",
    "Fuel Pump / Circuit Opening Relay", "Headlamp Relay", "Headlamp Switch", "Horn Relay", "Ignition Relay",
    "Ignition Starter Switch", "Instrument Panel Dimmer Switch", "Neutral Safety Switch / Range Sensor",
    "Oil Pressure Sender / Switch", "Outside Mirror Switch", "Overdrive Switch", "Parking Brake Control Relay",
    "Parking Lamp Relay", "Power Seat Switch", "Power Window Switch", "Radiator Fan Relay", "Seat Heater Switch",
    "Steering Wheel Audio Control Switch", "Sunroof / Sunshade Switch", "Traction / Stability Control Switch",
    "Transmission-Automatic Fluid Pressure Switch", "Transmission-Automatic Manual Shift Shaft Position Switch",
    "Trunk Lid / Tailgate Release Switch", "Turn Signal Switch", "Vacuum Pump Relay", "Wiper / Washer Switch",
    "Wiper Motor Relay", "Wiring Relay"
  ],
  "Engine": [
    "Camshaft", "Camshaft Bearing", "Camshaft Bolt", "Camshaft Dowel Pin", "Camshaft Gear Installation Tool",
    "Camshaft Retainer / Thrust Plate", "Camshaft Seal", "Connecting Rod", "Connecting Rod Bearing",
    "Connecting Rod Bolt", "Conversion / Lower Gasket Set", "Crankshaft", "Crankshaft Main Bearing",
    "Crankshaft Main Bearing Cap Bolt", "Crankshaft Main Bearing Gasket", "Crankshaft Main Bearing Repair Sleeve",
    "Crankshaft Repair Sleeve", "Crankshaft Repair Sleeve Tool", "Crankshaft Seal", "Crankshaft Seal Cover",
    "Crankshaft Seal Cover Tool", "Crankshaft Seal Gasket", "Cylinder Deactivation Delete",
    "Cylinder Deactivation Delete Block-Off Plug", "Cylinder Deactivation Solenoid", "Cylinder Head",
    "Cylinder Head Alignment Dowel Pin", "Cylinder Head Bolt", "Cylinder Head Gasket", "Cylinder Head Gasket Set",
    "Cylinder Head Plug", "Cylinder Head Spacer Shim", "Cylinder Repair Sleeve", "Engine Block Heater",
    "Engine Kit Gasket Set", "Exhaust Valve", "Fuel Pump Camshaft Follower", "Harmonic Balancer",
    "Harmonic Balancer Bolt", "Harmonic Balancer Washer", "Intake Insulator", "Intake Manifold",
    "Intake Manifold Bolt", "Intake Manifold Cover", "Intake Manifold Gasket",
    "Intake Manifold Runner Control Valve / Solenoid", "Intake Valve", "Intake to Exhaust Gasket",
    "Motor Mount", "Motor Mount Bracket", "Motor Mount Bracket Bolt", "Motor Mount Kit", "Oil", "Oil Cooler",
    "Oil Cooler Adapter Seal", "Oil Cooler Gasket", "Oil Cooler Line", "Oil Cooler Line Connector",
    "Oil Cooler Mounting Kit", "Oil Cooler Seal", "Oil Dipstick / Tube", "Oil Dipstick / Tube Seal",
    "Oil Drain Plug", "Oil Drain Plug Gasket", "Oil Filler Cap", "Oil Filler Cap Gasket", "Oil Filler Tube",
    "Oil Filler Tube Grommet", "Oil Filter", "Oil Filter Adapter", "Oil Filter Adapter Gasket / O-Ring",
    "Oil Filter Bypass Valve", "Oil Filter Gasket", "Oil Filter Housing Seal", "Oil Filter Remote Mounting Kit",
    "Oil Galley Plug", "Oil Level Sensor", "Oil Level Sensor Gasket / O-Ring", "Oil Pan", "Oil Pan Bolt",
    "Oil Pan Cover", "Oil Pan Gasket", "Oil Pressure Filter", "Oil Pressure Relief Valve",
    "Oil Pressure Relief Valve Deflector", "Oil Pressure Relief Valve Plug", "Oil Pressure Relief Valve Spring",
    "Oil Pump", "Oil Pump Cover Bolt", "Oil Pump Drive Gear", "Oil Pump Gasket", "Oil Pump Pickup Tube / Screen",
    "Oil Pump Pickup Tube Bracket", "Oil Pump Pickup Tube O-Ring", "Oil Pump Seal", "Oil Strainer Gasket",
    "Oil Sump Plate", "Oil Sump Windage Tray", "Piston", "Piston Pin Retainer", "Piston Ring", "Push Rod",
    "Push Rod Guide Plate", "Rocker Arm", "Rocker Arm Bolt", "Rocker Arm Shaft Support", "Rocker Arm Stud",
    "Timing Cam Sprocket", "Timing Chain", "Timing Chain & Component Kit", "Timing Chain Cover Gasket",
    "Timing Chain Tensioner", "Timing Cover", "Timing Cover Gasket", "Timing Cover Repair Sleeve",
    "Timing Cover Seal", "Timing Crank Sprocket", "Turbocharger Gasket", "Valley Pan Cover", "Valve Cover",
    "Valve Cover Bolt / Screw", "Valve Cover Gasket", "Valve Cover Grommet", "Valve Guide", "Valve Lifter",
    "Valve Lifter Guide", "Valve Seat", "Valve Spring", "Valve Spring Retainer", "Valve Spring Retainer Keeper",
    "Valve Stem Seal", "Variable Valve Timing (VVT) Solenoid / Actuator",
    "Variable Valve Timing (VVT) Solenoid Gasket / Seal", "Variable Valve Timing (VVT) Sprocket",
    "Variable Valve Timing (VVT) Sprocket Bolt"
  ],
  "Exhaust & Emission": [
    "AIR / Smog Pump Check Valve", "Bolt / Spring", "Catalytic Converter", "Clamp", "Exhaust Header Gasket",
    "Exhaust Manifold", "Exhaust Manifold Gasket", "Exhaust Manifold Hardware",
    "Exhaust Manifold To Cylinder Head Repair Clamp", "Knock / Detonation Sensor", "Manifold Pressure (MAP) Sensor",
    "Mass Air Flow (MAF) Sensor", "Mass Air Flow (MAF) Sensor Gasket", "Oxygen (O2) Sensor", "Pipe Flange Gasket / Seal",
    "Positive Crankcase Ventilation (PCV) Hose", "Vapor Canister", "Vapor Canister Purge Valve / Solenoid",
    "Vapor Canister Purge Valve Hose", "Vapor Canister Vent Valve / Solenoid"
  ],
  "Fuel & Air": [
    "Air Cleaner Intake Hose", "Air Filter", "Air Filter Housing Grommet", "Air Intake / Charge Temperature Sensor",
    "Fuel Injection Pressure Sensor", "Fuel Injector", "Fuel Injector Clip", "Fuel Injector Seal / O-Ring",
    "Fuel Line / Hose", "Fuel Line Retainer", "Fuel Pressure Relief Valve Cap", "Fuel Pressure Sensor Cover",
    "Fuel Pump & Housing Assembly", "Fuel Pump Drive Module", "Fuel Pump Gasket / Seal", "Fuel Rail",
    "Fuel Rail Pressure Relief Valve", "Fuel Sending Unit", "Fuel Sending Unit O-Ring", "Fuel Tank Cap",
    "Fuel Tank Cap Tester Adapter", "Fuel Tank Cap Tether / Clip", "Fuel Tank Filler Neck", "Fuel Tank Lock Ring",
    "Fuel Tank Pressure Sensor", "Fuel Tank Strap", "Idle Relearn Tool", "Throttle Body", "Throttle Body Gasket",
    "Throttle Position Sensor (TPS)"
  ],
  "Heat & Air Conditioning": [
    "A/C Compressor", "A/C Compressor & Component Kit", "A/C Compressor Relief Valve", "A/C Condenser",
    "A/C Condenser Fan Motor", "A/C Evaporator Core", "A/C Expansion Valve",
    "A/C Receiver Drier Desiccant Element", "A/C Refrigerant Hose / Line", "A/C Refrigerant Oil",
    "A/C Refrigerant Temperature Sensor", "A/C System O-Rings / Seals", "A/C System Service Valve / Core / Cap",
    "Ambient Air Temperature Sensor", "Blower Motor", "Blower Motor Control Module / Resistor",
    "Blower Motor Housing / Seal", "Cabin Air Filter", "Cabin Air Filter Retainer", "Climate Control Module",
    "Heater Air Door", "Heater Air Door Actuator", "Heater Core", "Heater Hose"
  ],
  "Ignition": [
    "Camshaft Position Sensor", "Camshaft Position Sensor Seal", "Crankshaft Position Sensor", "Ignition Coil",
    "Ignition Coil Mounting Bracket", "Ignition Coil Wire", "Ignition Control Module (ICM)", "Ignition Lock Cylinder",
    "Ignition Lock Housing", "Spark Plug", "Spark Plug Wire"
  ],
  "Interior": [
    "Accelerator Pedal Position Sensor", "Accessory Power Outlet", "Accessory Power Outlet Cover",
    "Air Bag Clockspring", "Brake Pedal", "Brake Pedal Pad", "Cargo Area Mat", "Clutch Pedal Bushing",
    "Clutch Pedal Pad", "Dash Board Cover", "Door Panel Retainer / Clip", "Floor Mat", "Flooring", "Gauge Panel",
    "Gauge Set", "Inside Door Handle", "Inside Rear View Mirror", "Microphone", "Occupant Detection Sensor",
    "Radio Installation Kit", "Radio Module Interface", "Seat Belt Guide / Clip", "Seat Cover", "Speaker",
    "Speaker Bezel", "Speaker Bracket", "Steering Wheel", "Sunroof Motor", "Transmission Shift Handle",
    "Transmission Shift Lever", "USB / AUX Port", "Window Motor", "Window Regulator", "Window Regulator & Motor Assembly"
  ],
  "Literature": [
    "Repair Manual"
  ],
  "Steering": [
    "Power Steering Fluid", "Rack and Pinion", "Rack and Pinion Bellow", "Rack and Pinion Bellow Clamp",
    "Rack and Pinion Belt Kit", "Rack and Pinion O-Ring", "Steering Column Switch Housing", "Steering Gear Bolt",
    "Steering Wheel Position Sensor", "Tie Rod End", "Tie Rod Nut"
  ],
  "Suspension": [
    "Alignment Bolt / Camber Plate", "Bump Stop", "Coil Spring", "Coil Spring Seat / Insulator", "Control Arm",
    "Control Arm Anchor Bolt", "Control Arm Bushing", "Control Arm Nut", "Control Arm Washer", "Front End Kit",
    "Ride Height Sensor", "Shock / Strut", "Shock / Strut & Coil Spring Assembly", "Shock / Strut Bearing",
    "Shock / Strut Bellow", "Shock / Strut Bolt", "Shock / Strut Mount", "Shock / Strut Mount Bolt",
    "Shock Mount Washer", "Strut Mount Nut", "Strut Mount Retainer", "Strut Mount Washer", "Strut Rod Lock Nut",
    "Subframe Bushing", "Subframe Mount Bolt", "Sway Bar Bracket", "Sway Bar Bushing", "Sway Bar Link"
  ],
  "Transmission-Automatic": [
    "Automatic Transmission Control Unit (TCU)", "Boost Valve", "Bushing", "Bushing Kit", "Case", "Case Bushing",
    "Case Cover", "Case Vent", "Clutch Apply Plate", "Clutch Housing", "Clutch Housing Thrust Bearing",
    "Clutch Hub", "Clutch Pack Piston", "Clutch Pack Piston Dam / Seal", "Clutch Plate", "Clutch Plate Pack",
    "Clutch Plate Retaining Ring", "Clutch Plate and Housing Assembly", "Clutch Seal Ring", "Clutch Spring",
    "Components", "Detent Lever", "Extension Housing", "Extension Housing Bolt", "Extension Housing Bushing",
    "Extension Housing Gasket", "Extension Housing Seal", "Filter", "Flexplate", "Flexplate Mounting Bolt",
    "Fluid Cooler Line / Hose", "Fluid Cooler Line / Hose Connector", "Fluid Cooler Line / Hose Seal",
    "Fluid Cooler Line Clip", "Fluid Pan", "Fluid Pan Drain Plug", "Fluid Pan Gasket", "Fluid Pan Magnet",
    "Fluid Pump Bushing", "Fluid Pump Cover", "Fluid Pump Cover Bolt", "Fluid Pump O-Ring", "Fluid Pump Rotor",
    "Fluid Pump Seal", "Fluid Pump Slide", "Gasket Kit", "Input Carrier", "Manual Shaft Seal", "Manual Shift Shaft",
    "Manual Valve", "O-Rings & Seals", "Output Carrier", "Output Shaft Bearing", "Output Shaft Bushing",
    "Output Shaft Seal", "Parking Pawl", "Piston Kit", "Plug Adapter", "Pressure Regulator Valve", "Rebuild Kit",
    "Retaining Ring", "Sealing Rings", "Servo Piston", "Shift Improvement Kit", "Shift Shaft Seal", "Shift Solenoid",
    "Snap Ring", "Sprag", "Sun Gear", "Sun Gear Bearing", "Torque Converter", "Torque Converter Bolt",
    "Torque Converter Clutch Valve", "Torque Converter Hardware", "Torque Converter Housing Plug",
    "Torque Converter Shaft Seal", "Transmission Fluid", "Transmission Fluid Additive", "Transmission Mount",
    "Transmission Service Kit", "Turbine Shaft Fluid Seal Ring", "Turbine Shaft Seal", "Valve Body",
    "Valve Body Check Ball", "Valve Body Separator Plate"
  ],
  "Transmission-Manual": [
    "Bearing Retainer", "Case", "Clutch Alignment Tool", "Clutch Bellhousing", "Clutch Kit", "Clutch Master Cylinder",
    "Clutch Pilot Bearing", "Clutch Slave Cylinder", "Countershaft Bearing/Race", "Countershaft Gear",
    "Countershaft Gear Bearing", "Countershaft Gear Bearing Retainer", "Countershaft Gear Snap Ring",
    "Detent Mechanism", "Detent Plug", "Detent Roller", "Detent Spring", "Drive Axle Seal", "Fluid Pump",
    "Fluid Pump Inlet Pipe", "Fluid Temperature Sensor", "Flywheel", "Flywheel Bolt", "Gear", "Gear Bearing",
    "Gear Snap Ring", "Gear Spacer", "Input Shaft Bearing", "Input Shaft Repair Sleeve", "Input Shaft Seal",
    "Main / Output Shaft Bearing", "Main / Output Shaft Seal", "Manual Transmission Fluid", "Manual Transmission Seal",
    "Reverse Gear Shaft", "Reverse Idler Bearing", "Reverse Idler Gear", "Reverse Idler Shaft", "Shift Fork",
    "Shift Guide Detent Plate", "Shift Lever Bushing", "Shift Lever Collar", "Shift Rail Plate", "Shift Shaft",
    "Shift Shaft Pin", "Shift Shaft Seal", "Synchro Assembly", "Synchro Ring", "Synchro Spring", "Transmission Mount"
  ],
  "Wheel": [
    "Lug Nut", "Lug Nut & Lock Kit", "Lug Nut Installation Tool / Key", "Lug Nut Lock", "Lug Stud",
    "Tire Pressure Monitoring System (TPMS) Sensor", "Tire Pressure Monitoring System (TPMS) Stem / Service Kit",
    "Tire Valve Stem", "Wheel"
  ],
  "Wiper & Washer": [
    "Washer Fluid Reservoir", "Washer Fluid Reservoir Cap", "Washer Pump", "Washer Pump Grommet",
    "Wiper Arm Cover", "Wiper Arm Nut", "Wiper Blade", "Wiper Linkage / Transmission", "Wiper Motor"
  ]
};

export const GarageDashboard: React.FC<GarageProps> = ({ lang, carData, years, supabaseUrl, apiKey, session, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'inquiries' | 'custom_requests' | 'orders'>('add_part');

  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('1');
  
  const [partType, setPartType] = useState('مستعمل أصلي'); 
  const [partCondition, setPartCondition] = useState('نظيف'); 

  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');

  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  const [partImages, setPartImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewPartDetails, setPreviewPartDetails] = useState<any | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [selectedCustomRequest, setSelectedCustomRequest] = useState<any | null>(null);

  const [quotePrice, setQuotePrice] = useState('');
  const [quotePartType, setQuotePartType] = useState('مستعمل أصلي');
  const [quoteCondition, setQuoteCondition] = useState('نظيف');
  const [quoteWarranty, setQuoteWarranty] = useState('ضمان تجربة 3 أيام');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const [returnDays, setReturnDays] = useState<number>(3);
  const [warrantyDays, setWarrantyDays] = useState<number>(14);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';
  const garageName = session?.user_metadata?.garage_name || session?.garage_name || 'كراج معتمد';
  const isRtl = lang === 'ar';

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
    fetchMyInquiries();
    fetchCustomRequests();
  }, [userId]);

  const handlePartNameChange = (name: string) => {
    setPartName(name);
    const lower = name.toLowerCase();

    for (const [mainCat, subCats] of Object.entries(FULL_CATEGORY_TREE)) {
      for (const subCat of subCats) {
        if (lower.includes(subCat.toLowerCase())) {
          setMainCategory(mainCat);
          setSubCategory(subCat);
          return;
        }
      }
    }
  };

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      try {
        const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': file.type },
          body: file
        });

        if (response.ok) {
          const publicUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`;
          uploadedUrls.push(publicUrl);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setPartImages((prev) => [...prev, ...uploadedUrls]);
    setUploadingImages(false);
  };

  const removeImage = (indexToRemove: number) => {
    setPartImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?user_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyParts(await response.json());
    } catch (error) {}
  };

  const fetchMyOrders = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/orders?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyOrders(await response.json());
    } catch (error) {}
  };

  const fetchMyInquiries = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyInquiries(await response.json());
    } catch (error) {}
  };

  const fetchCustomRequests = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/custom_part_requests?order=id.desc`, {
        headers: { 
          'apikey': apiKey, 
          'Authorization': `Bearer ${session?.token || apiKey}` 
        }
      });
      if (response.ok) {
        setCustomRequests(await response.json());
      }
    } catch (error) {
      console.error("خطأ في جلب طلبات التسعير:", error);
    }
  };

  const handlePublishSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'garage_unknown') return alert(isRtl ? 'يرجى تسجيل الدخول مجدداً' : 'Please login again');

    const fullCategoryPath = [mainCategory, subCategory].filter(Boolean).join(' > ');

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;

      const payload = {
        name: partName,
        part_number: partNumber.trim() || null,
        price: parseFloat(partPrice),
        stock: parseInt(partStock) || 1,
        part_type: partType,
        part_condition: partCondition,
        category: fullCategoryPath || 'عام',
        make: partMake,
        model: partModel,
        year: partYear,
        engine: partEngine || (isRtl ? 'عام' : 'General'),
        image_url: partImages[0] || 'https://via.placeholder.com/400',
        additional_images: partImages, 
        user_id: userId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(isRtl ? 'تم حفظ القطعة بنجاح' : 'Part saved successfully');
        resetForm();
        fetchMyParts();
        onSuccess();
        setActiveTab('my_parts');
      }
    } catch (error) {}
  };

  const handleSendCustomQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomRequest || !quotePrice) return;

    setSubmittingQuote(true);
    try {
      const response = await fetch(`${supabaseUrl}/garage_quotes`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: selectedCustomRequest.id,
          garage_id: String(userId),
          garage_name: garageName,
          price: parseFloat(quotePrice),
          part_type: quotePartType,
          part_condition: quoteCondition,
          warranty: quoteWarranty,
          garage_notes: quoteNotes
        })
      });

      if (response.ok) {
        await fetch(`${supabaseUrl}/custom_part_requests?id=eq.${selectedCustomRequest.id}`, {
          method: 'PATCH',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offers_received' })
        });

        alert(isRtl ? 'تم إرسال عرض السعر للعميل بنجاح' : 'Quote sent successfully');
        setSelectedCustomRequest(null);
        setQuotePrice('');
        setQuoteNotes('');
        fetchCustomRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleConfirmFitment = async () => {
    if (!selectedInquiry) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed_compatible',
          return_days: returnDays,
          warranty_days: warrantyDays
        })
      });

      if (response.ok) {
        alert(isRtl ? 'تم تأكيد التوافق بنجاح' : 'Fitment confirmed');
        setSelectedInquiry(null);
        fetchMyInquiries();
      }
    } catch (error) {}
  };

  const handleRejectFitment = async (inquiryId: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد أن القطعة لا تركب على سيارة العميل؟' : 'Are you sure this part does not fit?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${inquiryId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) fetchMyInquiries();
    } catch (error) {}
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(isRtl ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated');
        fetchMyOrders();
      }
    } catch (error) {}
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure you want to delete this part?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleEdit = (part: any) => {
    setPartName(part.name); setPartNumber(part.part_number || ''); setPartPrice(part.price ? part.price.toString() : ''); 
    setPartStock((part.stock ?? 1).toString()); setPartType(part.part_type || 'مستعمل أصلي'); setPartCondition(part.part_condition || 'نظيف');
    setPartMake(part.make); setPartModel(part.model || ''); setPartYear(part.year); setPartEngine(part.engine || ''); 
    setMainCategory(''); setSubCategory('');
    setPartImages(part.additional_images || [part.image_url]); setEditingId(part.id); 
    setActiveTab('add_part'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setPartName(''); setPartNumber(''); setPartPrice(''); setPartStock('1'); 
    setPartType('مستعمل أصلي'); setPartCondition('نظيف');
    setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); 
    setMainCategory(''); setSubCategory('');
    setPartImages([]); setEditingId(null);
  };

  const activeInquiriesList = myInquiries.filter(i => i.status !== 'ordered');
  const pendingInquiriesCount = myInquiries.filter(i => i.status === 'pending_check').length;
  const pendingCustomRequestsCount = customRequests.filter(r => r.status === 'pending' || r.status === 'offers_received').length;

  return (
    <div style={{ maxWidth: '940px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
        <button onClick={() => { resetForm(); setActiveTab('add_part'); }} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'add_part' ? '#3182ce' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}>
          {isRtl ? 'إضافة قطعة' : 'Add Part'}
        </button>

        <button onClick={() => setShowExcelModal(true)} style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#38a169', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isRtl ? 'رفع قطع بالإكسل' : 'Bulk Excel'}
        </button>

        <button onClick={() => setActiveTab('custom_requests')} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'custom_requests' ? '#e0872a' : 'transparent', color: activeTab === 'custom_requests' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', position: 'relative' }}>
          {isRtl ? 'طلبات التسعير الواردة' : 'Custom Requests'}
          {pendingCustomRequestsCount > 0 && (
            <span style={{ position: 'absolute', top: '5px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>{pendingCustomRequestsCount}</span>
          )}
        </button>

        <button onClick={() => setActiveTab('inquiries')} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'inquiries' ? '#805ad5' : 'transparent', color: activeTab === 'inquiries' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', position: 'relative' }}>
          {isRtl ? 'فحص التوافق' : 'Fitment Check'}
          {pendingInquiriesCount > 0 && (
            <span style={{ position: 'absolute', top: '5px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>{pendingInquiriesCount}</span>
          )}
        </button>

        <button onClick={() => setActiveTab('my_parts')} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'my_parts' ? '#2b6cb0' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}>
          {isRtl ? `معروضاتي (${myParts.length})` : `My Ads (${myParts.length})`}
        </button>

        <button onClick={() => setActiveTab('orders')} style={{ flex: 1, minWidth: '130px', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}>
          {isRtl ? `الطلبات (${myOrders.length})` : `Orders (${myOrders.length})`}
        </button>
      </div>

      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1a365d', margin: 0, fontSize: '20px' }}>
              {editingId ? (isRtl ? 'تعديل بيانات القطعة' : 'Edit Part') : (isRtl ? 'إضافة قطعة غيار جديدة' : 'Add New Spare Part')}
            </h2>
          </div>

          <form onSubmit={handlePublishSingle} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {isRtl ? 'اسم قطعة الغيار *' : 'Part Name *'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? "مثال: مساعدات أمامية، Bump Stop..." : "E.g., Bump Stop, Alternator..."}
                  value={partName}
                  onChange={(e) => handlePartNameChange(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {isRtl ? 'رقم القطعة (اختياري):' : 'Part Number (PN) (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: 27060-0H110"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13.5px', fontWeight: 'bold', color: '#1f3a5f' }}>
                مكان وتصنيف القطعة (الفرع الأول Primary Category ➔ الفرع الثاني Sub-Category):
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>الفرع الرئيسي (Primary Category)</label>
                  <select
                    value={mainCategory}
                    onChange={(e) => { setMainCategory(e.target.value); setSubCategory(''); }}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
                  >
                    <option value="">-- اختر الفرع الرئيسي --</option>
                    {Object.keys(FULL_CATEGORY_TREE).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>الفرع الفرعي (Sub-Category)</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    disabled={!mainCategory}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
                  >
                    <option value="">-- اختر الفرع الفرعي --</option>
                    {mainCategory && FULL_CATEGORY_TREE[mainCategory]?.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>الماركة *</label>
                <select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
                  <option value="">اختر الماركة</option>
                  {Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>الموديل *</label>
                <select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required disabled={!partMake}>
                  <option value="">اختر الموديل</option>
                  {partMake && carData[partMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>السنة *</label>
                <select value={partYear} onChange={(e) => setPartYear(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
                  <option value="">السنة</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>المحرك</label>
                <select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} disabled={!partMake}>
                  <option value="">المحرك</option>
                  {partMake && carData[partMake]?.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13.5px', fontWeight: 'bold' }}>
                نوع / حالة القطعة:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {[
                  { label: 'مستعمل أصلي', val: 'مستعمل أصلي', color: '#16a34a', bg: '#f0fff4' },
                  { label: 'جديد أصلي (OEM)', val: 'جديد أصلي (OEM)', color: '#2563eb', bg: '#eff6ff' },
                  { label: 'جديد تجاري', val: 'جديد تجاري', color: '#e0872a', bg: '#fff7ed' },
                  { label: 'مستعمل تجاري', val: 'مستعمل تجاري', color: '#dc2626', bg: '#fef2f2' }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setPartType(item.val)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border: partType === item.val ? `2px solid ${item.color}` : '1px solid #cbd5e0',
                      backgroundColor: partType === item.val ? item.bg : '#ffffff',
                      color: partType === item.val ? item.color : '#475569',
                      fontWeight: 'bold',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                  حالة المنتج (Condition) *
                </label>
                <select
                  value={partCondition}
                  onChange={(e) => setPartCondition(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}
                >
                  <option value="جديد">جديد</option>
                  <option value="شبه جديد">شبه جديد</option>
                  <option value="نظيف">نظيف</option>
                  <option value="وسط">وسط</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                  السعر (QAR) *
                </label>
                <input
                  type="number"
                  placeholder="350"
                  value={partPrice}
                  onChange={(e) => setPartPrice(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>
                  الكمية المتوفرة *
                </label>
                <input
                  type="number"
                  min="1"
                  value={partStock}
                  onChange={(e) => setPartStock(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                صور القطعة (يمكنك اختيار رفع أكثر من صورة معاً):
              </label>

              <div style={{ border: '2px dashed #94a3b8', padding: '20px', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleImagesUpload}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  disabled={uploadingImages}
                />
                <p style={{ margin: 0, color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>
                  {uploadingImages ? 'جاري رفع الصور...' : 'اضغط هنا لاختيار صورة أو أكثر من جهازك'}
                </p>
              </div>

              {partImages.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {partImages.map((img, index) => (
                    <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={img} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
            >
              {editingId ? 'حفظ التعديلات' : 'نشر القطعة للبيع الآن'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'custom_requests' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {isRtl ? 'طلبات القطع المخصصة الواردة من العملاء' : 'Custom Part Requests from Customers'}
          </h3>

          {customRequests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{isRtl ? 'لا توجد طلبات قطع جديدة حالياً.' : 'No custom requests currently.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {customRequests.map((req) => (
                <div key={req.id} style={{ padding: '20px', border: '1px solid #e0872a', borderRadius: '15px', backgroundColor: '#fffdfa' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fff7ed', color: '#c2410c', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                      {isRtl ? 'رقم الطلب:' : 'Request ID:'} #{req.id}
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      {req.customer_phone}
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '12px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1f3a5f' }}>
                      {req.make} - {req.model} ({req.year}) {req.engine_size && `[${req.engine_size}]`}
                    </h4>
                    {req.vin_number && (
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}>
                        {isRtl ? 'رقم الشاصي (VIN):' : 'VIN:'} <strong>{req.vin_number}</strong>
                      </p>
                    )}
                    {req.part_number && (
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#334155' }}>
                        {isRtl ? 'رقم القطعة:' : 'Part Number:'} {req.part_number}
                      </p>
                    )}
                    <p style={{ margin: '8px 0 0 0', fontSize: '13.5px', color: '#1e293b', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderRight: '4px solid #e0872a' }}>
                      <strong>{isRtl ? 'القطعة المطلوبة:' : 'Requested Part:'}</strong> {req.notes}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    {req.vin_image_url && (
                      <a href={req.vin_image_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                        {isRtl ? 'صورة الاستمارة' : 'View Registration'}
                      </a>
                    )}
                    {req.part_image_url && (
                      <a href={req.part_image_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                        {isRtl ? 'صورة القطعة القديمة' : 'View Old Part'}
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedCustomRequest(req)}
                    style={{ width: '100%', padding: '11px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(224,135,42,0.2)' }}
                  >
                    {isRtl ? 'القطعة متوفرة عندي (تقديم تسعيرة)' : 'Available (Submit Quote)'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {isRtl ? 'استفسارات مطابقة التوافق الواردة' : 'Incoming Fitment Inquiries'}
          </h3>

          {activeInquiriesList.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{isRtl ? 'لا توجد استفسارات جديدة حالياً.' : 'No new inquiries currently.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {activeInquiriesList.map(inquiry => (
                <div key={inquiry.id} style={{ padding: '20px', border: inquiry.status === 'pending_check' ? '2px solid #805ad5' : '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: inquiry.status === 'pending_check' ? '#faf5ff' : '#f8fafc' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e9d8fd', color: '#553c9a', padding: '4px 10px', borderRadius: '6px' }}>
                      {isRtl ? 'كود الاستفسار:' : 'Inquiry Code:'} {inquiry.inquiry_code || `#INQ-${inquiry.id}`}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: inquiry.status === 'pending_check' ? '#dd6b20' : inquiry.status === 'confirmed_compatible' ? '#38a169' : '#e53e3e' }}>
                      {inquiry.status === 'pending_check' ? (isRtl ? 'بانتظار ردك' : 'Awaiting Reply') : inquiry.status === 'confirmed_compatible' ? (isRtl ? 'تم تأكيد التوافق' : 'Confirmed Fitment') : (isRtl ? 'لا تركب' : 'Incompatible')}
                    </span>
                  </div>

                  <div 
                    onClick={() => setPreviewPartDetails(inquiry)}
                    style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', marginBottom: '12px', cursor: 'pointer' }}
                  >
                    <img src={inquiry.part_image || 'https://via.placeholder.com/60'} alt={inquiry.part_name} style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1a365d' }}>
                          <AITranslatedText text={inquiry.part_name || (isRtl ? 'قطعة من معروضاتك' : 'Part from your listings')} lang={lang} />
                        </strong>
                        <span style={{ fontSize: '11px', color: '#3182ce', backgroundColor: '#ebf8ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{isRtl ? 'اضغط للمعاينة' : 'Click to Preview'}</span>
                      </div>
                      {inquiry.part_number && <span style={{ fontSize: '12px', color: '#718096', display: 'block' }}>Part #: {inquiry.part_number}</span>}
                      <span style={{ fontSize: '13.5px', color: '#dd6b20', fontWeight: 'bold' }}>{inquiry.part_price || 0} QAR</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginBottom: '6px' }}>{isRtl ? 'سيارة العميل:' : 'Customer Car:'} {inquiry.car_make} - {inquiry.car_model} ({inquiry.car_year}) {inquiry.car_engine && `[${inquiry.car_engine}]`}</div>
                    {inquiry.vin_number && <div style={{ fontSize: '13px', color: '#4a5568', fontFamily: 'monospace' }}>{isRtl ? 'رقم الشاصي (VIN):' : 'VIN:'} <strong>{inquiry.vin_number}</strong></div>}
                    {inquiry.customer_notes && <div style={{ fontSize: '13px', color: '#718096', marginTop: '6px', fontStyle: 'italic' }}>{isRtl ? 'ملاحظات العميل:' : 'Customer Notes:'} "{inquiry.customer_notes}"</div>}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    {inquiry.car_registration_img && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '3px' }}>{isRtl ? 'صورة الاستمارة' : 'Registration'}</span>
                        <a href={inquiry.car_registration_img} target="_blank" rel="noreferrer"><img src={inquiry.car_registration_img} alt="Estimara" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} /></a>
                      </div>
                    )}
                    {inquiry.old_part_img && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '3px' }}>{isRtl ? 'القطعة القديمة' : 'Old Part'}</span>
                        <a href={inquiry.old_part_img} target="_blank" rel="noreferrer"><img src={inquiry.old_part_img} alt="Old Part" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} /></a>
                      </div>
                    )}
                  </div>

                  {inquiry.status === 'pending_check' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setSelectedInquiry(inquiry)} style={{ flex: 1, padding: '10px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'تركب (تأكيد التوافق والضمان)' : 'Fits (Confirm & Warranty)'}</button>
                      <button onClick={() => handleRejectFitment(inquiry.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'لا تركب (رفض الطلب)' : 'Doesn\'t Fit (Reject)'}</button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my_parts' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#1a365d' }}>{isRtl ? `جميع القطع المعروضة (${myParts.length})` : `All Listed Parts (${myParts.length})`}</h3>
            
            <button onClick={() => setShowExcelModal(true)} style={{ padding: '8px 16px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isRtl ? 'رفع المزيد بالإكسل' : 'Upload More via Excel'}
            </button>
          </div>

          {myParts.map(part => (
            <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <img src={part.image_url || 'https://via.placeholder.com/60'} alt={part.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '16px' }}>
                    <AITranslatedText text={part.name} lang={lang} /> 
                    {part.part_number && <span style={{ fontSize: '12px', color: '#718096' }}>[PN: {part.part_number}]</span>}
                  </h4>
                  <div style={{ fontSize: '12.5px', color: '#718096', marginBottom: '4px' }}>{part.make} - {part.model} ({part.year})</div>
                  <div><span style={{ color: '#dd6b20', fontWeight: 'bold' }}>{part.price} QAR</span> | <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 'bold' }}>{part.part_type || (isRtl ? 'مستعمل' : 'Used')}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(part)} style={{ padding: '8px 14px', backgroundColor: '#ebf8ff', color: '#3182ce', border: '1px solid #bee3f8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{isRtl ? 'تعديل' : 'Edit'}</button>
                <button onClick={() => handleDelete(part.id)} style={{ padding: '8px 14px', backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{isRtl ? 'حذف' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>{isRtl ? 'الطلبات الواردة للشحن والاستلام' : 'Incoming Orders for Delivery/Pickup'}</h3>
          {myOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{isRtl ? 'لا توجد طلبات جديدة حالياً.' : 'No new orders currently.'}</p>
          ) : (
            myOrders.map(order => (
              <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', marginBottom: '15px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3182ce', backgroundColor: '#ebf8ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px' }}>
                      {isRtl ? 'كود الطلب:' : 'Order Code:'} {order.order_code || `#ORD-${order.id}`}
                    </span>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#2d3748' }}>
                      <AITranslatedText text={order.part_name} lang={lang} />
                    </h4>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#dd6b20', fontSize: '18px' }}>{order.price} QAR</span>
                </div>

                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #edf2f7', fontSize: '13px', color: '#4a5568', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {isRtl ? 'طريقة التسليم:' : 'Delivery Method:'} {order.delivery_type === 'delivery' ? (isRtl ? 'توصيل لموقع العميل' : 'Delivery to Customer') : (isRtl ? 'استلام من مقر موجود أوتو' : 'Pickup from Store')}
                  </div>
                  {order.delivery_type === 'delivery' && (
                    <div style={{ marginTop: '6px' }}>
                      {isRtl ? 'العنوان:' : 'Address:'} <strong>{order.address_details || (isRtl ? 'غير محدد' : 'Not specified')}</strong>
                    </div>
                  )}
                  {order.pickup_code && <div style={{ color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>{isRtl ? 'كود تسليم المندوب:' : 'Driver Pickup Code:'} {order.pickup_code}</div>}
                </div>

                <div>
                  {(!order.status || order.status === 'pending') && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')} 
                      style={{ width: '100%', padding: '11px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      {isRtl ? 'تأكيد توفر القطعة وتجهيزها' : 'Confirm Part Availability & Prep'}
                    </button>
                  )}

                  {order.status === 'ready_for_pickup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ padding: '8px', backgroundColor: '#f0fff4', color: '#276749', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12.5px', border: '1px solid #c6f6d5' }}>
                        {isRtl ? 'القطعة جاهزة وفي انتظار وصول المندوب' : 'Part ready, waiting for driver'}
                      </div>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'handed_to_driver')} 
                        style={{ width: '100%', padding: '11px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                      >
                        {isRtl ? 'تم تسليم القطعة للمندوب الآن' : 'Handed over to driver'}
                      </button>
                    </div>
                  )}

                  {(order.status === 'handed_to_driver' || order.status === 'delivered') && (
                    <div style={{ padding: '10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', border: '1px solid #bee3f8' }}>
                      {order.status === 'delivered' ? (isRtl ? 'تم التسليم للعميل بالكامل' : 'Delivered to Customer') : (isRtl ? 'تم تسليم القطعة للمندوب (قيد التوصيل للعميل)' : 'With Driver (Out for Delivery)')}
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {selectedCustomRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', padding: '26px', borderRadius: '20px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
              تقديم تسعيرة لطلب #{selectedCustomRequest.id}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              السيارة: <strong>{selectedCustomRequest.make} {selectedCustomRequest.model} ({selectedCustomRequest.year})</strong><br />
              القطعة: <strong>{selectedCustomRequest.notes}</strong>
            </p>
            <form onSubmit={handleSendCustomQuote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>السعر المطلوب (QAR) *</label>
                <input required type="number" placeholder="مثال: 350" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '14px', fontWeight: 'bold' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>نوع القطعة *</label>
                  <select value={quotePartType} onChange={(e) => setQuotePartType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}>
                    <option value="جديد أصلي">جديد أصلي</option>
                    <option value="جديد تجاري">جديد تجاري</option>
                    <option value="مستعمل أصلي">مستعمل أصلي</option>
                    <option value="مستعمل تجاري">مستعمل تجاري</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>حالة القطعة *</label>
                  <select value={quoteCondition} onChange={(e) => setQuoteCondition(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}>
                    <option value="جديد">جديد</option>
                    <option value="شبه جديد">شبه جديد</option>
                    <option value="نظيف">نظيف</option>
                    <option value="وسط">وسط</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>الضمان *</label>
                <input required type="text" placeholder="مثال: ضمان تجربة 3 أيام" value={quoteWarranty} onChange={(e) => setQuoteWarranty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>ملاحظات الكراج (اختياري)</label>
                <input type="text" placeholder="مثال: القطعة أصلية وكالة شغال 100%" value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={submittingQuote} style={{ flex: 1, padding: '12px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {submittingQuote ? 'جاري إرسال التسعيرة...' : 'إرسال التسعيرة'}
                </button>
                <button type="button" onClick={() => setSelectedCustomRequest(null)} style={{ padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewPartDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', maxWidth: '500px', width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setPreviewPartDetails(null)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#edf2f7', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ margin: '0 0 15px 0', color: '#1a365d' }}>{isRtl ? 'تفاصيل قطعة المعرض' : 'Garage Part Details'}</h3>
            <img src={previewPartDetails.part_image || 'https://via.placeholder.com/300'} alt={previewPartDetails.part_name} style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e0', marginBottom: '15px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#2d3748' }}>
              <AITranslatedText text={previewPartDetails.part_name} lang={lang} />
            </h4>
            {previewPartDetails.part_number && <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>{isRtl ? 'رقم القطعة:' : 'Part Number:'} <strong>{previewPartDetails.part_number}</strong></div>}
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dd6b20', marginBottom: '15px' }}>{previewPartDetails.part_price || 0} QAR</div>
            <button onClick={() => setPreviewPartDetails(null)} style={{ width: '100%', padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'إغلاق المعاينة' : 'Close Preview'}</button>
          </div>
        </div>
      )}

      {selectedInquiry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2b6cb0' }}>{isRtl ? 'تحديد شروط ضمان القطعة للعميل' : 'Set Warranty Terms'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '6px' }}>1. {isRtl ? 'مهلة الإرجاع قبل/عند التركيب (أيام):' : 'Return Window (Days):'}</label>
                <select value={returnDays} onChange={(e) => setReturnDays(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value={1}>{isRtl ? 'يوم واحد' : '1 Day'}</option>
                  <option value={3}>{isRtl ? '3 أيام (موصى به)' : '3 Days'}</option>
                  <option value={5}>{isRtl ? '5 أيام' : '5 Days'}</option>
                  <option value={7}>{isRtl ? '7 أيام' : '7 Days'}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '6px' }}>2. {isRtl ? 'فترة ضمان التشغيل بعد التركيب (أيام):' : 'Operational Warranty Period:'}</label>
                <select value={warrantyDays} onChange={(e) => setWarrantyDays(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value={7}>{isRtl ? '7 أيام' : '7 Days'}</option>
                  <option value={14}>{isRtl ? '14 يوماً (موصى به)' : '14 Days'}</option>
                  <option value={30}>{isRtl ? 'شهر كامل' : '1 Month'}</option>
                  <option value={90}>{isRtl ? '3 أشهر' : '3 Months'}</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleConfirmFitment} style={{ flex: 1, padding: '12px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'تأكيد وإرسال' : 'Confirm & Send'}</button>
              <button onClick={() => setSelectedInquiry(null)} style={{ padding: '12px 20px', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {showExcelModal && (
        <ExcelPartUploader
          lang={lang}
          supabaseUrl={supabaseUrl}
          apiKey={apiKey}
          session={session}
          onClose={() => setShowExcelModal(false)}
          onSuccess={() => {
            setShowExcelModal(false);
            fetchMyParts();
            if (onSuccess) onSuccess();
          }}
        />
      )}

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type="success" 
          onClose={() => setToastMessage(null)} 
        />
      )}

    </div>
  );
};
