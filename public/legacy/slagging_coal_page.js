function addBlend() {
    const MAX_COALS = 10; // <-- increased from 5 to 10
    const currentCoals = document.querySelectorAll('.blend').length;

    if (currentCoals >= MAX_COALS) {
        alert("You can only add up to 10 coal types.");
        return;
    }

    const index = currentCoals;
    const template = document.getElementById('blendRowTemplate');
    const blendDiv = template.content.firstElementChild.cloneNode(true);

    const label = blendDiv.querySelector('label');
    const select = blendDiv.querySelector('select');
    const rangeInput = blendDiv.querySelector('input[type="number"]');
    const removeBtn = blendDiv.querySelector('.remove-blend-btn');
    const propertiesBtn = blendDiv.querySelector('.properties-btn');
    const propertiesDiv = blendDiv.querySelector('.properties');

    label.setAttribute('for', `coal${index}`);
    select.id = `coal${index}`;
    select.name = `coal${index}`;
    rangeInput.id = `currentrange${index}`;
    propertiesDiv.id = `properties${index}`;

    removeBtn.addEventListener('click', () => removeBlend(removeBtn));
    // Look up this row's *current* position at click time (via blendDiv),
    // instead of capturing `index` now -- so this stays correct even after
    // earlier rows are removed and everything gets renumbered below.
    propertiesBtn.addEventListener('click', () => {
        const liveIndex = Array.from(document.querySelectorAll('.blend')).indexOf(blendDiv);
        fetchCoalProperties(liveIndex);
    });
    rangeInput.addEventListener("input", updateTotalRange);

    const blendRow = document.querySelector(".blend-row");
    blendRow.appendChild(blendDiv);

    populateDropdown(select);
    updateTotalRange();
    sizeBlendRowVisible();
}

// Keep every remaining row's id/name/for/properties-id in sync with its
// actual position in the list. Needed because removeBlend() deletes a row
// from the middle without shifting the rest -- every downstream function
// (calculateWeightedAverage, AFT lookups, etc.) assumes #coal{index} matches
// the row's position, so after any removal the survivors must be relabeled.
function renumberBlends() {
    document.querySelectorAll('.blend').forEach((blend, index) => {
        const label = blend.querySelector('label');
        const select = blend.querySelector('select');
        const rangeInput = blend.querySelector('input[type="number"]');
        const propertiesDiv = blend.querySelector('.properties');

        if (label) label.setAttribute('for', `coal${index}`);
        if (select) {
            select.id = `coal${index}`;
            select.name = `coal${index}`;
        }
        if (rangeInput) rangeInput.id = `currentrange${index}`;
        if (propertiesDiv) propertiesDiv.id = `properties${index}`;
    });
}

// Show exactly 2 coal rows in the list; anything beyond that scrolls
// internally inside .blend-row instead of growing the page.
function sizeBlendRowVisible() {
    const blendRow = document.querySelector('.blend-row');
    const firstBlend = blendRow ? blendRow.querySelector('.blend') : null;
    if (!blendRow || !firstBlend) return;

    const rowHeight = firstBlend.getBoundingClientRect().height;
    if (!rowHeight) return;

    const VISIBLE_ROWS = 2;
    const gapValue = parseFloat(getComputedStyle(blendRow).rowGap || getComputedStyle(blendRow).gap) || 0;
    blendRow.style.maxHeight = Math.ceil(rowHeight * VISIBLE_ROWS + gapValue * (VISIBLE_ROWS - 1)) + 'px';
}

// Show exactly 4 operational-parameter rows; anything beyond that scrolls
// internally inside #checkboxContainer instead of growing the page.
function sizeCheckboxRowsVisible() {
    const container = document.getElementById('checkboxContainer');
    const firstRow = container ? container.querySelector('.checkbox-table tbody tr') : null;
    if (!container || !firstRow) return;

    const rowHeight = firstRow.getBoundingClientRect().height;
    if (!rowHeight) return;

    const VISIBLE_ROWS = 4;
    const cs = getComputedStyle(container);
    const verticalPadding = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    container.style.maxHeight = Math.ceil(rowHeight * VISIBLE_ROWS + verticalPadding) + 'px';
}

window.addEventListener('resize', () => {
    sizeBlendRowVisible();
    const checkboxContainer = document.getElementById('checkboxContainer');
    if (checkboxContainer && !checkboxContainer.classList.contains('hidden')) {
        sizeCheckboxRowsVisible();
    }
});

        function updateTotalRange() {
            totalCurrentRange = 0;
            const ranges = document.querySelectorAll('input[id^="currentrange"]');
            ranges.forEach(range => {
                const rangeValue = parseFloat(range.value) || 0;
                totalCurrentRange += rangeValue;
            });
            document.getElementById("totalRange").textContent = totalCurrentRange;

        }

       
        
        document.addEventListener("DOMContentLoaded", function () {
            const checkboxCard = document.getElementById("checkboxCard");
            const checkboxContainer = document.getElementById("checkboxContainer");
            const toggleIcon = document.querySelector(".toggle-icon");
        
            // Toggle click event
            checkboxCard.addEventListener("click", function () {
                if (checkboxContainer.classList.contains("hidden")) {
                    checkboxContainer.classList.remove("hidden");
                    checkboxContainer.style.display = "block";
                    toggleIcon.style.transform = "rotate(180deg)";
                    sizeCheckboxRowsVisible();
                } else {
                    checkboxContainer.classList.add("hidden");
                    setTimeout(() => (checkboxContainer.style.display = "none"), 300);
                    toggleIcon.style.transform = "rotate(0deg)";
                }
            });
        
        });

        
        
        function getSelectedCheckboxes() {
            const checkboxes = document.querySelectorAll('.checkbox-container input[type="checkbox"]:checked');
            let selectedValues = [];
            checkboxes.forEach((checkbox) => {
                selectedValues.push(checkbox.name); // Use `name` instead of `value`
            });
            return selectedValues;
        }
        
        function openBlendModal() {
            document.getElementById("blendPropertiesModal").style.display = "block";
        }
        
        function closeBlendModal() {
            document.getElementById("blendPropertiesModal").style.display = "none";
        }
        var samples = [];
        let predictedAFT = 0;
        // Shared between _initResultsPanelInteractivity() (wires the
        // toggle button + click-to-expand once) and calculateWeightedAverage()
        // (refreshes these each run) — see both for context.
        let showingAdvancedDashboard = false;
        let advancedChartsDrawn = false;
        let advDashData = null;
 
        

        // ----- size configuration (change numbers to taste) -----
// TERNARY_WIDTH/TERNARY_HEIGHT and GAUGE_H used to be applied as inline
// styles from here; those fixed values now live in CSS instead
// (.ternary-plot-wrapper, .car-gauge-dial) since they never change per
// calculation. GAUGE_W is still used below — it's also passed into
// buildCarGaugeSVG() to size the SVG's internal viewBox math, not just
// as a DOM style.
const MARKER_SIZE = 8;       // ternary marker size (smaller if plot is tiny)

