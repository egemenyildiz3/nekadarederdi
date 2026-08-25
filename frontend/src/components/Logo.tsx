export function Logo() {
  return (
    <div className="brand-mark" aria-label="Ne Kadar Ederdi?">
      <svg className="brand-mark__glyph" aria-hidden="true" viewBox="0 0 64 64" role="img">
        <rect className="brand-mark__tile" x="6" y="6" width="52" height="52" rx="13" />
        <path className="brand-mark__loop" d="M20 39.5A15 15 0 0 1 41.8 20" />
        <path className="brand-mark__loop brand-mark__loop--future" d="M44 24.5A15 15 0 0 1 22.2 44" />
        <path className="brand-mark__trend" d="M20.5 42.5 30.2 33l7 5.8L47 23" />
        <circle className="brand-mark__coin" cx="47" cy="23" r="6.5" />
        <path className="brand-mark__currency" d="M43.7 20.5 50.1 18.7M43.7 23.4 49 21.9M46 18.4v9.5c2.5-.1 4.2-1.2 5.1-3.2" />
      </svg>
      <div>
        <p>Ne Kadar</p>
        <p>Ederdi?</p>
      </div>
    </div>
  );
}
