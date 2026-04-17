/**
 * Hiển thị sao (1–5) từ số rating thực.
 */
export default function ProductStars({ rating }) {
  const r = Math.min(5, Math.max(0, parseFloat(rating) || 0))
  const full = Math.round(r)
  return (
    <span className="card__stars" aria-label={`${r.toFixed(1)} trên 5 điểm`}>
      <span className="card__stars-track" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={i <= full ? 'card__stars-fill' : 'card__stars-empty'}
          >
            ★
          </span>
        ))}
      </span>
      <span className="card__stars-score">{r.toFixed(1)} / 5</span>
    </span>
  )
}