const GAUGE_W = 210;         // px for gauge dial width (track-style gauge, ported from reference viewBox 520x560)
const OVERALL_GRAPH_WIDTH = 480; // px for the overall bar (was 550)
        async function calculateWeightedAverage() {

            let totalCurrentRange = 0;
            const ranges = document.querySelectorAll('input[id^="currentrange"]');
            
            ranges.forEach(range => {
                const rangeValue = parseFloat(range.value) || 0;
                totalCurrentRange += rangeValue;
            });

            if (totalCurrentRange !== 100) {
                alert("Total percentage must be exactly 100 to proceed!");
                return;
            }
            const rightContainerDiv = document.querySelector("#resultsContainer");
            let blendValuesDiv = document.getElementById("blendValues");
            let blendPropertiesBtn = document.getElementById("blendPropertiesBtn");
            
        
            if (!rightContainerDiv) {
                console.error("Element #resultsContainer not found.");
                return;
            }
            if (!blendValuesDiv) {
                console.error("Element #blendValues not found.");
                return;
            }
        
            let totalPercentage = 0;
            let propertySums = {
                "SiO₂": 0, "Al₂O₃": 0, "Fe₂O₃": 0, "CaO": 0, "MgO": 0, 
                "Na₂O": 0, "K₂O": 0, "TiO₂": 0, "SO₃": 0, "P₂O₅": 0,
                "Mn₃O₄":0,"Sulphur (S)":0, "GCV": 0
        
            };
        
            const blends = document.querySelectorAll('.blend');
        
            blends.forEach((blend, index) => {
                const selectedCoal = document.querySelector(`#coal${index}`).value;
                const currentRange = parseFloat(document.querySelector(`#currentrange${index}`).value) || 0;
        
                if (!selectedCoal || currentRange <= 0) return;
        
                const coalInfo = window.coalData.find(coal => coal.id === selectedCoal);
                if (!coalInfo) return;
        
                totalPercentage += currentRange;
        
                for (let prop in propertySums) {
                    function getPropValue(coalInfo, prop) {
  const p = coalInfo.properties || {};
  if (p[prop] !== undefined) return parseFloat(p[prop]) || 0;

  // try ascii version (replace subscript unicode with digits)
  const ascii = prop.replace(/[₂₂₃₄₅₆₇₈₉₀₁]/g, ch => {
    const rev = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return rev[ch] || ch;
  });
  if (p[ascii] !== undefined) return parseFloat(p[ascii]) || 0;

  // try common simple variants
  const simple = ascii.replace(/\s+/g,'');
  if (p[simple] !== undefined) return parseFloat(p[simple]) || 0;

  // try mapping via aliasMap if defined
  if (typeof aliasMap !== 'undefined') {
    const mapped = aliasMap[ascii] || aliasMap[simple] || aliasMap[prop];
    if (mapped && p[mapped] !== undefined) return parseFloat(p[mapped]) || 0;
  }

  return 0;
}

// then inside your loop:
const propValue = getPropValue(coalInfo, prop);
propertySums[prop] += propValue * currentRange;

                    
                }
            });

            if (totalPercentage > 0) {
                // Compute weighted averages
                let SIO = propertySums["SiO₂"] / totalPercentage;
                let ALO = propertySums["Al₂O₃"] / totalPercentage;
                let FEO = propertySums["Fe₂O₃"] / totalPercentage;
                let CAO = propertySums["CaO"] / totalPercentage;
                let MGO = propertySums["MgO"] / totalPercentage;
                let NAO = propertySums["Na₂O"] / totalPercentage;
                let KO = propertySums["K₂O"] / totalPercentage;
                let TIO = propertySums["TiO₂"] / totalPercentage;
                let SO = propertySums["SO₃"] / totalPercentage;
                let PO = propertySums["P₂O₅"] / totalPercentage;
                let S = propertySums["Sulphur (S)"]/totalPercentage;
                let MNO = propertySums["Mn₃O₄"]/totalPercentage;
                
                //let GCV = propertySums["GCV"]/totalPercentage;
                
                const result = await axios.post(
  './calculate-aft',
  {
    values: [
      SIO,  // SiO2
      ALO,  // Al2O3
      FEO,  // Fe2O3
      CAO,  // CaO
      MGO,  // MgO
      NAO,  // Na2O
      KO,   // K2O
      SO,   // SO3
      TIO,
      PO,
      S   // TiO2
    ]
  },
  {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
  }
);

const data = result.data.prediction;


                let checkboxesScore = 0;
                let allQuestionss = ["question1", "question2", "question3", "question4", "question5", "question6", "question7", "question8", "question9", "question10", "question11",];
                let selectedValuess = getSelectedCheckboxes();
                let count = selectedValuess.length; // Get checked checkboxes
        
let scoreMappings = {
    "question1": [9.97, 0],        // 0.5 * 19.94
    "question2": [6.889, 0],       // 0.25 * 27.556
    "question3": [23.80875, 0],    // 0.25 * 95.235
    "question4": [3.315, 0],       // 0.25 * 13.26
    "question5": [12.083, 0],      // 0.5 * 24.166
    "question6": [5.454, 0],       // 0.25 * 21.816
    "question7": [6.2721, 0],      // 0.25 * 25.0884
    "question8": [16.1446, 0],     // 0.25 * 64.5784
    "question9": [18.6817, 0],     // 0.25 * 74.7268
    "question10": [17.9704, 0],    // 0.25 * 71.8816
    "question11": [40.0607, 0]     // 0.5 * 80.1214
};
        
                // Iterate through all checkboxes (checked and unchecked)
                allQuestionss.forEach(question => {
                    let isChecked = selectedValuess.includes(question);
                    checkboxesScore += isChecked ? scoreMappings[question][0] : scoreMappings[question][1];;
                });

                
                console.log("API result:", result.data);
                predictedAFT = result.data.prediction;
                 console.log("predicted AFT:", predictedAFT);
                predictedAFT-=checkboxesScore;
                console.log("count is ",count);
                console.log("checkboxes score is ",checkboxesScore);
                
            console.log("predicted AFT after checkbox:", predictedAFT);
         
            blendValuesDiv.innerHTML = ""; 
            let acidicOxidesAvg = 0;
            let basicOxidesAvg = 0;
            let otherOxidesAvg = 0;
            
        
            if (totalPercentage > 0) {
                let propertiesHTML = `
                                      <table border="1">
                                        <tr>
                                            <th>Property</th>
                                            <th>Value</th>
                                        </tr>`;
                
                for (let prop in propertySums) {
                    let avgValue = propertySums[prop] / totalPercentage;
        
        
                        if (prop === "SiO₂" || prop === "Al₂O₃" || prop === "TiO₂") {
                            acidicOxidesAvg += avgValue;   
                        }
        
                        if (prop === "CaO" || prop === "MgO" || prop === "Na₂O"|| prop === "K₂O") {
                            basicOxidesAvg += avgValue;   
                        }
        
                        if (prop === "Fe₂O₃" || prop === "SO₃" || prop === "P₂O₅" || prop === "Mn₃O₄") {
                            otherOxidesAvg += avgValue;   
                        }
                        
                        
                
                    propertiesHTML += `<tr>
                                           <td><strong>${prop}</strong></td>
                                           <td>${avgValue.toFixed(2)}</td>
                                       </tr>`;
                }
                
                propertiesHTML += "</table>";
        
                console.log("Acidic Value:", acidicOxidesAvg.toFixed(2));
                console.log("Basic Value:", basicOxidesAvg.toFixed(2));
                console.log("other Value:", otherOxidesAvg.toFixed(2));
                
        
            blendValuesDiv.innerHTML = propertiesHTML;
            
            // The download button is now a persistent static element (see
            // the HTML) instead of being destroyed and recreated here —
            // just reveal it.
            const dlBtn = document.getElementById('downloadPDF');
            if (dlBtn) {
                dlBtn.classList.remove('hidden');
                dlBtn.style.zIndex = '9999';
            }
        
            let newSample = {
                acidicOxides: acidicOxidesAvg,
                basicOxides: basicOxidesAvg,
                otherOxides: otherOxidesAvg,
                AFT: predictedAFT
            };
            // Each Calculate click represents a brand-new coal/blend
            // selection, not another point to add alongside previous runs —
            // so replace the sample set entirely rather than accumulating
            // into it. (Previously `samples` was only ever pushed to, so
            // the ternary plot kept every past calculation's point until a
            // full page refresh cleared it.)
            samples = [newSample];
        
                // Calculate test values using formulas
                const T250 = Math.sqrt(
                    ((((0.00835 * SIO) + (0.00601 * ALO) - 0.109) * 10**7) /
                    (2.398 - ((0.0415 * SIO) + (0.0192 * ALO) +
                    (0.027 * FEO) + (0.016 * CAO) - 3.92)))) + 150;
        
                let T250S;
                if (T250 > 1275) T250S = 0;
                else if (T250 < 1200) T250S = 1;
                else T250S = 0.5;
                
                // Base/Acid Ratio test value
                const BART = (FEO + CAO + MGO + NAO + KO) / (SIO + ALO + TIO);
        
                // Base/Acid Ratio score
                let BARS;
                if (BART < 0.5) BARS = 0;
                else if (BART > 1) BARS = 1;
                else BARS = 0.5;

                //Hemispherical temp formula
                HT= predictedAFT -78;

                //Initial Deformatiion Formula
                IDT= predictedAFT-103;
                
                // Slagging Factor test value
                const SF = BART * S;
        
                // Slagging Factor score
                let SFS;
                if (SF < 0.6) SFS = 0;
                else if (SF > 1) SFS = 1;
                else SFS = 0.5;
        
                // Slagging Index test value
                const SIT = (HT + 4 * IDT) / 5;
        
                // Slagging Index score
                let SIS;
                if (SIT > 1343) SIS = 0;
                else if (SIT < 1149) SIS = 1;
                else SIS = 0.5;
        
        
                // Silica % test value
                const SPT = SIO * 100 / (SIO + FEO + CAO + MGO);
                
        
                // Silica % score
                let SPS;
                if (SPT > 82) SPS = 0;
                else if (SPT < 30) SPS = 1;
                else SPS = 0.5;
                
        
                // Iron Calcium ratio test value
                const ICRT = FEO / CAO;
                
        
                // Iron Calcium ratio score
                let ICRS;
                if (ICRT < 0.31) ICRS = 0;
                else if (ICRT > 3) ICRS = 1;
                else ICRS = 0.5;
        
                // Iron plus Calcium test value
                const IPCT = FEO + CAO;
        
                // Iron plus Calcium score
                const IPCS = IPCT < 12 ? 0 : 1;
        
                // Fuel Slagging Potential
                const FSP = Number(T250S) + Number(BARS) + Number(SFS) + Number(SIS) + Number(SPS) + Number(ICRS) + Number(IPCS);
                let FSPD;
                if (FSP < 2) FSPD = "Low";
                else if (FSP > 4) FSPD = "High";
                else FSPD = "Moderate";
                
                //FOULING
                
                // Sodium in Ash test value
                const SIAT = NAO * (46 / 62);
        
                // Sodium in Ash score
                let SIAS;
                if (SIAT < 1) SIAS = 0;
                else if (SIAT > 5) SIAS = 1;
                else SIAS = 0.5;
                
                // Total Alkali test value
                const TAT = (FEO + CAO + MGO + NAO + KO + MNO + SO + PO);
                
                // Total Alkali score
                const TAS = TAT < 2 ? 0 : 1;
        
                // Fouling factor test value
                const FFT = BART * SIAT;
                
        
                // Fouling factor score
                let FFS;
                if (FFT < 0.1) FFS = 0;
                else if (FFT > 0.5) FFS = 1;
                else FFS = 0.5;
                
        
                // Fuel fouling factor total score
                const FFFTS = Number(SIAS) + Number(TAS) + Number(FFS);
                
        
                // Fuel fouling factor total display
                let FFFD;
                if (FFFTS < 1) FFFD = "Low";
                else if (FFFTS > 2) FFFD = "High";
                else FFFD = "Moderate";
        
                let totalScore = FSP + FFFTS;

                let checkboxScore = 0;
                let allQuestions = ["question1", "question2", "question3", "question4", "question5", "question6", "question7", "question8", "question9", "question10", "question11",];
                let selectedValues = getSelectedCheckboxes(); // Get checked checkboxes
        
                let scoreMapping = {
                    "question1": [0.5, 0],  
                    "question2": [0.25,0],
                    "question3": [0.25, 0],
                    "question4": [0.25, 0],
                    "question5": [0.5, 0],
                    "question6": [0.25, 0],
                    "question7": [0.25, 0],
                    "question8": [0.25, 0],
                    "question9": [0.25, 0],
                    "question10": [0.25, 0],
                    "question11": [0.5, 0]
                };
        
                // Iterate through all checkboxes (checked and unchecked)
                allQuestions.forEach(question => {
                    let isChecked = selectedValues.includes(question);
                    checkboxScore += isChecked ? scoreMapping[question][0] : scoreMapping[question][1];
                });
        
                let overallTotal = totalScore + checkboxScore;  
                console.log("Total Score:", overallTotal);
                  
            let FoulingHTML = `
                    <table>
                        <thead>  <tr>
                                    <th colspan="3">Slagging Potential (Results in to Clinker Formation)</th> </tr>
                                <tr>
                                    <th>Slagging Indices</th>
                                    <th>Test Coal</th>
                                    <th>Aggregate Scores</th>
                                </tr>
                            </thead>
                        <tr>
                            <td>T250</td>
                            <td>${T250.toFixed(2)}</td>
                            <td>${T250S}</td>
                        </tr>
                        <tr>
                            <td>Base/Acid Ratio (BART)</td>
                            <td>${BART.toFixed(2)}</td>
                            <td>${BARS}</td>
                        </tr>
                        <tr>
                            <td>Slagging Factor ((B/A ratio * S in coal))</td>
                            <td>${SF.toFixed(2)}</td>
                            <td>${SFS}</td>
                        </tr>
                        <tr>
                            <td>Slagging Index Test</td>
                            <td>${SIT.toFixed(2)}</td>
                            <td>${SIS}</td>
                        </tr>
                        <tr>
                            <td>Silica % Test</td>
                            <td>${SPT.toFixed(2)}</td>
                            <td>${SPS}</td>
                        </tr>
                        <tr>
                            <td>Iron Calcium Ratio Test</td>
                            <td>${ICRT.toFixed(2)}</td>
                            <td>${ICRS}</td>
                        </tr>
                        <tr>
                            <td>Iron + Calcium </td>
                            <td>${IPCT.toFixed(2)}</td>
                            <td>${IPCS}</td>
                        </tr>
                    </table>`;
        
                
        
                let FoulingHTML2 = `<table>
                    <thead>
                        <tr><th colspan="3">Fouling Potential (Requires increased soot blowing)</th></tr>
                        <tr>
                            <th>Fouling Indices</th>
                            <th>Test Coal</th>
                            <th>Aggregate Scores</th>
                        </tr>
                    </thead>
                    <tr><td>Sodium in Ash</td><td>${SIAT.toFixed(2)}</td><td>${SIAS}</td></tr>
                    <tr><td>Alkali Test</td><td>${TAT.toFixed(2)}</td><td>${TAS}</td></tr>
                    <tr><td>Fouling Factor (B/A*Na)</td><td>${FFT.toFixed(2)}</td><td>${FFS}</td></tr>
                </table>`;
                
                // blendPropertiesBtn is a persistent static element now — no
                // need to re-append it each time.

                // ============================================================
                // CAR-DASHBOARD STYLE GAUGES
                // Two circular instrument-cluster dials (Slagging / Fouling), each
                // with its outer-facing bezel ring only (the side facing the center
                // console is left open so the two dials read as one console), plus
                // a vertical "fuel style" score bar in between them. The
                // click-to-reveal-table behaviour on each dial works exactly as
                // before.
                //
                // The panel/cluster/gauge-wrap/center-stack markup is now
                // static HTML (#carDashboardPanel etc.) instead of being
                // built with document.createElement() every Calculate — just
                // reveal it and fill in this run's computed values below.
                // ============================================================

                const carDashboardPanel = document.getElementById('carDashboardPanel');
                carDashboardPanel.classList.remove('hidden');
                const dashboardCluster = document.getElementById('dashboardCluster');

                // Color ranges for FSP (0 to 6)
                const fspColorRanges = {
                    green: [0, 2],
                    yellow: [2, 4],
                    red: [4, 6]
                };

                // Color ranges for FFTS (0 to 3)
                const ffftsColorRanges = {
                    green: [0, 1],
                    yellow: [1, 2],
                    red: [2, 3]
                };

                // ============================================================
                // TRACK-STYLE GAUGE — visual re-skin (v2), based on the
                // reference dashboard supplied (i.html): a rounded horseshoe
                // track that fills like a fuel gauge, a big glowing score
                // number in the middle, the title underneath, and a status
                // pill at the bottom. Same inputs (value, min/max,
                // colorRanges, statusText) and the same output contract (an
                // HTML string dropped into .car-gauge-dial via innerHTML,
                // whose click still opens the table exactly as before).
                //
                // Colour stays exactly as it was functionally: ONE colour
                // for the whole gauge, chosen from the score's zone
                // (green/yellow/red via _statusColor) — not the multi-stop
                // rainbow gradient used in the reference file. Only the
                // shape/animation is borrowed from the reference.
                //
                // Animation: the track fill draws in from empty using an
                // SVG stroke-dashoffset transition (0 -> value), and the
                // big center number counts up from 0 -> value at the same
                // time, driven by animateGaugeReveal() right after the
                // markup is inserted into the DOM.
                // ============================================================

                // ------------------------------------------------------------
                // Gauges (Slagging / Fouling): flat 3-colour zone, exactly as
                // before — green for Low, yellow for Moderate, red for High.
                // ------------------------------------------------------------
                function _statusColor(statusText) {
                    if (statusText === "Low") return "#3ddc84";
                    if (statusText === "High") return "#ff5050";
                    return "#ffd23d"; // Moderate
                }
                function _statusGlow(statusText) {
                    if (statusText === "Low") return "rgba(61, 220, 132, 0.55)";
                    if (statusText === "High") return "rgba(255, 80, 80, 0.55)";
                    return "rgba(255, 210, 61, 0.55)"; // Moderate
                }

                // ------------------------------------------------------------
                // Overall score bar only: a 10-stop colour scale (score is
                // already native 0-10) with linear interpolation between
                // neighbouring stops, so the colour shifts smoothly as the
                // score moves instead of jumping between hard bands.
                // ------------------------------------------------------------
                const SCORE_COLOR_STOPS = [
                    { at: 0,  hex: "#1565C0" }, // Very Low  (0 clamps to the same colour as 1)
                    { at: 1,  hex: "#1565C0" }, // Very Low
                    { at: 2,  hex: "#1E88E5" }, // Low
                    { at: 3,  hex: "#26C6DA" }, // Slight
                    { at: 4,  hex: "#43A047" }, // Moderate
                    { at: 5,  hex: "#8BC34A" }, // Normal
                    { at: 6,  hex: "#FDD835" }, // Elevated
                    { at: 7,  hex: "#FFB300" }, // High
                    { at: 8,  hex: "#F57C00" }, // Very High
                    { at: 9,  hex: "#D32F2F" }, // Severe
                    { at: 10, hex: "#8B0000" }  // Critical
                ];

                function _hexToRgb(hex) {
                    const m = hex.replace('#', '');
                    return {
                        r: parseInt(m.substring(0, 2), 16),
                        g: parseInt(m.substring(2, 4), 16),
                        b: parseInt(m.substring(4, 6), 16)
                    };
                }

                // Returns {r,g,b} for a score already expressed on the 0-10
                // scale, linearly interpolated between the two nearest stops.
                function _scoreToRgb(score10) {
                    const clamped = Math.max(0, Math.min(10, score10));
                    const lowerIdx = Math.floor(clamped);
                    const upperIdx = Math.min(10, Math.ceil(clamped));
                    const lower = _hexToRgb(SCORE_COLOR_STOPS[lowerIdx].hex);
                    if (lowerIdx === upperIdx) return lower;
                    const upper = _hexToRgb(SCORE_COLOR_STOPS[upperIdx].hex);
                    const t = clamped - lowerIdx;
                    return {
                        r: Math.round(lower.r + (upper.r - lower.r) * t),
                        g: Math.round(lower.g + (upper.g - lower.g) * t),
                        b: Math.round(lower.b + (upper.b - lower.b) * t)
                    };
                }

                // Solid colour for the overall score (0-10 scale).
                function _overallScoreColor(score) {
                    const c = _scoreToRgb(score);
                    return `rgb(${c.r}, ${c.g}, ${c.b})`;
                }

                // Same colour, as a soft rgba glow (matches the previous
                // 0.55 alpha used for the zone drop shadows).
                function _overallScoreGlow(score) {
                    const c = _scoreToRgb(score);
                    return `rgba(${c.r}, ${c.g}, ${c.b}, 0.55)`;
                }

                // Left/right horseshoe track paths — geometry ported as-is
                // from the reference dashboard (viewBox 0 0 520 560). The
                // left gauge opens toward the right (mirror=true), the right
                // gauge opens toward the left (mirror=false), so the two
                // dials visually "face" the center score bar between them.
                // Corners are chamfered (straight diagonal cuts) instead of
                // rounded — same overall footprint/bounding box as before,
                // just swapping each "Q" (quarter-circle) corner for an "L"
                // (straight line) to the same end point. Each chamfered
                // corner turns 1 smooth curve into 2 sharp vertices, so the
                // open "C" track now reads as a half-octagon with 4 corners
                // total (2 per side) instead of a rounded horseshoe.
                const _TRACK_D_LEFT  = "M440 470 H210 L60 320 V240 L210 90 H440";
                const _TRACK_D_RIGHT = "M80 470 H310 L460 320 V240 L310 90 H80";

                function buildCarGaugeSVG(value, minValue, maxValue, colorRanges, size, titleText, statusText, mirror, uid, depositionEnabled) {
                    uid = uid || ("g" + Math.random().toString(36).slice(2, 9));
                    // Slagging deposition overlay: only gauges opted in via
                    // depositionEnabled ever show it, and even then only
                    // once the reading itself is in the "High" zone -- it
                    // represents real ash/clinker buildup, so it has no
                    // business appearing on a Low/Moderate reading.
                    const showDeposition = !!depositionEnabled && statusText === "High";
                    const range = maxValue - minValue;
                    const pct = Math.max(0, Math.min(100, ((value - minValue) / range) * 100));

                    // ------------------------------------------------------------
                    // Previous flat 3-band colour logic (green/yellow/red for
                    // Low/Moderate/High) -- kept here commented out in case
                    // we need to fall back to it later.
                    // ------------------------------------------------------------
                    // const zoneColor = _statusColor(statusText);
                    // const zoneGlow = _statusGlow(statusText);

                    // Now reuses the SAME 10-stop colour scale as the overall
                    // score bar (SCORE_COLOR_STOPS / _scoreToRgb), just
                    // rescaled from this gauge's own 0..maxValue range onto
                    // that 0-10 scale first -- so the colour steps every
                    // maxValue/10 units (every 0.6 for the 0-6 slagging
                    // gauge, every 0.3 for the 0-3 fouling gauge) instead of
                    // jumping between 3 hard Low/Moderate/High bands.
                    const score10 = ((value - minValue) / range) * 10;
                    const zoneColor = _overallScoreColor(score10);
                    const zoneGlow = _overallScoreGlow(score10);
                    const den = (maxValue % 1 === 0) ? maxValue : maxValue.toFixed(1);

                    const trackD = mirror ? _TRACK_D_LEFT : _TRACK_D_RIGHT;

                    // The status badge used to sit at a fixed x=260 regardless
                    // of mirroring, but the flat bottom run of the track isn't
                    // centered there: for the mirrored (left) track it's the
                    // segment from x=210 to x=440 (center 325), for the
                    // non-mirrored (right) track it's x=80 to x=310 (center
                    // 195). Centering the badge at a fixed 260 pushed it off
                    // that flat run and let it hang over the diagonal corner
                    // on one side. Center it on the real flat run instead.
                    const statusCenterX = mirror ? 325 : 195;

                    // Scale tick labels (5 evenly spaced points across the real
                    // min..max range, not a fixed 0-100 — unlike the reference,
                    // FSP/FFTS use small numeric ranges like 0-6 / 0-3).
                    const tickVals = [0, 0.25, 0.5, 0.75, 1].map(f => minValue + range * f);
                    const fmt = v => (v % 1 === 0) ? String(v) : v.toFixed(1);
                    // Positioned to sit right at (or just outside) the
                    // track's corner vertices: the two end labels stay at
                    // the open top/bottom ends, and the three middle labels
                    // now hug the chamfer corners at (80,405)/(80,155) —
                    // or their mirrored (440,405)/(440,155) — plus the
                    // vertical edge midpoint, matching the new 4-corner
                    // half-octagon shape instead of the old rounded curve.
                    // Snapped onto the shape's real corner vertices instead
                    // of floating mid-edge: the lower-corner label stays put,
                    // the middle value now sits at the upper elbow corner
                    // (where it used to float in the flat middle of the
                    // vertical run), and the upper value moves to the top
                    // corner where the diagonal meets the top straight edge
                    // (previously unlabeled/empty).
                    const leftTickPos = [
                        { x: 458, y: 505 }, { x: 6, y: 335 }, { x: 6, y: 255 }, { x: 210, y: 55 }, { x: 458, y: 70 }
                    ];
                    const rightTickPos = [
                        { x: 62, y: 505 }, { x: 514, y: 335 }, { x: 514, y: 255 }, { x: 310, y: 55 }, { x: 62, y: 70 }
                    ];
                    const tickPos = mirror ? leftTickPos : rightTickPos;
                    const tickLabels = tickVals.map((v, i) =>
                        `<text class="cg-scale-label" x="${tickPos[i].x}" y="${tickPos[i].y}" text-anchor="middle">${fmt(v)}</text>`
                    ).join("");

                    const titleLines = titleText.split("\n");
                    const titleTspans = titleLines.map((l, i) => `<tspan x="260" dy="${i === 0 ? 0 : 34}">${l}</tspan>`).join("");

                    return `
                    <svg viewBox="0 0 520 560" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
                         style="overflow:visible;" data-uid="${uid}" data-pct="${pct}">
                      <defs>
                        <filter id="cgGlow-${uid}" x="-60%" y="-60%" width="220%" height="220%">
                          <feGaussianBlur stdDeviation="5" result="b"/>
                          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="cgTrackGlow-${uid}" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2"/>
                        </filter>
                        <!-- Same cyan glow used by the overall-score box's
                             border (.car-vertical-scale: border rgba(50,226,241,.82)
                             + box-shadow 0 0 12px rgba(25,203,242,.18)) so the
                             gauge housing reads as part of the same family. -->
                        <filter id="cgBorderGlow-${uid}" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3.5"/>
                        </filter>
                        ${showDeposition ? `<filter id="cgRustShadow-${uid}" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity="0.5"/>
                        </filter>` : ""}
                      </defs>
                      <style>
                        .cg-border-${uid}{fill:none;stroke:rgba(50,226,241,.82);stroke-width:53;stroke-linecap:round;stroke-linejoin:miter;filter:url(#cgBorderGlow-${uid});}
                        .cg-track-${uid}{fill:none;stroke:#0a1c27;stroke-width:42;stroke-linecap:round;stroke-linejoin:miter;filter:url(#cgTrackGlow-${uid});}
                        .cg-track-edge-${uid}{fill:none;stroke:#124b64;stroke-width:48;stroke-linecap:round;stroke-linejoin:miter;opacity:.7;}
                        .cg-active-${uid}{fill:none;stroke:${zoneColor};stroke-width:38;stroke-linecap:round;stroke-linejoin:miter;filter:url(#cgGlow-${uid});transition:stroke-dashoffset 1.15s cubic-bezier(.2,.78,.18,1);}
                        .cg-scale-label{fill:#f4fbff;font-size:25px;font-weight:600;paint-order:stroke;stroke:#02070c;stroke-width:5px;font-family:"Segoe UI",Arial,sans-serif;}
                        .cg-score-${uid}{fill:${zoneColor};font-size:86px;font-weight:750;text-anchor:middle;dominant-baseline:middle;font-family:"Segoe UI",Arial,sans-serif;filter:drop-shadow(0 0 9px ${zoneGlow});transition:filter .4s ease;}
                        .cg-score-suffix{fill:#8097a6;font-size:28px;text-anchor:middle;font-family:"Segoe UI",Arial,sans-serif;}
                        .cg-title{fill:#eef8fd;font-size:27px;font-weight:600;letter-spacing:1px;text-anchor:middle;font-family:"Segoe UI",Arial,sans-serif;text-transform:uppercase;}
                        .cg-status-box-${uid}{fill:rgba(3,10,16,.92);stroke:${zoneColor};stroke-width:2;filter:drop-shadow(0 0 7px ${zoneGlow});}
                        .cg-status-text-${uid}{fill:${zoneColor};font-size:22px;letter-spacing:1px;font-weight:650;text-anchor:middle;font-family:"Segoe UI",Arial,sans-serif;text-transform:uppercase;}
                      </style>

                      <path class="cg-border-${uid}" d="${trackD}"/>
                      <path class="cg-track-edge-${uid}" d="${trackD}"/>
                      <path class="cg-track-${uid}" d="${trackD}"/>
                      <path class="cg-active-${uid} car-gauge-fill-path" data-uid="${uid}" d="${trackD}"/>
                      ${showDeposition ? `<g class="cg-rust-layer" filter="url(#cgRustShadow-${uid})"></g>` : ""}

                      ${tickLabels}

                      <text class="cg-score-${uid} car-gauge-score-text" data-uid="${uid}" data-value="${value}" x="260" y="228">0</text>
                      <text class="cg-score-suffix" x="260" y="294">/${den}</text>
                      <text class="cg-title" x="260" y="335">${titleTspans}</text>

                      <path class="cg-status-box-${uid}" d="M${statusCenterX - 85} 395 H${statusCenterX + 85} L${statusCenterX + 100} 415 L${statusCenterX + 85} 435 H${statusCenterX - 85} L${statusCenterX - 100} 415 Z"/>
                      <text class="cg-status-text-${uid}" x="${statusCenterX}" y="422">${statusText}</text>
                    </svg>`;
                }

                // Kicks off the "fill up from empty" + "count up from 0"
                // animation for one gauge, right after its markup has been
                // inserted into the DOM (so getTotalLength() has real layout
                // to measure). Safe to call multiple times (e.g. re-Calculate)
                // since it re-measures the fresh path each time.
                function animateGaugeReveal(container) {
                    const svg = container.querySelector("svg");
                    if (!svg) return;
                    const pct = parseFloat(svg.getAttribute("data-pct")) || 0;
                    const path = svg.querySelector(".car-gauge-fill-path");
                    const scoreText = svg.querySelector(".car-gauge-score-text");

                    if (path) {
                        const len = path.getTotalLength();
                        path.style.transition = "none";
                        path.style.strokeDasharray = len;
                        path.style.strokeDashoffset = len; // start fully empty
                        // force reflow so the "empty" state actually paints
                        // before we restore the transition + set the target
                        void path.getBoundingClientRect();
                        requestAnimationFrame(() => {
                            path.style.transition = "";
                            requestAnimationFrame(() => {
                                path.style.strokeDashoffset = len * (1 - pct / 100);
                            });
                        });
                    }

                    if (scoreText) {
                        const target = parseFloat(scoreText.getAttribute("data-value")) || 0;
                        const duration = 1100;
                        const start = performance.now();
                        function step(now) {
                            const t = Math.min(1, (now - start) / duration);
                            const eased = 1 - Math.pow(1 - t, 3);
                            scoreText.textContent = (target * eased).toFixed(1);
                            if (t < 1) requestAnimationFrame(step);
                            else scoreText.textContent = target.toFixed(1);
                        }
                        requestAnimationFrame(step);
                    }
                }

                // ------------------------------------------------------------
                // Slagging deposition overlay: when the slagging gauge's
                // status is "High", scatter small irregular rust/clinker
                // chunks along the filled length of the arc (using the
                // path's real on-screen geometry via getPointAtLength, so
                // it always lines up no matter the gauge's rendered size).
                // Purely decorative -- represents ash/clinker actually
                // building up on the tube once slagging potential is high.
                //
                // Built as three stratified bands instead of one uniform
                // scatter, from the rim outward: a dark, near-continuous
                // compacted BASE crust closest to the tube -> an
                // established MIDDLE layer of mixed chunks overlapping
                // outward -> a sparse, pale, still-forming OUTER layer of
                // fresh flecks on the very tip. Each band fades in a beat
                // after the last, so it visually reads as buildup that
                // accumulated in stages rather than appearing all at once.
                // ------------------------------------------------------------
                function _rustBlobPalette(tones) {
                    return tones || ["#8a8378", "#6f6a5e", "#9c8f7c", "#5c4d3f", "#77685a", "#a4917a"];
                }

                // Irregular 6-8 sided lump centered on the origin (later
                // translated + rotated into place along the arc).
                function _rustBlobPath(radius) {
                    const spikes = 6 + Math.floor(Math.random() * 3);
                    let d = "";
                    for (let i = 0; i < spikes; i++) {
                        const angle = (i / spikes) * Math.PI * 2;
                        const r = radius * (0.65 + Math.random() * 0.55);
                        const x = Math.cos(angle) * r;
                        const y = Math.sin(angle) * r;
                        d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
                    }
                    return d + "Z";
                }

                // Places one stratified band of blobs hugging both rims
                // along the arc's filled length. `opts` controls how that
                // band reads (how compacted/fresh it looks):
                //   edgeOffset   distance from centerline (bigger = further out / closer to the visible tip)
                //   radius       [min, max] blob radius
                //   spacing      [min, max] gap between placements along the arc
                //   gapChance    probability of skipping a placement (0 = solid crust, higher = patchier)
                //   jitter       how loosely each blob wobbles off the rim
                //   palette      colour tones for this band
                //   opacity      [min, max]
                //   cracks       probability of a dark crack line through a blob (0 disables)
                function _placeRustBand(group, path, len, filledLen, opts) {
                    const NS = "http://www.w3.org/2000/svg";
                    const palette = opts.palette;
                    let dist = 6;
                    while (dist < filledLen - 4) {
                        const p = path.getPointAtLength(dist);
                        const pAhead = path.getPointAtLength(Math.min(len, dist + 1));
                        const angleDeg = Math.atan2(pAhead.y - p.y, pAhead.x - p.x) * 180 / Math.PI;
                        const nx = Math.cos((angleDeg + 90) * Math.PI / 180);
                        const ny = Math.sin((angleDeg + 90) * Math.PI / 180);
                        const alongJitter = (Math.random() - 0.5) * (opts.jitter * 1.3);

                        [1, -1].forEach(side => {
                            if (Math.random() < opts.gapChance) return;
                            const edgeJitter = (Math.random() - 0.5) * opts.jitter;
                            const offset = side * (opts.edgeOffset + edgeJitter);
                            const cx = p.x + nx * offset + alongJitter;
                            const cy = p.y + ny * offset + alongJitter;

                            const blobRadius = opts.radius[0] + Math.random() * (opts.radius[1] - opts.radius[0]);
                            const blob = document.createElementNS(NS, "path");
                            blob.setAttribute("d", _rustBlobPath(blobRadius));
                            blob.setAttribute("transform", `translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${(Math.random() * 360).toFixed(0)})`);
                            blob.setAttribute("fill", palette[Math.floor(Math.random() * palette.length)]);
                            blob.setAttribute("opacity", (opts.opacity[0] + Math.random() * (opts.opacity[1] - opts.opacity[0])).toFixed(2));
                            blob.setAttribute("class", "cg-rust-blob");
                            group.appendChild(blob);

                            if (opts.cracks > 0 && Math.random() < opts.cracks) {
                                const crackLen = blobRadius * 1.3;
                                const crackAngle = Math.random() * Math.PI * 2;
                                const crack = document.createElementNS(NS, "line");
                                crack.setAttribute("x1", (cx - Math.cos(crackAngle) * crackLen / 2).toFixed(1));
                                crack.setAttribute("y1", (cy - Math.sin(crackAngle) * crackLen / 2).toFixed(1));
                                crack.setAttribute("x2", (cx + Math.cos(crackAngle) * crackLen / 2).toFixed(1));
                                crack.setAttribute("y2", (cy + Math.sin(crackAngle) * crackLen / 2).toFixed(1));
                                crack.setAttribute("stroke", "#2b241c");
                                crack.setAttribute("stroke-width", "1.1");
                                crack.setAttribute("opacity", "0.55");
                                crack.setAttribute("stroke-linecap", "round");
                                group.appendChild(crack);
                            }
                        });

                        dist += opts.spacing[0] + Math.random() * (opts.spacing[1] - opts.spacing[0]);
                    }
                }

                function renderSlaggingDeposition(container) {
                    const svg = container.querySelector("svg");
                    if (!svg) return;
                    const layer = svg.querySelector(".cg-rust-layer");
                    const path = svg.querySelector(".car-gauge-fill-path");
                    if (!layer || !path) return; // not a deposition-enabled gauge, or status isn't High

                    layer.innerHTML = ""; // clear any previous run (re-Calculate)

                    const len = path.getTotalLength();
                    const pct = parseFloat(svg.getAttribute("data-pct")) || 0;
                    const filledLen = len * (pct / 100);
                    if (filledLen < 10) return;

                    const NS = "http://www.w3.org/2000/svg";
                    // The active arc is drawn at stroke-width:38, so its
                    // colour band runs roughly +/-19 either side of the
                    // centerline. Keep every band confined to the rim
                    // area (not the middle), so the colour still shows
                    // clearly down the center -- real ash clings to the
                    // edges of a tube, not the face.
                    const trackHalfWidth = 19;

                    // Base crust -- oldest, darkest, most compacted, sits
                    // closest to the coloured track and covers almost
                    // continuously.
                    const baseGroup = document.createElementNS(NS, "g");
                    _placeRustBand(baseGroup, path, len, filledLen, {
                        edgeOffset: trackHalfWidth - 6,
                        radius: [4, 7],
                        spacing: [5, 8],
                        gapChance: 0.05,
                        jitter: 3,
                        palette: _rustBlobPalette(["#4a3f33", "#5c4d3f", "#443a2e"]),
                        opacity: [0.88, 1],
                        cracks: 0.25
                    });
                    layer.appendChild(baseGroup);

                    // Middle layer -- established, mixed chunks, the
                    // "main body" of the deposit, overlapping outward
                    // from the base crust.
                    const midGroup = document.createElementNS(NS, "g");
                    _placeRustBand(midGroup, path, len, filledLen, {
                        edgeOffset: trackHalfWidth - 2,
                        radius: [3.5, 8],
                        spacing: [7, 13],
                        gapChance: 0.15,
                        jitter: 6,
                        palette: _rustBlobPalette(),
                        opacity: [0.72, 0.98],
                        cracks: 0.3
                    });
                    layer.appendChild(midGroup);

                    // Outer layer -- newest, palest, sparsest flecks
                    // still forming right on the outermost tip; no
                    // cracks yet, too fresh.
                    const outerGroup = document.createElementNS(NS, "g");
                    _placeRustBand(outerGroup, path, len, filledLen, {
                        edgeOffset: trackHalfWidth + 2,
                        radius: [2, 4],
                        spacing: [10, 16],
                        gapChance: 0.35,
                        jitter: 8,
                        palette: _rustBlobPalette(["#a4917a", "#9c8f7c", "#b7a68c"]),
                        opacity: [0.5, 0.82],
                        cracks: 0
                    });
                    layer.appendChild(outerGroup);

                    // Staggered fade-in -- base crust settles in first,
                    // then the middle layer builds on it, then the fresh
                    // outer flecks last, reading as sequential buildup
                    // rather than one layer popping in all at once.
                    [[baseGroup, 1100], [midGroup, 1450], [outerGroup, 1800]].forEach(([g, delay]) => {
                        g.style.opacity = "0";
                        g.style.transition = "opacity .6s ease";
                        requestAnimationFrame(() => {
                            setTimeout(() => { g.style.opacity = "1"; }, delay);
                        });
                    });
                }

                // ---- Slagging dial ----
                // Deposition/rust buildup no longer renders here — the
                // gauge itself now stays clean. The same effect is applied
                // to the overall-score tube instead (see createOverallGraph /
                // renderOverallDeposition below), scaled by FSPD.
                const fspGraphContainer = document.getElementById("fspGaugeChart");
                fspGraphContainer.innerHTML = buildCarGaugeSVG(FSP, 0, 6, fspColorRanges, GAUGE_W, "SLAGGING\nPOTENTIAL", FSPD, true, "fsp", false);
                animateGaugeReveal(fspGraphContainer);

                // ---- central overall-score stack: value floats above the
                // connector's top border line, the bordered box in the middle
                // holds the full-rectangle bottom-up score fill, and the
                // OVERALL SCORE caption + breakdown float below the bottom
                // border line ----
                const carCenterStack = document.getElementById("carCenterStack");

                // ---- Fouling dial ----
                const ffftsGraphContainer = document.getElementById("ffftsGaugeChart");
                ffftsGraphContainer.innerHTML = buildCarGaugeSVG(FFFTS, 0, 3, ffftsColorRanges, GAUGE_W, "FOULING\nPOTENTIAL", FFFD, false, "fffts");
                animateGaugeReveal(ffftsGraphContainer);

                // Table container BELOW the dashboard panel — persistent
                // static element now; clear any leftover FSP/FFTS detail
                // table from a previous calculation before this run's fresh
                // click-to-reveal state takes over below.
                let tableContainer = document.getElementById('tableContainer');
                tableContainer.innerHTML = "";

                // Table toggle logic
                let fspTableVisible = false;
                let fspTableElement = null;

                let ffftsTableVisible = false;
                let ffftsTableElement = null;

                // Function to update table layout dynamically
                function updateTableLayout() {
                    tableContainer.innerHTML = ""; // Clear previous content

                    if (fspTableVisible && fspTableElement) {
                        fspTableElement.style.width = "100%";
                        fspTableElement.style.marginBottom = "10px";
                        tableContainer.appendChild(fspTableElement);
                    }

                    if (ffftsTableVisible && ffftsTableElement) {
                        ffftsTableElement.style.width = "100%";
                        tableContainer.appendChild(ffftsTableElement);
                    }
                }

                // Toggle logic for Slagging Table (click anywhere on the dial).
                // Assigned via .onclick (not addEventListener) because
                // fspGraphContainer is now a persistent element that's
                // reused across Calculate clicks — addEventListener would
                // stack an extra listener (with its own stale FoulingHTML)
                // on every run instead of replacing it.
                fspGraphContainer.onclick = () => {
                    fspTableVisible = !fspTableVisible;

                    if (fspTableVisible) {
                        if (!fspTableElement) {
                            fspTableElement = document.createElement("div");
                            fspTableElement.innerHTML = FoulingHTML;
                        }
                    } else {
                        fspTableElement = null;
                    }

                    updateTableLayout();
                };

                // Toggle logic for Fouling Table (click anywhere on the dial)
                ffftsGraphContainer.onclick = () => {
                    ffftsTableVisible = !ffftsTableVisible;

                    if (ffftsTableVisible) {
                        if (!ffftsTableElement) {
                            ffftsTableElement = document.createElement("div");
                            ffftsTableElement.innerHTML = FoulingHTML2;
                        }
                    } else {
                        ffftsTableElement = null;
                    }

                    updateTableLayout();
                };

                // Makes an element (the score tube's .car-vertical-scale)
                // a real click-and-drag 3D object via CSS rotateX/rotateY,
                // rendered with actual depth thanks to that element's own
                // transform-style:preserve-3d + the perspective set on its
                // parent .car-center-bar-wrap (see CSS). Mouse AND touch
                // drag both rotate it; released position stays put (like
                // picking up and turning a real tube) rather than
                // snapping back; double-click/double-tap resets it.
                function _makeTube3DInteractive(el) {
                    let rotX = -8, rotY = 0; // slight default tilt so it doesn't look flat even before interacting
                    let dragging = false, moved = false;
                    let startX = 0, startY = 0, startRotX = rotX, startRotY = rotY;
                    const MIN_X = -22, MAX_X = 22, MIN_Y = -55, MAX_Y = 55;
                    const MOVE_THRESHOLD = 4;

                    function apply() {
                        el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
                    }

                    function onDown(x, y) {
                        dragging = true;
                        moved = false;
                        startX = x; startY = y;
                        startRotX = rotX; startRotY = rotY;
                        el.style.transition = "none";
                        el.style.cursor = "grabbing";
                        window.addEventListener("mousemove", onMouseMoveWin);
                        window.addEventListener("mouseup", onMouseUpWin);
                    }
                    function onMove(x, y) {
                        if (!dragging) return;
                        const dx = x - startX, dy = y - startY;
                        if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) moved = true;
                        rotY = Math.max(MIN_Y, Math.min(MAX_Y, startRotY + dx * 0.4));
                        rotX = Math.max(MIN_X, Math.min(MAX_X, startRotX - dy * 0.4));
                        apply();
                    }
                    function onUp() {
                        if (!dragging) return;
                        dragging = false;
                        el.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)";
                        el.style.cursor = "grab";
                        window.removeEventListener("mousemove", onMouseMoveWin);
                        window.removeEventListener("mouseup", onMouseUpWin);
                    }
                    // Named (not inline) so they can be removed again in
                    // onUp -- kept scoped to only exist while this specific
                    // tube is actually being dragged, since a fresh tube
                    // (and a fresh _makeTube3DInteractive call) is built on
                    // every Calculate; leaving these permanently on
                    // `window` would leak one more pair of listeners per
                    // recalculation.
                    function onMouseMoveWin(e) { onMove(e.clientX, e.clientY); }
                    function onMouseUpWin(e) { onUp(); }

                    el.addEventListener("mousedown", e => { onDown(e.clientX, e.clientY); e.preventDefault(); });
                    el.addEventListener("touchmove", e => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
                    el.addEventListener("touchend", onUp);

                    // A rotate-drag shouldn't also toggle the S+F/O&M
                    // breakdown text that a plain click on the bar
                    // normally does -- swallow the click that follows a
                    // real drag, but let a genuine tap/click through.
                    el.addEventListener("click", e => {
                        if (moved) { e.stopPropagation(); moved = false; }
                    });

                    el.addEventListener("dblclick", e => {
                        e.stopPropagation();
                        rotX = -8; rotY = 0;
                        el.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)";
                        apply();
                    });

                    apply();
                    // Brief "this rotates" hint on first render so the
                    // interaction isn't undiscoverable.
                    requestAnimationFrame(() => {
                        el.style.transition = "transform 1.1s ease-in-out";
                        rotY = 16;
                        apply();
                        setTimeout(() => {
                            rotY = 0;
                            apply();
                        }, 1100);
                    });
                }

                // Builds the overall-score stack. Same functionality as the
                // original narrow bar — fill height is proportional to the
                // score out of 10 (e.g. score of 2 = 20% filled) and the
                // color steps green -> yellow -> red as the score climbs —
                // just stretched across the whole connector rectangle now.
                // The value/caption are absolutely positioned above/below
                // the box (not normal-flow siblings) so they never push the
                // box itself out of vertical alignment with the circles —
                // that's what was breaking the top border's connection to
                // the circle rings.
                function createOverallGraph(totalScore, checkboxScore, overallTotal, slaggingLevel) {
                    const maxValue = 10;
                    const clampedTotal = Math.min(Math.max(overallTotal, 0), maxValue);
                    const fillPct = (clampedTotal / maxValue) * 100;
                    const oz = {
                        color: getOverallZoneColor(clampedTotal),
                        glow: getOverallZoneGlow(clampedTotal)
                    };

                    // Split the fill into the original S+F portion and the
                    // extra portion added by the O&M checkboxes, so the
                    // checkbox-driven increase can be visually highlighted
                    // (hazard-stripe pattern) on top of the bar, while the
                    // original portion keeps its normal solid zone colour
                    // exactly as before.
                    const clampedBaseScore = Math.min(Math.max(totalScore, 0), maxValue);
                    const basePct = (clampedBaseScore / maxValue) * 100;
                    const checkboxPct = Math.max(fillPct - basePct, 0);

                    carCenterStack.innerHTML = "";

                    // The bordered connector box, rebuilt fresh each call —
                    // shape/housing ported from i.html's "Overall Intensity"
                    // vertical bar: a ticks column + a bordered scale
                    // housing a track + a solid score-zone-coloured fill +
                    // glass sheen.
                    const carCenterBar = document.createElement("div");
                    carCenterBar.className = "car-center-bar-wrap";
                    carCenterBar.id = "carCenterBar";
                    carCenterBar.setAttribute(
                        "data-tooltip",
                        `${overallTotal.toFixed(1)} / ${maxValue} \u00B7 ${getOverallZoneLabel(clampedTotal)} \u00B7 drag to rotate`
                    );

                    // Tick labels — same relative spacing as i.html's 0/25/50/75/100,
                    // just scaled to this page's real 0-10 range.
                    const ticksEl = document.createElement("div");
                    ticksEl.className = "car-ticks";
                    [0, 2.5, 5, 7.5, 10].forEach((v, i) => {
                        const span = document.createElement("span");
                        span.style.bottom = `${i * 25}%`;
                        if (i === 4) span.style.transform = "translateY(50%)"; // matches i.html's top-most tick tweak
                        span.textContent = (v % 1 === 0) ? v : v.toFixed(1);
                        ticksEl.appendChild(span);
                    });
                    carCenterBar.appendChild(ticksEl);

                    const verticalScale = document.createElement("div");
                    verticalScale.className = "car-vertical-scale";

                    const barTrack = document.createElement("div");
                    barTrack.className = "car-bar-track";

                    // Bottom-up fill — shape/housing ported from i.html's
                    // .bar-fill, but coloured with ONE solid colour based on
                    // the score's zone (green/yellow/red), same functionality
                    // as before Calculate. Only the height animates in.
                    const barFill = document.createElement("div");
                    barFill.className = "car-bar-fill";
                    barFill.id = "overallFill";
                    barFill.style.height = "0%"; // starts empty, animated up below
                    barFill.style.background = oz.color;
                    barTrack.appendChild(barFill);

                    // Chemical-glass touch: a handful of small bubbles drifting
                    // up through the liquid, each with a randomised horizontal
                    // position/size/speed so they don't all move in lockstep.
                    // Only added when there's actually some liquid for them to
                    // rise through.
                    if (basePct > 2) {
                        const bubbleCount = 6;
                        // --car-connector-h (see CSS) is 170px at every
                        // breakpoint; minus the housing/track padding and
                        // borders that's ~154px of real liquid travel space
                        // at 100% fill. Bubbles should stay well inside the
                        // current liquid, not reach all the way to its
                        // surface, so scale by the fill fraction and back
                        // off to ~70% of that.
                        const approxTrackPx = 154;
                        const liquidPx = approxTrackPx * (basePct / 100);
                        for (let i = 0; i < bubbleCount; i++) {
                            const bubble = document.createElement("div");
                            bubble.className = "car-bar-bubble";
                            bubble.style.setProperty("--bubble-left", `${10 + Math.random() * 80}%`);
                            bubble.style.setProperty("--bubble-size", `${2.5 + Math.random() * 3}px`);
                            bubble.style.setProperty("--bubble-duration", `${2.4 + Math.random() * 2.2}s`);
                            bubble.style.setProperty("--bubble-delay", `${-Math.random() * 4}s`); // negative delay so bubbles are already mid-flight on load, not all synced
                            bubble.style.setProperty("--bubble-rise", `${-(liquidPx * (0.55 + Math.random() * 0.3)).toFixed(0)}px`);
                            barFill.appendChild(bubble);
                        }
                    }

                    // Checkbox (O&M) highlight segment — sits directly on top
                    // of the base fill, showing only the extra score added by
                    // the ticked checkboxes. Original portion's colour/height
                    // logic above is untouched; this is purely additive.
                    const barFillCheckbox = document.createElement("div");
                    barFillCheckbox.className = "car-bar-fill-checkbox";
                    barFillCheckbox.id = "overallFillCheckbox";
                    barFillCheckbox.style.bottom = `${basePct}%`;
                    barFillCheckbox.style.height = "0%"; // starts empty, animated up below
                    if (checkboxPct > 0) {
                        barFillCheckbox.setAttribute(
                            "data-tooltip-checkbox",
                            `+${checkboxScore.toFixed(1)} from O&M`
                        );
                    }
                    barTrack.appendChild(barFillCheckbox);

                    const barHighlight = document.createElement("div");
                    barHighlight.className = "car-bar-highlight";
                    barTrack.appendChild(barHighlight);

                    verticalScale.appendChild(barTrack);

                    // 3D depth layers -- see .car-vertical-scale /
                    // .car-tube-glasspane / .car-tube-edge-* in the CSS.
                    // Siblings of barTrack (not inside it) so they sit at
                    // their own translateZ in front of/around the liquid
                    // rather than being clipped by barTrack's overflow:hidden.
                    const glassPane = document.createElement("div");
                    glassPane.className = "car-tube-glasspane";
                    verticalScale.appendChild(glassPane);

                    const edgeLeft = document.createElement("div");
                    edgeLeft.className = "car-tube-edge-left";
                    verticalScale.appendChild(edgeLeft);

                    const edgeRight = document.createElement("div");
                    edgeRight.className = "car-tube-edge-right";
                    verticalScale.appendChild(edgeRight);

                    carCenterBar.appendChild(verticalScale);

                    // Makes the tube a real click-and-drag 3D object: rotate
                    // it around to see it from other angles, same spirit as
                    // the 3D coal-AFT plot elsewhere on this page.
                    _makeTube3DInteractive(verticalScale);

                    // Value — absolutely positioned just above the box's top border.
                    // Appended to the stack (not the bar) so the bar can safely
                    // clip its own fill to its bordered shape without also
                    // clipping this text, which intentionally sits outside it.
                    // Starts at 0 and counts up to the real value in step with
                    // the bar filling, matching the gauges' reveal animation.
                    // Colour still tracks the score's zone, same as i.html.
                    const totalDisplay = document.createElement("div");
                    totalDisplay.className = "car-overall-value";
                    totalDisplay.textContent = "0.0";
                    totalDisplay.style.color = oz.color;

                    // Caption + breakdown — absolutely positioned just below the
                    // box's bottom border, grouped so they stack as one unit.
                    // Same reasoning: lives on the stack, not the bar.
                    const captionGroup = document.createElement("div");
                    captionGroup.className = "car-overall-caption-group";

                    const overallLabel = document.createElement("div");
                    overallLabel.className = "car-overall-caption";
                    overallLabel.textContent = "OVERALL SCORE";
                    captionGroup.appendChild(overallLabel);

                    const breakdownLabel = document.createElement("div");
                    breakdownLabel.className = "car-overall-breakdown";
                    breakdownLabel.textContent = `S+F: ${totalScore.toFixed(1)} \u00B7 O&M: ${checkboxScore.toFixed(1)}`;
                    breakdownLabel.style.display = "none"; // hidden until the bar is clicked
                    captionGroup.appendChild(breakdownLabel);

                    // Click the bar to reveal/hide the S+F / O&M breakdown line.
                    // Purely a visibility toggle — doesn't touch the fill,
                    // tooltip-on-hover, or any other existing behaviour.
                    carCenterBar.addEventListener("click", () => {
                        breakdownLabel.style.display =
                            breakdownLabel.style.display === "none" ? "block" : "none";
                    });

                    carCenterStack.appendChild(carCenterBar);
                    carCenterStack.appendChild(totalDisplay);
                    carCenterStack.appendChild(captionGroup);

                    // Force a reflow so the "0%" starting state actually
                    // paints before the transition to the real height kicks
                    // in, then animate the fill up and count the number up
                    // in step (same reveal treatment as the gauges). Glow
                    // filter on the fill tracks the zone, exactly like i.html.
                    void carCenterBar.getBoundingClientRect();
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            barFill.style.height = `${basePct}%`;
                            barFill.style.filter = `drop-shadow(0 0 14px ${oz.glow})`;
                            barFillCheckbox.style.height = `${checkboxPct}%`;
                            renderOverallDeposition(barTrack, basePct, slaggingLevel);
                        });
                    });
                    (function animateOverallNumber() {
                        const duration = 1100;
                        const start = performance.now();
                        function step(now) {
                            const t = Math.min(1, (now - start) / duration);
                            const eased = 1 - Math.pow(1 - t, 3);
                            totalDisplay.textContent = (overallTotal * eased).toFixed(1);
                            if (t < 1) requestAnimationFrame(step);
                            else totalDisplay.textContent = overallTotal.toFixed(1);
                        }
                        requestAnimationFrame(step);
                    })();
                }

                // ------------------------------------------------------------
                // Deposition/rust buildup — moved here from the slagging
                // gauge (see the Slagging dial section above, which now
                // always renders clean). Back to small particles (like the
                // original gauge effect) via _placeRustBand/_rustBlobPath —
                // just smaller, and with continuous (not sparse) coverage
                // for both High and Moderate.
                //
                // Severity tracks the slagging status (FSPD) directly:
                //   High     -> full 3-layer buildup, small particles,
                //               continuous along the whole border
                //   Moderate -> a single thin layer, small particles,
                //               still continuous (no gaps) — just one layer
                //               instead of three
                //   Low      -> nothing at all — tube stays clean
                // ------------------------------------------------------------
                function renderOverallDeposition(barTrackEl, basePct, level) {
                    if (!barTrackEl || level === "Low" || !level) return;

                    // Render on the tube's OUTER border, not inside the liquid.
                    // barTrackEl itself clips its contents (overflow:hidden,
                    // same reason edgeLeft/edgeRight/glassPane live outside
                    // it — see createOverallGraph above), so the overlay is
                    // appended to its parent (.car-vertical-scale, the actual
                    // tube housing) instead of into barTrackEl. That parent is
                    // exactly the same size as the tube's outer border, so
                    // building the SVG off its own box (not barTrackEl's)
                    // keeps the guide paths sitting right on that border.
                    const scaleEl = barTrackEl.parentElement || barTrackEl;

                    // Clear any leftover overlay from a previous Calculate run.
                    const prevOverlay = scaleEl.querySelector('.overall-rust-svg');
                    if (prevOverlay) prevOverlay.remove();

                    if (getComputedStyle(scaleEl).position === 'static') {
                        scaleEl.style.position = 'relative';
                    }

                    const w = scaleEl.clientWidth;
                    const h = scaleEl.clientHeight;
                    if (!w || !h) return;

                    const filledPx = h * (basePct / 100);
                    if (filledPx < 10) return;

                    const NS = "http://www.w3.org/2000/svg";
                    const svg = document.createElementNS(NS, "svg");
                    svg.setAttribute("class", "overall-rust-svg");
                    svg.setAttribute("width", w);
                    svg.setAttribute("height", h);
                    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
                    svg.style.position = "absolute";
                    svg.style.left = "0";
                    svg.style.top = "0";
                    svg.style.overflow = "visible";
                    svg.style.pointerEvents = "none";
                    // Above glassPane/edgeLeft/edgeRight so the buildup reads
                    // as sitting on the outside of the glass, not under it.
                    svg.style.zIndex = "7";
                    scaleEl.appendChild(svg);

                    // Two straight vertical guide paths hugging the tube's
                    // OUTER left/right border (a straight-line stand-in for
                    // the gauge's curved arc) — measured via getPointAtLength,
                    // same as _placeRustBand expects. edgeMargin now sits
                    // right at the tube's border instead of 10% inset into
                    // the liquid.
                    const yBottom = h;
                    const yTop = h - filledPx;
                    const edgeMargin = Math.max(1, w * 0.015);

                    const leftPath = document.createElementNS(NS, "path");
                    leftPath.setAttribute("d", `M${edgeMargin} ${yBottom} L${edgeMargin} ${yTop}`);
                    leftPath.setAttribute("fill", "none");
                    leftPath.setAttribute("stroke", "none");
                    svg.appendChild(leftPath);

                    const rightPath = document.createElementNS(NS, "path");
                    rightPath.setAttribute("d", `M${w - edgeMargin} ${yBottom} L${w - edgeMargin} ${yTop}`);
                    rightPath.setAttribute("fill", "none");
                    rightPath.setAttribute("stroke", "none");
                    svg.appendChild(rightPath);

                    const isHigh = level === "High";
                    const edgeOffset = Math.max(2, w * 0.05);

                    // gapChance is kept low for BOTH levels now (continuous
                    // coverage along the whole border, no gaps) — the only
                    // difference between High and Moderate is layer count
                    // and how pale/thin that single layer is for Moderate.
                    const baseGroup = document.createElementNS(NS, "g");
                    [leftPath, rightPath].forEach(p => {
                        _placeRustBand(baseGroup, p, filledPx, filledPx, {
                            edgeOffset,
                            radius: isHigh ? [1.5, 2.8] : [1.2, 2.2],
                            spacing: isHigh ? [2.5, 4] : [3, 5],
                            gapChance: isHigh ? 0.03 : 0.08,
                            jitter: isHigh ? 2 : 1.5,
                            palette: _rustBlobPalette(isHigh ? ["#4a3f33", "#5c4d3f", "#443a2e"] : ["#8a8378", "#9c8f7c"]),
                            opacity: isHigh ? [0.85, 1] : [0.4, 0.65],
                            cracks: isHigh ? 0.15 : 0
                        });
                    });
                    svg.appendChild(baseGroup);

                    if (isHigh) {
                        // Moderate stays at just the base layer (thin,
                        // pale, but still continuous); High builds two
                        // more layers on top so it reads as real,
                        // established buildup — same staged-accumulation
                        // feel as before, just with smaller particles.
                        const midGroup = document.createElementNS(NS, "g");
                        [leftPath, rightPath].forEach(p => {
                            _placeRustBand(midGroup, p, filledPx, filledPx, {
                                edgeOffset: edgeOffset + 2.5,
                                radius: [1.3, 2.5],
                                spacing: [3, 5],
                                gapChance: 0.06,
                                jitter: 2,
                                palette: _rustBlobPalette(),
                                opacity: [0.7, 0.95],
                                cracks: 0.2
                            });
                        });
                        svg.appendChild(midGroup);

                        const outerGroup = document.createElementNS(NS, "g");
                        [leftPath, rightPath].forEach(p => {
                            _placeRustBand(outerGroup, p, filledPx, filledPx, {
                                edgeOffset: edgeOffset + 5,
                                radius: [0.9, 1.8],
                                spacing: [3.5, 5.5],
                                gapChance: 0.12,
                                jitter: 2.5,
                                palette: _rustBlobPalette(["#a4917a", "#9c8f7c", "#b7a68c"]),
                                opacity: [0.45, 0.78],
                                cracks: 0
                            });
                        });
                        svg.appendChild(outerGroup);

                        [[baseGroup, 1100], [midGroup, 1450], [outerGroup, 1800]].forEach(([g, delay]) => {
                            g.style.opacity = "0";
                            g.style.transition = "opacity .6s ease";
                            requestAnimationFrame(() => setTimeout(() => { g.style.opacity = "1"; }, delay));
                        });
                    } else {
                        baseGroup.style.opacity = "0";
                        baseGroup.style.transition = "opacity .6s ease";
                        requestAnimationFrame(() => setTimeout(() => { baseGroup.style.opacity = "1"; }, 900));
                    }
                }

                // Zone color for the overall-score connector fill — pulled
                // from the 10-stop score colour scale (overall is already
                // on a native 0-10 scale).
                function getOverallZoneColor(score) {
                    return _overallScoreColor(score);
                }

                // Same zone color, but as an rgba string for the soft glow
                // layer above the fill.
                function getOverallZoneGlow(score) {
                    return _overallScoreGlow(score);
                }

                function getOverallZoneLabel(score) {
                    if (score > 6.5) return "High";
                    if (score > 3) return "Moderate";
                    return "Low";
                }

                // Main score color
                function getColor(score) {
                    if (score < 3) return "#a6e3a6";
                    if (score < 6.5) return "yellow";
                    return "red";
                }

                // Base color of checkbox segment depends only on totalScore
                function getCheckboxBaseColor(score) {
                    if (score < 3) return "#5de65d";
                    if (score < 6.5) return "#fddf05";
                    return "#e24242";
                }

                // Hatch overlay color depends on totalCombined
                function getHatchColor(totalCombined) {
                    if (totalCombined > 6.5) return "red";
                    if (totalCombined > 3) return "yellow";
                    return "green";
                }

                function getHatchingLines(hatchColor) {
                    return `repeating-linear-gradient(45deg, transparent, transparent 5px, ${hatchColor} 5px, ${hatchColor} 10px)`;
                }


                document.getElementById("resultsContainer").style.display = "flex";
                document.getElementById("blendValues").style.display = "flex";
                blendPropertiesBtn.style.display = "block";
                createOverallGraph(totalScore, checkboxScore, overallTotal, FSPD);

