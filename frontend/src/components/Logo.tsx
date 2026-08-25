export function Logo() {
  return (
    <div className="brand-mark" aria-label="Ne Kadar Ederdi?">
      <svg className="brand-mark__glyph" aria-hidden="true" viewBox="0 0 56 56" role="img">
        <path className="brand-mark__plate" d="M8 5h36l4 4v42H8z" />
        <path className="brand-mark__fold" d="M44 5v8h8" />
        <path className="brand-mark__trace brand-mark__trace--top" d="M16 18h18" />
        <path className="brand-mark__trace brand-mark__trace--bottom" d="M22 38h18" />
        <path className="brand-mark__arrow" d="M36 18l4 4-4 4" />
        <text className="brand-mark__currency" x="18" y="34">₺</text>
        <text className="brand-mark__question" x="37" y="36">?</text>
      </svg>
      <div>
        <p>Ne Kadar</p>
        <p>Ederdi?</p>
      </div>
    </div>
  );
}
