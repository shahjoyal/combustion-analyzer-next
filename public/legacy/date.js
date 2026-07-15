

        // ==================== OXIDE ALIAS MAP ====================

const aliasMap = {
  'SiO2': 'SiO₂',
  'SiO_2': 'SiO₂',
  'SiO 2': 'SiO₂',

  'Al2O3': 'Al₂O₃',
  'Al_2O_3': 'Al₂O₃',

  'Fe2O3': 'Fe₂O₃',
  'Fe_2O_3': 'Fe₂O₃',

  'Na2O': 'Na₂O',
  'Na_2_O': 'Na₂O',

  'K2O': 'K₂O',
  'K_2_O': 'K₂O',

  'P2O5': 'P₂O₅',
  'P_2_O_5': 'P₂O₅',

  'SO3': 'SO₃',
  'S O3': 'SO₃',

  'Sulfur': 'Sulphur (S)',
  'Sulphur': 'Sulphur (S)',
  'S': 'Sulphur (S)',

  'TiO2': 'TiO₂',
  'Ti_2_O': 'TiO₂',

  'Mn3O4': 'Mn₃O₄',
  'Mn_3_O_4': 'Mn₃O₄'
};

window.aliasMap = aliasMap;

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
}

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
        
//         async function calculateWeightedAverage() {

//             let totalCurrentRange = 0;
//             const ranges = document.querySelectorAll('input[id^="currentrange"]');
            
//             ranges.forEach(range => {
//                 const rangeValue = parseFloat(range.value) || 0;
//                 totalCurrentRange += rangeValue;
//             });

//             if (totalCurrentRange !== 100) {
//                 alert("Total percentage must be exactly 100 to proceed!");
//                 return;
//             }
//             const rightContainerDiv = document.querySelector("#resultsContainer");
//             let blendValuesDiv = document.getElementById("blendValues");
//             let blendPropertiesBtn = document.getElementById("blendPropertiesBtn");
            
        
//             if (!rightContainerDiv) {
//                 console.error("Element #resultsContainer not found.");
//                 return;
//             }
//             if (!blendValuesDiv) {
//                 console.error("Element #blendValues not found.");
//                 return;
//             }
        
//             let totalPercentage = 0;
//             let propertySums = {
//                 "SiO₂": 0, "Al₂O₃": 0, "Fe₂O₃": 0, "CaO": 0, "MgO": 0, 
//                 "Na₂O": 0, "K₂O": 0, "TiO₂": 0, "SO₃": 0, "P₂O₅": 0,
//                 "Mn₃O₄":0,"Sulphur (S)":0, "GCV": 0
        
//             };
        
//             const blends = document.querySelectorAll('.blend');
        
//             blends.forEach((blend, index) => {
//                 const selectedCoal = document.querySelector(`#coal${index}`).value;
//                 const currentRange = parseFloat(document.querySelector(`#currentrange${index}`).value) || 0;
        
//                 if (!selectedCoal || currentRange <= 0) return;
        
//                 const coalInfo = window.coalData.find(coal => coal.id === selectedCoal);
//                 if (!coalInfo) return;
        
//                 totalPercentage += currentRange;
        
//                 for (let prop in propertySums) {
// // REPLACE existing getPropValue with this improved version
// function normalizeKeyForMatch(s) {
//   return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// }

// function unicodeSubscriptsToDigits(s) {
//   return String(s || '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => {
//     const map = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
//     return map[ch] || ch;
//   });
// }

// function getPropValue(coalInfo, prop) {
//   const p = (coalInfo && coalInfo.properties) || {};
//   if (!p || Object.keys(p).length === 0) return 0;

//   // 1) direct exact match (most likely when keys already normalized)
//   if (p[prop] !== undefined) return Number(p[prop]) || 0;

//   // 2) unicode -> ascii (e.g., "SiO₂" -> "SiO2")
//   const asciiFromProp = unicodeSubscriptsToDigits(prop);
//   if (p[asciiFromProp] !== undefined) return Number(p[asciiFromProp]) || 0;

//   // 3) try simple ascii (remove spaces/underscores/percent/parens)
//   const simpleProp = String(prop).replace(/[%\s\(\)_\-]/g, '').replace(/₂/g,'2').replace(/₃/g,'3');
//   if (p[simpleProp] !== undefined) return Number(p[simpleProp]) || 0;

//   // 4) normalized fuzzy match: compare normalized keys (fallback that handles headers like "SiO2 (%)" or "Si O2")
//   const target = normalizeKeyForMatch(prop);
//   for (const key of Object.keys(p)) {
//     if (normalizeKeyForMatch(key) === target) {
//       return Number(p[key]) || 0;
//     }
//   }

//   // 5) try alias map (both directions) if available
//   if (typeof aliasMap !== 'undefined') {
//     // if aliasMap has ascii -> unicode mapping, try to use it
//     const mapped = aliasMap[asciiFromProp] || aliasMap[simpleProp] || aliasMap[prop];
//     if (mapped && p[mapped] !== undefined) return Number(p[mapped]) || 0;

//     // also try to find any alias key that maps *to* the requested prop
//     for (const [from, to] of Object.entries(aliasMap)) {
//       if (to === prop && p[from] !== undefined) return Number(p[from]) || 0;
//     }
//   }

//   // 6) last resort: try parsing numeric from any property whose normalized key contains the normalized prop token
//   for (const key of Object.keys(p)) {
//     if (normalizeKeyForMatch(key).includes(target) || target.includes(normalizeKeyForMatch(key))) {
//       const n = Number(p[key]);
//       if (!isNaN(n)) return n;
//     }
//   }

//   // not found
//   return 0;
// }


// // then inside your loop:
// const propValue = getPropValue(coalInfo, prop);
// propertySums[prop] += propValue * currentRange;

                    
//                 }
//             });

//             if (totalPercentage > 0) {
//                 // Compute weighted averages
//                 let SIO = propertySums["SiO₂"] / totalPercentage;
//                 let ALO = propertySums["Al₂O₃"] / totalPercentage;
//                 let FEO = propertySums["Fe₂O₃"] / totalPercentage;
//                 let CAO = propertySums["CaO"] / totalPercentage;
//                 let MGO = propertySums["MgO"] / totalPercentage;
//                 let NAO = propertySums["Na₂O"] / totalPercentage;
//                 let KO = propertySums["K₂O"] / totalPercentage;
//                 let TIO = propertySums["TiO₂"] / totalPercentage;
//                 let SO = propertySums["SO₃"] / totalPercentage;
//                 let PO = propertySums["P₂O₅"] / totalPercentage;
//                 let S = propertySums["Sulphur (S)"]/totalPercentage;
//                 let MNO = propertySums["Mn₃O₄"]/totalPercentage;
//                 //let GCV = propertySums["GCV"]/totalPercentage;
                
// // --- Local AFT computation (no backend) ---
// // function computeLocalAFT(SIO, ALO, FEO, CAO, MGO, NAO, KO, SO, TIO) {
// //   // deterministic formula kept simple — tweak coefficients as you wish.
// //   // This produces a reasonable numeric AFT value based on oxide contributions.
// //   const aft = 1200
// //     + (SIO || 0) * 0.8
// //     - (SO || 0) * 5
// //     + (CAO || 0) * 0.6
// //     + (FEO || 0) * 0.3
// //     - (NAO || 0) * 0.4
// //     + (TIO || 0) * 0.2;
// //   return Math.round(aft * 100) / 100;
// // }

// // predictedAFT = computeLocalAFT(SIO, ALO, FEO, CAO, MGO, NAO, KO, SO, TIO);
// // console.log('predictedAFT (local):', predictedAFT);

//  // --- ML-based AFT computation (backend) ---
// try {
//   const response = await axios.post(
//     'http://localhost:3000/calculate-aft',
//     {
//       values: [
//         SIO,  // SiO2
//         ALO,  // Al2O3
//         FEO,  // Fe2O3
//         CAO,  // CaO
//         MGO,  // MgO
//         NAO,  // Na2O
//         KO,   // K2O
//         SO,   // SO3
//         TIO   // TiO2
//       ]
//     },
//     {
//       headers: { 'Content-Type': 'application/json' }
//     }
//   );

//   predictedAFT = response.data.prediction;
//   console.log('predictedAFT (ML):', predictedAFT);

// } catch (err) {
//   console.error('AFT ML API failed, falling back to 1200:', err);
  
// }
        
//             blendValuesDiv.innerHTML = ""; 
//             let acidicOxidesAvg = 0;
//             let basicOxidesAvg = 0;
//             let otherOxidesAvg = 0;
            
        
//             if (totalPercentage > 0) {
//                 let propertiesHTML = `
//                                       <table border="1">
//                                         <tr>
//                                             <th>Property</th>
//                                             <th>Value</th>
//                                         </tr>`;
                
//                 for (let prop in propertySums) {
//                     let avgValue = propertySums[prop] / totalPercentage;
        
        
//                         if (prop === "SiO₂" || prop === "Al₂O₃" || prop === "TiO₂") {
//                             acidicOxidesAvg += avgValue;   
//                         }
        
//                         if (prop === "CaO" || prop === "MgO" || prop === "Na₂O"|| prop === "K₂O") {
//                             basicOxidesAvg += avgValue;   
//                         }
        
//                         if (prop === "Fe₂O₃" || prop === "SO₃" || prop === "P₂O₅" || prop === "Mn₃O₄") {
//                             otherOxidesAvg += avgValue;   
//                         }
                        
                        
                
//                     propertiesHTML += `<tr>
//                                            <td><strong>${prop}</strong></td>
//                                            <td>${avgValue.toFixed(2)}</td>
//                                        </tr>`;
//                 }
                
//                 propertiesHTML += "</table>";
        
//                 console.log("Acidic Value:", acidicOxidesAvg.toFixed(2));
//                 console.log("Basic Value:", basicOxidesAvg.toFixed(2));
//                 console.log("other Value:", otherOxidesAvg.toFixed(2));
                
        
//             blendValuesDiv.innerHTML = propertiesHTML;
            
//             rightContainerDiv.innerHTML = "";
        
// let acidic = acidicOxidesAvg || 0;
// let basic  = basicOxidesAvg || 0;
// let other  = otherOxidesAvg || 0;

