function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.9 4.8l2.5-.8a1.2 1.2 0 0 1 1.4.6l1.1 2.5a1.2 1.2 0 0 1-.3 1.4l-1.4 1.2a14.2 14.2 0 0 0 4.2 4.2l1.2-1.4a1.2 1.2 0 0 1 1.4-.3l2.5 1.1a1.2 1.2 0 0 1 .6 1.4l-.8 2.5a1.2 1.2 0 0 1-1.1.8c-7 0-12.8-5.7-12.8-12.8 0-.5.3-1 .8-1.1z"
        fill="currentColor"
      />
    </svg>
  )
}

function MessengerGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2C6.49 2 2 6.04 2 11.01c0 2.84 1.46 5.37 3.74 7.02V22l3.41-1.87c.9.25 1.86.38 2.85.38 5.51 0 10-4.04 10-9.01C22 6.04 17.51 2 12 2zm1.16 12.21L10.63 11.5l-4.87 2.71 5.36-5.68 2.54 2.71 4.84-2.71-5.34 5.68z"
        fill="#ffffff"
      />
    </svg>
  )
}

export default function FloatingActions() {
  return (
    <div className="floating-actions" aria-label="Tiện ích nhanh">
      <a href="https://zalo.me/" target="_blank" rel="noreferrer" className="floating-actions__ring" aria-label="Chat Zalo">
        <span className="floating-actions__zalo">Zalo</span>
      </a>
      <a href="tel:0900123456" className="floating-actions__ring" aria-label="Gọi điện">
        <PhoneGlyph />
      </a>
      <a
        href="https://m.me/"
        target="_blank"
        rel="noreferrer"
        className="floating-actions__solid"
        aria-label="Chat Messenger"
      >
        <MessengerGlyph />
      </a>
    </div>
  )
}
