import fs from 'fs';
import path from 'path';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: 'Abhitech Energycon Limited',
};

const LEGACY_DIR = path.join(process.cwd(), 'public', 'legacy');

export default function Page() {
  const bodyHtml = fs.readFileSync(path.join(LEGACY_DIR, 'admin.body.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(LEGACY_DIR, 'admin.style.css'), 'utf8');

  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      styleCss={styleCss}
      scriptSrc="/legacy/admin.js"
      externalScripts={[]}
    />
  );
}
