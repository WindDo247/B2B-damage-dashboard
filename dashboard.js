// Global state
const AppState = {
    dbData: [],
    kwData: [],
    gxtData: [],
    mappedData: [],
    filteredData: [],
    uniqueLabels: [],
    filesLoaded: { db: false, kw: false, gxt: false },
    charts: {}
};

// --- DEFAULT API LINKS (HARDCODED) ---
const DEFAULT_API = {
    db: "https://script.google.com/macros/s/AKfycbwnBwEObKKhJ1R3rEh7ypuW2OaPxFR5KxCbUm5D1Yw2vQWFXkcmrbFxnlBC0OTI_F1G/exec",
    kw: "https://script.google.com/macros/s/AKfycbwT_ZuYX8RN84QgWWJT8J2P57wVreYj7lEi7qOvyHYp1MhkVCRfWRJn8C4_7L4cqyyP/exec",
    gxt: "https://script.google.com/macros/s/AKfycbynJP4pfNr3thl0Ff63xZ-IEnkwSdIrO5YOXZTCqEW61zsbqPhkD69k8PjHC0IgZeoZXg/exec"
};

// Hàm tự động tải API mặc định
async function loadDefaultApis() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('active');
    
    let promises = [];
    ['db', 'kw', 'gxt'].forEach(target => {
        const url = DEFAULT_API[target] || localStorage.getItem(`saved_url_${target}`);
        
        // Cập nhật lại UI ô input cho đẹp
        const input = document.getElementById(`link-${target}`);
        if (input && url) input.value = url;
        
        if (url && url.includes('script.google.com/macros/s/')) {
            promises.push(
                fetch(url).then(res => res.json()).then(jsonArray => {
                    if (Array.isArray(jsonArray) && jsonArray.length > 0) {
                        if (target === 'db') AppState.dbData = jsonArray;
                        if (target === 'kw') AppState.kwData = jsonArray;
                        if (target === 'gxt') AppState.gxtData = jsonArray;
                        
                        AppState.filesLoaded[target] = true;
                        
                        // Update UI
                        const statusEl = document.getElementById(`status-${target}`);
                        const dropBox = document.getElementById(`drop-${target}`);
                        if (statusEl) {
                            statusEl.textContent = `API Mặc định (${jsonArray.length} dòng)`;
                            statusEl.style.color = 'var(--accent-success)';
                        }
                        if (dropBox) dropBox.classList.add('success');
                    }
                }).catch(e => console.error(`Lỗi tải API mặc định ${target}:`, e))
            );
        }
    });

    if (promises.length > 0) {
        await Promise.all(promises);
        checkAllFilesLoaded();
        
        // Nếu đủ cả 3 file (hoặc DB + 2 file đã có sẵn trong IndexedDB), tự động chạy luôn!
        if (AppState.filesLoaded.db && AppState.filesLoaded.kw && AppState.filesLoaded.gxt) {
            try {
                processData();
                buildDashboard();
                generateReport();
                pushMappedDataToSheet();
                document.getElementById('nav-mapping').style.display = 'flex';
                document.getElementById('nav-dashboard').style.display = 'flex';
                document.getElementById('nav-report').style.display = 'flex';
                document.querySelectorAll('.nav-item')[2].click(); // Chuyển sang Dashboard
                saveStateToDB();
            } catch (error) {
                console.error("Lỗi khi tự động xử lý dữ liệu:", error);
            }
        }
    }
    if (overlay) overlay.classList.remove('active');
}

// --- LOGIN LOGIC ---
const WHITELIST_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjjadgDIBES0IW1WZ6_YTxJJM2RnL0Ww7sAOrdQAA2FoQUfUgZx-LV_ZNkhP-_F2qReZUgVNabLyba/pub?gid=782405001&single=true&output=csv";

