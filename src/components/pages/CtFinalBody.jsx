'use client';

// CtFinal page markup. Converted from public/legacy/ctfinal.body.html.
// Behaviour lives in public/legacy/ctfinal.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/ctfinal.css';
import '@/styles/navbar.css';
import CommonNavbar from '@/components/CommonNavbar';

export default function CtFinalBody() {
  return (
    <>
      <h1 className="page-title">Slagging Data Table</h1>
      <div className="toolbar-wrapper">
        <div className="toolbar">
          <div className="left-group">
            <button className="btn-template" id="btn-download-template">Download Template</button>
            <button id="btn-upload" className="btn-upload" type="button">📤 Upload New Data</button>
            {' '}
            <input type="file" id="fileInput" accept=".xlsx,.xls" />
          </div>
          <div className="right-group">
            <div className="download-dropdown">
              <button id="download-selected-btn" className="btn-download" disabled>Download Selected ▾</button>
              <div id="download-menu" className="dropdown-menu" aria-hidden="true">
                <button type="button" onClick={() => window.downloadSelected('excel')}>Download as Excel</button>
                {' '}
                <button type="button" onClick={() => window.downloadSelected('pdf')}>Download as PDF</button>
              </div>
            </div>
            <button id="delete-selected-btn" className="btn-delete" disabled>Delete Selected</button>
            {' '}
            <button id="downloadWholePDFBtn" className="btn-download">Download whole page as PDF</button>
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
      <CommonNavbar items={[{"target":"coal_table.html","label":"Coal Properties"},{"target":"slagging_coal_page.html","label":"Calculation"},{"target":"model.html","label":"Model"}]} />
    </>
  );
}