// The ternary card / advanced dashboard / toggle button are now
// persistent static elements (see the HTML) instead of being destroyed
// and recreated on every Calculate — grab them, reset to the default
// (ternary-visible) state, and refresh their contents for this run.
// The click-to-expand and toggle-button wiring itself only needs to
// happen once and is done by _initResultsPanelInteractivity() below
// (called once at DOMContentLoaded).
const plotDiv = document.getElementById('ternary-plot');
const ternaryWrapper = document.getElementById('ternaryPlotWrapper');
const ternaryCardOuter = document.getElementById('ternaryCardOuter');
const advancedDashboard = document.getElementById('advancedDashboard');
const advancedViewToggleBtn = document.getElementById('advancedViewToggleBtn');

// Close out of an expanded card (if any) so it's back in its normal spot
// before this run touches its contents/visibility.
if (_currentExpandedCollapse) _currentExpandedCollapse();

ternaryCardOuter.classList.remove('hidden');

// Every new calculation starts back on the ternary view, exactly like
// the old destroy-and-rebuild-from-scratch version always did.
showingAdvancedDashboard = false;
advancedChartsDrawn = false;
ternaryWrapper.style.display = '';
advancedDashboard.classList.add('hidden');
advancedViewToggleBtn.classList.remove('active');
const _advToggleLabel = advancedViewToggleBtn.querySelector('.advanced-view-corner-btn-label');
if (_advToggleLabel) _advToggleLabel.textContent = 'Advanced View';

