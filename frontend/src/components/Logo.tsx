export function Logo() {
  return (
    <div className="brand-mark" aria-label="Ne Kadar Ederdi?">
      <svg className="brand-mark__glyph" aria-hidden="true" viewBox="0 0 56 56" role="img">
        <rect className="brand-mark__tile" x="5" y="5" width="46" height="46" rx="10" />
        <path className="brand-mark__glass" d="M17 13h22c0 8.4-7.8 10.4-10.4 15C31.2 32.6 39 34.6 39 43H17c0-8.4 7.8-10.4 10.4-15C24.8 23.4 17 21.4 17 13Z" />
        <path className="brand-mark__rim" d="M15 13h26M15 43h26" />
        <path className="brand-mark__stream" d="M28 22v3.2M28 30.8v3.2" />
        <circle className="brand-mark__past" cx="28" cy="19" r="3.6" />
        <circle className="brand-mark__coin" cx="28" cy="37" r="6.6" />
        <text className="brand-mark__currency" x="28" y="37">
          &#8378;
        </text>
        <path className="brand-mark__spark" d="M39 22l4-4M42 24h4M37 17v-4" />
      </svg>
      <div>
        <p>Ne Kadar</p>
        <p>Ederdi?</p>
      </div>
    </div>
  );
}
