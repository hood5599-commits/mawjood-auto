import React, { useState, useEffect } from 'react';

interface Props {
  garageId: string;
  supabaseUrl: string;
  apiKey: string;
}

export const GarageRatingBadge: React.FC<Props> = ({ garageId, supabaseUrl, apiKey }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number>(0);

  useEffect(() => {
    fetchGarageRating();
  }, [garageId]);

  const fetchGarageRating = async () => {
    if (!garageId) return;
    try {
      const response = await fetch(`${supabaseUrl}/garage_reviews?garage_id=eq.${garageId}`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const avg = data.reduce((acc: number, curr: any) => acc + curr.rating, 0) / data.length;
          setRating(Number(avg.toFixed(1)));
          setReviewsCount(data.length);
        } else {
          setRating(5.0); // تقييم افتراضي ممتازة للكراجات الجديدة
          setReviewsCount(1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isVerifiedSeller = rating !== null && rating >= 4.5;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
      {/* عدد النجوم */}
      <span style={{ fontWeight: 'bold', color: '#d69e2e', backgroundColor: '#fefcbf', padding: '2px 6px', borderRadius: '6px' }}>
        ⭐ {rating !== null ? rating : '5.0'} ({reviewsCount})
      </span>

      {/* شارة بائع مضمون */}
      {isVerifiedSeller && (
        <span style={{ fontWeight: 'bold', color: '#276749', backgroundColor: '#c6f6d5', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          🛡️ بائع مضمون
        </span>
      )}
    </div>
  );
};