advDashData = { SIO, ALO, FEO, CAO, MGO, NAO, KO, S, FT: predictedAFT, HT, IDT, FSP, FSPD, FFFTS, FFFD, omScore: checkboxScore };
buildAdvancedDashboard(advancedDashboard, advDashData);

updatePlot();
        
                
            } 
        }
        } 
      
        

function updatePlot() {
    const ternaryPlotElement = document.getElementById('ternary-plot');
    if (!ternaryPlotElement) {
        console.error("Ternary plot element #ternary-plot not found.");
        return;
    }

    var data = [{
        type: 'scatterternary',
        mode: 'markers',
        name: 'Blended AFT',
        a: samples.map(s => s.acidicOxides),
        b: samples.map(s => s.basicOxides),
        c: samples.map(s => s.otherOxides),
        marker: {
            size: MARKER_SIZE, // <-- use smaller markers
            color: samples.map(s => s.AFT),
            colorscale: 'Jet',
            showscale: false
        },
        text: samples.map(s => `Fusion Temperature: ${parseFloat(s.AFT).toFixed(2)}°C`),
        hoverinfo: 'text'
    }];

    // Glowy "dark glass" look: fully transparent chart background so the
    // dark page shows through, with the triangle border / gridlines /
    // labels all rendered in a soft glowing off-white. Only the heatmap
    // markers + the triangle outline should read as visible "content".
    const GLOW_WHITE = "#f4f8ff";
    const GLOW_WHITE_SOFT = "rgba(244, 248, 255, 0.55)";
    const AXIS_LABEL_FONT = { size: 12, color: GLOW_WHITE };
    const TICK_FONT = { size: 10, color: GLOW_WHITE_SOFT };

    var layout = {
    autosize: true,   // let Plotly fill the container (whatever height flex gives it)
    margin: { l: 50, r: 40, t: 36, b: 36 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    // Plotly auto-shows its own legend once a 2nd trace exists (the
    // hover-expand view adds one for the individual coal points), which
    // would otherwise print this trace's auto-generated "trace 0" label
    // on the chart. We already show a custom legend under the expanded
    // card, so keep Plotly's own legend off entirely.
    showlegend: false,
    ternary: {
        bgcolor: 'rgba(0,0,0,0)',
        sum: 100,
        aaxis: {
            title: { text: "Thermal Stability", font: AXIS_LABEL_FONT },
            showticklabels: true,
            tickfont: TICK_FONT,
            linecolor: GLOW_WHITE,
            linewidth: 2,
            gridcolor: GLOW_WHITE_SOFT
        },
        baxis: {
            title: { text: "Fusion Accelerator", font: AXIS_LABEL_FONT },
            showticklabels: true,
            tickfont: TICK_FONT,
            linecolor: GLOW_WHITE,
            linewidth: 2,
            gridcolor: GLOW_WHITE_SOFT
        },
        caxis: {
            title: { text: "Hardening Index", font: AXIS_LABEL_FONT, standoff: 10 },
            showticklabels: true,
            title_standoff: 10,
            tickfont: TICK_FONT,
            linecolor: GLOW_WHITE,
            linewidth: 2,
            gridcolor: GLOW_WHITE_SOFT
        }
    },
    font: { color: GLOW_WHITE }
};

    Plotly.newPlot(ternaryPlotElement, data, layout, {responsive: true});

    // Plotly doesn't support text-shadow via layout config, so give the
    // triangle border / axis lines / labels an actual soft glow with a
    // CSS filter on the SVG layer that draws them.
    requestAnimationFrame(() => {
        const svgLayers = ternaryPlotElement.querySelectorAll('.main-svg');
        svgLayers.forEach(svg => {
            svg.style.filter = 'drop-shadow(0 0 3px rgba(244, 248, 255, 0.55))';
        });
    });
}

/* -----------------------------------------------------------------------
   Advanced view: Compositional Radar / Ash Fusion Characteristics /
   Coal AFT Cube View + Key Indicators.

   Everything here is built from values already calculated in
   calculateWeightedAverage() (oxide weight %, predicted AFT, IDT/HT,
   FSP, FFFTS, O&M checkbox score) — no invented figures. The Ash Fusion
   card draws flat reference lines at the real IDT/HT/FT temperatures
   (no fake heating-rate curve, since only single-point values exist).
----------------------------------------------------------------------- */
// The grid + 3 chart cards (#radarChart/#ashFusionChart/#coalCubeChart)
// and the 6 key-indicator cards are now static markup in the HTML (see
// #advancedDashboard) instead of being rebuilt with document.createElement()
// every Calculate — this just refreshes the key-indicator values in place.
function buildAdvancedDashboard(container, d) {
    updateKeyIndicatorsRow(d);
}

// Remembers the last-drawn series for each advanced chart so the
// zoomed/expanded-view blink cycles (and the 3D tendency map rebuild)
// can reuse the exact same numbers without re-deriving them from `d`.
let _lastRadarSeries = null;      // { categories, values }
let _lastAshFusionRefs = null;    // [{ label, value, color }]

function drawRadarChart(d) {
    const el = document.getElementById('radarChart');
    if (!el || !window.Plotly) return;

    const categories = ['SiO\u2082', 'Al\u2082O\u2083', 'Fe\u2082O\u2083', 'CaO', 'MgO', 'Na\u2082O + K\u2082O'];
    const values = [d.SIO, d.ALO, d.FEO, d.CAO, d.MGO, (d.NAO || 0) + (d.KO || 0)];
    _lastRadarSeries = { categories, values };
    const r = values.concat([values[0]]);
    const theta = categories.concat([categories[0]]);

    const data = [
        {
            type: 'scatterpolar',
            r: r,
            theta: theta,
            fill: 'toself',
            name: 'Blend',
            line: { color: '#4f8dff' },
            fillcolor: 'rgba(79,141,255,0.28)',
            marker: { color: '#4f8dff', size: 6 }
        },
        // Highlight overlay -- starts empty; the zoomed-view blink cycle
        // (see _startRadarBlink) restyles just this trace to flash one
        // oxide's marker + name/value at a time, without touching the
        // 'Blend' trace above.
        {
            type: 'scatterpolar',
            r: [], theta: [], text: [],
            mode: 'markers+text',
            textposition: 'top center',
            textfont: { color: '#ffe066', size: 12 },
            marker: { color: '#ffe066', size: 14, line: { color: '#fff', width: 2 } },
            hoverinfo: 'skip',
            showlegend: false,
            name: 'Highlight'
        }
    ];
    const layout = {
        polar: {
            bgcolor: 'transparent',
            radialaxis: { visible: true, showline: true, gridcolor: 'rgba(120,155,230,0.25)', tickfont: { color: '#9db2dd', size: 9 } },
            angularaxis: { gridcolor: 'rgba(120,155,230,0.25)', tickfont: { color: '#f4f8ff', size: 10 } }
        },
        showlegend: false,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 34, r: 34, t: 20, b: 20 },
        font: { color: '#f4f8ff' }
    };
    Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
}

