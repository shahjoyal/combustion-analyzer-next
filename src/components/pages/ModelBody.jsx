'use client';

// Model page markup. Converted from public/legacy/model.body.html.
// Behaviour lives in public/legacy/model.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/model.css';
import CommonNavbar from '@/components/CommonNavbar';

export default function ModelBody() {
  return (
    <>
      <div id="optimizeLoadingOverlay">
        <div className="optimize-spinner"></div>
        <div className="optimize-loading-text">Calculating cost optimal blend…</div>
        <div className="optimize-loading-subtext">
          This can take a little while for larger blends — please don't close this tab.
        </div>
      </div>
      <div className="content">
        <button id="downloadPDF" className="icon-btn" title="Download page as PDF">⬇️</button>
        <header className="page-header" id="pageHeader">
          <p className="page-eyebrow">Combustion Analyzer</p>
          <h1 className="page-title">Cost Optimization Model</h1>
          <p className="page-subtitle"></p>
        </header>
        <form id="coalForm">
          <section id="coalBlends" className="panel">
            <div className="panel-header">
              <h2>Coal Type</h2>
              <span className="panel-hint">Add up to 10 coal types to build your blend</span>
            </div>
            <div className="blend-row"></div>
            <button type="button" className="add-blend-btn" onClick={() => window.addBlend()}>+ Add Coal</button>
          </section>
          <div className="panel toolbar-panel">
            <div id="totalRangeContainer">
              <label>
                Total Current Range:{" "}
                <span id="totalRange">0</span>
                %
              </label>
            </div>
            <button type="button" id="calculateBtn" className="calculate-btn" onClick={() => window.optimizeBlend()}>Calculate Optimal Blend</button>
          </div>
        </form>
        <div id="coalPropertiesModal" className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Elemental Analysis</h3>
              <span className="close" onClick={() => window.closeModal()}>×</span>
            </div>
            <div id="coalPropertiesContent"></div>
          </div>
        </div>
        <div id="optimization-result"></div>
        <div id="scale-bars-container" style={{ marginTop: "20px" }}></div>
      </div>
      <CommonNavbar items={[{"target":"coal_table.html","label":"Coal Properties"},{"target":"slagging_coal_page.html","label":"Calculation"},{"target":"model.html","label":"Cost Optimization Model","title":"Model"},{"target":"model_compare.html","label":"Compare Models"}]} />
    </>
  );
}
