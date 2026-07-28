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
    <>
      <style>{`
        .mwj-rb-wrap {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-family: 'Cairo', 'Segoe UI', sans-serif;
        }

        .mwj-rb-stars {
          font-weight: 800; color: #92620a;
          background: linear-gradient(135deg, #fff6db 0%, #ffedb0 100%);
          padding: 4px 9px; border-radius: 8px;
          border: 1px solid #f6d989;
          display: inline-flex; align-items: center; gap: 3px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .mwj-rb-stars:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(214,158,46,0.2); }

        .mwj-rb-verified {
          font-weight: 800; color: #ffffff;
          background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%);
          padding: 4px 10px; border-radius: 8px;
          display: inline-flex; align-items: center; gap: 4px;
          box-shadow: 0 3px 10px rgba(34,163,90,0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          animation: mwj-rb-pop 0.3s ease;
        }
        .mwj-rb-verified:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(34,163,90,0.35); }

        @keyframes mwj-rb-pop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="mwj-rb-wrap">
        {/* عدد النجوم */}
        <span className="mwj-rb-stars">
          ⭐ {rating !== null ? rating : '5.0'} <span style={{ opacity: 0.75, fontWeight: 700 }}>({reviewsCount})</span>
        </span>

        {/* شارة بائع مضمون */}
        {isVerifiedSeller && (
          <span className="mwj-rb-verified">
            🛡️ بائع مضمون
          </span>
        )}
      </div>
    </>
  );
};