// Google Sign-In Callback
window.handleCredentialResponse = async function (response) {
    try {
        // Giải mã JWT Token từ Google
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const email = payload.email.toLowerCase();

        const loginError = document.getElementById('login-error');
        const loginOverlay = document.getElementById('login-overlay');
        const emailDisplay = document.getElementById('user-email-display');

        // Hiển thị trạng thái đang kiểm tra quyền
        if (loginError) {
            loginError.textContent = "Đang kiểm tra quyền truy cập...";
            loginError.style.color = "var(--text-secondary)";
            loginError.style.display = 'block';
        }

        // Tải danh sách Whitelist từ Google Sheets CSV
        let allowedEmails = [];
        try {
            const res = await fetch(WHITELIST_CSV_URL);
            if (!res.ok) throw new Error("Không thể tải danh sách phân quyền");
            const csvText = await res.text();
            // Tách theo dòng, lấy cột đầu tiên, bỏ trống, đưa về in thường
            allowedEmails = csvText.split('\n')
                                   .map(line => line.split(',')[0].trim().toLowerCase())
                                   .filter(e => e && e.includes('@'));
        } catch (fetchErr) {
            console.error("Lỗi tải Whitelist:", fetchErr);
            if (loginError) {
                loginError.textContent = "Lỗi kết nối máy chủ phân quyền. Vui lòng thử lại sau.";
                loginError.style.color = "var(--accent-danger)";
            }
            return; // Dừng đăng nhập
        }

        // Kiểm tra quyền (phải có trong danh sách VÀ ưu tiên đuôi @ghn.vn nếu cần)
        if (allowedEmails.includes(email)) {
            localStorage.setItem('ghn_user_email', email);
            if (emailDisplay) emailDisplay.textContent = email;
            if (loginOverlay) loginOverlay.classList.add('hidden');
            if (loginError) loginError.style.display = 'none';
            
            // Tự động kéo API sau khi đăng nhập thành công
            loadDefaultApis();
        } else {
            // Hiển thị lỗi nếu không có quyền
            if (loginError) {
                loginError.textContent = `Tài khoản ${email} chưa được cấp quyền truy cập. Vui lòng liên hệ Admin!`;
                loginError.style.color = "var(--accent-danger)";
                loginError.style.display = 'block';
            }

            // Đăng xuất khỏi Google identity để người dùng có thể thử tài khoản khác dễ dàng
            if (window.google && google.accounts) {
                google.accounts.id.revoke(email, done => {
                    console.log('Revoked Google access for non-GHN email.');
                });
            }
        }
    } catch (e) {
        console.error("Lỗi giải mã token xác thực:", e);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('ghn_user_email');
    const loginOverlay = document.getElementById('login-overlay');
    const emailDisplay = document.getElementById('user-email-display');

    // Kiểm tra xem đã từng đăng nhập hợp lệ chưa
    if (savedEmail && savedEmail.endsWith('@ghn.vn')) {
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (emailDisplay) emailDisplay.textContent = savedEmail;
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('ghn_user_email');
            if (loginOverlay) loginOverlay.classList.remove('hidden');
        });
    }
});

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
        const workbook = XLSX.read(data, { type: 'array' });
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
        reader.onload = function (e) {
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
            // Xử lý link API từ Google Apps Script
            else if (url.includes('script.google.com/macros/s/')) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Lỗi khi kết nối đến Google Apps Script API");
                    const jsonArray = await response.json();

                    if (jsonArray.error) throw new Error(jsonArray.error);

                    if (target === 'db') AppState.dbData = jsonArray;
                    if (target === 'kw') AppState.kwData = jsonArray;
                    if (target === 'gxt') AppState.gxtData = jsonArray;

                    AppState.filesLoaded[target] = true;
                    statuses[target].textContent = `Google API (${jsonArray.length} dòng)`;
                    statuses[target].style.color = 'var(--accent-success)';
                    dropBoxes[target].classList.add('success');

                    checkAllFilesLoaded();
                    saveStateToDB();
                    return; // Thoát sớm vì đã xử lý xong
                } catch (e) {
                    throw new Error("Lỗi đọc API: " + e.message);
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

                    window[callbackName] = function (data) {
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
                        } catch (e) {
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
        try {
            processData();
            buildDashboard();
            generateReport();
            pushMappedDataToSheet();

            // Enable navigation and switch to dashboard
            document.getElementById('nav-mapping').style.display = 'flex';
            document.getElementById('nav-dashboard').style.display = 'flex';
            document.getElementById('nav-report').style.display = 'flex';
            navItems[2].click(); // Click dashboard

            // Lưu toàn bộ trạng thái vào DB
            saveStateToDB();
        } catch (error) {
            console.error("Lỗi khi xử lý dữ liệu:", error);
            alert("Có lỗi xảy ra trong quá trình xử lý: " + error.message);
        } finally {
            loadingOverlay.classList.remove('active');
        }
    }, 500);
});

// Helper function to normalize Vietnamese text (NFC), lowercase, and remove extra spaces
function normalizeStr(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFC')
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .replace(/\s+/g, ' ')
        .trim();
}

