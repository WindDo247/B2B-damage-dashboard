// Global state
const AppState = {
    dbData: [],
    kwData: [],
    gxtData: [],
    mappedData: [],
    filteredData: [],
    uniqueLabels: [],
    filesLoaded: { db: false, kw: false, gxt: false },
    pickupData: [],
    charts: {}
};

// HTML sanitizer to prevent XSS
function esc(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// === COUNT-UP ANIMATION ===
function animateCountUp(element, target, duration = 800) {
    const start = 0;
    const startTime = performance.now();
    const isPercent = String(target).includes('%');
    const numTarget = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(numTarget)) { element.textContent = target; return; }
    
    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(eased * numTarget);
        element.textContent = current.toLocaleString() + (isPercent ? '%' : '');
        if (progress < 1) requestAnimationFrame(update);
        else {
            element.textContent = target;
            element.classList.add('count-pulse');
            setTimeout(() => element.classList.remove('count-pulse'), 400);
        }
    }
    requestAnimationFrame(update);
}

// === STAGGER ANIMATION ===
function staggerElements(selector, delay = 80) {
    document.querySelectorAll(selector).forEach((el, i) => {
        el.style.animationDelay = (i * delay) + 'ms';
        el.classList.add('stagger-in');
    });
}

// === HAMBURGER MENU ===
function initHamburger() {
    const btn = document.getElementById('hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!btn || !sidebar) return;
    
    btn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    });
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    // Close sidebar when nav item clicked (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        });
    });
}

// === SCROLL TO TOP ===
function initScrollToTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.innerHTML = '↑';
    btn.title = 'Scroll to top';
    btn.id = 'scroll-top-btn';
    document.body.appendChild(btn);
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', () => {
            btn.classList.toggle('visible', mainContent.scrollTop > 300);
        });
    }
    btn.addEventListener('click', () => {
        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function parseApiResponse(json) {
    if (Array.isArray(json)) return json;
    if (json && json.headers && json.data) {
        const h = json.headers;
        return json.data.map(row => {
            let obj = {};
            h.forEach((key, i) => { 
                const safeKey = key ? String(key).trim() : `Col_${i}`;
                obj[safeKey] = row[i]; 
            });
            return obj;
        });
    }
    return [];
}

// API auth: derive token from deployment path (not hardcoded secret)
// The token is a hash of the script URL path, unique per deployment
function getApiToken() {
    const scripts = document.querySelectorAll('script[src]');
    const mainScript = [...scripts].find(s => s.src.includes('dashboard.js'));
    const seed = mainScript ? mainScript.src : window.location.href;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    return 'tk_' + Math.abs(hash).toString(36);
}
const API_TOKEN = getApiToken();

// Them timestamp + token vao URL de chong cache va bao mat
function noCacheUrl(url) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + '_t=' + Date.now() + '&token=' + API_TOKEN;
}


// Chuan hoa ngay thanh dd/mm/yyyy
// Tu dong phat hien: yyyy-mm-dd, dd/mm/yyyy, mm/dd/yyyy
function normDate(d) {
    let s = String(d || '').trim();
    if (!s) return s;
    
    // Loai bo thoi gian (2026-06-01T00:00:00)
    s = s.split('T')[0].split(' ')[0];
    
    let p = s.split(/[/\-]/);
    if (p.length < 3) return s;
    
    let day, month, year;
    let n0 = parseInt(p[0]), n1 = parseInt(p[1]), n2 = parseInt(p[2]);
    
    if (p[0].length === 4) {
        // yyyy-mm-dd (ISO)
        year = p[0]; month = p[1].padStart(2, '0'); day = p[2].padStart(2, '0');
    } else if (p[2].length === 4) {
        // xx/yy/yyyy — smart detect dd/mm vs mm/dd
        if (n1 > 12) {
            // p[1] > 12 → p[1] phai la ngay → format la mm/dd/yyyy
            month = p[0].padStart(2, '0');
            day = p[1].padStart(2, '0');
        } else if (n0 > 12) {
            // p[0] > 12 → p[0] phai la ngay → format la dd/mm/yyyy
            day = p[0].padStart(2, '0');
            month = p[1].padStart(2, '0');
        } else {
            // Ca 2 <= 12 → mac dinh dd/mm/yyyy (Vietnamese)
            day = p[0].padStart(2, '0');
            month = p[1].padStart(2, '0');
        }
        year = p[2];
    } else {
        return s;
    }
    
    return day + '/' + month + '/' + year;
}

// Chuyen dd/mm/yyyy thanh Date object
function parseVNDate(str) {
    const p = str.split('/');
    if (p.length !== 3) return null;
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
}

// --- DEFAULT API ---
const API_BASE = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6eVlRcWFYTjN0ZXkyRkg4c2xlcllTbXg0YUhyZW9ZVkFLRTlkdVNrVm5LNkFNTS02TUp2SlZzNHZKel82SWlaOEwvZXhlYw==');
const DEFAULT_API = {
    db: API_BASE + "?sheet=Damage",
    kw: API_BASE + "?sheet=Keyword",
    gxt: API_BASE + "?sheet=Danh%20s%C3%A1ch%20KTC%20KCT",
    pickup: API_BASE + "?sheet=Pick%20Up"
};

// Hàm tự động tải API mặc định
async function loadDefaultApis() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('active');
    
    // Tải DB + KW + GXT song song (3 file nhỏ, chờ xong mới xử lý)
    let corePromises = [];
    ['db', 'kw', 'gxt'].forEach(target => {
        const url = DEFAULT_API[target];
        if (!url) return;
        
        const startTime = Date.now();
        const statusEl = document.getElementById(`status-${target}`);
        const dropBox = document.getElementById(`drop-${target}`);
        if (statusEl) {
            statusEl.textContent = '⏳ Đang tải...';
            statusEl.style.color = 'var(--text-secondary)';
        }
        
        corePromises.push(
            fetch(noCacheUrl(url)).then(res => res.json()).then(json => {
                const jsonArray = parseApiResponse(json);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                if (jsonArray.length > 0) {
                    if (target === 'db') AppState.dbData = jsonArray;
                    if (target === 'kw') AppState.kwData = jsonArray;
                    if (target === 'gxt') AppState.gxtData = jsonArray;
                    
                    AppState.filesLoaded[target] = true;
                    
                    if (statusEl) {
                        statusEl.textContent = `✅ ${jsonArray.length.toLocaleString()} dòng (${elapsed}s)`;
                        statusEl.style.color = 'var(--accent-success)';
                    }
                    if (dropBox) dropBox.classList.add('success');
                } else {
                    if (statusEl) {
                        statusEl.textContent = '⚠️ Sheet trống (0 dòng)';
                        statusEl.style.color = 'var(--accent-warning)';
                    }
                }
            }).catch(e => {
                if (statusEl) {
                    statusEl.textContent = '❌ Lỗi tải dữ liệu';
                    statusEl.style.color = 'var(--accent-danger)';
                }
            })
        );
    });

    // Tải Pickup SONG SONG nhưng KHÔNG CHỜ (dữ liệu lớn, load ngầm)
    const pickupUrl = DEFAULT_API['pickup'];
    if (pickupUrl) {
        const pickupStatusEl = document.getElementById('status-pickup');
        const pickupDropBox = document.getElementById('drop-pickup');
        if (pickupStatusEl) {
            pickupStatusEl.textContent = '⏳ Đang tải (file lớn)...';
            pickupStatusEl.style.color = 'var(--text-secondary)';
        }
        const pickupStart = Date.now();
        
        fetch(noCacheUrl(pickupUrl)).then(res => res.json()).then(json => {
            const jsonArray = parseApiResponse(json);
            const elapsed = ((Date.now() - pickupStart) / 1000).toFixed(1);
            if (jsonArray.length > 0) {
                AppState.pickupData = jsonArray;
                AppState.filesLoaded['pickup'] = true;
                
                if (pickupStatusEl) {
                    pickupStatusEl.textContent = `✅ ${jsonArray.length.toLocaleString()} dòng (${elapsed}s)`;
                    pickupStatusEl.style.color = 'var(--accent-success)';
                }
                if (pickupDropBox) pickupDropBox.classList.add('success');
                
                // Re-render dashboard khi pickup load xong (cập nhật tỉ lệ)
                const dashContent = document.getElementById('dashboard-content');
                if (dashContent && dashContent.classList.contains('active')) {
                    if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
                }
            } else {
                if (pickupStatusEl) {
                    pickupStatusEl.textContent = '⚠️ Sheet trống';
                    pickupStatusEl.style.color = 'var(--accent-warning)';
                }
            }
        }).catch(e => {
            if (pickupStatusEl) {
                pickupStatusEl.textContent = '❌ Lỗi tải Pickup';
                pickupStatusEl.style.color = 'var(--accent-danger)';
            }
        });
    }

    // Chờ 3 file core xong → auto-process (KHÔNG chờ Pickup)
    if (corePromises.length > 0) {
        await Promise.all(corePromises);
        checkAllFilesLoaded();
        
        // Chỉ cần DB là bắt buộc. KW + GXT nếu có thì tốt hơn.
        if (AppState.filesLoaded.db) {
            try {
                processData();
                buildDashboard();
                generateReport();
                pushMappedDataToSheet();
                document.getElementById('nav-mapping').style.display = 'flex';
                document.getElementById('nav-dashboard').style.display = 'flex';
                document.getElementById('nav-report').style.display = 'flex';
                document.querySelectorAll('.nav-item')[2].click();
                saveStateToDB();
                showToast('Dữ liệu đã tải thành công!', 'success');
                // Stagger chart cards
                staggerElements('.chart-card', 100);
            } catch (error) {
                console.error("Lỗi khi tự động xử lý dữ liệu.");
                showToast('Lỗi xử lý dữ liệu', 'error');
            }
        }
    }
    if (overlay) overlay.classList.remove('active');
}

