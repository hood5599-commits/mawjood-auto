import React, { useState, useEffect } from 'react';
import { translateWithAI } from '../services/aiTranslator';

interface AITranslatedTextProps {
  text: string;
  lang: 'ar' | 'en';
}

export const AITranslatedText: React.FC<AITranslatedTextProps> = ({ text, lang }) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const performTranslation = async () => {
      // إذا كانت لغة العرض الإنجليزية والنص أصله عربي، نترجمه فوراً
      if (lang === 'en' && /[\u0600-\u06FF]/.test(text)) {
        setLoading(true);
        const translated = await translateWithAI(text, 'en');
        if (isMounted) {
          setDisplayText(translated);
          setLoading(false);
        }
      } else {
        setDisplayText(text);
      }
    };

    performTranslation();

    return () => { isMounted = false; };
  }, [text, lang]);

  if (loading) {
    return <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Translating...</span>;
  }

  return <span>{displayText}</span>;
};
