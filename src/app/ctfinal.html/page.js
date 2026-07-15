import fs from 'fs';
import path from 'path';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: 'Abhitech Energycon Limited',
};

const LEGACY_DIR = path.join(process.cwd(), 'public', 'legacy');

export default function Page() {
  const bodyHtml = fs.readFileSync(path.join(LEGACY_DIR, 'ctfinal.body.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(LEGACY_DIR, 'ctfinal.style.css'), 'utf8');

  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      styleCss={styleCss}
      scriptSrc="/legacy/ctfinal.js"
      externalScripts={['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js']}
    />
  );
}
