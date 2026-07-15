
  let excelData = [];
//GCV (kcal/kg)
//Heat rate (kcal/kWh)
  // load excel and populate dropdowns
  document.getElementById("excelFile").addEventListener("change", handleFile, false);
  function handleFile(e){
    const file = e.target.files[0];
    if(!file) return;
    document.getElementById("loader").style.display = "block";
    const reader = new FileReader();
    reader.onload = function(event){
      setTimeout(() => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          excelData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

          // get unique coal names
          const coalValues = [...new Set(excelData.map(r => r["Coal"]).filter(v => v))];

          [1,2,3].forEach(i=>{
            const drop = document.getElementById("coalDrop"+i);
            drop.innerHTML = "";
            const empty = document.createElement("option");
            empty.value = ""; empty.textContent = "-- Select Coal --";
            drop.appendChild(empty);
            coalValues.forEach(c=>{
              const opt = document.createElement("option");
              opt.value = c; opt.textContent = c;
              drop.appendChild(opt);
            });
          });

          attachAutoUpdate();
        } catch(err){
          console.error(err);
          alert("Error reading file.");
        } finally {
          document.getElementById("loader").style.display = "none";
        }
      }, 250);
    };
    reader.readAsArrayBuffer(file);
  }

  // helper: lookup numeric cell for a coal
  function findRowForCoal(coalName){
    if(!coalName) return null;
    return excelData.find(r => {
      const c = r["Coal"];
      return (c !== undefined && c !== null && String(c) === String(coalName));
    }) || null;
  }
  function getValue(coalName, key){
    const row = findRowForCoal(coalName);
    if(!row) return 0;
    const v = row[key];
    if(v === null || v === undefined || v === "") return 0;
    return Number(v) || 0;
  }

  // AFT formula exactly as provided (returns a number)
  function calcAFT(ox){
    const total = Object.values(ox).reduce((a,b)=>a+b,0);
    if(total === 0) return 0;
    const sum = (ox["SiO₂"]||0) + (ox["Al₂O₃"]||0);
    let aft = 0;
    if(sum < 55){
      aft = 1245 + (1.1*(ox["SiO₂"]||0)) + (0.95*(ox["Al₂O₃"]||0)) - (2.5*(ox["Fe₂O₃"]||0)) - (2.98*(ox["CaO"]||0)) - (4.5*(ox["MgO"]||0)) - (7.89*((ox["Na₂O"]||0) + (ox["K₂O"]||0))) - (1.7*(ox["SO₃"]||0)) - (0.63*(ox["TiO₂"]||0));
    } else if(sum < 75){
      aft = 1323 + (1.45*(ox["SiO₂"]||0)) + (0.683*(ox["Al₂O₃"]||0)) - (2.39*(ox["Fe₂O₃"]||0)) - (3.1*(ox["CaO"]||0)) - (4.5*(ox["MgO"]||0)) - (7.49*((ox["Na₂O"]||0) + (ox["K₂O"]||0))) - (2.1*(ox["SO₃"]||0)) - (0.63*(ox["TiO₂"]||0));
    } else {
      aft = 1395 + (1.2*(ox["SiO₂"]||0)) + (0.9*(ox["Al₂O₃"]||0)) - (2.5*(ox["Fe₂O₃"]||0)) - (3.1*(ox["CaO"]||0)) - (4.5*(ox["MgO"]||0)) - (7.2*((ox["Na₂O"]||0) + (ox["K₂O"]||0))) - (1.7*(ox["SO₃"]||0)) - (0.63*(ox["TiO₂"]||0));
    }
    return Number(aft);
  }
