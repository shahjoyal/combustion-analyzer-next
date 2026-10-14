'use client';

// Slagging page markup. Converted from public/legacy/slagging_coal_page.body.html.
// Behaviour lives in public/legacy/slagging_coal_page.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/slagging_coal_page.css';
import '@/styles/navbar.css';
import CommonNavbar from '@/components/CommonNavbar';

const BLEND_ROW_TEMPLATE = `
  <div class="blend">
    <label>Coal:</label>
    <select>
      <option value="">Select Coal Type</option>
    </select>
    <input type="number" placeholder="Current Range (%)">
    <button type="button" class="remove-blend-btn">X</button>
    <button type="button" class="properties-btn">Properties</button>
    <div class="properties"></div>
  </div>
`;

export default function SlaggingBody() {
  return (
    <>
      <div className="content">
        <div className="left-container">
          <form id="coalForm">
            <div className="coal-selection-panel">
              <div id="coalBlends">
                <div className="unit-capacity" style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", width: "100%", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label htmlFor="unitCapacity" style={{ fontWeight: "600", fontSize: "13px" }}>Unit Capacity:</label>
                    {' '}
                    <select id="unitCapacity" name="unitCapacity" style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px" }}>
                      <option value="">Select Unit Capacity</option>
                      <option value="150">150 MW</option>
                      <option value="210">210 MW</option>
                      <option value="250">250 MW</option>
                      <option value="300">300 MW</option>
                      <option value="500">500 MW</option>
                      <option value="600">600 MW</option>
                      <option value="660_SC">660 MW (Super Critical)</option>
                      <option value="700_SC">700 MW (Super Critical)</option>
                      <option value="800_860_SC">800–860 MW (Super Critical)</option>
                      <option value="1000_SC">1000 MW (Super Critical)</option>
                    </select>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                    <label htmlFor="firingType" style={{ fontWeight: "600", fontSize: "13px" }}>Type of Firing:</label>
                    {' '}
                    <select id="firingType" name="firingType" style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px" }}>
                      <option value="">Select Firing Type</option>
                      <option value="front_fired">Front</option>
                      <option value="tangential_fired">Tangential</option>
                      <option value="front_and_rear_fired">Front and Rear</option>
                    </select>
                  </div>
                </div>
                <h2>Coal Type</h2>
                <div className="blend-row"></div>
                {/* <template> content must live in template.content (the script clones it),
                    so it is injected as HTML rather than rendered as React children. */}
                <template
                  id="blendRowTemplate"
                  dangerouslySetInnerHTML={{ __html: BLEND_ROW_TEMPLATE }}
                />
              </div>
              <button type="button" className="add-blend-btn" onClick={() => window.addBlend()}>Add Coal</button>
              <div id="totalRangeContainer">
                <label>
                  Total Current Range:
                  <span id="totalRange"></span>
                  %
                </label>
              </div>
            </div>
            <div className="operational-parameters-panel">
              <div className="checkbox-card" id="checkboxCard">
                <h3>Operational Parameters</h3>
                <span className="toggle-icon">▾</span>
              </div>
              <div className="checkbox-container hidden" id="checkboxContainer">
                <table className="checkbox-table">
                  <tbody>
                    <tr>
                      <td>
                        <input type="checkbox" name="question1" value="Coal Mill Fineness" />
                      </td>
                      <td>Coal Mill Fineness (+) 50 mesh more than 0.2%</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question2" value="Coal Mill DPT Normal" />
                      </td>
                      <td>Coal Mill DPT Result abnormal</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question3" value="Preventive Maintenance" />
                      </td>
                      <td>Coal Mill preventive maintenance delayed by more than 20 days</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question4" value="O2 at APH O/L" />
                      </td>
                      <td>O₂ at APH O/L less than Design O₂ at APH O/L</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question5" value="SADC Operative" />
                      </td>
                      <td>SADC operation faulty</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question6" value="FG Temp Difference" />
                      </td>
                      <td>
                        Difference in FG temp. between Left and Right zones at RH and SH zones more than 50°C
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question7" value="APH O/L FG Temp" />
                      </td>
                      <td>
                        Corrected APH O/L FG temp greater than 25 deg. + Design temp at APH O/L
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question8" value="Overhaul Conducted" />
                      </td>
                      <td>Last Overhaul conducted before 1.5 years from current date</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question9" value="Soot Blowing Cycle" />
                      </td>
                      <td>Water wall Soot Blowing Cycle not operated fully</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question10" value="LSRB" />
                      </td>
                      <td>LRSB not operated as per schedule</td>
                    </tr>
                    <tr>
                      <td>
                        <input type="checkbox" name="question11" value="FTM temperature" />
                      </td>
                      <td>{"FTM indicating temperatures > 1300 °C"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button type="button" className="calculate-properties-btn" onClick={() => { window.calculateWeightedAverage(); window.callConsumeTrial(); }}>Calculate</button>
            </div>
          </form>
        </div>
        <div className="right-container" id="resultsContainer">
          <button id="downloadPDF" className="icon-btn hidden" title="Download page as PDF">⬇️</button>
          {' '}
          <button id="blendPropertiesBtn" className="blendProperties" onClick={() => window.openBlendModal()} style={{ display: "none" }}>Simulated AFB Coal Elemental Analysis</button>
          <div className="car-dashboard-panel hidden" id="carDashboardPanel">
            <div className="car-dashboard-cluster" id="dashboardCluster">
              <div className="car-gauge-wrap" id="fspGaugeWrap">
                <div className="car-gauge-dial" id="fspGaugeChart"></div>
              </div>
              <div className="car-center-stack" id="carCenterStack"></div>
              <div className="car-gauge-wrap" id="ffftsGaugeWrap">
                <div className="car-gauge-dial" id="ffftsGaugeChart"></div>
              </div>
            </div>
          </div>
          <div id="tableContainer" style={{ width: "100%", marginTop: "8px" }}></div>
          <div id="ternaryCardOuter" className="ternary-card-outer hidden">
            <div id="ternaryPlotWrapper" className="ternary-plot-wrapper">
              <div id="ternary-plot" style={{ width: "100%", height: "100%" }}></div>
            </div>
            <div id="advancedDashboard" className="advanced-dashboard hidden">
              <div className="advanced-dashboard-grid">
                <div className="advanced-card">
                  <div className="advanced-card-title">Compositional Radar</div>
                  <div id="radarChart" className="advanced-card-chart"></div>
                </div>
                <div className="advanced-card">
                  <div className="advanced-card-title">Ash Fusion Characteristics</div>
                  <div id="ashFusionChart" className="advanced-card-chart"></div>
                </div>
                <div className="advanced-card cube-card">
                  <div className="advanced-card-title">Coal AFT Cube View</div>
                  <div id="coalCubeChart" className="advanced-card-chart"></div>
                </div>
              </div>
              <div className="advanced-key-indicators" id="advancedKeyIndicators">
                <div className="advanced-indicator-card">
                  <div className="advanced-indicator-icon">🔥</div>
                  <div className="advanced-indicator-body">
                    <div className="advanced-indicator-value" id="kiFluidTemp">N/A</div>
                    <div className="advanced-indicator-label">Fluid Temp (FT)</div>
                  </div>
                </div>
                <div className="advanced-indicator-card">
                  <div className="advanced-indicator-icon">Ⓢ</div>
                  <div className="advanced-indicator-body">
                    <div className="advanced-indicator-value" id="kiTotalSulfur">N/A</div>
                    <div className="advanced-indicator-label">Total Sulfur</div>
                  </div>
                </div>
                <div className="advanced-indicator-card">
                  <div className="advanced-indicator-icon">⚠️</div>
                  <div className="advanced-indicator-body">
                    <div className="advanced-indicator-value" id="kiSlagging">N/A</div>
                    <div className="advanced-indicator-label">Slagging (FSP)</div>
                  </div>
                </div>
                <div className="advanced-indicator-card">
                  <div className="advanced-indicator-icon">☁️</div>
                  <div className="advanced-indicator-body">
                    <div className="advanced-indicator-value" id="kiFouling">N/A</div>
                    <div className="advanced-indicator-label">Fouling (FFFTS)</div>
                  </div>
                </div>
                <div className="advanced-indicator-card">
                  <div className="advanced-indicator-icon">🌡️</div>
                  <div className="advanced-indicator-body">
                    <div className="advanced-indicator-value" id="kiIDT">N/A</div>
                    <div className="advanced-indicator-label">Initial Deformation (IDT)</div>
                  </div>
                </div>
                <div className="advanced-indicator-card">
                  <div className="advanced-indicator-icon">⚙️</div>
                  <div className="advanced-indicator-body">
                    <div className="advanced-indicator-value" id="kiOmScore">N/A</div>
                    <div className="advanced-indicator-label">{"O&M Score"}</div>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" id="advancedViewToggleBtn" className="advanced-view-corner-btn" title="Switch between the ternary plot and the advanced view">
              <span className="advanced-view-corner-btn-icon">✦</span>
              <span className="advanced-view-corner-btn-label">Advanced View</span>
            </button>
          </div>
        </div>
      </div>
      <div id="blendPropertiesModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => window.closeBlendModal()}>×</span>
          <div id="blendValues"></div>
        </div>
      </div>
      <div id="coalPropertiesModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Elemental Analysis</h3>
            <span className="close" onClick={() => window.closeModal()}>×</span>
          </div>
          <div id="coalPropertiesContent"></div>
        </div>
      </div>
      <CommonNavbar items={[{"target":"coal_table.html","label":"Coal Properties"},{"target":"slagging_coal_page.html","label":"Calculation"},{"target":"model.html","label":"Cost Optimization Model","title":"Model"},{"target":"model_compare.html","label":"Compare Models","title":"Contact"}]} />
    </>
  );
}