// Cycles the radar chart's highlight trace through every oxide category
// one at a time -- each vertex flashes bigger with its own name + %
// value shown, no hover needed. Only meant to run while the advanced
// card is in its zoomed/expanded view (started/stopped there).
function _startRadarBlink(el) {
    if (!window.Plotly || !el || !_lastRadarSeries || !_lastRadarSeries.categories.length) return null;
    const { categories, values } = _lastRadarSeries;
    let idx = 0, stopped = false, timeoutId = null;
    const VISIBLE_MS = 1300, GAP_MS = 250;

    function clearHighlight() {
        return Plotly.restyle(el, { r: [[]], theta: [[]], text: [[]] }, [1]).catch(() => {});
    }
    function showNext() {
        if (stopped || !document.body.contains(el)) return;
        const v = values[idx];
        const label = `${categories[idx]}: ${(typeof v === 'number' ? v.toFixed(2) : v)}%`;
        Plotly.restyle(el, { r: [[v]], theta: [[categories[idx]]], text: [[label]] }, [1]).catch(() => {});
        idx = (idx + 1) % categories.length;
        timeoutId = setTimeout(hide, VISIBLE_MS);
    }
    function hide() {
        if (stopped) return;
        clearHighlight();
        timeoutId = setTimeout(showNext, GAP_MS);
    }

    showNext();
    return {
        stop() {
            stopped = true;
            if (timeoutId) clearTimeout(timeoutId);
            clearHighlight();
        }
    };
}

function drawAshFusionChart(d) {
    const el = document.getElementById('ashFusionChart');
    if (!el || !window.Plotly) return;

    const refs = [
        { label: 'IDT', value: d.IDT, color: '#4f8dff' },
        { label: 'HT', value: d.HT, color: '#ffb703' },
        { label: 'FT', value: d.FT, color: '#ff5b5b' }
    ].filter(r => r.value != null && !isNaN(r.value));
    _lastAshFusionRefs = refs;

    const shapes = refs.map(r => ({
        type: 'line', xref: 'paper', x0: 0, x1: 1, y0: r.value, y1: r.value,
        line: { color: r.color, width: 2 }
    }));
    const annotations = refs.map(r => ({
        xref: 'paper', x: 1, y: r.value, xanchor: 'left', yanchor: 'middle', xshift: 6,
        text: `${r.label}: ${Math.round(r.value)}\u00b0C`, showarrow: false,
        font: { color: r.color, size: 11 }
    }));

    const yVals = refs.map(r => r.value);
    const yMin = yVals.length ? Math.min(...yVals) - 60 : 1000;
    const yMax = yVals.length ? Math.max(...yVals) + 60 : 1500;

    const data = [{ x: [0, 1], y: [null, null], mode: 'markers', hoverinfo: 'skip', showlegend: false }];
    const layout = {
        shapes: shapes,
        annotations: annotations,
        xaxis: { visible: false, range: [0, 1] },
        yaxis: { title: { text: 'Temperature (\u00b0C)', font: { color: '#9db2dd', size: 11 } }, range: [yMin, yMax], gridcolor: 'rgba(120,155,230,0.15)', tickfont: { color: '#9db2dd', size: 10 } },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 55, r: 85, t: 20, b: 20 },
        font: { color: '#f4f8ff' }
    };
    Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
}

// Cycles emphasis through the ash-fusion chart's IDT/HT/FT lines one at
// a time (thickened + glowing), since the labels themselves are already
// always visible and there's nothing to reveal on hover here -- the
// "blink" instead calls out each threshold in turn.
function _startAshFusionBlink(el) {
    if (!window.Plotly || !el || !_lastAshFusionRefs || !_lastAshFusionRefs.length) return null;
    const refs = _lastAshFusionRefs;
    let idx = 0, stopped = false, timeoutId = null;
    const VISIBLE_MS = 1300, GAP_MS = 250;

    function baseShapes() {
        return refs.map(r => ({
            type: 'line', xref: 'paper', x0: 0, x1: 1, y0: r.value, y1: r.value,
            line: { color: r.color, width: 2 }
        }));
    }
    function showNext() {
        if (stopped || !document.body.contains(el)) return;
        const shapes = baseShapes();
        shapes[idx].line.width = 6;
        Plotly.relayout(el, { shapes }).catch(() => {});
        idx = (idx + 1) % refs.length;
        timeoutId = setTimeout(hide, VISIBLE_MS);
    }
    function hide() {
        if (stopped) return;
        Plotly.relayout(el, { shapes: baseShapes() }).catch(() => {});
        timeoutId = setTimeout(showNext, GAP_MS);
    }

    showNext();
    return {
        stop() {
            stopped = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (document.body.contains(el)) Plotly.relayout(el, { shapes: baseShapes() }).catch(() => {});
        }
    };
}

// Gathers the current blend point(s) + each selected coal's own (100%)
// predicted AFT, for the Coal AFT Cube View card -- the same data/lookup
// (computeIndividualCoalAFTs(), cached via _individualAftCache) that used
// to feed the ternary card's click-to-expand cube. Shared by the compact
// in-grid render and the zoomed/expanded render below.
async function _gatherCoalCubePoints() {
    const sig = _getTernaryBlendSignature();
    let results;
    if (_individualAftCache && _individualAftCache.sig === sig) {
        results = _individualAftCache.results;
    } else {
        results = await computeIndividualCoalAFTs();
        _individualAftCache = { sig, results };
    }
    const valid = (results || []).filter(r => r && r.aft != null && !isNaN(r.aft) && r.a != null && r.b != null && r.c != null);

    const coalPoints = valid.map(r => ({
        x: r.a, y: r.b, z: r.aft, name: r.name,
        text: `${r.name} — Individual AFT: ${Math.round(Number(r.aft))}°C`
    }));
    const blendPoints = samples.map(s => ({
        x: s.acidicOxides, y: s.basicOxides, z: s.AFT,
        text: `Blended AFT: ${parseFloat(s.AFT).toFixed(2)}°C`
    }));
    const allPts = blendPoints.concat(coalPoints);
    const ranges = allPts.length ? _cubeRangesFor(allPts) : null;
    return { blendPoints, coalPoints, ranges };
}

// Builds the {data, layout} for the Coal AFT Cube View chart -- identical
// styling/axes to the 3D view the ternary card used to expand into
// (_build3DExpandedPlot), plus the wireframe box, just reused here for the
// advanced-dashboard card instead. `compact` trims margins/labels/marker
// size down for the small in-grid card; the zoomed view passes false for
// the same full-size look the ternary card's cube used to have.
function _buildCoalCubePlot(blendPoints, coalPoints, ranges, compact) {
    const GLOW_WHITE = "#f4f8ff";
    const GLOW_WHITE_SOFT = "rgba(244, 248, 255, 0.55)";
    const AXIS_LABEL_FONT = { size: compact ? 9 : 12, color: GLOW_WHITE };
    const TICK_FONT = { size: compact ? 8 : 10, color: GLOW_WHITE_SOFT };

    const blendedTrace = {
        type: 'scatter3d', mode: 'markers', name: 'Blended AFT',
        x: blendPoints.map(p => p.x), y: blendPoints.map(p => p.y), z: blendPoints.map(p => p.z),
        marker: {
            size: MARKER_SIZE + (compact ? 0 : 2),
            color: blendPoints.map(p => p.z), colorscale: 'Jet', showscale: false,
            line: { width: 1, color: 'rgba(255,255,255,0.6)' }
        },
        text: blendPoints.map(p => p.text), hoverinfo: 'text'
    };
    const individualTrace = {
        type: 'scatter3d', mode: 'markers', name: 'Individual Coal AFT',
        x: coalPoints.map(p => p.x), y: coalPoints.map(p => p.y), z: coalPoints.map(p => p.z),
        marker: {
            symbol: 'diamond',
            size: (typeof MARKER_SIZE !== 'undefined' ? MARKER_SIZE : 9) + (compact ? 2 : 4),
            color: coalPoints.map(p => p.z), colorscale: 'Jet', showscale: false,
            line: { width: 1.5, color: '#111' }
        },
        text: coalPoints.map(p => p.text), hoverinfo: 'text', showlegend: false
    };
    const data = [blendedTrace, individualTrace];
    if (ranges) data.push(_cubeWireframeTrace(ranges));

    const layout = {
        autosize: true,
        margin: compact ? { l: 0, r: 0, t: 8, b: 0 } : { l: 10, r: 10, t: 30, b: 10 },
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
        scene: {
            bgcolor: 'rgba(0,0,0,0)',
            aspectmode: 'cube',
            camera: { eye: { x: 1.5, y: 1.5, z: 0.9 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } },
            xaxis: {
                title: compact ? undefined : { text: "Thermal Stability (Acidic Oxides %)", font: AXIS_LABEL_FONT },
                showticklabels: !compact, tickfont: TICK_FONT,
                color: GLOW_WHITE_SOFT, gridcolor: GLOW_WHITE_SOFT, zerolinecolor: GLOW_WHITE_SOFT,
                backgroundcolor: 'rgba(0,0,0,0)'
            },
            yaxis: {
                title: compact ? undefined : { text: "Fusion Accelerator (Basic Oxides %)", font: AXIS_LABEL_FONT },
                showticklabels: !compact, tickfont: TICK_FONT,
                color: GLOW_WHITE_SOFT, gridcolor: GLOW_WHITE_SOFT, zerolinecolor: GLOW_WHITE_SOFT,
                backgroundcolor: 'rgba(0,0,0,0)'
            },
            zaxis: {
                title: compact ? undefined : { text: "AFT (°C)", font: AXIS_LABEL_FONT },
                showticklabels: !compact, tickfont: TICK_FONT,
                color: GLOW_WHITE_SOFT, gridcolor: GLOW_WHITE_SOFT, zerolinecolor: GLOW_WHITE_SOFT,
                backgroundcolor: 'rgba(0,0,0,0)'
            }
        },
        font: { color: GLOW_WHITE }
    };
    if (ranges) {
        layout.scene.xaxis.range = ranges.xr; layout.scene.xaxis.autorange = false;
        layout.scene.yaxis.range = ranges.yr; layout.scene.yaxis.autorange = false;
        layout.scene.zaxis.range = ranges.zr; layout.scene.zaxis.autorange = false;
    }
    return { data, layout };
}

// Compact (in-grid) render of the Coal AFT Cube View card -- replaces the
// old drawTendencyMapChart(). `d` is accepted for call-site symmetry with
// drawRadarChart/drawAshFusionChart but isn't used: the cube's own data
// comes from `samples` + computeIndividualCoalAFTs(), same as the ternary
// card's old expanded cube did. Still rotatable/draggable like any Plotly
// 3D scene; the camera-preset buttons + auto-labels only appear once this
// card's dashboard is itself zoomed (see _setupAdvancedExpand below).
async function drawCoalCubeChart(d) {
    const el = document.getElementById('coalCubeChart');
    if (!el || !window.Plotly) return;
    try {
        const { blendPoints, coalPoints, ranges } = await _gatherCoalCubePoints();
        if (!document.body.contains(el)) return; // dashboard may have changed while this awaited
        const { data, layout } = _buildCoalCubePlot(blendPoints, coalPoints, ranges, true);
        await Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
    } catch (e) { console.warn('Coal AFT Cube View (compact) render failed', e); }
}

function updateKeyIndicatorsRow(d) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    set('kiFluidTemp', (d.FT != null && !isNaN(d.FT)) ? Math.round(d.FT) + ' \u00b0C' : 'N/A');
    set('kiTotalSulfur', (d.S != null && !isNaN(d.S)) ? d.S.toFixed(2) + ' wt%' : 'N/A');
    set('kiSlagging', (d.FSP != null) ? d.FSP.toFixed(1) + '/6 \u00b7 ' + d.FSPD : 'N/A');
    set('kiFouling', (d.FFFTS != null) ? d.FFFTS.toFixed(1) + '/3 \u00b7 ' + d.FFFD : 'N/A');
    set('kiIDT', (d.IDT != null && !isNaN(d.IDT)) ? Math.round(d.IDT) + ' \u00b0C' : 'N/A');
    set('kiOmScore', (d.omScore != null) ? d.omScore.toFixed(2) + ' / 3.5' : 'N/A');
}


function removeBlend(button) {
            button.parentElement.remove();
            renumberBlends();
            updateTotalRange();
            sizeBlendRowVisible();
        }

// Wires up the advanced-view toggle button and the ternary/advanced
// click-to-expand behaviour exactly once, since #ternaryPlotWrapper,
// #advancedDashboard and #advancedViewToggleBtn are now persistent
// elements (see the HTML) rather than being torn down and rebuilt --
// with fresh addEventListener closures -- on every Calculate click.
// calculateWeightedAverage() only refreshes advDashData/content afterwards.
function _initResultsPanelInteractivity() {
    const plotDiv = document.getElementById('ternary-plot');
    const ternaryWrapper = document.getElementById('ternaryPlotWrapper');
    const advancedDashboard = document.getElementById('advancedDashboard');
    const advancedViewToggleBtn = document.getElementById('advancedViewToggleBtn');
    if (!plotDiv || !ternaryWrapper || !advancedDashboard || !advancedViewToggleBtn) return;

    advancedViewToggleBtn.addEventListener('click', () => {
        showingAdvancedDashboard = !showingAdvancedDashboard;
        const label = advancedViewToggleBtn.querySelector('.advanced-view-corner-btn-label');

        if (showingAdvancedDashboard) {
            ternaryWrapper.style.display = 'none';
            advancedDashboard.classList.remove('hidden');
            advancedViewToggleBtn.classList.add('active');
            if (label) label.textContent = 'Ternary View';

            if (window.Plotly) {
                if (!advancedChartsDrawn) {
                    drawRadarChart(advDashData || {});
                    drawAshFusionChart(advDashData || {});
                    drawCoalCubeChart(advDashData || {});
                    advancedChartsDrawn = true;
                } else {
                    ['radarChart', 'ashFusionChart', 'coalCubeChart'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) { try { Plotly.Plots.resize(el); } catch (e) {} }
                    });
                }
            }
        } else {
            ternaryWrapper.style.display = '';
            advancedDashboard.classList.add('hidden');
            advancedViewToggleBtn.classList.remove('active');
            if (label) label.textContent = 'Advanced View';
        }
    });

    _setupTernaryHoverExpand(ternaryWrapper, plotDiv);
    _setupAdvancedExpand(advancedDashboard);

    // The two setup calls above populate _expandRegistry with plain
    // expand()/collapse() pairs that know nothing about the ternary/advanced
    // toggle button. Wrap them here so that switching straight from one
    // expanded card to the other via its in-card "switch view" button also
    // flips the toggle button and inline visibility, exactly as if the user
    // had clicked it themselves — and so the advanced charts get drawn
    // first if the user jumps there without ever having toggled to it inline.
    const _rawTernaryExpand = _expandRegistry.ternary;
    const _rawAdvancedExpand = _expandRegistry.advanced;

    _expandRegistry.ternary = {
        expand: () => {
            showingAdvancedDashboard = false;
            ternaryWrapper.style.display = '';
            advancedDashboard.classList.add('hidden');
            advancedViewToggleBtn.classList.remove('active');
            const label = advancedViewToggleBtn.querySelector('.advanced-view-corner-btn-label');
            if (label) label.textContent = 'Advanced View';
            _rawTernaryExpand.expand();
        },
        collapse: _rawTernaryExpand.collapse
    };

    _expandRegistry.advanced = {
        expand: () => {
            showingAdvancedDashboard = true;
            ternaryWrapper.style.display = 'none';
            advancedDashboard.classList.remove('hidden');
            advancedViewToggleBtn.classList.add('active');
            const label = advancedViewToggleBtn.querySelector('.advanced-view-corner-btn-label');
            if (label) label.textContent = 'Ternary View';
            if (window.Plotly && !advancedChartsDrawn) {
                drawRadarChart(advDashData || {});
                drawAshFusionChart(advDashData || {});
                drawCoalCubeChart(advDashData || {});
                advancedChartsDrawn = true;
            }
            _rawAdvancedExpand.expand();
        },
        collapse: _rawAdvancedExpand.collapse
    };
}
document.addEventListener('DOMContentLoaded', _initResultsPanelInteractivity);
        
        
        document.addEventListener('DOMContentLoaded', () => {
            fetch('./get_coal_types')
                .then(response => response.json())
                .then(data => {
                    window.coalData = data.coal_data; // Store the fetched data globally

                    addBlend();
                })
                .catch(error => console.error('Error fetching coal types:', error));
        });
        
        

        function populateDropdown(selectElement) {
    selectElement.innerHTML = '<option value="">Select Coal Type</option>';

    if (!Array.isArray(window.coalData)) {
        console.error("coalData is not an array:", window.coalData);
        return;
    }

    const sortedCoalData = [...window.coalData].sort((a, b) => {
        const aText = `${a?.coalType || ""} ${a?.transportId || ""}`.trim();
        const bText = `${b?.coalType || ""} ${b?.transportId || ""}`.trim();

        return aText.localeCompare(bText, undefined, { sensitivity: "base" });
    });

    sortedCoalData.forEach(coal => {
        if (!coal || coal.id == null) return;

        const opt = document.createElement('option');
        opt.value = coal.id;

        const nameWithId = coal.coalId
            ? `${coal.coalType || "Unknown Coal"} - ${coal.coalId}`
            : (coal.coalType || "Unknown Coal");

        opt.textContent = coal.transportId
            ? `${nameWithId} – ${coal.transportId}`
            : nameWithId;

        selectElement.appendChild(opt);
    });
}

        
        
        function fetchCoalProperties(index) {
            const selectedCoal = document.querySelector(`#coal${index}`).value;
        
            if (!selectedCoal) {
                alert("Please select a coal type first.");
                return;
            }
            const coalInfo = window.coalData.find(coal => coal.id === selectedCoal);
           
            if (!coalInfo) {
                alert("Properties not found.");
                return;
            }
        
            // Generate table HTML
            let propertiesHTML = `
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid lightgray;">Percentage Properties</th>
                            <th style="padding: 8px; border: 1px solid lightgray;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
        
            
            for (const [key, value] of Object.entries(coalInfo.properties)) {
                propertiesHTML += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid lightgray;">${key}</td>
                        <td style="padding: 8px; border: 1px solid lightgray;">${value}</td>
                    </tr>
                `;
            }
        
            propertiesHTML += `</tbody></table>`;
        
            document.getElementById("coalPropertiesContent").innerHTML = propertiesHTML;
            document.getElementById("coalPropertiesModal").style.display = "block";
        }
        
        function closeModal() {
            document.getElementById("coalPropertiesModal").style.display = "none";
        }
        
        window.onclick = function(event) {
            const modal = document.getElementById("coalPropertiesModal");
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
    
    

/* ---- next inline <script> block ---- */



    

async function callConsumeTrial() {
  try {
    const resp = await fetch('./consume-trial', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // 401 -> not authenticated, 403 -> locked or forbidden
      if (resp.status === 401) {
        alert(data.error || 'Not authenticated. Please login.');
        window.location.href = './login.html';
        return null;
      }
      if (resp.status === 403 && data.lockedUntil) {
        // account locked
        const lockedUntil = new Date(data.lockedUntil);
        const msLeft = lockedUntil - new Date();
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        alert(`Account locked. Try after ${hoursLeft} hour(s) (until ${lockedUntil.toLocaleString()}).`);
        // Optionally redirect to login page
        window.location.href = './login.html';
        return data;
      }
      // other errors:
      console.warn('consume-trial error:', data);
      alert(data.error || 'Could not consume trial. See console.');
      return null;
    }

    // Success - update UI if an element exists
    if (typeof data.trialsLeft !== 'undefined') {
      const el = document.getElementById('trialsLeft');
      if (el) el.textContent = String(data.trialsLeft);
    }

    if (data.lockedUntil) {
      // The server locked the account in this response (trials reached zero)
      const lockedUntil = new Date(data.lockedUntil);
      alert('Trials exhausted. Account locked until ' + lockedUntil.toLocaleString());
      // Session destroyed server-side; redirect to login
      window.location.href = '/';
      return data;
    }

    // Return server response for further handling if caller needs it
    return data;
  } catch (err) {
    console.error('callConsumeTrial failed', err);
    alert('Network error while consuming trial.');
    return null;
  }
}


/* ---- next inline <script> block ---- */


(function(){
  const navBtns = Array.from(document.querySelectorAll('.common-navbar .nav-buttons button'))
    .filter(b => b.dataset && b.dataset.target);

  const path = (location.pathname || '').split('/').pop().toLowerCase();

  let matched = false;
  navBtns.forEach(btn => {
    const target = (btn.dataset.target || '').toLowerCase();
    btn.addEventListener('click', () => { if (target) location.href = target; });
    if ((path && path === target) || (!path && target === 'model.html')) {
      btn.classList.add('active');
      matched = true;
    } else {
      btn.classList.remove('active');
    }
  });

  if (!matched) {
    const pageHints = ['coal', 'slag', 'model'];
    for (const btn of navBtns) {
      const t = btn.dataset.target || '';
      for (const h of pageHints) {
        if (t.indexOf(h) !== -1 && document.body.innerText.toLowerCase().includes(h)) {
          btn.classList.add('active'); matched = true; break;
        }
      }
      if (matched) break;
    }
  }

  const logoutBtn = document.getElementById('common-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { localStorage.setItem('isLoggedIn','false'); } catch(e) {}
      window.location.href = './login.html';
    });
  }
})();