// const totalABC = acidic + basic + other;

// if (totalABC === 0) {

//   console.warn('Skipping ternary sample: all zero');

// } else {

//   // Scale to 100
//   if (totalABC <= 1.1) {

//     acidic *= 100;
//     basic  *= 100;
//     other  *= 100;

//   } else if (Math.abs(totalABC - 100) > 0.1) {

//     acidic = acidic / totalABC * 100;
//     basic  = basic  / totalABC * 100;
//     other  = other  / totalABC * 100;
//   }

//   let newSample = {
//     acidicOxides: acidic,
//     basicOxides: basic,
//     otherOxides: other,
//     AFT: predictedAFT
//   };

//   console.log('Added ternary sample:', newSample);

//   samples.push(newSample);
// }

        
//                 // Calculate test values using formulas
//                 const T250 = Math.sqrt(
//                     ((((0.00835 * SIO) + (0.00601 * ALO) - 0.109) * 10**7) /
//                     (2.398 - ((0.0415 * SIO) + (0.0192 * ALO) +
//                     (0.027 * FEO) + (0.016 * CAO) - 3.92)))) + 150;
        
//                 let T250S;
//                 if (T250 > 1275) T250S = 0;
//                 else if (T250 < 1200) T250S = 1;
//                 else T250S = 0.5;
                
//                 // Base/Acid Ratio test value
//                 const BART = (FEO + CAO + MGO + NAO + KO) / (SIO + ALO + TIO);
        
//                 // Base/Acid Ratio score
//                 let BARS;
//                 if (BART < 0.5) BARS = 0;
//                 else if (BART > 1) BARS = 1;
//                 else BARS = 0.5;

//                 //Hemispherical temp formula
//                 HT= predictedAFT -78;

//                 //Initial Deformatiion Formula
//                 IDT= predictedAFT-103;
                
//                 // Slagging Factor test value
//                 const SF = BART * S;
        
//                 // Slagging Factor score
//                 let SFS;
//                 if (SF < 0.6) SFS = 0;
//                 else if (SF > 1) SFS = 1;
//                 else SFS = 0.5;
        
//                 // Slagging Index test value
//                 const SIT = (HT + 4 * IDT) / 5;
        
//                 // Slagging Index score
//                 let SIS;
//                 if (SIT > 1343) SIS = 0;
//                 else if (SIT < 1149) SIS = 1;
//                 else SIS = 0.5;
        
        
//                 // Silica % test value
//                 const SPT = SIO * 100 / (SIO + FEO + CAO + MGO);
                
        
//                 // Silica % score
//                 let SPS;
//                 if (SPT > 82) SPS = 0;
//                 else if (SPT < 30) SPS = 1;
//                 else SPS = 0.5;
                
        
//                 // Iron Calcium ratio test value
//                 const ICRT = FEO / CAO;
                
        
//                 // Iron Calcium ratio score
//                 let ICRS;
//                 if (ICRT < 0.31) ICRS = 0;
//                 else if (ICRT > 3) ICRS = 1;
//                 else ICRS = 0.5;
        
//                 // Iron plus Calcium test value
//                 const IPCT = FEO + CAO;
        
//                 // Iron plus Calcium score
//                 const IPCS = IPCT < 12 ? 0 : 1;
        
//                 // Fuel Slagging Potential
//                 const FSP = Number(T250S) + Number(BARS) + Number(SFS) + Number(SIS) + Number(SPS) + Number(ICRS) + Number(IPCS);
//                 let FSPD;
//                 if (FSP < 2) FSPD = "Low";
//                 else if (FSP > 4) FSPD = "High";
//                 else FSPD = "Moderate";
                
//                 //FOULING
                
//                 // Sodium in Ash test value
//                 const SIAT = NAO * (46 / 62);
        
//                 // Sodium in Ash score
//                 let SIAS;
//                 if (SIAT < 1) SIAS = 0;
//                 else if (SIAT > 5) SIAS = 1;
//                 else SIAS = 0.5;
                
//                 // Total Alkali test value
//                 const TAT = (FEO + CAO + MGO + NAO + KO + MNO + SO + PO);
                
//                 // Total Alkali score
//                 const TAS = TAT < 2 ? 0 : 1;
        
//                 // Fouling factor test value
//                 const FFT = BART * SIAT;
                
        
//                 // Fouling factor score
//                 let FFS;
//                 if (FFT < 0.1) FFS = 0;
//                 else if (FFT > 0.5) FFS = 1;
//                 else FFS = 0.5;
                
        
//                 // Fuel fouling factor total score
//                 const FFFTS = Number(SIAS) + Number(TAS) + Number(FFS);
                
        
//                 // Fuel fouling factor total display
//                 let FFFD;
//                 if (FFFTS < 1) FFFD = "Low";
//                 else if (FFFTS > 2) FFFD = "High";
//                 else FFFD = "Moderate";
        
//                 let totalScore = FSP + FFFTS;

//                 let checkboxScore = 0;
//                 let allQuestions = ["question1", "question2", "question3", "question4", "question5", "question6", "question7", "question8", "question9", "question10", "question11",];
//                 let selectedValues = getSelectedCheckboxes(); // Get checked checkboxes
        
//                 let scoreMapping = {
//                     "question1": [0.5, 0],  
//                     "question2": [0.25,0],
//                     "question3": [0.25, 0],
//                     "question4": [0.25, 0],
//                     "question5": [0.5, 0],
//                     "question6": [0.25, 0],
//                     "question7": [0.25, 0],
//                     "question8": [0.25, 0],
//                     "question9": [0.25, 0],
//                     "question10": [0.25, 0],
//                     "question11": [0.5, 0]
//                 };
        
//                 // Iterate through all checkboxes (checked and unchecked)
//                 allQuestions.forEach(question => {
//                     let isChecked = selectedValues.includes(question);
//                     checkboxScore += isChecked ? scoreMapping[question][0] : scoreMapping[question][1];
//                 });
        
//                 let overallTotal = totalScore + checkboxScore;  
//                 console.log("Total Score:", overallTotal);
                  
//             let FoulingHTML = `
//                     <table>
//                         <thead>  <tr>
//                                     <th colspan="3">Slagging Potential (Results in to Clinker Formation)</th> </tr>
//                                 <tr>
//                                     <th>Slagging Indices</th>
//                                     <th>Test Coal</th>
//                                     <th>Aggregate Scores</th>
//                                 </tr>
//                             </thead>
//                         <tr>
//                             <td>T250</td>
//                             <td>${T250.toFixed(2)}</td>
//                             <td>${T250S}</td>
//                         </tr>
//                         <tr>
//                             <td>Base/Acid Ratio (BART)</td>
//                             <td>${BART.toFixed(2)}</td>
//                             <td>${BARS}</td>
//                         </tr>
//                         <tr>
//                             <td>Slagging Factor ((B/A ratio * S in coal))</td>
//                             <td>${SF.toFixed(2)}</td>
//                             <td>${SFS}</td>
//                         </tr>
//                         <tr>
//                             <td>Slagging Index Test</td>
//                             <td>${SIT.toFixed(2)}</td>
//                             <td>${SIS}</td>
//                         </tr>
//                         <tr>
//                             <td>Silica % Test</td>
//                             <td>${SPT.toFixed(2)}</td>
//                             <td>${SPS}</td>
//                         </tr>
//                         <tr>
//                             <td>Iron Calcium Ratio Test</td>
//                             <td>${ICRT.toFixed(2)}</td>
//                             <td>${ICRS}</td>
//                         </tr>
//                         <tr>
//                             <td>Iron + Calcium </td>
//                             <td>${IPCT.toFixed(2)}</td>
//                             <td>${IPCS}</td>
//                         </tr>
//                     </table>`;
        
                
        
//                 let FoulingHTML2 = `<table>
//                     <thead>
//                         <tr><th colspan="3">Fouling Potential (Requires increased soot blowing)</th></tr>
//                         <tr>
//                             <th>Fouling Indices</th>
//                             <th>Test Coal</th>
//                             <th>Aggregate Scores</th>
//                         </tr>
//                     </thead>
//                     <tr><td>Sodium in Ash</td><td>${SIAT.toFixed(2)}</td><td>${SIAS}</td></tr>
//                     <tr><td>Alkali Test</td><td>${TAT.toFixed(2)}</td><td>${TAS}</td></tr>
//                     <tr><td>Fouling Factor (B/A*Na)</td><td>${FFT.toFixed(2)}</td><td>${FFS}</td></tr>
//                 </table>`;
                
//                 rightContainerDiv.appendChild(blendPropertiesBtn);
                
                
//                 google.charts.load('current', { 'packages': ['gauge'] });
        
                
        
//                 let chartWrapper = document.createElement("div");   
//                 chartWrapper.style.display = "flex";  // Flexbox for side-by-side layout
//                 chartWrapper.style.justifyContent = "center"; // Center align
//                 chartWrapper.style.gap = "40px"; // Space between charts
//                 rightContainerDiv.appendChild(chartWrapper);
                
//                 // Create Slagging Gauge Chart
//                 const fspGraphWrapper = document.createElement("div");
//                 fspGraphWrapper.style.textAlign = "center"; 
                
//                 const fspDisplay = document.createElement("div");
//                 fspDisplay.style.marginTop = "20px";
//                 fspDisplay.style.marginBottom = "3px";
//                 fspDisplay.style.fontWeight = "bold"; 
//                 fspDisplay.textContent = `Slagging Potential : ${FSPD}`;
                
//                 const fspGraphContainer = document.createElement("div");
//                 fspGraphContainer.id = "fspGaugeChart";
//                 fspGraphContainer.style.width = "200px";
//                 fspGraphContainer.style.height = "200px";
                
//                 fspGraphWrapper.appendChild(fspDisplay);
//                 fspGraphWrapper.appendChild(fspGraphContainer);
//                 chartWrapper.appendChild(fspGraphWrapper);
                
//                 // Create Fouling Gauge Chart
//                 const ffftsGraphWrapper = document.createElement("div");
//                 ffftsGraphWrapper.style.textAlign = "center"; 
                
