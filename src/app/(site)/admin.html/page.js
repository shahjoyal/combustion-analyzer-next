import AdminBody from '@/components/pages/AdminBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <AdminBody />
      <LegacyScripts
        script="/legacy/admin.js"
      />
    </>
  );
}
