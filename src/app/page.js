import fs from 'fs';
import path from 'path';
import LegacyPage from '@/components/LegacyPage';

// The original Express app served public/login.html for GET              '/'.
export const metadata = {
  title: 'Abhitech Energycon Limited',
};

const LEGACY_DIR = path.join(process.cwd(), 'public', 'legacy');

export default function Page() {
  const bodyHtml = fs.readFileSync(path.join(LEGACY_DIR, 'login.body.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(LEGACY_DIR, 'login.style.css'), 'utf8');

  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      styleCss={styleCss}
      scriptSrc="/legacy/login.js"
      externalScripts={['/legacy/login-scene.js']}
    />
  );
}