//                 const ffftsDisplay = document.createElement("div");
//                 ffftsDisplay.style.marginTop = "20px";
//                 ffftsDisplay.style.marginBottom = "3px";
//                 ffftsDisplay.style.fontWeight = "bold";
//                 ffftsDisplay.textContent = `Fouling Potential: ${FFFD}`;
                
//                 const ffftsGraphContainer = document.createElement("div");
//                 ffftsGraphContainer.id = "ffftsGaugeChart";
//                 ffftsGraphContainer.style.width = "200px";
//                 ffftsGraphContainer.style.height = "200px";
                
//                 ffftsGraphWrapper.appendChild(ffftsDisplay);
//                 ffftsGraphWrapper.appendChild(ffftsGraphContainer);
//                 chartWrapper.appendChild(ffftsGraphWrapper);
                
//                 // Append chartWrapper to the rightContainerDiv
//                 rightContainerDiv.appendChild(chartWrapper);
                
//                 // Create a separate table container BELOW charts
//                 let tableContainer = document.createElement("div");
//                 tableContainer.style.width = "100%";
//                 tableContainer.style.marginTop = "20px";
//                 rightContainerDiv.appendChild(tableContainer);
                
//                 // Load Google Charts
//                 google.charts.setOnLoadCallback(() => createGaugeChart("fspGaugeChart", FSP, 0, 6, fspColorRanges));
//                 google.charts.setOnLoadCallback(() => createffftGaugeChart("ffftsGaugeChart", FFFTS, 0, 3, ffftsColorRanges));
                
//                 // Table toggle logic
//                 let fspTableVisible = false;
//                 let fspTableElement = null;
                
//                 let ffftsTableVisible = false;
//                 let ffftsTableElement = null;
                
//                 // Function to update table layout dynamically
//                 function updateTableLayout() {
//                     tableContainer.innerHTML = ""; // Clear previous content
                
//                     if (fspTableVisible && fspTableElement) {
//                         fspTableElement.style.width = "100%";
//                         fspTableElement.style.marginBottom = "10px";
//                         tableContainer.appendChild(fspTableElement);
//                     }
                
//                     if (ffftsTableVisible && ffftsTableElement) {
//                         ffftsTableElement.style.width = "100%";
//                         tableContainer.appendChild(ffftsTableElement);
//                     }
                
//                     // Ensure the overall graph stays at the bottom
//                     tableContainer.appendChild(overallGraphWrapper);
//                 }
                
//                 // Toggle logic for Slagging Table
//                 fspGraphContainer.addEventListener("click", () => {
//                     fspTableVisible = !fspTableVisible;
                
//                     if (fspTableVisible) {
//                         if (!fspTableElement) {
//                             fspTableElement = document.createElement("div");
//                             fspTableElement.innerHTML = FoulingHTML;
//                         }
//                     } else {
//                         fspTableElement = null;
//                     }
                
//                     updateTableLayout();
//                 });
                
//                 // Toggle logic for Fouling Table
//                 ffftsGraphContainer.addEventListener("click", () => {
//                     ffftsTableVisible = !ffftsTableVisible;
                
//                     if (ffftsTableVisible) {
//                         if (!ffftsTableElement) {
//                             ffftsTableElement = document.createElement("div");
//                             ffftsTableElement.innerHTML = FoulingHTML2;
//                         }
//                     } else {
//                         ffftsTableElement = null;
//                     }
                
//                     updateTableLayout();
//                 });
                
                
//                 // Function to create Google Gauge Chart
//                 function createGaugeChart(containerId, value, minValue, maxValue, colorRanges) {
//                     const data = google.visualization.arrayToDataTable([
//                         ['Label', 'Value'],
//                         ['Value', value]
//                     ]);
                
//                     const options = {
//                         width: 200, height: 200,
//                         min: minValue,
//                         max: maxValue,
//                         redFrom: colorRanges.red[0], redTo: colorRanges.red[1],
//                         yellowFrom: colorRanges.yellow[0], yellowTo: colorRanges.yellow[1],
//                         greenFrom: colorRanges.green[0], greenTo: colorRanges.green[1],
//                         greenColor: '#5de65d', // Light Green
//                         yellowColor: '#ffff76', // Light Yellow
//                         redColor: '#e24242', // Light Red
//                         majorTicks: ['0', '1', '2', '3', '4', '5', '6'], // 6 bold tick marks
//                         minorTicks: 2
                        
//                     };   
                
//                     const chart = new google.visualization.Gauge(document.getElementById(containerId));
//                     chart.draw(data, options);
//                 }
        
//                 function createffftGaugeChart(containerId, value, minValue, maxValue, colorRanges) {
//                     const data = google.visualization.arrayToDataTable([
//                         ['Label', 'Value'],
//                         ['Value', value]
//                     ]);
                
//                     const options = {
//                         width: 200, height: 200,
//                         min: minValue,
//                         max: maxValue,
//                         redFrom: colorRanges.red[0], redTo: colorRanges.red[1],
//                         yellowFrom: colorRanges.yellow[0], yellowTo: colorRanges.yellow[1],
//                         greenFrom: colorRanges.green[0], greenTo: colorRanges.green[1],
//                         greenColor: '#5de65d', // Light Green
//                         yellowColor: '#ffff76', // Light Yellow
//                         redColor: '#e24242', // Light Red
//                         majorTicks: ['0', '1', '2', '3'], // 4 bold tick marks
//                         minorTicks: 2
                        
//                     };
//                     const chart = new google.visualization.Gauge(document.getElementById(containerId));
//                     chart.draw(data, options);
//                 }
        
//                 // Color ranges for FSP (0 to 6)
//                 const fspColorRanges = {
//                     green: [0, 2],
//                     yellow: [2, 4],
//                     red: [4, 6]
//                 };
        
//                 // Color ranges for FFTS (0 to 4)
//                 const ffftsColorRanges = {
//                     green: [0, 1],
//                     yellow: [1, 2],
//                     red: [2, 3]
//                 };
         
        
//                 function createOverallGraph(totalScore, checkboxScore, overallTotal) {
//                     const minValue = 0;
//                     const maxValue = 10;

//                     // Graph container
//                     const overallGraphContainer = document.createElement("div");
//                     overallGraphContainer.style.width = "550px";
//                     overallGraphContainer.style.height = "32px";
//                     overallGraphContainer.style.border = "1px solid black";
//                     overallGraphContainer.style.borderRadius = "12px";
//                     overallGraphContainer.style.position = "relative";
//                     overallGraphContainer.style.marginBottom = "20px";
//                     overallGraphContainer.style.marginLeft = "50px";
//                     overallGraphContainer.style.display = "flex";

//                     let sfWidth = (totalScore / maxValue) * 100;
//                     sfWidth = sfWidth > 100 ? 100 : sfWidth;

//                     let cbWidth = ((totalScore + checkboxScore) > maxValue) 
//                         ? Math.max(0, (maxValue - totalScore) / maxValue * 100) 
//                         : (checkboxScore / maxValue) * 100;

//                     const totalCombined = totalScore + checkboxScore;

//                     // Slagging + Fouling Score Bar
//                     const sfBar = document.createElement("div");
//                     sfBar.style.height = "100%";
//                     sfBar.style.width = `${sfWidth}%`;
//                     sfBar.style.borderRadius = totalCombined >= maxValue ? "12px" : "12px 0 0 12px";
//                     sfBar.style.backgroundColor = getColor(totalScore);

//                     // Checkbox Score Bar (overlay)
//                     const cbBar = document.createElement("div");
//                     cbBar.style.height = "100%";
//                     cbBar.style.width = `${cbWidth}%`;
//                     cbBar.style.borderRadius = totalCombined >= maxValue ? "0 12px 12px 0" : "0";
//                     cbBar.style.backgroundColor = getCheckboxBaseColor(totalScore); // base color
//                     cbBar.style.backgroundImage = getHatchingLines(getHatchColor(totalCombined)); // hatch color depends on total

//                     // Append bars
//                     overallGraphContainer.appendChild(sfBar);
//                     overallGraphContainer.appendChild(cbBar);

//                     // Tick marks
//                     for (let i = minValue; i <= maxValue; i++) {
//                         const tick = document.createElement("div");
//                         tick.style.position = "absolute";
//                         tick.style.left = `${(i / maxValue) * 100}%`;
//                         tick.style.top = "50%";
//                         tick.style.transform = "translateY(-50%)";
//                         tick.style.height = "10px";
//                         tick.style.width = "1px";
//                         tick.style.backgroundColor = "black";

//                         const label = document.createElement("span");
//                         label.style.position = "absolute";
//                         label.style.marginTop = "5px";
//                         label.style.left = `${(i / maxValue) * 100}%`;
//                         label.style.top = "100%";
//                         label.style.transform = "translateX(-50%)";
//                         label.style.fontSize = "12px";
//                         label.textContent = i;

//                         overallGraphContainer.appendChild(tick);
//                         overallGraphContainer.appendChild(label);
//                     }

//                     // Display score
//                     const totalDisplay = document.createElement("div");
//                     totalDisplay.style.marginBottom = "10px";
//                     totalDisplay.style.marginTop = "10px";
//                     totalDisplay.style.marginLeft = "80px";
//                     totalDisplay.style.fontSize = "18px";
//                     totalDisplay.style.fontWeight = "bold";
//                     totalDisplay.textContent = `Overall Score: ${overallTotal.toFixed(1)} (Slagging + Fouling: ${totalScore.toFixed(1)}, O&M Score: ${checkboxScore.toFixed(1)})`;

//                     rightContainerDiv.appendChild(totalDisplay);
//                     rightContainerDiv.appendChild(overallGraphContainer);
//                 }

//                 // Main score color
//                 function getColor(score) {
//                     if (score < 3) return "#a6e3a6";
//                     if (score < 6.5) return "yellow";
//                     return "red";
//                 }

//                 // Base color of checkbox segment depends only on totalScore
//                 function getCheckboxBaseColor(score) {
//                     if (score < 3) return "#5de65d";
//                     if (score < 6.5) return "#fddf05";
//                     return "#e24242";
//                 }

//                 // Hatch overlay color depends on totalCombined
//                 function getHatchColor(totalCombined) {
//                     if (totalCombined > 6.5) return "red";
//                     if (totalCombined > 3) return "yellow";
//                     return "green";
//                 }
                
