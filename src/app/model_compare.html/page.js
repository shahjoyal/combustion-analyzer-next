import fs from 'fs';
import path from 'path';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: 'Compare Models — Combustion Analyzer',
};

const LEGACY_DIR = path.join(process.cwd(), 'public', 'legacy');

export default function Page() {
  const bodyHtml = fs.readFileSync(path.join(LEGACY_DIR, 'model_compare.body.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(LEGACY_DIR, 'model_compare.style.css'), 'utf8');

  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      styleCss={styleCss}
      scriptSrc="/legacy/model_compare.js"
      externalScripts={['https://cdn.jsdelivr.net/npm/chart.js', 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js']}
    />
  );
}
