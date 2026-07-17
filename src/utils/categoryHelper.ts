export const getPartCategory = (partName: string): string => {
  const name = partName.toLowerCase();
  
  if (name.includes('سير') || name.includes('بكرة') || name.includes('belt')) return 'Belt Drive';
  if (name.includes('شمعة') || name.includes('اصطب') || name.includes('صدام') || name.includes('دعامية') || name.includes('رفرف') || name.includes('مرآة') || name.includes('جام') || name.includes('body') || name.includes('lamp') || name.includes('fender')) return 'Body & Lamp Assembly';
  if (name.includes('فحمات') || name.includes('سفايف') || name.includes('هوب') || name.includes('ديسك') || name.includes('بريك') || name.includes('brake') || name.includes('hub')) return 'Brake & Wheel Hub';
  if (name.includes('راديتر') || name.includes('رادياتير') || name.includes('ترمستات') || name.includes('مبرد') || name.includes('طرمبة ماء') || name.includes('cool') || name.includes('radiator')) return 'Cooling System';
  if (name.includes('دينمو') || name.includes('سلف') || name.includes('بطارية') || name.includes('كهرب') || name.includes('حساس') || name.includes('starter') || name.includes('alternator') || name.includes('battery')) return 'Electrical';
  if (name.includes('فلتر') || name.includes('فيلتر') || name.includes('بترول') || name.includes('هواء') || name.includes('بخاخ') || name.includes('طرمبة بترول') || name.includes('fuel') || name.includes('air') || name.includes('filter')) return 'Fuel & Air';
  if (name.includes('مساعد') || name.includes('مساعدات') || name.includes('جامبين') || name.includes('جامبينات') || name.includes('سبرنغ') || name.includes('مقص') || name.includes('suspension') || name.includes('shock')) return 'Suspension';
  if (name.includes('قير') || name.includes('جير') || name.includes('كلتش') || name.includes('transmission') || name.includes('gear')) return 'Transmission-Automatic';
  
  return 'Engine';
};