//                 function getHatchingLines(hatchColor) {
//                     return `repeating-linear-gradient(45deg, transparent, transparent 5px, ${hatchColor} 5px, ${hatchColor} 10px)`;
//                 }

                
//                 document.getElementById("resultsContainer").style.display = "flex";
//                 document.getElementById("blendValues").style.display = "flex";
//                 blendPropertiesBtn.style.display = "block";
//                 let overallGraphWrapper = document.getElementById("overallGraphWrapper");
//                 if (!overallGraphWrapper) {
//                     overallGraphWrapper = document.createElement("div");
//                     overallGraphWrapper.id = "overallGraphWrapper";
//                     rightContainerDiv.insertBefore(overallGraphWrapper, rightContainerDiv.firstChild);
//                 }
//                 overallGraphWrapper.innerHTML = ""; // Clear previous content
//                 createOverallGraph(totalScore, checkboxScore, overallTotal);

//                 const plotDiv = document.createElement('div');
//                 plotDiv.id = "ternary-plot";
//                 rightContainerDiv.appendChild(plotDiv);
//                 updatePlot();
        
                
//             } 
//         }
//         } 
       
       

async function calculateWeightedAverage() {
    // helper functions (declared once here)
    function normalizeKeyForMatch(s) {
      return String(s || '').toLowerCase()
        .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, d =>
          ({'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'}[d])
        )
        .replace(/[^a-z0-9]/g, '');
    }

    function unicodeSubscriptsToDigits(s) {
      return String(s || '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => {
        const map = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
        return map[ch] || ch;
      });
    }

    function getPropValue(coalInfo, prop) {
      const p = (coalInfo && coalInfo.properties) || {};
      if (!p || Object.keys(p).length === 0) return 0;

      // 1) direct exact match
      if (p[prop] !== undefined) return Number(p[prop]) || 0;

      // 2) unicode -> ascii (SiO₂ -> SiO2)
      const asciiFromProp = unicodeSubscriptsToDigits(prop);
      if (p[asciiFromProp] !== undefined) return Number(p[asciiFromProp]) || 0;

      // 3) try simple ascii (remove spaces/underscores/percent/parens)
      const simpleProp = String(prop).replace(/[%\s\(\)_\-]/g, '').replace(/₂/g,'2').replace(/₃/g,'3');
      if (p[simpleProp] !== undefined) return Number(p[simpleProp]) || 0;

      // 4) normalized fuzzy match
      const target = normalizeKeyForMatch(prop);
      for (const key of Object.keys(p)) {
        if (normalizeKeyForMatch(key) === target) {
          return Number(p[key]) || 0;
        }
      }

      // 5) try alias map if available
      if (typeof aliasMap !== 'undefined') {
        const mapped = aliasMap[asciiFromProp] || aliasMap[simpleProp] || aliasMap[prop];
        if (mapped && p[mapped] !== undefined) return Number(p[mapped]) || 0;

        for (const [from, to] of Object.entries(aliasMap)) {
          if (to === prop && p[from] !== undefined) return Number(p[from]) || 0;
        }
      }

      // 6) contains / fuzzy fallback
      for (const key of Object.keys(p)) {
        if (normalizeKeyForMatch(key).includes(target) || target.includes(normalizeKeyForMatch(key))) {
          const n = Number(p[key]);
          if (!isNaN(n)) return n;
        }
      }

      return 0;
    }

    // 1) Validate total percentages
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

    // 2) Basic DOM refs
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

    // 3) Prepare sums
    let totalPercentage = 0;
    let propertySums = {
        "SiO₂": 0, "Al₂O₃": 0, "Fe₂O₃": 0, "CaO": 0, "MgO": 0,
        "Na₂O": 0, "K₂O": 0, "TiO₂": 0, "SO₃": 0, "P₂O₅": 0,
        "Mn₃O₄": 0, "Sulphur (S)": 0, "GCV": 0
    };

    // 4) Iterate blends and build propertySums
    const blends = document.querySelectorAll('.blend');

    blends.forEach((blend, index) => {
        const selectEl = document.querySelector(`#coal${index}`);
        const rangeEl = document.querySelector(`#currentrange${index}`);
        const selectedCoal = selectEl ? selectEl.value : null;
        const currentRange = parseFloat(rangeEl ? rangeEl.value : 0) || 0;

        if (!selectedCoal || currentRange <= 0) return;

        // tolerant lookup: id exact match first, then match by coalName / coalType / id normalized
        let coalInfo = (window.coalData || []).find(c => c && String(c.id) === String(selectedCoal));

        if (!coalInfo) {
          const selNorm = String(selectedCoal || '').toLowerCase().trim();
          coalInfo = (window.coalData || []).find(c => {
            if (!c) return false;
            const names = [
              String(c.coalName || '').toLowerCase().trim(),
              String(c.coalType || '').toLowerCase().trim(),
              String(c.id || '').toLowerCase().trim()
            ];
            return names.some(x => x && x === selNorm);
          });
        }

        if (!coalInfo) {
            console.warn('Coal not found for selection (skipping):', selectedCoal);
            return; // keep previous behavior but log the cause
        }

        totalPercentage += currentRange;

        for (let prop in propertySums) {
            const propValue = getPropValue(coalInfo, prop);
            propertySums[prop] += (propValue || 0) * currentRange;
        }
    });

    if (totalPercentage <= 0) {
        alert("No valid coal blends found to compute.");
        return;
    }

    // 5) Compute weighted averages (divide by totalPercentage)
    let SIO = propertySums["SiO₂"] / totalPercentage;
    let ALO = propertySums["Al₂O₃"] / totalPercentage;
    let FEO = propertySums["Fe₂O₃"] / totalPercentage;
    let CAO = propertySums["CaO"] / totalPercentage;
    let MGO = propertySums["MgO"] / totalPercentage;
    let NAO = propertySums["Na₂O"] / totalPercentage;
    let KO  = propertySums["K₂O"] / totalPercentage;
    let TIO = propertySums["TiO₂"] / totalPercentage;
    let SO  = propertySums["SO₃"] / totalPercentage;
    let PO  = propertySums["P₂O₅"] / totalPercentage;
    let S   = propertySums["Sulphur (S)"] / totalPercentage;
    let MNO = propertySums["Mn₃O₄"] / totalPercentage;

    // 6) Debug — show what will be sent to ML
    console.table({
        SiO2: SIO, Al2O3: ALO, Fe2O3: FEO,
        CaO: CAO, MgO: MGO, Na2O: NAO,
        K2O: KO, SO3: SO, TiO2: TIO
    });

    // 7) Call ML endpoint to get predictedAFT
    try {
        const response = await axios.post(
            './calculate-aft',
            {
                values: [SIO, ALO, FEO, CAO, MGO, NAO, KO, SO, TIO]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        // Use backend prediction (no redeclaration - use outer scope variable)
        predictedAFT = Number(response.data.prediction);
        console.log('predictedAFT (ML):', predictedAFT);

    } catch (err) {
        console.error('AFT ML API failed:', err);
        // safe fallback value so downstream calculations don't break
        predictedAFT = 1200;
        console.log('predictedAFT (fallback):', predictedAFT);
    }

    // 8) Build the properties HTML (acidic/basic/other) and compute plotting values
    blendValuesDiv.innerHTML = "";
    let acidicOxidesAvg = 0;
    let basicOxidesAvg = 0;
    let otherOxidesAvg = 0;

    if (totalPercentage > 0) {
        let propertiesHTML = `
            <table border="1">
                <tr><th>Property</th><th>Value</th></tr>
        `;

        for (let prop in propertySums) {
            let avgValue = (propertySums[prop] / totalPercentage) || 0;

            if (prop === "SiO₂" || prop === "Al₂O₃" || prop === "TiO₂") {
                acidicOxidesAvg += avgValue;
            }
            if (prop === "CaO" || prop === "MgO" || prop === "Na₂O" || prop === "K₂O") {
                basicOxidesAvg += avgValue;
            }
            if (prop === "Fe₂O₃" || prop === "SO₃" || prop === "P₂O₅" || prop === "Mn₃O₄") {
                otherOxidesAvg += avgValue;
            }

            propertiesHTML += `<tr><td><strong>${prop}</strong></td><td>${avgValue.toFixed(2)}</td></tr>`;
        }

        propertiesHTML += "</table>";
        blendValuesDiv.innerHTML = propertiesHTML;

        // Clear previous right container content and push the "Simulated AFB" button back
        rightContainerDiv.innerHTML = "";
        rightContainerDiv.appendChild(blendPropertiesBtn);

        // Prepare ternary sample values
        let acidic = acidicOxidesAvg || 0;
        let basic  = basicOxidesAvg || 0;
        let other  = otherOxidesAvg || 0;

        const totalABC = acidic + basic + other;

        if (totalABC === 0) {
            console.warn('Skipping ternary sample: all zero');
        } else {
            // normalize to percent-scale used by ternary
            if (totalABC <= 1.1) {
                acidic *= 100;
                basic  *= 100;
                other  *= 100;
            } else if (Math.abs(totalABC - 100) > 0.1) {
                acidic = acidic / totalABC * 100;
                basic  = basic  / totalABC * 100;
                other  = other  / totalABC * 100;
            }

            let newSample = {
                acidicOxides: acidic,
                basicOxides: basic,
                otherOxides: other,
                AFT: predictedAFT
            };
            console.log('Added ternary sample:', newSample);
            samples.push(newSample);
        }

        // 9) Slagging and Fouling calculations (same as original)
        const T250 = Math.sqrt(
            ((((0.00835 * SIO) + (0.00601 * ALO) - 0.109) * 10**7) /
            (2.398 - ((0.0415 * SIO) + (0.0192 * ALO) +
            (0.027 * FEO) + (0.016 * CAO) - 3.92)))) + 150;

        let T250S;
        if (T250 > 1275) T250S = 0;
        else if (T250 < 1200) T250S = 1;
        else T250S = 0.5;

        const BART = (FEO + CAO + MGO + NAO + KO) / (SIO + ALO + TIO);

        let BARS;
        if (BART < 0.5) BARS = 0;
        else if (BART > 1) BARS = 1;
        else BARS = 0.5;

        let HT = predictedAFT - 78;
        let IDT = predictedAFT - 103;

        const SF = BART * S;
        let SFS;
        if (SF < 0.6) SFS = 0;
        else if (SF > 1) SFS = 1;
        else SFS = 0.5;

        const SIT = (HT + 4 * IDT) / 5;
        let SIS;
        if (SIT > 1343) SIS = 0;
        else if (SIT < 1149) SIS = 1;
        else SIS = 0.5;

        const SPT = SIO * 100 / (SIO + FEO + CAO + MGO);
        let SPS;
        if (SPT > 82) SPS = 0;
        else if (SPT < 30) SPS = 1;
        else SPS = 0.5;

        const ICRT = FEO / CAO;
        let ICRS;
        if (ICRT < 0.31) ICRS = 0;
        else if (ICRT > 3) ICRS = 1;
        else ICRS = 0.5;

        const IPCT = FEO + CAO;
        const IPCS = IPCT < 12 ? 0 : 1;

        const FSP = Number(T250S) + Number(BARS) + Number(SFS) + Number(SIS) + Number(SPS) + Number(ICRS) + Number(IPCS);
        let FSPD;
        if (FSP < 2) FSPD = "Low";
        else if (FSP > 4) FSPD = "High";
        else FSPD = "Moderate";

        // FOULING
        const SIAT = NAO * (46 / 62);
        let SIAS;
        if (SIAT < 1) SIAS = 0;
        else if (SIAT > 5) SIAS = 1;
        else SIAS = 0.5;

        const TAT = (FEO + CAO + MGO + NAO + KO + MNO + SO + PO);
        const TAS = TAT < 2 ? 0 : 1;

        const FFT = BART * SIAT;
        let FFS;
        if (FFT < 0.1) FFS = 0;
        else if (FFT > 0.5) FFS = 1;
        else FFS = 0.5;

        const FFFTS = Number(SIAS) + Number(TAS) + Number(FFS);
        let FFFD;
        if (FFFTS < 1) FFFD = "Low";
        else if (FFFTS > 2) FFFD = "High";
        else FFFD = "Moderate";

        let totalScore = FSP + FFFTS;

        // O&M checkbox scoring
        let checkboxScore = 0;
        let allQuestions = ["question1","question2","question3","question4","question5","question6","question7","question8","question9","question10","question11"];
        let selectedValues = getSelectedCheckboxes();

        let scoreMapping = {
            "question1": [0.5, 0],
            "question2": [0.25, 0],
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

        allQuestions.forEach(question => {
            let isChecked = selectedValues.includes(question);
            checkboxScore += isChecked ? scoreMapping[question][0] : scoreMapping[question][1];
        });

        let overallTotal = totalScore + checkboxScore;
        console.log("Total Score:", overallTotal);

        let FoulingHTML = `
            <table>
                <thead><tr><th colspan="3">Slagging Potential (Results in to Clinker Formation)</th></tr>
                <tr><th>Slagging Indices</th><th>Test Coal</th><th>Aggregate Scores</th></tr></thead>
                <tr><td>T250</td><td>${T250.toFixed(2)}</td><td>${T250S}</td></tr>
                <tr><td>Base/Acid Ratio (BART)</td><td>${BART.toFixed(2)}</td><td>${BARS}</td></tr>
                <tr><td>Slagging Factor ((B/A ratio * S in coal))</td><td>${SF.toFixed(2)}</td><td>${SFS}</td></tr>
                <tr><td>Slagging Index Test</td><td>${SIT.toFixed(2)}</td><td>${SIS}</td></tr>
                <tr><td>Silica % Test</td><td>${SPT.toFixed(2)}</td><td>${SPS}</td></tr>
                <tr><td>Iron Calcium Ratio Test</td><td>${ICRT.toFixed(2)}</td><td>${ICRS}</td></tr>
                <tr><td>Iron + Calcium</td><td>${IPCT.toFixed(2)}</td><td>${IPCS}</td></tr>
            </table>`;

        let FoulingHTML2 = `<table>
            <thead><tr><th colspan="3">Fouling Potential (Requires increased soot blowing)</th></tr>
            <tr><th>Fouling Indices</th><th>Test Coal</th><th>Aggregate Scores</th></tr></thead>
            <tr><td>Sodium in Ash</td><td>${SIAT.toFixed(2)}</td><td>${SIAS}</td></tr>
            <tr><td>Alkali Test</td><td>${TAT.toFixed(2)}</td><td>${TAS}</td></tr>
            <tr><td>Fouling Factor (B/A*Na)</td><td>${FFT.toFixed(2)}</td><td>${FFS}</td></tr>
        </table>`;

        rightContainerDiv.appendChild(blendPropertiesBtn);

        // charts + gauge + tables (kept the same)
        google.charts.load('current', { 'packages': ['gauge'] });

        let chartWrapper = document.createElement("div");
        chartWrapper.style.display = "flex";
        chartWrapper.style.justifyContent = "center";
        chartWrapper.style.gap = "40px";
        rightContainerDiv.appendChild(chartWrapper);

        const fspGraphWrapper = document.createElement("div");
        fspGraphWrapper.style.textAlign = "center";

        const fspDisplay = document.createElement("div");
        fspDisplay.style.marginTop = "20px";
        fspDisplay.style.marginBottom = "3px";
        fspDisplay.style.fontWeight = "bold";
        fspDisplay.textContent = `Slagging Potential : ${FSPD}`;

        const fspGraphContainer = document.createElement("div");
        fspGraphContainer.id = "fspGaugeChart";
        fspGraphContainer.style.width = "200px";
        fspGraphContainer.style.height = "200px";

        fspGraphWrapper.appendChild(fspDisplay);
        fspGraphWrapper.appendChild(fspGraphContainer);
        chartWrapper.appendChild(fspGraphWrapper);

        const ffftsGraphWrapper = document.createElement("div");
        ffftsGraphWrapper.style.textAlign = "center";

        const ffftsDisplay = document.createElement("div");
        ffftsDisplay.style.marginTop = "20px";
        ffftsDisplay.style.marginBottom = "3px";
        ffftsDisplay.style.fontWeight = "bold";
        ffftsDisplay.textContent = `Fouling Potential: ${FFFD}`;

        const ffftsGraphContainer = document.createElement("div");
        ffftsGraphContainer.id = "ffftsGaugeChart";
        ffftsGraphContainer.style.width = "200px";
        ffftsGraphContainer.style.height = "200px";

        ffftsGraphWrapper.appendChild(ffftsDisplay);
        ffftsGraphWrapper.appendChild(ffftsGraphContainer);
        chartWrapper.appendChild(ffftsGraphWrapper);

        let tableContainer = document.createElement("div");
        tableContainer.style.width = "100%";
        tableContainer.style.marginTop = "20px";
        rightContainerDiv.appendChild(tableContainer);

        google.charts.setOnLoadCallback(() => createGaugeChart("fspGaugeChart", FSP, 0, 6, fspColorRanges));
        google.charts.setOnLoadCallback(() => createffftGaugeChart("ffftsGaugeChart", FFFTS, 0, 3, ffftsColorRanges));

        // toggle logic + chart functions (kept same as original)
        let fspTableVisible = false;
        let fspTableElement = null;
        let ffftsTableVisible = false;
        let ffftsTableElement = null;

        function updateTableLayout() {
            tableContainer.innerHTML = "";
            if (fspTableVisible && fspTableElement) {
                fspTableElement.style.width = "100%";
                fspTableElement.style.marginBottom = "10px";
                tableContainer.appendChild(fspTableElement);
            }
            if (ffftsTableVisible && ffftsTableElement) {
                ffftsTableElement.style.width = "100%";
                tableContainer.appendChild(ffftsTableElement);
            }
            tableContainer.appendChild(overallGraphWrapper);
        }

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

        function createGaugeChart(containerId, value, minValue, maxValue, colorRanges) {
            const data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Value', value]
            ]);
            const options = {
                width: 200, height: 200,
                min: minValue,
                max: maxValue,
                redFrom: colorRanges.red[0], redTo: colorRanges.red[1],
                yellowFrom: colorRanges.yellow[0], yellowTo: colorRanges.yellow[1],
                greenFrom: colorRanges.green[0], greenTo: colorRanges.green[1],
                greenColor: '#5de65d',
                yellowColor: '#ffff76',
                redColor: '#e24242',
                majorTicks: ['0', '1', '2', '3', '4', '5', '6'],
                minorTicks: 2
            };
            const chart = new google.visualization.Gauge(document.getElementById(containerId));
            chart.draw(data, options);
        }

        function createffftGaugeChart(containerId, value, minValue, maxValue, colorRanges) {
            const data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Value', value]
            ]);
            const options = {
                width: 200, height: 200,
                min: minValue,
                max: maxValue,
                redFrom: colorRanges.red[0], redTo: colorRanges.red[1],
                yellowFrom: colorRanges.yellow[0], yellowTo: colorRanges.yellow[1],
                greenFrom: colorRanges.green[0], greenTo: colorRanges.green[1],
                greenColor: '#5de65d',
                yellowColor: '#ffff76',
                redColor: '#e24242',
                majorTicks: ['0', '1', '2', '3'],
                minorTicks: 2
            };
            const chart = new google.visualization.Gauge(document.getElementById(containerId));
            chart.draw(data, options);
        }

        const fspColorRanges = { green: [0, 2], yellow: [2, 4], red: [4, 6] };
        const ffftsColorRanges = { green: [0, 1], yellow: [1, 2], red: [2, 3] };

        function createOverallGraph(totalScore, checkboxScore, overallTotal) {
            const minValue = 0;
            const maxValue = 10;
            const overallGraphContainer = document.createElement("div");
            overallGraphContainer.style.width = "550px";
            overallGraphContainer.style.height = "32px";
            overallGraphContainer.style.border = "1px solid black";
            overallGraphContainer.style.borderRadius = "12px";
            overallGraphContainer.style.position = "relative";
            overallGraphContainer.style.marginBottom = "20px";
            overallGraphContainer.style.marginLeft = "50px";
            overallGraphContainer.style.display = "flex";

            let sfWidth = (totalScore / maxValue) * 100;
            sfWidth = sfWidth > 100 ? 100 : sfWidth;

            let cbWidth = ((totalScore + checkboxScore) > maxValue)
                ? Math.max(0, (maxValue - totalScore) / maxValue * 100)
                : (checkboxScore / maxValue) * 100;

            const totalCombined = totalScore + checkboxScore;

            const sfBar = document.createElement("div");
            sfBar.style.height = "100%";
            sfBar.style.width = `${sfWidth}%`;
            sfBar.style.borderRadius = totalCombined >= maxValue ? "12px" : "12px 0 0 12px";
            sfBar.style.backgroundColor = getColor(totalScore);

            const cbBar = document.createElement("div");
            cbBar.style.height = "100%";
            cbBar.style.width = `${cbWidth}%`;
            cbBar.style.borderRadius = totalCombined >= maxValue ? "0 12px 12px 0" : "0";
            cbBar.style.backgroundColor = getCheckboxBaseColor(totalScore);
            cbBar.style.backgroundImage = getHatchingLines(getHatchColor(totalCombined));

            overallGraphContainer.appendChild(sfBar);
            overallGraphContainer.appendChild(cbBar);

            for (let i = minValue; i <= maxValue; i++) {
                const tick = document.createElement("div");
                tick.style.position = "absolute";
                tick.style.left = `${(i / maxValue) * 100}%`;
                tick.style.top = "50%";
                tick.style.transform = "translateY(-50%)";
                tick.style.height = "10px";
                tick.style.width = "1px";
                tick.style.backgroundColor = "black";

                const label = document.createElement("span");
                label.style.position = "absolute";
                label.style.marginTop = "5px";
                label.style.left = `${(i / maxValue) * 100}%`;
                label.style.top = "100%";
                label.style.transform = "translateX(-50%)";
                label.style.fontSize = "12px";
                label.textContent = i;

                overallGraphContainer.appendChild(tick);
                overallGraphContainer.appendChild(label);
            }

            const totalDisplay = document.createElement("div");
            totalDisplay.style.marginBottom = "10px";
            totalDisplay.style.marginTop = "10px";
            totalDisplay.style.marginLeft = "80px";
            totalDisplay.style.fontSize = "18px";
            totalDisplay.style.fontWeight = "bold";
            totalDisplay.textContent = `Overall Score: ${overallTotal.toFixed(1)} (Slagging + Fouling: ${totalScore.toFixed(1)}, O&M Score: ${checkboxScore.toFixed(1)})`;

            rightContainerDiv.appendChild(totalDisplay);
            rightContainerDiv.appendChild(overallGraphContainer);
        }

        function getColor(score) {
            if (score < 3) return "#a6e3a6";
            if (score < 6.5) return "yellow";
            return "red";
        }

        function getCheckboxBaseColor(score) {
            if (score < 3) return "#5de65d";
            if (score < 6.5) return "#fddf05";
            return "#e24242";
        }

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

        let overallGraphWrapper = document.getElementById("overallGraphWrapper");
        if (!overallGraphWrapper) {
            overallGraphWrapper = document.createElement("div");
            overallGraphWrapper.id = "overallGraphWrapper";
            rightContainerDiv.insertBefore(overallGraphWrapper, rightContainerDiv.firstChild);
        }
        overallGraphWrapper.innerHTML = ""; // Clear previous content
        createOverallGraph(totalScore, checkboxScore, overallTotal);

        const plotDiv = document.createElement('div');
        plotDiv.id = "ternary-plot";
        rightContainerDiv.appendChild(plotDiv);
        updatePlot();
    } // end if totalPercentage > 0
} // end calculateWeightedAverage

        
        function updatePlot() {
        const ternaryPlotElement = document.getElementById('ternary-plot');
       
        
        // Ensure the element exists before trying to render the plot
        if (!ternaryPlotElement) {
            console.error("Ternary plot element #ternary-plot not found.");
            return;
        }
        
        
        
        var data = [{
            type: 'scatterternary',
            mode: 'markers',
            a: samples.map(s => s.acidicOxides),
            b: samples.map(s => s.basicOxides),
            c: samples.map(s => s.otherOxides),
            marker: {
                size: 12,
                color: samples.map(s => s.AFT),  // Use AFT directly for color scaling
                colorscale: 'Jet',
                colorbar: { title: "Fusion Temp (°C)" }  // Label in Celsius
            },
            text: samples.map(s => `Fusion Temp: ${parseFloat(s.AFT).toFixed(2)}°C`),  // Show Fusion Temp in Celsius on hover
            hoverinfo: 'text'
        }];
        
        var layout = {
            margin: { l: 80, r: 60, t: 60, b: 50 },
            ternary: {
                sum: 100,
                aaxis: { 
                    title: { text: "Thermal Stability", font: { size: 12 } }, 
                    showticklabels: true  // Ensure tick labels are displayed
                },
                baxis: { 
                    title: { text: "Fusion Accelerator", font: { size: 12 } }, 
                    showticklabels: true
                    
                },
                caxis: { 
                    title: { text: "Hardening Index", font: { size: 12 } }, 
                    showticklabels: true,  
                    title_standoff: 15 
                }
            }
        };
        
        Plotly.newPlot(ternaryPlotElement, data, layout);
        }
        
        
        
        function removeBlend(button) {
            button.parentElement.remove(); 
        }
        
