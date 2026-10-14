'use client';

// ModelCompare page markup. Converted from public/legacy/model_compare.body.html.
// Behaviour lives in public/legacy/model_compare.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/model_compare.css';
import CommonNavbar from '@/components/CommonNavbar';

export default function ModelCompareBody() {
  return (
    <>
      <CommonNavbar items={[{"target":"coal_table.html","label":"Coal Properties"},{"target":"slagging_coal_page.html","label":"Calculation"},{"target":"model.html","label":"Cost Optimization Model"},{"target":"model_compare.html","label":"Compare Models","active":true}]} logoutId="logoutBtn" />
      <main>
        <div className="card">
          <h2 className="page-title">Compare Models</h2>
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#02126e", marginBottom: "10px", letterSpacing: "0.03em" }}>UPLOAD DATASET</div>
            <div className="toolbar">
              <div className="upload-area" id="uploadArea">
                <div className="upload-icon">📤</div>
                <div className="upload-text">
                  <strong>Upload CSV File or Excel File</strong>
                  <div className="upload-sub">{"Drag & drop or click to browse"}</div>
                </div>
                <input type="file" id="csvFile" accept=".csv,.xlsx,.xls" />
              </div>
              <div className="small-muted" id="fileNameText">No file selected</div>
              <div className="train-mode-toggle">
                <label className="mode-option">
                  <input type="radio" name="trainMode" value="new" defaultChecked />
                  {' '}
                  <span>New Data Only</span>
                </label>
                {' '}
                <label className="mode-option">
                  <input type="radio" name="trainMode" value="append" />
                  {' '}
                  <span>Old + New Data</span>
                </label>
              </div>
              <button id="downloadCSVTemplateBtn">CSV Template</button>
              {' '}
              <button id="downloadExcelTemplateBtn">Excel Template</button>
            </div>
          </div>
          <div className="section-divider"></div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
            <button id="runBtn">▶ Run Comparison</button>
            <div id="loader" className="loader">Running models...</div>
          </div>
          <div id="progressArea" className="progress-grid" style={{ display: "none" }}></div>
          <div className="section-divider"></div>
          <div className="trainingset-section">
            <div className="trainingset-header">
              <h3>
                🗂️ Current Training Dataset{" "}
                <span id="trainingSetCount" style={{ fontSize: "13px", color: "#6b7280", fontWeight: "400" }}></span>
              </h3>
              <div className="trainingset-controls">
                <input type="text" id="trainingSetSearch" placeholder="Search rows…" onInput={() => window.filterTrainingSet()} />
                {' '}
                <button id="refreshDatasetBtn" style={{ background: "linear-gradient(180deg,#02126e,#0027a7)" }}>↻ Refresh</button>
                {' '}
                <button id="exportTrainingSetBtn" style={{ background: "linear-gradient(180deg,#0f7a4e,#14a367)" }}>⬇ Export CSV</button>
              </div>
            </div>
            <div className="trainingset-scroll-wrap" id="trainingSetWrap">
              <div className="trainingset-empty" id="trainingSetEmpty">
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📭</div>
                {" "}No training dataset found on server.
                <br />
                <span style={{ fontSize: "12px" }}>Upload a file and run comparison to populate it.</span>
              </div>
              <table id="trainingSetTable" style={{ display: "none" }}>
                <thead id="trainingSetHead"></thead>
                <tbody id="trainingSetBody"></tbody>
              </table>
            </div>
          </div>
          <div className="section-divider"></div>
          <div className="comparison-section">
            <div className="comparison-header">
              <h3>🧠 Current Model With its Comparison</h3>
              <div id="comparisonCacheNote" className="comparison-cache-note">No comparison cached yet.</div>
            </div>
            <div id="activeModelBox" className="current-model-box">
              <div>
                <div className="label">Currently Active Model</div>
                <div id="activeModelName" className="value">Loading...</div>
              </div>
              <div id="activeModelBadge" className="badge loading">loading</div>
            </div>
            <div id="comparisonResultsEmpty" className="trainingset-empty comparison-empty">
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📊</div>
              {" "}Run a comparison to load the results table here.{" "}
            </div>
            <div id="result"></div>
            <div id="testSetSection" style={{ display: "none" }} className="testset-section">
              <div className="testset-header">
                <h3>
                  📋 Test Set Used by Models{" "}
                  <span id="testSetCount" style={{ fontSize: "13px", color: "#6b7280", fontWeight: "400" }}></span>
                </h3>
                <div className="testset-controls">
                  <input type="text" id="testSetSearch" placeholder="Search rows…" onInput={() => window.filterTestSet()} />
                  {' '}
                  <button id="exportTestSetBtn" style={{ background: "linear-gradient(180deg,#0f7a4e,#14a367)" }}>⬇ Export CSV</button>
                </div>
              </div>
              <div className="testset-scroll-wrap">
                <table id="testSetTable">
                  <thead id="testSetHead"></thead>
                  <tbody id="testSetBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