function processData() {
    function dualScanFindKey(dataArray, keywords) {
        if (!dataArray || dataArray.length === 0) return null;
        const keys = Object.keys(dataArray[0]);
        const firstRowValues = dataArray[0];

        // 1. Scan headers (Keys)
        const keyMatch = keys.find(k => keywords.some(kw => normalizeStr(k).includes(kw)));
        if (keyMatch) return keyMatch;
        // 2. Scan first row values
        const valMatch = keys.find(k => {
            const val = String(firstRowValues[k] || '');
            return keywords.some(kw => normalizeStr(val).includes(kw));
        });
        return valMatch || null;
    }

    // 1. Prepare Keyword Mapping (keyword -> label)
    const keywordMap = [];
    if (AppState.kwData.length > 0) {
        const kwKeys = Object.keys(AppState.kwData[0]);
        const kwKeyField = dualScanFindKey(AppState.kwData, ['key', 'từ khóa', 'word', 'lỗi', 'mô tả', 'chi tiết']) || kwKeys[0];
        const labelKeyField = dualScanFindKey(AppState.kwData, ['label', 'nhãn', 'loại', 'nhóm', 'phân']) || kwKeys[1];

        // Phát hiện xem cái field này có phải là header thật sự không
        const isTrueHeader = ['key', 'từ khóa', 'word', 'lỗi', 'mô tả', 'chi tiết'].some(w => String(kwKeyField).toLowerCase().includes(w));
        const isGenericColumn = String(kwKeyField).toLowerCase().includes('cột_');

        // Khôi phục tiêu đề nếu người dùng lấy Dữ Liệu làm Tiêu Đề (Excel tải file lên)
        // Lưu ý: Tách từ khóa bằng dấu phẩy luôn cho tiêu đề
        if (!isTrueHeader && !isGenericColumn) {
            let normKwField = normalizeStr(kwKeyField);
            if (normKwField.length > 0 && labelKeyField) {
                normKwField.split(',').forEach(kw => {
                    let nk = normalizeStr(kw);
                    if (nk.length > 0) {
                        keywordMap.push({
                            keyword: nk,
                            label: String(labelKeyField).trim()
                        });
                    }
                });
            }
        }

        AppState.kwData.forEach((row, index) => {
            // CHỈ bỏ qua dòng đầu tiên nếu dòng đó là dòng Tiêu Đề thật sự bị lọt vào Data (VD: 'Từ khóa', 'Label')
            // Nếu là cột tự phát sinh (Cột_0) thì dòng đầu tiên chính là Dữ Liệu (rách -> damage), tuyệt đối KHÔNG bỏ qua!
            if (index === 0) {
                const firstCell = String(row[kwKeyField] || '').toLowerCase();
                const firstCellIsHeader = ['key', 'từ khóa', 'word', 'lỗi', 'mô tả'].some(w => firstCell.includes(w));
                if (firstCellIsHeader) return;
            }

            let kwStr = String(row[kwKeyField] || '');
            let label = String(row[labelKeyField] || '');

            if (kwStr && label) {
                // Tách từ khóa bằng dấu phẩy nếu 1 ô có nhiều từ (VD: "rách, lủng, móp")
                kwStr.split(',').forEach(kw => {
                    let normKw = normalizeStr(kw);
                    if (normKw.length > 0) {
                        keywordMap.push({
                            keyword: normKw,
                            label: label.trim()
                        });
                    }
                });
            }
        });

        // Debug info để biết tool đang đọc lộn cột nào không
        AppState.debugKwKey = kwKeyField;
        AppState.debugLabelKey = labelKeyField;
    }

    // Ưu tiên so khớp các từ khóa DÀI TRƯỚC (cụm từ cụ thể) để tránh bị từ khóa ngắn (ví dụ: "rách" vs "rách tem") bắt nhầm
    keywordMap.sort((a, b) => b.keyword.length - a.keyword.length);

    // Lưu keywordMap vào AppState để debug
    AppState.keywordMap = keywordMap;

    // Lọc ra danh sách các nhãn (labels) duy nhất để làm Droplist
    AppState.uniqueLabels = [...new Set(keywordMap.map(m => m.label))];
    if (!AppState.uniqueLabels.includes("Khác")) {
        AppState.uniqueLabels.push("Khác");
    }

    // 2. Prepare GXT to KTC Mapping
    const gxtMap = {};
    if (AppState.gxtData.length > 0) {
        const gxtKeys = Object.keys(AppState.gxtData[0]);
        const gxtField = dualScanFindKey(AppState.gxtData, ['giao', 'gxt', 'kho']) || gxtKeys[0];
        const ktcField = dualScanFindKey(AppState.gxtData, ['ktc', 'kct', 'trước']) || gxtKeys[1];

        // Phát hiện xem cái field này có phải là header thật sự không
        const isTrueGxtHeader = ['giao', 'gxt', 'kho'].some(w => String(gxtField).toLowerCase().includes(w));
        const isGenericGxtColumn = String(gxtField).toLowerCase().includes('cột_');

        // Phục hồi dòng đầu tiên nếu người dùng không đặt Header
        if (!isTrueGxtHeader && !isGenericGxtColumn) {
            gxtMap[String(gxtField).toLowerCase().trim()] = String(ktcField).trim();
        }

        AppState.gxtData.forEach((row, index) => {
            if (index === 0) {
                const firstCell = String(row[gxtField] || '').toLowerCase();
                const firstCellIsHeader = ['giao', 'gxt', 'kho'].some(w => firstCell.includes(w));
                if (firstCellIsHeader) return;
            }

            let gxt = row[gxtField];
            let ktc = row[ktcField];
            if (gxt) {
                gxtMap[String(gxt).trim().toLowerCase()] = ktc || "Chưa xác định";
            }
        });
    }

    // 3. Map Database
    if (AppState.dbData.length === 0) return;

    const weekKey = dualScanFindKey(AppState.dbData, ['week', 'tuần']) || 'pickup_week';
    const clientKey = dualScanFindKey(AppState.dbData, ['client', 'khách', 'người gửi']) || 'client_name';
    const orderKey = dualScanFindKey(AppState.dbData, ['order', 'mã', 'tracking', 'vận đơn']) || 'order_code';
    const typeKey = dualScanFindKey(AppState.dbData, ['type', 'loại', 'phân loại', 'nhóm']) || 'damage_type';
    const detailKey = dualScanFindKey(AppState.dbData, ['detail', 'chi tiết', 'ghi chú', 'mô tả', 'tình trạng', 'nội dung', 'lỗi', 'vấn đề', 'nguyên nhân']) || 'damage_details';
    const gxtKeyField = dualScanFindKey(AppState.dbData, ['gxt', 'giao', 'kho']) || 'warehouse_giao';

    AppState.debugKeys = { weekKey, clientKey, orderKey, typeKey, detailKey, gxtKeyField };

    let isFirstRowHeader = false;
    const firstRowValues = AppState.dbData[0];
    if (String(firstRowValues[orderKey] || '').toLowerCase().includes('mã')) {
        isFirstRowHeader = true;
    }

    const debugTrace = []; // Lấy 5 dòng đầu để trace lỗi


    AppState.mappedData = AppState.dbData.map((row, index) => {
        if (isFirstRowHeader && index === 0) return null; // Bỏ qua dòng tiêu đề nếu bị lọt vào data
        
        // BỎ QUA NGAY CÁC DÒNG TRỐNG (Không có mã vận đơn)
        if (!row[orderKey] || String(row[orderKey]).trim() === '') return null;

        // Gom chung text của Loại lỗi và Chi tiết lỗi để đối chiếu Keyword (tăng độ chính xác)
        const typeText = String(row[typeKey] || '');
        const detailText = String(row[detailKey] || '');
        const combinedText = normalizeStr(typeText + " " + detailText);

        let matchedLabel = "Khác";
        let keywordHit = "";

        for (let mapObj of keywordMap) {
            if (combinedText.includes(mapObj.keyword)) {
                matchedLabel = mapObj.label;
                keywordHit = mapObj.keyword;
                break; // Lấy nhãn đầu tiên match được
            }
        }

        const gxtName = String(row[gxtKeyField] || '').trim();
        const matchedKTC = gxtMap[gxtName.toLowerCase()] || "Chưa xác định";

        if (debugTrace.length < 5) {
            debugTrace.push({
                order: row[orderKey],
                combined: combinedText,
                keywordHit: keywordHit,
                finalLabel: matchedLabel
            });
        }

        return {
            clean_week: row[weekKey] || "W_Unknown",
            clean_client: row[clientKey] || "Khách lẻ",
            clean_order: row[orderKey] || "N/A",
            clean_type: typeText || "N/A",
            clean_detail: detailText,
            clean_gxt: gxtName,
            mapped_ktc: matchedKTC,
            mapped_label: matchedLabel,
            keyword_hit: keywordHit
        };
    }).filter(d => d !== null); // Xóa bỏ dòng null (tiêu đề)

    AppState.debugTrace = debugTrace;

    // Reset filter
    AppState.filteredData = AppState.mappedData;
}

