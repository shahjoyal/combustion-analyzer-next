import LoginBody from '@/components/pages/LoginBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <LoginBody />
      <LegacyScripts
        script="/legacy/login.js"
        vendors={[
          '/legacy/login-scene.js',
        ]}
      />
    </>
  );
}
