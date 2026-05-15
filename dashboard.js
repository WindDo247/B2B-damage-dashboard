// Global state
const AppState = {
    dbData: [],
    kwData: [],
    gxtData: [],
    mappedData: [],
    uniqueLabels: [],
    filesLoaded: { db: false, kw: false, gxt: false },
    charts: {}
};

// --- STATE PERSISTENCE (INDEXEDDB) ---
const DB_NAME = 'B2BDashboardDB';
const STORE_NAME = 'AppStateStore';

function saveStateToDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = e => {
            const db = e.target.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            store.put({
                dbData: AppState.dbData,
                kwData: AppState.kwData,
                gxtData: AppState.gxtData,
                mappedData: AppState.mappedData,
                uniqueLabels: AppState.uniqueLabels,
                filesLoaded: AppState.filesLoaded
            }, 'state');
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
    });
}

function loadStateFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                resolve(null);
                return;
            }
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get('state');
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => reject(getReq.error);
        };
    });
}

// Khôi phục URL đã lưu và tự động lưu khi gõ/dán
['db', 'kw', 'gxt'].forEach(target => {
    const input = document.getElementById(`link-${target}`);
    if (input) {
        const savedUrl = localStorage.getItem(`saved_url_${target}`);
        if (savedUrl) input.value = savedUrl;
        
        input.addEventListener('input', (e) => {
            localStorage.setItem(`saved_url_${target}`, e.target.value.trim());
        });
    }
});

// DOM Elements
const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
const fileInputs = {
    db: document.getElementById('file-db'),
    kw: document.getElementById('file-kw'),
    gxt: document.getElementById('file-gxt')
};
const statuses = {
    db: document.getElementById('status-db'),
    kw: document.getElementById('status-kw'),
    gxt: document.getElementById('status-gxt')
};
const dropBoxes = {
    db: document.getElementById('drop-db'),
    kw: document.getElementById('drop-kw'),
    gxt: document.getElementById('drop-gxt')
};
const btnProcess = document.getElementById('btn-process');
const loadingOverlay = document.getElementById('loading-overlay');

// Navigation Logic
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        
        // Update nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update sections
        sections.forEach(sec => sec.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        // Resize charts if dashboard is shown
        if (targetId === 'dashboard-section') {
            Object.values(AppState.charts).forEach(chart => {
                if (chart) chart.resize();
            });
        }
    });
});

// Tab Switching Logic
document.querySelectorAll('.import-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const type = tab.getAttribute('data-type'); // 'file' or 'link'
        const target = tab.getAttribute('data-target'); // 'db', 'kw', or 'gxt'
        
        // Update active tab
        const tabContainer = tab.closest('.import-tabs');
        tabContainer.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding content
        const box = document.getElementById(`drop-${target}`);
        box.querySelectorAll('.import-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`content-${type}-${target}`).classList.add('active');
    });
});

// Common Data Handler
function handleDataLoad(type, data, filename) {
    try {
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (type === 'db') AppState.dbData = json;
        if (type === 'kw') AppState.kwData = json;
        if (type === 'gxt') AppState.gxtData = json;
        
        AppState.filesLoaded[type] = true;
        statuses[type].textContent = `${filename} (${json.length} dòng)`;
        statuses[type].style.color = 'var(--accent-success)';
        dropBoxes[type].classList.add('success');
        
        checkAllFilesLoaded();
        saveStateToDB(); // Lưu vào DB ngay khi import thành công
    } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
        statuses[type].textContent = 'Lỗi định dạng dữ liệu!';
        statuses[type].style.color = 'var(--accent-danger)';
        dropBoxes[type].classList.remove('success');
        AppState.filesLoaded[type] = false;
    }
}

// File Upload Logic
Object.keys(fileInputs).forEach(key => {
    fileInputs[key].addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            handleDataLoad(key, data, file.name);
        };
        reader.readAsArrayBuffer(file);
    });
});

