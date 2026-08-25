export function Logo() {
  return (
    <div className="brand-mark" aria-label="Ne Kadar Ederdi?">
      <div className="brand-mark__glyph" aria-hidden="true">
        <span className="brand-mark__currency">₺</span>
        <span className="brand-mark__question">?</span>
      </div>
      <div>
        <p>Ne Kadar</p>
        <p>Ederdi?</p>
      </div>
    </div>
  );
}
