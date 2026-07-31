export const fetchWithAuth = async (
  supabaseUrl: string, 
  apiKey: string, 
  session: any, 
  endpoint: string, 
  options: RequestInit = {}
) => {
  // استخراج التوكن الفعلي أو الاعتماد على مفتاح الـ Api العام كبديل آمن
  const token = session?.token || session?.access_token || apiKey;
  
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${supabaseUrl}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn('Authentication token expired or unauthorized access attempt.');
  }

  return response;
};