// Link Fetch Logic
document.querySelectorAll('.btn-fetch').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const target = btn.getAttribute('data-target');
        const linkInput = document.getElementById(`link-${target}`);
        const url = linkInput.value.trim();
        
        if (!url) {
            alert('Vui lòng nhập URL hợp lệ');
            return;
        }
        
        // Lưu URL vào bộ nhớ tạm của trình duyệt để lần sau mở lại vẫn còn
        localStorage.setItem(`saved_url_${target}`, url);
        
        const originalText = btn.textContent;
        btn.textContent = 'Đang tải...';
        btn.disabled = true;
        statuses[target].textContent = 'Đang tải dữ liệu từ URL...';
        statuses[target].style.color = 'var(--text-secondary)';
        
        try {
            let fetchUrl = url;
            let isGoogleSheet = false;
            let isGoogleDrive = false;
            let gId = null;
            let sheetGid = null;
            
            // Xử lý link Google Sheets
            if (url.includes('docs.google.com/spreadsheets')) {
                const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (match) {
                    gId = match[1];
                    isGoogleSheet = true;
                }
                const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
                if (gidMatch) {
                    sheetGid = gidMatch[1];
                }
            } 
            // Xử lý link Google Drive
            else if (url.includes('drive.google.com/file/d/')) {
                const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (match) {
                    gId = match[1];
                    isGoogleDrive = true;
                    fetchUrl = `https://drive.google.com/uc?export=download&id=${gId}`;
                }
            }

            if (isGoogleSheet) {
                // Tận dụng kỹ thuật JSONP riêng của Google Sheets (bỏ qua mọi rào cản CORS & Origin null)
                await new Promise((resolve, reject) => {
                    const callbackName = 'gvizCallback_' + Math.round(Math.random() * 1000000);
                    
                    // Thiết lập timeout 15 giây để tránh kẹt mãi mãi
                    const timeoutId = setTimeout(() => {
                        delete window[callbackName];
                        if (document.getElementById(callbackName)) {
                            document.body.removeChild(document.getElementById(callbackName));
                        }
                        reject(new Error("Hết thời gian chờ (Timeout). Có vẻ như Google không phản hồi đúng định dạng."));
                    }, 15000);
                    
                    window[callbackName] = function(data) {
                        clearTimeout(timeoutId);
                        delete window[callbackName];
                        if (document.getElementById(callbackName)) {
                            document.body.removeChild(document.getElementById(callbackName));
                        }
                        
                        if (data.status === 'error') {
                            reject(new Error("Google Sheets báo lỗi: " + (data.errors ? data.errors[0].message : 'Quyền truy cập')));
                            return;
                        }
                        
                        try {
                            const cols = data.table.cols.map((c, i) => c && c.label ? c.label : (c && c.id ? c.id : `Cột_${i}`));
                            const jsonArray = data.table.rows.map(row => {
                                const rowObj = {};
                                row.c.forEach((cell, i) => {
                                    if (cols[i]) {
                                        // Ưu tiên lấy giá trị gốc cell.v, ép kiểu về chuỗi để đảm bảo an toàn
                                        rowObj[cols[i]] = cell && cell.v !== null && cell.v !== undefined ? String(cell.v) : "";
                                    }
                                });
                                return rowObj;
                            });
                            
                            if (target === 'db') AppState.dbData = jsonArray;
                            if (target === 'kw') AppState.kwData = jsonArray;
                            if (target === 'gxt') AppState.gxtData = jsonArray;
                            
                            AppState.filesLoaded[target] = true;
                            statuses[target].textContent = `Google Sheets (${jsonArray.length} dòng)`;
                            statuses[target].style.color = 'var(--accent-success)';
                            dropBoxes[target].classList.add('success');
                            
                            checkAllFilesLoaded();
                            saveStateToDB(); // Lưu state
                            resolve();
                        } catch(e) {
                            reject(new Error("Lỗi khi giải mã dữ liệu Google Sheets"));
                        }
                    };
                    
                    const script = document.createElement('script');
                    script.id = callbackName;
                    
                    let gvizUrl = `https://docs.google.com/spreadsheets/d/${gId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&headers=1`;
                    if (sheetGid) {
                        gvizUrl += `&gid=${sheetGid}`;
                    }
                    script.src = gvizUrl;
                    
                    script.onerror = () => {
                        clearTimeout(timeoutId);
                        delete window[callbackName];
                        if (document.getElementById(callbackName)) {
                            document.body.removeChild(document.getElementById(callbackName));
                        }
                        reject(new Error("Không thể kết nối. Đảm bảo link là Google Sheets ở chế độ Anyone with link."));
                    };
                    
                    document.body.appendChild(script);
                });
            } else {
                // Với Google Drive hoặc file tĩnh khác, buộc phải dùng Proxy
                const proxy1 = `https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`;
                const proxy2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;
                
                let response = null;
                try {
                    response = await fetch(proxy1);
                    if (!response.ok) throw new Error("p1 fail");
                } catch (e1) {
                    try {
                        response = await fetch(proxy2);
                        if (!response.ok) throw new Error("p2 fail");
                    } catch (e2) {
                        response = await fetch(fetchUrl); 
                    }
                }

                if (!response || !response.ok) {
                    throw new Error(`HTTP ${response ? response.status : 'Unknown'} - Không thể kết nối. Máy chủ từ chối file cục bộ (file://).`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                
                const decoder = new TextDecoder('utf-8');
                const sampleText = decoder.decode(data.slice(0, 150));
                const lowerSample = sampleText.toLowerCase();
                
                if (lowerSample.includes('<!doctype html>') || lowerSample.includes('<html') || lowerSample.includes('google sign in')) {
                     throw new Error("Link trả về trang HTML/Đăng nhập. Hãy đổi sang định dạng tải trực tiếp.");
                }
                
                const filename = fetchUrl.split('/').pop().split('?')[0] || `Link Data`;
                handleDataLoad(target, data, filename);
            }
        } catch (error) {
            console.error('Lỗi tải URL:', error);
            statuses[target].textContent = `Lỗi: ${error.message}`;
            statuses[target].style.color = 'var(--accent-danger)';
            dropBoxes[target].classList.remove('success');
            AppState.filesLoaded[target] = false;
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
});

function checkAllFilesLoaded() {
    if (AppState.filesLoaded.db && AppState.filesLoaded.kw && AppState.filesLoaded.gxt) {
        btnProcess.disabled = false;
    } else {
        btnProcess.disabled = true;
    }
}

btnProcess.addEventListener('click', () => {
    loadingOverlay.classList.add('active');
    
    // Simulate slight delay for UI responsiveness
    setTimeout(() => {
        processData();
        buildDashboard();
        generateReport();
        
        // Enable navigation and switch to dashboard
        document.getElementById('nav-dashboard').style.display = 'flex';
        document.getElementById('nav-report').style.display = 'flex';
        navItems[1].click(); // Click dashboard
        
        loadingOverlay.classList.remove('active');
        
        // Lưu toàn bộ trạng thái vào DB
        saveStateToDB();
    }, 500);
});

// Helper function to normalize Vietnamese text (NFC), lowercase, and remove extra spaces
function normalizeStr(str) {
    if (!str) return '';
    return String(str).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function processData() {
    // 1. Prepare Keyword Mapping (keyword -> label)
    const keywordMap = [];
    if (AppState.kwData.length > 0) {
        const kwKeysFirstRow = Object.keys(AppState.kwData[0]);
        
        // Cảnh báo nếu dán nhầm link Data vào ô Keyword
        const hasKeywordCol = kwKeysFirstRow.some(k => normalizeStr(k).includes('key') || normalizeStr(k).includes('từ khóa') || normalizeStr(k).includes('word'));
        if (!hasKeywordCol && AppState.kwData.length > 5) {
            alert("⚠️ CẢNH BÁO: Hình như bạn đang dán nhầm Link Data vào ô Keyword (chưa chuyển sang Tab Keyword lúc copy link). Vui lòng dán đúng link của Tab chứa từ khóa!");
        }

        const kwKeyField = kwKeysFirstRow.find(k => normalizeStr(k).includes('key') || normalizeStr(k).includes('từ khóa') || normalizeStr(k).includes('word')) || kwKeysFirstRow[0];
        const labelKeyField = kwKeysFirstRow.find(k => normalizeStr(k).includes('label') || normalizeStr(k).includes('nhãn') || normalizeStr(k).includes('loại')) || kwKeysFirstRow[1];

        AppState.kwData.forEach(row => {
            let kw = row[kwKeyField];
            let label = row[labelKeyField];
            
            if (kw && label) {
                keywordMap.push({ 
                    keyword: normalizeStr(kw), 
                    label: String(label).trim() // Keep label original case for display
                });
            }
        });
    }

    // Lọc ra danh sách các nhãn (labels) duy nhất để làm Droplist
    AppState.uniqueLabels = [...new Set(keywordMap.map(m => m.label))];
    if (!AppState.uniqueLabels.includes("Khác")) {
        AppState.uniqueLabels.push("Khác");
    }

    // 2. Prepare GXT to KTC Mapping
    const gxtMap = {};
    if (AppState.gxtData.length > 0) {
        const gxtKeysFirstRow = Object.keys(AppState.gxtData[0]);
        const gxtField = gxtKeysFirstRow.find(k => k.toLowerCase().includes('giao') || k.toLowerCase().includes('gxt') || k.toLowerCase().includes('kho')) || gxtKeysFirstRow[0];
        const ktcField = gxtKeysFirstRow.find(k => k.toLowerCase().includes('ktc') || k.toLowerCase().includes('kct') || k.toLowerCase().includes('trước')) || gxtKeysFirstRow[1];

        AppState.gxtData.forEach(row => {
            let gxt = row[gxtField];
            let ktc = row[ktcField];
            if (gxt) {
                gxtMap[String(gxt).trim().toLowerCase()] = ktc || "Chưa xác định";
            }
        });
    }

    // 3. Map Database
    if (AppState.dbData.length === 0) return;
    
    // Nhận diện cột động từ dòng đầu tiên để tránh sai lệch do tên cột (case-sensitive)
    const firstRowKeys = Object.keys(AppState.dbData[0]);
    const weekKey = firstRowKeys.find(k => k.toLowerCase().includes('week')) || firstRowKeys.find(k => k.toLowerCase().includes('tuần')) || 'pickup_week';
    const clientKey = firstRowKeys.find(k => k.toLowerCase().includes('client')) || firstRowKeys.find(k => k.toLowerCase().includes('khách')) || 'client_name';
    const orderKey = firstRowKeys.find(k => k.toLowerCase().includes('order')) || firstRowKeys.find(k => k.toLowerCase().includes('mã')) || 'order_code';
    const typeKey = firstRowKeys.find(k => k.toLowerCase().includes('type')) || firstRowKeys.find(k => k.toLowerCase().includes('loại')) || 'damage_type';
    const detailKey = firstRowKeys.find(k => k.toLowerCase().includes('detail')) || firstRowKeys.find(k => k.toLowerCase().includes('chi tiết')) || firstRowKeys.find(k => k.toLowerCase().includes('ghi chú')) || 'damage_details';
    const gxtKeyField = firstRowKeys.find(k => k.toLowerCase().includes('gxt')) || firstRowKeys.find(k => k.toLowerCase().includes('giao')) || firstRowKeys.find(k => k.toLowerCase().includes('kho')) || 'warehouse_giao';

    AppState.mappedData = AppState.dbData.map(row => {
        // Gom chung text của Loại lỗi và Chi tiết lỗi để đối chiếu Keyword (tăng độ chính xác)
        const typeText = String(row[typeKey] || '');
        const detailText = String(row[detailKey] || '');
        const combinedText = normalizeStr(typeText + " " + detailText);
        
        let matchedLabel = "Khác";
        
        for (let mapObj of keywordMap) {
            if (combinedText.includes(mapObj.keyword)) {
                matchedLabel = mapObj.label;
                break; // Lấy nhãn đầu tiên match được
            }
        }
        
        const gxtName = String(row[gxtKeyField] || '').trim();
        const matchedKTC = gxtMap[gxtName.toLowerCase()] || "Chưa xác định";

        return {
            ...row,
            mapped_label: matchedLabel,
            mapped_ktc: matchedKTC,
            clean_week: row[weekKey] || "W_Unknown",
            clean_client: row[clientKey] || "Khách lẻ",
            clean_order: row[orderKey] || "N/A",
            clean_gxt: gxtName,
            clean_type: typeText || "N/A",
            damage_details: detailText
        };
    });
}

// Dashboard Building
function buildDashboard() {
    const data = AppState.mappedData;
    
    // Grouping Helpers
    const groupBy = (array, key) => {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    };

    // 1. Trend Chart
    const weekGroups = groupBy(data, 'clean_week');
    const weeks = Object.keys(weekGroups).sort();
    const trendData = weeks.map(w => weekGroups[w].length);
    
    createChart('trendChart', 'line', {
        labels: weeks,
        datasets: [{
            label: 'Số đơn hư hỏng',
            data: trendData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointRadius: 4
        }]
    });

    // Populate Filters
    const weekFilterKtc = document.getElementById('week-filter-ktc');
    const weekFilterGxt = document.getElementById('week-filter-gxt');
    weekFilterKtc.innerHTML = '<option value="all">Tất cả các tuần</option>';
    weekFilterGxt.innerHTML = '<option value="all">Tất cả các tuần</option>';
    
    weeks.forEach(w => {
        weekFilterKtc.innerHTML += `<option value="${w}">${w}</option>`;
        weekFilterGxt.innerHTML += `<option value="${w}">${w}</option>`;
    });

    // 2. KTC Chart & GXT Chart (Initial build)
    updateKtcChart('all');
    updateGxtChart('all');

    // Filter listeners
    weekFilterKtc.addEventListener('change', (e) => updateKtcChart(e.target.value));
    weekFilterGxt.addEventListener('change', (e) => updateGxtChart(e.target.value));

    // 3. Label Breakdown (Pie Chart)
    const labelGroups = groupBy(data, 'mapped_label');
    const labels = Object.keys(labelGroups).sort((a,b) => labelGroups[b].length - labelGroups[a].length);
    const labelData = labels.map(l => labelGroups[l].length);
    
    createChart('labelChart', 'doughnut', {
        labels: labels,
        datasets: [{
            data: labelData,
            backgroundColor: [
                '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    }, { cutout: '65%' });

    // 4. Client Chart
    const clientGroups = groupBy(data, 'clean_client');
    const clients = Object.keys(clientGroups).sort((a,b) => clientGroups[b].length - clientGroups[a].length).slice(0, 5);
    const clientData = clients.map(c => clientGroups[c].length);
    
    createChart('clientChart', 'bar', {
        labels: clients,
        datasets: [{
            label: 'Đơn hư hỏng',
            data: clientData,
            backgroundColor: '#8b5cf6',
            borderRadius: 6
        }]
    }, { indexAxis: 'y' });
}

function updateKtcChart(week) {
    let targetData = AppState.mappedData;
    if (week !== 'all') {
        targetData = targetData.filter(d => d.clean_week === week);
    }
    
    // Chỉ quan tâm lỗi 'damage'
    targetData = targetData.filter(d => d.mapped_label.toLowerCase().includes('damage'));
    
    const ktcMap = {};
    targetData.forEach(d => {
        ktcMap[d.mapped_ktc] = (ktcMap[d.mapped_ktc] || 0) + 1;
    });
    
    const sortedKtc = Object.entries(ktcMap).sort((a, b) => b[1] - a[1]).slice(0, 10); // Top 10
    
    createChart('ktcChart', 'bar', {
        labels: sortedKtc.map(k => k[0]),
        datasets: [{
            label: 'Số lượng lỗi',
            data: sortedKtc.map(k => k[1]),
            backgroundColor: '#f59e0b',
            borderRadius: 4
        }]
    });
}

function updateGxtChart(week) {
    let targetData = AppState.mappedData;
    if (week !== 'all') {
        targetData = targetData.filter(d => d.clean_week === week);
    }
    
    // Chỉ quan tâm lỗi 'damage'
    targetData = targetData.filter(d => d.mapped_label.toLowerCase().includes('damage'));
    
    const gxtMap = {};
    targetData.forEach(d => {
        gxtMap[d.clean_gxt] = (gxtMap[d.clean_gxt] || 0) + 1;
    });
    
    const sortedGxt = Object.entries(gxtMap).sort((a, b) => b[1] - a[1]).slice(0, 10); // Top 10
    
    createChart('gxtChart', 'bar', {
        labels: sortedGxt.map(k => k[0]),
        datasets: [{
            label: 'Số lượng lỗi',
            data: sortedGxt.map(k => k[1]),
            backgroundColor: '#ef4444',
            borderRadius: 4
        }]
    });
}

function createChart(id, type, data, options = {}) {
    if (AppState.charts[id]) {
        AppState.charts[id].destroy();
    }
    
    const ctx = document.getElementById(id).getContext('2d');
    
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: type === 'pie' || type === 'doughnut' ? 'right' : 'top',
                labels: { color: '#e2e8f0' }
            }
        },
        ...options
    };
    
    if (type === 'bar' || type === 'line') {
        baseOptions.scales = {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                grid: { display: false }
            }
        };
        // For horizontal bar chart
        if (options.indexAxis === 'y') {
            baseOptions.scales.x.grid = { color: 'rgba(255, 255, 255, 0.05)' };
            baseOptions.scales.y.grid = { display: false };
        }
    }
    
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        baseOptions.plugins.datalabels = {
            color: '#fff',
            font: {
                weight: 'bold',
                size: 11
            },
            formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.forEach(data => {
                    sum += parseFloat(data);
                });
                if (sum === 0 || value === 0) return value;
                let percentage = (value * 100 / sum).toFixed(1) + "%";
                return `${value} (${percentage})`;
            }
        };
    }
    
    AppState.charts[id] = new Chart(ctx, {
        type: type,
        data: data,
        options: baseOptions
    });
}

// Report Generation
function generateReport(keepPage = false) {
    const data = AppState.mappedData;
    const reportContent = document.getElementById('report-content');
    
    // Calculations
    const totalIssues = data.length;
    
    const weekGroups = {};
    data.forEach(d => { weekGroups[d.clean_week] = (weekGroups[d.clean_week] || 0) + 1; });
    const weeks = Object.keys(weekGroups).sort();
    
    let trendText = "Chưa đủ dữ liệu tuần";
    if (weeks.length >= 2) {
        const lastW = weekGroups[weeks[weeks.length-1]];
        const prevW = weekGroups[weeks[weeks.length-2]];
        const diff = lastW - prevW;
        const pct = ((Math.abs(diff) / prevW) * 100).toFixed(1);
        
        if (diff > 0) trendText = `<span style="color: var(--accent-danger)">Tăng ${pct}%</span> so với tuần trước.`;
        else if (diff < 0) trendText = `<span style="color: var(--accent-success)">Giảm ${pct}%</span> so với tuần trước.`;
        else trendText = "Tương đương tuần trước.";
    }

    const damageData = data.filter(d => d.mapped_label.toLowerCase().includes('damage'));

    const ktcGroups = {};
    const gxtGroups = {};
    damageData.forEach(d => {
        ktcGroups[d.mapped_ktc] = (ktcGroups[d.mapped_ktc] || 0) + 1;
        gxtGroups[d.clean_gxt] = (gxtGroups[d.clean_gxt] || 0) + 1;
    });
    
    const topKtc = Object.entries(ktcGroups).sort((a,b) => b[1] - a[1])[0] || ["N/A", 0];
    const topGxt = Object.entries(gxtGroups).sort((a,b) => b[1] - a[1])[0] || ["N/A", 0];

    // Build HTML Report
    let html = `
        <div class="highlight-box">
            <strong>Tổng quan:</strong> Hệ thống đã ghi nhận tổng cộng <strong>${totalIssues}</strong> đơn hàng có vấn đề về ngoại quan/bể vỡ trong toàn bộ thời gian.
            Xu hướng hiện tại: ${trendText}
        </div>
        
        <h4>1. Điểm nóng KTC/KCT</h4>
        <p>Kho trung chuyển ghi nhận nhiều hàng lỗi xuất phát nhất là <strong>${topKtc[0]}</strong> với <strong>${topKtc[1]}</strong> trường hợp. Cần ưu tiên kiểm tra quy trình chất xếp hàng điện máy tại khu vực xuất/nhập của kho KTC này.</p>
        
        <h4>2. Điểm nóng Kho Giao (GXT)</h4>
        <p>Kho giao cuối cùng ghi nhận số lượng từ chối/phát hiện lỗi nhiều nhất là <strong>${topGxt[0]}</strong> với <strong>${topGxt[1]}</strong> đơn hàng. Quản lý vận hành cần lưu ý thêm về điều kiện đường xá và cách thao tác hạ hàng tại bưu cục này.</p>
        
        <h4>3. Khuyến nghị B2B Operations</h4>
        <ul>
            <li>Rà soát lại quy trình đào tạo và phổ biến tài liệu "Hướng dẫn chất xếp hàng điện máy" cho nhân viên bốc xếp tại ${topKtc[0]}.</li>
            <li>Theo dõi diễn biến biểu đồ Tuần tới để đánh giá tính hiệu quả của các biện pháp can thiệp.</li>
            <li>Tăng cường kiểm tra ngẫu nhiên (audit) ngoại quan thùng xe trước khi rời kho B2B đối với các tuyến chạy thẳng về ${topKtc[0]}.</li>
        </ul>
    `;
    
    // DEBUG INFO
    const kwPreview = keywordMap.length > 0 ? keywordMap.map(k => k.keyword).join(', ') : "Không tìm thấy";
    const dbKeys = AppState.dbData.length > 0 ? Object.keys(AppState.dbData[0]).join(' | ') : "Không có";
    
    html += `
        <div style="margin-top:30px; padding:15px; background:var(--bg-secondary); border-radius:5px; font-size:12px; color:var(--text-muted); border: 1px dashed var(--accent-danger);">
            <strong>🔍 BẢNG GỠ LỖI (DEBUG LOG):</strong><br/><br/>
            - <strong>Số lượng từ khóa đọc được từ Link Keyword:</strong> <span style="color:var(--text-main);">${keywordMap.length}</span> từ.<br/>
            - <strong>Danh sách từ khóa:</strong> <span style="color:var(--text-main);">${kwPreview}</span><br/><br/>
            - <strong>Danh sách Tên Cột Data đọc được:</strong> <span style="color:var(--text-main);">${dbKeys}</span>
        </div>
    `;

    reportContent.innerHTML = html;
    
    // Populate Table
    renderTable(keepPage ? currentPage : 1);
}

// Table Pagination
let currentPage = 1;
const rowsPerPage = 15;

function renderTable(page) {
    const tbody = document.getElementById('table-body');
    const data = AppState.mappedData;
    const totalPages = Math.ceil(data.length / rowsPerPage);
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
    
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = data.slice(start, end);
    
    tbody.innerHTML = '';
    pageData.forEach((row, i) => {
        const globalIndex = start + i;
        
        // Tạo HTML cho Dropdown list dựa trên danh sách nhãn đã có
        let optionsHtml = AppState.uniqueLabels.map(l => 
            `<option value="${l}" ${l === row.mapped_label ? 'selected' : ''}>${l}</option>`
        ).join('');
        
        // Bổ sung thêm nhãn nếu nhãn hiện tại không nằm trong bộ keyword map
        if (!AppState.uniqueLabels.includes(row.mapped_label)) {
            optionsHtml += `<option value="${row.mapped_label}" selected>${row.mapped_label}</option>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.clean_order}</td>
            <td>${row.clean_week}</td>
            <td>${row.clean_type}</td>
            <td>${row.clean_gxt}</td>
            <td>${row.mapped_ktc}</td>
            <td>${row.clean_client}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.damage_details || ''}">
                ${row.damage_details || ''}
            </td>
            <td>
                <select class="label-select" data-index="${globalIndex}" title="Thay đổi nhãn">
                    ${optionsHtml}
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('page-info').textContent = `Trang ${currentPage} / ${totalPages || 1}`;
}

document.getElementById('prev-page').addEventListener('click', () => renderTable(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => renderTable(currentPage + 1));

// Sửa label trực tiếp trên bảng thông qua Dropdown (Select)
document.getElementById('table-body').addEventListener('change', (e) => {
    if (e.target.classList.contains('label-select')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const newVal = e.target.value;
        
        if (AppState.mappedData[idx] && AppState.mappedData[idx].mapped_label !== newVal) {
            AppState.mappedData[idx].mapped_label = newVal;
            
            // Xây dựng lại biểu đồ và báo cáo mà KHÔNG reset lại trang table hiện tại
            buildDashboard();
            generateReport(true);
            
            // Lưu lại state để không mất khi F5
            saveStateToDB();
        }
    }
});

// Xuất file Excel/CSV
document.getElementById('btn-export-report').addEventListener('click', () => {
    if (!AppState.mappedData || AppState.mappedData.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }
    
    // Tự động sử dụng SheetJS (đã được load qua CDN)
    const ws = XLSX.utils.json_to_sheet(AppState.mappedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mapped_Data");
    
    // Tạo tên file có ngày tháng
    const dateObj = new Date();
    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}${(dateObj.getMonth()+1).toString().padStart(2, '0')}${dateObj.getFullYear()}`;
    const filename = `B2B_Damage_Report_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, filename);
});

// Restore State on Load
loadStateFromDB().then(savedState => {
    if (savedState && savedState.filesLoaded) {
        Object.assign(AppState, savedState);
        
        // Khôi phục UI import
        ['db', 'kw', 'gxt'].forEach(type => {
            if (AppState.filesLoaded[type]) {
                const statusEl = document.getElementById(`status-${type}`);
                const box = document.getElementById(`drop-${type}`);
                if (statusEl) {
                    statusEl.textContent = `Đã khôi phục từ phiên trước`;
                    statusEl.style.color = 'var(--accent-success)';
                }
                if (box) box.classList.add('success');
            }
        });
        
        checkAllFilesLoaded();
        
        // Nếu đã từng mapping và xem dashboard
        if (AppState.mappedData && AppState.mappedData.length > 0) {
            document.getElementById('nav-dashboard').style.display = 'flex';
            document.getElementById('nav-report').style.display = 'flex';
            
            buildDashboard();
            generateReport(true);
            
            // Tự động chuyển qua trang Dashboard
            navItems[1].click();
        }
    }
}).catch(e => console.error("Không thể khôi phục state:", e));
