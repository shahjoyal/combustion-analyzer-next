'use client';

// CoalBlendSimulation page markup. Converted from public/legacy/coal_blend_simulation.body.html.
// Behaviour lives in public/legacy/coal_blend_simulation.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/coal_blend_simulation.css';

export default function CoalBlendSimulationBody() {
  return (
    <>
      <div className="navbar">
        <img src="/images/abhitech-logo.png" alt="Company Logo" />
        <h1>COAL BLENDING RATIO</h1>
        <div className="nav-buttons">
          <button onClick={() => window.location.href='slagging_coal_page.html'}>Calculation</button>
          {' '}
          <button onClick={() => window.location.href='coal_table.html'}>Coal Properties</button>
          {' '}
          <button onClick={() => window.location.href='model.html'}>Model</button>
          {' '}
          <button className="logout-btn" onClick={() => window.logoutUser()}>Logout</button>
        </div>
      </div>
      <div style={{ marginTop: "8px" }}>
        <input type="file" id="excelFile" accept=".xlsx,.xls,.csv" style={{ display: "none" }} />
        {' '}
        <label htmlFor="excelFile" className="upload-btn">Upload Excel</label>
      </div>
      <div id="loader">Loading... please wait</div>
      <button id="downloadPDF" className="icon-btn" title="Download page as PDF">⬇️</button>
      <div className="main-container">
        <div className="mills-grid" id="millsGrid">
          <div></div>
          <div className="mill green">MILL-A</div>
          <div className="mill green">MILL-B</div>
          <div className="mill green">MILL-C</div>
          <div className="mill green">MILL-D</div>
          <div className="mill green">MILL-E</div>
          <div className="mill green">MILL-F</div>
          <div className="mill gcv">GCV(Kcal/kg)</div>
          <div className="mill cost-head">Cost/MT</div>
          <div className="mill">
            <select className="dropdown" id="coalDrop1"></select>
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="1" data-mill="0" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="1" data-mill="1" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="1" data-mill="2" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="1" data-mill="3" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="1" data-mill="4" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="1" data-mill="5" placeholder="%" />
          </div>
          <div className="mill">
            <div id="gcvBox1" className="gcv-box">--</div>
          </div>
          <div className="mill">
            <input type="text" id="costBox1" className="cost-input" placeholder="Cost/MT" />
          </div>
          <div className="mill">
            <select className="dropdown" id="coalDrop2"></select>
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="2" data-mill="0" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="2" data-mill="1" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="2" data-mill="2" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="2" data-mill="3" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="2" data-mill="4" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="2" data-mill="5" placeholder="%" />
          </div>
          <div className="mill">
            <div id="gcvBox2" className="gcv-box">--</div>
          </div>
          <div className="mill">
            <input type="text" id="costBox2" className="cost-input" placeholder="Cost/MT" />
          </div>
          <div className="mill">
            <select className="dropdown" id="coalDrop3"></select>
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="3" data-mill="0" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="3" data-mill="1" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="3" data-mill="2" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="3" data-mill="3" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="3" data-mill="4" placeholder="%" />
          </div>
          <div className="mill">
            <input type="text" className="percentage-input" data-row="3" data-mill="5" placeholder="%" />
          </div>
          <div className="mill">
            <div id="gcvBox3" className="gcv-box">--</div>
          </div>
          <div className="mill">
            <input type="text" id="costBox3" className="cost-input" placeholder="Cost/MT" />
          </div>
          <div className="mill coal-flow">Coal Flow(TPH)</div>
          <div className="mill">
            <input type="text" className="flow-input" data-mill="0" placeholder="TPH" />
          </div>
          <div className="mill">
            <input type="text" className="flow-input" data-mill="1" placeholder="TPH" />
          </div>
          <div className="mill">
            <input type="text" className="flow-input" data-mill="2" placeholder="TPH" />
          </div>
          <div className="mill">
            <input type="text" className="flow-input" data-mill="3" placeholder="TPH" />
          </div>
          <div className="mill">
            <input type="text" className="flow-input" data-mill="4" placeholder="TPH" />
          </div>
          <div className="mill">
            <input type="text" className="flow-input" data-mill="5" placeholder="TPH" />
          </div>
          <div></div>
          <div></div>
          <div className="mill aft-head">AFT(°C)</div>
          <div className="mill aft" data-mill="0">--</div>
          <div className="mill aft" data-mill="1">--</div>
          <div className="mill aft" data-mill="2">--</div>
          <div className="mill aft" data-mill="3">--</div>
          <div className="mill aft" data-mill="4">--</div>
          <div className="mill aft" data-mill="5">--</div>
          <div></div>
          <div></div>
        </div>
        <div className="summary-table" aria-hidden="false">
          <div className="summary-cell summary-header">Generation (MW)</div>
          <div className="summary-cell">
            <input id="generation" className="generation-input" placeholder="MW" />
          </div>
          <div className="summary-cell summary-header">Total Coal Flow(TPH)</div>
          <div className="summary-cell" id="totalFlow">0</div>
          <div className="summary-cell summary-header">Average GCV(Kcal/kg)</div>
          <div className="summary-cell" id="avgGCV">0</div>
          <div className="summary-cell summary-header">Average AFT(°C)</div>
          <div className="summary-cell" id="avgAFT">--</div>
          <div className="summary-cell summary-header">Heat Rate(Kcal/kWh)</div>
          <div className="summary-cell" id="heatRate">--</div>
          <div className="summary-cell summary-header">Cost/MT</div>
          <div className="summary-cell" id="COSTRATE">--</div>
        </div>
      </div>
    </>
  );
}
