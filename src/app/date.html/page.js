import fs from 'fs';
import path from 'path';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: 'Abhitech Energycon Limited',
};

const LEGACY_DIR = path.join(process.cwd(), 'public', 'legacy');

export default function Page() {
  const bodyHtml = fs.readFileSync(path.join(LEGACY_DIR, 'date.body.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(LEGACY_DIR, 'date.style.css'), 'utf8');

  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      styleCss={styleCss}
      scriptSrc="/legacy/date.js"
      externalScripts={['https://www.gstatic.com/charts/loader.js', 'https://cdn.plot.ly/plotly-3.0.1.min.js', 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js']}
    />
  );
}
