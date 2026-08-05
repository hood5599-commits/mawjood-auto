// توليد كود فريد غير قابل للتكرار لكل حساب
export const getOrGenerateUserCode = (session: any, role: 'customer' | 'garage'): string => {
  if (session?.user_code) return session.user_code;
  
  const prefix = role === 'garage' ? 'GAR' : 'CUST';
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNumber}`;
};