// --- Initialization: no backend required (client-only) ---
document.addEventListener('DOMContentLoaded', () => {
  // ensure globals exist
  window.coalData = window.coalData || [];       // will be filled from uploaded Excel
  window.excelCoalMap = window.excelCoalMap || {}; // dates->rows map
  // create one blank blend row so UI is ready
  try { addBlend(); } catch(e){ console.warn('addBlend missing on load', e); }
});

        
        
        // function populateDropdown(selectElement) {
        //     selectElement.innerHTML = '<option value="">Select Coal Type</option>';
        //     window.coalData.forEach(coal => {
        //     const opt = document.createElement('option');
        //     opt.value = coal.id;            // <-- hidden unique key
        //     opt.textContent = coal.transportId
        //         ? `${coal.coalType} – ${coal.transportId}`
        //         : coal.coalType;
        //     selectElement.appendChild(opt);
        // });
        // }

//         function populateDropdown(selectElement) {
//     selectElement.innerHTML = '<option value="">Select Coal Type</option>';

//     if (!Array.isArray(window.coalData)) {
//         console.error("coalData is not an array:", window.coalData);
//         return;
//     }

//     const sortedCoalData = [...window.coalData].sort((a, b) => {
//         const aText = `${a?.coalType || ""} ${a?.transportId || ""}`.trim();
//         const bText = `${b?.coalType || ""} ${b?.transportId || ""}`.trim();

