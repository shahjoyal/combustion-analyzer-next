import RootShell from '../RootShell';

export const metadata = {
  title: 'Abhitech Energycon Limited',
  description: 'Coal blend AFT prediction & slagging/fouling analysis',
};

export default function SiteLayout({ children }) {
  return <RootShell>{children}</RootShell>;
}