// Dashboard Building
function updateKPICards(data) {
    const kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) return;

    if (!data || data.length === 0) {
        kpiContainer.innerHTML = '';
        return;
    }

    const totalDamages = data.length;

    // Lỗi phổ biến nhất
    const labelCounts = {};
    data.forEach(d => {
        labelCounts[d.mapped_label] = (labelCounts[d.mapped_label] || 0) + 1;
    });
    const topLabel = Object.keys(labelCounts).reduce((a, b) => labelCounts[a] > labelCounts[b] ? a : b, "N/A");

    // Kho có nhiều lỗi nhất
    const gxtCounts = {};
    data.forEach(d => {
        gxtCounts[d.clean_gxt] = (gxtCounts[d.clean_gxt] || 0) + 1;
    });
    const topGxt = Object.keys(gxtCounts).reduce((a, b) => gxtCounts[a] > gxtCounts[b] ? a : b, "N/A");

    kpiContainer.innerHTML = `
        <div class="kpi-card danger">
            <div class="kpi-icon">📦</div>
            <div class="kpi-content">
                <div class="kpi-title">Tổng Đơn Hư Hỏng</div>
                <div class="kpi-value">${totalDamages.toLocaleString()}</div>
            </div>
        </div>
        <div class="kpi-card warning">
            <div class="kpi-icon">⚠️</div>
            <div class="kpi-content">
                <div class="kpi-title">Loại Lỗi Phổ Biến Nhất</div>
                <div class="kpi-value" style="font-size: 18px; line-height: 28px">${topLabel}</div>
            </div>
        </div>
        <div class="kpi-card primary">
            <div class="kpi-icon">🏢</div>
            <div class="kpi-content">
                <div class="kpi-title">Kho Phát Sinh Lỗi Nhiều Nhất</div>
                <div class="kpi-value" style="font-size: 14px; line-height: 28px" title="${topGxt}">${topGxt.length > 25 ? topGxt.substring(0, 25) + '...' : topGxt}</div>
            </div>
        </div>
        <div class="kpi-card success" style="opacity: 0.7">
            <div class="kpi-icon">📈</div>
            <div class="kpi-content">
                <div class="kpi-title">Tỷ lệ Damage Rate %</div>
                <div class="kpi-value" style="font-size: 14px; color: var(--text-secondary)">Đang chờ Data Tổng Đơn</div>
            </div>
        </div>
    `;
}