//         return aText.localeCompare(bText, undefined, { sensitivity: "base" });
//     });

//     sortedCoalData.forEach(coal => {
//         if (!coal || coal.id == null) return;

//         const opt = document.createElement('option');
//         opt.value = coal.id;
//         opt.textContent = coal.transportId
//             ? `${coal.coalType || ""} – ${coal.transportId}`
//             : (coal.coalType || "Unknown Coal");

//         selectElement.appendChild(opt);
//     });
// }

  function populateDropdown(selectElement) {
  selectElement.innerHTML = '<option value="">Select Coal Type</option>';

  // Ensure coalData is an array
  if (!Array.isArray(window.coalData)) {
    window.coalData = [];
  }

  // sort a shallow copy for stable order
  const sortedCoalData = window.coalData.slice().sort((a, b) => {
    const aText = `${a?.coalType || a?.coalName || ''} ${a?.transportId || ''}`.trim();
    const bText = `${b?.coalType || b?.coalName || ''} ${b?.transportId || ''}`.trim();
    return aText.localeCompare(bText, undefined, { sensitivity: 'base' });
  });

  sortedCoalData.forEach(coal => {
    if (!coal) return;
    const opt = document.createElement('option');
    // use id if present, otherwise use coalName as fallback id
    opt.value = (coal.id !== undefined && coal.id !== null) ? coal.id : coal.coalName;
    opt.textContent = coal.transportId
      ? `${coal.coalType || coal.coalName || ''} – ${coal.transportId}`
      : (coal.coalType || coal.coalName || 'Unknown Coal');
    selectElement.appendChild(opt);
  });
}
      
        
// Replace the existing fetchCoalProperties(index) in date.html with this:
function fetchCoalProperties(index) {
    const selectedCoal = document.querySelector(`#coal${index}`).value;

    if (!selectedCoal) {
        alert("Please select a coal type first.");
        return;
    }

    // try find by id first (id may be a number or string), then fall back to coalName/coalType/transportId
    let coalInfo = (window.coalData || []).find(c => c && String(c.id) === String(selectedCoal));

    if (!coalInfo) {
        const selNorm = String(selectedCoal || '').toLowerCase().trim();
        coalInfo = (window.coalData || []).find(c => {
            if (!c) return false;
            const candidates = [
                String(c.coalName || '').toLowerCase().trim(),
                String(c.coalType || '').toLowerCase().trim(),
                String(c.transportId || '').toLowerCase().trim(),
                String(c.id || '').toLowerCase().trim()
            ];
            return candidates.some(x => x && x === selNorm);
        });
    }

    if (!coalInfo) {
        alert("Properties not found for the selected coal.");
        return;
    }

    // Build the properties table
    let propertiesHTML = `
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 8px; border: 1px solid lightgray;">Property</th>
                    <th style="padding: 8px; border: 1px solid lightgray;">Value</th>
                </tr>
            </thead>
            <tbody>
    `;

    const p = coalInfo.properties || {};
    for (const [key, value] of Object.entries(p)) {
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
//         document.getElementById("downloadPDF").addEventListener("click", function () {
//   const { jsPDF } = window.jspdf;
//   const element = document.body; // ✅ capture whole page including navbar

//   html2canvas(element, {
//     scale: 2,
//     useCORS: true,
//     onclone: (clonedDoc) => {
//       // Handle input & textarea values
//       const inputs = clonedDoc.querySelectorAll("input, textarea");
//       inputs.forEach(input => {
//         const text = clonedDoc.createElement("span");
//         text.textContent = input.value;

//         text.style.position = "absolute";
//         text.style.left = input.offsetLeft + "px";
//         text.style.top = input.offsetTop + "px";
//         text.style.width = input.offsetWidth + "px";
//         text.style.height = input.offsetHeight + "px";
//         text.style.lineHeight = input.offsetHeight + "px";
//         text.style.textAlign = "center";
//         text.style.font = window.getComputedStyle(input).font;
//         text.style.color = window.getComputedStyle(input).color;

//         clonedDoc.body.appendChild(text);
//         input.style.visibility = "hidden";
//       });

//       // Handle select dropdowns (coal names)
//       const selects = clonedDoc.querySelectorAll("select");
//       selects.forEach(select => {
//         const selectedText = select.options[select.selectedIndex]?.text || "";
//         const text = clonedDoc.createElement("span");
//         text.textContent = selectedText;

//         text.style.position = "absolute";
//         text.style.left = select.offsetLeft + "px";
//         text.style.top = select.offsetTop + "px";
//         text.style.width = select.offsetWidth + "px";
//         text.style.height = select.offsetHeight + "px";
//         text.style.lineHeight = select.offsetHeight + "px";
//         text.style.textAlign = "center";
//         text.style.font = window.getComputedStyle(select).font;
//         text.style.color = window.getComputedStyle(select).color;

//         clonedDoc.body.appendChild(text);
//         select.style.visibility = "hidden";
//       });
//     }
//   }).then(canvas => {
//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("p", "mm", "a4");

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     const imgWidth = pageWidth;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     let heightLeft = imgHeight;
//     let position = 0;

//     pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//     heightLeft -= pageHeight;

//     while (heightLeft > 0) {
//       position = heightLeft - imgHeight;
//       pdf.addPage();
//       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//       heightLeft -= pageHeight;
//     }

//     pdf.save("Coal_Blending_Ratio.pdf");
//   });
// });
 
    
    

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
        window.location.href = '/slagging';
        return null;
      }
      if (resp.status === 403 && data.lockedUntil) {
        // account locked
        const lockedUntil = new Date(data.lockedUntil);
        const msLeft = lockedUntil - new Date();
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        alert(`Account locked. Try after ${hoursLeft} hour(s) (until ${lockedUntil.toLocaleString()}).`);
        // Optionally redirect to login page
        window.location.href = '/slagging';
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
      window.location.href = '/slagging';
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


/* Common navbar script: sets active button and wiring
   Paste this JS as-is into each page (kept inline for simplicity).
*/
(function(){
  // find nav buttons and add click behavior
  const navBtns = Array.from(document.querySelectorAll('.common-navbar .nav-buttons button'))
    .filter(b => b.dataset && b.dataset.target); // keep element buttons only

  // mark active based on current path or filename
  const path = (location.pathname || '').split('/').pop().toLowerCase();

  let matched = false;
  navBtns.forEach(btn => {
    const target = (btn.dataset.target || '').toLowerCase();
    // button click navigates (keeps behavior same)
    btn.addEventListener('click', () => { if (target) location.href = target; });
    // choose active when filenames match, or if path is empty, match model.html as default
    if ((path && path === target) || (!path && target === 'model.html')) {
      btn.classList.add('active');
      matched = true;
    } else {
      btn.classList.remove('active');
    }
  });

  // If no match found (e.g. URL rewrite), try to match by presence of page-specific id in body
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

  // logout behavior (matches earlier logout functions)
  const logoutBtn = document.getElementById('common-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { localStorage.setItem('isLoggedIn','false'); } catch(e) {}
      // preserve existing logout pattern: redirect to login.html
      window.location.href = './login.html';
    });
  }
})();

