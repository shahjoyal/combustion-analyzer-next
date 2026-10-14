import SlaggingBody from '@/components/pages/SlaggingBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <SlaggingBody />
      <LegacyScripts
        script="/legacy/slagging_coal_page.js"
        vendors={[
          'https://www.gstatic.com/charts/loader.js',
          'https://cdn.plot.ly/plotly-1.58.5.min.js',
          'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        ]}
      />
    </>
  );
}