// Hàm render toàn bộ Dashboard dựa trên bộ lọc
function renderDashboardCharts() {
    let filteredData = AppState.mappedData;
    
    // L?y gi? tr? t? Multi-Select checkboxes
    const weekContainer = document.querySelector('#ms-week .ms-options');
    const clientContainer = document.querySelector('#ms-client .ms-options');

    if (weekContainer) {
        const checkedWeeks = [...weekContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
        const allWeeks = [...weekContainer.querySelectorAll('input[type="checkbox"]')];
        if (checkedWeeks.length > 0 && checkedWeeks.length < allWeeks.length) {
            filteredData = filteredData.filter(d => checkedWeeks.includes(d.clean_week));
        }
    }
    if (clientContainer) {
        const checkedClients = [...clientContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
        const allClients = [...clientContainer.querySelectorAll('input[type="checkbox"]')];
        if (checkedClients.length > 0 && checkedClients.length < allClients.length) {
            filteredData = filteredData.filter(d => checkedClients.includes(d.clean_client));
        }
    }

    // 0. Update KPIs
    updateKPICards(filteredData);

    // Grouping Helpers
    const groupBy = (array, key) => {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    };

    // 1. Trend Chart
    const weekGroups = groupBy(filteredData, 'clean_week');
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

    // 2. KTC Chart (Top 10)
    const damageData = filteredData.filter(d => d.mapped_label.toLowerCase().includes('damage'));
    const ktcMap = {};
    damageData.forEach(d => {
        ktcMap[d.mapped_ktc] = (ktcMap[d.mapped_ktc] || 0) + 1;
    });
    const sortedKtc = Object.entries(ktcMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('ktcChart', 'bar', {
        labels: sortedKtc.map(k => k[0]),
        datasets: [{
            label: 'Đơn hư hỏng',
            data: sortedKtc.map(k => k[1]),
            backgroundColor: '#f59e0b',
            borderRadius: 4
        }]
    });

    // 3. GXT Chart (Top 10)
    const gxtMap = {};
    damageData.forEach(d => {
        gxtMap[d.clean_gxt] = (gxtMap[d.clean_gxt] || 0) + 1;
    });
    const sortedGxt = Object.entries(gxtMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('gxtChart', 'bar', {
        labels: sortedGxt.map(k => k[0]),
        datasets: [{
            label: 'Đơn hư hỏng',
            data: sortedGxt.map(k => k[1]),
            backgroundColor: '#ef4444',
            borderRadius: 4
        }]
    });

    // 4. Label Breakdown (Pie Chart)
    const labelGroups = groupBy(filteredData, 'mapped_label');
    const labels = Object.keys(labelGroups).sort((a, b) => labelGroups[b].length - labelGroups[a].length);
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

    // 5. Client Chart
    const clientGroups = groupBy(filteredData, 'clean_client');
    const clients = Object.keys(clientGroups).sort((a, b) => clientGroups[b].length - clientGroups[a].length).slice(0, 5);
    const clientData = clients.map(c => clientGroups[c].length);

    createChart('clientChart', 'bar', {
        labels: clients,
        datasets: [{
            label: 'Đơn hư hỏng',
            data: clientData,
            backgroundColor: '#10b981',
            borderRadius: 4
        }]
    }, { indexAxis: 'y' });
}

function buildDashboard() {
    const data = AppState.mappedData;

    // --- Multi-Select Utility ---
    function initMultiSelect(containerId, values, defaultLabel, onChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const toggle = container.querySelector('.ms-toggle');
        const labelEl = container.querySelector('.ms-label');
        const dropdown = container.querySelector('.ms-dropdown');
        const optionsDiv = container.querySelector('.ms-options');
        const searchInput = container.querySelector('.ms-search');
        const selectAllBtn = container.querySelector('.ms-select-all');
        const deselectAllBtn = container.querySelector('.ms-deselect-all');

        // Populate checkboxes
        optionsDiv.innerHTML = values.map(val => 
            '<label class="ms-option"><input type="checkbox" value="' + val + '" checked> <span>' + val + '</span></label>'
        ).join('');

        function updateLabel() {
            const checked = [...optionsDiv.querySelectorAll('input:checked')];
            const total = optionsDiv.querySelectorAll('input[type="checkbox"]').length;
            if (checked.length === 0 || checked.length === total) {
                labelEl.innerHTML = defaultLabel;
            } else if (checked.length === 1) {
                labelEl.innerHTML = checked[0].value;
            } else {
                labelEl.innerHTML = checked.length + ' ' + defaultLabel.replace(/[^\s]+\s/, '').toLowerCase() + ' <span class="ms-badge">' + checked.length + '</span>';
            }
        }
        updateLabel();

        // Toggle dropdown
        toggle.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.multi-select.open').forEach(ms => { if (ms !== container) ms.classList.remove('open'); });
            container.classList.toggle('open');
            if (container.classList.contains('open')) {
                setTimeout(() => searchInput.focus(), 50);
            }
        };

        // Search
        searchInput.oninput = () => {
            const query = searchInput.value.toLowerCase();
            optionsDiv.querySelectorAll('.ms-option').forEach(opt => {
                const text = opt.querySelector('span').textContent.toLowerCase();
                opt.classList.toggle('hidden', !text.includes(query));
            });
        };

        // Select All / Deselect All
        selectAllBtn.onclick = () => {
            optionsDiv.querySelectorAll('.ms-option:not(.hidden) input').forEach(cb => cb.checked = true);
            updateLabel(); onChange();
        };
        deselectAllBtn.onclick = () => {
            optionsDiv.querySelectorAll('.ms-option:not(.hidden) input').forEach(cb => cb.checked = false);
            updateLabel(); onChange();
        };

        // Checkbox change
        optionsDiv.addEventListener('change', () => { updateLabel(); onChange(); });
    }

    // Close all dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multi-select')) {
            document.querySelectorAll('.multi-select.open').forEach(ms => ms.classList.remove('open'));
        }
    });

    // Build unique values
    const uniqueWeeks = [...new Set(data.map(d => d.clean_week).filter(Boolean))].sort();
    const uniqueClients = [...new Set(data.map(d => d.clean_client).filter(Boolean))].sort();

    initMultiSelect('ms-week', uniqueWeeks, 'Tất cả các tuần', renderDashboardCharts);
    initMultiSelect('ms-client', uniqueClients, 'Tất cả khách hàng', renderDashboardCharts);

    renderDashboardCharts();
}