// --- LOGIN LOGIC ---
// Whitelist source (encoded to avoid plaintext exposure in source)
// Whitelist check is done server-side via API

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

        // Validate JWT token
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            throw new Error("Token đã hết hạn. Vui lòng đăng nhập lại.");
        }
        if (payload.iss && !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
            throw new Error("Token không hợp lệ (issuer).");
        }
        if (!payload.email_verified) {
            throw new Error("Email chưa được xác minh.");
        }

        const loginError = document.getElementById('login-error');
        const loginOverlay = document.getElementById('login-overlay');
        const emailDisplay = document.getElementById('user-email-display');

        // Hiển thị trạng thái đang kiểm tra quyền
        if (loginError) {
            loginError.textContent = "Đang kiểm tra quyền truy cập...";
            loginError.style.color = "var(--text-secondary)";
            loginError.style.display = 'block';
        }

        // Kiểm tra quyền qua server-side API (whitelist URL không lộ ở client)
        let isAllowed = false;
        try {
            const res = await fetch(noCacheUrl(API_BASE + '?action=checkEmail&email=' + encodeURIComponent(email)));
            if (!res.ok) throw new Error('Server error');
            const result = await res.json();
            isAllowed = result.allowed === true;
        } catch (fetchErr) {
            if (loginError) {
                loginError.textContent = "Lỗi kết nối máy chủ phân quyền. Vui lòng thử lại sau.";
                loginError.style.color = "var(--accent-danger)";
            }
            return;
        }

        // Kiểm tra kết quả từ server
        if (isAllowed) {
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
                    // Revoked
                });
            }
        }
    } catch (e) {
        console.error("Lỗi xác thực.");
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
    
    // Init UI enhancements
    initHamburger();
    initScrollToTop();
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
const fileInputs = {};  // No manual file uploads — all data auto-synced from API
const statuses = {
    db: document.getElementById('status-db'),
    kw: document.getElementById('status-kw'),
    gxt: document.getElementById('status-gxt'),
    pickup: document.getElementById('status-pickup')
};
const dropBoxes = {
    db: document.getElementById('drop-db'),
    kw: document.getElementById('drop-kw'),
    gxt: document.getElementById('drop-gxt'),
    pickup: document.getElementById('drop-pickup')
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
        console.error("Lỗi đọc dữ liệu.");
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
                    // Tu dong them ?sheet=Pick%20Up neu la pickup ma user quen them
                    let apiUrl = url;
                    if (target === 'pickup' && !url.includes('sheet=')) {
                        apiUrl = url + (url.includes('?') ? '&' : '?') + 'sheet=Pick%20Up';
                    }
                    const response = await fetch(noCacheUrl(apiUrl));
                    if (!response.ok) throw new Error("Lỗi khi kết nối đến Google Apps Script API");
                    const json = await response.json();
                    const jsonArray = parseApiResponse(json);

                    if (json.error) throw new Error(json.error);

                    if (target === 'db') AppState.dbData = jsonArray;
                    if (target === 'kw') AppState.kwData = jsonArray;
                    if (target === 'gxt') AppState.gxtData = jsonArray;
                    if (target === 'pickup') AppState.pickupData = jsonArray;

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
                            if (target === 'pickup') AppState.pickupData = jsonArray;

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
            console.error('Lỗi tải URL.');
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
            console.error("Lỗi khi xử lý dữ liệu.");
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

    // Enrich mappedData with nganh_hang from pickupData
    if (AppState.pickupData && AppState.pickupData.length > 0) {
        const pickupLookup = {};
        AppState.pickupData.forEach(p => {
            const code = String(p.order_code || p['order_code'] || '').trim();
            if (code) pickupLookup[code] = {
                nganh_hang: String(p.nganh_hang || p['nganh_hang'] || '').trim(),
                service_type: String(p.service_type || p['service type'] || p['service_type'] || '').trim()
            };
        });
        AppState.mappedData.forEach(d => {
            const info = pickupLookup[d.clean_order] || {};
            d.nganh_hang = info.nganh_hang || 'Khác';
            d.service_type = info.service_type || '';
        });
    }

    // Reset filter
    AppState.filteredData = AppState.mappedData;
}

// Dashboard Building
function updateKPICards(data, totalPickup, damageRate) {
    const kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) return;

    if (!data || data.length === 0) {
        kpiContainer.innerHTML = '';
        return;
    }

    const totalDamages = data.length;

    const labelCounts = {};
    data.forEach(d => {
        labelCounts[d.mapped_label] = (labelCounts[d.mapped_label] || 0) + 1;
    });
    const topLabel = Object.keys(labelCounts).reduce((a, b) => labelCounts[a] > labelCounts[b] ? a : b, "N/A");

    const gxtCounts = {};
    data.forEach(d => {
        gxtCounts[d.clean_gxt] = (gxtCounts[d.clean_gxt] || 0) + 1;
    });
    const topGxt = Object.keys(gxtCounts).reduce((a, b) => gxtCounts[a] > gxtCounts[b] ? a : b, "N/A");

    const rateClass = damageRate > 1 ? 'danger' : damageRate >= 0.5 ? 'warning' : 'success';
    const rateColor = damageRate > 1 ? 'var(--accent-danger)' : damageRate >= 0.5 ? 'var(--accent-warning)' : 'var(--accent-success)';

    kpiContainer.innerHTML = `
        <div class="kpi-card primary">
            <div class="kpi-icon"></div>
            <div class="kpi-content">
                <div class="kpi-title">Tổng Đơn Lấy</div>
                <div class="kpi-value">${esc(totalPickup > 0 ? totalPickup.toLocaleString() : 'N/A')}</div>
            </div>
        </div>
        <div class="kpi-card danger">
            <div class="kpi-icon"></div>
            <div class="kpi-content">
                <div class="kpi-title">Tổng Đơn Bể Vỡ</div>
                <div class="kpi-value">${totalDamages.toLocaleString()}</div>
            </div>
        </div>
        <div class="kpi-card ${rateClass}">
            <div class="kpi-icon"></div>
            <div class="kpi-content">
                <div class="kpi-title">Tỷ lệ bể vỡ</div>
                <div class="kpi-value" style="color: ${rateColor}">${totalPickup > 0 ? damageRate + '%' : 'N/A'}</div>
        </div>
    `;

    // Count-up animation cho KPI values
    kpiContainer.querySelectorAll('.kpi-value').forEach(el => {
        animateCountUp(el, el.textContent);
    });
    // Stagger animation cho KPI cards
    staggerElements('.kpi-card', 100);
}