document.getElementById("downloadPDF").addEventListener("click", async function () {
  const { jsPDF } = window.jspdf;
  const PLOT_ID = 'ternary-plot';

  // Render the Plotly ternary as PNG but first add visible text labels for Fusion Temp
  async function renderPlotImage() {
    const div = document.getElementById(PLOT_ID);
    if (!div || !window.Plotly) return null;

    const tIdx = 0; // first trace (assumes the ternary is the first trace)
    const orig = {
      mode: div.data?.[tIdx]?.mode,
      text: div.data?.[tIdx]?.text,
      textposition: div.data?.[tIdx]?.textposition,
      textfont: div.data?.[tIdx]?.textfont
    };

    // Build text labels as "Fusion Temp: <value>°C" from the trace color or samples array
    // Try marker.color first, fallback to samples global if available
    let aftText = [];
    try {
      const marker = div.data?.[tIdx]?.marker || {};
      const colorArr = Array.isArray(marker.color) ? marker.color : (window.samples ? window.samples.map(s => s.AFT) : []);
      aftText = colorArr.map(c => (isFinite(c) ? `Fusion Temp: ${Math.round(c)}°C` : ''));
    } catch (e) {
      aftText = (window.samples || []).map(s => (isFinite(s.AFT) ? `Fusion Temp: ${Math.round(s.AFT)}°C` : ''));
    }

    try {
      if (aftText.length) {
        // temporarily add text + position so exported image shows the labels
        await Plotly.restyle(div, {
          mode: ['markers+text'],
          text: [aftText],
          textposition: ['top center'],
          textfont: [{ size: 14, family: 'Arial, sans-serif', color: '#111' }]
        }, [tIdx]);
      }

      // Export a high-res PNG of the plot (large dims so PDF remains crisp)
      const png = await Plotly.toImage(div, { format: 'png', width: 1200, height: 900, scale: 2 });
      return png;
    } catch (err) {
      console.warn('Plot export failed:', err);
      return null;
    } finally {
      // restore original trace props so UI is unchanged
      try {
        await Plotly.restyle(div, {
          mode: [orig.mode ?? 'markers'],
          text: [orig.text ?? null],
          textposition: [orig.textposition ?? null],
          textfont: [orig.textfont ?? null]
        }, [tIdx]);
      } catch (ignore) {}
    }
  }

  const plotPNG = await renderPlotImage();

  // Snapshot the page, but replace interactive bits with visible text (selects, inputs, checkboxes)
  const canvas = await html2canvas(document.body, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    foreignObjectRendering: true,
    onclone: (clonedDoc) => {
      // hide the download button from the PDF
      const btn = clonedDoc.getElementById('downloadPDF');
      if (btn) btn.style.display = 'none';

      // helper to replace an element with an inline span that keeps dimensions
      const replaceWithSpan = (el, text) => {
        const cs = window.getComputedStyle(el);
        const span = clonedDoc.createElement('span');
        span.textContent = text || '';
        // preserve basic sizing & font so layout remains similar
        span.style.display = 'inline-block';
        span.style.minWidth = (el.offsetWidth || 100) + 'px';
        span.style.height = (el.offsetHeight || 24) + 'px';
        span.style.lineHeight = (el.offsetHeight || 24) + 'px';
        span.style.font = cs.font || '14px/1 Arial, sans-serif';
        span.style.color = cs.color || '#111';
        span.style.verticalAlign = 'middle';
        span.style.whiteSpace = 'nowrap';
        span.style.overflow = 'hidden';
        span.style.textOverflow = 'ellipsis';
        el.replaceWith(span);
      };

      // Replace inputs and textareas with their values
      clonedDoc.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
        replaceWithSpan(input, input.value || '');
      });

      // Replace checkboxes with a visible checkmark box
      clonedDoc.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        const rect = cb.getBoundingClientRect();
        const box = clonedDoc.createElement('span');
        box.style.display = 'inline-block';
        box.style.width = (rect.width || 18) + 'px';
        box.style.height = (rect.height || 18) + 'px';
        box.style.border = '1px solid #333';
        box.style.borderRadius = '3px';
        box.style.textAlign = 'center';
        box.style.lineHeight = (rect.height || 18) + 'px';
        box.textContent = cb.checked ? '✔' : '';
        cb.replaceWith(box);
      });

      // SPECIAL: For each blend row - replace the select (coal name) + percent input with one inline labeled span
      clonedDoc.querySelectorAll('.blend').forEach((blendEl, idx) => {
        try {
          const sel = blendEl.querySelector('select');
          const inp = blendEl.querySelector('input[type="number"], input');
          const selectedText = sel ? (sel.options[sel.selectedIndex]?.text || '') : '';
          const percentText = inp ? (inp.value ? `${parseFloat(inp.value).toFixed(1)}%` : '') : '';
          const combined = selectedText ? (percentText ? `${selectedText} — ${percentText}` : selectedText) : percentText;
          // create a compact flex span to keep alignment same in PDF
          const span = clonedDoc.createElement('span');
          span.textContent = combined;
          span.style.display = 'inline-block';
          span.style.minWidth = ((sel?.offsetWidth || 140) + (inp?.offsetWidth || 60)) + 'px';
          span.style.height = (sel?.offsetHeight || 32) + 'px';
          span.style.lineHeight = (sel?.offsetHeight || 32) + 'px';
          span.style.verticalAlign = 'middle';
          span.style.font = window.getComputedStyle(sel || blendEl).font || '14px/1 Arial, sans-serif';
          span.style.whiteSpace = 'nowrap';
          span.style.overflow = 'hidden';
          span.style.textOverflow = 'ellipsis';

          // Replace select and input with the single span (replace select first then input if still present)
          if (sel) sel.replaceWith(span);
          if (inp && inp.parentNode) inp.parentNode.removeChild(inp);
        } catch (e) { /* ignore per-row failure */ }
      });

      // Replace remaining selects generically if any left
      clonedDoc.querySelectorAll('select').forEach(select => {
        const selText = select.options[select.selectedIndex]?.text || '';
        replaceWithSpan(select, selText);
      });

      // If we have a PNG snapshot of the ternary plot, swap the cloned plot container for the image
      if (plotPNG) {
        const clonedPlot = clonedDoc.getElementById(PLOT_ID);
        if (clonedPlot) {
          while (clonedPlot.firstChild) clonedPlot.removeChild(clonedPlot.firstChild);
          const img = clonedDoc.createElement('img');
          img.src = plotPNG;
          img.style.width = '100%';
          img.style.height = 'auto';
          img.style.display = 'block';
          clonedPlot.appendChild(img);
        }
      }
    }
  });

  // Build the PDF (landscape A4, keep high quality)
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // convert canvas to image and add to PDF (fit width, preserve aspect ratio)
  const imgData = canvas.toDataURL("image/png");
  const imgWidth = pageWidth - 8; // small margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 4;
  pdf.addImage(imgData, "PNG", 4, position, imgWidth, imgHeight);
  let remainingHeight = imgHeight - (pageHeight - 8);

  // paginate if needed
  while (remainingHeight > 0) {
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 4, position - (imgHeight - remainingHeight), imgWidth, imgHeight);
    remainingHeight -= (pageHeight - 8);
  }

  pdf.save("Coal_Blending_Report.pdf");
});
// ---------- Excel upload + date-based fill (paste after your existing JS) ----------
(function () {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('excelFileInput');
  const dateSelect = document.getElementById('dateSelect');

  // Trigger file selector
  uploadBtn.addEventListener('click', () => fileInput.click());

  // Read file and parse
// Read file and parse (replace existing handler with this block)
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }); // array of objects

    if (!rows || rows.length === 0) {
      alert('Excel appears empty.');
      return;
    }

    // ----------------- helpers -----------------
    function parsePercentValue(raw) {
      if (raw === null || raw === undefined) return 0;
      let s = String(raw).trim();
      const isParen = /^\(.*\)$/.test(s);
      // remove % and commas and extra whitespace
      s = s.replace(/%/g, '').replace(/,/g, '').trim();
      // keep digits, dot, minus
      s = s.replace(/[^\d.\-]/g, '');
      let n = parseFloat(s);
      if (isNaN(n)) n = 0;
      if (isParen) n = -Math.abs(n);
      return n;
    }

    // normalize header detection
    const headerKeys = Object.keys(rows[0] || {});
    const findKey = (regexList) => headerKeys.find(h => regexList.some(r => new RegExp(r, 'i').test(h)));

    const dateKey = findKey(['^date$','date','day','sample_date','dt','timestamp']);
    const coalKey = findKey(['^coal$','coal','coalname','coal name','coal_type','name','coaltype','type']);
    //const percentKey = findKey(['percent','percentage','%','percent_used','used','pct','value']);
    // --------- SAFE percent column detection ---------
