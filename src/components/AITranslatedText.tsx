import React, { useState, useEffect } from 'react';
import { translateWithAI, peekTranslationCache } from '../services/aiTranslator';

interface AITranslatedTextProps {
  text: string;
  lang: 'ar' | 'en';
}

function initialDisplay(text: string, lang: 'ar' | 'en'): string {
  if (lang === 'en' && /[\u0600-\u06FF]/.test(text)) {
    return peekTranslationCache(text, 'en') || text;
  }
  return text;
}

export const AITranslatedText: React.FC<AITranslatedTextProps> = ({ text, lang }) => {
  const [displayText, setDisplayText] = useState<string>(() => initialDisplay(text, lang));

  useEffect(() => {
    let isMounted = true;

    const performTranslation = async () => {
      if (lang === 'en' && /[\u0600-\u06FF]/.test(text)) {
        const cached = peekTranslationCache(text, 'en');
        if (cached) {
          if (isMounted) setDisplayText(cached);
          return;
        }
        // Keep previous/original text visible — never flash "Translating..."
        const translated = await translateWithAI(text, 'en');
        if (isMounted) setDisplayText(translated);
      } else if (isMounted) {
        setDisplayText(text);
      }
    };

    performTranslation();
    return () => {
      isMounted = false;
    };
  }, [text, lang]);

  return <span>{displayText}</span>;
};
