/**
 * SVG icon giỏ hàng — màu theo `currentColor`.
 */
export default function IconCart({ className = '', size = 22 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <path
        d="M1 3h3l2.5 12.5a2 2 0 0 0 2 1.5h9.4a2 2 0 0 0 2-1.6L22 8H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