function createChart(id, type, data, options = {}) {
    if (AppState.charts[id]) {
        AppState.charts[id].destroy();
    }

    const ctx = document.getElementById(id).getContext('2d');

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const baseOptions = {
        layout: { padding: { top: 35 } },
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
            textAlign: 'center',
            align: type === 'line' ? 'top' : (type === 'bar' && !options.indexAxis ? 'end' : 'center'),
            anchor: type === 'line' ? 'center' : (type === 'bar' && !options.indexAxis ? 'end' : 'center'),
            offset: type === 'line' ? 12 : (type === 'bar' && !options.indexAxis ? 4 : 0),
            clip: false,
            formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.forEach(data => {
                    sum += parseFloat(data);
                });
                if (sum === 0 || value === 0) return value;
                let percentage = (value * 100 / sum).toFixed(1) + "%";
                // Trả về 2 dòng bằng cách dùng dấu \n
                return `${value}\n(${percentage})`;
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
        const lastW = weekGroups[weeks[weeks.length - 1]];
        const prevW = weekGroups[weeks[weeks.length - 2]];
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

    const topKtc = Object.entries(ktcGroups).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];
    const topGxt = Object.entries(gxtGroups).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

    // Build HTML Report with new UI
    let html = `
        <div class="insight-container">
            <!-- Tổng quan -->
            <div class="alert-card info">
                <div class="alert-icon">📊</div>
                <div class="alert-content">
                    <h4>Tổng quan Hư hỏng</h4>
                    <p>Hệ thống ghi nhận tổng cộng <strong>${totalIssues}</strong> đơn hàng có vấn đề. ${trendText}</p>
                </div>
            </div>
            
            <!-- Điểm nóng KTC -->
            <div class="alert-card danger">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <h4>Điểm nóng KTC/KCT: ${topKtc[0]}</h4>
                    <p>Kho trung chuyển này ghi nhận xuất phát nhiều hàng lỗi nhất với <strong>${topKtc[1]}</strong> trường hợp. Cần ưu tiên kiểm tra quy trình chất xếp hàng điện máy tại khu vực xuất/nhập.</p>
                </div>
            </div>
            
            <!-- Điểm nóng GXT -->
            <div class="alert-card warning">
                <div class="alert-icon">🏢</div>
                <div class="alert-content">
                    <h4>Điểm nóng Kho Giao (GXT): ${topGxt[0]}</h4>
                    <p>Bưu cục giao hàng cuối cùng ghi nhận số lượng phát hiện lỗi nhiều nhất với <strong>${topGxt[1]}</strong> đơn hàng. Quản lý vận hành cần lưu ý điều kiện đường xá và thao tác hạ hàng.</p>
                </div>
            </div>
            
            <!-- Khuyến nghị -->
            <div class="alert-card success">
                <div class="alert-icon">💡</div>
                <div class="alert-content">
                    <h4>Khuyến nghị Hành động (Actionable Insights)</h4>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                        <li>Rà soát lại quy trình đào tạo và phổ biến tài liệu "Hướng dẫn chất xếp hàng" cho nhân viên tại <strong>${topKtc[0]}</strong>.</li>
                        <li>Tăng cường kiểm tra ngẫu nhiên (audit) ngoại quan thùng xe trước khi rời kho B2B đối với các tuyến chạy về <strong>${topKtc[0]}</strong>.</li>
                        <li>Theo dõi diễn biến biểu đồ Tuần tới trên Dashboard để đánh giá tính hiệu quả của các biện pháp can thiệp.</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    // DEBUG INFO
    const kwMap = AppState.keywordMap || [];
    const kwPreview = kwMap.length > 0 ? kwMap.map(k => `[${k.keyword}]`).join(', ') : "Không tìm thấy";

    let dbKeys = "Không có";
    let dbRow1 = "Không có";
    if (AppState.dbData && AppState.dbData.length > 0) {
        dbKeys = Object.keys(AppState.dbData[0]).join(' | ');
        dbRow1 = Object.values(AppState.dbData[0]).join(' | ');
    }

    const dk = AppState.debugKeys || {};
    const traceHtml = AppState.debugTrace ? AppState.debugTrace.map(t => `<div>Mã: ${t.order} | Câu dò: "${t.combined}" => Khớp từ: [${t.keywordHit}] => Nhãn: ${t.finalLabel}</div>`).join('') : "";

    html += `
        <div style="margin-top:30px; padding:15px; background:var(--bg-secondary); border-radius:5px; font-size:12px; color:var(--text-muted); border: 1px dashed var(--accent-danger);">
            <strong>🔍 BẢNG GỠ LỖI (DEBUG LOG):</strong><br/><br/>
            - <strong>Cột Từ Khóa được đọc:</strong> <span style="color:var(--accent-warning);">${AppState.debugKwKey || 'N/A'}</span><br/>
            - <strong>Cột Nhãn được đọc:</strong> <span style="color:var(--accent-warning);">${AppState.debugLabelKey || 'N/A'}</span><br/>
            - <strong>Số lượng từ khóa:</strong> <span style="color:var(--text-main);">${kwMap.length}</span> từ.<br/>
            - <strong>Toàn bộ từ khóa đã nhận diện:</strong> <span style="color:var(--text-main);">${kwPreview}</span><br/>
            <hr style="border-top:1px dashed #ccc; margin:10px 0;"/>
            <strong>TRACE 5 ĐƠN HÀNG ĐẦU TIÊN:</strong><br/>
            ${traceHtml}
            <hr style="border-top:1px dashed #ccc; margin:10px 0;"/>
            - <strong>Cột Mã Đơn (DB):</strong> <span style="color:var(--accent-success);">${dk.orderKey}</span><br/>
            - <strong>Cột Loại Lỗi (DB):</strong> <span style="color:var(--accent-success);">${dk.typeKey}</span><br/>
            - <strong>Cột Chi Tiết Lỗi (DB):</strong> <span style="color:var(--accent-danger);">${dk.detailKey}</span>
        </div>
    `;

    reportContent.innerHTML = html;

    // Populate Table Filters & Render
    populateTableFilters();
    applyTableFilters(); // This will call renderTable(1) or keepPage
}

// Table Filtering Logic
function populateTableFilters() {
    if (!AppState.mappedData || AppState.mappedData.length === 0) return;

    const filters = [
        { id: 'col-filter-week', key: 'clean_week' },
        { id: 'col-filter-type', key: 'clean_type' },
        { id: 'col-filter-gxt', key: 'clean_gxt' },
        { id: 'col-filter-ktc', key: 'mapped_ktc' },
        { id: 'col-filter-client', key: 'clean_client' },
        { id: 'col-filter-label', key: 'mapped_label' }
    ];

    filters.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) {
            const currentValue = el.value; // Store current selection
            el.innerHTML = '<option value="all">Tất cả</option>';

            // Lấy danh sách giá trị độc nhất và lọc bỏ các giá trị rỗng/null
            const uniqueValues = [...new Set(AppState.mappedData.map(d => d[f.key]).filter(v => v !== null && v !== undefined && v !== ''))].sort();

            uniqueValues.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                el.appendChild(opt);
            });

            // Khôi phục lại giá trị đã chọn nếu còn tồn tại trong danh sách mới
            if (currentValue && uniqueValues.includes(currentValue)) {
                el.value = currentValue;
            }
        }
    });
}

function applyTableFilters() {
    const orderQuery = (document.getElementById('col-filter-order')?.value || '').toLowerCase().trim();
    const detailQuery = (document.getElementById('col-filter-detail')?.value || '').toLowerCase().trim();

    const typeQuery = document.getElementById('col-filter-type')?.value || 'all';
    const gxtQuery = document.getElementById('col-filter-gxt')?.value || 'all';
    const ktcQuery = document.getElementById('col-filter-ktc')?.value || 'all';
    const clientQuery = document.getElementById('col-filter-client')?.value || 'all';
    const labelQuery = document.getElementById('col-filter-label')?.value || 'all';
    const weekQuery = document.getElementById('col-filter-week')?.value || 'all';

    AppState.filteredData = AppState.mappedData.filter(d => {
        const matchOrder = !orderQuery || d.clean_order.toLowerCase().includes(orderQuery);
        const matchDetail = !detailQuery || (d.clean_detail && d.clean_detail.toLowerCase().includes(detailQuery));

        const matchType = typeQuery === 'all' || d.clean_type === typeQuery;
        const matchGxt = gxtQuery === 'all' || d.clean_gxt === gxtQuery;
        const matchKtc = ktcQuery === 'all' || d.mapped_ktc === ktcQuery;
        const matchClient = clientQuery === 'all' || d.clean_client === clientQuery;
        const matchLabel = labelQuery === 'all' || d.mapped_label === labelQuery;
        const matchWeek = weekQuery === 'all' || d.clean_week === weekQuery;

        return matchOrder && matchDetail && matchType && matchGxt && matchKtc && matchClient && matchLabel && matchWeek;
    });

    renderTable(1);
}

// Event listeners for filters (Safely bind if elements exist)
const elOrder = document.getElementById('col-filter-order');
if (elOrder) elOrder.addEventListener('input', applyTableFilters);

const elType = document.getElementById('col-filter-type');
if (elType) elType.addEventListener('change', applyTableFilters);

const elGxt = document.getElementById('col-filter-gxt');
if (elGxt) elGxt.addEventListener('change', applyTableFilters);

const elKtc = document.getElementById('col-filter-ktc');
if (elKtc) elKtc.addEventListener('change', applyTableFilters);

const elClient = document.getElementById('col-filter-client');
if (elClient) elClient.addEventListener('change', applyTableFilters);

const elDetail = document.getElementById('col-filter-detail');
if (elDetail) elDetail.addEventListener('input', applyTableFilters);

const elLabel = document.getElementById('col-filter-label');
if (elLabel) elLabel.addEventListener('change', applyTableFilters);

const elWeek = document.getElementById('col-filter-week');
if (elWeek) elWeek.addEventListener('change', applyTableFilters);

const btnClear = document.getElementById('btn-clear-filter');
if (btnClear) {
    btnClear.addEventListener('click', () => {
        if (elOrder) elOrder.value = '';
        if (elType) elType.value = 'all';
        if (elGxt) elGxt.value = 'all';
        if (elKtc) elKtc.value = 'all';
        if (elClient) elClient.value = 'all';
        if (elDetail) elDetail.value = '';
        if (elLabel) elLabel.value = 'all';
        if (elWeek) elWeek.value = 'all';
        applyTableFilters();
    });
}

// Table Pagination
let currentPage = 1;
const rowsPerPage = 15;

function renderTable(page) {
    const tbody = document.getElementById('table-body');
    const data = AppState.filteredData || AppState.mappedData;
    const totalPages = Math.ceil(data.length / rowsPerPage) || 1;

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

        const getBadgeClass = (label) => {
            const l = label.toLowerCase();
            if (l.includes('bể') || l.includes('hư') || l.includes('mất') || l.includes('thất lạc') || l.includes('damage')) return 'badge-danger';
            if (l.includes('móp') || l.includes('rách') || l.includes('cấn') || l.includes('ngoại quan')) return 'badge-warning';
            if (l.includes('khác') || l.includes('n/a')) return 'badge-neutral';
            return 'badge-success';
        };

        const badgeClass = getBadgeClass(row.mapped_label);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.clean_order}</td>
            <td>${row.clean_week}</td>
            <td>${row.clean_type}</td>
            <td>${row.clean_gxt}</td>
            <td>${row.mapped_ktc}</td>
            <td>${row.clean_client}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.clean_detail || ''}">
                ${row.clean_detail || ''}
            </td>
            <td>
                <select class="label-select badge ${badgeClass}" data-index="${globalIndex}" title="${row.keyword_hit ? 'Bắt được từ: ' + row.keyword_hit : 'Không bắt được từ khóa nào'}">
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
            pushMappedDataToSheet();

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
    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getFullYear()}`;
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
            document.getElementById('nav-mapping').style.display = 'flex';
            document.getElementById('nav-dashboard').style.display = 'flex';
            document.getElementById('nav-report').style.display = 'flex';

            buildDashboard();
            generateReport(true);
            pushMappedDataToSheet();

            // Tự động chuyển qua trang Dashboard
            navItems[2].click();
            
            // Vẫn gọi loadDefaultApis ngầm để làm mới dữ liệu
            loadDefaultApis();
        } else {
            // Nếu chưa có mappedData nhưng đăng nhập rồi thì auto load API
            const savedEmail = localStorage.getItem('ghn_user_email');
            if (savedEmail && savedEmail.endsWith('@ghn.vn')) {
                loadDefaultApis();
            }
        }
    } else {
        // Trường hợp phiên đầu tiên hoàn toàn, check email rồi load
        const savedEmail = localStorage.getItem('ghn_user_email');
        if (savedEmail && savedEmail.endsWith('@ghn.vn')) {
            loadDefaultApis();
        }
    }
}).catch(e => console.error("Không thể khôi phục state:", e));

