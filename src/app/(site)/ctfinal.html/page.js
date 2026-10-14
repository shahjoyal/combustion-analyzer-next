import CtFinalBody from '@/components/pages/CtFinalBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <CtFinalBody />
      <LegacyScripts
        script="/legacy/ctfinal.js"
        vendors={[
          'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        ]}
      />
    </>
  );
}