/* ---- next inline <script> block ---- */


/* ----------------- Configuration ----------------- */
const TERNARY_ID = 'ternary-plot';

/* ----------------- Helpers ----------------- */
function _escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Build coal table
function buildCoalTableHTML() {
  const selects = Array.from(document.querySelectorAll('select[id^="coal"], select[name^="coal"]'));
  if (!selects.length) return '<p style="font-size:11px;">No coal selected.</p>';
  let rows = '';
  for (const sel of selects) {
    let pct = '';
    const idMatch = (sel.id || '').match(/\d+$/);
    if (idMatch) {
      const idx = idMatch[0];
      const cand = document.querySelector(`#currentrange${idx}`);
      if (cand) pct = cand.value;
    }
    if (!pct) {
      const container = sel.closest('.blend') || sel.parentElement;
      const inp = container?.querySelector('input[type="number"], input[type="text"], input[id^="currentrange"]');
      if (inp) pct = inp.value;
    }
    const name = sel.options[sel.selectedIndex]?.text?.trim() || sel.value || '';
    if (name || pct) rows += `<tr><td>${_escapeHtml(name)}</td><td>${_escapeHtml(pct)}</td></tr>`;
  }
  if (!rows) return '<p style="font-size:11px;">No coal selected.</p>';
  return `<table><thead><tr><th>Coal</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// Build selected operational params
function buildOpParamsHTML() {
  const selectors = [
    '#checkboxContainer input[type="checkbox"]',
    '#checkbox-container input[type="checkbox"]',
    '.checkbox-container input[type="checkbox"]',
    'table input[type="checkbox"]'
  ];
  const set = new Set();
  selectors.forEach(s => {
    try { document.querySelectorAll(s).forEach(cb => set.add(cb)); } catch(e){}
  });
  const checkboxes = Array.from(set);
  const selected = [];
  checkboxes.forEach(cb => {
    try {
      if (cb.checked) {
        const tr = cb.closest('tr');
        const labelTd = tr ? tr.querySelectorAll('td')[1] : null;
        const text = labelTd ? labelTd.textContent.trim() : (cb.getAttribute('data-label') || cb.value || '');
        if (text) selected.push(text);
      }
    } catch (e) {}
  });
  if (!selected.length) return '<p style="font-size:11px;">None selected.</p>';
  return `<ul>${selected.map(s => `<li>${_escapeHtml(s)}</li>`).join('')}</ul>`;
}

// Build AFB elemental analysis table from blendValues div
function buildAFBTableHTML() {
  const blendDiv = document.getElementById('blendValues');
  if (!blendDiv || !blendDiv.innerHTML.trim()) return '<p style="font-size:11px;">No data available. Run calculation first.</p>';
  return blendDiv.innerHTML;
}

/* -----------------------------------------------------------------------
   Individual Coal (100%) AFT prediction — for the PDF report only.
   For every distinct coal currently selected in the blend rows, this
   calls the same "./calculate-aft" predict endpoint used for the blend,
   but with that single coal's own properties at 100% (i.e. no weighted
   averaging with the other coals in the blend).
----------------------------------------------------------------------- */

// Same property lookup fallback logic used by calculateWeightedAverage(),
// duplicated here (read-only helper) so the existing blend calculation
// code is left untouched.
function _getCoalPropertyValue(coalInfo, prop) {
  const p = coalInfo.properties || {};
  if (p[prop] !== undefined) return parseFloat(p[prop]) || 0;

  const ascii = prop.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => {
    const rev = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return rev[ch] || ch;
  });
  if (p[ascii] !== undefined) return parseFloat(p[ascii]) || 0;

  const simple = ascii.replace(/\s+/g, '');
  if (p[simple] !== undefined) return parseFloat(p[simple]) || 0;

  return 0;
}

// Same checkbox-score logic used inside calculateWeightedAverage(), duplicated
// here so the individual coal AFT is adjusted the same way the blend AFT is.
function _computeCheckboxesScoreForReport() {
  const allQuestionss = ["question1", "question2", "question3", "question4", "question5",
                          "question6", "question7", "question8", "question9", "question10", "question11"];
  const scoreMappings = {
    "question1": [9.97, 0], "question2": [6.889, 0], "question3": [23.80875, 0],
    "question4": [3.315, 0], "question5": [12.083, 0], "question6": [5.454, 0],
    "question7": [6.2721, 0], "question8": [16.1446, 0], "question9": [18.6817, 0],
    "question10": [17.9704, 0], "question11": [40.0607, 0]
  };
  const selectedValuess = getSelectedCheckboxes();
  let checkboxesScore = 0;
  allQuestionss.forEach(q => {
    checkboxesScore += selectedValuess.includes(q) ? scoreMappings[q][0] : scoreMappings[q][1];
  });
  return checkboxesScore;
}

// Collect each distinct coal currently selected across the blend rows,
// call the predict endpoint for that coal alone (100%), and return
// [{ name, aft }, ...]
async function computeIndividualCoalAFTs() {
  const results = [];
  const blends = document.querySelectorAll('.blend');
  const seen = new Map(); // coalId -> display name (dedupe if same coal picked twice)

  blends.forEach((blend, index) => {
    const sel = document.querySelector(`#coal${index}`);
    if (!sel || !sel.value) return;
    const coalId = sel.value;
    if (seen.has(coalId)) return;
    const name = sel.options[sel.selectedIndex]?.text?.trim() || coalId;
    seen.set(coalId, name);
  });

  if (!seen.size || !Array.isArray(window.coalData)) return results;

  const checkboxesScore = _computeCheckboxesScoreForReport();

  for (const [coalId, name] of seen.entries()) {
    const coalInfo = window.coalData.find(c => c.id === coalId);
    if (!coalInfo) { results.push({ name, aft: null }); continue; }

    const SIO = _getCoalPropertyValue(coalInfo, "SiO₂");
    const ALO = _getCoalPropertyValue(coalInfo, "Al₂O₃");
    const FEO = _getCoalPropertyValue(coalInfo, "Fe₂O₃");
    const CAO = _getCoalPropertyValue(coalInfo, "CaO");
    const MGO = _getCoalPropertyValue(coalInfo, "MgO");
    const NAO = _getCoalPropertyValue(coalInfo, "Na₂O");
    const KO  = _getCoalPropertyValue(coalInfo, "K₂O");
    const TIO = _getCoalPropertyValue(coalInfo, "TiO₂");
    const SO  = _getCoalPropertyValue(coalInfo, "SO₃");
    const PO  = _getCoalPropertyValue(coalInfo, "P₂O₅");
    const S   = _getCoalPropertyValue(coalInfo, "Sulphur (S)");
    const MNO = _getCoalPropertyValue(coalInfo, "Mn₃O₄");

    // Same acidic/basic/other oxide grouping used to place the blended
    // point on the ternary (see the a/b/c math inside calculateWeightedAverage),
    // computed here for this single coal at 100% so it can be placed on
    // the same ternary axes for the report-only export.
    const a = SIO + ALO + TIO;               // acidic oxides -> a axis
    const b = CAO + MGO + NAO + KO;          // basic oxides  -> b axis
    const c = FEO + SO + PO + MNO;           // other oxides  -> c axis

    try {
      const result = await axios.post(
        './calculate-aft',
        { values: [SIO, ALO, FEO, CAO, MGO, NAO, KO, SO, TIO, PO, S] },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      let aft = result.data.prediction;
      aft -= checkboxesScore;
      results.push({ name, aft, a, b, c });
    } catch (e) {
      console.warn('Individual coal AFT prediction failed for', name, e);
      results.push({ name, aft: null, a, b, c });
    }
  }

  return results;
}

/* -----------------------------------------------------------------------
   Ternary click-to-expand
   Clicking the on-screen ternary card enlarges the SAME flat ternary
   triangle (see _setupTernaryHoverExpand below), with each currently
   selected coal's own predicted AFT plotted and labeled directly on the
   chart. Clicking the close (×) button, or clicking anywhere on the
   dimmed backdrop, restores everything exactly as it was. (The 3D "cube"
   view that used to open here now lives in the Advanced View's "Coal AFT
   Cube View" card instead -- see drawCoalCubeChart / _setupAdvancedExpand.)
----------------------------------------------------------------------- */

/* -----------------------------------------------------------------------
   Cube view helpers
   Turns the expanded 3D scatter into a literal cube (fixed equal-aspect
   bounding box + wireframe edges) and adds camera "presets" so rotating
   isn't the only way to focus on one thing: the default/Overview preset
   shows every coal blended together in one view (same as before), while
   clicking a coal button (or double-clicking the cube) snaps the camera
   to look at that coal's corner of the box and fades the rest out — or
   a pair of coals, showing just those two. Nothing here touches the
   flat 2D ternary card; it only applies inside the expanded 3D view.
----------------------------------------------------------------------- */
const CUBE_WIREFRAME_NAME = '__cube_wireframe__';

function _cubePad(min, max) {
  const span = (max - min) || 1;
  const pad = span * 0.18 || 0.5;
  return [min - pad, max + pad];
}

// Bounding box (with padding) that encloses every point currently on
// the cube, used both for the wireframe edges and to fix the scene's
// axis ranges so the box doesn't resize/jump as traces are swapped.
function _cubeRangesFor(points) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y), zs = points.map(p => p.z);
  return {
    xr: _cubePad(Math.min(...xs), Math.max(...xs)),
    yr: _cubePad(Math.min(...ys), Math.max(...ys)),
    zr: _cubePad(Math.min(...zs), Math.max(...zs))
  };
}

// Plotly's scene.camera.eye is specified in the scene's own normalized
// coordinates, not raw data units -- so a point's real (x,y,z) has to be
// rescaled into roughly -1..1 against the cube's own box before it can
// be used as a camera direction.
function _cubeNorm(v, range) {
  const mid = (range[0] + range[1]) / 2;
  const half = (range[1] - range[0]) / 2 || 1;
  return (v - mid) / half;
}

// Eye position that looks in from just outside the cube, roughly
// face-on to the given point (or the averaged direction of a couple of
// points, for a pair preset) -- so "snapping" to a coal genuinely faces
// that coal's side of the box instead of jumping to an arbitrary angle.
function _cubeEyeForPoints(pts, ranges) {
  const R = 2.1; // similar magnitude to the default overview eye
  let nx = 0, ny = 0, nz = 0;
  pts.forEach(p => {
    nx += _cubeNorm(p.x, ranges.xr);
    ny += _cubeNorm(p.y, ranges.yr);
    nz += _cubeNorm(p.z, ranges.zr);
  });
  nx /= pts.length; ny /= pts.length; nz /= pts.length;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return {
    x: (nx / len) * R,
    y: (ny / len) * R,
    z: Math.max((nz / len) * R, 0.55) // keep a bit of elevation so it never looks flat
  };
}

// 12-edge box outline as one scatter3d line trace (a `null` after each
// edge breaks the line so it doesn't zig-zag across the box).
function _cubeWireframeTrace(ranges) {
  const [x0, x1] = ranges.xr, [y0, y1] = ranges.yr, [z0, z1] = ranges.zr;
  const corners = {
    a: [x0, y0, z0], b: [x1, y0, z0], c: [x1, y1, z0], d: [x0, y1, z0],
    e: [x0, y0, z1], f: [x1, y0, z1], g: [x1, y1, z1], h: [x0, y1, z1]
  };
  const edges = [
    ['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a'],
    ['e', 'f'], ['f', 'g'], ['g', 'h'], ['h', 'e'],
    ['a', 'e'], ['b', 'f'], ['c', 'g'], ['d', 'h']
  ];
  const x = [], y = [], z = [];
  edges.forEach(([p1, p2]) => {
    x.push(corners[p1][0], corners[p2][0], null);
    y.push(corners[p1][1], corners[p2][1], null);
    z.push(corners[p1][2], corners[p2][2], null);
  });
  return {
    type: 'scatter3d', mode: 'lines', name: CUBE_WIREFRAME_NAME,
    x, y, z,
    line: { color: 'rgba(50, 226, 241, 0.35)', width: 2 },
    hoverinfo: 'skip', showlegend: false
  };
}

let _ternaryHoverBackdrop = null;
// Holds the collapse() function for whichever card (ternary OR advanced
// dashboard) is currently expanded, so the single shared backdrop
// click-listener (bound once, below) always closes the right one even
// though fresh wrapper/plotDiv elements are created on every Calculate.
let _currentExpandedCollapse = null;
// Populated by _setupTernaryHoverExpand / _setupAdvancedExpand on every
// Calculate so the switch button inside one expanded card can jump
// straight to the other, instead of only being able to close.
let _expandRegistry = { ternary: null, advanced: null };
function _getTernaryHoverBackdrop() {
  if (_ternaryHoverBackdrop && document.body.contains(_ternaryHoverBackdrop)) return _ternaryHoverBackdrop;
  const bd = document.createElement('div');
  bd.className = 'ternary-hover-backdrop';
  bd.addEventListener('click', () => { if (_currentExpandedCollapse) _currentExpandedCollapse(); });
  document.body.appendChild(bd);
  _ternaryHoverBackdrop = bd;
  return bd;
}

// Cheap cache so repeated hovers over an unchanged blend don't re-hit the
// prediction endpoint for every coal each time.
let _individualAftCache = null;
function _getTernaryBlendSignature() {
  const parts = [];
  document.querySelectorAll('.blend').forEach((blend, index) => {
    const sel = document.querySelector(`#coal${index}`);
    const range = document.querySelector(`#currentrange${index}`);
    parts.push((sel ? sel.value : '') + ':' + (range ? range.value : ''));
  });
  return parts.join('|');
}

// Cycles a single blinking label through every point currently plotted
// in the expanded 3D scatter (both the "Blended AFT" trace and the
// "Individual Coal AFT" trace once it's added) -- so each coal's name
// and AFT is shown automatically in turn instead of requiring a hover.
// Reuses each trace's own `text` array (the exact same string already
// used for the hover tooltip), so the auto-shown label always matches
// what hovering that point would show. Anchored in real 3D coordinates
// (scene.annotations), so it stays pinned to its point even while the
// user rotates/zooms the plot.
function _startAutoCycleLabels(plotDiv, pointsOverride) {
  if (!window.Plotly || !plotDiv || !plotDiv.data) return null;

  // pointsOverride lets a cube preset (e.g. "just this one coal") cycle
  // only through the points that preset is focused on, instead of every
  // point on the plot.
  let points = pointsOverride;
  if (!points) {
    points = [];
    plotDiv.data.forEach(trace => {
      if (trace.type !== 'scatter3d' || !trace.x || trace.name === CUBE_WIREFRAME_NAME) return;
      trace.x.forEach((x, i) => {
        const y = trace.y[i], z = trace.z[i];
        const text = Array.isArray(trace.text) ? trace.text[i] : trace.text;
        if (x == null || y == null || z == null || !text) return;
        points.push({ x, y, z, text });
      });
    });
  }
  if (!points.length) return null;

  let idx = 0;
  let stopped = false;
  let timeoutId = null;
  const VISIBLE_MS = 1600; // how long each label stays up
  const BLINK_GAP_MS = 280; // brief blank "blink" before the next one

  function showNext() {
    if (stopped || !document.body.contains(plotDiv)) return;
    const pt = points[idx];
    idx = (idx + 1) % points.length;
    Plotly.relayout(plotDiv, {
      'scene.annotations': [{
        x: pt.x, y: pt.y, z: pt.z,
        text: pt.text,
        showarrow: true,
        arrowcolor: '#f4f8ff',
        arrowhead: 2,
        arrowsize: 0.8,
        ax: 0, ay: -40,
        font: { color: '#f4f8ff', size: 13 },
        bgcolor: 'rgba(6, 14, 22, 0.88)',
        bordercolor: 'rgba(50, 226, 241, 0.82)',
        borderwidth: 1,
        borderpad: 4
      }]
    }).catch(() => {});
    timeoutId = setTimeout(hide, VISIBLE_MS);
  }
  function hide() {
    if (stopped) return;
    Plotly.relayout(plotDiv, { 'scene.annotations': [] }).catch(() => {});
    timeoutId = setTimeout(showNext, BLINK_GAP_MS);
  }

  showNext();
  return {
    stop() {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (document.body.contains(plotDiv)) {
        Plotly.relayout(plotDiv, { 'scene.annotations': [] }).catch(() => {});
      }
    }
  };
}

