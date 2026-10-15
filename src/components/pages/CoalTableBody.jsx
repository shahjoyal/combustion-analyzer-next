'use client';

// CoalTable page markup. Converted from public/legacy/coal_table.body.html.
// Behaviour lives in public/legacy/coal_table.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/coal_table.css';
import '@/styles/navbar.css';
import CommonNavbar from '@/components/CommonNavbar';
import useToolbarHubs from '@/components/useToolbarHubs';

export default function CoalTableBody() {
  useToolbarHubs(); // Select Coal / Download hub behaviour
  return (
    <>
      <div id="edit-modal-backdrop" aria-hidden="true">
        <div id="edit-modal" role="dialog" aria-modal="true">
          <h3>Edit Coal Properties</h3>
          <div id="edit-form-fields"></div>
          <div className="modal-actions">
            <button id="edit-cancel-btn" type="button">Cancel</button>
            {' '}
            <button id="edit-save-btn" type="button" className="btn-upload">{" "}Save changes{" "}</button>
          </div>
        </div>
      </div>
      <h1 className="page-title">Slagging Data Table</h1>
      <div className="toolbar-wrapper">
        {/* data-open is driven by public/legacy/coal_table.js (setupToolbarHubs): "none" | "select" | "download" */}
        <div className="toolbar" id="coalToolbar" data-open="none">

          {/* ================= LEFT: Select Coal hub + Search ================= */}
          <div className="tb-collapse tb-left">
            <div className="tb-clip tb-line">
              <div className="tb-hub tb-hub--left tb-actions" id="select-hub" data-hub="select">
                <button id="select-hub-btn" className="tb-btn tb-trigger btn-select-hub" type="button" aria-expanded="false" aria-controls="select-strip">
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
                  <span>Select Coal</span>
                  <em id="selCountBadge" className="sel-badge" title="Selected rows">0</em>
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                </button>
                <div className="tb-strip" id="select-strip">
                  <div className="tb-clip tb-line">
                    <div className="selection-mode-toggle" role="group" aria-label="Selection mode" data-mode="normal" style={{ '--i': 0 }}>
                      <span className="mode-thumb" aria-hidden="true"></span>
                      <button id="mode-select-btn" className="mode-btn active" type="button" title="Click checkboxes one by one">
                        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                        <span>Select</span>
                      </button>
                      <button id="mode-range-btn" className="mode-btn" type="button" title="Click a start row, then an end row, to select everything in between">
                        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14M9 4v4m6 8v4" /></svg>
                        <span>Select Range</span>
                      </button>
                    </div>
                    <span className="tb-sep" aria-hidden="true" style={{ '--i': 1 }}></span>
                    <button id="edit-selected-btn" className="btn-upload tb-btn" type="button" disabled title="Select a row first" style={{ '--i': 2 }}>
                      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM14 6l4 4" /></svg>
                      <span>Edit Selected</span>
                    </button>
                    <button id="delete-selected-btn" className="btn-delete tb-btn" type="button" disabled title="Select rows first" style={{ '--i': 3 }}>
                      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="tb-collapse tb-search-wrap">
                <div className="tb-clip">
                  <div className="search-pill">
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <input id="searchInput" type="search" placeholder="Search coal name..." />
                    <button id="searchBtn" className="btn-template" type="button">Search</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: Upload + Download hub ================= */}
          <div className="tb-collapse tb-right">
            <div className="tb-clip tb-line">
              <div className="tb-collapse tb-upload-wrap">
                <div className="tb-clip">
                  <button id="btn-upload" className="btn-upload tb-btn" type="button">
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                    <span>Upload New Data</span>
                  </button>
                  <input id="fileInput" type="file" accept=".xlsx,.xls" />
                </div>
              </div>

              <div className="tb-hub tb-hub--right" id="download-hub" data-hub="download">
                <div className="tb-strip" id="download-strip">
                  <div className="tb-clip tb-line">
                    <button id="btn-download-template" className="btn-template tb-btn" type="button" title="Excel template for uploading data" style={{ '--i': 0 }}>
                      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" /></svg>
                      <span>Template</span>
                    </button>
                    <button id="downloadWholePDFBtn" className="btn-download tb-btn" type="button" title="Export the whole coal table as PDF" style={{ '--i': 1 }}>
                      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 14h1.5a1.5 1.5 0 0 0 0-3H9v5" /></svg>
                      <span>Whole page PDF</span>
                    </button>
                    <span className="tb-sep" aria-hidden="true" style={{ '--i': 2 }}></span>
                    <button id="download-selected-btn" className="btn-template tb-btn js-download-selected" type="button" disabled title="Select rows first" onClick={() => window.downloadSelected('excel')} style={{ '--i': 3 }}>
                      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 12l4 5m0-5-4 5" /></svg>
                      <span>Selected · Excel</span>
                    </button>
                    <button id="download-selected-pdf-btn" className="btn-download tb-btn js-download-selected" type="button" disabled title="Select rows first" onClick={() => window.downloadSelected('pdf')} style={{ '--i': 4 }}>
                      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 14h1.5a1.5 1.5 0 0 0 0-3H9v5" /></svg>
                      <span>Selected · PDF</span>
                    </button>
                  </div>
                </div>
                <button id="download-hub-btn" className="btn-download tb-btn tb-trigger" type="button" aria-expanded="false" aria-controls="download-strip">
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m0 0 5-5m-5 5-5-5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="table-wrapper">
        <table id="data-table" role="table" aria-label="coal data table">
          <thead>
            <tr id="table-header"></tr>
          </thead>
          <tbody id="table-body"></tbody>
        </table>
      </div>
      <CommonNavbar items={[{"target":"coal_table.html","label":"Coal Properties"},{"target":"slagging_coal_page.html","label":"Calculation"},{"target":"model.html","label":"Cost Optimization Model","title":"Model"},{"target":"model_compare.html","label":"Compare Models"}]} />
    </>
  );
}