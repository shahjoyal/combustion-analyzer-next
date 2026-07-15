
    // Simple auth check (kept)
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        alert('You must login first!');
        window.location.href = '/login.html';
    }

    // ---------- helpers ----------
    function formatCellValue(value) {
        if (value === null || value === undefined) return "";
        if (typeof value === "number" && isFinite(value)) return value.toFixed(2);
        if (typeof value === "string") {
            const t = value.trim();
            if (t === "") return "";
            const n = Number(t.replace(/,/g,''));
            if (!isNaN(n) && isFinite(n)) return n.toFixed(2);
            return value;
        }
        try { return JSON.stringify(value); } catch(e) { return String(value); }
    }

    // ---------- fetch and render ----------
    function fetchData() {
        fetch("/fetch-data")
            .then(r => r.json())
            .then(data => displayTable(data))
            .catch(err => console.error("fetch error", err));
    }

    function displayTable(data) {
        const headerRow = document.getElementById('table-header');
        const tbody = document.getElementById('table-body');
        headerRow.innerHTML = ''; tbody.innerHTML = '';

        if (!data || data.length === 0) {
            headerRow.innerHTML = '<th>No data</th>';
            return;
        }

        // Compute header keys: ensure Coal ID first then other keys (excluding _id)
        // We'll inspect all rows to build a stable header order
        const keySet = new Set();
        data.forEach(d => Object.keys(d).forEach(k => keySet.add(k)));
        // We prefer the following order: coalId (if present) or _id as "Coal ID", then coal/name, other known fields, then rest
        const preferred = ['coalId','_id','coal','Coal','name','SiO2','Al2O3','Fe2O3','CaO','MgO','Na2O','K2O','TiO2','SO3','P2O5','Mn3O4','Sulphur','GCV','cost','Transport ID','shipmentDate'];
        const keys = [];

        // Add Coal ID column as "Coal ID"
        keys.push('Coal ID');

        // Build the rest: include known preferred fields if present
        preferred.forEach(p => {
            if (keySet.has(p) && !['coalId','_id'].includes(p) && p !== 'Coal ID') {
                if (!keys.includes(p)) keys.push(p);
                keySet.delete(p);
            }
            if (keySet.has(p) && ['coalId','_id'].includes(p)) {
                // these were consumed by "Coal ID" column already
                keySet.delete(p);
            }
        });

        // remaining keys (exclude internal __v)
        Array.from(keySet).filter(k => k !== '__v').forEach(k => keys.push(k));

        // final column is Select
        keys.push('Select');

        // build header cells
        keys.forEach(k => {
            const th = document.createElement('th');
            th.textContent = k;
            headerRow.appendChild(th);
        });

        // Helper: get coalId value from row
        function getCoalIdFromRow(r) {
            if (r.coalId) return String(r.coalId);
            if (r['Coal ID']) return String(r['Coal ID']);
            if (r._id) return String(r._id);
            return '';
        }

        // render rows
        data.forEach(row => {
            const tr = document.createElement('tr');

            // Coal ID first
            const coalIdVal = getCoalIdFromRow(row);
            const tdId = document.createElement('td');
            tdId.textContent = coalIdVal;
            tr.appendChild(tdId);

            // other keys: iterate over header keys starting from second index up to last-1 (skip Select)
            // reconstruct the same order used for headers (except Coal ID and Select)
            const headerKeys = Array.from(headerRow.children).map(th => th.textContent);
            for (let i = 1; i < headerKeys.length - 1; i++) {
                const key = headerKeys[i];
                // For keys like 'Transport ID' or 'shipmentDate' we just use the property if exists
                let raw = row[key] !== undefined ? row[key] : (row[key.replace(/\s+/g,'')] !== undefined ? row[key.replace(/\s+/g,'')] : "");
                // If header equals some canonical internal names, try alternate names
                if ((key === 'coal' || key === 'Coal' || key === 'name') && !raw) raw = row.coal || row.name || row['Coal'];
                if ((key === 'GCV' || key === 'gcv') && raw === undefined) raw = row.GCV || row.gcv;
                const td = document.createElement('td');
                td.textContent = formatCellValue(raw);
                tr.appendChild(td);
            }

            // checkbox column
            const cbTd = document.createElement('td');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.setAttribute('data-id', row._id ? String(row._id) : getCoalIdFromRow(row));
            // store original row (stringified). Use safe fallback.
            try { cb.dataset.row = JSON.stringify(row); } catch(e) { cb.dataset.row = "{}"; }
            cb.addEventListener('change', updateSelectionButtons);
            cbTd.appendChild(cb);
            tr.appendChild(cbTd);

            tbody.appendChild(tr);
        });

        // after rendering reset buttons state
        updateSelectionButtons();
    }

    // ---------- file upload ----------
    // trigger hidden file input when upload button is clicked
    document.getElementById('btn-upload').addEventListener('click', function() {
        const fi = document.getElementById('fileInput');
        if (fi) fi.click();
    });

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);

        fetch('/upload-excel', { method:'POST', body: fd })
            .then(r => r.json())
            .then(data => {
                alert(data.message || 'Upload finished');
                fetchData();
            })
            .catch(err => {
                console.error('upload err', err);
                alert('Upload failed');
            })
            .finally(() => { e.target.value = ''; });
    });

    // ---------- download template ----------
    document.getElementById('btn-download-template').addEventListener('click', function(){
        // includeData = false
        window.location.href = "/download-template";
    });

    // ---------- selection / button enable logic ----------
    function updateSelectionButtons() {
        const checked = document.querySelectorAll('input[type="checkbox"]:checked');
        const deleteBtn = document.getElementById('delete-selected-btn');
        const downloadBtn = document.getElementById('download-selected-btn');

        const any = checked.length > 0;
        deleteBtn.disabled = !any;
        downloadBtn.disabled = !any;
    }

    document.getElementById('delete-selected-btn').addEventListener('click', function(){
        const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
        if (checked.length === 0) { alert('Select rows first'); return; }
        if (!confirm('Are you sure you want to delete selected rows?')) return;
        const ids = checked.map(cb => cb.getAttribute('data-id')).filter(Boolean);

        fetch('/delete-data', {
            method:'DELETE',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ ids })
        })
        .then(r => r.json())
        .then(resp => {
            alert(resp.message || 'Deleted');
            fetchData();
        })
        .catch(err => { console.error(err); alert('Delete failed'); });
    });

    // download dropdown toggle
    function setupDownloadDropdown() {
        const downloadBtn = document.getElementById('download-selected-btn');
        const menu = document.getElementById('download-menu');
        if (!downloadBtn || !menu) return;
        downloadBtn.addEventListener('click', function(e){
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            menu.setAttribute('aria-hidden', menu.style.display === 'block' ? 'false' : 'true');
        });
        document.addEventListener('click', function(e){
            if (!menu.contains(e.target) && e.target !== downloadBtn) {
                menu.style.display = 'none';
            }
        });
    }

    // ---------- download selected (excel / pdf) ----------
    async function downloadSelected(format) {
        const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
        if (checked.length === 0) { alert('Select rows first'); return; }

        const rows = checked.map(cb => {
            try { return JSON.parse(cb.dataset.row || "{}"); } catch(e) { return {}; }
        });

        const keys = Object.keys(rows[0] || {}).filter(k => k !== "_id");

        if (format === 'excel') {
            const jsonData = rows.map(r => {
                const obj = {};
                Object.keys(r).forEach(k => {
                    if (k === '_id') return;
                    obj[k] = formatCellValue(r[k]);
                });
                return obj;
            });
            const ws = XLSX.utils.json_to_sheet(jsonData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Selected");
            XLSX.writeFile(wb, "selected_rows.xlsx");
        } else if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF("l", "mm", "a4");
            // reuse your earlier robust pdf logic or a simplified table export here
            // Simplified approach: create small PDF listing rows as lines
            doc.setFontSize(10);
            let y = 10;
            rows.forEach((r, idx) => {
                const line = Object.entries(r).filter(([k])=> k !== '_id').map(([k,v]) => `${k}: ${formatCellValue(v)}`).join('  |  ');
                doc.text(`${idx+1}. ${line}`, 10, y);
                y += 6;
                if (y > doc.internal.pageSize.getHeight() - 10) { doc.addPage(); y = 10; }
            });
            doc.save('selected_rows.pdf');
        }
        // hide menu
        const menu = document.getElementById('download-menu'); if (menu) menu.style.display = 'none';
    }

    // ---------- download whole page as PDF ----------
    document.getElementById('downloadWholePDFBtn').addEventListener('click', function(){
        const element = document.body;
        window.scrollTo(0,0);

        // Use window.jspdf (UMD) export reliably, and robust multi-page handling
        html2canvas(element, { scale: 2, useCORS: true, allowTaint: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf || window; // use UMD export
            const pdf = new jsPDF('p','mm','a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

            let heightLeft = imgHeight - pageHeight;
            while (heightLeft > 0) {
                position = -heightLeft;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('Coal_Blending_Ratio.pdf');
        }).catch(err => {
            console.error('PDF generation failed', err);
            alert('Failed to create PDF of page. Try resizing or use browser print to save as PDF.');
        });
    });

    // ---------- init ----------
    document.addEventListener('DOMContentLoaded', () => {
        setupDownloadDropdown();
        fetchData();
    });

    function logoutUser() { localStorage.setItem('isLoggedIn','false'); window.location.href='/login.html'; }


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
      window.location.href = '/login.html';
    });
  }
})();