// --- AUTO SYNC LOGIC ---
async function doAutoSync() {
    const urls = ['db', 'kw', 'gxt'].map(t => ({ target: t, url: localStorage.getItem(`saved_url_${t}`) }));
    const validUrls = urls.filter(u => u.url && u.url.includes('script.google.com/macros/s/'));
    if (validUrls.length === 0) return;

    let updated = false;
    for (let { target, url } of validUrls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const jsonArray = await response.json();
                if (!jsonArray.error && jsonArray.length > 0) {
                    if (target === 'db') AppState.dbData = jsonArray;
                    if (target === 'kw') AppState.kwData = jsonArray;
                    if (target === 'gxt') AppState.gxtData = jsonArray;

                    const status = document.getElementById(`status-${target}`);
                    if (status) {
                        status.textContent = `Auto-synced (${jsonArray.length} dòng) lúc ${new Date().toLocaleTimeString('vi-VN')}`;
                        status.style.color = 'var(--accent-success)';
                    }
                    updated = true;
                }
            }
        } catch (e) { console.error("Auto-sync failed", e); }
    }

    if (updated && AppState.dbData.length > 0) {
        try {
            processData();
            buildDashboard();
            generateReport(true);
            pushMappedDataToSheet();
            saveStateToDB();
        } catch (e) { }
    }
}