function _setupTernaryHoverExpand(wrapper, plotDiv) {
  let expanded = false;
  let originalParent = null;
  let originalNextSibling = null;

  // ---------------------------------------------------------------------
  // Zoomed ternary view: instead of the old 3D/cube expansion, clicking
  // the ternary card now enlarges the SAME flat ternary triangle, with
  // every currently selected coal's own (100%) predicted AFT plotted and
  // labeled directly on the chart (no hover needed to see which dot is
  // which). If two coals land close together on the triangle, the second
  // one's label is flipped to the opposite side of its dot from the
  // first, so the two labels don't overlap. The 3D "cube" view now lives
  // in the Advanced View's "Coal AFT Cube View" card instead (see
  // drawCoalCubeChart / _setupAdvancedExpand).
  // ---------------------------------------------------------------------

  // Converts a point's raw ternary (a,b,c) into the same equilateral-
  // triangle x/y that Plotly's ternary renderer effectively uses, purely
  // so label-overlap can be judged by real on-triangle distance -- not
  // for display (Plotly still does its own a/b/c layout).
  function _ternarySimplexXY(a, b, c) {
    const total = (a + b + c) || 1;
    const bf = b / total, cf = c / total;
    return { x: 0.5 * (2 * bf + cf), y: (Math.sqrt(3) / 2) * cf };
  }

  const LABEL_OPPOSITE = {
    'top center': 'bottom center', 'bottom center': 'top center',
    'top right': 'bottom left', 'bottom left': 'top right',
    'top left': 'bottom right', 'bottom right': 'top left',
    'middle left': 'middle right', 'middle right': 'middle left'
  };
  const LABEL_DEFAULT = 'top center';
  // Two coal points closer than this (in the normalized 0..~1 triangle
  // above) are considered "near" each other for label placement.
  const LABEL_NEAR_THRESHOLD = 0.055;

  // For each point (in the order given), if it lands near an
  // already-placed point, flip its label to that point's opposite side;
  // otherwise use the default position. Simple and cheap, but it's
  // exactly the "if two AFTs are close, put the labels on opposite
  // sides" behaviour that keeps them legible without a full layout solver.
  function _assignLabelPositions(points) {
    const positions = [];
    for (let i = 0; i < points.length; i++) {
      let chosen = LABEL_DEFAULT;
      for (let j = 0; j < i; j++) {
        const dx = points[i].x - points[j].x, dy = points[i].y - points[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < LABEL_NEAR_THRESHOLD) {
          chosen = LABEL_OPPOSITE[positions[j]] || 'bottom center';
          break;
        }
      }
      positions.push(chosen);
    }
    return positions;
  }

  // Builds the {data, layout} for the zoomed ternary: the same "Blended
  // AFT" trace as the on-screen card (updatePlot()), plus an "Individual
  // Coal AFT" trace with each coal's name + AFT drawn right on its dot.
  function _buildZoomedTernaryPlot(individualResults) {
    const GLOW_WHITE = "#f4f8ff";
    const GLOW_WHITE_SOFT = "rgba(244, 248, 255, 0.55)";
    const AXIS_LABEL_FONT = { size: 13, color: GLOW_WHITE };
    const TICK_FONT = { size: 11, color: GLOW_WHITE_SOFT };

    const blendedTrace = {
      type: 'scatterternary', mode: 'markers', name: 'Blended AFT',
      a: samples.map(s => s.acidicOxides), b: samples.map(s => s.basicOxides), c: samples.map(s => s.otherOxides),
      marker: {
        size: MARKER_SIZE + 3, color: samples.map(s => s.AFT), colorscale: 'Jet', showscale: false,
        line: { width: 1, color: 'rgba(255,255,255,0.6)' }
      },
      text: samples.map(s => `Blended AFT: ${parseFloat(s.AFT).toFixed(2)}°C`), hoverinfo: 'text'
    };

    const data = [blendedTrace];

    if (individualResults.length) {
      const simplexPts = individualResults.map(r => _ternarySimplexXY(r.a, r.b, r.c));
      const positions = _assignLabelPositions(simplexPts);

      const individualTrace = {
        type: 'scatterternary', mode: 'markers+text', name: 'Individual Coal AFT',
        a: individualResults.map(r => r.a), b: individualResults.map(r => r.b), c: individualResults.map(r => r.c),
        marker: {
          symbol: 'diamond', size: MARKER_SIZE + 5,
          color: individualResults.map(r => r.aft), colorscale: 'Jet', showscale: false,
          line: { width: 1.5, color: '#111' }
        },
        text: individualResults.map(r => `${r.name}<br>${Math.round(Number(r.aft))}°C`),
        textposition: positions,
        textfont: { size: 11, color: GLOW_WHITE },
        hovertext: individualResults.map(r => `${r.name} — Individual AFT: ${Math.round(Number(r.aft))}°C`),
        hoverinfo: 'text', showlegend: false
      };
      data.push(individualTrace);
    }

    const layout = {
      autosize: true,
      margin: { l: 60, r: 50, t: 40, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
      ternary: {
        bgcolor: 'rgba(0,0,0,0)', sum: 100,
        aaxis: { title: { text: "Thermal Stability", font: AXIS_LABEL_FONT }, showticklabels: true, tickfont: TICK_FONT, linecolor: GLOW_WHITE, linewidth: 2, gridcolor: GLOW_WHITE_SOFT },
        baxis: { title: { text: "Fusion Accelerator", font: AXIS_LABEL_FONT }, showticklabels: true, tickfont: TICK_FONT, linecolor: GLOW_WHITE, linewidth: 2, gridcolor: GLOW_WHITE_SOFT },
        caxis: { title: { text: "Hardening Index", font: AXIS_LABEL_FONT, standoff: 10 }, showticklabels: true, title_standoff: 10, tickfont: TICK_FONT, linecolor: GLOW_WHITE, linewidth: 2, gridcolor: GLOW_WHITE_SOFT }
      },
      font: { color: GLOW_WHITE }
    };
    return { data, layout };
  }

  async function expand() {
    if (expanded) return;
    expanded = true;
    _currentExpandedCollapse = collapse;

    // Re-home under <body> so the enlarged card and backdrop sit above
    // (and blur) the whole page, not just whatever panel it started in.
    originalParent = wrapper.parentNode;
    originalNextSibling = wrapper.nextSibling;
    document.body.appendChild(wrapper);

    _getTernaryHoverBackdrop().classList.add('active');
    wrapper.classList.add('ternary-expanded');

    let legend = wrapper.querySelector('.ternary-hover-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.className = 'ternary-hover-legend';
      legend.innerHTML =
        '<span><i class="ternary-legend-swatch ternary-legend-swatch-coal"></i>Individual Coal AFT</span>' +
        '<span><i class="ternary-legend-swatch ternary-legend-swatch-blend"></i>Blended AFT</span>';
      wrapper.appendChild(legend);
    }
    legend.style.display = 'flex';

    let closeBtn = wrapper.querySelector('.ternary-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'ternary-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = 'Close';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        collapse();
      });
      wrapper.appendChild(closeBtn);
    }

    let switchBtn = wrapper.querySelector('.expand-switch-btn');
    if (!switchBtn) {
      switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'expand-switch-btn';
      switchBtn.innerHTML = '<span>\u2726</span> Advanced View';
      switchBtn.title = 'Switch to the Advanced View';
      switchBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await collapse();
        if (_expandRegistry.advanced) _expandRegistry.advanced.expand();
      });
      wrapper.appendChild(switchBtn);
    }

    // Fetch each selected coal's own (100%) predicted AFT (cached by
    // blend signature, same cache the Coal AFT Cube View card uses) and
    // redraw the ternary, enlarged, with those points labeled on-chart.
    try {
      const sig = _getTernaryBlendSignature();
      let results;
      if (_individualAftCache && _individualAftCache.sig === sig) {
        results = _individualAftCache.results;
      } else {
        results = await computeIndividualCoalAFTs();
        _individualAftCache = { sig, results };
      }
      const valid = (results || []).filter(r => r && r.aft != null && !isNaN(r.aft) && r.a != null && r.b != null && r.c != null);

      if (expanded && window.Plotly) {
        const { data, layout } = _buildZoomedTernaryPlot(valid);
        await Plotly.newPlot(plotDiv, data, layout, { responsive: true });
        requestAnimationFrame(() => {
          const svgLayers = plotDiv.querySelectorAll('.main-svg');
          svgLayers.forEach(svg => {
            svg.style.filter = 'drop-shadow(0 0 3px rgba(244, 248, 255, 0.55))';
          });
        });
      }
    } catch (e) {
      console.warn('ternary hover: individual coal AFT lookup failed', e);
    }
  }

  async function collapse() {
    expanded = false;
    if (_currentExpandedCollapse === collapse) _currentExpandedCollapse = null;
    wrapper.classList.remove('ternary-expanded');
    const legend = wrapper.querySelector('.ternary-hover-legend');
    if (legend) legend.style.display = 'none';
    _getTernaryHoverBackdrop().classList.remove('active');

    if (originalParent) {
      if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
        originalParent.insertBefore(wrapper, originalNextSibling);
      } else {
        originalParent.appendChild(wrapper);
      }
    }

    // Rebuild the original flat 2D ternary plot (this naturally drops the
    // extra "Individual Coal AFT" trace too, since it's a fresh newPlot).
    if (window.Plotly) {
      try {
        updatePlot();
      } catch (e) {}
    }
  }

  wrapper.style.cursor = 'zoom-in';
  wrapper.title = 'Click to enlarge';
  wrapper.addEventListener('click', (e) => {
    if (expanded) return; // ignore clicks on the chart itself while already expanded; use the × or backdrop to close
    expand();
  });

  _expandRegistry.ternary = { expand, collapse };
}

// Same click-to-enlarge behaviour as the ternary card, but for the
// "Compositional Radar / Ash Fusion Characteristics / Deposition Tendency
// Map" dashboard. Generic on purpose — it doesn't know about the
// ternary/advanced toggle button at all; the calling code wraps the
// registry entries this produces (see calculateWeightedAverage) to keep
// that toggle's state in sync when switching via the in-card button.
function _setupAdvancedExpand(wrapper) {
  let expanded = false;
  let originalParent = null;
  let originalNextSibling = null;
  let _radarBlink = null;
  let _ashFusionBlink = null;

  function _resizeAdvancedCharts() {
    if (!window.Plotly) return;
    ['radarChart', 'ashFusionChart', 'coalCubeChart'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { try { Plotly.Plots.resize(el); } catch (e) {} }
    });
  }

  // ---------------------------------------------------------------------
  // Coal AFT Cube View: zoom-only controls.
  // Ported from the ternary card's old click-to-expand cube (camera
  // "presets" that snap to one coal or a pair, double-click to cycle
  // through them, and auto-blinking point labels) -- now driven by the
  // advanced dashboard's own expand()/collapse() instead of the ternary
  // card's, since the cube itself now lives here (see drawCoalCubeChart /
  // _buildCoalCubePlot above) in place of the old Ash Deposition
  // Tendency Map. The compact in-grid card (drawCoalCubeChart) has none
  // of this -- presets/labels only appear once this dashboard is zoomed.
  // ---------------------------------------------------------------------
  let _cubeCoalPoints = [];
  let _cubeBlendPoints = [];
  let _cubeRanges = null;
  let _cubePresetOrder = [];
  let _cubePresetCycleIdx = 0;
  let _cubeAutoCycle = null;

  function _cubeAllPoints() { return _cubeBlendPoints.concat(_cubeCoalPoints); }

  async function _applyCubePreset(kind, payload) {
    const el = document.getElementById('coalCubeChart');
    if (!window.Plotly || !el) return;
    let eye = { x: 1.5, y: 1.5, z: 0.9 };
    let cyclePoints = _cubeAllPoints();
    let blendOpacity = 1;
    let coalOpacities = _cubeCoalPoints.map(() => 1);

    if (kind === 'coal' && _cubeCoalPoints[payload] && _cubeRanges) {
      const p = _cubeCoalPoints[payload];
      eye = _cubeEyeForPoints([p], _cubeRanges);
      coalOpacities = _cubeCoalPoints.map((_, i) => i === payload ? 1 : 0.06);
      blendOpacity = 0.15;
      cyclePoints = [p];
    } else if (kind === 'pair' && Array.isArray(payload) && _cubeRanges) {
      const [i, j] = payload;
      const pi = _cubeCoalPoints[i], pj = _cubeCoalPoints[j];
      if (pi && pj) {
        eye = _cubeEyeForPoints([pi, pj], _cubeRanges);
        coalOpacities = _cubeCoalPoints.map((_, k) => (k === i || k === j) ? 1 : 0.06);
        blendOpacity = 0.15;
        cyclePoints = [pi, pj];
      }
    }
    // 'overview' (default) leaves everything above at full opacity / the
    // default camera / cycling through every point.

    try {
      if (_cubeCoalPoints.length) await Plotly.restyle(el, { 'marker.opacity': [coalOpacities] }, [1]);
      await Plotly.restyle(el, { 'marker.opacity': [blendOpacity] }, [0]);
      await Plotly.relayout(el, { 'scene.camera': { eye, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } } });
    } catch (e) {}

    if (_cubeAutoCycle) _cubeAutoCycle.stop();
    _cubeAutoCycle = _startAutoCycleLabels(el, cyclePoints.length ? cyclePoints : null);

    const bar = wrapper.querySelector('.cube-preset-bar');
    if (bar) {
      bar.querySelectorAll('.cube-preset-btn').forEach(b => {
        b.classList.toggle('cube-preset-active', b.dataset.cubeKind === kind && b.dataset.cubePayload === JSON.stringify(payload));
      });
    }
  }

  // Overview -> each coal -> each adjacent pair -> back to overview.
  function _cubeNextPreset() {
    if (!_cubePresetOrder.length) return;
    _cubePresetCycleIdx = (_cubePresetCycleIdx + 1) % _cubePresetOrder.length;
    const next = _cubePresetOrder[_cubePresetCycleIdx];
    _applyCubePreset(next.kind, next.payload);
  }

  // Builds the row of preset buttons, appended inside the small
  // "Coal AFT Cube View" card itself (.cube-card) rather than the whole
  // dashboard wrapper, so it doesn't overlap the radar / ash-fusion cards
  // next to it.
  function _buildCubePresetBar() {
    const cubeCard = wrapper.querySelector('.cube-card') || wrapper;
    const oldBar = cubeCard.querySelector('.cube-preset-bar');
    if (oldBar) oldBar.remove();
    const oldHint = cubeCard.querySelector('.cube-preset-hint');
    if (oldHint) oldHint.remove();

    _cubePresetOrder = [{ kind: 'overview', payload: null, label: 'Overview' }];
    _cubeCoalPoints.forEach((p, i) => {
      _cubePresetOrder.push({ kind: 'coal', payload: i, label: p.name });
    });
    if (_cubeCoalPoints.length > 1) {
      for (let i = 0; i < _cubeCoalPoints.length; i++) {
        const j = (i + 1) % _cubeCoalPoints.length;
        if (j > i || _cubeCoalPoints.length === 2) {
          const n1 = _cubeCoalPoints[i].name.split(' ')[0];
          const n2 = _cubeCoalPoints[j].name.split(' ')[0];
          _cubePresetOrder.push({ kind: 'pair', payload: [i, j], label: `${n1} + ${n2}` });
        }
      }
    }
    _cubePresetCycleIdx = 0;

    const bar = document.createElement('div');
    bar.className = 'cube-preset-bar';
    _cubePresetOrder.forEach((preset, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cube-preset-btn';
      let label = preset.label;
      if (label.length > 16) label = label.slice(0, 15) + '\u2026';
      btn.textContent = label;
      btn.title = preset.kind === 'overview' ? 'Show every coal blended together' : preset.label;
      btn.dataset.cubeKind = preset.kind;
      btn.dataset.cubePayload = JSON.stringify(preset.payload);
      if (idx === 0) btn.classList.add('cube-preset-active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _cubePresetCycleIdx = idx;
        _applyCubePreset(preset.kind, preset.payload);
      });
      bar.appendChild(btn);
    });
    cubeCard.appendChild(bar);

    if (_cubePresetOrder.length > 1) {
      const hint = document.createElement('div');
      hint.className = 'cube-preset-hint';
      hint.textContent = 'Double-click the cube, or tap below, to focus one coal or a pair';
      cubeCard.appendChild(hint);
    }
  }

  // Rebuilds the cube at full (zoomed) size and turns on presets/labels.
  async function _activateCube() {
    const el = document.getElementById('coalCubeChart');
    if (!window.Plotly || !el) return;
    try {
      const gathered = await _gatherCoalCubePoints();
      _cubeBlendPoints = gathered.blendPoints;
      _cubeCoalPoints = gathered.coalPoints;
      _cubeRanges = gathered.ranges;

      const { data, layout } = _buildCoalCubePlot(_cubeBlendPoints, _cubeCoalPoints, _cubeRanges, false);
      await Plotly.newPlot(el, data, layout, { responsive: true });

      // Double-click cycles Overview -> each coal -> each pair -> back to
      // Overview. Bound once per plot element; returning false suppresses
      // Plotly's own "double-click resets camera" default.
      if (!el._cubeDblClickBound) {
        el._cubeDblClickBound = true;
        el.on('plotly_doubleclick', () => {
          _cubeNextPreset();
          return false;
        });
      }

      if (_cubeCoalPoints.length) _buildCubePresetBar();

      if (_cubeAutoCycle) _cubeAutoCycle.stop();
      const allPts = _cubeAllPoints();
      _cubeAutoCycle = _startAutoCycleLabels(el, allPts.length ? allPts : null);
    } catch (e) { console.warn('Coal AFT Cube View (zoom) render failed', e); }
  }

  function _deactivateCube() {
    if (_cubeAutoCycle) { _cubeAutoCycle.stop(); _cubeAutoCycle = null; }
    const cubeCard = wrapper.querySelector('.cube-card') || wrapper;
    const bar = cubeCard.querySelector('.cube-preset-bar');
    if (bar) bar.remove();
    const hint = cubeCard.querySelector('.cube-preset-hint');
    if (hint) hint.remove();
    _cubeCoalPoints = []; _cubeBlendPoints = []; _cubeRanges = null;
    _cubePresetOrder = []; _cubePresetCycleIdx = 0;
    if (window.Plotly) {
      try { drawCoalCubeChart(advDashData || {}); } catch (e) {}
    }
  }

  // Turns the zoomed view's charts "on": rebuilds the Coal AFT Cube View
  // at full size with its camera presets + auto-labels, and starts the
  // radar/ash-fusion blink cycles that flash each element's name/value
  // automatically instead of requiring a hover. All three are reversed
  // in _deactivateZoomedCharts() on collapse.
  function _activateZoomedCharts() {
    if (!window.Plotly) return;
    _activateCube();
    const radarEl = document.getElementById('radarChart');
    if (radarEl) { if (_radarBlink) _radarBlink.stop(); _radarBlink = _startRadarBlink(radarEl); }
    const ashEl = document.getElementById('ashFusionChart');
    if (ashEl) { if (_ashFusionBlink) _ashFusionBlink.stop(); _ashFusionBlink = _startAshFusionBlink(ashEl); }
  }

  function _deactivateZoomedCharts() {
    if (_radarBlink) { _radarBlink.stop(); _radarBlink = null; }
    if (_ashFusionBlink) { _ashFusionBlink.stop(); _ashFusionBlink = null; }
    _deactivateCube();
  }

  function expand() {
    if (expanded) return;
    expanded = true;
    _currentExpandedCollapse = collapse;

    originalParent = wrapper.parentNode;
    originalNextSibling = wrapper.nextSibling;
    document.body.appendChild(wrapper);

    _getTernaryHoverBackdrop().classList.add('active');
    wrapper.classList.add('advanced-expanded');

    let closeBtn = wrapper.querySelector('.ternary-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'ternary-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = 'Close';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        collapse();
      });
      wrapper.appendChild(closeBtn);
    }

    let switchBtn = wrapper.querySelector('.expand-switch-btn');
    if (!switchBtn) {
      switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'expand-switch-btn';
      switchBtn.innerHTML = '<span>\u25B3</span> Ternary View';
      switchBtn.title = 'Switch to the Ternary View';
      switchBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await collapse();
        if (_expandRegistry.ternary) _expandRegistry.ternary.expand();
      });
      wrapper.appendChild(switchBtn);
    }

    // Wait two frames so the card has actually taken on its enlarged
    // layout size before Plotly measures the containers to resize into.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _resizeAdvancedCharts();
      _activateZoomedCharts();
    }));
  }

  function collapse() {
    expanded = false;
    if (_currentExpandedCollapse === collapse) _currentExpandedCollapse = null;
    wrapper.classList.remove('advanced-expanded');
    _getTernaryHoverBackdrop().classList.remove('active');
    _deactivateZoomedCharts();

    if (originalParent) {
      if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
        originalParent.insertBefore(wrapper, originalNextSibling);
      } else {
        originalParent.appendChild(wrapper);
      }
    }

    requestAnimationFrame(() => requestAnimationFrame(_resizeAdvancedCharts));
  }

  wrapper.style.cursor = 'zoom-in';
  wrapper.title = 'Click to enlarge';
  wrapper.addEventListener('click', (e) => {
    if (expanded) return;
    expand();
  });

  _expandRegistry.advanced = { expand, collapse };
}

