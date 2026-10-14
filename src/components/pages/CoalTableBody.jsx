'use client';

// CoalTable page markup. Converted from public/legacy/coal_table.body.html.
// Behaviour lives in public/legacy/coal_table.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/coal_table.css';
import '@/styles/navbar.css';
import CommonNavbar from '@/components/CommonNavbar';

export default function CoalTableBody() {
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
        <div className="toolbar">
          <div className="left-group">
            <button id="btn-download-template" className="btn-template" type="button">{" "}Download Template{" "}</button>
            {' '}
            <button id="btn-upload" className="btn-upload" type="button">{" "}📤 Upload New Data{" "}</button>
            {' '}
            <input id="fileInput" type="file" accept=".xlsx,.xls" />
            <input id="searchInput" type="search" placeholder="Search coal name..." style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", minWidth: "220px" }} />
            {' '}
            <button id="searchBtn" className="btn-template" type="button">{" "}Search{" "}</button>
          </div>
          <div className="right-group">
            <div className="selection-mode-toggle" role="group" aria-label="Selection mode">
              <button id="mode-select-btn" className="mode-btn active" type="button" title="Click checkboxes one by one">{" "}Select{" "}</button>
              {' '}
              <button id="mode-range-btn" className="mode-btn" type="button" title="Click a start row, then an end row, to select everything in between">{" "}Select Range{" "}</button>
            </div>
            <div className="download-dropdown">
              <button id="download-selected-btn" className="btn-download" type="button" disabled>{" "}Download Selected ▾{" "}</button>
              <div id="download-menu" className="dropdown-menu" aria-hidden="true">
                <button type="button" onClick={() => window.downloadSelected('excel')}>{" "}Download as Excel{" "}</button>
                {' '}
                <button type="button" onClick={() => window.downloadSelected('pdf')}>{" "}Download as PDF{" "}</button>
              </div>
            </div>
            <button id="delete-selected-btn" className="btn-delete" type="button" disabled>{" "}Delete Selected{" "}</button>
            {' '}
            <button id="edit-selected-btn" className="btn-upload" type="button" disabled>{" "}Edit Selected{" "}</button>
            {' '}
            <button id="downloadWholePDFBtn" className="btn-download" type="button">{" "}Download whole page as PDF{" "}</button>
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