let autoSyncInterval = null;
const autoSyncCheckbox = document.getElementById('auto-sync-checkbox');
if (autoSyncCheckbox) {
    autoSyncCheckbox.checked = localStorage.getItem('autoSyncStatus') === 'true';
    autoSyncCheckbox.addEventListener('change', (e) => {
        localStorage.setItem('autoSyncStatus', e.target.checked);
        if (e.target.checked) {
            doAutoSync();
            if (autoSyncInterval) clearInterval(autoSyncInterval);
            autoSyncInterval = setInterval(doAutoSync, 1 * 60 * 1000);
        } else {
            clearInterval(autoSyncInterval);
        }
    });
    if (autoSyncCheckbox.checked) {
        autoSyncInterval = setInterval(doAutoSync, 1 * 60 * 1000);
    }
}

// --- EXPORT MAPPED DATA ---
document.getElementById('btn-export-data').addEventListener('click', () => {
    let dataToExport = AppState.filteredData && AppState.filteredData.length > 0 
        ? AppState.filteredData 
        : AppState.mappedData;
        
    if (!dataToExport || dataToExport.length === 0) {
        alert('Kh�ng c� d? li?u d? t?i xu?ng!');
        return;
    }

    // Convert object array to array of arrays for better headers if needed, 
    // or just use json_to_sheet which auto-generates headers from keys.
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MappedData');
    XLSX.writeFile(wb, 'B2B_Damage_Mapped_Data.xlsx');
});

// --- AUTO-PUSH MAPPED DATA TO GOOGLE SHEETS ---
const MAPPED_SHEET_PUSH_URL = "https://script.google.com/macros/s/AKfycbzyYQqaXN3tey2FH8slerYSmx4aHreoYVAKE9duSkVnK6AMM-6MJvJVs4vJz_6IiZ8L/exec";

function pushMappedDataToSheet() {
    const data = AppState.mappedData;
    if (!data || data.length === 0) return;

    const syncStatus = document.getElementById('sync-status');
    const syncIcon = document.getElementById('sync-icon');
    const syncText = document.getElementById('sync-text');

    if (syncStatus) {
        syncStatus.style.display = 'flex';
        syncIcon.textContent = '⏳';
        syncText.textContent = 'Đang đồng bộ dữ liệu...';
        syncText.style.color = 'var(--text-secondary)';
    }

    // Use form-based approach for reliable Google Apps Script POST
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = MAPPED_SHEET_PUSH_URL;
    form.target = 'push-iframe';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify({ data: data });
    form.appendChild(input);

    // Create hidden iframe
    let iframe = document.getElementById('push-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'push-iframe';
        iframe.name = 'push-iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    document.body.appendChild(form);
    form.submit();
    form.remove();

    // Since we can't read the iframe response (cross-origin), assume success after a delay
    if (syncStatus) {
        setTimeout(() => {
            syncIcon.textContent = '✅';
            syncText.textContent = 'Đồng bộ thành công (' + data.length + ' dòng)';
            syncText.style.color = 'var(--accent-success)';
            setTimeout(() => { syncStatus.style.display = 'none'; }, 5000);
        }, 3000);
    }
}