// Render the individual coal AFT results as a table in the same visual
// format as the other PDF tables.
function buildIndividualCoalTableHTML(results) {
  if (!Array.isArray(results) || !results.length) {
    return '<p style="font-size:11px;">No individual coal predictions available.</p>';
  }
  let rows = '';
  results.forEach(r => {
    const aftText = (r.aft == null || isNaN(r.aft)) ? 'N/A' : `${Math.round(r.aft)} °C`;
    rows += `<tr><td>${_escapeHtml(r.name)}</td><td>${_escapeHtml(aftText)}</td></tr>`;
  });
  return `<table><thead><tr><th>Coal Name</th><th>Predicted AFT</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// capture using html2canvas and return dataURL
async function captureElementPNG(el, opts = { scale: 2, backgroundColor: '#ffffff' }) {
  if (!el) return null;
  const canvas = await html2canvas(el, {
    scale: opts.scale || 2,
    useCORS: true,
    backgroundColor: opts.backgroundColor || '#ffffff'
  });
  return canvas.toDataURL('image/png');
}

/* -----------------------------------------------------------------------
   renderTernaryPNGWithAFT
   Arrow-based outside labels turned out to be unreliable across repeated
   attempts (measuring or computing a marker's screen position after the
   fact is inherently fragile — timing, clipping at plot edges, etc. all
   introduce ways for an arrow to land on the wrong point).

   Instead: every point gets a short marker (a number for each individual
   coal, "B" for the blend) placed directly ON its own dot using Plotly's
   native per-point text — the same mechanism Plotly itself uses to
   position the dot, so the label can never be mismatched to the wrong
   point. A small legend (built separately, see buildTernaryLegendHTML)
   maps each number back to the coal's full name and AFT.

   - Individual coal dots use the same Jet colorscale as the blend, with
     the color range spanning ALL AFT values being shown (so dots read as
     meaningfully different colors even if the blend's own calculation
     history only has one point, which would otherwise collapse to a
     single flat color).
   - Everything here (extra trace, labels, margin, size) is added right
     before the PNG snapshot and fully reverted right after, so the
     on-screen UI ternary is completely unaffected.
   - Report export only. Returns { url, legendItems } — legendItems is
     the ordered list the report should render as the legend table next
     to the image (see buildTernaryLegendHTML).
----------------------------------------------------------------------- */
async function renderTernaryPNGWithAFT(plotId, opts = { width: 620, height: 440, scale: 1.5 }, individualResults = []) {
  const div = document.getElementById(plotId);
  if (!div) return { url: null, legendItems: [] };

  const tIdx = 0;

  // Only coals with a valid predicted AFT and valid a/b/c can be placed
  // on the ternary. This is report-export only.
  const validIndividuals = (Array.isArray(individualResults) ? individualResults : [])
    .filter(r => r && r.aft != null && !isNaN(r.aft) && r.a != null && r.b != null && r.c != null);

  // Blended point's own AFT — read straight off the live trace so it
  // always matches whatever was last calculated.
  function getBlendedAFT() {
    try {
      const colorArr = div.data?.[tIdx]?.marker?.color;
      if (Array.isArray(colorArr) && colorArr.length) {
        const v = colorArr[colorArr.length - 1];
        if (v != null && !isNaN(v)) return Number(v);
      }
    } catch (e) {}
    return null;
  }
  const blendedAFT = getBlendedAFT();

  // Assign each individual coal a short number (matches the marker text
  // drawn on its dot); the blend always uses "B".
  const legendItems = validIndividuals.map((r, i) => ({
    marker: String(i + 1),
    name: r.name,
    aft: r.aft
  }));
  if (blendedAFT != null) {
    legendItems.push({ marker: 'B', name: 'Blended AFT', aft: blendedAFT });
  }

  // --- original layout margin/size (must match updatePlot) ---
  const ORIG_MARGIN = { l: 50, r: 40, t: 40, b: 40 };
  const PDF_MARGIN  = { l: 60, r: 60, t: 55, b: 100 };

  // Color range spanning EVERY AFT value actually being shown (individual
  // coals + blend), so the dots are meaningfully distinguishable even
  // when the blend trace's own calculation history has just one point.
  function getSharedColorRange() {
    const vals = [];
    if (blendedAFT != null) vals.push(blendedAFT);
    validIndividuals.forEach(r => {
      if (r.aft != null && !isNaN(r.aft)) vals.push(Number(r.aft));
    });
    if (vals.length >= 2) return [Math.min(...vals), Math.max(...vals)];
    if (vals.length === 1) return [vals[0] - 1, vals[0] + 1]; // avoid a degenerate single-value range
    return [null, null];
  }
  const [cmin, cmax] = getSharedColorRange();

  if (window.Plotly && typeof Plotly.toImage === 'function') {
    // Save original state so everything can be restored afterward
    const orig = {
      mode:         div.data?.[tIdx]?.mode,
      text:         div.data?.[tIdx]?.text,
      textposition: div.data?.[tIdx]?.textposition,
      textfont:     div.data?.[tIdx]?.textfont,
      showlegend:   div.data?.[tIdx]?.showlegend,
      cmin:         div.data?.[tIdx]?.marker?.cmin,
      cmax:         div.data?.[tIdx]?.marker?.cmax,
      size:         div.data?.[tIdx]?.marker?.size
    };
    const origWidth  = div.style.width;
    const origHeight = div.style.height;
    const origTraceCount = div.data ? div.data.length : 1;
    let individualTraceAdded = false;

    try {
      // 1. Put "B" directly on the blend marker, hide its legend entry
      //    (a legend only auto-shows once 2+ traces exist), and apply
      //    the shared color range.
      const blendRestyle = {
        mode:         ['markers+text'],
        text:         [blendedAFT != null ? ['<b>B</b>'] : null],
        textposition: ['middle center'],
        textfont:     [{ size: 22, family: 'Arial, sans-serif', color: '#ffffff' }],
        'marker.size': [(typeof MARKER_SIZE !== 'undefined' ? MARKER_SIZE : 9) + 16],
        showlegend:   [false]
      };
      if (cmin != null) blendRestyle['marker.cmin'] = [cmin];
      if (cmax != null) blendRestyle['marker.cmax'] = [cmax];
      await Plotly.restyle(div, blendRestyle, [tIdx]);

      // 2. Lock the live plot to the export width/height and margins.
      div.style.width  = opts.width  + 'px';
      div.style.height = opts.height + 'px';
      await Plotly.relayout(div, {
        width: opts.width, height: opts.height,
        margin: PDF_MARGIN, showlegend: false
      });

      // 3. Add one trace holding every individual coal, each with its
      //    own number drawn directly on its own dot — Plotly places the
      //    text using the exact same per-point data as the dot itself,
      //    so there is no separate "measure and hope it matches" step.
      if (validIndividuals.length) {
        const markerSpec = {
          size: (typeof MARKER_SIZE !== 'undefined' ? MARKER_SIZE : 9) + 16,
          color: validIndividuals.map(r => r.aft),
          colorscale: 'Jet',
          showscale: false,
          line: { width: 1, color: '#111' }
        };
        if (cmin != null) markerSpec.cmin = cmin;
        if (cmax != null) markerSpec.cmax = cmax;

        await Plotly.addTraces(div, {
          type: 'scatterternary',
          mode: 'markers+text',
          a: validIndividuals.map(r => r.a),
          b: validIndividuals.map(r => r.b),
          c: validIndividuals.map(r => r.c),
          marker: markerSpec,
          text: validIndividuals.map((r, i) => `<b>${i + 1}</b>`),
          textposition: 'middle center',
          textfont: { size: 20, family: 'Arial, sans-serif', color: '#ffffff' },
          hoverinfo: 'text',
          hovertext: validIndividuals.map(r => `${r.name} — AFT: ${Math.round(Number(r.aft))}°C`),
          showlegend: false
        });
        individualTraceAdded = true;
      }

      // 3b. Belt-and-braces contrast fix: force every ternary marker
      //     label's actual SVG <text> to render as bold white with a
      //     thick black outline, so the number/letter stays big and
      //     legible no matter how bright or dark the marker's own AFT
      //     color happens to be (white fill + black outline is readable
      //     on every color in the Jet scale, including dark red/blue).
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      try {
        const textEls = div.querySelectorAll('.scatterlayer text');
        textEls.forEach(t => {
          t.setAttribute('fill', '#ffffff');
          t.setAttribute('stroke', '#000000');
          t.setAttribute('stroke-width', '4');
          t.setAttribute('stroke-linejoin', 'round');
          t.setAttribute('paint-order', 'stroke fill');
          t.setAttribute('font-weight', 'bold');
          const curSize = parseFloat(t.getAttribute('font-size')) || 12;
          t.setAttribute('font-size', Math.max(curSize, 20) + 'px');
        });
      } catch (e) { console.warn('text contrast tweak failed', e); }

      // 4. Export to PNG
      const png = await Plotly.toImage(div, {
        format: 'png',
        width:  opts.width,
        height: opts.height,
        scale:  opts.scale
      });

      // 5. Restore: drop the temporary individual-coal trace
      if (individualTraceAdded) {
        await Plotly.deleteTraces(div, [origTraceCount]);
      }
      div.style.width  = origWidth;
      div.style.height = origHeight;
      await Plotly.relayout(div, { margin: ORIG_MARGIN, showlegend: null, autosize: true });

      // 6. Restore original text/mode/legend/color-range/size on the blend trace
      await Plotly.restyle(div, {
        mode:          [orig.mode         ?? 'markers'],
        text:          [orig.text         ?? null],
        textposition:  [orig.textposition ?? null],
        textfont:      [orig.textfont     ?? null],
        showlegend:    [orig.showlegend   ?? null],
        'marker.cmin': [orig.cmin ?? null],
        'marker.cmax': [orig.cmax ?? null],
        'marker.size': [orig.size ?? (typeof MARKER_SIZE !== 'undefined' ? MARKER_SIZE : 9)]
      }, [tIdx]);

      if (png) return { url: png, legendItems };

    } catch (err) {
      console.warn('Plotly export error, falling back to html2canvas capture:', err);
      try {
        if (individualTraceAdded && div.data && div.data.length > origTraceCount) {
          await Plotly.deleteTraces(div, [origTraceCount]);
        }
        div.style.width  = origWidth;
        div.style.height = origHeight;
        await Plotly.relayout(div, { margin: ORIG_MARGIN, showlegend: null, autosize: true });
        await Plotly.restyle(div, {
          mode:          [orig.mode         ?? 'markers'],
          text:          [orig.text         ?? null],
          textposition:  [orig.textposition ?? null],
          textfont:      [orig.textfont     ?? null],
          showlegend:    [orig.showlegend   ?? null],
          'marker.cmin': [orig.cmin ?? null],
          'marker.cmax': [orig.cmax ?? null],
          'marker.size': [orig.size ?? (typeof MARKER_SIZE !== 'undefined' ? MARKER_SIZE : 9)]
        }, [tIdx]);
      } catch(e){}
    }
  }

  // Fallback: screenshot via html2canvas
  const fallbackUrl = await captureElementPNG(div, { scale: 1.5 });
  return { url: fallbackUrl, legendItems };
}

// Small HTML legend mapping each ternary marker (number / "B") to the
// coal's full name and predicted AFT — renders right alongside the
// ternary image in the report.
function buildTernaryLegendHTML(legendItems) {
  if (!Array.isArray(legendItems) || !legendItems.length) return '';
  const rows = legendItems.map(it => `
    <tr>
      <td style="padding:2px 6px; font-weight:bold; border:1px solid #ccc; text-align:center; width:22px;">${it.marker}</td>
      <td style="padding:2px 6px; border:1px solid #ccc;">${it.name}</td>
      <td style="padding:2px 6px; border:1px solid #ccc; text-align:right; white-space:nowrap;">${Math.round(Number(it.aft))}°C</td>
    </tr>`).join('');
  return `
    <table style="border-collapse:collapse; font-size:10px; margin-top:6px; width:100%;">
      <thead>
        <tr>
          <th style="padding:2px 6px; border:1px solid #ccc; background:#0153ac; color:#fff;">#</th>
          <th style="padding:2px 6px; border:1px solid #ccc; background:#0153ac; color:#fff; text-align:left;">Coal</th>
          <th style="padding:2px 6px; border:1px solid #ccc; background:#0153ac; color:#fff;">AFT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* -----------------------------------------------------------------------
   The on-screen "Overall Score" bar uses a diagonal repeating-linear-
   gradient (red/yellow/green hatch stripes) layered on top of a solid
   base color for the O&M segment. In the browser, at normal size, those
   thin 5px stripes optically blend into a smooth color (e.g. yellow base
   + red hatch reads as orange). html2canvas renders the gradient at full
   fidelity instead of blending it, so the PDF shows harsh, high-contrast
   stripes instead of the smooth blended color seen on the webpage.

   Fix: right before capturing the dashboard for the PDF, swap the striped
   background for a flat, pre-blended solid color (50/50, since the hatch
   stripes and gaps are equal width), then restore the live striped
   version afterward so the on-screen UI is unaffected.
----------------------------------------------------------------------- */
function _rgbStringToArray(rgbStr) {
  const m = rgbStr && rgbStr.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0];
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function _blendRgbColors(colorA, colorB, weight = 0.5) {
  const a = _rgbStringToArray(colorA);
  const b = _rgbStringToArray(colorB);
  const r = Math.round(a[0] * (1 - weight) + b[0] * weight);
  const g = Math.round(a[1] * (1 - weight) + b[1] * weight);
  const bl = Math.round(a[2] * (1 - weight) + b[2] * weight);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Pull the actual stripe color out of a computed repeating-linear-gradient
// string (skips the fully-transparent gap stops).
function _extractHatchColorFromGradient(computedBgImage) {
  if (!computedBgImage || computedBgImage === 'none') return null;
  const matches = computedBgImage.match(/rgba?\([^)]+\)/g);
  if (!matches || !matches.length) return null;
  const solid = matches.filter(c => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const parts = m[1].split(',').map(s => parseFloat(s.trim()));
    const alpha = parts.length === 4 ? parts[3] : 1;
    return alpha > 0;
  });
  return solid.length ? solid[solid.length - 1] : null;
}

function _svgHatchDataUri(hatchColor) {
  const svgTile =
    `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'>` +
    `<rect width='10' height='10' fill='none'/>` +
    `<path d='M-2.5,2.5 L2.5,-2.5 M0,10 L10,0 M7.5,12.5 L12.5,7.5' ` +
    `stroke='${hatchColor}' stroke-width='5' shape-rendering='crispEdges'/>` +
    `</svg>`;
  const encoded = encodeURIComponent(svgTile)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `url("data:image/svg+xml,${encoded}")`;
}

function _flattenOverallScoreBarForExport() {
  const cbBar = document.getElementById('overallFillCheckbox');
  if (!cbBar) return null;

  const computed   = getComputedStyle(cbBar);
  const hatchColor = _extractHatchColorFromGradient(computed.backgroundImage);

  const original = {
    backgroundImage: cbBar.style.backgroundImage,
    backgroundColor: cbBar.style.backgroundColor
  };

  if (hatchColor) {
    cbBar.style.backgroundImage = _svgHatchDataUri(hatchColor);
  }

  return original;
}

function _restoreOverallScoreBarAfterExport(original) {
  if (!original) return;
  const cbBar = document.getElementById('overallFillCheckbox');
  if (!cbBar) return;
  cbBar.style.backgroundImage = original.backgroundImage;
  cbBar.style.backgroundColor = original.backgroundColor;
}

/* Capture the gauges + titles + overall score bar (hides download btn, AFB btn, ternary during capture) */
async function captureResultsDashboard() {
  const container = document.getElementById('resultsContainer');
  if (!container) return null;

  const dlBtn     = document.getElementById('downloadPDF');
  const blendBtn  = document.getElementById('blendPropertiesBtn');
  const ternaryDiv = document.getElementById('ternary-plot');
  const prevDl      = dlBtn      ? dlBtn.style.display      : null;
  const prevBlend   = blendBtn   ? blendBtn.style.display   : null;
  const prevTernary = ternaryDiv ? ternaryDiv.style.display : null;

  if (dlBtn)      dlBtn.style.display      = 'none';
  if (blendBtn)   blendBtn.style.display   = 'none';
  if (ternaryDiv) ternaryDiv.style.display = 'none';

  const originalBarStyle = _flattenOverallScoreBarForExport();

  let url = null;
  try {
    url = await captureElementPNG(container, { scale: 1.6 });
  } catch(e) { console.warn('dashboard capture err', e); }

  _restoreOverallScoreBarAfterExport(originalBarStyle);

  if (dlBtn      && prevDl      !== null) dlBtn.style.display      = prevDl;
  if (blendBtn   && prevBlend   !== null) blendBtn.style.display   = prevBlend;
  if (ternaryDiv && prevTernary !== null) ternaryDiv.style.display = prevTernary;

  return url;
}


/* ----------------- Main PDF builder: SINGLE PAGE ----------------- */
document.getElementById('downloadPDF').addEventListener('click', async function () {
  // remove previous temp nodes if any
  const prev1 = document.getElementById('pdfReportPage');
  if (prev1) prev1.remove();

  const page1 = document.createElement('div');
  page1.id = 'pdfReportPage';
  page1.style.position = 'fixed';
  page1.style.left = '120%';
  page1.style.top = '10px';
  page1.style.zIndex = '99999';
  page1.style.background = '#ffffff';

  const logoSrc = document.querySelector('.common-navbar img')?.src
    || document.querySelector('link[rel="icon"]')?.href
    || 'images/abhitech-logo.png';

  // Predict AFT for each individually selected coal at 100% (same predict
  // endpoint used for the blend), so it can be shown in its own table
  // right below the Simulated AFB Coal Elemental Analysis table.
  let individualCoalResults = [];
  try {
    individualCoalResults = await computeIndividualCoalAFTs();
  } catch (e) {
    console.warn('computeIndividualCoalAFTs failed', e);
  }

  page1.innerHTML = `
    <div class="header">
      <img src="${logoSrc}" alt="logo" onerror="this.style.display='none'">
      <div>
        <h1>Abhitech Energycon Limited — Slagging Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
      </div>
    </div>

    <div class="two-col-top">
      <div class="top-left-col">
        <section>
          <div class="section-title">Coal Blend &amp; Percent</div>
          ${buildCoalTableHTML()}
        </section>
        <section>
          <div class="section-title">Operational Parameters</div>
          ${buildOpParamsHTML()}
        </section>
      </div>
      <div class="top-right-col">
        <section>
          <div class="section-title">Simulated AFB Coal Elemental Analysis</div>
          <div id="afbTableHolder">${buildAFBTableHTML()}</div>
        </section>
        <section>
          <div class="section-title">Individual Coal AFT Predictions</div>
          <div id="individualCoalTableHolder">${buildIndividualCoalTableHTML(individualCoalResults)}</div>
        </section>
      </div>
    </div>

    <section>
      <div class="section-title">Slagging &amp; Fouling Dashboard</div>
      <div class="bottom-row">
        <div class="dashboard-col">
          <div id="dashboardHolder"></div>
        </div>
        <div class="ternary-col">
          <div id="ternaryHolder"></div>
        </div>
      </div>
    </section>

    <div class="footer">Abhitech Energycon Limited — Confidential Report</div>
  `;
  document.body.appendChild(page1);

  // Capture dashboard (gauges + overall score bar, no ternary, no buttons)
  try {
    const dashUrl = await captureResultsDashboard();
    if (dashUrl) {
      const img = document.createElement('img');
      img.src = dashUrl;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      document.getElementById('dashboardHolder').appendChild(img);
    } else {
      document.getElementById('dashboardHolder').innerHTML = '<p style="font-size:11px;">(Dashboard not available — run calculation first)</p>';
    }
  } catch(e) { console.warn('dashboard capture failed', e); }

  // Ternary with numbered/lettered markers (1,2,3... for individual coals,
  // "B" for the blend) plus a legend table mapping each marker to the
  // coal name and its AFT — replaces the earlier arrow-based approach,
  // which proved unreliable at pointing to the right dot.
  try {
    const ternaryResult = await renderTernaryPNGWithAFT(TERNARY_ID, { width: 620, height: 440, scale: 1.5 }, individualCoalResults);
    if (ternaryResult && ternaryResult.url) {
      const img = document.createElement('img');
      img.src = ternaryResult.url;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      document.getElementById('ternaryHolder').appendChild(img);

      const legendHTML = buildTernaryLegendHTML(ternaryResult.legendItems);
      if (legendHTML) {
        const legendWrap = document.createElement('div');
        legendWrap.innerHTML = legendHTML;
        document.getElementById('ternaryHolder').appendChild(legendWrap);
      }
    } else {
      document.getElementById('ternaryHolder').innerHTML = '<p style="font-size:11px;">(Ternary plot not available)</p>';
    }
  } catch(e) { console.warn('ternary capture err', e); }

  // Wait for all images to load
  const imgs = Array.from(page1.querySelectorAll('img'));
  await Promise.all(imgs.map(i => new Promise(res => { if (i.complete) return res(); i.onload = i.onerror = res; })));
  await new Promise(r => setTimeout(r, 300));

  // Capture the full page to canvas
  const canvas = await html2canvas(page1, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

  // Build single-page PDF
  let createPdf;
  if (window.jspdf && window.jspdf.jsPDF) createPdf = () => new window.jspdf.jsPDF('p', 'mm', 'a4');
  else if (window.jsPDF) createPdf = () => new window.jsPDF('p', 'mm', 'a4');
  else { alert('jsPDF not loaded'); page1.remove(); return; }

  const pdf = createPdf();
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6;

  if (!canvas || !canvas.width) { alert('Page capture failed'); page1.remove(); return; }

  const imgData = canvas.toDataURL('image/png');
  let drawW = pageW - margin * 2;
  let drawH = (canvas.height * drawW) / canvas.width;

  // Scale down to fit single page if needed
  const maxH = pageH - margin * 2;
  if (drawH > maxH) {
    const ratio = maxH / drawH;
    drawW *= ratio;
    drawH = maxH;
  }

  pdf.addImage(imgData, 'PNG', margin, margin, drawW, drawH);

  // Force download
  const blob = pdf.output('blob');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Abhitech_Slagging_Report.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);

  // Cleanup
  page1.remove();
});

document.getElementById("unitCapacity").addEventListener("change", function() {
    const selectedValue = this.value;
    console.log("Selected Unit Capacity:", selectedValue);
});


/* ---- next inline <script> blockk ------ */


if(localStorage.getItem('isLoggedIn') !== 'true') {
    alert('You must login first!');
    window.location.href = './login.html'; 
} else {
    document.body.style.display = 'block';
}
         function logoutUser() {
  localStorage.setItem('isLoggedIn', 'false'); 
  window.location.href = './login.html'; 
}