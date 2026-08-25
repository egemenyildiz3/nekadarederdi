export function Logo() {
  return (
    <div className="brand-mark" aria-label="Ne Kadar Ederdi?">
      <svg className="brand-mark__glyph" aria-hidden="true" viewBox="0 0 56 56" role="img">
        <rect className="brand-mark__tile" x="5" y="5" width="46" height="46" rx="10" />
        <path className="brand-mark__orbit" d="M28 13a15 15 0 1 1-13.4 21.8" />
        <path className="brand-mark__tick" d="M28 13v8M43 28h-7" />
        <path className="brand-mark__chart" d="M15 36l8-8 7 5 11-14" />
        <circle className="brand-mark__coin" cx="22" cy="32" r="7" />
        <text className="brand-mark__currency" x="22" y="32">
          &#8378;
        </text>
        <circle className="brand-mark__dot" cx="41" cy="19" r="3.5" />
      </svg>
      <div>
        <p>Ne Kadar</p>
        <p>Ederdi?</p>
      </div>
    </div>
  );
}
