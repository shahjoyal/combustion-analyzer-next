'use client';

// DateWise page markup. Converted from public/legacy/date.body.html.
// Behaviour lives in public/legacy/date.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/date.css';
import '@/styles/navbar.css';
import CommonNavbar from '@/components/CommonNavbar';

export default function DateWiseBody() {
  return (
    <>
      <button id="downloadPDF" className="icon-btn" title="Download page as PDF">⬇️</button>
      <div className="content">
        <div className="left-container">
          <div className="control-card">
            <div className="control-title">Coal Data Source</div>
            <div className="control-row">
              <button id="uploadBtn" className="primary-btn">Upload Excel</button>
              {' '}
              <input type="file" id="excelFileInput" accept=".xlsx,.xls" style={{ display: "none" }} />
              {' '}
              <button id="templateBtn" className="secondary-btn">Download Template</button>
            </div>
            <div className="control-row">
              <label>Date</label>
              {' '}
              <select id="dateSelect" className="control-select"></select>
            </div>
            <div id="uploadStatus" className="helper-text"></div>
          </div>
          <form id="coalForm">
            <div id="coalBlends">
              <h2>Coal Type</h2>
              <div className="blend-row"></div>
            </div>
            <button type="button" className="add-blend-btn" onClick={() => window.addBlend()}>Add Coal</button>
            <div id="totalRangeContainer">
              <label>
                Total Current Range:
                <span id="totalRange"></span>
                %
              </label>
            </div>
            <div className="checkbox-card" id="checkboxCard">
              <h3>Operational Parameters</h3>
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
          </form>
        </div>
        <div className="right-container" id="resultsContainer">
          <button id="blendPropertiesBtn" className="blendProperties" onClick={() => window.openBlendModal()} style={{ display: "none" }}>Simulated AFB Coal Elemental Analysis</button>
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
      <CommonNavbar items={[{"target":"coal_table.html","label":"Coal Properties"},{"target":"slagging_coal_page.html","label":"Calculation"},{"target":"model.html","label":"Cost Optimization Model","title":"Model"},{"target":"date.html","label":"Date Wise Analysis","title":"About"},{"target":"model_compare.html","label":"Compare Models"}]} />
    </>
  );
}
