import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
    import { getDatabase, ref, get, set, update, push, query, orderByChild, equalTo, onValue, off, remove, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
    import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

    // ============================================================
    // FIREBASE CONFIG — same as your admin.html
    // ============================================================
    const firebaseConfig = {
  apiKey: "AIzaSyB5Pp6b-GfS76vvSyFFST_Y_bm2VLoShkQ",
  authDomain: "free-fire-tournment-app-a2de9.firebaseapp.com",
  databaseURL: "https://free-fire-tournment-app-a2de9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "free-fire-tournment-app-a2de9",
  storageBucket: "free-fire-tournment-app-a2de9.firebasestorage.app",
  messagingSenderId: "968399707106",
  appId: "1:968399707106:web:0b7ffaa7d326300d8cf7bb",
  measurementId: "G-179DTSBQHK"
};



    const localApiBaseUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? `http://${window.location.hostname}:3000`
        : '';
    const API_BASE_URL = (window.APP_API_BASE_URL || localApiBaseUrl).replace(/\/+$/, '');

    let app, db, auth;
    try {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
    } catch (e) {
        document.body.innerHTML = `<div class="alert alert-danger m-5"><strong>Firebase Error:</strong> ${e.message}</div>`;
    }

    // ============================================================
    // STATE
    // ============================================================
    let currentUser = null;
    let staffRecord = null;
    let gameDataCache = {};
    let fullUserDataCache = {};
    let appSettings = {};
    let currentEditingTournamentId = null;
    let currentPlayersListForPdf = [];
    let dbListeners = {};
    let componentCache = {};

    // ============================================================
    // HELPERS
    // ============================================================
    const $ = id => document.getElementById(id);
    const showLoader = show => { $('staffLoader').style.display = show ? 'flex' : 'none'; };
    const sanitize = str => { if (str == null) return ''; const t = document.createElement('div'); t.textContent = String(str); return t.innerHTML; };
    const formatDate = ts => { if (!ts) return 'N/A'; const n = Number(ts); if (isNaN(n) || n <= 0) return 'N/A'; try { return new Date(n).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }); } catch { return 'N/A'; } };
    const formatCurrency = a => { const n = Number(a); return isNaN(n) ? 'रु--' : `रु${n.toFixed(2)}`; };
    const placeholders = cols => `<tr class="loading-placeholder"><td colspan="${cols}"><div class="placeholder w-100 py-3"></div></td></tr>`.repeat(3);

    function showStatus(el, msg, type = 'danger', autohide = 5000) {
        if (!el) return;
        const id = `sa-${Math.random().toString(36).slice(2)}`;
        el.innerHTML = `<div id="${id}" class="alert alert-${type} alert-dismissible fade show" role="alert">${sanitize(msg)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
        if (autohide) setTimeout(() => { const a = $(id); if (a) a.remove(); }, autohide);
    }
    function clearStatus(el) { if (el) el.innerHTML = ''; }

    function getModal(el) {
        if (!el) return null;
        if (!componentCache[el.id]) componentCache[el.id] = new bootstrap.Modal(el);
        return componentCache[el.id];
    }

    function showSection(id) {
        document.querySelectorAll('#mainContent .section').forEach(s => s.classList.remove('active'));
        const sec = $(id);
        if (sec) sec.classList.add('active');
        document.querySelectorAll('#staffSidebar .nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === id));
        const link = document.querySelector(`#staffSidebar .nav-link[data-section="${id}"]`);
        const rawTitle = link?.textContent?.trim() || id;
        $('pageTitle').innerHTML = `${sanitize(rawTitle)} <span class="staff-badge">STAFF</span>`;
        // close offcanvas on mobile
        const oc = bootstrap.Offcanvas.getInstance($('staffSidebar'));
        if (oc) oc.hide();
        loadSectionData(id);
    }

    function loadSectionData(id) {
        switch (id) {
            case 'dashboard-section': loadDashboardStats(); break;
            case 'games-section': loadGames(); break;
            case 'promotions-section': loadPromotions(); break;
            case 'tournaments-section': loadTournaments(); break;
            case 'tournament-mgt-section': populateTournamentMgtSelect(); break;
            case 'leaderboard-section': loadLeaderboardData(); break;
            case 'notifications-section': loadNotificationHistory(); break;
            case 'theme-section': loadThemeInputs(); break;
        }
    }

    // ============================================================
    // AUTH
    // ============================================================
    async function loginStaff(e) {
        e.preventDefault();
        const statusEl = $('loginStatus');
        clearStatus(statusEl);
        const email = $('staffEmail').value.trim();
        const password = $('staffPassword').value;
        if (!email || !password) { showStatus(statusEl, "Email and password required.", "warning"); return; }
        showLoader(true);
        $('loginBtn').disabled = true;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged handles the rest
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            showStatus(statusEl, msg, "danger");
            showLoader(false);
            $('loginBtn').disabled = false;
        }
    }

    async function handleAuthChange(user) {
        if (!db) return;
        showLoader(true);
        currentUser = user;

        if (user) {
            // Strict check: must exist in staff/{uid} AND status === 'active'
            let staffOk = false;
            try {
                const snap = await get(ref(db, `staff/${user.uid}`));
                if (snap.exists() && snap.val()?.status === 'active') {
                    staffRecord = { uid: user.uid, ...snap.val() };
                    staffOk = true;
                }
            } catch (err) {
                console.error("Staff check failed:", err);
            }

            if (staffOk) {
                $('staffEmailDisplay').textContent = `${user.email} (Staff)`;
                $('auth-container').style.display = 'none';
                $('main-area').style.display = 'block';
                await loadAppSettings();
                setupRealtimeListeners();
                showSection('dashboard-section');
            } else {
                console.warn("Unauthorized or inactive staff:", user.email);
                alert(`Access Denied. "${user.email}" is not an active staff account added by the admin.`);
                await signOut(auth);
                $('loginBtn').disabled = false;
                $('loginStatus').innerHTML = '';
            }
        } else {
            // Logged out
            currentUser = null; staffRecord = null; appSettings = {};
            gameDataCache = {}; fullUserDataCache = {};
            detachAllListeners();
            $('main-area').style.display = 'none';
            $('auth-container').style.display = 'block';
            $('staffEmailDisplay').textContent = '';
            $('staffLoginForm').reset();
        }
        setTimeout(() => { showLoader(false); $('loginBtn').disabled = false; }, 150);
    }

    async function logout() {
        if (!auth) return;
        showLoader(true);
        try { await signOut(auth); } catch (e) { console.error(e); showLoader(false); }
    }

    // ============================================================
    // REALTIME LISTENERS (theme only — staff don't need badge counts)
    // ============================================================
    function setupRealtimeListeners() {
        detachAllListeners();
        const settingsRef = ref(db, 'settings');
        dbListeners['settings'] = onValue(settingsRef, snap => {
            if (snap.exists()) { appSettings = snap.val() || {}; applyTheme(appSettings.theme); }
        });
    }

    function detachAllListeners() {
        Object.entries(dbListeners).forEach(([key, fn]) => {
            try {
                if (key === 'settings') off(ref(db, 'settings'), 'value', fn);
            } catch (e) { console.warn("Detach error:", key, e); }
        });
        dbListeners = {};
    }

    // ============================================================
    // SETTINGS / THEME
    // ============================================================
    async function loadAppSettings() {
        try {
            const snap = await get(ref(db, 'settings'));
            if (snap.exists()) {
                appSettings = snap.val() || {};
                applyTheme(appSettings.theme);
                const logo = appSettings.logoUrl;
                const headerLogo = $('headerLogo');
                if (logo) { headerLogo.src = logo; headerLogo.style.display = 'inline-block'; }
                const loginLogo = $('loginLogo');
                if (logo) loginLogo.src = logo;
                document.title = `${appSettings.appName || 'Staff'} Panel`;
            }
        } catch (e) { console.error("Settings load error:", e); }
    }

    const defaultTheme = {
        'primary-bg': '#0F172A', 'secondary-bg': '#1E293B', 'card-bg': '#1E293B',
        'text-primary': '#E2E8F0', 'text-secondary': '#94A3B8', 'accent-color': '#FACC15',
        'primary-button-bg': '#3B82F6', 'border-color': '#334155', 'success-color': '#10B981',
        'danger-color': '#EF4444', 'warning-color': '#F59E0B', 'info-color': '#60A5FA'
    };
    const themePresets = {
        light: { 'primary-bg': '#F1F5F9', 'secondary-bg': '#FFFFFF', 'card-bg': '#FFFFFF', 'text-primary': '#0F172A', 'text-secondary': '#475569', 'accent-color': '#F59E0B', 'primary-button-bg': '#2563EB', 'border-color': '#E2E8F0', 'success-color': '#16A34A', 'danger-color': '#DC2626', 'warning-color': '#D97706', 'info-color': '#3B82F6' },
        gamingRed: { 'primary-bg': '#111827', 'secondary-bg': '#1F2937', 'card-bg': '#1F2937', 'text-primary': '#F9FAFB', 'text-secondary': '#9CA3AF', 'accent-color': '#EF4444', 'primary-button-bg': '#D97706', 'border-color': '#374151', 'success-color': '#10B981', 'danger-color': '#EF4444', 'warning-color': '#F59E0B', 'info-color': '#3B82F6' }
    };

    function applyTheme(theme) {
        const t = theme || defaultTheme;
        const root = document.documentElement;
        Object.entries(t).forEach(([k, v]) => { if (v) root.style.setProperty(`--${k}`, v); });
    }

    function loadThemeInputs() {
        const theme = appSettings.theme || defaultTheme;
        document.querySelectorAll('#themeSettingsForm input[type="color"]').forEach(inp => {
            const v = theme[inp.dataset.themeVar];
            if (v) inp.value = v;
        });
        clearStatus($('themeStatus'));
    }

    function applyPresetToInputs(presetName) {
        const preset = presetName === 'light' ? themePresets.light : presetName === 'gamingRed' ? themePresets.gamingRed : defaultTheme;
        document.querySelectorAll('#themeSettingsForm input[type="color"]').forEach(inp => {
            if (preset[inp.dataset.themeVar]) inp.value = preset[inp.dataset.themeVar];
        });
        applyTheme(preset);
    }

    async function saveTheme() {
        if (!db || !currentUser) return;
        const newTheme = {};
        document.querySelectorAll('#themeSettingsForm input[type="color"]').forEach(inp => { newTheme[inp.dataset.themeVar] = inp.value; });
        showLoader(true);
        $('saveThemeBtn').disabled = true;
        try {
            await update(ref(db, 'settings'), { theme: newTheme });
            appSettings.theme = newTheme;
            showStatus($('themeStatus'), "Theme saved for all users!", "success");
        } catch (e) {
            showStatus($('themeStatus'), `Error: ${e.message}`, "danger", false);
        } finally { showLoader(false); $('saveThemeBtn').disabled = false; }
    }

    async function resetTheme() {
        if (!db || !currentUser) return;
        if (!confirm("Reset theme to default for all users?")) return;
        showLoader(true);
        $('resetThemeBtn').disabled = true;
        try {
            await set(ref(db, 'settings/theme'), null);
            appSettings.theme = null;
            applyPresetToInputs('default');
            showStatus($('themeStatus'), "Theme reset to default.", "success");
        } catch (e) {
            showStatus($('themeStatus'), `Error: ${e.message}`, "danger", false);
        } finally { showLoader(false); $('resetThemeBtn').disabled = false; }
    }

    async function uploadAdminImage(file, statusEl) {
        if (!file) throw new Error("No file selected.");
        if (!currentUser) throw new Error("An authenticated staff account is required.");
        const formData = new FormData();
        formData.append('image', file);
        if (statusEl) { statusEl.textContent = 'Uploading...'; statusEl.style.display = 'block'; }
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/uploads/image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || typeof result.imageUrl !== 'string') {
            throw new Error(result.error?.message || `Image upload failed (${response.status}).`);
        }
        if (statusEl) statusEl.textContent = 'Upload complete!';
        return result.imageUrl;
    }

    // ============================================================
    // DASHBOARD
    // ============================================================
    async function loadDashboardStats() {
        if (!db || !currentUser) return;
        clearStatus($('dashboardStatus'));
        [$('statTotalTournaments'), $('statActiveTournaments'), $('statTotalGames'), $('statFinishedTournaments')].forEach(el => { if (el) el.textContent = '...'; });
        try {
            const [tSnap, gSnap] = await Promise.all([
                get(ref(db, 'tournaments')),
                get(ref(db, 'games'))
            ]);
            let total = 0, active = 0, finished = 0;
            if (tSnap.exists()) {
                tSnap.forEach(c => {
                    total++;
                    const s = c.val()?.status;
                    if (s === 'ongoing' || s === 'upcoming') active++;
                    else if (s === 'completed' || s === 'result' || s === 'cancelled') finished++;
                });
            }
            $('statTotalTournaments').textContent = total;
            $('statActiveTournaments').textContent = active;
            $('statFinishedTournaments').textContent = finished;
            $('statTotalGames').textContent = gSnap.exists() ? gSnap.size : 0;
        } catch (e) {
            console.error("Dashboard stats error:", e);
            showStatus($('dashboardStatus'), `Error loading stats: ${e.message}`, "warning");
        }
    }

    // ============================================================
    // GAMES
    // ============================================================
    async function loadGames() {
        if (!db || !currentUser) return;
        $('gamesTableBody').innerHTML = placeholders(4);
        gameDataCache = {};
        clearStatus($('gamesStatus'));
        try {
            const snap = await get(ref(db, 'games'));
            let html = '';
            if (snap.exists()) {
                snap.forEach(c => {
                    const id = c.key, g = c.val();
                    if (g?.name) {
                        gameDataCache[id] = g.name;
                        html += `<tr>
                            <td><img src="${sanitize(g.imageUrl || 'https://via.placeholder.com/60x40')}" alt="${sanitize(g.name)}" class="preview-img"></td>
                            <td>${sanitize(g.name)}</td>
                            <td><small class="text-muted">${sanitize(id)}</small></td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-info btn-edit-game" data-id="${sanitize(id)}" title="Edit"><i class="bi bi-pencil-square"></i></button>
                                <button class="btn btn-sm btn-danger btn-delete-game" data-id="${sanitize(id)}" title="Delete"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>`;
                    }
                });
            }
            $('gamesTableBody').innerHTML = html || `<tr><td colspan="4" class="text-center p-3 text-muted">No games found.</td></tr>`;
        } catch (e) {
            $('gamesTableBody').innerHTML = `<tr><td colspan="4" class="text-center text-danger p-3">Error: ${e.message}</td></tr>`;
        }
    }

    async function saveGame() {
        if (!db || !currentUser) return;
        const id = $('gameEditId').value;
        const isEdit = !!id;
        const name = $('gameName').value.trim();
        const urlInput = $('gameImageUrl').value.trim();
        const file = $('gameImageFile').files[0];
        const statusEl = $('gameStatus');
        const imgStatus = document.querySelector('#gameForm .image-upload-status');
        clearStatus(statusEl);
        if (!name) { showStatus(statusEl, "Game Name required.", "warning"); return; }
        if (!urlInput && !file && !isEdit) { showStatus(statusEl, "Image URL or file required.", "warning"); return; }
        showLoader(true); $('saveGameBtn').disabled = true;
        let finalUrl = urlInput;
        try {
            if (file) finalUrl = await uploadAdminImage(file, imgStatus);
            if (!finalUrl) throw new Error("Image URL missing.");
            const data = { name, imageUrl: finalUrl };
            if (isEdit) { data.updatedAt = serverTimestamp(); await update(ref(db, `games/${id}`), data); showStatus($('gamesStatus'), "Game updated!", "success", 3000); }
            else { data.createdAt = serverTimestamp(); await set(push(ref(db, 'games')), data); showStatus($('gamesStatus'), "Game added!", "success", 3000); }
            $('gameForm').reset(); $('gameEditId').value = '';
            if (imgStatus) { imgStatus.textContent = ''; imgStatus.style.display = 'none'; }
            getModal($('gameModal'))?.hide();
            loadGames(); loadDashboardStats();
        } catch (e) { showStatus(statusEl, `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); $('saveGameBtn').disabled = false; }
    }

    async function openEditGameModal(id) {
        if (!db || !id || !currentUser) return;
        showLoader(true); $('gameForm').reset(); clearStatus($('gameStatus'));
        try {
            const snap = await get(ref(db, `games/${id}`));
            if (!snap.exists()) throw new Error("Game not found.");
            const g = snap.val();
            $('gameModalTitle').textContent = "Edit Game";
            $('gameEditId').value = id;
            $('gameName').value = g.name || '';
            $('gameImageUrl').value = g.imageUrl || '';
            $('gameImageFile').value = '';
            getModal($('gameModal'))?.show();
        } catch (e) { showStatus($('gamesStatus'), `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); }
    }

    async function deleteGame(id) {
        if (!db || !id || !currentUser) return;
        if (!confirm(`DELETE Game ${id}?`)) return;
        showLoader(true);
        try { await remove(ref(db, `games/${id}`)); delete gameDataCache[id]; showStatus($('gamesStatus'), "Game deleted.", "success", 3000); loadGames(); loadDashboardStats(); }
        catch (e) { showStatus($('gamesStatus'), `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); }
    }

    // ============================================================
    // PROMOTIONS
    // ============================================================
    async function loadPromotions() {
        if (!db || !currentUser) return;
        $('promotionsTableBody').innerHTML = placeholders(3);
        clearStatus($('promotionsStatus'));
        try {
            const snap = await get(ref(db, 'promotions'));
            let html = '';
            if (snap.exists()) {
                snap.forEach(c => {
                    const id = c.key, p = c.val();
                    if (p?.imageUrl) {
                        const lnk = p.link ? `<a href="${sanitize(p.link)}" target="_blank" class="text-info">${sanitize(p.link).substring(0, 40)}...</a>` : '<span class="text-muted">No Link</span>';
                        html += `<tr>
                            <td><img src="${sanitize(p.imageUrl)}" alt="Promotion" class="preview-img"></td>
                            <td>${lnk}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-info btn-edit-promo" data-id="${sanitize(id)}"><i class="bi bi-pencil-square"></i></button>
                                <button class="btn btn-sm btn-danger btn-delete-promo" data-id="${sanitize(id)}"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>`;
                    }
                });
            }
            $('promotionsTableBody').innerHTML = html || `<tr><td colspan="3" class="text-center p-3 text-muted">No promotions found.</td></tr>`;
        } catch (e) { $('promotionsTableBody').innerHTML = `<tr><td colspan="3" class="text-center text-danger p-3">Error: ${e.message}</td></tr>`; }
    }

    async function savePromotion() {
        if (!db || !currentUser) return;
        const id = $('promotionEditId').value;
        const isEdit = !!id;
        const urlInput = $('promoImageUrl').value.trim();
        const file = $('promoImageFile').files[0];
        const link = $('promoLink').value.trim();
        const statusEl = $('promotionStatus');
        const imgStatus = document.querySelector('#promotionForm .image-upload-status');
        clearStatus(statusEl);
        if (!urlInput && !file && !isEdit) { showStatus(statusEl, "Image URL or file required.", "warning"); return; }
        showLoader(true); $('savePromotionBtn').disabled = true;
        let finalUrl = urlInput;
        try {
            if (file) finalUrl = await uploadAdminImage(file, imgStatus);
            if (!finalUrl) throw new Error("Image URL missing.");
            const data = { imageUrl: finalUrl, link: link || null };
            if (isEdit) { data.updatedAt = serverTimestamp(); await update(ref(db, `promotions/${id}`), data); showStatus($('promotionsStatus'), "Promotion updated!", "success", 3000); }
            else { data.createdAt = serverTimestamp(); await set(push(ref(db, 'promotions')), data); showStatus($('promotionsStatus'), "Promotion added!", "success", 3000); }
            $('promotionForm').reset(); $('promotionEditId').value = '';
            if (imgStatus) { imgStatus.textContent = ''; imgStatus.style.display = 'none'; }
            getModal($('promotionModal'))?.hide();
            loadPromotions();
        } catch (e) { showStatus(statusEl, `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); $('savePromotionBtn').disabled = false; }
    }

    async function openEditPromotionModal(id) {
        if (!db || !id || !currentUser) return;
        showLoader(true); $('promotionForm').reset(); clearStatus($('promotionStatus'));
        try {
            const snap = await get(ref(db, `promotions/${id}`));
            if (!snap.exists()) throw new Error("Promotion not found.");
            const p = snap.val();
            $('promotionModalTitle').textContent = "Edit Promotion";
            $('promotionEditId').value = id;
            $('promoImageUrl').value = p.imageUrl || '';
            $('promoLink').value = p.link || '';
            getModal($('promotionModal'))?.show();
        } catch (e) { showStatus($('promotionsStatus'), `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); }
    }

    async function deletePromotion(id) {
        if (!db || !id || !currentUser) return;
        if (!confirm(`DELETE Promotion ${id}?`)) return;
        showLoader(true);
        try { await remove(ref(db, `promotions/${id}`)); showStatus($('promotionsStatus'), "Promotion deleted.", "success", 3000); loadPromotions(); }
        catch (e) { showStatus($('promotionsStatus'), `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); }
    }

    // ============================================================
    // TOURNAMENTS
    // ============================================================
    async function loadTournaments() {
        if (!db || !currentUser) return;
        if (Object.keys(gameDataCache).length === 0) await loadGames();
        $('tournamentsTableBody').innerHTML = placeholders(8);
        clearStatus($('tournamentsStatus'));
        try {
            const snap = await get(ref(db, 'tournaments'));
            let html = '';
            if (snap.exists()) {
                snap.forEach(c => {
                    const id = c.key, t = c.val();
                    if (t?.name && t.gameId && t.status) {
                        const gameName = gameDataCache[t.gameId] || `<small class="text-warning">Unknown</small>`;
                        const statusMap = { ongoing: 'success', upcoming: 'info', result: 'primary', completed: 'secondary', cancelled: 'danger' };
                        const badge = `<span class="status-badge text-bg-${statusMap[t.status] || 'secondary'}">${t.status}</span>`;
                        const regCount = t.registeredPlayers ? Object.keys(t.registeredPlayers).length : 0;
                        const maxP = t.maxPlayers > 0 ? `/${t.maxPlayers}` : '';
                        html += `<tr>
                            <td>${sanitize(t.name)}</td><td>${gameName}</td>
                            <td>${formatCurrency(t.entryFee)}</td><td>${formatCurrency(t.prizePool)}</td>
                            <td>${formatDate(t.startTime)}</td><td>${badge}</td>
                            <td>${regCount}${maxP}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-info btn-edit-tournament" data-id="${sanitize(id)}" title="Edit"><i class="bi bi-pencil-square"></i></button>
                                <button class="btn btn-sm btn-secondary btn-view-registered" data-id="${sanitize(id)}" data-name="${sanitize(t.name)}" title="View Players"><i class="bi bi-people"></i></button>
                                <button class="btn btn-sm btn-danger btn-delete-tournament" data-id="${sanitize(id)}" title="Delete"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>`;
                    }
                });
            }
            $('tournamentsTableBody').innerHTML = html || `<tr><td colspan="8" class="text-center p-3 text-muted">No tournaments found.</td></tr>`;
        } catch (e) {
            $('tournamentsTableBody').innerHTML = `<tr><td colspan="8" class="text-center text-danger p-3">Error: ${e.message}</td></tr>`;
            showStatus($('tournamentsStatus'), `Error: ${e.message}`, "danger", false);
        }
    }

    async function populateGameSelect(selectedVal = null) {
        const sel = $('tournamentGame');
        sel.innerHTML = '<option value="">Loading...</option>'; sel.disabled = true;
        try {
            if (Object.keys(gameDataCache).length === 0) await loadGames();
            sel.innerHTML = '<option value="">-- Select Game --</option>';
            Object.entries(gameDataCache).sort(([,a],[,b])=>a.localeCompare(b)).forEach(([id, name]) => {
                const opt = document.createElement('option');
                opt.value = id; opt.textContent = sanitize(name); sel.appendChild(opt);
            });
            if (selectedVal) sel.value = selectedVal;
        } catch (e) { sel.innerHTML = '<option value="">Error Loading</option>'; }
        finally { sel.disabled = false; }
    }

    async function openEditTournamentModal(id) {
        if (!db || !id || !currentUser) return;
        showLoader(true); clearStatus($('addTournamentStatus')); $('tournamentForm').reset(); currentEditingTournamentId = id;
        try {
            const snap = await get(ref(db, `tournaments/${id}`));
            if (!snap.exists()) throw new Error("Tournament not found.");
            const t = snap.val();
            await populateGameSelect(t.gameId);
            $('tournamentModalTitle').textContent = "Edit Tournament";
            $('tournamentEditId').value = id;
            $('tournamentName').value = t.name || '';
            if (t.startTime) { try { const d = new Date(t.startTime); if (!isNaN(d)) $('tournamentStartTime').value = new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,16); } catch{} }
            $('tournamentStatus').value = t.status || 'upcoming';
            $('tournamentMode').value = t.mode || 'Solo';
            $('tournamentEntryFee').value = t.entryFee ?? 0;
            $('tournamentPrizePool').value = t.prizePool ?? 0;
            $('tournamentPerKill').value = t.perKillPrize ?? 0;
            $('tournamentMaxPlayers').value = t.maxPlayers ?? 0;
            $('tournamentTags').value = (t.tags || []).join(', ');
            $('tournamentBannerUrl').value = t.bannerUrl || '';
            $('tournamentDescription').value = t.description || '';
            $('tournamentRoomId').value = t.roomId || '';
            $('tournamentRoomPassword').value = t.roomPassword || '';
            $('tournamentShowIdPass').checked = t.showIdPass || false;
            getModal($('addTournamentModal'))?.show();
        } catch (e) { showStatus($('tournamentsStatus'), `Error: ${e.message}`, "danger", false); currentEditingTournamentId = null; }
        finally { showLoader(false); }
    }

    async function saveTournament(e) {
        if (e) e.preventDefault();
        if (!db || !currentUser) return;
        const statusEl = $('addTournamentStatus');
        clearStatus(statusEl);
        const gameId = $('tournamentGame').value;
        const name = $('tournamentName').value.trim();
        const startStr = $('tournamentStartTime').value;
        if (!gameId || !name || !startStr) { showStatus(statusEl, "Game, Name, Start Time required.", "warning"); return; }
        let startTs;
        try { startTs = new Date(startStr).getTime(); if (isNaN(startTs)) throw new Error(); } catch { showStatus(statusEl, "Invalid date/time.", "warning"); return; }
        const data = {
            gameId, name, startTime: startTs,
            status: $('tournamentStatus').value,
            entryFee: parseFloat($('tournamentEntryFee').value) || 0,
            prizePool: parseFloat($('tournamentPrizePool').value) || 0,
            perKillPrize: parseFloat($('tournamentPerKill').value) || 0,
            maxPlayers: parseInt($('tournamentMaxPlayers').value) || 0,
            mode: $('tournamentMode').value,
            tags: $('tournamentTags').value.split(',').map(t=>t.trim()).filter(Boolean),
            bannerUrl: $('tournamentBannerUrl').value.trim() || null,
            description: $('tournamentDescription').value.trim(),
            roomId: $('tournamentRoomId').value.trim() || null,
            roomPassword: $('tournamentRoomPassword').value.trim() || null,
            showIdPass: $('tournamentShowIdPass').checked,
            updatedAt: serverTimestamp()
        };
        showLoader(true); $('saveTournamentBtn').disabled = true;
        try {
            if (currentEditingTournamentId) {
                const tRef = ref(db, `tournaments/${currentEditingTournamentId}`);
                const existing = await get(tRef);
                if (existing.exists() && existing.val().registeredPlayers) data.registeredPlayers = existing.val().registeredPlayers;
                await update(tRef, data);
                showStatus(statusEl, "Tournament updated!", "success", 3000);
            } else {
                data.createdAt = serverTimestamp();
                await set(push(ref(db, 'tournaments')), data);
                showStatus(statusEl, "Tournament added!", "success", 3000);
            }
            $('tournamentForm').reset(); currentEditingTournamentId = null;
            getModal($('addTournamentModal'))?.hide();
            loadTournaments(); loadDashboardStats();
        } catch (e) { showStatus(statusEl, `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); $('saveTournamentBtn').disabled = false; }
    }

    async function deleteTournament(id) {
        if (!db || !id || !currentUser) return;
        if (!confirm(`DELETE Tournament ${id}? Cannot be undone.`)) return;
        showLoader(true);
        try { await remove(ref(db, `tournaments/${id}`)); showStatus($('tournamentsStatus'), "Tournament deleted.", "success", 3000); loadTournaments(); loadDashboardStats(); }
        catch (e) { showStatus($('tournamentsStatus'), `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); }
    }

    async function openRegisteredPlayersModal(id, name) {
        if (!db || !id || !currentUser) return;
        $('registeredPlayersModal').dataset.tournamentId = id;
        $('registeredPlayersTournamentName').textContent = name || 'N/A';
        $('registeredPlayersTableBody').innerHTML = `<tr><td colspan="4" class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></td></tr>`;
        clearStatus($('registeredPlayersStatus'));
        currentPlayersListForPdf = [];
        getModal($('registeredPlayersModal'))?.show();
        try {
            const snap = await get(ref(db, `tournaments/${id}/registeredPlayers`));
            if (!snap.exists()) { $('registeredPlayersTableBody').innerHTML = `<tr><td colspan="4" class="text-center p-3 text-muted">No players registered.</td></tr>`; return; }
            const data = snap.val();
            const promises = Object.entries(data).map(async ([uid, reg]) => {
                let u = fullUserDataCache[uid];
                if (!u) { const us = await get(ref(db, `users/${uid}`)); u = us.exists() ? { uid, ...us.val() } : { uid, displayName: 'Not Found', email: 'N/A' }; if (us.exists()) fullUserDataCache[uid] = u; }
                return { user: u, ...reg };
            });
            const results = await Promise.all(promises);
            let html = '';
            results.forEach(r => {
                const p1 = `<div>${sanitize(r.username||'N/A')}</div><small class="text-muted">${sanitize(r.gameUid||'N/A')}</small>`;
                const p2 = (r.teammateUsername||r.teammateGameUid) ? `<div>${sanitize(r.teammateUsername||'N/A')}</div><small class="text-muted">${sanitize(r.teammateGameUid||'N/A')}</small>` : '<span class="text-muted">N/A (Solo)</span>';
                html += `<tr><td><div>${sanitize(r.user.displayName)}</div><small class="text-muted">${sanitize(r.user.email)}</small></td><td>${p1}</td><td>${p2}</td><td>${formatDate(r.joinedAt)}</td></tr>`;
            });
            $('registeredPlayersTableBody').innerHTML = html || `<tr><td colspan="4" class="text-center p-3 text-muted">Could not load details.</td></tr>`;
            $('registeredPlayersModalTitle').textContent = `Registered Players (${results.length})`;
        } catch (e) {
            $('registeredPlayersTableBody').innerHTML = `<tr><td colspan="4" class="text-center text-danger p-3">Error: ${e.message}</td></tr>`;
        }
    }

    // ============================================================
    // TOURNAMENT MANAGEMENT (Prize crediting)
    // ============================================================
    async function populateTournamentMgtSelect() {
        if (!db || !currentUser) return;
        const sel = $('tmsTournamentSelect');
        sel.innerHTML = '<option value="">-- Loading... --</option>';
        $('tmsPlayerListContainer').style.display = 'none';
        clearStatus($('tmsStatus'));
        try {
            const snap = await get(ref(db, 'tournaments'));
            if (!snap.exists()) { sel.innerHTML = '<option value="">No tournaments found</option>'; return; }
            sel.innerHTML = '<option value="">-- Select a Tournament --</option>';
            snap.forEach(c => {
                const t = c.val();
                if (t?.name) { const opt = document.createElement('option'); opt.value = c.key; opt.textContent = `${t.name} (${t.status})`; sel.appendChild(opt); }
            });
        } catch (e) { sel.innerHTML = `<option value="">Error: ${e.message}</option>`; }
    }

    async function loadPlayersForMgt(tournamentId) {
        if (!db || !tournamentId || !currentUser) return;
        const container = $('tmsPlayerListContainer');
        const tbody = $('tmsPlayerListTableBody');
        const statusEl = $('tmsStatus');
        clearStatus(statusEl);
        container.style.display = 'none';
        tbody.innerHTML = placeholders(7);
        try {
            const [tSnap, playersSnap] = await Promise.all([
                get(ref(db, `tournaments/${tournamentId}`)),
                get(ref(db, `tournaments/${tournamentId}/registeredPlayers`))
            ]);
            if (!tSnap.exists()) { showStatus(statusEl, "Tournament not found.", "warning"); return; }
            const t = tSnap.val();
            const perKill = t.perKillPrize || 0;
            if (!playersSnap.exists()) { showStatus(statusEl, "No registered players found.", "info"); tbody.innerHTML = `<tr><td colspan="7" class="text-center p-3 text-muted">No players registered.</td></tr>`; container.style.display = 'block'; return; }
            const players = playersSnap.val();
            const uids = Object.keys(players);
            await Promise.allSettled(uids.map(async uid => {
                if (!fullUserDataCache[uid]) {
                    const us = await get(ref(db, `users/${uid}`));
                    fullUserDataCache[uid] = us.exists() ? { uid, ...us.val() } : { uid, displayName: 'Unknown', email: uid };
                }
            }));
            let html = '';
            uids.forEach(uid => {
                const u = fullUserDataCache[uid] || {};
                const reg = players[uid];
                html += `<tr data-uid="${sanitize(uid)}">
                    <td><div>${sanitize(u.displayName||'N/A')}</div><small class="text-muted">${sanitize(u.email||uid)}</small></td>
                    <td><small>${sanitize(reg.gameUid||'N/A')}</small></td>
                    <td><div class="calculated-prize">${formatCurrency(perKill)}</div></td>
                    <td><input type="number" class="form-control kills-input" min="0" value="0" data-per-kill="${perKill}"></td>
                    <td><input type="number" class="form-control extra-input" min="0" value="0" step="any"></td>
                    <td><input type="number" class="form-control rank-input" min="1" value="" placeholder="N/A"></td>
                    <td><div class="calculated-prize prize-display">रु0.00</div></td>
                </tr>`;
            });
            tbody.innerHTML = html;
            container.style.display = 'block';
            tbody.querySelectorAll('.kills-input, .extra-input').forEach(inp => inp.addEventListener('input', updateRowPrize));
        } catch (e) { showStatus(statusEl, `Error: ${e.message}`, "danger", false); console.error(e); }
    }

    function updateRowPrize(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        const kills = parseFloat(row.querySelector('.kills-input').value) || 0;
        const perKill = parseFloat(row.querySelector('.kills-input').dataset.perKill) || 0;
        const extra = parseFloat(row.querySelector('.extra-input').value) || 0;
        const prize = (kills * perKill) + extra;
        row.querySelector('.prize-display').textContent = formatCurrency(prize);
    }

    async function creditAllWinnings() {
        if (!db || !currentUser) return;
        const tournamentId = $('tmsTournamentSelect').value;
        if (!tournamentId) { showStatus($('tmsStatus'), "Please select a tournament.", "warning"); return; }
        const rows = $('tmsPlayerListTableBody').querySelectorAll('tr[data-uid]');
        if (rows.length === 0) { showStatus($('tmsStatus'), "No players to credit.", "warning"); return; }
        if (!confirm(`Credit winnings to ${rows.length} player(s) for this tournament? This action cannot be undone.`)) return;
        showLoader(true); $('creditWinningsBtn').disabled = true;
        clearStatus($('tmsStatus'));
        const updates = {};
        let totalCredited = 0;
        try {
            for (const row of rows) {
                const uid = row.dataset.uid;
                const kills = parseFloat(row.querySelector('.kills-input').value) || 0;
                const perKill = parseFloat(row.querySelector('.kills-input').dataset.perKill) || 0;
                const extra = parseFloat(row.querySelector('.extra-input').value) || 0;
                const rank = parseInt(row.querySelector('.rank-input').value) || null;
                const prize = (kills * perKill) + extra;
                if (prize <= 0) continue;
                const userSnap = await get(ref(db, `users/${uid}`));
                if (!userSnap.exists()) continue;
                const user = userSnap.val();
                const newBalance = (user.balance || 0) + prize;
                const newWinning = (user.winningCash || 0) + prize;
                updates[`users/${uid}/balance`] = newBalance;
                updates[`users/${uid}/winningCash`] = newWinning;
                if (rank) updates[`tournaments/${tournamentId}/registeredPlayers/${uid}/rank`] = rank;
                const txKey = push(ref(db, `transactions/${uid}`)).key;
                updates[`transactions/${uid}/${txKey}`] = { type: 'tournament_winnings', amount: prize, kills, extra, rank: rank || null, tournamentId, description: `Tournament Prize`, timestamp: serverTimestamp(), status: 'completed', balanceAfter: newBalance, staffUid: currentUser.uid };
                totalCredited++;
            }
            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                showStatus($('tmsStatus'), `Winnings credited to ${totalCredited} player(s)!`, "success");
            } else {
                showStatus($('tmsStatus'), "No winnings to credit (all prizes are रु0).", "info");
            }
        } catch (e) { showStatus($('tmsStatus'), `Error: ${e.message}`, "danger", false); console.error(e); }
        finally { showLoader(false); $('creditWinningsBtn').disabled = false; }
    }

    // ============================================================
    // LEADERBOARD MGT
    // ============================================================
    async function loadLeaderboardData() {
        if (!db || !currentUser) return;
        const tbody = $('leaderboardMgtTableBody');
        const statusEl = $('leaderboardMgtStatus');
        clearStatus(statusEl);
        $('leaderboardUserSearchInput').value = '';
        tbody.innerHTML = placeholders(3);
        try {
            if (Object.keys(fullUserDataCache).length === 0) {
                const snap = await get(ref(db, 'users'));
                if (snap.exists()) snap.forEach(c => { fullUserDataCache[c.key] = { uid: c.key, ...c.val() }; });
            }
            const users = Object.values(fullUserDataCache);
            if (users.length === 0) { tbody.innerHTML = `<tr><td colspan="3" class="text-center p-3 text-muted">No users found.</td></tr>`; return; }
            users.sort((a,b) => (a.displayName||'z').localeCompare(b.displayName||'z'));
            renderLeaderboardTable(users);
        } catch (e) { tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger p-3">Error: ${e.message}</td></tr>`; showStatus(statusEl, `Error: ${e.message}`, "danger"); }
    }

    function renderLeaderboardTable(usersArr) {
        const tbody = $('leaderboardMgtTableBody');
        tbody.innerHTML = usersArr.map(u => `
            <tr data-uid="${u.uid}" data-name="${(u.displayName||'').toLowerCase()}" data-email="${(u.email||'').toLowerCase()}">
                <td><div>${sanitize(u.displayName||'N/A')}</div><small class="text-muted">${sanitize(u.email||'N/A')}</small></td>
                <td><input type="number" class="form-control form-control-sm rank-input" style="width:100px;" value="${u.leaderboardRank||''}" placeholder="N/A" min="1"></td>
                <td><input type="number" class="form-control form-control-sm earnings-input" style="width:150px;" value="${u.leaderboardDisplayEarnings??''}" placeholder="e.g., 5000" min="0" step="any"></td>
            </tr>`).join('') || `<tr><td colspan="3" class="text-center p-3 text-muted">No users found.</td></tr>`;
    }

    function filterLeaderboardUsers() {
        const term = $('leaderboardUserSearchInput').value.toLowerCase().trim();
        $('leaderboardMgtTableBody').querySelectorAll('tr[data-uid]').forEach(row => {
            row.style.display = (row.dataset.name.includes(term) || row.dataset.email.includes(term)) ? '' : 'none';
        });
    }

    async function saveLeaderboardData() {
        if (!db || !currentUser) return;
        if (!confirm("Save all leaderboard changes?")) return;
        const statusEl = $('leaderboardMgtStatus');
        clearStatus(statusEl);
        showLoader(true); $('saveLeaderboardBtn').disabled = true;
        const updates = {};
        $('leaderboardMgtTableBody').querySelectorAll('tr[data-uid]').forEach(row => {
            const uid = row.dataset.uid;
            const rank = parseInt(row.querySelector('.rank-input').value, 10);
            const earnings = parseFloat(row.querySelector('.earnings-input').value);
            updates[`users/${uid}/leaderboardRank`] = (!isNaN(rank) && rank > 0) ? rank : null;
            updates[`users/${uid}/leaderboardDisplayEarnings`] = (!isNaN(earnings) && earnings >= 0) ? earnings : null;
        });
        try {
            await update(ref(db), updates);
            showStatus(statusEl, "Leaderboard saved!", "success", 3000);
        } catch (e) { showStatus(statusEl, `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); $('saveLeaderboardBtn').disabled = false; }
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    async function sendGlobalNotification(e) {
        e.preventDefault();
        if (!db || !currentUser) return;
        const statusEl = $('globalNotificationStatus');
        clearStatus(statusEl);
        const title = $('globalNotifTitle').value.trim();
        const message = $('globalNotifMessage').value.trim();
        const imageUrl = $('globalNotifImageUrl').value.trim();
        if (!title || !message) { showStatus(statusEl, "Title and Message required.", "warning"); return; }
        showLoader(true);
        try {
            await set(push(ref(db, 'notifications')), { title, message, imageUrl: imageUrl || null, timestamp: serverTimestamp(), sentBy: currentUser.uid });
            showStatus(statusEl, "Global notification sent!", "success");
            $('globalNotificationForm').reset();
            loadNotificationHistory();
        } catch (e) { showStatus(statusEl, `Error: ${e.message}`, "danger", false); }
        finally { showLoader(false); }
    }

    async function loadNotificationHistory() {
        const histEl = $('globalNotificationsHistory');
        histEl.innerHTML = '<p class="text-muted">Loading...</p>';
        try {
            const snap = await get(ref(db, 'notifications'));
            if (!snap.exists()) { histEl.innerHTML = '<p class="text-center text-muted p-3">No notifications sent yet.</p>'; return; }
            const notifs = [];
            snap.forEach(c => notifs.push({ id: c.key, ...c.val() }));
            notifs.sort((a,b) => (b.timestamp||0)-(a.timestamp||0));
            histEl.innerHTML = `<table class="table table-dark table-hover mb-0">
                <thead><tr><th>Sent At</th><th>Title</th><th>Message</th><th>Image</th></tr></thead>
                <tbody>${notifs.map(n=>`<tr>
                    <td>${formatDate(n.timestamp)}</td>
                    <td>${sanitize(n.title)}</td>
                    <td style="white-space:pre-wrap;word-break:break-word;min-width:200px;">${sanitize(n.message)}</td>
                    <td>${n.imageUrl?`<a href="${sanitize(n.imageUrl)}" target="_blank">View</a>`:'<span class="text-muted">None</span>'}</td>
                </tr>`).join('')}</tbody>
            </table>`;
        } catch (e) { histEl.innerHTML = `<p class="text-danger p-3">Error: ${e.message}</p>`; }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    function init() {
        $('staffLoginForm')?.addEventListener('submit', loginStaff);
        $('logoutBtn')?.addEventListener('click', logout);

        // Sidebar nav
        document.querySelectorAll('#staffSidebar .nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const id = link.dataset.section;
                if (id && !link.classList.contains('active')) showSection(id);
                else { const oc = bootstrap.Offcanvas.getInstance($('staffSidebar')); if (oc) oc.hide(); }
            });
        });

        // Games table actions
        $('gamesTableBody')?.addEventListener('click', e => {
            const editBtn = e.target.closest('.btn-edit-game');
            const delBtn = e.target.closest('.btn-delete-game');
            if (editBtn) openEditGameModal(editBtn.dataset.id);
            if (delBtn) deleteGame(delBtn.dataset.id);
        });
        $('addNewGameBtn')?.addEventListener('click', () => { $('gameForm').reset(); $('gameEditId').value=''; $('gameModalTitle').textContent='Add New Game'; clearStatus($('gameStatus')); });
        $('saveGameBtn')?.addEventListener('click', saveGame);

        // Promotions table actions
        $('promotionsTableBody')?.addEventListener('click', e => {
            const editBtn = e.target.closest('.btn-edit-promo');
            const delBtn = e.target.closest('.btn-delete-promo');
            if (editBtn) openEditPromotionModal(editBtn.dataset.id);
            if (delBtn) deletePromotion(delBtn.dataset.id);
        });
        $('addNewPromotionBtn')?.addEventListener('click', () => { $('promotionForm').reset(); $('promotionEditId').value=''; $('promotionModalTitle').textContent='Add New Promotion'; clearStatus($('promotionStatus')); });
        $('savePromotionBtn')?.addEventListener('click', savePromotion);

        // Tournaments table actions
        $('tournamentsTableBody')?.addEventListener('click', e => {
            const editBtn = e.target.closest('.btn-edit-tournament');
            const viewBtn = e.target.closest('.btn-view-registered');
            const delBtn = e.target.closest('.btn-delete-tournament');
            if (editBtn) openEditTournamentModal(editBtn.dataset.id);
            if (viewBtn) openRegisteredPlayersModal(viewBtn.dataset.id, viewBtn.dataset.name);
            if (delBtn) deleteTournament(delBtn.dataset.id);
        });
        $('addNewTournamentBtn')?.addEventListener('click', () => { $('tournamentForm').reset(); $('tournamentEditId').value=''; currentEditingTournamentId=null; $('tournamentModalTitle').textContent='Add New Tournament'; clearStatus($('addTournamentStatus')); populateGameSelect(); });
        $('saveTournamentBtn')?.addEventListener('click', saveTournament);

        // Tournament Mgt
        $('tmsTournamentSelect')?.addEventListener('change', e => { if (e.target.value) loadPlayersForMgt(e.target.value); else { $('tmsPlayerListContainer').style.display='none'; } });
        $('creditWinningsBtn')?.addEventListener('click', creditAllWinnings);

        // Leaderboard
        $('saveLeaderboardBtn')?.addEventListener('click', saveLeaderboardData);
        $('leaderboardUserSearchInput')?.addEventListener('input', filterLeaderboardUsers);

        // Notifications
        $('globalNotificationForm')?.addEventListener('submit', sendGlobalNotification);

        // Theme
        $('saveThemeBtn')?.addEventListener('click', saveTheme);
        $('resetThemeBtn')?.addEventListener('click', resetTheme);
        $('presetBtnDefault')?.addEventListener('click', () => applyPresetToInputs('default'));
        $('presetBtnLight')?.addEventListener('click', () => applyPresetToInputs('light'));
        $('presetBtnGamingRed')?.addEventListener('click', () => applyPresetToInputs('gamingRed'));
        document.querySelectorAll('#themeSettingsForm input[type="color"]').forEach(inp => {
            inp.addEventListener('input', () => { document.documentElement.style.setProperty(`--${inp.dataset.themeVar}`, inp.value); });
        });

        // Auth state
        onAuthStateChanged(auth, handleAuthChange);
    }

    init();
