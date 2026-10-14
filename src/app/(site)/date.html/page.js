import DateWiseBody from '@/components/pages/DateWiseBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <DateWiseBody />
      <LegacyScripts
        script="/legacy/date.js"
        vendors={[
          'https://www.gstatic.com/charts/loader.js',
          'https://cdn.plot.ly/plotly-3.0.1.min.js',
          'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        ]}
      />
    </>
  );
}
