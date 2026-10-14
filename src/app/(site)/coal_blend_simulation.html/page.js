import CoalBlendSimulationBody from '@/components/pages/CoalBlendSimulationBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <CoalBlendSimulationBody />
      <LegacyScripts
        script="/legacy/coal_blend_simulation.js"
        vendors={[
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        ]}
      />
    </>
  );
}
