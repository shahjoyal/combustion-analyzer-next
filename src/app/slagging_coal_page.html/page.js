import fs from 'fs';
import path from 'path';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: 'Abhitech Energycon Limited',
};

const LEGACY_DIR = path.join(process.cwd(), 'public', 'legacy');

export default function Page() {
  const bodyHtml = fs.readFileSync(path.join(LEGACY_DIR, 'slagging_coal_page.body.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(LEGACY_DIR, 'slagging_coal_page.style.css'), 'utf8');

  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      styleCss={styleCss}
      scriptSrc="/legacy/slagging_coal_page.js"
      bodyClassName="page-slagging"
      externalScripts={['https://www.gstatic.com/charts/loader.js', 'https://cdn.plot.ly/plotly-1.58.5.min.js', 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js']}
    />
  );
}