let percentKey = null;

// 1) strict matches first (best case)
percentKey = headerKeys.find(h =>
  /^(percent|percentage|pct|%|percent_used)$/i.test(h.trim())
);

// 2) relaxed matches, but explicitly NOT date columns
if (!percentKey) {
  percentKey = headerKeys.find(h =>
    /(percent|percentage|pct|%)/i.test(h) &&
    !/(date|day|time|timestamp)/i.test(h)
  );
}

// 3) final safety check
if (!percentKey || percentKey === dateKey) {
  alert(
    'Could not safely identify the Percent column.\n' +
    'Detected headers: ' + headerKeys.join(', ')
  );
  return;
}

    if (!dateKey || !coalKey || !percentKey) {
      alert('Could not detect Date / Coal / Percent columns in the uploaded file. Found headers: ' + headerKeys.join(', '));
      return;
    }

    // ----------------- build maps -----------------
    const map = {};            // dateStr -> [{ coalName, percent }]
    const coalMaster = {};     // coalName -> { id, coalName, coalType, properties }

    rows.forEach(r => {
      // normalize date to YYYY-MM-DD where possible
      const dateRaw = r[dateKey];
      let ds;
      if (dateRaw instanceof Date && !isNaN(dateRaw)) {
        ds = dateRaw.toISOString().split('T')[0];
      } else {
        const parsed = new Date(dateRaw);
        ds = (!isNaN(parsed)) ? parsed.toISOString().split('T')[0] : String(dateRaw).trim();
      }

      const coalName = String(r[coalKey] || '').trim();
      if (!coalName) return; // skip blank coal rows

      const percent = parsePercentValue(r[percentKey]);

      if (!map[ds]) map[ds] = [];
      map[ds].push({ coalName, percent });

      // Build properties for this coal (first occurrence wins)
      if (!coalMaster[coalName]) {
        const props = {};
        headerKeys.forEach(hdr => {
          if (hdr === dateKey || hdr === coalKey || hdr === percentKey) return; // skip primary columns
          const rawVal = r[hdr];
          if (rawVal === '' || rawVal === undefined || rawVal === null) return;
          // attempt numeric parse for property-like values (strip % and commas)
          const cleaned = String(rawVal).replace(/%/g, '').replace(/,/g, '').trim();
          const num = parseFloat(cleaned);
          // use sanitized header name as key (trim)
          const key = hdr.trim();
          props[key] = (isNaN(num) ? rawVal : num);
        });

        coalMaster[coalName] = {
          id: coalName,           // use coalName as id (no backend)
          coalName,
          coalType: coalName,
          properties: props
        };
      }
    });

    // Expose globals consumed by the rest of the app
    window.excelCoalMap = map;
    window.coalData = Object.values(coalMaster); // array of coal objects

    // Try to call populateDateSelectFromExcel() if present (existing function in your page)
    if (typeof populateDateSelectFromExcel === 'function') {
      try { populateDateSelectFromExcel(); } catch (err) { console.warn('populateDateSelectFromExcel failed', err); }
    } else {
      // If not present, try a minimal fallback to populate a #dateSelect dropdown if exists
      const dateSelect = document.getElementById('dateSelect');
      if (dateSelect) {
        const keys = Object.keys(map).sort();
        dateSelect.innerHTML = '<option value="">Select Date</option>';
        keys.forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k;
          dateSelect.appendChild(opt);
        });
      }
    }

    const statusEl = document.getElementById('uploadStatus');
    if (statusEl) statusEl.textContent = 'Excel parsed — ' + Object.keys(map).length + ' date(s) found.';
    console.log('Excel parsed', { dates: Object.keys(map), coalCount: window.coalData.length });
  } catch (err) {
    console.error('Failed to parse Excel file', err);
    alert('Failed to parse Excel file. See console for details.');
  } finally {
    // reset so same file can be re-selected
    try { fileInput.value = ''; } catch(e){ /* ignore */ }
  }
});


  // populate #dateSelect using window.excelCoalMap
  function populateDateSelectFromExcel() {
    const map = window.excelCoalMap || {};
    const keys = Object.keys(map).sort();
    dateSelect.innerHTML = '<option value="">Select Date</option>';
    keys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      dateSelect.appendChild(opt);
    });
    // auto-select first date if present
    if (keys.length > 0) {
      dateSelect.selectedIndex = 1;
      onDateChange();
    }
  }

  // When a date is selected - build blends from excel rows
  async function onDateChange() {
    const selected = dateSelect.value;
    if (!selected) return;

    const rows = (window.excelCoalMap && window.excelCoalMap[selected]) || [];
    const blendRowContainer = document.querySelector('.blend-row');
    // clear existing blends
    blendRowContainer.innerHTML = '';

    // For each row from Excel, create one blend row and set values
    rows.forEach((r) => {
      addBlend(); // uses your existing function to append a new .blend and populateDropdown
      // find index of last created blend (addBlend uses current count as index)
      const idx = document.querySelectorAll('.blend').length - 1;
      const sel = document.getElementById(`coal${idx}`);
      const percentInput = document.getElementById(`currentrange${idx}`);

      // try to pick matching coal from window.coalData (match on coalType or transportId), case-insensitive
      let matched = null;
      if (Array.isArray(window.coalData)) {
        const nameLower = r.coalName.toLowerCase();
        matched = window.coalData.find(c => {
          const candidates = [
            String(c.coalType || '').toLowerCase(),
            String(c.transportId || '').toLowerCase(),
            String(c.coalName || '').toLowerCase()
          ];
          return candidates.some(x => x && x === nameLower);
        });
      }

      if (matched) {
        // set by id so calculateWeightedAverage finds the right properties
        sel.value = matched.id;
      } else {
        // If no match, append a temporary option so the visible name shows
        const tempOpt = document.createElement('option');
        tempOpt.value = r.coalName;
        tempOpt.textContent = r.coalName;
        sel.appendChild(tempOpt);
        sel.value = r.coalName;
      }

      percentInput.value = r.percent;
      // ensure totals update
      updateTotalRange();
    });
  }

  dateSelect.addEventListener('change', onDateChange);

  // If Excel was uploaded before coalData arrives, we still want to show dates.
  // When coalData is loaded elsewhere in your script, call:
  //    if (window.excelCoalMap) populateDateSelectFromExcel();
  // We'll attempt to auto-call after your existing fetch completes by patching fetch success if possible:
  const origOnLoad = window.onload;
  window.onload = function () {
    try { if (window.excelCoalMap) populateDateSelectFromExcel(); }
    catch(e) { /* ignore */ }
    if (typeof origOnLoad === 'function') origOnLoad();
  };

  // Also try to integrate with your existing fetch('/get_coal_types') flow:
  // If your code sets window.coalData after an AJAX call (it does in date.html),
  // call populateDateSelectFromExcel() afterwards to let excel-based rows match IDs.
  // (No change needed here — we merely rely on the global values.)
})();


    
   


/* ---- next inline <script> block ---- */


document.getElementById('templateBtn').addEventListener('click', function () {
  // ---- DEFINE TEMPLATE HEADERS ----
  const headers = [
    'Coal Name',
    'Date Used',
    'Percent',
    'SiO2',
    'Al2O3',
    'Fe2O3',
    'CaO',
    'MgO',
    'Na2O',
    'K2O',
    'TiO2',
    'SO3',
    'P2O5',
    'Mn3O4'
  ];

  // ---- CREATE EMPTY ROWS (user-friendly) ----
  const rows = [
    headers,
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ];

  // ---- CREATE WORKBOOK ----
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // ---- OPTIONAL: column width for nicer look ----
  ws['!cols'] = headers.map(h => ({
    wch: Math.max(12, h.length + 2)
  }));

  XLSX.utils.book_append_sheet(wb, ws, 'Coal_Data');

  // ---- DOWNLOAD ----
  XLSX.writeFile(wb, 'coal_data_template.xlsx');
});


/* ---- next inline <script> block ---- */


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

document.getElementById('dateSelect').disabled = true;

document.getElementById('excelFileInput').addEventListener('change', () => {
  document.getElementById('dateSelect').disabled = false;
});

