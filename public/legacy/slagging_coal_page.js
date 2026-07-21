function addBlend() {
    const MAX_COALS = 10; // <-- increased from 5 to 10
    const currentCoals = document.querySelectorAll('.blend').length;

    if (currentCoals >= MAX_COALS) {
        alert("You can only add up to 10 coal types.");
        return;
    }

    const index = currentCoals;
    const blendDiv = document.createElement("div");
    blendDiv.className = "blend";
    blendDiv.innerHTML = `
        <label for="coal${index}">Coal:</label>
        <select name="coal${index}" id="coal${index}">
            <option value="">Select Coal Type</option>
        </select>
        <input type="number" id="currentrange${index}" placeholder="Current Range (%)">
        <button type="button" class="remove-blend-btn" onclick="removeBlend(this)">X</button>
        <button type="button" class="properties-btn" onclick="fetchCoalProperties(${index})">Properties</button>
        <div id="properties${index}"></div>
    `;

    const currentRangeInput = blendDiv.querySelector(`#currentrange${index}`);
    currentRangeInput.addEventListener("input", updateTotalRange);

    const blendRow = document.querySelector(".blend-row");

    // Append the new blendDiv to the blendRow
    blendRow.appendChild(blendDiv); // This will add it to the end

    populateDropdown(blendDiv.querySelector(`#coal${index}`));
    updateTotalRange();
    sizeBlendRowVisible();
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
 
        

        // ----- size configuration (change numbers to taste) -----
const TERNARY_WIDTH = "88%";   // px (try 320 / 360 / 420)
const TERNARY_HEIGHT = 200;  // px fallback/minimum height; the on-screen card now stretches to fill remaining space via flex
const MARKER_SIZE = 8;       // ternary marker size (smaller if plot is tiny)

const GAUGE_W = 210;         // px for gauge dial width (track-style gauge, ported from reference viewBox 520x560)
const GAUGE_H = 226;         // px for gauge dial height (keeps the 520:560 aspect of the reference artwork)
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
            
            // keep a reference to the download button (if it exists)
const dlBtn = document.getElementById('downloadPDF');

// clear results (this removes DOM children but dlBtn variable still references the node)
rightContainerDiv.innerHTML = "";

// put the download button back at the top and show it
if (dlBtn) {
  // insert at the top so it stays in the top-right visually
  rightContainerDiv.insertBefore(dlBtn, rightContainerDiv.firstChild);
  dlBtn.classList.remove('hidden'); // remove the hidden class so it displays
  // ensure visibility over other elements
  dlBtn.style.zIndex = '9999';
}
        
            let newSample = {
                acidicOxides: acidicOxidesAvg,
                basicOxides: basicOxidesAvg,
                otherOxides: otherOxidesAvg,
                AFT: predictedAFT
            };
            samples.push(newSample);
        
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
                
                rightContainerDiv.appendChild(blendPropertiesBtn);
                
                
                // ============================================================
                // CAR-DASHBOARD STYLE GAUGES
                // Two circular instrument-cluster dials (Slagging / Fouling), each
                // with its outer-facing bezel ring only (the side facing the center
                // console is left open so the two dials read as one console), plus
                // a vertical "fuel style" score bar in between them. The
                // click-to-reveal-table behaviour on each dial works exactly as
                // before.
                // ============================================================

                let chartWrapper = document.createElement("div");
                chartWrapper.className = "car-dashboard-panel";
                rightContainerDiv.appendChild(chartWrapper);

                // Inner cluster that hugs exactly the two gauges + connector
                // (width: max-content in CSS) — the enclosing border lives on
                // THIS element, not on chartWrapper, because chartWrapper is
                // full-width (100%) and centers its content with flexbox; if
                // the border were drawn on chartWrapper it would stretch the
                // full width of the results panel and taper into two flat
                // disconnected lines instead of hugging the gauges.
                let dashboardCluster = document.createElement("div");
                dashboardCluster.className = "car-dashboard-cluster";
                dashboardCluster.style.position = "relative";
                dashboardCluster.style.display = "inline-flex";
                dashboardCluster.style.alignItems = "center";
                dashboardCluster.style.maxWidth = "100%";
                chartWrapper.appendChild(dashboardCluster);

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

                // Maps a Low/Moderate/High status word to the same green/yellow/red
                // used for the dial's fill, so the arc, glow and status pill all
                // read in the matching colour.
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
                const _TRACK_D_LEFT  = "M420 470 H230 L80 320 V240 L230 90 H420";
                const _TRACK_D_RIGHT = "M100 470 H290 L440 320 V240 L290 90 H100";

                function buildCarGaugeSVG(value, minValue, maxValue, colorRanges, size, titleText, statusText, mirror, uid) {
                    uid = uid || ("g" + Math.random().toString(36).slice(2, 9));
                    const range = maxValue - minValue;
                    const pct = Math.max(0, Math.min(100, ((value - minValue) / range) * 100));
                    const zoneColor = _statusColor(statusText);
                    const zoneGlow = _statusGlow(statusText);
                    const den = (maxValue % 1 === 0) ? maxValue : maxValue.toFixed(1);

                    const trackD = mirror ? _TRACK_D_LEFT : _TRACK_D_RIGHT;

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
                        { x: 438, y: 505 }, { x: 26, y: 335 }, { x: 26, y: 255 }, { x: 230, y: 55 }, { x: 438, y: 70 }
                    ];
                    const rightTickPos = [
                        { x: 82, y: 505 }, { x: 494, y: 335 }, { x: 494, y: 255 }, { x: 290, y: 55 }, { x: 82, y: 70 }
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
                        .cg-status-text-${uid}{fill:${zoneColor};font-size:26px;letter-spacing:2px;font-weight:650;text-anchor:middle;font-family:"Segoe UI",Arial,sans-serif;text-transform:uppercase;}
                      </style>

                      <path class="cg-border-${uid}" d="${trackD}"/>
                      <path class="cg-track-edge-${uid}" d="${trackD}"/>
                      <path class="cg-track-${uid}" d="${trackD}"/>
                      <path class="cg-active-${uid} car-gauge-fill-path" data-uid="${uid}" d="${trackD}"/>

                      ${tickLabels}

                      <text class="cg-score-${uid} car-gauge-score-text" data-uid="${uid}" data-value="${value}" x="260" y="258">0</text>
                      <text class="cg-score-suffix" x="260" y="324">/${den}</text>
                      <text class="cg-title" x="260" y="365">${titleTspans}</text>

                      <path class="cg-status-box-${uid}" d="M160 430 H360 L378 449 L360 477 H160 L142 449 Z"/>
                      <text class="cg-status-text-${uid}" x="260" y="458">${statusText}</text>
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

                // Builds one full gauge cluster (just the dial now — the title and
                // status live inside the SVG face itself). Returns
                // { wrapper, dialContainer } so click / advanced-view wiring
                // can attach to it afterwards.
                function buildGaugeCluster() {
                    const wrapper = document.createElement("div");
                    wrapper.className = "car-gauge-wrap";

                    const dialContainer = document.createElement("div");
                    dialContainer.className = "car-gauge-dial";
                    dialContainer.style.width = GAUGE_W + "px";
                    dialContainer.style.height = GAUGE_H + "px";
                    wrapper.appendChild(dialContainer);

                    return { wrapper, dialContainer };
                }

                // ---- Slagging dial ----
                const fspCluster = buildGaugeCluster();
                const fspGraphWrapper = fspCluster.wrapper;
                const fspGraphContainer = fspCluster.dialContainer;
                fspGraphContainer.id = "fspGaugeChart";
                fspGraphContainer.innerHTML = buildCarGaugeSVG(FSP, 0, 6, fspColorRanges, GAUGE_W, "SLAGGING\nPOTENTIAL", FSPD, true, "fsp");
                dashboardCluster.appendChild(fspGraphWrapper);
                animateGaugeReveal(fspGraphContainer);

                // ---- central overall-score stack: value floats above the
                // connector's top border line, the bordered box in the middle
                // holds the full-rectangle bottom-up score fill, and the
                // OVERALL SCORE caption + breakdown float below the bottom
                // border line ----
                const carCenterStack = document.createElement("div");
                carCenterStack.className = "car-center-stack";
                dashboardCluster.appendChild(carCenterStack);

                const carCenterBar = document.createElement("div");
                carCenterBar.className = "car-center-bar-wrap";
                carCenterBar.id = "carCenterBar";
                carCenterStack.appendChild(carCenterBar);

                // ---- Fouling dial ----
                const ffftsCluster = buildGaugeCluster();
                const ffftsGraphWrapper = ffftsCluster.wrapper;
                const ffftsGraphContainer = ffftsCluster.dialContainer;
                ffftsGraphContainer.id = "ffftsGaugeChart";
                ffftsGraphContainer.innerHTML = buildCarGaugeSVG(FFFTS, 0, 3, ffftsColorRanges, GAUGE_W, "FOULING\nPOTENTIAL", FFFD, false, "fffts");
                dashboardCluster.appendChild(ffftsGraphWrapper);
                animateGaugeReveal(ffftsGraphContainer);

                // Create a separate table container BELOW the dashboard panel
                let tableContainer = document.createElement("div");
                tableContainer.style.width = "100%";
                tableContainer.style.marginTop = "8px";
                rightContainerDiv.appendChild(tableContainer);

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

                // Toggle logic for Slagging Table (click anywhere on the dial)
                fspGraphContainer.addEventListener("click", () => {
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
                });

                // Toggle logic for Fouling Table (click anywhere on the dial)
                ffftsGraphContainer.addEventListener("click", () => {
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
                });

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
                function createOverallGraph(totalScore, checkboxScore, overallTotal) {
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
                        `${overallTotal.toFixed(1)} / ${maxValue} \u00B7 ${getOverallZoneLabel(clampedTotal)}`
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
                    carCenterBar.appendChild(verticalScale);

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

                // Zone color for the overall-score connector fill (0-10 scale),
                // same green/yellow/red thresholds used elsewhere on this page.
                function getOverallZoneColor(score) {
                    if (score > 6.5) return "#ff5050";
                    if (score > 3) return "#ffd23d";
                    return "#3ddc84";
                }

                // Same zone color, but as an rgba string for the soft glow
                // layer above the fill.
                function getOverallZoneGlow(score) {
                    if (score > 6.5) return "rgba(255, 80, 80, 0.55)";
                    if (score > 3) return "rgba(255, 210, 61, 0.55)";
                    return "rgba(61, 220, 132, 0.55)";
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
                createOverallGraph(totalScore, checkboxScore, overallTotal);

// Clean up any leftover expanded ternary card / advanced dashboard from a
// previous calculation (e.g. if the user re-clicked Calculate while still
// hovering it) before building the new one.
const staleTernaryWrapper = document.getElementById('ternaryPlotWrapper');
if (staleTernaryWrapper) staleTernaryWrapper.remove();
if (_ternaryHoverBackdrop) _ternaryHoverBackdrop.classList.remove('active');
const staleTernaryOuter = document.getElementById('ternaryCardOuter');
if (staleTernaryOuter) staleTernaryOuter.remove();

const plotDiv = document.createElement('div');
plotDiv.id = "ternary-plot";
plotDiv.style.width = "100%";
plotDiv.style.height = "100%";

const ternaryWrapper = document.createElement('div');
ternaryWrapper.id = "ternaryPlotWrapper";
ternaryWrapper.className = "ternary-plot-wrapper";
ternaryWrapper.style.width = (typeof TERNARY_WIDTH === "string" && TERNARY_WIDTH.indexOf("%") !== -1) ? TERNARY_WIDTH : (TERNARY_WIDTH + "px");
// Fill whatever vertical space is left in the right panel instead of a
// fixed pixel height, so the chart always fits the available area rather
// than getting cut off / forcing the page to scroll. TERNARY_HEIGHT is
// kept only as a minimum so it never gets squeezed unreadably small.
ternaryWrapper.style.flex = "1 1 auto";
ternaryWrapper.style.minHeight = TERNARY_HEIGHT + "px";
ternaryWrapper.style.maxWidth = "100%";
ternaryWrapper.style.margin = "0 auto";
ternaryWrapper.appendChild(plotDiv);

// ---- Outer card: ternary plot OR advanced dashboard, toggled by a corner
// button that sits OUTSIDE ternaryWrapper (a sibling, never a descendant)
// so hovering/clicking it can never trigger the ternary hover-to-expand
// behaviour set up below. Everything about the ternary card itself is
// left completely untouched. ----
const ternaryCardOuter = document.createElement('div');
ternaryCardOuter.id = "ternaryCardOuter";
ternaryCardOuter.className = "ternary-card-outer";
ternaryCardOuter.style.flex = "1 1 auto";
ternaryCardOuter.style.minHeight = "0";
ternaryCardOuter.style.display = "flex";
ternaryCardOuter.style.flexDirection = "column";

const advancedDashboard = document.createElement('div');
advancedDashboard.id = "advancedDashboard";
advancedDashboard.className = "advanced-dashboard hidden";

const advancedViewToggleBtn = document.createElement('button');
advancedViewToggleBtn.type = "button";
advancedViewToggleBtn.id = "advancedViewToggleBtn";
advancedViewToggleBtn.className = "advanced-view-corner-btn";
advancedViewToggleBtn.title = "Switch between the ternary plot and the advanced view";
advancedViewToggleBtn.innerHTML = '<span class="advanced-view-corner-btn-icon">\u2726</span><span class="advanced-view-corner-btn-label">Advanced View</span>';

const advDashData = { SIO, ALO, FEO, CAO, MGO, NAO, KO, S, FT: predictedAFT, HT, IDT, FSP, FSPD, FFFTS, FFFD, omScore: checkboxScore };
buildAdvancedDashboard(advancedDashboard, advDashData);

let showingAdvancedDashboard = false;
let advancedChartsDrawn = false;
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
                drawRadarChart(advDashData);
                drawAshFusionChart(advDashData);
                drawTendencyMapChart(advDashData);
                advancedChartsDrawn = true;
            } else {
                ['radarChart', 'ashFusionChart', 'tendencyMapChart'].forEach(id => {
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

ternaryCardOuter.appendChild(ternaryWrapper);
ternaryCardOuter.appendChild(advancedDashboard);
ternaryCardOuter.appendChild(advancedViewToggleBtn);
rightContainerDiv.appendChild(ternaryCardOuter);
updatePlot();
_setupTernaryHoverExpand(ternaryWrapper, plotDiv);
        
                
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
            colorbar: { title: "Fusion Temp (°C)" }
        },
        text: samples.map(s => `Fusion Temperature: ${parseFloat(s.AFT).toFixed(2)}°C`),
        hoverinfo: 'text'
    }];

    var layout = {
    autosize: true,   // let Plotly fill the container (whatever height flex gives it)
    margin: { l: 50, r: 40, t: 36, b: 36 },
    // Plotly auto-shows its own legend once a 2nd trace exists (the
    // hover-expand view adds one for the individual coal points), which
    // would otherwise print this trace's auto-generated "trace 0" label
    // on the chart. We already show a custom legend under the expanded
    // card, so keep Plotly's own legend off entirely.
    showlegend: false,
    ternary: {
        sum: 100,
        aaxis: { title: { text: "Thermal Stability", font: { size: 12 } }, showticklabels: true },
        baxis: { title: { text: "Fusion Accelerator", font: { size: 12 } }, showticklabels: true },
        caxis: { title: { text: "Hardening Index", font: { size: 12 } }, showticklabels: true, title_standoff: 10 }
    }
};

    Plotly.newPlot(ternaryPlotElement, data, layout, {responsive: true});
}

/* -----------------------------------------------------------------------
   Advanced view: Compositional Radar / Ash Fusion Characteristics /
   Ash Deposition Tendency Map + Key Indicators.

   Everything here is built from values already calculated in
   calculateWeightedAverage() (oxide weight %, predicted AFT, IDT/HT,
   FSP, FFFTS, O&M checkbox score) — no invented figures. The Ash Fusion
   card draws flat reference lines at the real IDT/HT/FT temperatures
   (no fake heating-rate curve, since only single-point values exist).
----------------------------------------------------------------------- */
function _advCard(titleText, chartId) {
    const card = document.createElement('div');
    card.className = 'advanced-card';
    const title = document.createElement('div');
    title.className = 'advanced-card-title';
    title.textContent = titleText;
    const chartDiv = document.createElement('div');
    chartDiv.id = chartId;
    chartDiv.className = 'advanced-card-chart';
    card.appendChild(title);
    card.appendChild(chartDiv);
    return card;
}

function buildAdvancedDashboard(container, d) {
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'advanced-dashboard-grid';
    grid.appendChild(_advCard('Compositional Radar', 'radarChart'));
    grid.appendChild(_advCard('Ash Fusion Characteristics', 'ashFusionChart'));
    grid.appendChild(_advCard('Ash Deposition Tendency Map', 'tendencyMapChart'));
    container.appendChild(grid);

    container.appendChild(buildKeyIndicatorsRow(d));
}

function drawRadarChart(d) {
    const el = document.getElementById('radarChart');
    if (!el || !window.Plotly) return;

    const categories = ['SiO\u2082', 'Al\u2082O\u2083', 'Fe\u2082O\u2083', 'CaO', 'MgO', 'Na\u2082O + K\u2082O'];
    const values = [d.SIO, d.ALO, d.FEO, d.CAO, d.MGO, (d.NAO || 0) + (d.KO || 0)];
    const r = values.concat([values[0]]);
    const theta = categories.concat([categories[0]]);

    const data = [{
        type: 'scatterpolar',
        r: r,
        theta: theta,
        fill: 'toself',
        name: 'Blend',
        line: { color: '#4f8dff' },
        fillcolor: 'rgba(79,141,255,0.28)',
        marker: { color: '#4f8dff', size: 6 }
    }];
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

function drawAshFusionChart(d) {
    const el = document.getElementById('ashFusionChart');
    if (!el || !window.Plotly) return;

    const refs = [
        { label: 'IDT', value: d.IDT, color: '#4f8dff' },
        { label: 'HT', value: d.HT, color: '#ffb703' },
        { label: 'FT', value: d.FT, color: '#ff5b5b' }
    ].filter(r => r.value != null && !isNaN(r.value));

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

function drawTendencyMapChart(d) {
    const el = document.getElementById('tendencyMapChart');
    if (!el || !window.Plotly) return;

    // Background field is a simple visual gradient (like the color bands
    // already used on the FSP/FFFTS gauges) — not a fitted model. The
    // marker position is the real computed oxide ratio for this blend.
    const n = 30;
    const xs = [], ys = [], zs = [];
    for (let i = 0; i < n; i++) xs.push(i / (n - 1));
    for (let j = 0; j < n; j++) ys.push(j / (n - 1));
    for (let j = 0; j < n; j++) {
        const row = [];
        for (let i = 0; i < n; i++) row.push((1 - xs[i]) * 0.5 + ys[j] * 0.5);
        zs.push(row);
    }

    const x = d.SIO / ((d.SIO + d.ALO) || 1);
    const y = d.CAO / ((d.CAO + d.MGO) || 1);
    const pointLabel = d.FFFD ? (d.FFFD + ' Fouling') : '';

    const data = [
        {
            type: 'contour', x: xs, y: ys, z: zs, showscale: false,
            colorscale: [[0, '#2ecc71'], [0.5, '#f1c40f'], [1, '#e74c3c']],
            contours: { coloring: 'heatmap' }, line: { width: 0 }, opacity: 0.85, hoverinfo: 'skip'
        },
        {
            type: 'scatter', mode: 'markers+text', x: [x], y: [y],
            text: [pointLabel], textposition: 'top center',
            textfont: { color: '#fff', size: 11 },
            marker: { size: 12, color: '#fff', line: { color: '#0a1a44', width: 2 } },
            hoverinfo: 'text', showlegend: false
        }
    ];
    const layout = {
        xaxis: { title: { text: 'SiO\u2082 / (SiO\u2082 + Al\u2082O\u2083)', font: { color: '#9db2dd', size: 10 } }, range: [0, 1], gridcolor: 'rgba(255,255,255,0.15)', tickfont: { color: '#9db2dd', size: 9 } },
        yaxis: { title: { text: 'CaO / (CaO + MgO)', font: { color: '#9db2dd', size: 10 } }, range: [0, 1], gridcolor: 'rgba(255,255,255,0.15)', tickfont: { color: '#9db2dd', size: 9 } },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 55, r: 15, t: 15, b: 45 },
        font: { color: '#f4f8ff' },
        showlegend: false
    };
    Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
}

function buildKeyIndicatorsRow(d) {
    const row = document.createElement('div');
    row.className = 'advanced-key-indicators';

    const items = [
        { label: 'Fluid Temp (FT)', value: (d.FT != null && !isNaN(d.FT)) ? Math.round(d.FT) + ' \u00b0C' : 'N/A', icon: '\uD83D\uDD25' },
        { label: 'Total Sulfur', value: (d.S != null && !isNaN(d.S)) ? d.S.toFixed(2) + ' wt%' : 'N/A', icon: '\u24C8' },
        { label: 'Slagging (FSP)', value: (d.FSP != null) ? d.FSP.toFixed(1) + '/6 \u00b7 ' + d.FSPD : 'N/A', icon: '\u26A0\uFE0F' },
        { label: 'Fouling (FFFTS)', value: (d.FFFTS != null) ? d.FFFTS.toFixed(1) + '/3 \u00b7 ' + d.FFFD : 'N/A', icon: '\u2601\uFE0F' },
        { label: 'Initial Deformation (IDT)', value: (d.IDT != null && !isNaN(d.IDT)) ? Math.round(d.IDT) + ' \u00b0C' : 'N/A', icon: '\uD83C\uDF21\uFE0F' },
        { label: 'O&M Score', value: (d.omScore != null) ? d.omScore.toFixed(2) + ' / 3.5' : 'N/A', icon: '\u2699\uFE0F' }
    ];

    items.forEach(it => {
        const card = document.createElement('div');
        card.className = 'advanced-indicator-card';
        card.innerHTML =
            '<div class="advanced-indicator-icon">' + it.icon + '</div>' +
            '<div class="advanced-indicator-body">' +
                '<div class="advanced-indicator-value">' + it.value + '</div>' +
                '<div class="advanced-indicator-label">' + it.label + '</div>' +
            '</div>';
        row.appendChild(card);
    });

    return row;
}


function removeBlend(button) {
            button.parentElement.remove(); 
        }
        
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
   Clicking the on-screen ternary card enlarges it and dims/blurs the rest
   of the page behind it, so it's easier to read. While expanded, each
   currently selected coal's own predicted AFT is overlaid on the SAME
   ternary axes as the existing blend plot (which is left completely
   untouched — only an extra trace is added and then removed again), with
   a small legend distinguishing the two. Clicking the close (×) button,
   or clicking anywhere on the dimmed backdrop, restores everything
   exactly as it was.
----------------------------------------------------------------------- */
let _ternaryHoverBackdrop = null;
// Holds the collapse() function for whichever ternary card is currently
// expanded, so the single shared backdrop click-listener (bound once,
// below) always closes the right one even though a fresh wrapper/plotDiv
// is created on every Calculate.
let _currentTernaryCollapse = null;
function _getTernaryHoverBackdrop() {
  if (_ternaryHoverBackdrop && document.body.contains(_ternaryHoverBackdrop)) return _ternaryHoverBackdrop;
  const bd = document.createElement('div');
  bd.className = 'ternary-hover-backdrop';
  bd.addEventListener('click', () => { if (_currentTernaryCollapse) _currentTernaryCollapse(); });
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

function _setupTernaryHoverExpand(wrapper, plotDiv) {
  let expanded = false;
  let individualTraceAdded = false;
  let originalParent = null;
  let originalNextSibling = null;

  async function expand() {
    if (expanded) return;
    expanded = true;
    _currentTernaryCollapse = collapse;

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

    if (window.Plotly) {
      try {
        const rect = plotDiv.getBoundingClientRect();
        await Plotly.relayout(plotDiv, { width: rect.width, height: rect.height, autosize: false });
        Plotly.Plots.resize(plotDiv);
      } catch (e) {}
    }

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

      if (expanded && window.Plotly && valid.length) {
        if (individualTraceAdded) {
          await Plotly.deleteTraces(plotDiv, [1]);
          individualTraceAdded = false;
        }
        await Plotly.addTraces(plotDiv, {
          type: 'scatterternary',
          mode: 'markers',
          name: 'Individual Coal AFT',
          a: valid.map(r => r.a),
          b: valid.map(r => r.b),
          c: valid.map(r => r.c),
          marker: {
            symbol: 'diamond',
            size: (typeof MARKER_SIZE !== 'undefined' ? MARKER_SIZE : 9) + 4,
            color: valid.map(r => r.aft),
            colorscale: 'Jet',
            showscale: false,
            line: { width: 1.5, color: '#111' }
          },
          text: valid.map(r => `${r.name} — Individual AFT: ${Math.round(Number(r.aft))}°C`),
          hoverinfo: 'text',
          showlegend: false
        });
        individualTraceAdded = true;
      }
    } catch (e) {
      console.warn('ternary hover: individual coal AFT lookup failed', e);
    }
  }

  async function collapse() {
    expanded = false;
    if (_currentTernaryCollapse === collapse) _currentTernaryCollapse = null;
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

    if (window.Plotly) {
      try {
        if (individualTraceAdded) {
          await Plotly.deleteTraces(plotDiv, [1]);
          individualTraceAdded = false;
        }
        await Plotly.relayout(plotDiv, { width: null, height: null, autosize: true });
        Plotly.Plots.resize(plotDiv);
      } catch (e) {}
    }
  }

  wrapper.style.cursor = 'zoom-in';
  wrapper.title = 'Click to enlarge';
  wrapper.addEventListener('click', (e) => {
    if (expanded) return; // ignore clicks on the chart itself while already expanded; use the × or backdrop to close
    expand();
  });
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


/* ---- next inline <script> blockk ---- */


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