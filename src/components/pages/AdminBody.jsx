'use client';

// Admin page markup. Converted from public/legacy/admin.body.html.
// Behaviour lives in public/legacy/admin.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/admin.css';

export default function AdminBody() {
  return (
    <>
      <h2>easy conversion</h2>
      <p>Paste your MongoDB document below and click "Convert":</p>
      <textarea id="input" />
      <br />
      <button onClick={() => window.convert()}>Convert</button>
      <div id="output" className="output"></div>
    </>
  );
}
