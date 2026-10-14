import ModelBody from '@/components/pages/ModelBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <ModelBody />
      <LegacyScripts
        script="/legacy/model.js"
        vendors={[
          'https://www.gstatic.com/charts/loader.js',
          'https://cdn.plot.ly/plotly-3.0.1.min.js',
          'https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        ]}
      />
    </>
  );
}
