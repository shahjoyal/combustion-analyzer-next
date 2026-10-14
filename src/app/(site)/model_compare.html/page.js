import ModelCompareBody from '@/components/pages/ModelCompareBody';
import LegacyScripts from '@/components/LegacyScripts';

export default function Page() {
  return (
    <>
      <ModelCompareBody />
      <LegacyScripts
        script="/legacy/model_compare.js"
        vendors={[
          'https://cdn.jsdelivr.net/npm/chart.js',
          'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
        ]}
      />
    </>
  );
}