// Hàm render toàn bộ Dashboard dựa trên bộ lọc
function renderDashboardCharts() {
    let filteredData = AppState.mappedData;
    let filteredPickup = AppState.pickupData || [];
    
    // normDate is defined globally at top of file

    // Helper to normalize client names
    const normClient = (c) => {
        return String(c || '').trim();
    };

    const weekContainer = document.querySelector('#ms-week .ms-options');
    const clientContainer = document.querySelector('#ms-client .ms-options');
    const nganhContainer = document.querySelector('#ms-nganh .ms-options');

    if (weekContainer) {
        const checked = [...weekContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
        const all = [...weekContainer.querySelectorAll('input[type="checkbox"]')];
        if (checked.length > 0 && checked.length < all.length) {
            filteredData = filteredData.filter(d => checked.includes(normDate(d.clean_week)));
            filteredPickup = filteredPickup.filter(p => checked.includes(normDate(p.isoweek_pickup_time)));
        }
    }
    if (clientContainer) {
        const checked = [...clientContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
        const all = [...clientContainer.querySelectorAll('input[type="checkbox"]')];
        if (checked.length > 0 && checked.length < all.length) {
            filteredData = filteredData.filter(d => checked.includes(d.clean_client));
            filteredPickup = filteredPickup.filter(p => checked.includes(normClient(p.client_name)));
        }
    }
    if (nganhContainer) {
        const checked = [...nganhContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
        const all = [...nganhContainer.querySelectorAll('input[type="checkbox"]')];
        if (checked.length > 0 && checked.length < all.length) {
            filteredData = filteredData.filter(d => checked.includes(d.nganh_hang || 'Khác'));
            filteredPickup = filteredPickup.filter(p => checked.includes(String(p.nganh_hang || 'Khác').trim()));
        }
    }

    // 1. Build mapping for GXT -> KTC using all mapped data FIRST
    const gxtToKtcMap = {};
    AppState.mappedData.forEach(d => {
        if (d.clean_gxt && d.mapped_ktc) gxtToKtcMap[d.clean_gxt.toLowerCase().trim()] = d.mapped_ktc;
    });

    if (AppState.activeCrossFilter) {
        const type = AppState.activeCrossFilter.type;
        const val = AppState.activeCrossFilter.value;
        if (type === 'KTC') {
            filteredData = filteredData.filter(d => d.mapped_ktc === val);
            filteredPickup = filteredPickup.filter(p => {
                const g = String(p.warehouse_giao || '').trim().toLowerCase();
                return (gxtToKtcMap[g] || "Chưa xác định") === val;
            });
        } else if (type === 'GXT') {
            filteredData = filteredData.filter(d => d.clean_gxt === val);
            filteredPickup = filteredPickup.filter(p => String(p.warehouse_giao || '').trim() === val);
        } else if (type === 'LABEL') {
            filteredData = filteredData.filter(d => d.clean_type === val);
            // Pickup doesn't have damage label, so don't filter pickup?
            // Actually, if filtering by label, damageRate will just drop.
        }
    }

    // Dong bo filteredData vao AppState de Insights/Alert dung cung data
    AppState.filteredData = filteredData;

    // DEDUPE + CHI GIU DON BE VO: loai 'Khac', moi order_code chi dem 1 lan
    const seenOrders = new Set();
    const damageData = filteredData.filter(d => {
        if ((d.mapped_label || '').trim() === 'Khác') return false;
        const key = String(d.clean_order || '').trim();
        if (!key || seenOrders.has(key)) return false;
        seenOrders.add(key);
        return true;
    });
    const totalPickup = filteredPickup.length;

    // Cap nhat Insights/Alert theo filter hien tai
    generateReport(true);

    // Update Cross Filter UI
    let cfUi = document.getElementById('cross-filter-ui');
    if (!cfUi) {
        cfUi = document.createElement('div');
        cfUi.id = 'cross-filter-ui';
        cfUi.style.cssText = 'margin-bottom: 15px; padding: 10px 15px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; display: none; align-items: center; justify-content: space-between;';
        cfUi.innerHTML = `<span><i style="margin-right:8px">🔍</i> Đang lọc theo: <strong id="cf-text"></strong></span>
                          <button id="cf-clear" style="background:var(--accent-danger);color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">Xóa bộ lọc</button>`;
        const header = document.querySelector('.top-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(cfUi, header.nextSibling);
        } else {
            document.getElementById('dashboard-content').prepend(cfUi);
        }
        cfUi.querySelector('#cf-clear').addEventListener('click', () => {
            AppState.activeCrossFilter = null;
            renderDashboardCharts();
        });
    }
    
    if (AppState.activeCrossFilter) {
        cfUi.querySelector('#cf-text').textContent = AppState.activeCrossFilter.type + " = " + AppState.activeCrossFilter.value;
        cfUi.style.display = 'flex';
    } else {
        if (cfUi) cfUi.style.display = 'none';
    }

    const damageRate = totalPickup > 0 ? parseFloat(((damageData.length / totalPickup) * 100).toFixed(2)) : 0;
    updateKPICards(damageData, totalPickup, damageRate);

    const groupBy = (array, key) => array.reduce((r, c) => ((r[c[key]] = r[c[key]] || []).push(c), r), {});

    // Mapping GXT -> KTC already built at the top

    // 2. Count pickups per GXT, KTC, Client
    const pickupByGxt = {};
    const pickupByKtc = {};
    const pickupByClient = {};

    filteredPickup.forEach(p => {
        const client = normClient(p.client_name);
        const gxt = String(p.warehouse_giao || '').trim();
        
        if (client) pickupByClient[client] = (pickupByClient[client] || 0) + 1;
        if (gxt) {
            pickupByGxt[gxt] = (pickupByGxt[gxt] || 0) + 1;
            const ktc = gxtToKtcMap[gxt.toLowerCase()] || "Chưa xác định";
            pickupByKtc[ktc] = (pickupByKtc[ktc] || 0) + 1;
        }
    });

    // 2.5 Daily Pickup Trend Chart (Absolute)
    const pickupDayGroups = {};
    filteredPickup.forEach(p => {
        // Try to get a daily date, fallback to empty string if not found.
        let rawDate = p.pickup_time || p.time_updated || p.isoweek_pickup_time || '';
        
        let d = normDate(String(rawDate).trim().split(' ')[0]);
        
        if (d) {
            pickupDayGroups[d] = (pickupDayGroups[d] || 0) + 1;
        }
    });
    
    // Sort days chronologically
    const days = Object.keys(pickupDayGroups).sort((a, b) => {
        const pa = a.split('/'), pb = b.split('/');
        const da = new Date(pa[2], pa[1] - 1, pa[0]);
        const db = new Date(pb[2], pb[1] - 1, pb[0]);
        return da - db;
    });
    const dailyPickupData = days.map(d => pickupDayGroups[d]);

    createChart('dailyPickupChart', 'line', {
        labels: days.length > 0 ? days : ['Chưa có dữ liệu ngày'],
        datasets: [{ 
            label: 'Đơn lấy thành công', 
            data: days.length > 0 ? dailyPickupData : [0], 
            borderColor: '#3b82f6', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            borderWidth: 2.5, 
            tension: 0.4, 
            fill: true, 
            pointBackgroundColor: '#3b82f6', 
            pointBorderColor: '#fff', 
            pointRadius: 4, 
            pointHoverRadius: 6 
        }]
    }, {
        scales: { y: { beginAtZero: true } },
        forceAbsolute: true
    });

    // 3. Trend Chart (Damage Rate % only) — dung damageData (da dedupe)
    const weekGroups = {};
    damageData.forEach(d => {
        const w = normDate(d.clean_week);
        if (w) {
            if (!weekGroups[w]) weekGroups[w] = [];
            weekGroups[w].push(d);
        }
    });
    
    const pickupWeekGroups = {};
    filteredPickup.forEach(p => {
        const w = normDate(p.isoweek_pickup_time);
        if (w) pickupWeekGroups[w] = (pickupWeekGroups[w] || 0) + 1;
    });

    const allWeekSet = new Set([...Object.keys(weekGroups), ...Object.keys(pickupWeekGroups)]);
    const weeks = [...allWeekSet].sort((a, b) => {
        const pa = a.split('/'), pb = b.split('/');
        const da = new Date(pa[2], pa[1] - 1, pa[0]);
        const db = new Date(pb[2], pb[1] - 1, pb[0]);
        return da - db;
    });
    const trendRateData = weeks.map(w => {
        const total = pickupWeekGroups[w] || 0;
        const damaged = weekGroups[w] ? weekGroups[w].length : 0;
        return total > 0 ? parseFloat(((damaged / total) * 100).toFixed(2)) : 0;
    });

    createChart('trendChart', 'line', {
        labels: weeks,
        datasets: [{ label: 'Damage Rate %', data: trendRateData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: '#ef4444', pointBorderColor: '#fff', pointRadius: 5, pointHoverRadius: 7 }]
    }, {
        scales: { y: { beginAtZero: true, ticks: { callback: v => v + '%' } } },
        plugins: { tooltip: { callbacks: { label: ctx => {
            const w = ctx.label;
            const damaged = weekGroups[w] ? weekGroups[w].length : 0;
            const total = pickupWeekGroups[w] || 0;
            return ['Damage Rate: ' + ctx.parsed.y + '%', 'Đơn Damage (Absolute): ' + damaged, 'Đơn Pickup (Absolute): ' + total];
        }}}}
    });

    // 4. KTC Chart (Absolute)
    const ktcMap = {};
    damageData.forEach(d => { ktcMap[d.mapped_ktc] = (ktcMap[d.mapped_ktc] || 0) + 1; });
    const sortedKtcAbs = Object.entries(ktcMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('ktcChart', 'bar', {
        labels: sortedKtcAbs.map(k => k[0]),
        datasets: [{ label: 'Đơn Damage', data: sortedKtcAbs.map(k => k[1]), backgroundColor: '#f59e0b', borderRadius: 4 }]
    }, { forceAbsolute: true, onChartClick: (label) => { AppState.activeCrossFilter = {type: 'KTC', value: label}; renderDashboardCharts(); } });

    // 4b. KTC Chart (Rate)
    const ktcRateList = Object.entries(ktcMap).map(k => {
        const pk = pickupByKtc[k[0]] || 0;
        return [k[0], pk > 0 ? parseFloat(((k[1] / pk) * 100).toFixed(2)) : 0];
    });
    const sortedKtcRate = ktcRateList.sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('ktcRateChart', 'bar', {
        labels: sortedKtcRate.map(k => k[0]),
        datasets: [{ label: 'Damage Rate %', data: sortedKtcRate.map(k => k[1]), backgroundColor: '#f59e0b', borderRadius: 4 }]
    }, { forceRate: true, scales: { y: { ticks: { callback: v => v + '%' } } }, onChartClick: (label) => { AppState.activeCrossFilter = {type: 'KTC', value: label}; renderDashboardCharts(); } });

    // 5. GXT Chart (Absolute)
    const gxtMap = {};
    damageData.forEach(d => { gxtMap[d.clean_gxt] = (gxtMap[d.clean_gxt] || 0) + 1; });
    const sortedGxtAbs = Object.entries(gxtMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('gxtChart', 'bar', {
        labels: sortedGxtAbs.map(k => k[0]),
        datasets: [{ label: 'Đơn Damage', data: sortedGxtAbs.map(k => k[1]), backgroundColor: '#ef4444', borderRadius: 4 }]
    }, { forceAbsolute: true, onChartClick: (label) => { AppState.activeCrossFilter = {type: 'KTC', value: label}; renderDashboardCharts(); } });

    // 5b. GXT Chart (Rate)
    const gxtRateList = Object.entries(gxtMap).map(k => {
        const pk = pickupByGxt[k[0]] || 0;
        return [k[0], pk > 0 ? parseFloat(((k[1] / pk) * 100).toFixed(2)) : 0];
    });
    const sortedGxtRate = gxtRateList.sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('gxtRateChart', 'bar', {
        labels: sortedGxtRate.map(k => k[0]),
        datasets: [{ label: 'Damage Rate %', data: sortedGxtRate.map(k => k[1]), backgroundColor: '#ef4444', borderRadius: 4 }]
    }, { forceRate: true, scales: { y: { ticks: { callback: v => v + '%' } } }, onChartClick: (label) => { AppState.activeCrossFilter = {type: 'KTC', value: label}; renderDashboardCharts(); } });

    // 6. Damage Type Breakdown (Pie - damage only)
    const typeGroups = groupBy(damageData, 'clean_type');
    const typeLabels = Object.keys(typeGroups).sort((a, b) => typeGroups[b].length - typeGroups[a].length);
    const typeData = typeLabels.map(l => typeGroups[l].length);
    createChart('labelChart', 'doughnut', {
        labels: typeLabels,
        datasets: [{ data: typeData, backgroundColor: ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#64748b','#06b6d4','#84cc16','#f97316'], borderWidth: 0, hoverOffset: 4 }]
    }, { cutout: '65%' });

    // 7. Client Chart (damage only)
    const clientGroups = groupBy(damageData, 'clean_client');
    const clients = Object.keys(clientGroups).sort((a, b) => clientGroups[b].length - clientGroups[a].length).slice(0, 5);
    const clientData = clients.map(c => clientGroups[c].length);
    createChart('clientChart', 'bar', {
        labels: clients,
        datasets: [{ label: 'Đơn Damage', data: clientData, backgroundColor: '#10b981', borderRadius: 4 }]
    }, { indexAxis: 'y', forceAbsolute: true, _pickupMap: pickupByClient });

    // 7b. Pickup by Client Chart
    const sortedPickupClients = Object.entries(pickupByClient).sort((a, b) => b[1] - a[1]).slice(0, 10);
    createChart('pickupClientChart', 'bar', {
        labels: sortedPickupClients.map(c => c[0]),
        datasets: [{ label: 'Đơn Lấy', data: sortedPickupClients.map(c => c[1]), backgroundColor: '#3b82f6', borderRadius: 4 }]
    }, { indexAxis: 'y', forceAbsolute: true });

    // 8. Render Sortable Data Table
    window.dashboardTableData = [...damageData]; // Store globally for sorting/exporting
    if (!window.dashboardTableSort) { window.dashboardTableSort = { field: 'order_code', direction: 'asc' }; }
    
    window.renderDashboardTable = function() {
        const tbody = document.getElementById('dashboard-table-body');
        if (!tbody) return;
        
        // Sort data
        const { field, direction } = window.dashboardTableSort;
        window.dashboardTableData.sort((a, b) => {
            let valA = String(a[field] || '').toLowerCase();
            let valB = String(b[field] || '').toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Render HTML
        let html = '';
        window.dashboardTableData.forEach(row => {
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 10px;">${esc(row.clean_order) || '-'}</td>
                    <td style="padding: 8px 10px;">${esc(row.clean_week) || '-'}</td>
                    <td style="padding: 8px 10px;">${esc(row.mapped_label) || '-'}</td>
                    <td style="padding: 8px 10px;">${esc(row.clean_type) || '-'}</td>
                    <td style="padding: 8px 10px;">${esc(row.clean_gxt) || '-'}</td>
                    <td style="padding: 8px 10px;">${esc(row.mapped_ktc) || '-'}</td>
                    <td style="padding: 8px 10px;">${esc(row.clean_client) || '-'}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        
        // Update header arrows
        document.querySelectorAll('#dashboard-detail-table th[data-sort]').forEach(th => {
            const f = th.getAttribute('data-sort');
            let text = th.innerText.replace(' ↑', '').replace(' ↓', '').replace(' ↕', '');
            if (f === field) {
                text += direction === 'asc' ? ' ↑' : ' ↓';
                th.style.color = '#fff';
            } else {
                text += ' ↕';
                th.style.color = 'var(--text-secondary)';
            }
            th.innerText = text;
        });
    };
    
    window.renderDashboardTable();

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
            '<label class="ms-option"><input type="checkbox" value="' + esc(val) + '" checked> <span>' + esc(val) + '</span></label>'
        ).join('');

        function updateLabel() {
            const checked = [...optionsDiv.querySelectorAll('input:checked')];
            const total = optionsDiv.querySelectorAll('input[type="checkbox"]').length;
            if (checked.length === 0 || checked.length === total) {
                labelEl.textContent = defaultLabel;
            } else if (checked.length === 1) {
                labelEl.textContent = checked[0].value;
            } else {
                labelEl.innerHTML = esc(checked.length + ' ' + defaultLabel.replace(/[^\s]+\s/, '').toLowerCase()) + ' <span class="ms-badge">' + checked.length + '</span>';
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
    const uniqueWeeks = [...new Set(data.map(d => normDate(d.clean_week)).filter(Boolean))].sort((a, b) => {
        const da = parseVNDate(a), db = parseVNDate(b);
        if (!da || !db) return 0;
        return db - da; // Mới nhất trước
    });
    const uniqueClients = [...new Set(data.map(d => d.clean_client).filter(Boolean))].sort();

    initMultiSelect('ms-week', uniqueWeeks, 'Tất cả các tuần', renderDashboardCharts);
    initMultiSelect('ms-client', uniqueClients, 'Tất cả khách hàng', renderDashboardCharts);

    // Build unique nganh_hang
    const uniqueNganh = [...new Set(data.map(d => d.nganh_hang || '').filter(Boolean))].sort();
    initMultiSelect('ms-nganh', uniqueNganh, 'Tất cả ngành hàng', renderDashboardCharts);

    renderDashboardCharts();
}

function createChart(id, type, data, options = {}) {
    if (AppState.charts[id]) { AppState.charts[id].destroy(); }
    const ctx = document.getElementById(id).getContext('2d');
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    const baseOptions = {
        layout: { padding: { top: 35 } },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: type === 'pie' || type === 'doughnut' ? 'right' : 'top', labels: { color: '#e2e8f0' } }
        },
        onClick: (e, elements, chart) => {
            if (elements.length > 0 && options.onChartClick) {
                const idx = elements[0].index;
                const label = chart.data.labels[idx];
                options.onChartClick(label);
            }
        }
    };
    if (options.plugins) { Object.keys(options.plugins).forEach(key => { baseOptions.plugins[key] = options.plugins[key]; }); }
    if (type === 'bar' || type === 'line') {
        const cs = options.scales || {};
        baseOptions.scales = {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ...(cs.y || {}) },
            x: { grid: { display: false }, ...(cs.x || {}) }
        };
        if (cs.y1) baseOptions.scales.y1 = cs.y1;
        if (options.indexAxis === 'y') {
            baseOptions.indexAxis = 'y';
            baseOptions.scales.x.grid = { color: 'rgba(255,255,255,0.05)' };
            baseOptions.scales.y.grid = { display: false };
        }
    }
    if (options.cutout) baseOptions.cutout = options.cutout;
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        const isH = options.indexAxis === 'y';
        baseOptions.plugins.datalabels = {
            color: '#fff', font: { weight: 'bold', size: 11 }, textAlign: 'center',
            align: type === 'line' ? 'top' : (!isH ? 'end' : 'center'),
            anchor: type === 'line' ? 'center' : (!isH ? 'end' : 'center'),
            offset: type === 'line' ? 12 : (!isH ? 4 : 0),
            clip: false,
            formatter: (value, ctx) => {
                if (value === 0) return '';
                if (options.forceAbsolute) return value;
                if (options.forceRate) return value + '%';
                
                const label = ctx.chart.data.labels[ctx.dataIndex];
                const pMap = options._pickupMap || null;
                if (pMap && label) {
                    const pickup = pMap[label] || 0;
                    if (pickup > 0) { return value + '\n(' + ((value / pickup) * 100).toFixed(1) + '%)'; }
                }
                let sum = 0;
                ctx.chart.data.datasets[0].data.forEach(d => { sum += parseFloat(d); });
                if (sum === 0) return value;
                return value + '\n(' + (value * 100 / sum).toFixed(1) + '%)';
            }
        };
        if (type === 'line') {
            baseOptions.plugins.datalabels.formatter = (v) => {
                if (v === 0) return '';
                if (options.forceAbsolute) return v;
                return v + '%';
            };
        }
    }
    AppState.charts[id] = new Chart(ctx, { type, data, options: baseOptions });
}

// Report Generation
function generateReport(keepPage = false) {
    // Dung cung data voi Dashboard (theo filter dang chon)
    const data = AppState.filteredData;
    const reportContent = document.getElementById('report-content');

    // DEDUPE: moi order_code chi dem 1 lan
    const seenReport = new Set();
    const damageData = data.filter(d => {
        const key = String(d.clean_order || '').trim();
        if (!key || seenReport.has(key)) return false;
        seenReport.add(key);
        return true;
    });

    // Calculations
    const totalIssues = damageData.length;

    const weekGroups = {};
    damageData.forEach(d => { weekGroups[d.clean_week] = (weekGroups[d.clean_week] || 0) + 1; });
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
                    <h4>Điểm nóng KTC/KCT: ${esc(topKtc[0])}</h4>
                    <p>Kho trung chuyển này ghi nhận xuất phát nhiều hàng lỗi nhất với <strong>${topKtc[1]}</strong> trường hợp. Cần ưu tiên kiểm tra quy trình chất xếp hàng điện máy tại khu vực xuất/nhập.</p>
                </div>
            </div>
            
            <!-- Điểm nóng GXT -->
            <div class="alert-card warning">
                <div class="alert-icon">🏢</div>
                <div class="alert-content">
                    <h4>Điểm nóng Kho Giao (GXT): ${esc(topGxt[0])}</h4>
                    <p>Bưu cục giao hàng cuối cùng ghi nhận số lượng phát hiện lỗi nhiều nhất với <strong>${topGxt[1]}</strong> đơn hàng. Quản lý vận hành cần lưu ý điều kiện đường xá và thao tác hạ hàng.</p>
                </div>
            </div>
            
            <!-- Khuyến nghị -->
            <div class="alert-card success">
                <div class="alert-icon">💡</div>
                <div class="alert-content">
                    <h4>Khuyến nghị Hành động (Actionable Insights)</h4>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                        <li>Rà soát lại quy trình đào tạo và phổ biến tài liệu "Hướng dẫn chất xếp hàng" cho nhân viên tại <strong>${esc(topKtc[0])}</strong>.</li>
                        <li>Tăng cường kiểm tra ngẫu nhiên (audit) ngoại quan thùng xe trước khi rời kho B2B đối với các tuyến chạy về <strong>${esc(topKtc[0])}</strong>.</li>
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
    const traceHtml = AppState.debugTrace ? AppState.debugTrace.map(t => `<div>Mã: ${esc(t.order)} | Câu dò: "${esc(t.combined)}" => Khớp từ: [${esc(t.keywordHit)}] => Nhãn: ${esc(t.finalLabel)}</div>`).join('') : "";

    html += `
        <div style="margin-top:30px; padding:15px; background:var(--bg-secondary); border-radius:5px; font-size:12px; color:var(--text-muted); border: 1px dashed var(--accent-danger);">
            <strong>🔍 BẢNG GỠ LỖI (DEBUG LOG):</strong><br/><br/>
            - <strong>Cột Từ Khóa được đọc:</strong> <span style="color:var(--accent-warning);">${esc(AppState.debugKwKey || 'N/A')}</span><br/>
            - <strong>Cột Nhãn được đọc:</strong> <span style="color:var(--accent-warning);">${esc(AppState.debugLabelKey || 'N/A')}</span><br/>
            - <strong>Số lượng từ khóa:</strong> <span style="color:var(--text-main);">${kwMap.length}</span> từ.<br/>
            - <strong>Toàn bộ từ khóa đã nhận diện:</strong> <span style="color:var(--text-main);">${esc(kwPreview)}</span><br/>
            <hr style="border-top:1px dashed #ccc; margin:10px 0;"/>
            <strong>TRACE 5 ĐƠN HÀNG ĐẦU TIÊN:</strong><br/>
            ${traceHtml}
            <hr style="border-top:1px dashed #ccc; margin:10px 0;"/>
            - <strong>Cột Mã Đơn (DB):</strong> <span style="color:var(--accent-success);">${esc(dk.orderKey)}</span><br/>
            - <strong>Cột Loại Lỗi (DB):</strong> <span style="color:var(--accent-success);">${esc(dk.typeKey)}</span><br/>
            - <strong>Cột Chi Tiết Lỗi (DB):</strong> <span style="color:var(--accent-danger);">${esc(dk.detailKey)}</span>
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
            `<option value="${esc(l)}" ${l === row.mapped_label ? 'selected' : ''}>${esc(l)}</option>`
        ).join('');

        // Bổ sung thêm nhãn nếu nhãn hiện tại không nằm trong bộ keyword map
        if (!AppState.uniqueLabels.includes(row.mapped_label)) {
            optionsHtml += `<option value="${esc(row.mapped_label)}" selected>${esc(row.mapped_label)}</option>`;
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
            <td>${esc(row.clean_order)}</td>
            <td>${esc(row.clean_week)}</td>
            <td>${esc(row.clean_type)}</td>
            <td>${esc(row.clean_gxt)}</td>
            <td>${esc(row.mapped_ktc)}</td>
            <td>${esc(row.clean_client)}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${esc(row.clean_detail || '')}">
                ${esc(row.clean_detail || '')}
            </td>
            <td>
                <select class="label-select badge ${badgeClass}" data-index="${globalIndex}" title="${esc(row.keyword_hit ? 'Bắt được từ: ' + row.keyword_hit : 'Không bắt được từ khóa nào')}">
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
}).catch(() => console.error("Không thể khôi phục state."));

// --- AUTO SYNC LOGIC ---
async function doAutoSync() {
    const urls = ['db', 'kw', 'gxt', 'pickup'].map(t => ({ target: t, url: localStorage.getItem(`saved_url_${t}`) || DEFAULT_API[t] || '' }));
    const validUrls = urls.filter(u => u.url && u.url.includes('script.google.com/macros/s/'));
    if (validUrls.length === 0) return;

    let updated = false;
    for (let { target, url } of validUrls) {
        try {
            const response = await fetch(noCacheUrl(url));
            if (response.ok) {
                const json = await response.json();
                const jsonArray = parseApiResponse(json);
                if (!json.error && jsonArray.length > 0) {
                    if (target === 'db') AppState.dbData = jsonArray;
                    if (target === 'kw') AppState.kwData = jsonArray;
                    if (target === 'gxt') AppState.gxtData = jsonArray;
                    if (target === 'pickup') AppState.pickupData = jsonArray;

                    const status = document.getElementById(`status-${target}`);
                    if (status) {
                        status.textContent = `Auto-synced (${jsonArray.length} dòng) lúc ${new Date().toLocaleTimeString('vi-VN')}`;
                        status.style.color = 'var(--accent-success)';
                    }
                    updated = true;
                }
            }
        } catch (e) { console.error("Auto-sync failed."); }
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
            autoSyncInterval = setInterval(doAutoSync, 60 * 60 * 1000);
        } else {
            clearInterval(autoSyncInterval);
        }
    });
    if (autoSyncCheckbox.checked) {
        autoSyncInterval = setInterval(doAutoSync, 60 * 60 * 1000);
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
const MAPPED_SHEET_PUSH_URL = API_BASE;

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

    // Use fetch with custom headers for CSRF protection
    fetch(noCacheUrl(MAPPED_SHEET_PUSH_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ data: data, token: API_TOKEN }),
        mode: 'no-cors'
    }).then(() => {
        if (syncStatus) {
            syncIcon.textContent = '✅';
            syncText.textContent = 'Đồng bộ thành công (' + data.length + ' dòng)';
            syncText.style.color = 'var(--accent-success)';
            setTimeout(() => { syncStatus.style.display = 'none'; }, 5000);
        }
    }).catch(err => {
        if (syncStatus) {
            syncIcon.textContent = '❌';
            syncText.textContent = 'Lỗi đồng bộ: ' + err.message;
            syncText.style.color = 'var(--accent-danger)';
        }
    });
}



// Sort headers listener
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#dashboard-detail-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.getAttribute('data-sort');
            if (window.dashboardTableSort.field === field) {
                window.dashboardTableSort.direction = window.dashboardTableSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                window.dashboardTableSort.field = field;
                window.dashboardTableSort.direction = 'asc';
            }
            window.renderDashboardTable();
        });
    });

    // Export CSV listener
    const btnExport = document.getElementById('btn-dashboard-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (!window.dashboardTableData || window.dashboardTableData.length === 0) {
                alert("Không có dữ liệu để tải xuống!");
                return;
            }
            
            // Generate CSV
            const headers = ["Mã Đơn", "Tuần", "Phân Loại", "Loại Hư Hỏng", "Kho Giao", "Kho KTC", "Khách Hàng"];
            const rows = window.dashboardTableData.map(d => [
                d.clean_order, d.clean_week, d.mapped_label, d.clean_type, d.clean_gxt, d.mapped_ktc, d.clean_client
            ].map(v => `"${String(v || '').replace(/"/g, '""' )}"`).join(","));
            
            const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Bao_cao_Hu_hong_" + new Date().toISOString().slice(0,10) + ".csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
});
