const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // 🔑 جلب المفتاح بشكل آمن لتفادي أخطاء TypeScript و Vercel
    // @ts-ignore
    const apiKey = (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) || "";

    if (!apiKey) {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: lang === 'ar' 
          ? 'عفواً، مفتاح الذكاء الاصطناعي غير معرف بشكل صحيح في Vercel.' 
          : 'Gemini API key is not configured.' 
      }]);
      setLoading(false);
      return;
    }

    const systemPrompt = `You are a helpful customer service AI Assistant for "Mawjood Auto" (موجود أوتو), an online auto parts marketplace in Qatar.
Your goal is to assist customers who don't know how to search or order parts.
Key instructions to guide users:
1. To search: Users can use the search bar by Part Number (PN) or part name (e.g., Alternator, Starter, Brake Pads).
2. To check fitment: Tell them to click on the part, enter their car's VIN (رقم الشاصي) from the registration (الاستمارة), upload an old part photo, and send it to the garage for a 100% compatibility check.
3. Delivery: Delivery takes 2 to 24 hours across Qatar, or free pickup from the store.
4. Payment: Supports Apple Pay, Google Pay, Cards (Visa/MasterCard), or Cash on Delivery (COD).
Answer clearly, concisely, and politely in the same language as the user (${lang === 'ar' ? 'Arabic' : 'English'}).`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: systemPrompt }] },
              { parts: [{ text: `User Question: ${userMsg}` }] }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
          || (lang === 'ar' ? 'عفواً، لم أستطع فهم الطلب، حاول مرة أخرى.' : 'Sorry, I could not process that.');
        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini Error:", errorData);
        setMessages(prev => [...prev, { sender: 'ai', text: lang === 'ar' ? 'حدث خطأ في استجابة الذكاء الاصطناعي، يرجى المحاولة لاحقاً.' : 'Error in AI response.' }]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setMessages(prev => [...prev, { sender: 'ai', text: lang === 'ar' ? 'تعذر الاتصال بالمساعد الذكي حالياً.' : 'Connection error.' }]);
    } finally {
      setLoading(false);
    }
  };