//gcv - Kcal
//cost per MT
//AFT degree celcius
//coal flow TPH
//heat rate Kcal per KWH
  // update GCV & Cost boxes (the 3 boxes in GCV & Cost columns)
  function updateGCVCostBoxes(){
    const c1 = document.getElementById("coalDrop1").value;
    const c2 = document.getElementById("coalDrop2").value;
    const c3 = document.getElementById("coalDrop3").value;

    const r1 = findRowForCoal(c1);
    const r2 = findRowForCoal(c2);
    const r3 = findRowForCoal(c3);

    document.getElementById("gcvBox1").innerText = r1 ? ( (r1["GCV"]!==undefined && r1["GCV"]!==null && r1["GCV"]!=="") ? Number(r1["GCV"]).toFixed(2) : "--") : "--";
    document.getElementById("gcvBox2").innerText = r2 ? ( (r2["GCV"]!==undefined && r2["GCV"]!==null && r2["GCV"]!=="") ? Number(r2["GCV"]).toFixed(2) : "--") : "--";
    document.getElementById("gcvBox3").innerText = r3 ? ( (r3["GCV"]!==undefined && r3["GCV"]!==null && r3["GCV"]!=="") ? Number(r3["GCV"]).toFixed(2) : "--") : "--";

    function extractCost(row){
      if(!row) return "";
      if(row["Cost"] !== undefined) return String(row["Cost"]);
      if(row["COST"] !== undefined) return String(row["COST"]);
      if(row["Price"] !== undefined) return String(row["Price"]);
      return "";
    }
    document.getElementById("costBox1").value = extractCost(r1);
    document.getElementById("costBox2").value = extractCost(r2);
    document.getElementById("costBox3").value = extractCost(r3);
  }

  // main calculations: per-mill blended GCV, per-mill AFT, totals & averages
  function calculateBlended(){
    const coal1 = document.getElementById("coalDrop1").value;
    const coal2 = document.getElementById("coalDrop2").value;
    const coal3 = document.getElementById("coalDrop3").value;

    const oxKeys = ["SiO₂","Al₂O₃","Fe₂O₃","CaO","MgO","Na₂O","K₂O","SO₃","TiO₂"];

    let totalFlow = 0;
    let weightedGCV = 0;
    let weightedAFT = 0;

    for(let m = 0; m < 6; m++){
      const p1 = parseFloat( document.querySelector(`.percentage-input[data-row="1"][data-mill="${m}"]`)?.value ) || 0;
      const p2 = parseFloat( document.querySelector(`.percentage-input[data-row="2"][data-mill="${m}"]`)?.value ) || 0;
      const p3 = parseFloat( document.querySelector(`.percentage-input[data-row="3"][data-mill="${m}"]`)?.value ) || 0;

      const gcv1 = getValue(coal1, "GCV");
      const gcv2 = getValue(coal2, "GCV");
      const gcv3 = getValue(coal3, "GCV");

      const blendedGCV = (gcv1 * (p1/100)) + (gcv2 * (p2/100)) + (gcv3 * (p3/100));

      let ox = {};
      oxKeys.forEach(k => {
        ox[k] = (getValue(coal1, k) * (p1/100)) + (getValue(coal2, k) * (p2/100)) + (getValue(coal3, k) * (p3/100));
      });

      const aftVal = calcAFT(ox);

      const aftCell = document.querySelector(`.aft[data-mill="${m}"]`);
      if(aftCell) aftCell.innerText = isFinite(aftVal) ? Number(aftVal).toFixed(2) : "--";

      const flow = parseFloat( document.querySelector(`.flow-input[data-mill="${m}"]`)?.value ) || 0;

      if(flow > 0){
        totalFlow += flow;
        weightedGCV += (flow * blendedGCV);
        weightedAFT += (flow * aftVal);
      }
    }

    const avgGCV = totalFlow > 0 ? (weightedGCV / totalFlow) : 0;
    const avgAFT = totalFlow > 0 ? (weightedAFT / totalFlow) : 0;

    document.getElementById("totalFlow").innerText = Number(totalFlow).toFixed(2);
    document.getElementById("avgGCV").innerText = totalFlow>0 ? Number(avgGCV).toFixed(2) : 0;
    document.getElementById("avgAFT").innerText = totalFlow>0 ? Number(avgAFT).toFixed(2) : "--";

    const generation = parseFloat(document.getElementById("generation").value) || 0;
    if(generation > 0 && totalFlow > 0){
      const heatRate = (totalFlow * avgGCV) / generation;
      document.getElementById("heatRate").innerText = Number(heatRate).toFixed(2);
    } else {
      document.getElementById("heatRate").innerText = "--";
    }

function getCoalQty(rowIndex) {
  let total = 0;
  for (let m = 0; m < 6; m++) {
    const perc = parseFloat(document.querySelector(`.percentage-input[data-row="${rowIndex}"][data-mill="${m}"]`)?.value) || 0;
    total += perc; 
  }
  return total;
}


const cost1 = parseFloat(document.getElementById("costBox1").value) || 0;
const cost2 = parseFloat(document.getElementById("costBox2").value) || 0;
const cost3 = parseFloat(document.getElementById("costBox3").value) || 0;

const qty1 = getCoalQty(1);
const qty2 = getCoalQty(2);
const qty3 = getCoalQty(3);

const totalCost = (qty1 * cost1) + (qty2 * cost2) + (qty3 * cost3);
const totalQty  = qty1 + qty2 + qty3;
const costRate  = totalQty > 0 ? (totalCost / totalQty) : 0;

document.getElementById("COSTRATE").innerText = costRate.toFixed(2);


if(generation > 0 && totalFlow > 0){
  const heatRate = (totalFlow * avgGCV) / generation;
  document.getElementById("heatRate").innerText = Number(heatRate).toFixed(2);
} else {
  document.getElementById("heatRate").innerText = "--";
}

  }

  // new: validate sums and update header colors
  function validateMillPercentages() {
  for (let m = 0; m < 6; m++) {
    let hasPercent = false;

    // check if any percent input > 0 for this mill
    for (let r = 1; r <= 3; r++) {
      const val = parseFloat(
        document.querySelector(`.percentage-input[data-row="${r}"][data-mill="${m}"]`)?.value
      ) || 0;
      if (val > 0) {
        hasPercent = true;
        break;
      }
    }

    // check the coal flow for this mill
    const flow = parseFloat(
      document.querySelector(`.flow-input[data-mill="${m}"]`)?.value
    ) || 0;

    // find the mill header (MILL-A ... MILL-F)
    const letter = String.fromCharCode(65 + m); // A..F
    const header = Array.from(document.querySelectorAll(".mills-grid > .mill"))
      .find(el => el.textContent.includes(`MILL-${letter}`));

    if (!header) continue;

    // reset
    header.classList.remove("red", "green");

    if (hasPercent && flow > 0) {
      header.classList.add("red");
    } else {
      header.classList.add("green");
    }
  }
}

  function attachAutoUpdate(){
    // add focus + input handlers for percentage inputs to track previous value and validate
    document.querySelectorAll(".percentage-input").forEach(inp => {
      // store initial prev value
      inp.dataset.prev = inp.value || "";

      inp.addEventListener("focus", function(e){
        // store previous value before editing
        this.dataset.prev = this.value;
      });

      inp.addEventListener("input", function(e){
        // ensure only numeric and optionally decimal and limit accidental characters
        // allow empty (treat as 0)
        const raw = this.value.trim();
        // allow partial inputs like ".", so only parseFloat when needed
        let num = parseFloat(raw);
        if (raw === "" || isNaN(num)) num = 0;

        // compute new sum for this mill
        const millIndex = Number(this.dataset.mill);
        let sum = 0;
        for (let r = 1; r <=3; r++){
          const v = parseFloat(document.querySelector(`.percentage-input[data-row="${r}"][data-mill="${millIndex}"]`)?.value) || 0;
          sum += v;
        }

        if (sum > 100) {
          // revert to previous value and notify
          const prev = this.dataset.prev ?? "";
          this.value = prev;
          alert(`Total for Mill ${String.fromCharCode(65+millIndex)} cannot exceed 100%.`);
          // update blended calculations and header colors after revert
          calculateBlended();
          validateMillPercentages();
          return;
        }

        // valid, save as prev
        this.dataset.prev = this.value;
        // update calculations & visuals
        calculateBlended();
        validateMillPercentages();
      });
    });

    // existing inputs that affect calculation
    document.querySelectorAll(".flow-input, #generation, .cost-input").forEach(inp => {
      inp.addEventListener("input", () => { calculateBlended(); validateMillPercentages(); });
    });

    ["coalDrop1","coalDrop2","coalDrop3"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener("change", () => { updateGCVCostBoxes(); calculateBlended(); validateMillPercentages(); });
    });

    // initial update
    updateGCVCostBoxes();
    calculateBlended();
    validateMillPercentages();
  }

  // allow the upload button to work like a label (no extra handler needed)
  document.querySelector(".upload-btn").addEventListener("click", ()=>{ /* no-op */ });

  attachAutoUpdate();

 document.getElementById("downloadPDF").addEventListener("click", function () {
  const { jsPDF } = window.jspdf;
  const element = document.body; // ✅ capture whole page including navbar

  html2canvas(element, {
    scale: 2,
    useCORS: true,
    onclone: (clonedDoc) => {
      // Handle input & textarea values
      const inputs = clonedDoc.querySelectorAll("input, textarea");
      inputs.forEach(input => {
        const text = clonedDoc.createElement("span");
        text.textContent = input.value;

        text.style.position = "absolute";
        text.style.left = input.offsetLeft + "px";
        text.style.top = input.offsetTop + "px";
        text.style.width = input.offsetWidth + "px";
        text.style.height = input.offsetHeight + "px";
        text.style.lineHeight = input.offsetHeight + "px";
        text.style.textAlign = "center";
        text.style.font = window.getComputedStyle(input).font;
        text.style.color = window.getComputedStyle(input).color;

        clonedDoc.body.appendChild(text);
        input.style.visibility = "hidden";
      });

      // Handle select dropdowns (coal names)
      const selects = clonedDoc.querySelectorAll("select");
      selects.forEach(select => {
        const selectedText = select.options[select.selectedIndex]?.text || "";
        const text = clonedDoc.createElement("span");
        text.textContent = selectedText;

        text.style.position = "absolute";
        text.style.left = select.offsetLeft + "px";
        text.style.top = select.offsetTop + "px";
        text.style.width = select.offsetWidth + "px";
        text.style.height = select.offsetHeight + "px";
        text.style.lineHeight = select.offsetHeight + "px";
        text.style.textAlign = "center";
        text.style.font = window.getComputedStyle(select).font;
        text.style.color = window.getComputedStyle(select).color;

        clonedDoc.body.appendChild(text);
        select.style.visibility = "hidden";
      });
    }
  }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("Coal_Blending_Ratio.pdf");
  });
});





/* ---- next inline <script> block ---- */


if(localStorage.getItem('isLoggedIn') !== 'true') {
    alert('You must login first!');
    window.location.href = '/login.html'; 
} else {
    document.body.style.display = 'block';
}
    function logoutUser() {
  localStorage.setItem('isLoggedIn', 'false'); 
  window.location.href = 'login.html'; 
}

