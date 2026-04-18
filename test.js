
        // --- STATE MANAGEMENT ---
        let availableDimensions = ['45x95', '45x120', '45x145'];
        let requiredPieces = [];
        let stockLengths = [];
        let nextPieceId = 0;
        let nextStockId = 0;
        const STORAGE_KEY = 'traeOptAppProjects';

        // --- HISTORY STATE ---
        let history = [];
        let historyIndex = -1;

        function saveState() {
            const state = {
                availableDimensions: JSON.parse(JSON.stringify(availableDimensions)),
                requiredPieces: JSON.parse(JSON.stringify(requiredPieces)),
                stockLengths: JSON.parse(JSON.stringify(stockLengths)),
                nextPieceId,
                nextStockId,
                safetyMargin: safetyMarginInput ? safetyMarginInput.value : "100",
                projectName: projectNameInput ? projectNameInput.value : ""
            };

            if (historyIndex < history.length - 1) {
                history = history.slice(0, historyIndex + 1);
            }

            if (history.length > 0) {
                const lastState = history[history.length - 1];
                if (JSON.stringify(lastState) === JSON.stringify(state)) {
                    return;
                }
            }

            history.push(state);
            if (history.length > 50) {
                history.shift();
            } else {
                historyIndex++;
            }
            updateUndoRedoButtons();
        }

        function loadState(state) {
            if (!state) return;
            availableDimensions = JSON.parse(JSON.stringify(state.availableDimensions));
            requiredPieces = JSON.parse(JSON.stringify(state.requiredPieces));
            stockLengths = JSON.parse(JSON.stringify(state.stockLengths));
            nextPieceId = state.nextPieceId;
            nextStockId = state.nextStockId;
            if (safetyMarginInput) safetyMarginInput.value = state.safetyMargin;
            if (projectNameInput) projectNameInput.value = state.projectName;

            renderAllLists();
            resultsContainer.innerHTML = '<div id="print-header" class="hidden"></div>';
            sustainabilityReportContainer.classList.add('hidden');
            showPrintButtons(false);
        }

        function handleUndo() {
            if (historyIndex > 0) {
                historyIndex--;
                loadState(history[historyIndex]);
                updateUndoRedoButtons();
            }
        }

        function handleRedo() {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                loadState(history[historyIndex]);
                updateUndoRedoButtons();
            }
        }

        function updateUndoRedoButtons() {
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            if (undoBtn) undoBtn.disabled = historyIndex <= 0;
            if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
        }

        // Genanvendeligt blyant-ikon SVG
        const svgPencil = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 text-gray-400 inline-block ml-1 group-hover:text-gray-700 cursor-pointer pointer-events-none flex-shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>`;

        // --- DOM ELEMENT REFERENCES ---
        const projectNameInput = document.getElementById('project-name');
        const saveProjectBtn = document.getElementById('save-project-btn');
        const savedProjectsSelect = document.getElementById('saved-projects-select');
        const loadProjectBtn = document.getElementById('load-project-btn');
        const deleteProjectBtn = document.getElementById('delete-project-btn');
        const saveFileBtn = document.getElementById('save-file-btn');
        const loadFileBtn = document.getElementById('load-file-btn');
        const fileInput = document.getElementById('file-input');

        const addDimensionForm = document.getElementById('add-dimension-form');
        const dimensionsListContainer = document.getElementById('dimensions-list');
        const pieceDimensionSelect = document.getElementById('piece-dimension-select');
        const stockDimensionSelect = document.getElementById('stock-dimension-select');
        const stockLengthSelect = document.getElementById('stock-length-select');

        const addPieceForm = document.getElementById('add-piece-form');
        const piecesListContainer = document.getElementById('pieces-list');
        const addStockForm = document.getElementById('add-stock-form');
        const stockListContainer = document.getElementById('stock-list');

        const calculateBtnDesktop = document.getElementById('calculate-btn-desktop');
        const printBtnDesktop = document.getElementById('print-btn-desktop');
        const resultsContainer = document.getElementById('results-container');
        const sustainabilityReportContainer = document.getElementById('sustainability-report');
        const safetyMarginInput = document.getElementById('safety-margin');

        // --- EVENT LISTENERS ---
        saveProjectBtn.addEventListener('click', handleSaveProject);
        loadProjectBtn.addEventListener('click', handleLoadProject);
        deleteProjectBtn.addEventListener('click', handleDeleteProject);
        saveFileBtn.addEventListener('click', handleSaveToFile);
        loadFileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleLoadFromFile);

        addDimensionForm.addEventListener('submit', handleAddDimension);
        addPieceForm.addEventListener('submit', handleAddPiece);
        addStockForm.addEventListener('submit', handleAddStock);
        calculateBtnDesktop.addEventListener('click', handleCalculate);
        printBtnDesktop.addEventListener('click', handlePrint);
        document.getElementById('undo-btn').addEventListener('click', handleUndo);
        document.getElementById('redo-btn').addEventListener('click', handleRedo);
        safetyMarginInput.addEventListener('change', saveState);
        projectNameInput.addEventListener('change', saveState);

        // Opdater versionsdato i toppen automatisk
        const modDate = new Date(document.lastModified);
        document.getElementById('version-info').innerText = "Sidst opdateret: " + document.lastModified;



        // --- COLOR PALETTE (tag-baseret: samme emne-navn = samme farve) ---
        const tagColorPalette = ['#a5b4fc', '#f9a8d4', '#86efac', '#fcd34d', '#7dd3fc', '#c4b5fd', '#fca5a5', '#6ee7b7', '#fdba74', '#67e8f9'];
        const tagColorMap = {};
        let nextTagColorIdx = 0;
        function getTagColor(tag) {
            const key = (tag || 'Emne').toLowerCase();
            if (!tagColorMap[key]) {
                tagColorMap[key] = tagColorPalette[nextTagColorIdx % tagColorPalette.length];
                nextTagColorIdx++;
            }
            return tagColorMap[key];
        }

        // --- GLOBAL FUNKTIONER TIL REDIGERING ---
        window.updatePieceTag = function (id, newTag) {
            const p = requiredPieces.find(p => p.id === id);
            if (p) { p.tag = newTag; handleCalculate(); saveState(); }
        };

        window.updatePieceMargin = function (id, newMargin) {
            const margin = parseInt(newMargin);
            if (isNaN(margin) || margin < 0) return;
            const p = requiredPieces.find(p => p.id === id);
            if (p) { p.customMargin = margin; handleCalculate(); saveState(); }
        };

        window.updateGroupAmount = function (ids, newAmount) {
            const target = parseInt(newAmount);
            if (isNaN(target) || target < 1) { renderPiecesList(); return; }
            const current = ids.length;
            if (target === current) return;
            if (target > current) {
                const template = requiredPieces.find(p => p.id === ids[0]);
                if (template) {
                    for (let i = 0; i < (target - current); i++) {
                        requiredPieces.push({ ...template, id: nextPieceId++ });
                    }
                }
            } else {
                const toRemove = ids.slice(-(current - target));
                requiredPieces = requiredPieces.filter(p => !toRemove.includes(p.id));
            }
            renderPiecesList();
            saveState();
        };

        window.updateGroupLength = function (ids, newLen) {
            const val = parseInt(newLen);
            if (isNaN(val) || val < 1) { renderPiecesList(); return; }
            requiredPieces.forEach(p => { if (ids.includes(p.id)) p.length = val; });
            renderPiecesList();
            saveState();
        };

        window.updateGroupTag = function (ids, newTag) {
            requiredPieces.forEach(p => { if (ids.includes(p.id)) p.tag = newTag.trim(); });
            renderPiecesList();
            saveState();
        };

        window.autoFillStock = function() {
            if (requiredPieces.length === 0) {
                alert("Tilføj venligst nogle ønskede emner først.");
                return;
            }
            const globalMargin = parseInt(safetyMarginInput.value) || 0;
            
            // Hvad mangler vi?
            const result = runOptimization(globalMargin, stockLengths, requiredPieces);
            if (result.unfulfilled.length === 0) {
                alert("Du har allerede nok træ på lageret til at skære alle emner!");
                return;
            }
            
            // Brug den avancerede analyse til at finde optimale bestillingslængder KUN for de manglende emner
            const analysis = runAdvancedAnalysis(globalMargin, result.unfulfilled);
            
            let hasPurchases = false;
            // Nulstil IKKE det nuværende lager, vi tilføjer blot bestillinger
            for (const dim in analysis.purchaseSuggestion) {
                const suggestion = analysis.purchaseSuggestion[dim];
                if (suggestion.count > 0) {
                    hasPurchases = true;
                    stockLengths.push({
                        id: nextStockId++,
                        dimension: dim,
                        length: suggestion.length,
                        amount: suggestion.count,
                        type: 'bestilling'
                    });
                }
            }
            
            if (hasPurchases) {
                renderStockList();
                saveState();
                handleCalculate();
            } else {
                alert("Kunne ikke finde nogle optimale bestillingslængder for de manglende emner.");
            }
        };

        window.applyOptimalPurchase = function(encodedSuggestions) {
            try {
                const suggestions = JSON.parse(decodeURIComponent(encodedSuggestions));
                stockLengths = []; // Nulstil nuværende lager
                for (const dim in suggestions) {
                    const suggestion = suggestions[dim];
                    if (suggestion.count > 0) {
                        stockLengths.push({
                            id: nextStockId++,
                            dimension: dim,
                            length: suggestion.length,
                            amount: suggestion.count,
                            type: 'bestilling'
                        });
                    }
                }
                renderStockList();
                handleCalculate();
                saveState();
            } catch(e) {
                console.error("Fejl ved anvendelse af optimalt indkøb:", e);
            }
        };

        // --- CORE LOGIC ---
        function handleAddDimension(e) {
            e.preventDefault();
            const input = document.getElementById('dimension-name');
            const name = input.value.trim();
            if (name && !availableDimensions.includes(name)) {
                availableDimensions.push(name);
                availableDimensions.sort();
                renderAllLists();
                saveState();
            }
            input.value = '';
        }

        function removeDimension(name) {
            availableDimensions = availableDimensions.filter(d => d !== name);
            requiredPieces = requiredPieces.filter(p => p.dimension !== name);
            stockLengths = stockLengths.filter(s => s.dimension !== name);
            renderAllLists();
            saveState();
        }

        function handleAddPiece(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            const lastDim = fd.get('dimension');
            const lastTag = fd.get('tag').trim();
            const piece = {
                id: nextPieceId++,
                dimension: lastDim,
                tag: lastTag || 'Emne',
                length: parseInt(fd.get('length')),
                amount: parseInt(fd.get('amount')),
                customMargin: null
            };
            if (!piece.dimension || isNaN(piece.length)) return;
            for (let i = 0; i < piece.amount; i++) {
                requiredPieces.push({ ...piece, id: nextPieceId++, amount: 1 });
            }
            renderPiecesList();
            e.target.reset();
            // Husk sidst brugte dimension og tag
            pieceDimensionSelect.value = lastDim;
            document.getElementById('piece-tag').value = lastTag;
            document.getElementById('piece-length').focus();
            saveState();
        }

        function handleAddStock(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            const lastDim = fd.get('dimension');
            const lastLen = fd.get('length');
            const stock = { id: nextStockId++, dimension: lastDim, length: parseInt(lastLen), amount: parseInt(fd.get('amount')), type: 'lager' };
            if (!stock.dimension || isNaN(stock.length)) return;
            stockLengths.push(stock);
            renderStockList();
            e.target.reset();
            // Husk sidst brugte dimension og længde
            stockDimensionSelect.value = lastDim;
            stockLengthSelect.value = lastLen;
            saveState();
        }

        function removePiece(id) { requiredPieces = requiredPieces.filter(p => p.id !== id); renderPiecesList(); saveState(); }
        function confirmRemoveGroup(ids) {
            if (ids.length >= 3) {
                if (!confirm(`Fjern ${ids.length} emner?`)) return;
            }
            ids.forEach(id => { requiredPieces = requiredPieces.filter(p => p.id !== id); });
            renderPiecesList();
            saveState();
        }
        function removeStock(id) { stockLengths = stockLengths.filter(s => s.id !== id); renderStockList(); saveState(); }
        function updateStockAmount(id, newAmount) {
            const val = parseInt(newAmount);
            if (isNaN(val) || val < 1) { renderStockList(); return; }
            const s = stockLengths.find(s => s.id === id);
            if (s) { s.amount = val; renderStockList(); saveState(); }
        }

        function handleCalculate() {
            resultsContainer.innerHTML = '<div id="print-header" class="hidden"></div>';
            if (requiredPieces.length === 0) { renderError('Tilføj emner først.'); return; }
            const globalMargin = parseInt(safetyMarginInput.value) || 0;
            try {
                const result = runOptimization(globalMargin, stockLengths, requiredPieces);
                if (result.unfulfilled.length > 0) {
                    renderError(`
                        <div class="flex flex-col items-center justify-center text-center py-6 px-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 class="font-bold text-red-800 text-lg mb-2">Ikke nok materiale på lager</h3>
                            <p class="text-red-700 mb-6 max-w-md">Du har ikke nok træ på din lagerliste til at dække alle de ønskede emner. Vil du have appen til automatisk at udregne, hvad du mangler at købe?</p>
                            <button onclick="window.autoFillStock()" class="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all transform hover:scale-105">
                                + Udregn manglende indkøb
                            </button>
                        </div>
                    `);
                    return;
                }
                renderResults(result);
                const analysis = runAdvancedAnalysis(globalMargin, requiredPieces);
                renderSustainabilityReport(analysis, result.plan);
                showPrintButtons(true);
            } catch (error) { renderError(error.message); }
        }

        // --- OPTIMIZATION ENGINE ---
        function runOptimization(globalMargin, currentStock, piecesToProcess) {
            const piecesByDim = {};
            piecesToProcess.forEach(p => {
                if (!piecesByDim[p.dimension]) piecesByDim[p.dimension] = [];
                const margin = p.customMargin !== null ? p.customMargin : globalMargin;
                piecesByDim[p.dimension].push({ id: p.id, exactLength: p.length, cutLength: p.length + margin, margin: margin, tag: p.tag, dimension: p.dimension, customMargin: p.customMargin });
            });

            const stockByDim = {};
            currentStock.forEach(s => {
                if (!stockByDim[s.dimension]) stockByDim[s.dimension] = [];
                for (let i = 0; i < s.amount; i++) { stockByDim[s.dimension].push({ length: s.length, type: s.type || 'lager' }); }
            });

            const finalPlan = {};
            let usedStockLen = 0, reqLen = 0;
            const unfulfilledPieces = [];

            for (const dim in piecesByDim) {
                // Låst sortering: Sorterer primært efter eksakt længde (netto). 
                // Hvis længden er den samme, bruger den emnets ID. Dette forhindrer dem i at hoppe rundt!
                const pieces = piecesByDim[dim].sort((a, b) => {
                    if (b.exactLength !== a.exactLength) {
                        return b.exactLength - a.exactLength;
                    }
                    return a.id - b.id;
                });

                const available = stockByDim[dim] ? [...stockByDim[dim]] : [];

                const used = [];
                for (const piece of pieces) {
                    let placed = false;
                    used.sort((a, b) => a.rem - b.rem);
                    for (const s of used) {
                        if (s.rem >= piece.cutLength) { s.rem -= piece.cutLength; s.pieces.push(piece); placed = true; reqLen += piece.cutLength; break; }
                    }
                    if (!placed) {
                        available.sort((a, b) => a.length - b.length);
                        const idx = available.findIndex(l => l.length >= piece.cutLength);
                        if (idx === -1) {
                            unfulfilledPieces.push({
                                id: piece.id,
                                dimension: piece.dimension,
                                tag: piece.tag,
                                length: piece.exactLength,
                                amount: 1,
                                customMargin: piece.customMargin
                            });
                        } else {
                            const stockItem = available.splice(idx, 1)[0];
                            used.push({ originalLength: stockItem.length, type: stockItem.type, rem: stockItem.length - piece.cutLength, pieces: [piece] });
                            reqLen += piece.cutLength;
                        }
                    }
                }
                finalPlan[dim] = used.map(s => { usedStockLen += s.originalLength; return { originalLength: s.originalLength, type: s.type, pieces: s.pieces, waste: s.rem }; });
            }
            return { plan: finalPlan, unfulfilled: unfulfilledPieces, totalUsedStockLength: usedStockLen, totalRequiredLength: reqLen, totalWaste: usedStockLen - reqLen, wastePercentage: usedStockLen > 0 ? ((usedStockLen - reqLen) / usedStockLen) * 100 : 0 };
        }

        // --- UI RENDERING ---
        function renderAllLists() { renderDimensionsList(); updateDimensionDropdowns(); renderPiecesList(); renderStockList(); }
        function updateDimensionDropdowns() {
            const html = availableDimensions.map(d => `<option value="${d}">${d}</option>`).join('');
            pieceDimensionSelect.innerHTML = html; stockDimensionSelect.innerHTML = html;
        }
        function renderDimensionsList() {
            dimensionsListContainer.innerHTML = availableDimensions.map(d => `
                <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;border-left:3px solid #cbd5e1;flex-wrap:nowrap;overflow:hidden">
                    <span style="color:#94a3b8;font-size:0.75rem;flex-shrink:0">Dim.</span>
                    <span style="color:#e2e8f0;flex-shrink:0">|</span>
                    <span style="font-weight:600;color:#475569;flex-shrink:0;font-size:0.875rem">${d}</span>
                    <button onclick="removeDimension('${d}')" style="margin-left:auto;flex-shrink:0;color:#94a3b8;font-size:0.8rem;font-weight:600;background:none;border:none;cursor:pointer;white-space:nowrap;transition:color 0.15s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">Fjern</button>
                </div>
            `).join('') || '<p class="text-sm text-slate-400">Ingen dimensioner.</p>';
        }
        function renderPiecesList() {
            const grouped = {};
            requiredPieces.forEach(p => {
                const key = `${p.dimension}-${p.length}-${p.tag}-${p.customMargin}`;
                if (!grouped[key]) grouped[key] = { ...p, amount: 0, ids: [] };
                grouped[key].amount++; grouped[key].ids.push(p.id);
            });
            piecesListContainer.innerHTML = Object.values(grouped).map(p => {
                const color = getTagColor(p.tag);
                return `
                <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;border-left:3px solid ${color};flex-wrap:nowrap;overflow:hidden">
                    <input type="number" class="inline-edit" style="width:32px;flex-shrink:0" value="${p.amount}" onchange='updateGroupAmount(${JSON.stringify(p.ids)}, this.value)'>
                    <span style="color:#94a3b8;font-size:0.75rem;flex-shrink:0">stk.</span>
                    <span style="font-weight:600;color:#475569;flex-shrink:0;font-size:0.875rem">${p.dimension}</span>
                    <span style="color:#e2e8f0;flex-shrink:0">|</span>
                    <input type="number" class="inline-edit" style="width:50px;flex-shrink:0" value="${p.length}" onchange='updateGroupLength(${JSON.stringify(p.ids)}, this.value)'>
                    <span style="color:#94a3b8;font-size:0.75rem;flex-shrink:0">mm</span>
                    <span style="color:#e2e8f0;flex-shrink:0">|</span>
                    <input type="text" class="inline-edit" style="color:#6366f1;font-weight:600;width:70px;min-width:30px;flex:0 1 auto;text-overflow:ellipsis;overflow:hidden" value="${p.tag}" onchange='updateGroupTag(${JSON.stringify(p.ids)}, this.value)'>
                    <button onclick='confirmRemoveGroup(${JSON.stringify(p.ids)})' style="margin-left:auto;flex-shrink:0;color:#94a3b8;font-size:0.8rem;font-weight:600;background:none;border:none;cursor:pointer;white-space:nowrap">Fjern</button>
                </div>
            `}).join('') || '<p class="text-sm text-slate-400">Ingen emner.</p>';
        }
        function renderStockList() {
            stockListContainer.innerHTML = stockLengths.map(s => {
                const isBestilling = s.type === 'bestilling';
                const borderColor = isBestilling ? '#10b981' : '#94a3b8';
                const badge = isBestilling ? `<span style="background:#d1fae5;color:#047857;font-size:0.65rem;padding:2px 6px;border-radius:999px;font-weight:700;margin-left:4px">Bestilling</span>` : '';
                return `
                <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;border-left:3px solid ${borderColor};flex-wrap:nowrap;overflow:hidden">
                    <input type="number" class="inline-edit" style="width:36px;flex-shrink:0;font-weight:700" value="${s.amount}" onchange="updateStockAmount(${s.id}, this.value)">
                    <span style="color:#94a3b8;font-size:0.75rem;flex-shrink:0">stk.</span>
                    ${badge}
                    <span style="color:#e2e8f0;flex-shrink:0;margin-left:auto">|</span>
                    <span style="font-weight:600;color:#475569;flex-shrink:0;font-size:0.875rem">${s.dimension}</span>
                    <span style="color:#e2e8f0;flex-shrink:0">|</span>
                    <span style="font-weight:600;color:#475569;flex-shrink:0;font-size:0.875rem">${s.length}</span>
                    <span style="color:#94a3b8;font-size:0.75rem;flex-shrink:0">mm</span>
                    <button onclick="removeStock(${s.id})" style="margin-left:8px;flex-shrink:0;color:#94a3b8;font-size:0.8rem;font-weight:600;background:none;border:none;cursor:pointer;white-space:nowrap">Fjern</button>
                </div>
            `}).join('') || '<p class="text-sm text-slate-400">Ingen lagerlængder.</p>';
        }
        function renderResults(res) {
            const wasteColor = res.wastePercentage > 25 ? 'text-red-600' : res.wastePercentage > 15 ? 'text-amber-600' : 'text-emerald-600';
            const summary = `<div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                <h3 class="text-base font-bold text-slate-800 mb-3">Samlet Oversigt</h3>
                <div class="grid grid-cols-2 gap-2">
                    <span class="text-slate-500">Anvendt træ:</span><span class="font-bold text-slate-800 text-right">${(res.totalUsedStockLength / 1000).toFixed(2)} m</span>
                    <span class="text-slate-500">Spild:</span><span class="font-bold ${wasteColor} text-right">${(res.totalWaste / 1000).toFixed(2)} m (${res.wastePercentage.toFixed(1)}%)</span>
                </div>
            </div>`;
            resultsContainer.innerHTML += summary;

            let planHTML = '<div class="space-y-8"><h3 class="text-lg font-semibold">Visuel Skæreplan</h3>';

            const sortedDimensions = Object.keys(res.plan).sort();

            for (const dim of sortedDimensions) {
                const dimPlan = res.plan[dim];
                if (dimPlan.length === 0) continue;

                // Tæl lagerlængder (det korrekte tal) og emner
                const stockCount = dimPlan.length;
                let totalPiecesInDim = 0;
                let lagerCount = 0;
                let bestillingCount = 0;
                dimPlan.forEach(stock => { 
                    totalPiecesInDim += stock.pieces.length; 
                    if(stock.type === 'bestilling') bestillingCount++; else lagerCount++;
                });

                // Optæl lagerlængder pr. type
                const lengthCounts = {};
                dimPlan.forEach(s => {
                    if (!lengthCounts[s.originalLength]) lengthCounts[s.originalLength] = 0;
                    lengthCounts[s.originalLength]++;
                });
                const uniqueLengths = Object.keys(lengthCounts);
                let lengthLabel;
                if (uniqueLengths.length === 1) {
                    lengthLabel = `á ${uniqueLengths[0]} mm`;
                } else {
                    lengthLabel = uniqueLengths.sort((a, b) => a - b).map(l => `${lengthCounts[l]} stk á ${l} mm`).join(', ');
                }

                let headerText = '';
                if (lagerCount > 0 && bestillingCount > 0) {
                    headerText = `${lagerCount} stk. på lager <span class="text-gray-300 font-normal mx-1">+</span> <span class="text-emerald-700">${bestillingCount} stk. til bestilling</span>`;
                } else if (bestillingCount > 0) {
                    headerText = `<span class="text-emerald-700">${bestillingCount} stk. bestillingslængde${bestillingCount !== 1 ? 'r' : ''}</span>`;
                } else {
                    headerText = `${lagerCount} stk. lagerlængde${lagerCount !== 1 ? 'r' : ''}`;
                }

                // Beregn samlet spild for denne dimension
                let dimWaste = 0;
                dimPlan.forEach(s => { dimWaste += s.waste; });

                // --- Dimensions-sektions-header ---
                planHTML += `
                <div class="mt-6 border border-gray-200 rounded-xl overflow-hidden">
                    <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
                        <h4 class="font-bold text-gray-800 text-lg">${dim}</h4>
                        <p class="text-sm text-gray-600 mt-0.5">
                            <span class="font-semibold text-gray-800">${headerText}</span> ${lengthLabel}
                            <span class="mx-2 text-gray-300">|</span>
                            ${totalPiecesInDim} emne${totalPiecesInDim !== 1 ? 'r' : ''}
                            <span class="mx-2 text-gray-300">|</span>
                            <span class="text-red-600">Spild: ${dimWaste} mm</span>
                        </p>
                    </div>

                    <div class="px-4 py-3">`;

                // --- Mini-skæreliste (kompakt tabel for overblik) ---
                const pieceSummary = {};
                dimPlan.forEach(stock => {
                    stock.pieces.forEach(p => {
                        const key = `${p.tag || 'Emne'}-${p.exactLength}`;
                        if (!pieceSummary[key]) pieceSummary[key] = { tag: p.tag || 'Emne', length: p.exactLength, count: 0 };
                        pieceSummary[key].count++;
                    });
                });

                planHTML += `<table class="w-full text-xs mb-4 border border-slate-200 rounded-lg overflow-hidden">
                    <thead><tr class="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th class="px-3 py-1.5 text-left font-semibold">Emne</th>
                        <th class="px-3 py-1.5 text-right font-semibold">Antal</th>
                        <th class="px-3 py-1.5 text-right font-semibold">Netto længde</th>
                    </tr></thead><tbody>`;
                Object.values(pieceSummary).sort((a, b) => b.length - a.length).forEach(item => {
                    const tColor = getTagColor(item.tag);
                    planHTML += `<tr class="border-t border-slate-100">
                        <td class="px-3 py-1 font-semibold" style="color:${tColor}"><span class="inline-block w-2 h-2 rounded-full mr-1.5" style="background:${tColor}"></span>${item.tag}</td>
                        <td class="px-3 py-1 text-right text-slate-600">${item.count} stk.</td>
                        <td class="px-3 py-1 text-right text-slate-600">${item.length} mm</td>
                    </tr>`;
                });
                planHTML += `</tbody></table>`;

                // --- Visuelle stokke ---
                dimPlan.forEach((stock, i) => {
                    const piecesOnStock = stock.pieces.length;
                    planHTML += `<div class="mt-3 stock-block">
                        <div class="flex items-baseline gap-2 mb-1">
                            <span class="text-xs font-bold ${stock.type === 'bestilling' ? 'text-emerald-700' : 'text-slate-700'}">${stock.type === 'bestilling' ? `Bestillingslængde ${i + 1} af ${stockCount}` : `Lagerlængde ${i + 1} af ${stockCount}`}</span>
                            <span class="text-xs text-slate-300">—</span>
                            <span class="text-xs text-slate-500">${stock.originalLength} mm</span>
                            <span class="text-xs text-slate-300">—</span>
                            <span class="text-xs text-slate-500">${piecesOnStock} emne${piecesOnStock !== 1 ? 'r' : ''}</span>
                            ${stock.waste > 0 ? `<span class="text-xs text-red-500 ml-auto">Spild: ${stock.waste} mm</span>` : '<span class="text-xs text-emerald-600 ml-auto">Intet spild ✓</span>'}
                        </div>
                        <div class="stock-bar">`;

                    stock.pieces.forEach(p => {
                        const w = (p.cutLength / stock.originalLength) * 100;
                        const netW = (p.exactLength / p.cutLength) * 100;
                        const margW = (p.margin / p.cutLength) * 100;

                        // Farven bindes til tag-navnet, så samme emne altid har samme farve
                        const tagCol = getTagColor(p.tag);
                        planHTML += `<div class="piece-wrapper" style="width:${w}%; background:${tagCol}">
                            <div class="piece-segment" style="width:${netW}%"><input class="editable font-bold text-center w-full" value="${p.tag}" onchange="updatePieceTag(${p.id}, this.value)"><span>${p.exactLength} mm</span></div>
                            ${p.margin > 0 ? `<div class="margin-segment" style="width:${margW}%"><input type="number" class="margin-input" value="${p.margin}" onchange="updatePieceMargin(${p.id}, this.value)"></div>` : ''}
                        </div>`;
                    });
                    if (stock.waste > 0) planHTML += `<div class="waste-segment" style="width:${(stock.waste / stock.originalLength) * 100}%">Spild ${stock.waste}mm</div>`;
                    planHTML += `</div></div>`;
                });

                planHTML += `</div></div>`; // close px-4 py-3 and border container
            }
            resultsContainer.innerHTML += planHTML + '</div>';
        }

        // --- ANDRE FUNKTIONER ---
        function renderError(m) { resultsContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold text-sm">${m}</div>`; }
        function showPrintButtons(s) { printBtnDesktop.classList.toggle('hidden', !s); }
        function handlePrint() { 
            document.getElementById('print-modal').classList.remove('hidden');
        }

        document.getElementById('close-print-modal-btn').addEventListener('click', () => {
            document.getElementById('print-modal').classList.add('hidden');
        });

        document.getElementById('confirm-print-btn').addEventListener('click', () => {
            const pName = document.getElementById('modal-print-project').value.trim() || 'Uden navn';
            const uName = document.getElementById('modal-print-user').value.trim() || 'Ikke angivet';
            const header = document.getElementById('print-header');
            header.innerHTML = `
                <div style="text-align:center; padding-bottom:1rem; margin-bottom:1rem; border-bottom:2px solid #000;">
                    <h1 style="font-size:24px; font-weight:bold; margin:0 0 4px 0;">${pName}</h1>
                    <p style="font-size:14px; margin:0; color:#475569;">Udført af: ${uName}</p>
                </div>
            `;
            header.classList.remove('hidden');
            document.getElementById('print-modal').classList.add('hidden');
            window.print();
        });

        function handleSaveProject() {
            const name = projectNameInput.value.trim();
            if (!name) { alert('Indtast venligst et navn til dit projekt.'); return; }
            const projects = getSavedProjects();
            projects[name] = { availableDimensions, requiredPieces, stockLengths, safetyMargin: safetyMarginInput.value, nextPieceId, nextStockId };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            populateProjectsDropdown(); alert(`Projektet '${name}' er gemt lokalt.`);
        }
        function handleLoadProject() {
            const name = savedProjectsSelect.value;
            const projects = getSavedProjects();
            const data = projects[name];
            if (data) {
                availableDimensions = (data.availableDimensions && data.availableDimensions.length > 0) ? data.availableDimensions : ['45x95', '45x120', '45x145'];
                requiredPieces = data.requiredPieces || [];
                stockLengths = data.stockLengths || [];
                safetyMarginInput.value = data.safetyMargin || 100;
                // Removed print project mapping
                nextPieceId = data.nextPieceId || 0; nextStockId = data.nextStockId || 0;
                projectNameInput.value = name;
                renderAllLists();
                resultsContainer.innerHTML = '<div id="print-header" class="hidden"></div>';
                sustainabilityReportContainer.classList.add('hidden');
                showPrintButtons(false); alert(`Projektet '${name}' er indlæst.`);
                saveState();
            }
        }
        function handleDeleteProject() {
            const name = savedProjectsSelect.value;
            if (!name) return;
            if (confirm(`Slet projektet '${name}'?`)) {
                const projects = getSavedProjects();
                delete projects[name];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
                populateProjectsDropdown(); alert(`Slettet.`);
            }
        }
        function handleSaveToFile() {
            const projectName = projectNameInput.value.trim() || 'trae-projekt';
            const filename = `${projectName.replace(/[^a-z0-9æøå]/gi, '_').toLowerCase()}.json`;
            const projectData = { availableDimensions, requiredPieces, stockLengths, safetyMargin: safetyMarginInput.value, projectName: projectNameInput.value, nextPieceId, nextStockId, version: '4.3.0' };
            const dataStr = JSON.stringify(projectData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url; link.download = filename;
            document.body.appendChild(link); link.click();
            document.body.removeChild(link); URL.revokeObjectURL(url);
        }
        function handleLoadFromFile(e) {
            const file = e.target.files[0];
            if (!file) { return; }
            const reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (!data.requiredPieces) throw new Error('Ugyldigt filformat: Mangler emner.');
                    availableDimensions = (data.availableDimensions && data.availableDimensions.length > 0) ? data.availableDimensions : ['45x95', '45x120', '45x145'];
                    requiredPieces = data.requiredPieces || [];
                    stockLengths = data.stockLengths || [];
                    safetyMarginInput.value = data.safetyMargin || 100;
                    projectNameInput.value = data.projectName || data.printProjectName || '';
                    nextPieceId = data.nextPieceId || 0;
                    nextStockId = data.nextStockId || 0;
                    renderAllLists();
                    resultsContainer.innerHTML = '<div id="print-header" class="hidden"></div>';
                    sustainabilityReportContainer.classList.add('hidden');
                    showPrintButtons(false);
                    alert(`Filen er indlæst.`);
                    saveState();
                } catch (error) {
                    alert(`Fejl: ${error.message}`);
                } finally { e.target.value = null; }
            };
            reader.readAsText(file);
        }
        function runAdvancedAnalysis(globalMargin, piecesToProcess) {
            // Gruppér individuelle emner pr. dimension
            const allPiecesByDim = {};
            piecesToProcess.forEach(p => {
                if (!allPiecesByDim[p.dimension]) allPiecesByDim[p.dimension] = [];
                allPiecesByDim[p.dimension].push(p);
            });

            // Simulér optimalt indkøb pr. dimension
            let purchaseSuggestion = {};
            let totalOptimalPurchaseWaste = 0;

            for (const dim in allPiecesByDim) {
                let bestForDim = { waste: Infinity, length: 0, count: 0 };
                const piecesForThisDim = allPiecesByDim[dim];

                const grouped = {};
                piecesForThisDim.forEach(p => {
                    const key = `${p.length}-${p.tag}-${p.customMargin}`;
                    if (!grouped[key]) grouped[key] = { ...p, amount: 0 };
                    grouped[key].amount++;
                });

                const standardLengths = [];
                for (let l = 2400; l <= 5400; l += 300) { standardLengths.push(l); }

                for (const stockLen of standardLengths) {
                    const tempStock = [];
                    for (let i = 0; i < 500; i++) tempStock.push({ dimension: dim, length: stockLen, amount: 1 });

                    try {
                        const simResult = runOptimization(globalMargin, tempStock, piecesForThisDim);
                        if (simResult.plan[dim] && simResult.totalWaste < bestForDim.waste) {
                            bestForDim.waste = simResult.totalWaste;
                            bestForDim.length = stockLen;
                            bestForDim.count = simResult.plan[dim].length;
                        }
                    } catch (e) { /* ignorer fejl i simulering */ }
                }
                purchaseSuggestion[dim] = bestForDim;
                if (bestForDim.waste !== Infinity) {
                    totalOptimalPurchaseWaste += bestForDim.waste;
                }
            }

            return { purchaseSuggestion, totalOptimalPurchaseWaste };
        }

        function renderSustainabilityReport(analysis, plan) {
            let currentPlanWaste = 0;
            let potentialSavedVolumeM3 = 0;

            // Beregn nuværende spild pr. dimension og sammenlign med optimalt
            for (const dim in plan) {
                let currentDimWaste = 0;
                plan[dim].forEach(stock => { currentDimWaste += stock.waste; });
                currentPlanWaste += currentDimWaste;

                let optimalDimWaste = 0;
                if (analysis.purchaseSuggestion[dim]) {
                    optimalDimWaste = analysis.purchaseSuggestion[dim].waste;
                }

                const savedLengthForDim = currentDimWaste - optimalDimWaste;
                if (savedLengthForDim > 0) {
                    const dimParts = dim.split('x').map(d => parseInt(d) / 1000);
                    if (dimParts.length === 2 && !isNaN(dimParts[0]) && !isNaN(dimParts[1])) {
                        potentialSavedVolumeM3 += (dimParts[0] * dimParts[1] * (savedLengthForDim / 1000));
                    }
                }
            }

            const potentialSavings = currentPlanWaste - analysis.totalOptimalPurchaseWaste;
            const co2SavedKg = potentialSavedVolumeM3 * 900;

            // Byg indkøbsforslags-HTML
            let purchaseHTML = '';
            let hasPurchases = false;
            for (const dim in analysis.purchaseSuggestion) {
                const suggestion = analysis.purchaseSuggestion[dim];
                if (suggestion.count > 0) {
                    hasPurchases = true;
                    purchaseHTML += `<li class="text-sm"><span class="font-semibold">${dim}</span>: Køb ${suggestion.count} stk. á ${suggestion.length} mm</li>`;
                }
            }
            
            let applyBtnHtml = '';
            if (hasPurchases) {
                const encodedSuggestions = encodeURIComponent(JSON.stringify(analysis.purchaseSuggestion));
                applyBtnHtml = `<div class="mt-2"><button onclick="window.applyOptimalPurchase('${encodedSuggestions}')" class="text-xs text-slate-500 hover:text-emerald-600 underline underline-offset-2 transition-colors cursor-pointer focus:outline-none">Erstat hele lageret med disse længder</button></div>`;
            }

            // Tjek om vi har 'lager' i vores nuværende plan
            const hasLager = stockLengths.some(s => s.type !== 'bestilling');
            const bestillinger = stockLengths.filter(s => s.type === 'bestilling');
            
            let aktueltIndkoebBox = '';
            if (bestillinger.length > 0) {
                let aktueltIndkoebHTML = '';
                const groupedBestillinger = {};
                bestillinger.forEach(b => {
                    const key = `${b.dimension}-${b.length}`;
                    if (!groupedBestillinger[key]) groupedBestillinger[key] = { ...b, amount: 0 };
                    groupedBestillinger[key].amount += b.amount;
                });
                let emailBody = 'Indkøbsliste (Manglende træ):\\n\\n';
                for (const key in groupedBestillinger) {
                    const item = groupedBestillinger[key];
                    aktueltIndkoebHTML += `<li class="text-sm"><span class="font-semibold">${item.dimension}</span>: Køb ${item.amount} stk. á ${item.length} mm</li>`;
                    emailBody += `- ${item.dimension}: Køb ${item.amount} stk. á ${item.length} mm\\n`;
                }

                const emailLink = `mailto:?subject=Indkøbsliste fra Træoptimerings-App&body=${encodeURIComponent(emailBody)}`;

                aktueltIndkoebBox = `
                <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-emerald-800 text-sm">🛒 Indkøbsliste (Manglende træ)</h4>
                        <div class="flex gap-2">
                            <button onclick="window.printShoppingList()" class="p-1.5 bg-white text-emerald-700 rounded shadow-sm border border-emerald-200 hover:bg-emerald-100 transition-colors tooltip" title="Print Indkøbsliste">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </button>
                            <a href="${emailLink}" class="p-1.5 bg-white text-emerald-700 rounded shadow-sm border border-emerald-200 hover:bg-emerald-100 transition-colors tooltip flex items-center justify-center" title="Send som Mail">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </a>
                        </div>
                    </div>
                    <p class="text-xs text-emerald-600 mb-2">Disse længder er automatisk tilføjet planen, og mangler at blive købt for at opgaven går op:</p>
                    <ul id="shopping-list-ul" class="list-disc list-inside space-y-1 text-sm text-emerald-800">${aktueltIndkoebHTML}</ul>
                </div>
                `;
            }

            let theoreticBox = '';
            if (hasLager) {
                theoreticBox = `
                    <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 class="font-bold text-slate-700 text-sm mb-2">📦 Alternativ: Optimalt Indkøb fra bunden</h4>
                        <p class="text-xs text-slate-500 mb-2">Hvis du undlod at bruge dit eksisterende lager, og i stedet købte alt fra bunden, ville det optimale være:</p>
                        <ul class="list-disc list-inside space-y-1 text-sm">${purchaseHTML || '<li class="text-slate-400">Ingen indkøb nødvendigt.</li>'}</ul>
                        ${applyBtnHtml}
                    </div>
                `;
            } else {
                theoreticBox = `
                    <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 class="font-bold text-slate-700 text-sm mb-2">📦 Optimalt Indkøb</h4>
                        <p class="text-xs text-slate-500 mb-2">For at opnå mindst muligt spild, anbefales følgende indkøb:</p>
                        <ul class="list-disc list-inside space-y-1 text-sm">${purchaseHTML || '<li class="text-slate-400">Ingen indkøb nødvendigt.</li>'}</ul>
                        ${applyBtnHtml}
                    </div>
                `;
            }

            // Håndtér besparelse visuelt
            let savingsHTML;
            if (potentialSavings > 0) {
                savingsHTML = `<p class="text-sm text-slate-600">Ved at udskifte dit nuværende lager med det optimale indkøb, kan du spare yderligere <span class="font-bold text-emerald-600">${(potentialSavings / 1000).toFixed(2)} meter</span> spild.</p>`;
            } else if (potentialSavings === 0) {
                savingsHTML = `<p class="text-sm text-slate-600">Din nuværende plan bruger præcis de optimale længder! Der er intet yderligere spild at spare.</p>`;
            } else {
                savingsHTML = `<p class="text-sm text-slate-600">Din nuværende plan er utroligt nok <span class="font-bold text-emerald-600">${(Math.abs(potentialSavings) / 1000).toFixed(2)} meter</span> *bedre* end standard-indkøb. Godt gået!</p>`;
            }

            const html = `
                <div class="section-header">
                    <div class="section-badge" style="background: linear-gradient(135deg, #059669, #34d399);">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <h3 class="section-title">Bæredygtigheds- & Indkøbsanalyse</h3>
                </div>
                <div class="space-y-4 mt-4">
                    ${aktueltIndkoebBox}
                    ${theoreticBox}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <h4 class="font-bold text-emerald-800 text-sm mb-1">🌿 Spild-Besparelse</h4>
                            ${savingsHTML}
                        </div>
                        <div class="p-4 bg-sky-50 rounded-xl border border-sky-200">
                            <h4 class="font-bold text-sky-800 text-sm mb-1">🌍 Potentiel CO2-Besparelse</h4>
                            <p class="text-sm text-slate-600">Ved at skifte til optimalt indkøb: <span class="font-bold ${co2SavedKg > 0 ? 'text-sky-600' : 'text-slate-400'}">${co2SavedKg.toFixed(1)} kg CO2</span></p>
                        </div>
                    </div>
                </div>
            `;
            sustainabilityReportContainer.innerHTML = html;
            sustainabilityReportContainer.classList.remove('hidden');
        }
        function populateStandardLengthsDropdown() {
            let html = ''; for (let l = 2400; l <= 5400; l += 300) html += `<option value="${l}">${l} mm</option>`;
            stockLengthSelect.innerHTML = html;
        }
        function getSavedProjects() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        function populateProjectsDropdown() {
            const projects = getSavedProjects();
            const projectNames = Object.keys(projects);
            if (projectNames.length === 0) {
                savedProjectsSelect.innerHTML = `<option value="">Ingen gemte projekter</option>`;
                savedProjectsSelect.disabled = true; loadProjectBtn.disabled = true; deleteProjectBtn.disabled = true;
            } else {
                savedProjectsSelect.innerHTML = projectNames.map(name => `<option value="${name}">${name === '' ? '[Uden navn]' : name}</option>`).join('');
                savedProjectsSelect.disabled = false; loadProjectBtn.disabled = false; deleteProjectBtn.disabled = false;
            }
        }

        populateStandardLengthsDropdown();
        populateProjectsDropdown();
        renderAllLists();
        saveState();

        window.printShoppingList = function() {
            const listHtml = document.getElementById('shopping-list-ul').innerHTML;
            const printProject = document.getElementById('modal-print-project').value || projectNameInput.value || 'Projekt';
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Indkøbsliste - \${printProject}</title>
                        <style>
                            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #1e293b; max-width: 800px; margin: 0 auto; }
                            h1 { border-bottom: 2px solid #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 1.5rem; color: #0f172a; font-size: 1.5rem; }
                            ul { list-style-type: none; padding: 0; }
                            li { padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0; font-size: 1.1rem; }
                            .header { display: flex; justify-content: space-between; margin-bottom: 2rem; color: #64748b; font-size: 0.9rem; }
                            .font-semibold { font-weight: 600; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <span><strong>Projekt:</strong> \${printProject}</span>
                            <span><strong>Dato:</strong> \${new Date().toLocaleDateString('da-DK')}</span>
                        </div>
                        <h1>Indkøbsliste</h1>
                        <ul>\${listHtml}</ul>
                        <script>
                            window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 250); }
                        