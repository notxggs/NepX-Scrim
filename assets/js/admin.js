// Firebase Imports
        import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
        import { getDatabase, ref, get, set, update, push, query, orderByChild, equalTo, onValue, off, remove, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
        import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
        const localApiBaseUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? `http://${window.location.hostname}:3000`
            : '';
        const API_BASE_URL = (window.APP_API_BASE_URL || localApiBaseUrl).replace(/\/+$/, '');

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

        
        let app, db, auth;
        try {
             if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
                console.warn("Admin Panel: Firebase config using placeholder values. Replace them with your actual project details.");
             }
             app = initializeApp(firebaseConfig);
             db = getDatabase(app);
             auth = getAuth(app);
             console.log("Admin Panel: Firebase Initialized (check config if using placeholders)");
        } catch (error) {
             console.error("Admin Panel: Firebase initialization failed:", error);
             document.body.innerHTML = `<div class="alert alert-danger m-5"><strong>Critical Error:</strong> Could not connect to Firebase services. Check console, config, and network. Error: ${error.message}</div>`;
        }

        const getElement = (id) => document.getElementById(id);
        const querySel = (selector) => document.querySelector(selector);
        const querySelAll = (selector) => document.querySelectorAll(selector);
        const elements = {
             adminLoader: getElement('adminLoader'),
             authContainer: getElement('auth-container'),
             loginSection: getElement('admin-login-section'),
             setupSection: getElement('admin-setup-section'),
             mainArea: getElement('admin-main-area'),
             adminLoginForm: getElement('adminLoginForm'),
             adminEmailInput: getElement('adminEmail'),
             adminPasswordInput: getElement('adminPassword'),
             adminLoginStatus: getElement('adminLoginStatus'),
             adminSetupForm: getElement('adminSetupForm'),
             setupEmailInput: getElement('setupEmail'),
             setupPasswordInput: getElement('setupPassword'),
             setupStatus: getElement('adminSetupStatus'),
             adminUserEmailDisplay: getElement('adminUserEmailShort'),
             adminLogoutBtn: getElement('adminLogoutBtnHeader'),
             sidebar: getElement('adminSidebar'),
             sidebarLinks: querySelAll('#adminSidebar .nav-link'),
             sections: querySelAll('#adminMainContent .section'),
             adminPageTitle: getElement('adminPageTitle'),
             adminHeaderLogo: getElement('adminHeaderLogo'),
             dashboardSection: getElement('dashboard-section'),
             statTotalUsers: getElement('statTotalUsers'),
             statActiveTournaments: getElement('statActiveTournaments'),
             statPendingWithdrawals: getElement('statPendingWithdrawals'),
             statCompletedWithdrawals: getElement('statCompletedWithdrawals'),
             statRejectedWithdrawals: getElement('statRejectedWithdrawals'),
             statTotalGames: getElement('statTotalGames'),
             statTotalPromotions: getElement('statTotalPromotions'),
             statFinishedTournaments: getElement('statFinishedTournaments'),
             dashboardStatus: getElement('dashboardStatus'),
             pendingWithdrawalCountBadge: getElement('pendingWithdrawalCountBadge'),
             newUserChartCanvas: getElement('newUserChart'),
             gamesTableBody: getElement('gamesTableBody'),
             gameModalEl: getElement('gameModal'),
             gameModalTitle: getElement('gameModalTitle'),
             gameForm: getElement('gameForm'),
             gameEditId: getElement('gameEditId'),
             gameNameInput: getElement('gameName'),
             gameImageFileInput: getElement('gameImageFile'),
             gameImageUrlInput: getElement('gameImageUrl'),
             saveGameBtn: getElement('saveGameBtn'),
             gameStatus: getElement('gameStatus'),
             gamesStatus: getElement('gamesStatus'),
             addNewGameBtn: getElement('addNewGameBtn'),
             promotionsTableBody: getElement('promotionsTableBody'),
             promotionModalEl: getElement('promotionModal'),
             promotionModalTitle: getElement('promotionModalTitle'),
             promotionForm: getElement('promotionForm'),
             promotionEditId: getElement('promotionEditId'),
             promoImageFileInput: getElement('promoImageFile'),
             promoImageUrlInput: getElement('promoImageUrl'),
             promoLinkInput: getElement('promoLink'),
             savePromotionBtn: getElement('savePromotionBtn'),
             promotionStatus: getElement('promotionStatus'),
             promotionsStatus: getElement('promotionsStatus'),
             addNewPromotionBtn: getElement('addNewPromotionBtn'),
             tournamentsTableBody: getElement('tournamentsTableBody'),
             addTournamentModalEl: getElement('addTournamentModal'),
             tournamentForm: getElement('tournamentForm'),
             tournamentModalTitle: getElement('tournamentModalTitle'),
             tournamentEditId: getElement('tournamentEditId'),
             tournamentGameSelect: getElement('tournamentGame'),
             tournamentNameInput: getElement('tournamentName'),
             tournamentStartTimeInput: getElement('tournamentStartTime'),
             tournamentStatusSelect: getElement('tournamentStatus'),
             tournamentEntryFeeInput: getElement('tournamentEntryFee'),
             tournamentPrizePoolInput: getElement('tournamentPrizePool'),
             tournamentPerKillInput: getElement('tournamentPerKill'),
             tournamentMaxPlayersInput: getElement('tournamentMaxPlayers'),
             tournamentTagsInput: getElement('tournamentTags'),
             tournamentBannerUrlInput: getElement('tournamentBannerUrl'),
             tournamentDescriptionInput: getElement('tournamentDescription'),
             tournamentRoomIdInput: getElement('tournamentRoomId'),
             tournamentRoomPasswordInput: getElement('tournamentRoomPassword'),
             tournamentShowIdPassCheckbox: getElement('tournamentShowIdPass'),
             tournamentModeSelect: getElement('tournamentMode'),
             saveTournamentBtn: getElement('saveTournamentBtn'),
             addNewTournamentBtn: getElement('addNewTournamentBtn'),
             addTournamentStatus: getElement('addTournamentStatus'),
             tournamentsStatus: getElement('tournamentsStatus'),
             usersSection: getElement('users-section'),
             usersTableBody: getElement('usersTableBody'),
             userSearchInput: getElement('userSearchInput'),
             downloadUsersPdfBtn: getElement('downloadUsersPdfBtn'),
             userModalEl: getElement('userModal'),
             userModalTitle: getElement('userModalTitle'),
             userDetailUid: getElement('userDetailUid'),
             userDetailEmail: getElement('userDetailEmail'),
             userDetailName: getElement('userDetailName'),
             userDetailCreatedAt: getElement('userDetailCreatedAt'),
             userDetailBalance: getElement('userDetailBalance'),
             userDetailWinning: getElement('userDetailWinning'),
             userDetailBonus: getElement('userDetailBonus'),
             userDetailReferralCode: getElement('userDetailReferralCode'),
             userDetailReferredBy: getElement('userDetailReferredBy'),
             userDetailReferredCount: getElement('userDetailReferredCount'),
             userDetailStatus: getElement('userDetailStatus'),
             updateBalanceForm: getElement('updateBalanceForm'),
             editUserUid: getElement('editUserUid'),
             balanceUpdateAmountInput: getElement('balanceUpdateAmount'),
             balanceUpdateTypeSelect: getElement('balanceUpdateType'),
             balanceUpdateReasonInput: getElement('balanceUpdateReason'),
             balanceUpdateStatus: getElement('balanceUpdateStatus'),
             userBlockBtn: getElement('userBlockBtn'),
             userDeleteBtn: getElement('userDeleteBtn'),
             addUserModalEl: getElement('addUserModal'),
             addUserForm: getElement('addUserForm'),
             newUserNameInput: getElement('newUserName'),
             newUserEmailInput: getElement('newUserEmail'),
             newUserPasswordInput: getElement('newUserPassword'),
             newUserInitialBalanceInput: getElement('newUserInitialBalance'),
             saveNewUserBtn: getElement('saveNewUserBtn'),
             addUserStatus: getElement('addUserStatus'),
             usersStatus: getElement('usersStatus'),
             staffSection: getElement('staff-section'),
             staffTableBody: getElement('staffTableBody'),
             staffSearchInput: getElement('staffSearchInput'),
             staffStatus: getElement('staffStatus'),
             addNewStaffBtn: getElement('addNewStaffBtn'),
             addStaffModalEl: getElement('addStaffModal'),
             addStaffForm: getElement('addStaffForm'),
             newStaffNameInput: getElement('newStaffName'),
             newStaffEmailInput: getElement('newStaffEmail'),
             newStaffPasswordInput: getElement('newStaffPassword'),
             saveNewStaffBtn: getElement('saveNewStaffBtn'),
             addStaffStatus: getElement('addStaffStatus'),
             staffModalEl: getElement('staffModal'),
             staffModalTitle: getElement('staffModalTitle'),
             editStaffUid: getElement('editStaffUid'),
             staffDetailEmail: getElement('staffDetailEmail'),
             staffDetailCreatedAt: getElement('staffDetailCreatedAt'),
             staffDetailStatus: getElement('staffDetailStatus'),
             editStaffNameForm: getElement('editStaffNameForm'),
             editStaffNameInput: getElement('editStaffName'),
             saveStaffNameBtn: getElement('saveStaffNameBtn'),
             staffResetPasswordBtn: getElement('staffResetPasswordBtn'),
             staffModalStatus: getElement('staffModalStatus'),
             staffBlockBtn: getElement('staffBlockBtn'),
             staffDeleteBtn: getElement('staffDeleteBtn'),
             statTotalStaff: getElement('statTotalStaff'),
             pendingWithdrawalsTableBody: getElement('pendingWithdrawalsTableBody'),
             completedWithdrawalsTableBody: getElement('completedWithdrawalsTableBody'),
             rejectedWithdrawalsTableBody: getElement('rejectedWithdrawalsTableBody'),
             withdrawalActionModalEl: getElement('withdrawalActionModal'),
             withdrawalDetailId: getElement('withdrawalDetailId'),
             withdrawalDetailUser: getElement('withdrawalDetailUser'),
             withdrawalDetailUserUid: getElement('withdrawalDetailUserUid'),
             withdrawalDetailAmount: getElement('withdrawalDetailAmount'),
             withdrawalDetailMethod: getElement('withdrawalDetailMethod'),
             withdrawalRejectReasonDiv: getElement('withdrawalRejectReasonDiv'),
             withdrawalRejectReasonInput: getElement('withdrawalRejectReason'),
             withdrawalApproveNoteDiv: getElement('withdrawalApproveNoteDiv'),
             withdrawalApproveNoteInput: getElement('withdrawalApproveNote'),
             withdrawalActionStatus: getElement('withdrawalActionStatus'),
             rejectWithdrawalBtn: getElement('rejectWithdrawalBtn'),
             approveWithdrawalBtn: getElement('approveWithdrawalBtn'),
             withdrawalsStatus: getElement('withdrawalsStatus'),
             depositSection: getElement('deposit-section'),
             pendingDepositsTableBody: getElement('pendingDepositsTableBody'),
             completedDepositsTableBody: getElement('completedDepositsTableBody'),
             rejectedDepositsTableBody: getElement('rejectedDepositsTableBody'),
             depositsStatus: getElement('depositsStatus'),
             pendingDepositCountBadge: getElement('pendingDepositCountBadge'),
             registeredPlayersModalEl: getElement('registeredPlayersModal'),
             registeredPlayersModalTitle: getElement('registeredPlayersModalTitle'),
             registeredPlayersTournamentName: getElement('registeredPlayersTournamentName'),
             registeredPlayersTableBody: getElement('registeredPlayersTableBody'),
             registeredPlayersStatus: getElement('registeredPlayersStatus'),
             downloadPlayersPdfBtn: getElement('downloadPlayersPdfBtn'),
             settingsSection: getElement('settings-section'),
             appSettingsForm: getElement('appSettingsForm'),
             settingLogoUrlInput: getElement('settingLogoUrl'),
             settingAppNameInput: getElement('settingAppName'),
             settingSignupBonusInput: getElement('settingSignupBonus'),
             settingMinWithdrawInput: getElement('settingMinWithdraw'),
             settingReferralBonusInput: getElement('settingReferralBonus'),
             settingSupportContactInput: getElement('settingSupportContact'),
             settingPolicyPrivacyInput: getElement('settingPolicyPrivacy'),
             settingPolicyTermsInput: getElement('settingPolicyTerms'),
             settingPolicyRefundInput: getElement('settingPolicyRefund'),
             settingPolicyFairPlayInput: getElement('settingPolicyFairPlay'),
             settingsStatus: getElement('settingsStatus'),
             addDemoDataBtn: getElement('addDemoDataBtn'),
             transactionsSection: getElement('transactions-section'),
             supportReportsTableBody: getElement('supportReportsTableBody'),
             supportReportsStatus: getElement('supportReportsStatus'),
             gameTopupsAdminStatus: getElement('gameTopupsAdminStatus'),
             gameTopupPackageForm: getElement('gameTopupPackageForm'),
             gameTopupAdminGame: getElement('gameTopupAdminGame'),
             gameTopupAdminPackageName: getElement('gameTopupAdminPackageName'),
             gameTopupAdminUnits: getElement('gameTopupAdminUnits'),
             gameTopupAdminPrice: getElement('gameTopupAdminPrice'),
             gameTopupPackagesTableBody: getElement('gameTopupPackagesTableBody'),
             gameTopupOrdersTableBody: getElement('gameTopupOrdersTableBody'),
             referralsSection: getElement('referrals-section'),
             referralsStatus: getElement('referralsStatus'),
             pendingReferralsTableBody: getElement('pendingReferralsTableBody'),
             completedReferralsTableBody: getElement('completedReferralsTableBody'),
             pendingReferralCountBadge: getElement('pendingReferralCountBadge'),
             notificationsSection: getElement('notifications-section'),
             globalNotificationForm: getElement('globalNotificationForm'),
             globalNotifTitleInput: getElement('globalNotifTitle'),
             globalNotifMessageInput: getElement('globalNotifMessage'),
             globalNotifImageUrlInput: getElement('globalNotifImageUrl'),
             globalNotificationStatus: getElement('globalNotificationStatus'),
             globalNotificationsHistory: getElement('globalNotificationsHistory'),
             individualNotificationForm: getElement('individualNotificationForm'),
             individualNotifTitleInput: getElement('individualNotifTitle'),
             individualNotifMessageInput: getElement('individualNotifMessage'),
             individualNotifImageUrlInput: getElement('individualNotifImageUrl'),
             individualNotificationStatus: getElement('individualNotificationStatus'),
             tournamentManagementSection: getElement('tournament-management-section'),
             tmsTournamentSelect: getElement('tmsTournamentSelect'),
             tmsStatus: getElement('tmsStatus'),
             tmsPlayerListContainer: getElement('tmsPlayerListContainer'),
             tmsPlayerListTableBody: getElement('tmsPlayerListTableBody'),
             creditWinningsBtn: getElement('creditWinningsBtn'),
             leaderboardMgtSection: getElement('leaderboard-mgt-section'),
             leaderboardMgtStatus: getElement('leaderboardMgtStatus'),
             leaderboardMgtTableBody: getElement('leaderboardMgtTableBody'),
             saveLeaderboardBtn: getElement('saveLeaderboardBtn'),
             leaderboardUserSearchInput: getElement('leaderboardUserSearchInput'),
             // New Analytics Elements
             userAnalyticsSection: getElement('user-analytics-section'),
             topSpendersContainer: getElement('topSpendersContainer'),
             mostActiveContainer: getElement('mostActiveContainer'),
             inactiveUsersContainer: getElement('inactiveUsersContainer'),
             // New Theme Elements
             themeSection: getElement('theme-section'),
             themeSettingsForm: getElement('themeSettingsForm'),
             themeStatus: getElement('themeStatus'),
             themeColorInputs: querySelAll('#themeSettingsForm input[type="color"]'),
             saveThemeBtn: getElement('saveThemeBtn'),
             resetThemeBtn: getElement('resetThemeBtn'),
             presetBtnDefault: getElement('presetBtnDefault'),
             presetBtnLight: getElement('presetBtnLight'),
             presetBtnGamingRed: getElement('presetBtnGamingRed'),
        };

        // Bootstrap Modal/Offcanvas Instances Cache
        let componentInstances = {};
        const getComponentInstance = (element, componentType = 'Modal') => {
            if (!element) return null;
            const instanceKey = `${componentType}-${element.id}`;
            if (!componentInstances[instanceKey]) {
                try {
                     if (componentType === 'Modal') componentInstances[instanceKey] = new bootstrap.Modal(element);
                     else if (componentType === 'Offcanvas') componentInstances[instanceKey] = new bootstrap.Offcanvas(element);
                     else if (componentType === 'Tab') componentInstances[instanceKey] = new bootstrap.Tab(element);
                     else if (componentType === 'Alert') componentInstances[instanceKey] = new bootstrap.Alert(element);
                     else if (componentType === 'Toast') componentInstances[instanceKey] = new bootstrap.Toast(element);
                     else { console.warn("Unknown Bootstrap component type:", componentType); return null; }
                } catch (e) {
                    console.error(`Error creating Bootstrap ${componentType} instance for #${element.id}:`, e);
                    return null;
                }
            }
            return componentInstances[instanceKey];
        }
        const getModalInstance = (element) => getComponentInstance(element, 'Modal');
        const getOffcanvasInstance = (element) => getComponentInstance(element, 'Offcanvas');

        // --- App State ---
        let currentAdminUser = null;
        let currentWithdrawalAction = { id: null, type: null, userId: null };
        let currentEditingItemId = null;
        let currentEditingTournamentId = null;
        let gameDataCache = {};
        let userDataCache = {};
        let fullUserDataCache = {};
        let staffDataCache = {};
        let fullStaffDataCache = {};
        let dbListeners = {};
        let isAdminSetupComplete = false;
        let designatedAdminUid = null;
        let appSettings = {};
        let currentPlayersListForPdf = []; // For tournament players PDF
        let newUserChart = null; // Chart instance holder

        // --- Admin Auth & Security ---
        function isDesignatedAdmin(user) { if (!user) return false; if (!designatedAdminUid) { console.warn("Designated Admin UID check failed: UID not loaded yet."); return false; } return user.uid === designatedAdminUid; }

        // --- Utility Functions ---
        const showLoader = (show) => { if (elements.adminLoader) elements.adminLoader.style.display = show ? 'flex' : 'none'; };
        function showStatus(element, message, type = 'danger', autohide = 5000) { if (!element) { console.warn("showStatus called with null element for message:", message); return; } const alertId = `status-alert-${element.id || Math.random().toString(36).substring(2)}`; element.style.display = 'block'; element.innerHTML = `<div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">${sanitizeHTML(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`; if (autohide && typeof autohide === 'number' && autohide > 0) { setTimeout(() => { const currentAlert = getElement(alertId); if (currentAlert) { try { const bsAlert = getComponentInstance(currentAlert, 'Alert'); if (bsAlert) bsAlert.close(); else currentAlert.remove(); } catch (e) { console.warn("Error closing alert:", e); currentAlert.remove(); } } }, autohide); } }
        function clearStatus(element) { if (!element) return; element.innerHTML = ''; }
        const formatDate = (timestamp) => { if (!timestamp) return 'N/A'; if (typeof timestamp === 'object' && timestamp.hasOwnProperty('.sv')) { return 'Pending...'; } const tsNumber = Number(timestamp); if (isNaN(tsNumber) || tsNumber <= 0) return 'Invalid Date'; try { const date = new Date(tsNumber); if (isNaN(date.getTime())) return 'Invalid Date'; return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short'}); } catch (e) { console.warn("Error formatting date:", timestamp, e); return 'Invalid Date'; } };
        const formatCurrency = (amount) => { const num = Number(amount); return isNaN(num) ? 'रु--' : `रु${num.toFixed(2)}`; }
        function sanitizeHTML(str) { if (str == null) return ''; str = String(str); const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; }
        function copyToClipboard(targetSelector) { const copyIcon = event?.target.closest('.copy-btn'); const context = copyIcon?.closest('.modal-body, tr'); const element = context?.querySelector(targetSelector); const textToCopy = element?.textContent?.trim(); if (!textToCopy) { console.warn("Copy target empty or not found:", targetSelector); return; } if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(textToCopy).then(() => { const toastEl = document.createElement('div'); toastEl.className = 'toast position-fixed bottom-0 end-0 p-3 m-3 text-bg-success border-0'; toastEl.setAttribute('role', 'alert'); toastEl.setAttribute('aria-live', 'assertive'); toastEl.setAttribute('aria-atomic', 'true'); toastEl.innerHTML = '<div class="toast-body">Copied!</div>'; document.body.appendChild(toastEl); const toast = getComponentInstance(toastEl, 'Toast'); if(toast) toast.show(); toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove()); }).catch(err => { console.warn('Clipboard writeText failed: ', err); alert('Could not copy.'); }); } else { const textArea = document.createElement("textarea"); textArea.value = textToCopy; textArea.style.position = "fixed"; textArea.style.left = "-9999px"; textArea.style.top = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { document.execCommand('copy'); alert('Copied! (fallback)'); } catch (err) { console.warn('Fallback copy failed: ', err); alert('Copy failed.'); } document.body.removeChild(textArea); } }
        const tableLoadingPlaceholderHtml = (cols) => `<tr class="loading-placeholder"><td colspan="${cols}"><div class="placeholder w-100 py-3"></div></td></tr>`.repeat(3);

        // --- UI Functions ---
        function showAdminSection(sectionId) {
             elements.sections.forEach(sec => sec.classList.remove('active'));
             const targetSection = getElement(sectionId);
             if (targetSection) {
                 targetSection.classList.add('active');
                 const linkElement = querySel(`#adminSidebar .nav-link[data-section="${sectionId}"]`);
                 let title = 'Admin Panel';
                 if (linkElement) {
                     const linkText = linkElement.textContent.trim() || sectionId.replace('-section', '').replace('-', ' ');
                     title = linkText.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                     const badge = linkElement.querySelector('.badge');
                     if (badge) { title = title.replace(badge.textContent, '').trim(); }
                 }

                 if(elements.adminPageTitle) elements.adminPageTitle.textContent = title;
                 elements.sidebarLinks?.forEach(link => { link.classList.toggle('active', link.dataset.section === sectionId); });

                 loadDataForSection(sectionId);

                 const sidebar = getOffcanvasInstance(elements.sidebar);
                 if (sidebar?._isShown) sidebar.hide();
             } else {
                 console.error("Section element not found:", sectionId);
                 showAdminSection('dashboard-section'); // Fallback
             }
        }

        function loadDataForSection(sectionId) {
             if (!currentAdminUser || !isDesignatedAdmin(currentAdminUser)) { console.warn("Attempted to load data without proper admin authorization."); showStatus(elements.dashboardStatus, "Admin not authorized.", "danger", false); return; }
             console.log(`Loading data for section: ${sectionId}`);

             clearStatus(elements.dashboardStatus); clearStatus(elements.gamesStatus); clearStatus(elements.promotionsStatus);
             clearStatus(elements.tournamentsStatus); clearStatus(elements.usersStatus); clearStatus(elements.withdrawalsStatus);
             clearStatus(elements.settingsStatus); clearStatus(elements.depositsStatus); clearStatus(elements.referralsStatus);
             clearStatus(elements.leaderboardMgtStatus); clearStatus(elements.staffStatus);
             clearStatus(elements.themeStatus); clearStatus(elements.supportReportsStatus); clearStatus(elements.gameTopupsAdminStatus);

             switch(sectionId) {
                 case 'dashboard-section': loadDashboardStats(); break;
                 case 'games-section': loadGames(); break;
                 case 'promotions-section': loadPromotions(); break;
                 case 'tournaments-section': loadTournaments(); break;
                 case 'users-section': loadUsers(); break;
                 case 'staff-section': loadStaff(); break;
                 case 'withdrawals-section': 
                    loadWithdrawals('pending'); 
                    loadWithdrawals('completed'); 
                    loadWithdrawals('rejected'); 
                    const activeWTabBtn = querySel('#withdrawalTabs .nav-link.active') || getElement('pending-tab'); 
                    if (activeWTabBtn) getComponentInstance(activeWTabBtn, 'Tab')?.show(); 
                    break;
                 case 'deposit-section': 
                    loadDepositRequests('pending'); 
                    loadDepositRequests('completed');
                    loadDepositRequests('rejected');
                    const activeDTabBtn = querySel('#depositTabs .nav-link.active') || getElement('pending-deposits-tab');
                    if (activeDTabBtn) getComponentInstance(activeDTabBtn, 'Tab')?.show();
                    break; 
                 case 'referrals-section':
                    loadReferrals('pending');
                    loadReferrals('completed');
                    const activeRTabBtn = querySel('#referralTabs .nav-link.active') || getElement('pending-referrals-tab');
                    if (activeRTabBtn) getComponentInstance(activeRTabBtn, 'Tab')?.show();
                    break;
                 case 'settings-section': loadSettings(); break;
                 case 'theme-section': loadThemeSettings(); break; // NEW
                 case 'notifications-section': loadGlobalNotificationHistory(); break;
                 case 'tournament-management-section': populateTournamentManagementSelector(); break;
                 case 'leaderboard-mgt-section': loadLeaderboardManagementData(); break;
                 case 'user-analytics-section': loadUserAnalyticsData(); break;
                 case 'transactions-section': if (elements.transactionsSection) elements.transactionsSection.innerHTML = '<div class="card-body"><h2 class="card-title">User Transactions</h2><p class="text-muted">Section under development.</p></div>'; break;
                 case 'support-reports-section': loadSupportReports(); break;
                 case 'game-topups-section': loadGameTopupsAdmin(); break;
                 default: console.warn("Unknown section requested:", sectionId); showStatus(elements.dashboardStatus, `Unknown section requested: ${sectionId}`, "warning");
             }
         }

        async function loadSupportReports() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            elements.supportReportsTableBody.innerHTML = tableLoadingPlaceholderHtml(6);
            try {
                const snapshot = await get(ref(db, 'supportReports'));
                const reports = [];
                snapshot.forEach((userSnapshot) => {
                    userSnapshot.forEach((reportSnapshot) => {
                        reports.push({ uid: userSnapshot.key, ...reportSnapshot.val() });
                    });
                });
                reports.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
                if (reports.length === 0) {
                    elements.supportReportsTableBody.innerHTML = '<tr><td colspan="6" class="text-muted">No support tickets have been submitted.</td></tr>';
                    return;
                }
                const labels = {
                    user_hacking: 'Account hacked / suspicious activity',
                    payment_not_received: 'Payment not received',
                    mistake: 'Mistake / incorrect result',
                    other: 'Other'
                };
                const statuses = ['open', 'in_progress', 'resolved', 'closed'];
                elements.supportReportsTableBody.innerHTML = reports.slice(0, 300).map((report) => {
                    const uid = sanitizeHTML(report.uid);
                    const reportId = sanitizeHTML(report.reportId);
                    const status = statuses.includes(report.status) ? report.status : 'open';
                    const attachments = Object.entries(report.attachments || {}).map(([attachmentId, file]) =>
                        `<button type="button" class="btn btn-sm btn-outline-info me-1 mb-1 report-attachment-download" data-uid="${uid}" data-report-id="${reportId}" data-attachment-id="${sanitizeHTML(attachmentId)}">${sanitizeHTML(file.originalName || 'Download file')}</button>`
                    ).join('') || '<span class="text-muted">None</span>';
                    const description = sanitizeHTML(report.description || '');
                    const details = description.length > 150
                        ? `<details><summary>View description</summary><p class="text-wrap mt-2">${description}</p></details>`
                        : `<span class="text-wrap">${description}</span>`;
                    const statusOptions = statuses.map((option) =>
                        `<option value="${option}"${option === status ? ' selected' : ''}>${option.replace(/_/g, ' ')}</option>`
                    ).join('');
                    return `<tr>
                        <td>${sanitizeHTML(formatDate(report.createdAt))}</td>
                        <td>${sanitizeHTML(report.userName || 'User')}<small class="d-block text-muted">${sanitizeHTML(report.userEmail || report.uid)}</small></td>
                        <td>${sanitizeHTML(labels[report.reportType] || 'Other')}</td>
                        <td class="text-wrap" style="min-width:220px;max-width:360px">${details}</td>
                        <td>${attachments}</td>
                        <td><select class="form-select form-select-sm support-report-status" data-uid="${uid}" data-report-id="${reportId}" aria-label="Ticket status">${statusOptions}</select></td>
                    </tr>`;
                }).join('');
            } catch (error) {
                console.error('Support report load failed:', error);
                showStatus(elements.supportReportsStatus, `Could not load support tickets: ${error.message}`, 'danger', false);
                elements.supportReportsTableBody.innerHTML = '<tr><td colspan="6" class="text-danger">Could not load reports. Check database access and retry.</td></tr>';
            }
        }

        async function updateSupportReportStatus(event) {
            const select = event.target.closest('.support-report-status');
            if (!select) return;
            const { uid, reportId } = select.dataset;
            if (!uid || !reportId || !isDesignatedAdmin(currentAdminUser)) return;
            const validStatuses = new Set(['open', 'in_progress', 'resolved', 'closed']);
            if (!validStatuses.has(select.value)) return;
            select.disabled = true;
            try {
                await update(ref(db, `supportReports/${uid}/${reportId}`), {
                    status: select.value,
                    updatedAt: serverTimestamp()
                });
                showStatus(elements.supportReportsStatus, 'Ticket status updated.', 'success');
            } catch (error) {
                console.error('Support ticket status update failed:', error);
                showStatus(elements.supportReportsStatus, `Could not update ticket: ${error.message}`, 'danger', false);
                await loadSupportReports();
            } finally {
                select.disabled = false;
            }
        }

        async function downloadSupportReportAttachment(button) {
            if (!currentAdminUser || !isDesignatedAdmin(currentAdminUser)) return;
            try {
                const token = await currentAdminUser.getIdToken();
                const { uid, reportId, attachmentId } = button.dataset;
                const response = await fetch(`${API_BASE_URL}/api/admin/support-reports/${encodeURIComponent(uid)}/${encodeURIComponent(reportId)}/attachments/${encodeURIComponent(attachmentId)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    const result = await response.json().catch(() => ({}));
                    throw new Error(result.error?.message || `Download failed (${response.status}).`);
                }
                const objectUrl = URL.createObjectURL(await response.blob());
                const downloadLink = document.createElement('a');
                downloadLink.href = objectUrl;
                downloadLink.download = (button.textContent || 'report-attachment').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
                document.body.appendChild(downloadLink);
                downloadLink.click();
                downloadLink.remove();
                setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            } catch (error) {
                console.error('Support attachment download failed:', error);
                showStatus(elements.supportReportsStatus, error.message, 'danger', false);
            }
        }

        async function loadGameTopupsAdmin() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            elements.gameTopupPackagesTableBody.innerHTML = tableLoadingPlaceholderHtml(5);
            elements.gameTopupOrdersTableBody.innerHTML = tableLoadingPlaceholderHtml(6);
            try {
                const [gamesSnapshot, catalogSnapshot, ordersSnapshot] = await Promise.all([
                    get(ref(db, 'games')),
                    get(ref(db, 'settings/gameTopupCatalog')),
                    get(ref(db, 'gameTopupOrders'))
                ]);
                const games = gamesSnapshot.val() || {};
                const catalog = catalogSnapshot.val() || {};
                const currentGame = elements.gameTopupAdminGame.value;
                elements.gameTopupAdminGame.replaceChildren(new Option('Choose a listed game', ''));
                Object.entries(games).filter(([, game]) => game?.name).forEach(([gameId, game]) => {
                    elements.gameTopupAdminGame.add(new Option(game.name, gameId));
                });
                if (currentGame && games[currentGame]) elements.gameTopupAdminGame.value = currentGame;

                const packages = [];
                Object.entries(catalog).forEach(([gameId, gamePackages]) => {
                    Object.entries(gamePackages || {}).forEach(([packageId, product]) => {
                        packages.push({ gameId, packageId, gameName: games[gameId]?.name || gameId, ...product });
                    });
                });
                elements.gameTopupPackagesTableBody.innerHTML = packages.length
                    ? packages.map((product) => `<tr>
                        <td>${sanitizeHTML(product.gameName)}</td>
                        <td>${sanitizeHTML(product.name)}</td>
                        <td>${sanitizeHTML(product.units)}</td>
                        <td>${formatCurrency(product.priceNpr)}</td>
                        <td><button type="button" class="btn btn-sm btn-outline-danger delete-game-topup-package" data-game-id="${sanitizeHTML(product.gameId)}" data-package-id="${sanitizeHTML(product.packageId)}">Remove</button></td>
                    </tr>`).join('')
                    : '<tr><td colspan="5" class="text-muted">No packages configured. Add a package above to make it available to users.</td></tr>';

                const orders = [];
                ordersSnapshot.forEach((userSnapshot) => {
                    userSnapshot.forEach((orderSnapshot) => {
                        orders.push({ uid: userSnapshot.key, ...orderSnapshot.val() });
                    });
                });
                orders.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
                elements.gameTopupOrdersTableBody.innerHTML = orders.length
                    ? orders.slice(0, 300).map((order) => {
                        const canFulfill = order.status === 'awaiting_fulfillment' || order.status === 'fulfilling';
                        const statusControl = canFulfill
                            ? `<select class="form-select form-select-sm game-topup-fulfillment" data-uid="${sanitizeHTML(order.uid)}" data-session-id="${sanitizeHTML(order.sessionId)}" aria-label="Fulfillment status"><option value="awaiting_fulfillment"${order.status === 'awaiting_fulfillment' ? ' selected' : ''}>Awaiting fulfillment</option><option value="fulfilling"${order.status === 'fulfilling' ? ' selected' : ''}>Fulfilling</option><option value="fulfilled">Fulfilled</option></select>`
                            : `<span class="badge text-bg-secondary">${sanitizeHTML(String(order.status || 'pending').replace(/_/g, ' '))}</span>`;
                        return `<tr>
                            <td>${sanitizeHTML(formatDate(order.verifiedAt || order.createdAt))}</td>
                            <td>${sanitizeHTML(order.uid)}</td>
                            <td>${sanitizeHTML(order.gameName)}<small class="d-block text-muted">${sanitizeHTML(order.packageName)}</small></td>
                            <td>${sanitizeHTML(order.playerId)}${order.serverId ? `<small class="d-block text-muted">Server: ${sanitizeHTML(order.serverId)}</small>` : ''}</td>
                            <td>${formatCurrency(order.priceNpr)}</td>
                            <td>${statusControl}</td>
                        </tr>`;
                    }).join('')
                    : '<tr><td colspan="6" class="text-muted">No game top-up orders yet.</td></tr>';
            } catch (error) {
                console.error('Game top-up admin data load failed:', error);
                showStatus(elements.gameTopupsAdminStatus, `Could not load game top-up data: ${error.message}`, 'danger', false);
                elements.gameTopupPackagesTableBody.innerHTML = '<tr><td colspan="5" class="text-danger">Could not load packages.</td></tr>';
                elements.gameTopupOrdersTableBody.innerHTML = '<tr><td colspan="6" class="text-danger">Could not load orders.</td></tr>';
            }
        }

        async function saveGameTopupPackage(event) {
            event.preventDefault();
            const gameId = elements.gameTopupAdminGame.value;
            const name = elements.gameTopupAdminPackageName.value.trim();
            const units = Number(elements.gameTopupAdminUnits.value);
            const priceNpr = Number(elements.gameTopupAdminPrice.value);
            if (!gameId || !name || name.length > 100 || !Number.isSafeInteger(units) || units < 1 ||
                !Number.isSafeInteger(priceNpr) || priceNpr < 50 || priceNpr > 100000) {
                showStatus(elements.gameTopupsAdminStatus, 'Choose a game and enter a package name, whole currency units, and price between रु 50 and रु 100000.', 'warning', false);
                return;
            }
            const button = elements.gameTopupPackageForm.querySelector('button[type="submit"]');
            button.disabled = true;
            try {
                const packageRef = push(ref(db, `settings/gameTopupCatalog/${gameId}`));
                await set(packageRef, { name, units, priceNpr, createdAt: serverTimestamp() });
                elements.gameTopupPackageForm.reset();
                showStatus(elements.gameTopupsAdminStatus, 'Game top-up package added.', 'success');
                await loadGameTopupsAdmin();
            } catch (error) {
                console.error('Game top-up package save failed:', error);
                showStatus(elements.gameTopupsAdminStatus, `Could not add package: ${error.message}`, 'danger', false);
            } finally {
                button.disabled = false;
            }
        }

        async function removeGameTopupPackage(button) {
            const { gameId, packageId } = button.dataset;
            if (!gameId || !packageId || !isDesignatedAdmin(currentAdminUser) ||
                !confirm('Remove this package from the user checkout?')) return;
            button.disabled = true;
            try {
                await remove(ref(db, `settings/gameTopupCatalog/${gameId}/${packageId}`));
                showStatus(elements.gameTopupsAdminStatus, 'Package removed from the checkout catalog.', 'success');
                await loadGameTopupsAdmin();
            } catch (error) {
                console.error('Game top-up package removal failed:', error);
                showStatus(elements.gameTopupsAdminStatus, `Could not remove package: ${error.message}`, 'danger', false);
                button.disabled = false;
            }
        }

        async function updateGameTopupFulfillment(event) {
            const select = event.target.closest('.game-topup-fulfillment');
            if (!select || !isDesignatedAdmin(currentAdminUser)) return;
            const { uid, sessionId } = select.dataset;
            if (!uid || !sessionId || !['awaiting_fulfillment', 'fulfilling', 'fulfilled'].includes(select.value)) return;
            const status = select.value;
            select.disabled = true;
            try {
                const patch = { status, updatedAt: serverTimestamp() };
                if (status === 'fulfilled') patch.fulfilledAt = serverTimestamp();
                await update(ref(db, `gameTopupOrders/${uid}/${sessionId}`), patch);
                showStatus(elements.gameTopupsAdminStatus, 'Order fulfillment status updated.', 'success');
                await loadGameTopupsAdmin();
            } catch (error) {
                console.error('Game top-up fulfillment update failed:', error);
                showStatus(elements.gameTopupsAdminStatus, `Could not update fulfillment status: ${error.message}`, 'danger', false);
                select.disabled = false;
            }
        }

        // --- Firebase Auth Functions ---
        async function loginAdmin(event) { event.preventDefault(); if (!auth) return; const email = elements.adminEmailInput.value; const password = elements.adminPasswordInput.value; clearStatus(elements.adminLoginStatus); showLoader(true); try { await signInWithEmailAndPassword(auth, email, password); } catch (error) { console.error("Admin Login Error:", error); let message = `Login Failed: ${error.code}`; if (error.code === 'auth/network-request-failed') { message = "Login Failed: Network error."; } else if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(error.code)) { message = "Login Failed: Invalid email or password."; } else if (error.code === 'auth/too-many-requests') { message = "Login Failed: Too many attempts."; } showStatus(elements.adminLoginStatus, message, 'danger', false); } finally { showLoader(false); } }
        async function logoutAdminUser() { if (!auth) return; showLoader(true); try { await signOut(auth); } catch (error) { console.error("Admin Logout Error:", error); alert("Logout failed: " + error.message); } }
        async function checkAdminSetup() { if (!db) return false; const adminConfigRef = ref(db, 'adminConfig'); try { console.log("Checking admin setup..."); const snapshot = await get(adminConfigRef); if (snapshot.exists()) { const d = snapshot.val(); isAdminSetupComplete = d.setupComplete === true; designatedAdminUid = d.adminUid || null; } else { isAdminSetupComplete = false; designatedAdminUid = null; } console.log("Admin setup check:", isAdminSetupComplete, "| UID:", designatedAdminUid); return isAdminSetupComplete; } catch (error) { console.error("Error checking admin setup:", error); const el = elements.loginSection?.style.display === 'block' ? elements.adminLoginStatus : elements.setupStatus; if (el) showStatus(el, `Config check error: ${error.message}. Check Rules.`, "danger", false); isAdminSetupComplete = false; designatedAdminUid = null; return false; } }
        async function setupAdmin(event) { event.preventDefault(); if (!auth || !db || isAdminSetupComplete) return; const email = elements.setupEmailInput.value.trim(); const password = elements.setupPasswordInput.value; clearStatus(elements.setupStatus); if (password.length < 6) { showStatus(elements.setupStatus, "Password min 6 chars.", "warning"); return; } showLoader(true); try { const cred = await createUserWithEmailAndPassword(auth, email, password); const uid = cred.user.uid; console.log("Admin user created in Auth:", uid); await set(ref(db, 'adminConfig'), { setupComplete: true, adminUid: uid }); console.log("Admin setup complete in DB."); isAdminSetupComplete = true; designatedAdminUid = uid; await signOut(auth); alert("Admin account created! Please login now."); await handleInitialLoad(); } catch (error) { console.error("Admin Setup Error:", error); let message = `Setup failed: ${error.message}`; if (error.code === 'auth/email-already-in-use') message = "Email already in use."; else if (error.code === 'auth/weak-password') message = "Password is too weak."; else if (error.code === 'auth/invalid-email') message = "Invalid email format."; else if (error.code === 'permission-denied') message = "Setup failed: Permission denied writing config. Check Firebase Rules for '/adminConfig'."; showStatus(elements.setupStatus, message, "danger", false); isAdminSetupComplete = false; designatedAdminUid = null; } finally { showLoader(false); } }
        async function handleInitialLoad() { if (!auth || !db) return; showLoader(true); await checkAdminSetup(); elements.setupSection.style.display = 'none'; elements.loginSection.style.display = 'none'; elements.mainArea.style.display = 'none'; elements.authContainer.style.display = 'block'; if (!isAdminSetupComplete) { elements.setupSection.style.display = 'block'; console.log("Showing Setup Form"); } else { elements.loginSection.style.display = 'block'; console.log("Showing Login Form"); } showLoader(false); }
        async function handleAdminAuthStateChange(user) { if (!auth || !db) return; console.log("Auth State Changed. User:", user ? user.uid : 'null'); showLoader(true); currentAdminUser = user; detachAllAdminListeners(); if (user) { if (!designatedAdminUid) await checkAdminSetup(); if (isDesignatedAdmin(user)) { console.log("Admin Authenticated & Authorized:", user.email); if (elements.adminUserEmailDisplay) elements.adminUserEmailDisplay.textContent = user.email; elements.authContainer.style.display = 'none'; elements.mainArea.style.display = 'block'; await loadSettings(); showAdminSection('dashboard-section'); setupRealtimeAdminListeners(); } else { console.warn("Unauthorized user login attempt:", user.email, "| UID:", user.uid, "| Expected:", designatedAdminUid); alert(`Access Denied. ${user.email} is not the designated admin.`); await logoutAdminUser(); return; } } else { console.log("Auth State: Logged Out"); currentAdminUser = null; designatedAdminUid = null; isAdminSetupComplete = false; elements.mainArea.style.display = 'none'; elements.authContainer.style.display = 'block'; gameDataCache = {}; userDataCache = {}; fullUserDataCache = {}; appSettings = {}; if(elements.adminHeaderLogo) { elements.adminHeaderLogo.src='https://via.placeholder.com/35/1E293B/94A3B8?text=L'; elements.adminHeaderLogo.style.display='none'; } if(elements.adminPageTitle) elements.adminPageTitle.textContent='Admin Panel'; document.title='Admin Panel'; if(elements.adminUserEmailDisplay) elements.adminUserEmailDisplay.textContent=''; Object.values(elements).filter(el => el.id?.startsWith('stat')).forEach(el => el.textContent = '--'); if(elements.pendingWithdrawalCountBadge) { elements.pendingWithdrawalCountBadge.textContent='0'; elements.pendingWithdrawalCountBadge.style.display='none';} if(elements.userSearchInput) elements.userSearchInput.value = ''; await handleInitialLoad(); } setTimeout(() => showLoader(false), 150); }

        // --- Database Load Functions ---
        async function loadDashboardStats() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; console.log("Loading dashboard stats..."); clearStatus(elements.dashboardStatus); Object.values(elements).filter(el => el.id?.startsWith('stat')).forEach(el => el.textContent = '...'); const usersRef = ref(db, 'users'); const gamesRef = ref(db, 'games'); const promotionsRef = ref(db, 'promotions'); const tournamentsRef = ref(db, 'tournaments'); const withdrawalsRef = ref(db, 'withdrawals'); const staffRef = ref(db, 'staff'); const activeTournamentsQuery = query(tournamentsRef, orderByChild('status')); const pendingWithdrawalsQuery = query(withdrawalsRef, orderByChild('status'), equalTo('pending')); const completedWithdrawalsQuery = query(withdrawalsRef, orderByChild('status'), equalTo('completed')); const rejectedWithdrawalsQuery = query(withdrawalsRef, orderByChild('status'), equalTo('rejected')); const results = await Promise.allSettled([ get(usersRef), get(gamesRef), get(promotionsRef), get(activeTournamentsQuery), get(pendingWithdrawalsQuery), get(completedWithdrawalsQuery), get(rejectedWithdrawalsQuery), get(staffRef) ]); let errorsFound = false; const setError = (element) => { element.textContent = 'Error'; errorsFound = true; }; if (results[0].status === 'fulfilled') elements.statTotalUsers.textContent = results[0].value.exists() ? results[0].value.size : 0; else { console.error("Err Users:", results[0].reason); setError(elements.statTotalUsers); showStatus(elements.dashboardStatus, `Err Users: ${results[0].reason?.message}`, "warning"); } if (results[1].status === 'fulfilled') elements.statTotalGames.textContent = results[1].value.exists() ? results[1].value.size : 0; else { console.error("Err Games:", results[1].reason); setError(elements.statTotalGames); } if (results[2].status === 'fulfilled') elements.statTotalPromotions.textContent = results[2].value.exists() ? results[2].value.size : 0; else { console.error("Err Promos:", results[2].reason); setError(elements.statTotalPromotions); } if (results[3].status === 'fulfilled') { let activeCount = 0; let finishedCount = 0; if (results[3].value.exists()) { results[3].value.forEach(child => { const status = child.val()?.status; if (status === 'ongoing' || status === 'upcoming') activeCount++; else if (status === 'completed' || status === 'result' || status === 'cancelled') finishedCount++; }); } elements.statActiveTournaments.textContent = activeCount; elements.statFinishedTournaments.textContent = finishedCount; } else { console.error("Err Tournaments:", results[3].reason); setError(elements.statActiveTournaments); setError(elements.statFinishedTournaments); if (results[3].reason?.message?.includes("index")) showStatus(elements.dashboardStatus, "WARNING: Tournament query fail. Add '.indexOn': 'status' to '/tournaments' rules.", "warning", false); else showStatus(elements.dashboardStatus, `Err Tournaments: ${results[3].reason?.message}`, "warning"); } if (results[4].status === 'fulfilled') { const count = results[4].value.exists() ? results[4].value.size : 0; elements.statPendingWithdrawals.textContent = count; elements.pendingWithdrawalCountBadge.textContent = count; elements.pendingWithdrawalCountBadge.style.display = count > 0 ? 'inline-block' : 'none'; } else { console.error("Err Pending Withdrawals:", results[4].reason); setError(elements.statPendingWithdrawals); elements.pendingWithdrawalCountBadge.textContent = 'Err'; elements.pendingWithdrawalCountBadge.style.display = 'inline-block'; if (results[4].reason?.message?.includes("index")) showStatus(elements.dashboardStatus, "CRITICAL: Pending withdrawal query fail. Add '.indexOn': 'status' to '/withdrawals' rules.", "danger", false); else showStatus(elements.dashboardStatus, `Err Pending Withdrawals: ${results[4].reason?.message}`, "warning"); } if (results[5].status === 'fulfilled') elements.statCompletedWithdrawals.textContent = results[5].value.exists() ? results[5].value.size : 0; else { console.error("Err Completed Withdrawals:", results[5].reason); setError(elements.statCompletedWithdrawals); if (results[5].reason?.message?.includes("index")) showStatus(elements.dashboardStatus, "WARNING: Completed withdrawal query fail. Add '.indexOn': 'status' to '/withdrawals' rules.", "warning", false); } if (results[6].status === 'fulfilled') elements.statRejectedWithdrawals.textContent = results[6].value.exists() ? results[6].value.size : 0; else { console.error("Err Rejected Withdrawals:", results[6].reason); setError(elements.statRejectedWithdrawals); if (results[6].reason?.message?.includes("index")) showStatus(elements.dashboardStatus, "WARNING: Rejected withdrawal query fail. Add '.indexOn': 'status' to '/withdrawals' rules.", "warning", false); } if (results[7].status === 'fulfilled') elements.statTotalStaff.textContent = results[7].value.exists() ? results[7].value.size : 0; else { console.error("Err Staff:", results[7].reason); setError(elements.statTotalStaff); } renderNewUserChart(); console.log("Dashboard stats loading complete.", errorsFound ? "Errors occurred." : ""); }
        async function loadGames() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; const gamesRef = ref(db, 'games'); elements.gamesTableBody.innerHTML = tableLoadingPlaceholderHtml(4); gameDataCache = {}; clearStatus(elements.gamesStatus); try { const snapshot = await get(gamesRef); let tableHtml = ''; if (snapshot.exists()) { snapshot.forEach(childSnapshot => { const gameId = childSnapshot.key; const game = childSnapshot.val(); if (game && game.name) { gameDataCache[gameId] = game.name; tableHtml += `<tr><td><img src="${sanitizeHTML(game.imageUrl || 'https://via.placeholder.com/60x40/1E293B/94A3B8?text=N/A')}" alt="${sanitizeHTML(game.name)}" class="preview-img"></td><td>${sanitizeHTML(game.name)}</td><td><small class="text-muted">${sanitizeHTML(gameId)}</small> <i class="bi bi-clipboard copy-btn ms-1" data-target="td:nth-child(3) > small" title="Copy Game ID"></i></td><td class="action-buttons"><button class="btn btn-sm btn-info btn-edit-game" data-id="${sanitizeHTML(gameId)}" title="Edit Game"><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm btn-danger btn-delete-game" data-id="${sanitizeHTML(gameId)}" title="Delete Game"><i class="bi bi-trash"></i></button></td></tr>`; } else { console.warn("Skipping invalid game data:", gameId, game); } }); } elements.gamesTableBody.innerHTML = tableHtml || `<tr><td colspan="4" class="text-center p-3 text-muted">No games found. Add one using the button above.</td></tr>`; if (elements.dashboardSection?.classList.contains('active')) { elements.statTotalGames.textContent = Object.keys(gameDataCache).length; } } catch (error) { console.error("Error loading games:", error); elements.gamesTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-3 text-danger">Error loading games: ${error.message}. Check console & Rules.</td></tr>`; showStatus(elements.gamesStatus, `Error loading games: ${error.message}. Check Rules.`, 'danger', false); if (elements.dashboardSection?.classList.contains('active')) elements.statTotalGames.textContent = 'Error'; } }
        async function loadPromotions() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; const promotionsRef = ref(db, 'promotions'); elements.promotionsTableBody.innerHTML = tableLoadingPlaceholderHtml(3); clearStatus(elements.promotionsStatus); let promoCount = 0; try { const snapshot = await get(promotionsRef); let tableHtml = ''; if (snapshot.exists()) { promoCount = snapshot.size; snapshot.forEach(childSnapshot => { const promoId = childSnapshot.key; const promo = childSnapshot.val(); if (promo && promo.imageUrl) { const displayLink = promo.link ? sanitizeHTML(promo.link) : ''; const shortLink = displayLink.length > 50 ? displayLink.substring(0, 50) + '...' : displayLink; tableHtml += `<tr><td><img src="${sanitizeHTML(promo.imageUrl)}" alt="Promotion" class="preview-img"></td><td>${promo.link ? `<a href="${displayLink}" target="_blank" class="text-info" title="${displayLink}">${shortLink}</a>` : '<span class="text-muted">No Link</span>'}</td><td class="action-buttons"><button class="btn btn-sm btn-info btn-edit-promo" data-id="${sanitizeHTML(promoId)}" title="Edit Promotion"><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm btn-danger btn-delete-promo" data-id="${sanitizeHTML(promoId)}" title="Delete Promotion"><i class="bi bi-trash"></i></button></td></tr>`; } else { console.warn("Skipping invalid promotion data:", promoId, promo); } }); } elements.promotionsTableBody.innerHTML = tableHtml || `<tr><td colspan="3" class="text-center p-3 text-muted">No promotions found.</td></tr>`; if (elements.dashboardSection?.classList.contains('active')) { elements.statTotalPromotions.textContent = promoCount; } } catch (error) { console.error("Error loading promotions:", error); elements.promotionsTableBody.innerHTML = `<tr><td colspan="3" class="text-center p-3 text-danger">Error loading promotions: ${error.message}. Check console & Rules.</td></tr>`; showStatus(elements.promotionsStatus, `Error loading promotions: ${error.message}. Check Rules.`, 'danger', false); if (elements.dashboardSection?.classList.contains('active')) elements.statTotalPromotions.textContent = 'Error'; } }
        async function loadTournaments() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; const tournamentsRef = ref(db, 'tournaments'); if (Object.keys(gameDataCache).length === 0) await loadGames(); elements.tournamentsTableBody.innerHTML = tableLoadingPlaceholderHtml(8); clearStatus(elements.tournamentsStatus); try { const snapshot = await get(tournamentsRef); let activeCount = 0; let finishedCount = 0; let tableHtml = ''; if (snapshot.exists()) { snapshot.forEach(childSnapshot => { const tournamentId = childSnapshot.key; const t = childSnapshot.val(); if (t && t.name && t.gameId && t.status) { const gameName = gameDataCache[t.gameId] || `<small class="text-warning" title="ID: ${t.gameId}">Unknown</small>`; let statusClass = 'secondary'; if (t.status === 'ongoing') { statusClass = 'success'; activeCount++; } else if (t.status === 'upcoming') { statusClass = 'info'; activeCount++; } else if (t.status === 'result') { statusClass = 'primary'; finishedCount++; } else if (t.status === 'completed') { statusClass = 'secondary'; finishedCount++; } else if (t.status === 'cancelled') { statusClass = 'danger'; finishedCount++; } const statusBadge = `<span class="status-badge text-bg-${statusClass}">${t.status}</span>`; const registeredCount = t.registeredPlayers ? Object.keys(t.registeredPlayers).length : 0; const maxPlayers = t.maxPlayers > 0 ? `/${t.maxPlayers}` : ''; const playersDisplay = `${registeredCount}${maxPlayers}`; tableHtml += `<tr><td>${sanitizeHTML(t.name)}</td><td>${gameName}</td><td>${formatCurrency(t.entryFee)}</td><td>${formatCurrency(t.prizePool)}</td><td>${formatDate(t.startTime)}</td><td>${statusBadge}</td><td>${playersDisplay}</td><td class="action-buttons"><button class="btn btn-sm btn-info btn-edit-tournament" data-id="${sanitizeHTML(tournamentId)}" title="Edit"><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm btn-secondary btn-view-registered" data-id="${sanitizeHTML(tournamentId)}" data-name="${sanitizeHTML(t.name)}" title="View Players"><i class="bi bi-people"></i></button><button class="btn btn-sm btn-danger btn-delete-tournament" data-id="${sanitizeHTML(tournamentId)}" title="Delete"><i class="bi bi-trash"></i></button></td></tr>`; } else { console.warn("Skipping invalid tournament data:", tournamentId, t); } }); } elements.tournamentsTableBody.innerHTML = tableHtml || `<tr><td colspan="8" class="text-center p-3 text-muted">No tournaments found.</td></tr>`; if (elements.dashboardSection?.classList.contains('active')) { elements.statActiveTournaments.textContent = activeCount; elements.statFinishedTournaments.textContent = finishedCount; } } catch (error) { console.error("Error loading tournaments:", error); elements.tournamentsTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-3 text-danger">Error: ${error.message}. Check Rules.</td></tr>`; showStatus(elements.tournamentsStatus, `Error loading tournaments: ${error.message}. Check Rules.`, 'danger', false); if (elements.dashboardSection?.classList.contains('active')) { elements.statActiveTournaments.textContent = 'Error'; elements.statFinishedTournaments.textContent = 'Error'; } } }
        function renderUsersTable(usersArray) { let tableHtml = ''; if (usersArray?.length > 0) { usersArray.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' })); usersArray.forEach(user => { if (user?.email && user.uid) { const status = user.status || 'active'; const statusBadge = `<span class="status-badge text-bg-${status === 'active' ? 'success' : 'danger'}">${status}</span>`; tableHtml += `<tr><td><small class="text-muted">${sanitizeHTML(user.uid)}</small> <i class="bi bi-clipboard copy-btn ms-1" data-target="td:first-child > small" title="Copy UID"></i></td><td>${sanitizeHTML(user.displayName || 'N/A')}</td><td>${sanitizeHTML(user.email)}</td><td>${formatCurrency(user.balance)}</td><td>${statusBadge}</td><td class="action-buttons"><button class="btn btn-sm btn-info btn-view-user" data-id="${sanitizeHTML(user.uid)}" title="View/Edit"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-danger btn-delete-user" data-id="${sanitizeHTML(user.uid)}" title="Delete (DB Only)"><i class="bi bi-trash"></i></button></td></tr>`; } }); } elements.usersTableBody.innerHTML = tableHtml || `<tr><td colspan="6" class="text-center p-3 text-muted">No users found matching criteria.</td></tr>`; }
        async function loadUsers() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; const usersRef = ref(db, 'users'); elements.usersTableBody.innerHTML = tableLoadingPlaceholderHtml(6); userDataCache = {}; fullUserDataCache = {}; clearStatus(elements.usersStatus); elements.userSearchInput.value = ''; const listenerKey = 'users'; if (dbListeners[listenerKey]) try { off(usersRef, 'value', dbListeners[listenerKey]); delete dbListeners[listenerKey]; console.log("Detached previous users listener."); } catch(e) { console.warn("Could not detach users listener", e); } dbListeners[listenerKey] = onValue(usersRef, (snapshot) => { console.log("Users data received via listener."); let userCount = 0; const usersArray = []; fullUserDataCache = {}; userDataCache = {}; if (snapshot.exists()) { snapshot.forEach(childSnapshot => { userCount++; const userId = childSnapshot.key; const user = childSnapshot.val(); if (user && user.email) { user.uid = userId; fullUserDataCache[userId] = user; userDataCache[userId] = { displayName: user.displayName || 'N/A', email: user.email, status: user.status || 'active', balance: user.balance || 0, winningCash: user.winningCash || 0 }; usersArray.push(user); } else { console.warn("Skipping invalid user data:", userId, user); } }); } renderUsersTable(usersArray); if (elements.dashboardSection?.classList.contains('active')) { elements.statTotalUsers.textContent = userCount; } console.log("Users table updated. Count:", userCount); }, (error) => { console.error("Error listening to users:", error); elements.usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-3 text-danger">Error: ${error.message}. Check Rules.</td></tr>`; showStatus(elements.usersStatus, `Error listening to users: ${error.message}. Check Rules.`, 'danger', false); fullUserDataCache = {}; userDataCache = {}; if (elements.dashboardSection?.classList.contains('active')) elements.statTotalUsers.textContent = 'Error'; try { if (dbListeners[listenerKey]) { off(usersRef, 'value', dbListeners[listenerKey]); delete dbListeners[listenerKey]; console.log("Detached failed users listener."); } } catch(e) { console.warn("Could not detach failed users listener.", e); } }); console.log("Attached new users listener."); }

        // --- Staff Management ---
        async function createSecondaryAuthUser(email, password) {
            // Creates a Firebase Auth user via a temporary secondary app instance
            // so the currently logged-in admin session is NOT replaced.
            const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`);
            const secondaryAuth = getAuth(secondaryApp);
            try {
                const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                const uid = cred.user.uid;
                await signOut(secondaryAuth);
                await deleteApp(secondaryApp);
                return uid;
            } catch (error) {
                try { await deleteApp(secondaryApp); } catch (e) { console.warn("Could not clean up secondary app", e); }
                throw error;
            }
        }

        function renderStaffTable(staffArray) {
            if (!elements.staffTableBody) return;
            if (!staffArray || staffArray.length === 0) { elements.staffTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-3 text-muted">No staff members found. Add one using the button above.</td></tr>`; return; }
            let html = '';
            staffArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            staffArray.forEach(staff => {
                const status = staff.status || 'active';
                const statusBadge = `<span class="status-badge text-bg-${status === 'active' ? 'success' : 'danger'}">${status}</span>`;
                html += `<tr><td>${sanitizeHTML(staff.name || 'N/A')}</td><td>${sanitizeHTML(staff.email)}</td><td>${statusBadge}</td><td>${formatDate(staff.createdAt)}</td><td class="action-buttons"><button class="btn btn-sm btn-info btn-view-staff" data-id="${sanitizeHTML(staff.uid)}" title="View / Edit"><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm btn-danger btn-delete-staff" data-id="${sanitizeHTML(staff.uid)}" title="Delete"><i class="bi bi-trash"></i></button></td></tr>`;
            });
            elements.staffTableBody.innerHTML = html;
        }

        function loadStaff() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const staffRef = ref(db, 'staff');
            elements.staffTableBody.innerHTML = tableLoadingPlaceholderHtml(5);
            staffDataCache = {}; fullStaffDataCache = {};
            clearStatus(elements.staffStatus);
            if (elements.staffSearchInput) elements.staffSearchInput.value = '';
            const listenerKey = 'staff';
            if (dbListeners[listenerKey]) { try { off(staffRef, 'value', dbListeners[listenerKey]); delete dbListeners[listenerKey]; } catch (e) { console.warn("Could not detach staff listener", e); } }
            dbListeners[listenerKey] = onValue(staffRef, (snapshot) => {
                let staffCount = 0; const staffArray = []; fullStaffDataCache = {}; staffDataCache = {};
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        staffCount++;
                        const staffId = childSnapshot.key;
                        const staff = childSnapshot.val();
                        if (staff && staff.email) { staff.uid = staffId; fullStaffDataCache[staffId] = staff; staffDataCache[staffId] = { name: staff.name || 'N/A', email: staff.email, status: staff.status || 'active' }; staffArray.push(staff); }
                    });
                }
                renderStaffTable(staffArray);
                if (elements.dashboardSection?.classList.contains('active')) { elements.statTotalStaff.textContent = staffCount; }
            }, (error) => {
                console.error("Error listening to staff:", error);
                elements.staffTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-3 text-danger">Error: ${error.message}. Check Rules.</td></tr>`;
                showStatus(elements.staffStatus, `Error listening to staff: ${error.message}. Check Rules.`, 'danger', false);
            });
        }

        function filterStaff() {
            const searchTerm = elements.staffSearchInput.value.toLowerCase().trim();
            const filtered = Object.values(fullStaffDataCache).filter(s => s.name?.toLowerCase().includes(searchTerm) || s.email?.toLowerCase().includes(searchTerm));
            renderStaffTable(filtered);
        }

        async function saveNewStaff() {
            if (!auth || !db || !isDesignatedAdmin(currentAdminUser)) return;
            const statusEl = elements.addStaffStatus;
            clearStatus(statusEl);
            const name = elements.newStaffNameInput.value.trim();
            const email = elements.newStaffEmailInput.value.trim();
            const password = elements.newStaffPasswordInput.value;
            if (!name || !email || !password) { showStatus(statusEl, "Name, Email, Password required.", "warning"); return; }
            if (password.length < 6) { showStatus(statusEl, "Password min 6 chars.", "warning"); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showStatus(statusEl, "Invalid Email format.", "warning"); return; }
            showLoader(true); elements.saveNewStaffBtn.disabled = true;
            try {
                const uid = await createSecondaryAuthUser(email, password);
                const staffData = { uid: uid, email: email, name: name, status: 'active', createdAt: serverTimestamp(), addedBy: currentAdminUser?.email || 'admin' };
                await set(ref(db, `staff/${uid}`), staffData);
                showStatus(statusEl, `Staff member ${name} created!`, "success", 4000);
                elements.addStaffForm.reset();
                getModalInstance(elements.addStaffModalEl)?.hide();
                loadDashboardStats();
            } catch (error) {
                console.error("Error creating staff:", error);
                let msg = `Error: ${error.message}`;
                if (error.code === 'auth/email-already-in-use') msg = "Email already registered.";
                else if (error.code === 'auth/weak-password') msg = "Password too weak.";
                else if (error.code === 'auth/invalid-email') msg = "Invalid email format.";
                else if (error.code === 'permission-denied') msg = "Permission denied creating staff/DB entry. Check Rules.";
                showStatus(statusEl, msg, "danger", false);
            } finally {
                showLoader(false); elements.saveNewStaffBtn.disabled = false;
            }
        }

        async function openStaffModal(staffId) {
            if (!staffId) return;
            clearStatus(elements.staffModalStatus);
            const staff = fullStaffDataCache[staffId];
            if (!staff) { showStatus(elements.staffStatus, "Staff record not found.", "danger", false); return; }
            elements.staffModalTitle.textContent = `Staff: ${sanitizeHTML(staff.name || 'N/A')}`;
            elements.editStaffUid.value = staffId;
            elements.staffDetailEmail.textContent = sanitizeHTML(staff.email || 'N/A');
            elements.staffDetailCreatedAt.textContent = formatDate(staff.createdAt);
            elements.editStaffNameInput.value = staff.name || '';
            const status = staff.status || 'active';
            elements.staffDetailStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            elements.staffDetailStatus.className = `fw-bold text-${status === 'active' ? 'success' : 'danger'}`;
            elements.staffBlockBtn.textContent = status === 'active' ? 'Block Staff' : 'Unblock Staff';
            elements.staffBlockBtn.className = `btn btn-sm ${status === 'active' ? 'btn-danger' : 'btn-success'}`;
            elements.staffBlockBtn.dataset.id = staffId;
            elements.staffBlockBtn.dataset.action = status === 'active' ? 'block' : 'unblock';
            elements.staffDeleteBtn.dataset.id = staffId;
            getModalInstance(elements.staffModalEl)?.show();
        }

        async function saveStaffName(event) {
            event.preventDefault();
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const staffId = elements.editStaffUid.value;
            const newName = elements.editStaffNameInput.value.trim();
            if (!staffId || !newName) { showStatus(elements.staffModalStatus, "Name cannot be empty.", "warning"); return; }
            showLoader(true);
            try {
                await update(ref(db, `staff/${staffId}`), { name: newName });
                if (fullStaffDataCache[staffId]) fullStaffDataCache[staffId].name = newName;
                elements.staffModalTitle.textContent = `Staff: ${sanitizeHTML(newName)}`;
                showStatus(elements.staffModalStatus, "Name updated!", "success", 3000);
                filterStaff();
            } catch (error) {
                console.error("Error updating staff name:", error);
                showStatus(elements.staffModalStatus, `Error: ${error.message}`, "danger", false);
            } finally { showLoader(false); }
        }

        async function toggleStaffBlock(event) {
            const button = event.target.closest('button');
            if (!button || !db || !isDesignatedAdmin(currentAdminUser)) return;
            const staffId = button.dataset.id;
            const currentAction = button.dataset.action;
            if (!staffId || !currentAction) return;
            const newStatus = currentAction === 'block' ? 'blocked' : 'active';
            if (!confirm(`Confirm ${currentAction} this staff member?`)) return;
            showLoader(true); button.disabled = true;
            try {
                await set(ref(db, `staff/${staffId}/status`), newStatus);
                if (fullStaffDataCache[staffId]) fullStaffDataCache[staffId].status = newStatus;
                elements.staffDetailStatus.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                elements.staffDetailStatus.className = `fw-bold text-${newStatus === 'active' ? 'success' : 'danger'}`;
                button.textContent = newStatus === 'active' ? 'Block Staff' : 'Unblock Staff';
                button.className = `btn btn-sm ${newStatus === 'active' ? 'btn-danger' : 'btn-success'}`;
                button.dataset.action = newStatus === 'active' ? 'block' : 'unblock';
                showStatus(elements.staffModalStatus, `Staff ${newStatus} successfully!`, "success", 3000);
                filterStaff();
            } catch (error) {
                console.error("Error toggling staff block:", error);
                showStatus(elements.staffModalStatus, `Error: ${error.message}`, "danger", false);
            } finally { showLoader(false); button.disabled = false; }
        }

        async function sendStaffPasswordReset() {
            if (!auth) return;
            const staffId = elements.editStaffUid.value;
            const staff = fullStaffDataCache[staffId];
            if (!staff?.email) { showStatus(elements.staffModalStatus, "Email not found for this staff member.", "warning"); return; }
            showLoader(true);
            try {
                await sendPasswordResetEmail(auth, staff.email);
                showStatus(elements.staffModalStatus, `Password reset email sent to ${staff.email}.`, "success", 5000);
            } catch (error) {
                console.error("Error sending password reset:", error);
                showStatus(elements.staffModalStatus, `Error: ${error.message}`, "danger", false);
            } finally { showLoader(false); }
        }

        async function deleteStaffRecord(staffId) {
            if (!db || !staffId || !isDesignatedAdmin(currentAdminUser)) return;
            const staffName = fullStaffDataCache[staffId]?.name || fullStaffDataCache[staffId]?.email || staffId;
            if (!confirm(`DELETE STAFF: ${staffName}?\n\nWARNING:\n- Removes staff data from the Database ONLY.\n- DOES NOT delete their Firebase Auth login (they can still sign in elsewhere unless you remove that separately).\n\nCannot be undone. Proceed?`)) return;
            showLoader(true);
            const modal = getModalInstance(elements.staffModalEl);
            if (modal?._isShown) modal.hide();
            try {
                await remove(ref(db, `staff/${staffId}`));
                delete fullStaffDataCache[staffId]; delete staffDataCache[staffId];
                showStatus(elements.staffStatus, `Staff ${staffName} deleted.`, "success", 4000);
                filterStaff();
                loadDashboardStats();
            } catch (error) {
                console.error("Error deleting staff:", error);
                showStatus(elements.staffStatus, `Error deleting staff: ${error.message}. Check Rules.`, "danger", false);
            } finally { showLoader(false); }
        }
        
        async function loadWithdrawals(status = 'pending') {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const targetTableBody = getElement(`${status}WithdrawalsTableBody`);
            if (!targetTableBody) {
                console.error(`Table body not found for status: ${status}`);
                return;
            }
            const q = query(ref(db, 'withdrawals'), orderByChild('status'), equalTo(status));
            targetTableBody.innerHTML = tableLoadingPlaceholderHtml(status === 'pending' ? 5 : 6);
            if (status === 'pending') clearStatus(elements.withdrawalsStatus);

            try {
                const snapshot = await get(q);
                let tableHtml = '';
                let count = 0;
                
                if (snapshot.exists()) {
                    count = snapshot.size;
                    const userIds = new Set();
                    snapshot.forEach(child => {
                        if (child.val()?.userId && !userDataCache[child.val().userId]) {
                            userIds.add(child.val().userId);
                        }
                    });

                    if (userIds.size > 0) {
                        const promises = Array.from(userIds).map(uid => 
                            get(ref(db, `users/${uid}`)).then(us => {
                                if (us.exists()) {
                                    const u = us.val();
                                    userDataCache[uid] = { displayName: u.displayName || 'N/A', email: u.email || uid, status: u.status || 'unknown' };
                                } else {
                                    userDataCache[uid] = { displayName: 'Unknown User', email: uid, status: 'deleted' };
                                }
                            })
                        );
                        await Promise.allSettled(promises);
                    }

                    const withdrawals = [];
                    snapshot.forEach(child => withdrawals.push({ id: child.key, ...child.val() }));
                    withdrawals.sort((a, b) => (b.requestTimestamp || 0) - (a.requestTimestamp || 0));

                    withdrawals.forEach(w => {
                         if (w && w.userId && w.amount != null && w.requestTimestamp) {
                            const user = userDataCache[w.userId] || { displayName: 'Loading...', email: w.userId, status: 'unknown' };
                            const userDisplay = `${sanitizeHTML(user.displayName)} (<small class="text-muted" title="${w.userId}">${sanitizeHTML(user.email)}</small>)`;
                            let methodDisplay = sanitizeHTML(w.methodDetails?.methodName || w.method || 'N/A');
                            if (w.methodDetails?.accountInfo) {
                                methodDisplay += `<small class="text-muted d-block" title="${sanitizeHTML(w.methodDetails.accountInfo)}">${sanitizeHTML(String(w.methodDetails.accountInfo)).substring(0, 40)}${String(w.methodDetails.accountInfo).length > 40 ? '...' : ''}</small>`;
                            }
                            const requestTime = formatDate(w.requestTimestamp);
                            const processedTime = formatDate(w.processedAt);
                            
                            let rowHtml = `<tr id="withdrawal-row-${w.id}"><td>${requestTime}</td>`;
                            if (status !== 'pending') rowHtml += `<td>${processedTime}</td>`;
                            rowHtml += `<td>${userDisplay}</td><td>${formatCurrency(w.amount)}</td><td>${methodDisplay}</td>`;
                            
                            if (status === 'pending') {
                                rowHtml += `<td class="action-buttons"><button class="btn btn-sm btn-success btn-approve-withdrawal" data-id="${sanitizeHTML(w.id)}" data-userid="${sanitizeHTML(w.userId)}" title="Approve"><i class="bi bi-check-circle"></i></button> <button class="btn btn-sm btn-danger btn-reject-withdrawal" data-id="${sanitizeHTML(w.id)}" data-userid="${sanitizeHTML(w.userId)}" title="Reject"><i class="bi bi-x-circle"></i></button></td>`;
                            } else if (status === 'completed') {
                                const note = sanitizeHTML(w.adminNote || '');
                                rowHtml += `<td><small title="${note}">${note.substring(0, 30)}${ note.length > 30 ? '...' : ''}</small></td>`;
                            } else if (status === 'rejected') {
                                const reason = sanitizeHTML(w.rejectReason || '');
                                rowHtml += `<td><small title="${reason}">${reason.substring(0, 30)}${ reason.length > 30 ? '...' : ''}</small></td>`;
                            }
                            rowHtml += `</tr>`;
                            tableHtml += rowHtml;
                        }
                    });
                }
                
                const emptyColspan = status === 'pending' ? 5 : 6;
                targetTableBody.innerHTML = tableHtml || `<tr><td colspan="${emptyColspan}" class="text-center p-3 text-muted">No ${status} withdrawals found.</td></tr>`;
                
                if (elements.dashboardSection?.classList.contains('active')) {
                    if (status === 'pending') elements.statPendingWithdrawals.textContent = count;
                    else if (status === 'completed') elements.statCompletedWithdrawals.textContent = count;
                    else if (status === 'rejected') elements.statRejectedWithdrawals.textContent = count;
                }
            } catch (error) {
                console.error(`Error loading ${status} withdrawals:`, error);
                const errorColspan = status === 'pending' ? 5 : 6;
                targetTableBody.innerHTML = `<tr><td colspan="${errorColspan}" class="text-center p-3 text-danger">Error loading: ${error.message}. Check Rules/Index.</td></tr>`;
                showStatus(elements.withdrawalsStatus, `Error loading ${status} withdrawals: ${error.message}. Check Rules/Index.`, 'danger', false);
            }
        }
        
        async function loadSettings() {
             if (!db || !isDesignatedAdmin(currentAdminUser)) return;
             console.log("Loading settings...");
             elements.appSettingsForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
             clearStatus(elements.settingsStatus);
             try {
                 const snapshot = await get(ref(db, 'settings'));
                 if (snapshot.exists()) {
                     appSettings = snapshot.val() || {};
                     elements.settingLogoUrlInput.value = appSettings.logoUrl || '';
                     elements.settingAppNameInput.value = appSettings.appName || '';
                     elements.settingSignupBonusInput.value = appSettings.signupBonus ?? 10;
                     elements.settingMinWithdrawInput.value = appSettings.minWithdraw ?? 50;
                     elements.settingReferralBonusInput.value = appSettings.referralBonus ?? 5;
                     elements.settingSupportContactInput.value = appSettings.supportContact || '';
                     elements.settingPolicyPrivacyInput.value = appSettings.policyPrivacy || '';
                     elements.settingPolicyTermsInput.value = appSettings.policyTerms || '';
                     elements.settingPolicyRefundInput.value = appSettings.policyRefund || '';
                     elements.settingPolicyFairPlayInput.value = appSettings.policyFairPlay || '';
                     if(elements.adminHeaderLogo) { const logoUrl = appSettings.logoUrl; elements.adminHeaderLogo.src = logoUrl || 'https://via.placeholder.com/35/1E293B/94A3B8?text=L'; elements.adminHeaderLogo.style.display = logoUrl ? 'inline-block' : 'none'; elements.adminHeaderLogo.alt = appSettings.appName ? `${appSettings.appName} Logo` : 'Logo'; }
                     document.title = `${appSettings.appName || 'Gaming Tournament'} - Admin Panel`;
                     
                     applyThemeToAdminPanel(appSettings.theme);
                     
                     console.log("Settings loaded and applied.");
                 } else {
                     console.log("No settings found.");
                     showStatus(elements.settingsStatus, "No settings found. Please configure.", "info", false);
                     elements.appSettingsForm.reset(); appSettings = {};
                     if(elements.adminHeaderLogo) elements.adminHeaderLogo.style.display = 'none'; document.title = 'Admin Panel';
                 }
             } catch (error) {
                 console.error("Error loading settings:", error);
                 showStatus(elements.settingsStatus, `Error loading settings: ${error.message}. Check Rules.`, "danger", false);
                 appSettings = {}; if(elements.adminHeaderLogo) elements.adminHeaderLogo.style.display = 'none'; document.title = 'Admin Panel';
             } finally {
                 elements.appSettingsForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
             }
         }
        
        async function loadDepositRequests(status = 'pending') {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const targetTableBody = getElement(`${status}DepositsTableBody`);
            if (!targetTableBody) { 
                console.error(`Deposit table body for status '${status}' not found.`);
                return;
            }
            const q = query(ref(db, 'deposits'), orderByChild('status'), equalTo(status));
            const placeholderCols = (status === 'pending') ? 6 : 5;
            targetTableBody.innerHTML = tableLoadingPlaceholderHtml(placeholderCols);
            if (status === 'pending') clearStatus(elements.depositsStatus);

            try {
                const snapshot = await get(q);
                let tableHtml = '';
                if (snapshot.exists()) {
                    const deposits = [];
                    snapshot.forEach(child => deposits.push({ id: child.key, ...child.val() }));
                    deposits.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

                    for (const d of deposits) {
                        let userDisplay = d.userEmail || d.userId;
                        if(d.userId && !userDataCache[d.userId]) {
                            const userSnap = await get(ref(db, `users/${d.userId}`));
                            if (userSnap.exists()) {
                                const u = userSnap.val();
                                userDataCache[d.userId] = { displayName: u.displayName || u.email };
                            }
                        }
                        if (userDataCache[d.userId]) {
                            userDisplay = `${userDataCache[d.userId].displayName} (<small class="text-muted">${d.userEmail}</small>)`;
                        }

                        const requestTime = formatDate(d.timestamp);
                        const processedTime = formatDate(d.processedAt);
                        
                        let rowHtml = `<tr id="deposit-row-${d.id}"><td>${requestTime}</td>`;
                        if(status !== 'pending') rowHtml += `<td>${processedTime}</td>`;
                        rowHtml += `<td>${userDisplay}</td>
                                    <td>${formatCurrency(d.amount)}</td>
                                    <td>${sanitizeHTML(d.utr || 'N/A')}</td>
                                    <td>${sanitizeHTML(d.paymentMethod || 'N/A')}</td>`;
                        
                        if (status === 'pending') {
                            rowHtml += `<td class="action-buttons">
                                        <select class="form-select form-select-sm deposit-action-select" data-id="${sanitizeHTML(d.id)}" data-userid="${sanitizeHTML(d.userId)}" data-amount="${d.amount}">
                                            <option value="">Select</option>
                                            <option value="complete">Complete</option>
                                            <option value="reject">Reject</option>
                                        </select>
                                      </td>`;
                        }
                        rowHtml += '</tr>';
                        tableHtml += rowHtml;
                    }
                }
                targetTableBody.innerHTML = tableHtml || `<tr><td colspan="${placeholderCols}" class="text-center p-3 text-muted">No ${status} deposits found.</td></tr>`;
            } catch (error) {
                console.error(`Error loading ${status} deposits:`, error);
                targetTableBody.innerHTML = `<tr><td colspan="${placeholderCols}" class="text-center p-3 text-danger">Error: ${error.message}.</td></tr>`;
                showStatus(elements.depositsStatus, `Error loading ${status} deposits: ${error.message}.`, 'danger', false);
            }
        }
        
        async function loadReferrals(status = 'pending') {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            
            const targetTableId = status === 'pending' ? 'pendingReferralsTableBody' : 'completedReferralsTableBody';
            const tableBody = getElement(targetTableId);
            if (!tableBody) return;

            const cols = status === 'pending' ? 4 : 4;
            tableBody.innerHTML = tableLoadingPlaceholderHtml(cols);
            
            try {
                const q = query(ref(db, 'pendingReferrals'), orderByChild('status'), equalTo(status));
                const snapshot = await get(q);
                let tableHtml = '';
                
                if (snapshot.exists()) {
                    const referrals = [];
                    snapshot.forEach(child => referrals.push({ id: child.key, ...child.val() }));
                    referrals.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

                    for(const refData of referrals) {
                        const referrerName = refData.referrerEmail || refData.referrerUid;
                        const referredName = refData.referredEmail || refData.referredUid;
                        
                        if (status === 'pending') {
                             tableHtml += `<tr id="ref-row-${refData.id}">
                                <td>${formatDate(refData.timestamp)}</td>
                                <td>${sanitizeHTML(referrerName)}</td>
                                <td>${sanitizeHTML(referredName)}</td>
                                <td class="action-buttons"><button class="btn btn-sm btn-success btn-credit-referral" data-id="${refData.id}" data-referrer-uid="${refData.referrerUid}" title="Credit Bonus"><i class="bi bi-gift-fill"></i> Credit</button></td>
                            </tr>`;
                        } else { // 'credited'
                            tableHtml += `<tr>
                                <td>${formatDate(refData.creditedAt)}</td>
                                <td>${sanitizeHTML(referrerName)}</td>
                                <td>${sanitizeHTML(referredName)}</td>
                                <td class="text-success">${formatCurrency(refData.bonusAmount)}</td>
                            </tr>`;
                        }
                    }
                }

                tableBody.innerHTML = tableHtml || `<tr><td colspan="${cols}" class="text-center p-3 text-muted">No ${status} referrals found.</td></tr>`;

            } catch (error) {
                 console.error(`Error loading ${status} referrals:`, error);
                 tableBody.innerHTML = `<tr><td colspan="${cols}" class="text-center p-3 text-danger">Error: ${error.message}. Check Rules/Index.</td></tr>`;
            }
        }
        
        // --- Database Save/Update/Delete Functions ---
        async function uploadAdminImage(file, statusElement) {
            if (!file) throw new Error("File not selected.");
            if (!currentAdminUser) throw new Error("An authenticated admin account is required.");
            const formData = new FormData();
            formData.append("image", file);
            if (statusElement) {
                statusElement.textContent = "Uploading...";
                statusElement.style.color = "var(--text-secondary)";
                statusElement.style.display = "block";
            }
            try {
                const token = await currentAdminUser.getIdToken();
                const response = await fetch(`${API_BASE_URL}/api/admin/uploads/image`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || typeof result.imageUrl !== "string") {
                    throw new Error(result.error?.message || `Image upload failed (${response.status}).`);
                }
                if (statusElement) statusElement.textContent = "Upload complete!";
                return result.imageUrl;
            } catch (error) {
                if (statusElement) {
                    statusElement.textContent = `Upload Error: ${error.message}`;
                    statusElement.style.color = "var(--danger-color)";
                }
                throw error;
            }
        }
        async function saveGame() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; const gameId = elements.gameEditId.value; const isEditing = !!gameId; const name = elements.gameNameInput.value.trim(); const imageUrlInput = elements.gameImageUrlInput.value.trim(); const imageFile = elements.gameImageFileInput.files[0]; const statusEl = elements.gameStatus; const imgbbStatusEl = elements.gameForm?.querySelector('.image-upload-status'); clearStatus(statusEl); if (imgbbStatusEl) { imgbbStatusEl.textContent = ''; imgbbStatusEl.style.display = 'none'; } if (!name) { showStatus(statusEl, "Game Name is required.", "warning"); return; } if (!imageUrlInput && !imageFile && !isEditing) { showStatus(statusEl, "Image URL or File Upload required for new game.", "warning"); return; } if (!imageUrlInput && !imageFile && isEditing) { showStatus(statusEl, "Image URL cannot be empty when editing.", "warning"); return; } showLoader(true); elements.saveGameBtn.disabled = true; let finalImageUrl = imageUrlInput; try { if (imageFile) { finalImageUrl = await uploadAdminImage(imageFile, imgbbStatusEl); } if (!finalImageUrl) { throw new Error("Image URL is missing after potential upload."); } const gameData = { name: name, imageUrl: finalImageUrl }; if (isEditing) { gameData.updatedAt = serverTimestamp(); const gameRef = ref(db, `games/${gameId}`); await update(gameRef, gameData); console.log("Game updated successfully:", gameId); showStatus(elements.gamesStatus, "Game updated successfully!", "success", 3000); } else { gameData.createdAt = serverTimestamp(); const newGameRef = push(ref(db, 'games')); await set(newGameRef, gameData); console.log("Game added successfully, key:", newGameRef.key); showStatus(elements.gamesStatus, "Game added successfully!", "success", 3000); } elements.gameForm.reset(); elements.gameEditId.value = ''; if (imgbbStatusEl) { imgbbStatusEl.textContent = ''; imgbbStatusEl.style.display = 'none'; } getModalInstance(elements.gameModalEl)?.hide(); loadGames(); } catch (error) { console.error("Error saving game:", error); showStatus(statusEl, `Error saving game: ${error.message}. Check console & Rules.`, "danger", false); if (imgbbStatusEl && !imgbbStatusEl.textContent.includes('Error')) { imgbbStatusEl.style.display = 'none'; } } finally { showLoader(false); elements.saveGameBtn.disabled = false; } }
        async function savePromotion() { if (!db || !isDesignatedAdmin(currentAdminUser)) return; const promoId = elements.promotionEditId.value; const isEditing = !!promoId; const promoLink = elements.promoLinkInput.value.trim(); const imageUrlInput = elements.promoImageUrlInput.value.trim(); const imageFile = elements.promoImageFileInput.files[0]; const statusEl = elements.promotionStatus; const imgbbStatusEl = elements.promotionForm?.querySelector('.image-upload-status'); clearStatus(statusEl); if (imgbbStatusEl) { imgbbStatusEl.textContent = ''; imgbbStatusEl.style.display = 'none'; } if (!imageUrlInput && !imageFile && !isEditing) { showStatus(statusEl, "Image URL or File Upload required for new promotion.", "warning"); return; } if (!imageUrlInput && !imageFile && isEditing) { showStatus(statusEl, "Image URL cannot be empty when editing.", "warning"); return; } showLoader(true); elements.savePromotionBtn.disabled = true; let finalImageUrl = imageUrlInput; try { if (imageFile) { finalImageUrl = await uploadAdminImage(imageFile, imgbbStatusEl); } if (!finalImageUrl) { throw new Error("Image URL is missing after potential upload."); } const promoData = { imageUrl: finalImageUrl, link: promoLink || null }; if (isEditing) { promoData.updatedAt = serverTimestamp(); const promoRef = ref(db, `promotions/${promoId}`); await update(promoRef, promoData); console.log("Promotion updated successfully:", promoId); showStatus(elements.promotionsStatus, "Promotion updated successfully!", "success", 3000); } else { promoData.createdAt = serverTimestamp(); const newPromoRef = push(ref(db, 'promotions')); await set(newPromoRef, promoData); console.log("Promotion added successfully, key:", newPromoRef.key); showStatus(elements.promotionsStatus, "Promotion added successfully!", "success", 3000); } elements.promotionForm.reset(); elements.promotionEditId.value = ''; if (imgbbStatusEl) { imgbbStatusEl.textContent = ''; imgbbStatusEl.style.display = 'none'; } getModalInstance(elements.promotionModalEl)?.hide(); loadPromotions(); } catch (error) { console.error("Error saving promotion:", error); showStatus(statusEl, `Error saving promotion: ${error.message}. Check console & Rules.`, "danger", false); if (imgbbStatusEl && !imgbbStatusEl.textContent.includes('Error')) { imgbbStatusEl.style.display = 'none'; } } finally { showLoader(false); elements.savePromotionBtn.disabled = false; } }
        async function saveTournament(event) { event.preventDefault(); if (!db || !isDesignatedAdmin(currentAdminUser)) return; const statusEl = elements.addTournamentStatus; clearStatus(statusEl); const gameId = elements.tournamentGameSelect.value; const name = elements.tournamentNameInput.value.trim(); const startTimeStr = elements.tournamentStartTimeInput.value; const entryFeeStr = elements.tournamentEntryFeeInput.value; const prizePoolStr = elements.tournamentPrizePoolInput.value; const perKillStr = elements.tournamentPerKillInput.value; const maxPlayersStr = elements.tournamentMaxPlayersInput.value; const bannerUrl = elements.tournamentBannerUrlInput.value.trim(); const mode = elements.tournamentModeSelect.value; if (!gameId || !name || !startTimeStr) { showStatus(statusEl, "Game, Name, and Start Time required.", "warning"); return; } let startTimeTimestamp; try { startTimeTimestamp = new Date(startTimeStr).getTime(); if (isNaN(startTimeTimestamp)) throw new Error('Invalid Date'); } catch (e) { showStatus(statusEl, "Invalid Start Date & Time.", "warning"); return; } const entryFee = parseFloat(entryFeeStr) || 0; const prizePool = parseFloat(prizePoolStr) || 0; const perKillPrize = parseFloat(perKillStr) || 0; const maxPlayers = parseInt(maxPlayersStr) || 0; if (entryFee < 0 || prizePool < 0 || perKillPrize < 0 || maxPlayers < 0) { showStatus(statusEl, "Numeric values cannot be negative.", "warning"); return; } const tournamentData = { gameId: gameId, name: name, startTime: startTimeTimestamp, status: elements.tournamentStatusSelect.value, entryFee: entryFee, prizePool: prizePool, perKillPrize: perKillPrize, maxPlayers: maxPlayers, bannerUrl: bannerUrl || null, mode: mode, tags: elements.tournamentTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag), description: elements.tournamentDescriptionInput.value.trim(), roomId: elements.tournamentRoomIdInput.value.trim() || null, roomPassword: elements.tournamentRoomPasswordInput.value.trim() || null, showIdPass: elements.tournamentShowIdPassCheckbox.checked, updatedAt: serverTimestamp() }; showLoader(true); elements.saveTournamentBtn.disabled = true; try { if (currentEditingTournamentId) { const tRef = ref(db, `tournaments/${currentEditingTournamentId}`); const existing = await get(tRef); if (existing.exists() && existing.val().registeredPlayers) tournamentData.registeredPlayers = existing.val().registeredPlayers; await update(tRef, tournamentData); console.log("Tournament updated:", currentEditingTournamentId); showStatus(statusEl, "Tournament updated!", "success", 3000); } else { tournamentData.createdAt = serverTimestamp(); const newRef = push(ref(db, 'tournaments')); await set(newRef, tournamentData); console.log("Tournament added:", newRef.key); showStatus(statusEl, "Tournament added!", "success", 3000); } elements.tournamentForm.reset(); currentEditingTournamentId = null; getModalInstance(elements.addTournamentModalEl)?.hide(); loadTournaments(); loadDashboardStats(); } catch (error) { console.error("Error saving tournament:", error); showStatus(statusEl, `Error: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); elements.saveTournamentBtn.disabled = false; } }
        async function deleteGame(gameId) { if (!db || !gameId || !isDesignatedAdmin(currentAdminUser)) return; if (!confirm(`DELETE Game ID: ${gameId}? Removes DB entry. Image on ImgBB NOT deleted. OK?`)) return; showLoader(true); const statusEl = elements.gamesStatus; clearStatus(statusEl); try { await remove(ref(db, `games/${gameId}`)); console.log("Game deleted from DB:", gameId); delete gameDataCache[gameId]; showStatus(statusEl, "Game data deleted.", "success", 3000); loadGames(); loadDashboardStats(); } catch (error) { console.error("Error deleting game:", error); showStatus(statusEl, `Error deleting game: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); } }
        async function deletePromotion(promoId) { if (!db || !promoId || !isDesignatedAdmin(currentAdminUser)) return; if (!confirm(`DELETE Promotion ID: ${promoId}? Removes DB entry. Image on ImgBB NOT deleted. OK?`)) return; showLoader(true); const statusEl = elements.promotionsStatus; clearStatus(statusEl); try { await remove(ref(db, `promotions/${promoId}`)); console.log("Promotion deleted from DB:", promoId); showStatus(statusEl, "Promotion data deleted.", "success", 3000); loadPromotions(); loadDashboardStats(); } catch (error) { console.error("Error deleting promotion:", error); showStatus(statusEl, `Error deleting promotion: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); } }
        async function deleteTournament(tournamentId) { if (!db || !tournamentId || !isDesignatedAdmin(currentAdminUser)) return; if (!confirm(`DELETE Tournament ID: ${tournamentId}? Cannot be undone.`)) return; showLoader(true); const statusEl = elements.tournamentsStatus; clearStatus(statusEl); try { await remove(ref(db, `tournaments/${tournamentId}`)); console.log("Tournament deleted:", tournamentId); showStatus(statusEl, "Tournament deleted.", "success", 3000); loadTournaments(); loadDashboardStats(); } catch (error) { console.error("Error deleting tournament:", error); showStatus(statusEl, `Error: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); } }
        async function saveNewUser() { if (!auth || !db || !isDesignatedAdmin(currentAdminUser)) return; const statusEl = elements.addUserStatus; clearStatus(statusEl); const name = elements.newUserNameInput.value.trim(); const email = elements.newUserEmailInput.value.trim(); const password = elements.newUserPasswordInput.value; const initialBalanceStr = elements.newUserInitialBalanceInput.value; if (!name || !email || !password) { showStatus(statusEl, "Name, Email, Password required.", "warning"); return; } if (password.length < 6) { showStatus(statusEl, "Password min 6 chars.", "warning"); return; } const initialBalance = parseFloat(initialBalanceStr) || 0; if (initialBalance < 0) { showStatus(statusEl, "Initial Balance cannot be negative.", "warning"); return; } if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showStatus(statusEl, "Invalid Email format.", "warning"); return; } showLoader(true); elements.saveNewUserBtn.disabled = true; try { const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase(); const cred = await createUserWithEmailAndPassword(auth, email, password); const uid = cred.user.uid; console.log("User created in Auth:", uid, email); const userData = { uid: uid, email: email, displayName: name, balance: initialBalance, winningCash: 0, bonusCash: 0, status: 'active', createdAt: serverTimestamp(), referralCode: referralCode, isAdmin: false, referralEarnings: 0, totalEarnings: 0, totalMatches: 0, wonMatches: 0 }; await set(ref(db, `users/${uid}`), userData); console.log("User data created in DB:", uid); showStatus(statusEl, `User ${name} created!`, "success", 4000); elements.addUserForm.reset(); getModalInstance(elements.addUserModalEl)?.hide(); loadDashboardStats(); } catch (error) { console.error("Error creating user:", error); let msg = `Error: ${error.message}`; if (error.code === 'auth/email-already-in-use') msg = "Email already registered."; else if (error.code === 'auth/weak-password') msg = "Password too weak."; else if (error.code === 'auth/invalid-email') msg = "Invalid email format."; else if (error.code === 'permission-denied') msg = "Permission denied creating user/DB entry. Check Rules."; showStatus(statusEl, msg, "danger", false); } finally { showLoader(false); elements.saveNewUserBtn.disabled = false; } }
        async function updateUserBalance(event) { event.preventDefault(); if (!db || !isDesignatedAdmin(currentAdminUser)) return; const statusEl = elements.balanceUpdateStatus; clearStatus(statusEl); const userId = elements.editUserUid.value; const amountStr = elements.balanceUpdateAmountInput.value; const type = elements.balanceUpdateTypeSelect.value; const reason = elements.balanceUpdateReasonInput.value.trim(); if (!userId || !amountStr || !type || !reason) { showStatus(statusEl, "All fields required.", "warning"); return; } const amount = parseFloat(amountStr); if (isNaN(amount) || amount === 0) { showStatus(statusEl, "Invalid or zero amount.", "warning"); return; } showLoader(true); const userRefPath = `users/${userId}`; const updates = {}; try { const userSnapshot = await get(ref(db, userRefPath)); if (!userSnapshot.exists()) throw new Error(`User ${userId} not found.`); const user = userSnapshot.val(); const currentBalance = Number(user.balance || 0); const currentWinning = Number(user.winningCash || 0); const currentBonus = Number(user.bonusCash || 0); let newBalance = currentBalance; let newWinning = currentWinning; let newBonus = currentBonus; let logType = ''; switch (type) { case 'balance': newBalance += amount; updates[`${userRefPath}/balance`] = newBalance; logType = amount > 0 ? 'admin_deposit' : 'admin_deduction'; break; case 'winningCash': newWinning += amount; newBalance += amount; if (newWinning < 0) throw new Error("Winning cash cannot be negative."); updates[`${userRefPath}/winningCash`] = newWinning; updates[`${userRefPath}/balance`] = newBalance; logType = amount > 0 ? 'admin_winning_add' : 'admin_winning_deduct'; break; case 'bonusCash': newBonus += amount; newBalance += amount; if (newBonus < 0) throw new Error("Bonus cash cannot be negative."); updates[`${userRefPath}/bonusCash`] = newBonus; updates[`${userRefPath}/balance`] = newBalance; logType = amount > 0 ? 'admin_bonus_add' : 'admin_bonus_deduct'; break; default: throw new Error("Invalid balance type."); } if (newBalance < 0 && !confirm(`Warning: Negative total balance (${formatCurrency(newBalance)}). Proceed?`)) { showLoader(false); showStatus(statusEl, "Update cancelled.", "info"); return; } const txKey = push(ref(db, `transactions/${userId}`)).key; const txData = { type: logType, amount: amount, timestamp: serverTimestamp(), description: `Admin Update: ${reason}`, status: 'completed', balanceAfter: newBalance, adminUid: currentAdminUser.uid }; updates[`transactions/${userId}/${txKey}`] = txData; await update(ref(db), updates); console.log(`Balance updated for ${userId}. New Bal: ${newBalance}, Win: ${newWinning}, Bonus: ${newBonus}`); elements.userDetailBalance.textContent = newBalance.toFixed(2); elements.userDetailWinning.textContent = newWinning.toFixed(2); elements.userDetailBonus.textContent = newBonus.toFixed(2); if (fullUserDataCache[userId]) { fullUserDataCache[userId].balance = newBalance; fullUserDataCache[userId].winningCash = newWinning; fullUserDataCache[userId].bonusCash = newBonus; } if (userDataCache[userId]) { userDataCache[userId].balance = newBalance; userDataCache[userId].winningCash = newWinning; } showStatus(statusEl, "Balance updated!", "success", 3000); elements.updateBalanceForm.reset(); } catch (error) { console.error("Error updating balance:", error); showStatus(statusEl, `Error: ${error.message}`, "danger", false); } finally { showLoader(false); } }
        async function toggleUserBlock(event) { const button = event.target.closest('button'); if (!button || !db || !isDesignatedAdmin(currentAdminUser)) return; const userId = button.dataset.id; const currentAction = button.dataset.action; if (!userId || !currentAction) return; const newStatus = currentAction === 'block' ? 'blocked' : 'active'; if (!confirm(`Confirm ${currentAction} user ${userId}?`)) return; showLoader(true); button.disabled = true; const modalVisible = getModalInstance(elements.userModalEl)?._isShown; const statusEl = modalVisible && elements.editUserUid.value === userId ? elements.balanceUpdateStatus : elements.usersStatus; clearStatus(statusEl); try { await set(ref(db, `users/${userId}/status`), newStatus); console.log(`User ${userId} status set to ${newStatus}`); if (fullUserDataCache[userId]) fullUserDataCache[userId].status = newStatus; if (userDataCache[userId]) userDataCache[userId].status = newStatus; showStatus(statusEl, `User ${newStatus} successfully!`, "success", 3000); if (modalVisible && elements.editUserUid.value === userId) { elements.userDetailStatus.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1); elements.userDetailStatus.className = `fw-bold text-${newStatus === 'active' ? 'success' : 'danger'}`; button.textContent = newStatus === 'active' ? 'Block User' : 'Unblock User'; button.className = `btn btn-sm ${newStatus === 'active' ? 'btn-danger' : 'btn-success'}`; button.dataset.action = newStatus === 'active' ? 'block' : 'unblock'; } filterUsers(); } catch (error) { console.error(`Error ${currentAction}ing user:`, error); showStatus(statusEl, `Error ${currentAction}ing user: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); button.disabled = false; } }
        async function deleteUser(userId) { if (!db || !userId || !isDesignatedAdmin(currentAdminUser)) return; const userName = fullUserDataCache[userId]?.displayName || fullUserDataCache[userId]?.email || userId; if (!confirm(`DELETE USER: ${userName} (UID: ${userId})?\n\nWARNING:\n- Removes user data from Realtime Database ONLY.\n- DOES NOT delete from Firebase Auth.\n- Associated data (transactions, etc.) may be orphaned.\n\nCannot be undone. Proceed?`)) return; showLoader(true); const statusEl = elements.usersStatus; clearStatus(statusEl); const modal = getModalInstance(elements.userModalEl); if (modal?._isShown) modal.hide(); try { await remove(ref(db, `users/${userId}`)); console.log("User deleted from DB:", userId); delete fullUserDataCache[userId]; delete userDataCache[userId]; showStatus(statusEl, `User ${userName} deleted from Database.`, "success", 5000); filterUsers(); loadDashboardStats(); } catch (error) { console.error("Error deleting user from DB:", error); showStatus(statusEl, `Error deleting user data: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); } }
        async function openWithdrawalActionModal(withdrawalId, type) { if (!db || !withdrawalId || !type || !isDesignatedAdmin(currentAdminUser)) return; console.log(`Opening withdrawal modal: ${withdrawalId}, Action: ${type}`); showLoader(true); currentWithdrawalAction = { id: withdrawalId, type: type, userId: null }; elements.withdrawalRejectReasonInput.value = ''; elements.withdrawalApproveNoteInput.value = ''; elements.withdrawalRejectReasonDiv.style.display = 'none'; elements.withdrawalApproveNoteDiv.style.display = 'none'; elements.withdrawalRejectReasonInput.required = false; elements.withdrawalApproveNoteInput.required = false; clearStatus(elements.withdrawalActionStatus); elements.approveWithdrawalBtn.style.display = 'inline-block'; elements.rejectWithdrawalBtn.style.display = 'inline-block'; elements.approveWithdrawalBtn.disabled = false; elements.rejectWithdrawalBtn.disabled = false; const withdrawalRef = ref(db, `withdrawals/${withdrawalId}`); try { const snapshot = await get(withdrawalRef); if (!snapshot.exists()) throw new Error(`Withdrawal ${withdrawalId} not found.`); const w = snapshot.val(); currentWithdrawalAction.userId = w.userId; if (w.status !== 'pending') { alert(`Request already processed (Status: ${w.status}).`); showLoader(false); return; } let userDisplay = `UID: ${w.userId}`; const userId = w.userId; if (userId && userDataCache[userId]) { const u = userDataCache[userId]; userDisplay = `${sanitizeHTML(u.displayName)} (<small class="text-muted" title="${userId}">${sanitizeHTML(u.email)}</small>)`; } else if (userId) { try { const userSnap = await get(ref(db, `users/${userId}`)); if (userSnap.exists()) { const u = userSnap.val(); userDataCache[userId] = { displayName: u.displayName || 'N/A', email: u.email || userId, status: u.status || 'unknown' }; userDisplay = `${sanitizeHTML(u.displayName)} (<small class="text-muted" title="${userId}">${sanitizeHTML(u.email)}</small>)`; } else { userDataCache[userId] = { displayName: 'Unknown User', email: userId, status: 'deleted' }; userDisplay = `Unknown User (<small class="text-muted" title="${userId}">${userId}</small>)`; } } catch (err) { console.warn(`Could not fetch user ${userId}`, err); userDataCache[userId] = { displayName: 'Error Fetching', email: userId, status: 'error' }; userDisplay = `Error Fetching (<small class="text-muted" title="${userId}">${userId}</small>)`; } } let methodDisplay = sanitizeHTML(w.methodDetails?.methodName || w.method || 'N/A'); if (w.methodDetails?.accountInfo) methodDisplay += ` - ${sanitizeHTML(w.methodDetails.accountInfo)}`; elements.withdrawalDetailId.textContent = withdrawalId; elements.withdrawalDetailUser.innerHTML = userDisplay; elements.withdrawalDetailUserUid.textContent = userId || 'N/A'; elements.withdrawalDetailAmount.textContent = (w.amount || 0).toFixed(2); elements.withdrawalDetailMethod.textContent = methodDisplay; if (type === 'reject') { elements.withdrawalRejectReasonDiv.style.display = 'block'; elements.withdrawalRejectReasonInput.required = true; elements.approveWithdrawalBtn.style.display = 'none'; } else { elements.withdrawalApproveNoteDiv.style.display = 'block'; elements.rejectWithdrawalBtn.style.display = 'none'; } getModalInstance(elements.withdrawalActionModalEl)?.show(); } catch (error) { console.error("Error opening withdrawal modal:", error); alert(`Error fetching details: ${error.message}`); showStatus(elements.withdrawalsStatus, `Error fetching details: ${error.message}`, 'danger', false); } finally { showLoader(false); } }
        
        async function processWithdrawalAction() {
            if (!db || !currentWithdrawalAction.id || !currentWithdrawalAction.type || !currentWithdrawalAction.userId || !isDesignatedAdmin(currentAdminUser)) {
                console.error("Withdrawal details missing or unauthorized.");
                showStatus(elements.withdrawalActionStatus, "Internal error/unauthorized.", "danger", false);
                return;
            }
            const statusEl = elements.withdrawalActionStatus;
            clearStatus(statusEl);
            const withdrawalId = currentWithdrawalAction.id;
            const actionType = currentWithdrawalAction.type;
            const userId = currentWithdrawalAction.userId;
            const updates = {};
            const withdrawalRefPath = `withdrawals/${withdrawalId}`;
            let reason = '';
            let adminNote = '';
            let logType = '';
            let logStatus = 'failed';
            let refundRequired = false;

            showLoader(true);
            elements.approveWithdrawalBtn.disabled = true;
            elements.rejectWithdrawalBtn.disabled = true;

            try {
                const wSnapshot = await get(ref(db, withdrawalRefPath));
                if (!wSnapshot.exists()) throw new Error("Withdrawal request not found.");
                const wData = wSnapshot.val();
                const amount = Number(wData.amount || 0);

                if (wData.status !== 'pending') throw new Error(`Request already processed (Status: ${wData.status}).`);
                if (amount <= 0) throw new Error("Invalid amount.");

                if (actionType === 'reject') {
                    reason = elements.withdrawalRejectReasonInput.value.trim();
                    if (!reason) {
                        elements.rejectWithdrawalBtn.disabled = false;
                        throw new Error("Rejection reason required.");
                    }
                    updates[`${withdrawalRefPath}/status`] = 'rejected';
                    updates[`${withdrawalRefPath}/rejectReason`] = reason;
                    updates[`${withdrawalRefPath}/processedAt`] = serverTimestamp();
                    updates[`${withdrawalRefPath}/processedBy`] = currentAdminUser.uid;
                    refundRequired = true;
                    logType = 'withdrawal_rejected';
                    logStatus = 'completed';
                } else { // 'approve' action
                    adminNote = elements.withdrawalApproveNoteInput.value.trim();
                    updates[`${withdrawalRefPath}/status`] = 'completed';
                    updates[`${withdrawalRefPath}/adminNote`] = adminNote || 'Approved';
                    updates[`${withdrawalRefPath}/processedAt`] = serverTimestamp();
                    updates[`${withdrawalRefPath}/processedBy`] = currentAdminUser.uid;
                    refundRequired = false;
                    logType = 'withdrawal_approved';
                    logStatus = 'completed';
                }

                if (refundRequired) {
                    const uSnapshot = await get(ref(db, `users/${userId}`));
                    if (!uSnapshot.exists()) throw new Error(`User ${userId} not found for refund.`);
                    const user = uSnapshot.val();
                    const currentWinning = Number(user.winningCash || 0);
                    const currentBalance = Number(user.balance || 0);
                    const newWinning = currentWinning + amount;
                    const newBalance = currentBalance + amount;
                    updates[`users/${userId}/winningCash`] = newWinning;
                    updates[`users/${userId}/balance`] = newBalance;
                    
                    const refundTxKey = push(ref(db, `transactions/${userId}`)).key;
                    updates[`transactions/${userId}/${refundTxKey}`] = { type: 'withdrawal_refund', amount: amount, timestamp: serverTimestamp(), description: `Refund rejected withdrawal: ${withdrawalId}. Reason: ${reason}`, status: 'completed', balanceAfter: newBalance, adminUid: currentAdminUser.uid };
                    
                    if (fullUserDataCache[userId]) { fullUserDataCache[userId].balance = newBalance; fullUserDataCache[userId].winningCash = newWinning; }
                    if (userDataCache[userId]) { userDataCache[userId].balance = newBalance; userDataCache[userId].winningCash = newWinning; }
                }

                const mainTxKey = push(ref(db, `transactions/${userId}`)).key;
                updates[`transactions/${userId}/${mainTxKey}`] = { type: logType, amount: 0, timestamp: serverTimestamp(), description: `Withdrawal ${actionType} by admin. ID: ${withdrawalId}. ${actionType === 'reject' ? `Reason: ${reason}` : `Note: ${adminNote}`}`, status: logStatus, withdrawalId: withdrawalId, adminUid: currentAdminUser.uid };

                await update(ref(db), updates);
                
                console.log(`Withdrawal ${withdrawalId} ${actionType} processed.`);
                getModalInstance(elements.withdrawalActionModalEl)?.hide();
                showStatus(elements.withdrawalsStatus, `Withdrawal ${actionType} successfully!`, "success", 4000);

                // Refresh all withdrawal tabs and dashboard stats to show updated lists
                loadWithdrawals('pending');
                loadWithdrawals('completed');
                loadWithdrawals('rejected');
                loadDashboardStats();
                
            } catch (error) {
                console.error("Error processing withdrawal:", error);
                showStatus(statusEl, `Error: ${error.message}. Check Rules.`, "danger", false);
            } finally {
                showLoader(false);
                if (getModalInstance(elements.withdrawalActionModalEl)?._isShown) {
                    elements.approveWithdrawalBtn.disabled = false;
                    elements.rejectWithdrawalBtn.disabled = false;
                }
            }
        }
        
        async function saveSettings(event) {
            event.preventDefault();
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const statusEl = elements.settingsStatus;
            clearStatus(statusEl);
            const signupBonus = parseFloat(elements.settingSignupBonusInput.value);
            const minW = parseFloat(elements.settingMinWithdrawInput.value);
            const refB = parseFloat(elements.settingReferralBonusInput.value);
            if (isNaN(signupBonus) || isNaN(minW) || isNaN(refB) || minW < 0 || refB < 0 || signupBonus < 0) {
                showStatus(statusEl, "Numeric bonus/withdraw values must be valid, non-negative numbers.", "warning");
                return;
            }
            const settingsData = {
                logoUrl: elements.settingLogoUrlInput.value.trim(),
                appName: elements.settingAppNameInput.value.trim(),
                signupBonus: signupBonus,
                minWithdraw: minW,
                referralBonus: refB,
                supportContact: elements.settingSupportContactInput.value.trim(),
                policyPrivacy: elements.settingPolicyPrivacyInput.value.trim(),
                policyTerms: elements.settingPolicyTermsInput.value.trim(),
                policyRefund: elements.settingPolicyRefundInput.value.trim(),
                policyFairPlay: elements.settingPolicyFairPlayInput.value.trim(),
                lastUpdated: serverTimestamp()
            };
            showLoader(true);
            elements.appSettingsForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
            try {
                await update(ref(db, 'settings'), settingsData);
                appSettings = {...appSettings, ...settingsData};
                console.log("Settings saved:", appSettings);
                showStatus(statusEl, "Settings saved!", "success", 3000);
                if(elements.adminHeaderLogo) {
                    const logoUrl = appSettings.logoUrl;
                    elements.adminHeaderLogo.src = logoUrl || 'https://via.placeholder.com/35/1E293B/94A3B8?text=L';
                    elements.adminHeaderLogo.style.display = logoUrl ? 'inline-block' : 'none';
                    elements.adminHeaderLogo.alt = appSettings.appName ? `${appSettings.appName} Logo` : 'Logo';
                }
                document.title = `${appSettings.appName || 'Gaming Tournament'} - Admin Panel`;
            } catch (error) {
                console.error("Error saving settings:", error);
                showStatus(statusEl, `Error: ${error.message}. Check Rules.`, "danger", false);
            } finally {
                showLoader(false);
                elements.appSettingsForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
            }
        }
        
        async function addDemoData() { if (!db || !isDesignatedAdmin(currentAdminUser) || !confirm("Add sample demo data? Only adds if sections are empty.")) return; showLoader(true); elements.addDemoDataBtn.disabled = true; const sectionEl = querySel('#adminMainContent .section.active'); const statusEl = sectionEl?.querySelector('div[id$="Status"]') || elements.dashboardStatus; clearStatus(statusEl); let added = []; const now = Date.now(); try { const gamesRef = ref(db, 'games'); const gamesSnap = await get(gamesRef); let demoGameId = null; if (!gamesSnap.exists() || gamesSnap.size === 0) { const newRef = push(gamesRef); demoGameId = newRef.key; await set(newRef, { name: "Demo Game (BGMI)", imageUrl: "https://i.ibb.co/4Z5hPVzp/20250418-150058.jpg", createdAt: serverTimestamp() }); added.push("Game"); gameDataCache[demoGameId] = "Demo Game (BGMI)"; } else { const games = gamesSnap.val(); demoGameId = Object.keys(games)[0]; gameDataCache = Object.entries(games).reduce((acc, [id, data]) => { acc[id] = data.name; return acc; }, {}); } const promoRef = ref(db, 'promotions'); const promoSnap = await get(promoRef); if (!promoSnap.exists() || promoSnap.size === 0) { await set(push(promoRef), { imageUrl: "https://i.ibb.co/RGmQ420n/20250418-150709.jpg", link: "#", createdAt: serverTimestamp() }); added.push("Promotion"); } if (demoGameId) { const tRef = ref(db, 'tournaments'); const tSnap = await get(tRef); if (!tSnap.exists() || tSnap.size === 0) { await set(push(tRef), { gameId: demoGameId, name: "Weekend Demo Clash", startTime: now + 86400000, status: "upcoming", entryFee: 10, prizePool: 100, perKillPrize: 2, maxPlayers: 50, tags: ["Demo", "Squad"], description: "Sample tournament details.", roomId: null, roomPassword: null, showIdPass: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); added.push("Tournament"); } } const usersRef = ref(db, 'users'); const usersSnap = await get(usersRef); let demoUserNeeded = true; if(usersSnap.exists()){ usersSnap.forEach(uSnap => { if(uSnap.key !== designatedAdminUid) demoUserNeeded = false; }); } if(demoUserNeeded && auth) { try { const demoEmail = `demo${Date.now().toString().slice(-5)}@example.com`, demoPass = "password", cred = await createUserWithEmailAndPassword(auth, email, demoPass), uid = cred.user.uid, code = Math.random().toString(36).substring(2, 10).toUpperCase(); await set(ref(db, `users/${uid}`), { uid: uid, email: demoEmail, displayName: "Demo User", balance: 50, winningCash: 10, bonusCash: 5, status: 'active', createdAt: serverTimestamp(), referralCode: code, isAdmin: false, referralEarnings: 0, totalEarnings: 0, totalMatches: 0, wonMatches: 0 }); added.push("User (Demo)"); console.log("Created demo user:", demoEmail); } catch (userErr) { console.error("Failed demo user creation:", userErr); } } const settingsRef = ref(db, 'settings'); const settingsSnap = await get(settingsRef); if (!settingsSnap.exists()) { const demoSettings = { appName: "Demo Gaming App", logoUrl: "https://i.ibb.co/BvH3m14/Chat-GPT-Image-Apr-18-2025-05-54-04-PM.png", minWithdraw: 50, referralBonus: 5, supportContact: "support@demo.com", policyPrivacy: "Demo Privacy Policy.", policyTerms: "Demo Terms.", policyRefund: "Demo Refund Policy.", policyFairPlay: "Demo Fair Play Policy.", lastUpdated: serverTimestamp() }; await set(settingsRef, demoSettings); added.push("Settings"); appSettings = demoSettings; } if (added.length > 0) { showStatus(statusEl, `Demo data added for: ${added.join(', ')}. Refreshing...`, "success", 5000); if (added.includes("Game")) await loadGames(); if (added.includes("Promotion")) await loadPromotions(); if (added.includes("Tournament")) await loadTournaments(); if (added.includes("Settings")) await loadSettings(); if (added.includes("User (Demo)")) await loadUsers(); loadDashboardStats(); } else { showStatus(statusEl, "No demo data added (already exists?).", "info", 5000); } } catch (error) { console.error("Error adding demo data:", error); showStatus(statusEl, `Error adding demo data: ${error.message}. Check Rules.`, "danger", false); } finally { showLoader(false); elements.addDemoDataBtn.disabled = false; } }
        
        async function handleDepositAction(event) {
            const selectEl = event.target;
            const action = selectEl.value;
            if (!action) return;
            const friendlyAction = action === 'complete' ? 'Complete' : 'Reject';
            if (!confirm(`Are you sure you want to mark this deposit as '${friendlyAction}'?`)) {
                selectEl.value = "";
                return;
            }
            const depositId = selectEl.dataset.id;
            const userId = selectEl.dataset.userid;
            const amount = parseFloat(selectEl.dataset.amount);
            if (!depositId || !userId || isNaN(amount)) {
                showStatus(elements.depositsStatus, "Error: Missing data on the request.", "danger");
                return;
            }
            showLoader(true);
            selectEl.disabled = true;
            const updates = {};
            const userRef = ref(db, `users/${userId}`);
            try {
                if (action === 'complete') {
                    const userSnapshot = await get(userRef);
                    if (!userSnapshot.exists()) throw new Error(`User with ID ${userId} not found.`);
                    const currentBalance = userSnapshot.val().balance || 0;
                    const newBalance = currentBalance + amount;
                    updates[`/deposits/${depositId}/status`] = 'completed';
                    updates[`/deposits/${depositId}/processedAt`] = serverTimestamp();
                    updates[`/deposits/${depositId}/processedBy`] = currentAdminUser.uid;
                    updates[`/users/${userId}/balance`] = newBalance;
                    const newTxRef = push(ref(db, `transactions/${userId}`));
                    updates[`/transactions/${userId}/${newTxRef.key}`] = { type: 'deposit_completed', amount: amount, description: `Deposit`, status: 'completed', timestamp: serverTimestamp(), balanceAfter: newBalance, adminUid: currentAdminUser.uid };
                } else if (action === 'reject') {
                    updates[`/deposits/${depositId}/status`] = 'rejected';
                    updates[`/deposits/${depositId}/processedAt`] = serverTimestamp();
                    updates[`/deposits/${depositId}/processedBy`] = currentAdminUser.uid;
                }
                await update(ref(db), updates);
                showStatus(elements.depositsStatus, `Deposit ${depositId} marked as ${friendlyAction}.`, "success", 4000);
                
                loadDepositRequests('pending');
                loadDepositRequests('completed');
                loadDepositRequests('rejected');

            } catch (error) {
                console.error("Error processing deposit:", error);
                showStatus(elements.depositsStatus, `Error: ${error.message}`, "danger", false);
                selectEl.disabled = false;
                selectEl.value = "";
            } finally {
                showLoader(false);
            }
        }
        
        async function creditReferralBonus(referralId, referrerUid) {
            if (!referralId || !referrerUid) {
                showStatus(elements.referralsStatus, "Error: Missing data for credit action.", "danger");
                return;
            }

            const btn = document.querySelector(`.btn-credit-referral[data-id="${referralId}"]`);
            if (btn) btn.disabled = true;
            showLoader(true);
            
            const referralBonus = appSettings.referralBonus ?? 5; // Use bonus from settings

            const userRef = ref(db, `users/${referrerUid}`);
            const updates = {};
            let newBalance = 0;

            try {
                 // Use a transaction to safely update user balance
                const transactionResult = await runTransaction(userRef, (userProfile) => {
                    if (userProfile) {
                        userProfile.balance = (userProfile.balance || 0) + referralBonus;
                        userProfile.bonusCash = (userProfile.bonusCash || 0) + referralBonus;
                        userProfile.referralEarnings = (userProfile.referralEarnings || 0) + referralBonus;
                        newBalance = userProfile.balance;
                    }
                    return userProfile;
                });
                
                if (!transactionResult.committed) {
                    throw new Error("Failed to update user profile transactionally. Please try again.");
                }

                console.log(`Successfully updated balance for referrer ${referrerUid}`);

                const newTxKey = push(ref(db, `transactions/${referrerUid}`)).key;
                updates[`transactions/${referrerUid}/${newTxKey}`] = {
                    type: 'referral_bonus',
                    amount: referralBonus,
                    description: `Referral Bonus Credited`,
                    timestamp: serverTimestamp(),
                    balanceAfter: newBalance,
                    adminUid: currentAdminUser.uid,
                    referralId: referralId
                };
                
                updates[`pendingReferrals/${referralId}/status`] = 'credited';
                updates[`pendingReferrals/${referralId}/creditedAt`] = serverTimestamp();
                updates[`pendingReferrals/${referralId}/bonusAmount`] = referralBonus;

                await update(ref(db), updates);
                showStatus(elements.referralsStatus, `Bonus of ${formatCurrency(referralBonus)} credited to referrer!`, "success", 4000);

                loadReferrals('pending');
                loadReferrals('completed');

            } catch(error) {
                 console.error("Error crediting referral bonus:", error);
                 showStatus(elements.referralsStatus, `Error: ${error.message}`, "danger", false);
                 if (btn) btn.disabled = false;
            } finally {
                showLoader(false);
            }
        }
        
        // --- Realtime Admin Listeners Setup ---
        function setupRealtimeAdminListeners() { 
            if (!db || !currentAdminUser || !isDesignatedAdmin(currentAdminUser)) return; 
            detachAllAdminListeners();
            const pendingWdQuery = query(ref(db, 'withdrawals'), orderByChild('status'), equalTo('pending')); 
            const wdKey = 'pendingWithdrawalsCount';
            dbListeners[wdKey] = onValue(pendingWdQuery, (snapshot) => { const count = snapshot.exists() ? snapshot.size : 0; if (elements.pendingWithdrawalCountBadge) { elements.pendingWithdrawalCountBadge.textContent = count; elements.pendingWithdrawalCountBadge.style.display = count > 0 ? 'inline-block' : 'none'; } if (elements.dashboardSection?.classList.contains('active') && elements.statPendingWithdrawals) elements.statPendingWithdrawals.textContent = count; });
            const pendingDpQuery = query(ref(db, 'deposits'), orderByChild('status'), equalTo('pending'));
            const dpKey = 'pendingDepositsCount';
            dbListeners[dpKey] = onValue(pendingDpQuery, (snapshot) => { const count = snapshot.exists() ? snapshot.size : 0; if (elements.pendingDepositCountBadge) { elements.pendingDepositCountBadge.textContent = count; elements.pendingDepositCountBadge.style.display = count > 0 ? 'inline-block' : 'none';} });
            const pendingRfQuery = query(ref(db, 'pendingReferrals'), orderByChild('status'), equalTo('pending'));
            const rfKey = 'pendingReferralsCount';
            dbListeners[rfKey] = onValue(pendingRfQuery, (snapshot) => { const count = snapshot.exists() ? snapshot.size : 0; if (elements.pendingReferralCountBadge) { elements.pendingReferralCountBadge.textContent = count; elements.pendingReferralCountBadge.style.display = count > 0 ? 'inline-block' : 'none';} });
            
            // *** NEW THEME LISTENER ***
            const settingsRef = ref(db, 'settings');
            const settingsKey = 'settingsListener';
            dbListeners[settingsKey] = onValue(settingsRef, (snapshot) => {
                if(snapshot.exists()) {
                    const settings = snapshot.val();
                    appSettings = settings || {};
                    applyThemeToAdminPanel(appSettings.theme);
                }
            });
        }
        function detachAllAdminListeners() { if (!db || Object.keys(dbListeners).length === 0) return; Object.keys(dbListeners).forEach(key => { try { let q; switch(key) { case 'pendingWithdrawalsCount': q = query(ref(db, 'withdrawals'), orderByChild('status'), equalTo('pending')); break; case 'pendingDepositsCount': q = query(ref(db, 'deposits'), orderByChild('status'), equalTo('pending')); break; case 'pendingReferralsCount': q = query(ref(db, 'pendingReferrals'), orderByChild('status'), equalTo('pending')); break; case 'users': q = ref(db, 'users'); break; case 'staff': q = ref(db, 'staff'); break; case 'settingsListener': q = ref(db, 'settings'); break; default: console.warn("Unknown listener key:", key); } if(q) { off(q, 'value', dbListeners[key]); } } catch (e) { console.warn(`Could not detach listener ${key}`, e); } }); dbListeners = {}; }

        // --- Modal Opening/Population Functions ---
        async function openEditGameModal(gameId) { if (!db || !gameId || !isDesignatedAdmin(currentAdminUser)) return; showLoader(true); elements.gameForm.reset(); clearStatus(elements.gameStatus); const imgbbStatusEl = elements.gameForm.querySelector('.image-upload-status'); if (imgbbStatusEl) { imgbbStatusEl.textContent = ''; imgbbStatusEl.style.display = 'none'; } try { const snapshot = await get(ref(db, `games/${gameId}`)); if (!snapshot.exists()) throw new Error(`Game ${gameId} not found.`); const game = snapshot.val(); elements.gameModalTitle.textContent = "Edit Game"; elements.gameEditId.value = gameId; elements.gameNameInput.value = game.name || ''; elements.gameImageUrlInput.value = game.imageUrl || ''; elements.gameImageFileInput.value = ''; getModalInstance(elements.gameModalEl)?.show(); } catch (error) { console.error("Error opening edit game modal:", error); showStatus(elements.gamesStatus, `Error loading game for edit: ${error.message}`, "danger", false); } finally { showLoader(false); } }
        async function openEditPromotionModal(promoId) { if (!db || !promoId || !isDesignatedAdmin(currentAdminUser)) return; showLoader(true); elements.promotionForm.reset(); clearStatus(elements.promotionStatus); const imgbbStatusEl = elements.promotionForm.querySelector('.image-upload-status'); if (imgbbStatusEl) { imgbbStatusEl.textContent = ''; imgbbStatusEl.style.display = 'none'; } try { const snapshot = await get(ref(db, `promotions/${promoId}`)); if (!snapshot.exists()) throw new Error(`Promotion ${promoId} not found.`); const promo = snapshot.val(); elements.promotionModalTitle.textContent = "Edit Promotion"; elements.promotionEditId.value = promoId; elements.promoImageUrlInput.value = promo.imageUrl || ''; elements.promoLinkInput.value = promo.link || ''; elements.promoImageFileInput.value = ''; getModalInstance(elements.promotionModalEl)?.show(); } catch (error) { console.error("Error opening edit promotion modal:", error); showStatus(elements.promotionsStatus, `Error loading promotion for edit: ${error.message}`, "danger", false); } finally { showLoader(false); } }
        async function populateGameSelect(selectedValue = null) { if (!elements.tournamentGameSelect) return; const select = elements.tournamentGameSelect; select.innerHTML = '<option value="">Loading...</option>'; select.disabled = true; try { if (Object.keys(gameDataCache).length === 0) await loadGames(); if (Object.keys(gameDataCache).length > 0) { select.innerHTML = '<option value="">-- Select Game --</option>'; const sorted = Object.entries(gameDataCache).sort(([, a], [, b]) => a.localeCompare(b)); sorted.forEach(([id, name]) => { const opt = document.createElement('option'); opt.value = id; opt.textContent = sanitizeHTML(name); select.appendChild(opt); }); if (selectedValue) select.value = selectedValue; } else { select.innerHTML = '<option value="">No Games Available</option>'; } } catch (error) { console.error("Error populating game select:", error); select.innerHTML = '<option value="">Error Loading</option>'; } finally { select.disabled = false; } }
        
        async function openEditTournamentModal(tournamentId) { 
            if (!db || !tournamentId || !isDesignatedAdmin(currentAdminUser)) return; 
            showLoader(true); 
            clearStatus(elements.addTournamentStatus); 
            elements.tournamentForm.reset(); 
            currentEditingTournamentId = tournamentId; 
            try { 
                const snapshot = await get(ref(db, `tournaments/${tournamentId}`)); 
                if (!snapshot.exists()) throw new Error(`Tournament ${tournamentId} not found.`); 
                const t = snapshot.val(); 
                await populateGameSelect(t.gameId); 
                elements.tournamentModalTitle.textContent = "Edit Tournament"; 
                elements.tournamentEditId.value = tournamentId; 
                elements.tournamentNameInput.value = t.name || ''; 
                if (t.startTime) { 
                    try { 
                        const d = new Date(t.startTime); 
                        if (!isNaN(d)) { 
                            const offset = d.getTimezoneOffset() * 60000; 
                            elements.tournamentStartTimeInput.value = new Date(d - offset).toISOString().slice(0, 16); 
                        } 
                    } catch(e){console.warn("Err fmt date",e);}
                } 
                elements.tournamentStatusSelect.value = t.status || 'upcoming'; 
                elements.tournamentModeSelect.value = t.mode || 'Solo'; // <-- FIX IS HERE
                elements.tournamentEntryFeeInput.value = t.entryFee ?? 0; 
                elements.tournamentPrizePoolInput.value = t.prizePool ?? 0; 
                elements.tournamentPerKillInput.value = t.perKillPrize ?? 0; 
                elements.tournamentMaxPlayersInput.value = t.maxPlayers ?? 0; 
                elements.tournamentTagsInput.value = (t.tags || []).join(', '); 
                elements.tournamentBannerUrlInput.value = t.bannerUrl || ''; 
                elements.tournamentDescriptionInput.value = t.description || ''; 
                elements.tournamentRoomIdInput.value = t.roomId || ''; 
                elements.tournamentRoomPasswordInput.value = t.roomPassword || ''; 
                elements.tournamentShowIdPassCheckbox.checked = t.showIdPass || false; 
                getModalInstance(elements.addTournamentModalEl)?.show(); 
            } catch (error) { 
                console.error("Error opening edit tournament modal:", error); 
                showStatus(elements.tournamentsStatus, `Error loading tournament: ${error.message}`, "danger", false); 
                currentEditingTournamentId = null; 
            } finally { 
                showLoader(false); 
            } 
        }

        async function openUserModal(userId) { if (!db || !userId || !isDesignatedAdmin(currentAdminUser)) return; showLoader(true); clearStatus(elements.balanceUpdateStatus); elements.updateBalanceForm.reset(); elements.userDetailReferredBy.textContent = "N/A"; elements.userDetailReferredCount.textContent = "N/A"; try { let user; if (fullUserDataCache[userId] && fullUserDataCache[userId].status !== 'error' && fullUserDataCache[userId].status !== 'deleted') { user = fullUserDataCache[userId]; } else { const snapshot = await get(ref(db, `users/${userId}`)); if (!snapshot.exists()) throw new Error(`User ${userId} not found.`); user = snapshot.val(); user.uid = userId; fullUserDataCache[userId] = user; } elements.userModalTitle.textContent = `User: ${sanitizeHTML(user.displayName || 'N/A')}`; elements.userDetailUid.textContent = userId; elements.userDetailEmail.textContent = sanitizeHTML(user.email || 'N/A'); elements.userDetailName.textContent = sanitizeHTML(user.displayName || 'N/A'); elements.userDetailCreatedAt.textContent = formatDate(user.createdAt); elements.userDetailBalance.textContent = formatCurrency(user.balance); elements.userDetailWinning.textContent = formatCurrency(user.winningCash); elements.userDetailBonus.textContent = formatCurrency(user.bonusCash); elements.editUserUid.value = userId; elements.userDetailReferralCode.textContent = user.referralCode || 'N/A'; const status = user.status || 'active'; elements.userDetailStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1); elements.userDetailStatus.className = `fw-bold text-${status === 'active' ? 'success' : 'danger'}`; elements.userBlockBtn.textContent = status === 'active' ? 'Block User' : 'Unblock User'; elements.userBlockBtn.className = `btn btn-sm ${status === 'active' ? 'btn-danger' : 'btn-success'}`; elements.userBlockBtn.dataset.id = userId; elements.userBlockBtn.dataset.action = status === 'active' ? 'block' : 'unblock'; elements.userDeleteBtn.dataset.id = userId; getModalInstance(elements.userModalEl)?.show(); } catch (error) { console.error("Error opening user modal:", error); showStatus(elements.usersStatus, `Error loading user: ${error.message}`, "danger", false); } finally { showLoader(false); } }
        
        async function openRegisteredPlayersModal(tournamentId, tournamentName) {
            if (!db || !tournamentId || !isDesignatedAdmin(currentAdminUser)) return;
            elements.registeredPlayersModalEl.dataset.tournamentId = tournamentId;

            elements.registeredPlayersModalTitle.textContent = "Registered Players";
            elements.registeredPlayersTournamentName.textContent = tournamentName || "N/A";
            elements.registeredPlayersTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></td></tr>`;
            clearStatus(elements.registeredPlayersStatus);
            currentPlayersListForPdf = [];
            getModalInstance(elements.registeredPlayersModalEl)?.show();
            try {
                const playersRef = ref(db, `tournaments/${tournamentId}/registeredPlayers`);
                const snapshot = await get(playersRef);
                if (!snapshot.exists()) {
                    elements.registeredPlayersTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-3 text-muted">No players registered.</td></tr>`;
                    return;
                }
                const registeredData = snapshot.val();
                const userIds = Object.keys(registeredData);
                let tableHtml = '';
                
                const promises = userIds.map(async (uid) => {
                    let u = fullUserDataCache[uid];
                    if (!u) {
                        const uSnap = await get(ref(db, `users/${uid}`));
                        u = uSnap.exists() ? { uid, ...uSnap.val() } : { uid, displayName: 'Not Found', email: 'N/A' };
                        if (uSnap.exists()) fullUserDataCache[uid] = u;
                    }
                    return { user: u, ...registeredData[uid] };
                });

                const results = await Promise.all(promises);
                
                results.forEach(res => {
                    const { user, joinedAt, username, gameUid, teammateUsername, teammateGameUid } = res;

                    const player1Html = `
                        <div>${sanitizeHTML(username || 'N/A')}</div>
                        <small class="text-muted">${sanitizeHTML(gameUid || 'N/A')}</small>
                    `;
                    const player2Html = (teammateUsername || teammateGameUid) ? `
                        <div>${sanitizeHTML(teammateUsername || 'N/A')}</div>
                        <small class="text-muted">${sanitizeHTML(teammateGameUid || 'N/A')}</small>
                    ` : '<span class="text-muted">N/A (Solo)</span>';

                    tableHtml += `
                        <tr>
                            <td>
                                <div>${sanitizeHTML(user.displayName)}</div>
                                <small class="text-muted">${sanitizeHTML(user.email)}</small>
                            </td>
                            <td>${player1Html}</td>
                            <td>${player2Html}</td>
                            <td>${formatDate(joinedAt)}</td>
                        </tr>`;
                    
                    currentPlayersListForPdf.push({
                        registeredBy: `${user.displayName} (${user.email || 'N/A'})`,
                        p1_username: username || 'N/A',
                        p1_uid: gameUid || 'N/A',
                        p2_username: teammateUsername || 'N/A',
                        p2_uid: teammateGameUid || 'N/A',
                        joinedAt: formatDate(joinedAt)
                    });
                });
                
                elements.registeredPlayersTableBody.innerHTML = tableHtml || `<tr><td colspan="4" class="text-center p-3 text-muted">Could not load player details.</td></tr>`;
                elements.registeredPlayersModalTitle.textContent = `Registered Players (${results.length})`;
            } catch (error) {
                console.error("Error loading registered players:", error);
                elements.registeredPlayersTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-3 text-danger">Error: ${error.message}.</td></tr>`;
                showStatus(elements.registeredPlayersStatus, `Error: ${error.message}`, 'danger');
            }
        }
        
        async function getLogoBase64() {
            const logoUrl = appSettings.logoUrl;
            if (!logoUrl) return null;
            
            // Using a public CORS proxy for simplicity. For production, a self-hosted proxy is recommended.
            const proxyUrl = 'https://corsproxy.io/?'; 
            
            try {
                const response = await fetch(proxyUrl + encodeURIComponent(logoUrl));
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error("Error fetching or converting logo to Base64:", error);
                return null;
            }
        }

        async function downloadUsersAsPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const users = Object.values(fullUserDataCache);
            if(users.length === 0) {
                alert("No user data to download.");
                return;
            }
            
            showLoader(true);
            const logoBase64 = await getLogoBase64();
            if(logoBase64){
                doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
            }
            
            doc.setFontSize(18);
            doc.text(appSettings.appName || "User List", logoBase64 ? 40 : 15, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, logoBase64 ? 40 : 15, 28);
            
            const tableColumn = ["No.", "Display Name", "Email", "Balance", "Status"];
            const tableRows = [];
            
            users.forEach((user, index) => {
                const userData = [
                    index + 1,
                    user.displayName || 'N/A',
                    user.email || 'N/A',
                    formatCurrency(user.balance || 0),
                    user.status || 'active'
                ];
                tableRows.push(userData);
            });
            
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133] }
            });
            
            doc.save(`user_list_${new Date().toISOString().split('T')[0]}.pdf`);
            showLoader(false);
        }

        async function downloadPlayersAsPDF() {
            const tournamentId = elements.registeredPlayersModalEl.dataset.tournamentId;
            const tournamentName = elements.registeredPlayersTournamentName.textContent || "Tournament";

            if (currentPlayersListForPdf.length === 0) {
                alert("No players to download in this list.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            showLoader(true);
            const logoBase64 = await getLogoBase64();
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
            }

            doc.setFontSize(16);
            doc.text(`Players: ${tournamentName}`, logoBase64 ? 40 : 15, 18);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, logoBase64 ? 40 : 15, 24);

            const tableColumn = ["Registered By", "P1 Username", "P1 UID", "P2 Username", "P2 UID", "Joined At"];
            const tableRows = currentPlayersListForPdf.map(player => [
                player.registeredBy, 
                player.p1_username, 
                player.p1_uid, 
                player.p2_username, 
                player.p2_uid, 
                player.joinedAt
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 30,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }
            });

            doc.save(`players_${tournamentId}_${new Date().toISOString().split('T')[0]}.pdf`);
            showLoader(false);
        }

        async function sendGlobalNotification(event) {
            event.preventDefault();
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const statusEl = elements.globalNotificationStatus;
            clearStatus(statusEl);

            const title = elements.globalNotifTitleInput.value.trim();
            const message = elements.globalNotifMessageInput.value.trim();
            const imageUrl = elements.globalNotifImageUrlInput.value.trim();

            if (!title || !message) {
                showStatus(statusEl, "Title and Message are required.", "warning");
                return;
            }

            const notificationData = {
                title: title,
                message: message,
                imageUrl: imageUrl || null,
                timestamp: serverTimestamp()
            };
            
            showLoader(true);
            try {
                const newNotifRef = push(ref(db, 'notifications'));
                await set(newNotifRef, notificationData);
                showStatus(statusEl, "Global notification sent successfully!", "success");
                elements.globalNotificationForm.reset();
                loadGlobalNotificationHistory(); 
            } catch (error) {
                console.error("Error sending global notification:", error);
                showStatus(statusEl, `Error: ${error.message}`, "danger", false);
            } finally {
                showLoader(false);
            }
        }

        async function sendIndividualNotification(event) {
            event.preventDefault();
            const userId = elements.editUserUid.value;
            if (!userId || !db || !isDesignatedAdmin(currentAdminUser)) return;

            const statusEl = elements.individualNotificationStatus;
            clearStatus(statusEl);

            const title = elements.individualNotifTitleInput.value.trim();
            const message = elements.individualNotifMessageInput.value.trim();
            const imageUrl = elements.individualNotifImageUrlInput.value.trim();

            if (!title || !message) {
                showStatus(statusEl, "Title and Message are required.", "warning");
                return;
            }

            const notificationData = {
                title: title,
                message: message,
                imageUrl: imageUrl || null,
                timestamp: serverTimestamp()
            };

            showLoader(true);
            try {
                const userNotifRef = ref(db, `users/${userId}/notifications`);
                await push(userNotifRef, notificationData);
                showStatus(statusEl, `Notification sent to ${fullUserDataCache[userId]?.displayName || 'user'}!`, "success");
                elements.individualNotificationForm.reset();
            } catch (error) {
                console.error("Error sending individual notification:", error);
                showStatus(statusEl, `Error: ${error.message}`, "danger", false);
            } finally {
                showLoader(false);
            }
        }

        async function loadGlobalNotificationHistory() {
            const historyEl = elements.globalNotificationsHistory;
            if (!historyEl) return;
            historyEl.innerHTML = tableLoadingPlaceholderHtml(4);

            try {
                const notificationsRef = ref(db, 'notifications');
                const snapshot = await get(notificationsRef);

                if (!snapshot.exists()) {
                    historyEl.innerHTML = '<p class="text-center text-muted p-3">No global notifications sent yet.</p>';
                    return;
                }

                const notifications = [];
                snapshot.forEach(child => {
                    notifications.push({ id: child.key, ...child.val() });
                });
                notifications.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

                let tableHtml = `
                    <table class="table table-dark table-hover mb-0">
                        <thead><tr><th>Sent At</th><th>Title</th><th>Message</th><th>Image</th></tr></thead>
                        <tbody>`;
                
                notifications.forEach(notif => {
                    tableHtml += `<tr>
                        <td>${formatDate(notif.timestamp)}</td>
                        <td>${sanitizeHTML(notif.title)}</td>
                        <td style="white-space: pre-wrap; word-break: break-word; min-width: 250px;">${sanitizeHTML(notif.message)}</td>
                        <td>${notif.imageUrl ? `<a href="${sanitizeHTML(notif.imageUrl)}" target="_blank">View</a>` : '<span class="text-muted">None</span>'}</td>
                    </tr>`;
                });

                tableHtml += `</tbody></table>`;
                historyEl.innerHTML = tableHtml;
            } catch(error) {
                console.error("Error loading notification history:", error);
                historyEl.innerHTML = `<p class="text-danger text-center p-3">Error loading history: ${error.message}</p>`;
            }
        }
        
        async function populateTournamentManagementSelector() {
            const selectEl = elements.tmsTournamentSelect;
            selectEl.innerHTML = '<option value="">Loading tournaments...</option>';
            elements.tmsPlayerListContainer.style.display = 'none';
            clearStatus(elements.tmsStatus);

            try {
                const tournamentsRef = ref(db, 'tournaments');
                const snapshot = await get(tournamentsRef);
                if (!snapshot.exists()) {
                    selectEl.innerHTML = '<option value="">No tournaments found.</option>';
                    return;
                }
                const tournaments = [];
                snapshot.forEach(child => {
                    const t = child.val();
                    if (['ongoing', 'completed', 'result'].includes(t.status)) {
                        tournaments.push({ id: child.key, ...t });
                    }
                });

                if (tournaments.length === 0) {
                    selectEl.innerHTML = '<option value="">No finished/ongoing tournaments found.</option>';
                    return;
                }

                tournaments.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
                selectEl.innerHTML = '<option value="">-- Select a tournament --</option>';
                tournaments.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = `${t.name} (${new Date(t.startTime).toLocaleDateString()}) - ${t.status}`;
                    option.dataset.perKillPrize = t.perKillPrize || 0;
                    option.dataset.name = t.name || 'Tournament';
                    selectEl.appendChild(option);
                });

            } catch (error) {
                console.error('Error populating tournament selector:', error);
                selectEl.innerHTML = '<option value="">Error loading tournaments.</option>';
                showStatus(elements.tmsStatus, `Error: ${error.message}`, 'danger', false);
            }
        }
        
        async function loadPlayersForManagement(tournamentId) {
            const tableBody = elements.tmsPlayerListTableBody;
            const container = elements.tmsPlayerListContainer;
            const creditBtn = elements.creditWinningsBtn;
            clearStatus(elements.tmsStatus);

            if (!tournamentId) {
                container.style.display = 'none';
                tableBody.innerHTML = '';
                return;
            }

            tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-3"><div class="spinner-border spinner-border-sm"></div> Loading players...</td></tr>`;
            container.style.display = 'block';
            creditBtn.disabled = true;

            try {
                const tournamentRef = ref(db, `tournaments/${tournamentId}`);
                const tSnapshot = await get(tournamentRef);
                if (!tSnapshot.exists()) throw new Error('Tournament not found.');

                const tournament = tSnapshot.val();
                
                if (tournament.winningsCredited) {
                    showStatus(elements.tmsStatus, `Winnings for this tournament have already been credited.`, 'info', false);
                    creditBtn.disabled = true;
                    creditBtn.textContent = 'Winnings Credited';
                } else {
                    creditBtn.disabled = false;
                    creditBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Credit All Winnings';
                }
                
                const registeredPlayers = tournament.registeredPlayers || {};
                const playerIds = Object.keys(registeredPlayers);
                const perKillPrize = tournament.perKillPrize || 0;

                if (playerIds.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-3 text-muted">No players joined this tournament.</td></tr>';
                    creditBtn.disabled = true;
                    return;
                }
                
                const userPromises = playerIds.map(uid => get(ref(db, `users/${uid}`)));
                const userSnapshots = await Promise.all(userPromises);

                let tableHtml = '';
                userSnapshots.forEach((uSnap, index) => {
                    const uid = playerIds[index];
                    const playerRegData = registeredPlayers[uid];
                    if (uSnap.exists()) {
                        const user = uSnap.val();
                        fullUserDataCache[uid] = { uid, ...user };

                        tableHtml += `
                            <tr data-uid="${uid}" data-per-kill-prize="${perKillPrize}">
                                <td>${sanitizeHTML(user.displayName || 'N/A')}</td>
                                <td><small class="text-muted">${sanitizeHTML(playerRegData.gameUid || user.gameUid || 'N/A')}</small></td>
                                <td>${formatCurrency(perKillPrize)}</td>
                                <td><input type="number" class="form-control kills-input" min="0" value="0" ${tournament.winningsCredited ? 'disabled' : ''}></td>
                                <td><input type="number" class="form-control extra-amount-input" min="0" value="0" step="any" ${tournament.winningsCredited ? 'disabled' : ''}></td>
                                <td><input type="number" class="form-control rank-input" min="1" ${tournament.winningsCredited ? 'disabled' : ''}></td>
                                <td class="calculated-prize">${formatCurrency(0)}</td>
                            </tr>`;
                    } else {
                        tableHtml += `<tr><td><span class="text-danger">User Deleted (ID: ${uid})</span></td><td colspan="6"></td></tr>`;
                    }
                });
                tableBody.innerHTML = tableHtml;

            } catch (error) {
                console.error("Error loading players for management:", error);
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-3 text-danger">Error: ${error.message}</td></tr>`;
            }
        }

        function calculateRowPrize(row) {
            const perKillPrize = parseFloat(row.dataset.perKillPrize || 0);
            const kills = parseInt(row.querySelector('.kills-input')?.value || 0);
            const extraAmount = parseFloat(row.querySelector('.extra-amount-input')?.value || 0);
            const prizeCell = row.querySelector('.calculated-prize');

            const totalPrize = (kills * perKillPrize) + extraAmount;
            if (prizeCell) {
                prizeCell.textContent = formatCurrency(totalPrize);
            }
        }
        
        async function creditAllWinnings() {
            const tournamentId = elements.tmsTournamentSelect.value;
            const selectedOption = elements.tmsTournamentSelect.options[elements.tmsTournamentSelect.selectedIndex];
            const tournamentName = selectedOption.dataset.name;

            if (!tournamentId) {
                showStatus(elements.tmsStatus, "Please select a tournament first.", "warning");
                return;
            }
            if (!confirm(`Are you sure you want to credit winnings for "${tournamentName}"? This cannot be undone.`)) {
                return;
            }
            
            showLoader(true);
            elements.creditWinningsBtn.disabled = true;
            clearStatus(elements.tmsStatus);
            
            const playerRows = elements.tmsPlayerListTableBody.querySelectorAll('tr[data-uid]');
            const updates = {};
            let totalCredited = 0;
            let playersCredited = 0;

            const userIdsToUpdate = Array.from(playerRows).map(row => row.dataset.uid);
            
            const userRefPromises = userIdsToUpdate.map(uid => get(ref(db, `users/${uid}`)));
            const userSnapshots = await Promise.all(userRefPromises);
            const freshUserData = {};
            userSnapshots.forEach(snap => {
                if(snap.exists()) {
                    freshUserData[snap.key] = snap.val();
                }
            });

            playerRows.forEach(row => {
                const uid = row.dataset.uid;
                const user = freshUserData[uid];
                if (!user) {
                    console.warn(`Skipping user ${uid}, data not found.`);
                    return;
                }

                const perKillPrize = parseFloat(row.dataset.perKillPrize || 0);
                const kills = parseInt(row.querySelector('.kills-input')?.value || 0);
                const extraAmount = parseFloat(row.querySelector('.extra-amount-input')?.value || 0);
                const rank = parseInt(row.querySelector('.rank-input')?.value) || 0;
                const totalPrize = (kills * perKillPrize) + extraAmount;
                
                const matchHistory = {
                    tournamentName: tournamentName,
                    rank: rank,
                    kills: kills,
                    earnings: totalPrize,
                    date: serverTimestamp()
                };
                updates[`users/${uid}/matchHistory/${tournamentId}`] = matchHistory;
                
                updates[`users/${uid}/totalMatches`] = (user.totalMatches || 0) + 1;
                if(rank === 1) {
                   updates[`users/${uid}/wonMatches`] = (user.wonMatches || 0) + 1;
                }

                if (uid && totalPrize > 0) {
                    const newBalance = (user.balance || 0) + totalPrize;
                    const newWinningCash = (user.winningCash || 0) + totalPrize;
                    const newTotalEarnings = (user.totalEarnings || 0) + totalPrize;
                    
                    updates[`users/${uid}/balance`] = newBalance;
                    updates[`users/${uid}/winningCash`] = newWinningCash;
                    updates[`users/${uid}/totalEarnings`] = newTotalEarnings;

                    const newTxKey = push(ref(db, `transactions/${uid}`)).key;
                    updates[`transactions/${uid}/${newTxKey}`] = {
                        type: 'tournament_winnings',
                        amount: totalPrize,
                        description: `Winnings: ${kills} Kills + ${formatCurrency(extraAmount)} in ${tournamentName}`,
                        details: { kills, perKillPrize, extraAmount, rank },
                        timestamp: serverTimestamp(),
                        tournamentId: tournamentId,
                        adminUid: currentAdminUser.uid
                    };
                    totalCredited += totalPrize;
                    playersCredited++;
                }
            });

            if (Object.keys(updates).length > 0) {
                updates[`tournaments/${tournamentId}/winningsCredited`] = true;
                updates[`tournaments/${tournamentId}/status`] = 'result';
                
                try {
                    await update(ref(db), updates);
                    showStatus(elements.tmsStatus, `Successfully credited ${formatCurrency(totalCredited)} to ${playersCredited} players and updated stats.`, "success");
                    loadPlayersForManagement(tournamentId); 
                } catch (error) {
                    console.error("Error crediting winnings:", error);
                    showStatus(elements.tmsStatus, `Critical Error: Failed to credit winnings. ${error.message}`, "danger", false);
                    elements.creditWinningsBtn.disabled = false;
                }
            } else {
                 showStatus(elements.tmsStatus, "No winnings or stats to update. All values are zero or blank.", "info");
                 elements.creditWinningsBtn.disabled = false;
            }
            
            showLoader(false);
        }
        
        async function loadLeaderboardManagementData() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            const tableBody = elements.leaderboardMgtTableBody;
            const statusEl = elements.leaderboardMgtStatus;
            clearStatus(statusEl);
            tableBody.innerHTML = tableLoadingPlaceholderHtml(3);
            elements.leaderboardUserSearchInput.value = '';

            try {
                if (Object.keys(fullUserDataCache).length === 0) {
                    await new Promise(resolve => {
                         const usersRef = ref(db, 'users');
                         onValue(usersRef, (snapshot) => {
                             if(snapshot.exists()) {
                                snapshot.forEach(child => {
                                    fullUserDataCache[child.key] = { uid: child.key, ...child.val() };
                                });
                             }
                             resolve();
                         }, { onlyOnce: true });
                    });
                }

                const users = Object.values(fullUserDataCache);
                if(users.length === 0){
                    tableBody.innerHTML = '<tr><td colspan="3" class="text-center p-3 text-muted">No users found.</td></tr>';
                    return;
                }
                
                users.sort((a,b) => (a.displayName || 'z').localeCompare(b.displayName || 'z'));
                renderLeaderboardMgtTable(users);
                
            } catch (error) {
                console.error("Error loading data for Leaderboard Mgt:", error);
                tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-3 text-danger">Error: ${error.message}</td></tr>`;
                showStatus(statusEl, `Error loading user data: ${error.message}`, 'danger');
            }
        }
        
        function renderLeaderboardMgtTable(usersArray){
            const tableBody = elements.leaderboardMgtTableBody;
            let tableHtml = '';
            if (usersArray && usersArray.length > 0) {
                usersArray.forEach(user => {
                    const displayName = user.displayName || 'N/A';
                    const userEmail = user.email || 'N/A';
                    const currentRank = user.leaderboardRank || '';
                    const currentEarnings = user.leaderboardDisplayEarnings ?? '';

                    tableHtml += `
                        <tr data-uid="${user.uid}" data-name="${displayName.toLowerCase()}" data-email="${userEmail.toLowerCase()}">
                            <td>
                                <div>${displayName}</div>
                                <small class="text-muted">${userEmail}</small>
                            </td>
                            <td><input type="number" class="form-control form-control-sm rank-input" style="width: 100px;" value="${currentRank}" placeholder="N/A" min="1"></td>
                            <td><input type="number" class="form-control form-control-sm earnings-input" style="width: 150px;" value="${currentEarnings}" placeholder="e.g., 5000" min="0" step="any"></td>
                        </tr>
                    `;
                });
            }
            tableBody.innerHTML = tableHtml || `<tr><td colspan="3" class="text-center p-3 text-muted">No users found for this search.</td></tr>`;
        }
        
        async function saveLeaderboardData() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;

            const statusEl = elements.leaderboardMgtStatus;
            clearStatus(statusEl);
            if(!confirm("Are you sure you want to save all leaderboard changes?")) return;

            showLoader(true);
            elements.saveLeaderboardBtn.disabled = true;

            const updates = {};
            const playerRows = elements.leaderboardMgtTableBody.querySelectorAll('tr[data-uid]');

            playerRows.forEach(row => {
                const uid = row.dataset.uid;
                const rankInput = row.querySelector('.rank-input');
                const earningsInput = row.querySelector('.earnings-input');

                const rank = parseInt(rankInput.value, 10);
                const earnings = parseFloat(earningsInput.value);
                
                updates[`users/${uid}/leaderboardRank`] = (!isNaN(rank) && rank > 0) ? rank : null;
                updates[`users/${uid}/leaderboardDisplayEarnings`] = (!isNaN(earnings) && earnings >= 0) ? earnings : null;
            });
            
            try {
                await update(ref(db), updates);
                showStatus(statusEl, "Leaderboard data saved successfully!", "success", 3000);
            } catch(error) {
                console.error("Error saving leaderboard data:", error);
                showStatus(statusEl, `Error saving data: ${error.message}`, 'danger', false);
            } finally {
                showLoader(false);
                elements.saveLeaderboardBtn.disabled = false;
            }
        }
        
        function filterLeaderboardMgtUsers(){
            const searchTerm = elements.leaderboardUserSearchInput.value.toLowerCase().trim();
            const allRows = elements.leaderboardMgtTableBody.querySelectorAll('tr[data-uid]');

            allRows.forEach(row => {
                const name = row.dataset.name;
                const email = row.dataset.email;

                if (name.includes(searchTerm) || email.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        function renderNewUserChart() {
            const users = Object.values(fullUserDataCache);
            if (!users || users.length === 0) return;

            const days = Array(7).fill(0).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d;
            }).reverse();

            const labels = days.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const data = Array(7).fill(0);

            users.forEach(user => {
                if (user.createdAt) {
                    const signupDate = new Date(user.createdAt);
                    for (let i = 0; i < 7; i++) {
                        const dayStart = new Date(days[i]).setHours(0, 0, 0, 0);
                        const dayEnd = new Date(days[i]).setHours(23, 59, 59, 999);
                        if (signupDate >= dayStart && signupDate <= dayEnd) {
                            data[i]++;
                            break;
                        }
                    }
                }
            });

            if (newUserChart) { newUserChart.destroy(); }
            newUserChart = new Chart(elements.newUserChartCanvas, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'New Users', data, backgroundColor: 'rgba(250, 204, 21, 0.7)', borderColor: 'rgb(250, 204, 21)', borderWidth: 1 }] },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                         y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: 'var(--text-secondary)', stepSize: 1 } },
                         x: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: 'var(--text-secondary)' } }
                    }
                }
            });
        }
        
        async function loadUserAnalyticsData() {
            elements.topSpendersContainer.innerHTML = '<p class="text-secondary">Loading spenders...</p>';
            elements.mostActiveContainer.innerHTML = '<p class="text-secondary">Loading active players...</p>';
            elements.inactiveUsersContainer.innerHTML = '<p class="text-secondary">Loading inactive users...</p>';
            
            // Wait for fullUserDataCache to be populated if it's empty
            if (Object.keys(fullUserDataCache).length === 0) { await loadUsers(); }

            // TOP SPENDERS
            try {
                const depositsQuery = query(ref(db, 'deposits'), orderByChild('status'), equalTo('completed'));
                const depositSnap = await get(depositsQuery);
                if (depositSnap.exists()) {
                    const spenders = {};
                    depositSnap.forEach(snap => {
                        const d = snap.val();
                        spenders[d.userId] = (spenders[d.userId] || 0) + d.amount;
                    });
                    const sortedSpenders = Object.entries(spenders).sort((a,b) => b[1] - a[1]).slice(0, 10);
                    let table = '<table class="table table-dark table-sm table-hover">';
                    sortedSpenders.forEach(([uid, amount]) => {
                         table += `<tr><td>${sanitizeHTML(fullUserDataCache[uid]?.displayName || uid)}</td><td class="text-end text-success">${formatCurrency(amount)}</td></tr>`;
                    });
                    table += '</table>';
                    elements.topSpendersContainer.innerHTML = sortedSpenders.length > 0 ? table : '<p class="text-secondary">No deposit data found.</p>';
                } else {
                    elements.topSpendersContainer.innerHTML = '<p class="text-secondary">No deposit data found.</p>';
                }
            } catch(e) { elements.topSpendersContainer.innerHTML = `<p class="text-danger">Error: ${e.message}</p>`; }

            // MOST ACTIVE
            try {
                const tSnap = await get(ref(db, 'tournaments'));
                if (tSnap.exists()) {
                     const activePlayers = {};
                     tSnap.forEach(t => {
                         const players = t.val().registeredPlayers;
                         if (players) Object.keys(players).forEach(uid => { activePlayers[uid] = (activePlayers[uid] || 0) + 1; });
                     });
                     const sortedActive = Object.entries(activePlayers).sort((a,b) => b[1] - a[1]).slice(0, 10);
                     let table = '<table class="table table-dark table-sm table-hover">';
                     sortedActive.forEach(([uid, count]) => {
                         table += `<tr><td>${sanitizeHTML(fullUserDataCache[uid]?.displayName || uid)}</td><td class="text-end">${count} matches</td></tr>`;
                     });
                     table += '</table>';
                     elements.mostActiveContainer.innerHTML = sortedActive.length > 0 ? table : '<p class="text-secondary">No activity data found.</p>';
                } else {
                     elements.mostActiveContainer.innerHTML = '<p class="text-secondary">No tournament data found.</p>';
                }
            } catch(e) { elements.mostActiveContainer.innerHTML = `<p class="text-danger">Error: ${e.message}</p>`; }

            // INACTIVE USERS
            try {
                 const users = Object.values(fullUserDataCache);
                 const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
                 const inactiveUsers = users.filter(u => !u.lastLogin || u.lastLogin < fifteenDaysAgo);
                 if(inactiveUsers.length > 0) {
                     let table = '<table class="table table-dark table-sm table-hover">';
                     inactiveUsers.forEach(u => {
                         table += `<tr>
                                    <td>
                                      <div>${sanitizeHTML(u.displayName || u.uid)}</div>
                                      <small class="text-muted">Last login: ${u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</small>
                                    </td>
                                    <td class="text-end">
                                      <button class="btn btn-sm btn-info btn-view-user" data-id="${u.uid}" title="View/Notify"><i class="bi bi-eye"></i></button>
                                    </td>
                                  </tr>`;
                     });
                     table += '</table>';
                     elements.inactiveUsersContainer.innerHTML = table;
                 } else {
                    elements.inactiveUsersContainer.innerHTML = '<p class="text-secondary">No inactive users found.</p>';
                 }
            } catch(e) { elements.inactiveUsersContainer.innerHTML = `<p class="text-danger">Error: ${e.message}</p>`; }

        }

        // --- NEW THEME FUNCTIONS ---

        const defaultTheme = {
            'primary-bg': '#0F172A', 'secondary-bg': '#1E293B', 'card-bg': '#1E293B',
            'text-primary': '#E2E8F0', 'text-secondary': '#94A3B8', 'accent-color': '#FACC15',
            'primary-button-bg': '#3B82F6', 'border-color': '#334155', 'success-color': '#10B981',
            'danger-color': '#EF4444', 'warning-color': '#F59E0B', 'info-color': '#60A5FA'
        };

        const themePresets = {
            light: {
                'primary-bg': '#F1F5F9', 'secondary-bg': '#FFFFFF', 'card-bg': '#FFFFFF',
                'text-primary': '#0F172A', 'text-secondary': '#475569', 'accent-color': '#F59E0B',
                'primary-button-bg': '#2563EB', 'border-color': '#E2E8F0', 'success-color': '#16A34A',
                'danger-color': '#DC2626', 'warning-color': '#D97706', 'info-color': '#3B82F6'
            },
            gamingRed: {
                'primary-bg': '#111827', 'secondary-bg': '#1F2937', 'card-bg': '#1F2937',
                'text-primary': '#F9FAFB', 'text-secondary': '#9CA3AF', 'accent-color': '#EF4444',
                'primary-button-bg': '#D97706', 'border-color': '#374151', 'success-color': '#10B981',
                'danger-color': '#EF4444', 'warning-color': '#F59E0B', 'info-color': '#3B82F6'
            }
        };

        function applyThemeToAdminPanel(theme) {
            const root = document.documentElement;
            const themeToApply = theme || defaultTheme;
            for (const [key, value] of Object.entries(themeToApply)) {
                if (value) {
                    root.style.setProperty(`--${key}`, value);
                }
            }
        }
        
        function loadThemeSettings() {
            clearStatus(elements.themeStatus);
            const currentTheme = appSettings.theme || defaultTheme;
            elements.themeColorInputs.forEach(input => {
                const varName = input.dataset.themeVar;
                if (currentTheme[varName]) {
                    input.value = currentTheme[varName];
                }
            });
        }
        
        function applyPreset(presetName) {
            let preset = defaultTheme;
            if (presetName === 'light') preset = themePresets.light;
            if (presetName === 'gamingRed') preset = themePresets.gamingRed;
            
            elements.themeColorInputs.forEach(input => {
                const varName = input.dataset.themeVar;
                if (preset[varName]) {
                    input.value = preset[varName];
                }
            });
            // Also apply it live to the admin panel
            applyThemeToAdminPanel(preset);
        }

        async function saveThemeSettings() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;

            const newTheme = {};
            elements.themeColorInputs.forEach(input => {
                const varName = input.dataset.themeVar;
                newTheme[varName] = input.value;
            });
            try {
                await update(ref(db, 'settings'), { theme: newTheme });
                appSettings.theme = newTheme; // Update local cache
                showStatus(elements.themeStatus, "Theme saved successfully for all users!", "success");
            } catch(error) {
                console.error("Error saving theme:", error);
                showStatus(elements.themeStatus, `Error: ${error.message}`, 'danger', false);
            } finally {
                showLoader(false);
                elements.saveThemeBtn.disabled = false;
            }
        }

        async function resetThemeSettings() {
            if (!db || !isDesignatedAdmin(currentAdminUser)) return;
            if (!confirm("Are you sure you want to reset the theme to default for all users?")) return;
            
            showLoader(true);
            elements.resetThemeBtn.disabled = true;

            try {
                await set(ref(db, 'settings/theme'), null); // Remove theme node
                appSettings.theme = null;
                applyPreset('default'); // Load default values into inputs
                showStatus(elements.themeStatus, "Theme has been reset to default.", "success");
            } catch(error) {
                 console.error("Error resetting theme:", error);
                showStatus(elements.themeStatus, `Error: ${error.message}`, 'danger', false);
            } finally {
                showLoader(false);
                elements.resetThemeBtn.disabled = false;
            }
        }

        function initializeAdminEventListeners() {
            console.log("Initializing Admin Event Listeners...");
            if (!auth || !db) { console.error("Cannot init listeners: Firebase not ready."); return; }
            elements.adminSetupForm?.addEventListener('submit', setupAdmin);
            elements.adminLoginForm?.addEventListener('submit', loginAdmin);
            elements.adminLogoutBtn?.addEventListener('click', logoutAdminUser);
            elements.sidebarLinks?.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const sectionId = link.dataset.section; if (sectionId && !link.classList.contains('active')) { showAdminSection(sectionId); } else { getOffcanvasInstance(elements.sidebar)?.hide(); } }); });
            elements.supportReportsTableBody?.addEventListener('change', updateSupportReportStatus);
            elements.supportReportsTableBody?.addEventListener('click', (event) => {
                const button = event.target.closest('.report-attachment-download');
                if (button) downloadSupportReportAttachment(button);
            });
            elements.gameTopupPackageForm?.addEventListener('submit', saveGameTopupPackage);
            elements.gameTopupPackagesTableBody?.addEventListener('click', (event) => {
                const button = event.target.closest('.delete-game-topup-package');
                if (button) removeGameTopupPackage(button);
            });
            elements.gameTopupOrdersTableBody?.addEventListener('change', updateGameTopupFulfillment);
            elements.saveGameBtn?.addEventListener('click', saveGame);
            elements.savePromotionBtn?.addEventListener('click', savePromotion);
            elements.saveTournamentBtn?.addEventListener('click', saveTournament);
            elements.saveNewUserBtn?.addEventListener('click', saveNewUser);
            elements.saveNewStaffBtn?.addEventListener('click', saveNewStaff);
            elements.staffSearchInput?.addEventListener('input', filterStaff);
            elements.editStaffNameForm?.addEventListener('submit', saveStaffName);
            elements.staffBlockBtn?.addEventListener('click', toggleStaffBlock);
            elements.staffResetPasswordBtn?.addEventListener('click', sendStaffPasswordReset);
            elements.staffDeleteBtn?.addEventListener('click', (e) => { const staffId = e.target.closest('button')?.dataset.id; if (staffId) deleteStaffRecord(staffId); });
            elements.appSettingsForm?.addEventListener('submit', saveSettings);
            elements.updateBalanceForm?.addEventListener('submit', updateUserBalance);
            elements.addNewGameBtn?.addEventListener('click', () => { elements.gameForm?.reset(); elements.gameEditId.value = ''; elements.gameModalTitle.textContent = "Add New Game"; clearStatus(elements.gameStatus); const imgbbEl = elements.gameForm?.querySelector('.image-upload-status'); if(imgbbEl){ imgbbEl.textContent=''; imgbbEl.style.display='none';} });
            elements.addNewPromotionBtn?.addEventListener('click', () => { elements.promotionForm?.reset(); elements.promotionEditId.value = ''; elements.promotionModalTitle.textContent = "Add New Promotion"; clearStatus(elements.promotionStatus); const imgbbEl = elements.promotionForm?.querySelector('.image-upload-status'); if(imgbbEl){ imgbbEl.textContent=''; imgbbEl.style.display='none';} });
            elements.addNewTournamentBtn?.addEventListener('click', () => { currentEditingTournamentId = null; elements.tournamentForm?.reset(); if(elements.tournamentModalTitle) elements.tournamentModalTitle.textContent = "Add New Tournament"; clearStatus(elements.addTournamentStatus); populateGameSelect(); });
            elements.userBlockBtn?.addEventListener('click', toggleUserBlock);
            elements.userDeleteBtn?.addEventListener('click', (e) => { const userId = e.target.closest('button')?.dataset.id; if (userId) deleteUser(userId); });
            elements.approveWithdrawalBtn?.addEventListener('click', processWithdrawalAction);
            elements.rejectWithdrawalBtn?.addEventListener('click', processWithdrawalAction);
            elements.addDemoDataBtn?.addEventListener('click', addDemoData);
            elements.userSearchInput?.addEventListener('input', filterUsers);
            
            elements.globalNotificationForm?.addEventListener('submit', sendGlobalNotification);
            elements.individualNotificationForm?.addEventListener('submit', sendIndividualNotification);
            elements.pendingDepositsTableBody?.addEventListener('change', (event) => { if (event.target.classList.contains('deposit-action-select')) { handleDepositAction(event); } });
            elements.tmsTournamentSelect?.addEventListener('change', (e) => loadPlayersForManagement(e.target.value));
            elements.tmsPlayerListTableBody?.addEventListener('input', (e) => { if (e.target.matches('.kills-input, .extra-amount-input, .rank-input')) { const row = e.target.closest('tr'); if(row) calculateRowPrize(row); } });
            elements.creditWinningsBtn?.addEventListener('click', creditAllWinnings);
            
            elements.downloadUsersPdfBtn?.addEventListener('click', downloadUsersAsPDF);
            elements.downloadPlayersPdfBtn?.addEventListener('click', downloadPlayersAsPDF);
            elements.pendingReferralsTableBody?.addEventListener('click', (e) => {
                if(e.target.matches('.btn-credit-referral') || e.target.closest('.btn-credit-referral')) {
                    const btn = e.target.closest('.btn-credit-referral');
                    const referralId = btn.dataset.id;
                    const referrerUid = btn.dataset.referrerUid;
                    creditReferralBonus(referralId, referrerUid);
                }
            });

            elements.saveLeaderboardBtn?.addEventListener('click', saveLeaderboardData);
            elements.leaderboardUserSearchInput?.addEventListener('input', filterLeaderboardMgtUsers);

            // *** NEW THEME EVENT LISTENERS ***
            elements.saveThemeBtn?.addEventListener('click', saveThemeSettings);
            elements.resetThemeBtn?.addEventListener('click', resetThemeSettings);
            elements.presetBtnDefault?.addEventListener('click', () => applyPreset('default'));
            elements.presetBtnLight?.addEventListener('click', () => applyPreset('light'));
            elements.presetBtnGamingRed?.addEventListener('click', () => applyPreset('gamingRed'));
            elements.themeColorInputs.forEach(input => {
                input.addEventListener('input', () => {
                    const varName = input.dataset.themeVar;
                    document.documentElement.style.setProperty(`--${varName}`, input.value);
                });
            });


            document.body.addEventListener('click', (event) => {
                 const target = event.target; const actionButton = target.closest('button[data-id]'); const copyIcon = target.closest('.copy-btn[data-target]');
                 if (actionButton) {
                     const targetId = actionButton.dataset.id; if (!targetId) return;
                     if (actionButton.classList.contains('btn-delete-game')) deleteGame(targetId);
                     else if (actionButton.classList.contains('btn-edit-game')) openEditGameModal(targetId);
                     else if (actionButton.classList.contains('btn-delete-promo')) deletePromotion(targetId);
                     else if (actionButton.classList.contains('btn-edit-promo')) openEditPromotionModal(targetId);
                     else if (actionButton.classList.contains('btn-delete-tournament')) deleteTournament(targetId);
                     else if (actionButton.classList.contains('btn-edit-tournament')) openEditTournamentModal(targetId);
                     else if (actionButton.classList.contains('btn-view-user')) openUserModal(targetId);
                     else if (actionButton.classList.contains('btn-approve-withdrawal')) openWithdrawalActionModal(targetId, 'approve');
                     else if (actionButton.classList.contains('btn-reject-withdrawal')) openWithdrawalActionModal(targetId, 'reject');
                     else if (actionButton.classList.contains('btn-delete-user')) deleteUser(targetId);
                     else if (actionButton.classList.contains('btn-view-registered')) openRegisteredPlayersModal(targetId, actionButton.dataset.name);
                     else if (actionButton.classList.contains('btn-view-staff')) openStaffModal(targetId);
                     else if (actionButton.classList.contains('btn-delete-staff')) deleteStaffRecord(targetId);
                     return;
                 }
                 if (copyIcon) { copyToClipboard(copyIcon.dataset.target); return; }
            });
            const resetModal = (modalEl, formEl, statusEl, idField = null, titleEl = null, defaultTitle = 'Add New Item', imgbbSel = '.image-upload-status') => { modalEl?.addEventListener('hidden.bs.modal', () => { formEl?.reset(); if(statusEl) clearStatus(statusEl); const imgbbStat = formEl?.querySelector(imgbbSel); if(imgbbStat) { imgbbStat.textContent=''; imgbbStat.style.display='none'; } if (idField) idField.value = ''; if (titleEl) titleEl.textContent = defaultTitle; if (modalEl === elements.addTournamentModalEl) currentEditingTournamentId = null; if (modalEl === elements.userModalEl) { elements.editUserUid.value = ''; elements.individualNotificationForm.reset(); clearStatus(elements.individualNotificationStatus); } if (modalEl === elements.withdrawalActionModalEl) currentWithdrawalAction = { id: null, type: null, userId: null }; currentEditingItemId = null; }); };
             resetModal(elements.gameModalEl, elements.gameForm, elements.gameStatus, elements.gameEditId, elements.gameModalTitle, 'Add New Game');
             resetModal(elements.promotionModalEl, elements.promotionForm, elements.promotionStatus, elements.promotionEditId, elements.promotionModalTitle, 'Add New Promotion');
             resetModal(elements.addTournamentModalEl, elements.tournamentForm, elements.addTournamentStatus, elements.tournamentEditId, elements.tournamentModalTitle, 'Add New Tournament', null);
             resetModal(elements.addUserModalEl, elements.addUserForm, elements.addUserStatus, null, null, '', null);
             resetModal(elements.addStaffModalEl, elements.addStaffForm, elements.addStaffStatus, null, null, '', null);
             resetModal(elements.staffModalEl, elements.editStaffNameForm, elements.staffModalStatus, elements.editStaffUid, null, '', null);
             resetModal(elements.userModalEl, elements.updateBalanceForm, elements.balanceUpdateStatus, elements.editUserUid, null, '', null);
             resetModal(elements.withdrawalActionModalEl, null, elements.withdrawalActionStatus, null, null, '', null);
             resetModal(elements.registeredPlayersModalEl, null, elements.registeredPlayersStatus, null, null, '', null);
             console.log("Admin Event Listeners Initialized.");
        }

        function filterUsers() { const searchTerm = elements.userSearchInput.value.toLowerCase().trim(); const filteredUsers = Object.values(fullUserDataCache).filter(user => user.displayName?.toLowerCase().includes(searchTerm) || user.email?.toLowerCase().includes(searchTerm)); renderUsersTable(filteredUsers); }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            console.log("Admin Panel DOM Loaded.");
            if (!app || !auth || !db) { console.error("DOM loaded, but Firebase services not initialized. Check config object."); return; }
            initializeAdminEventListeners();
            onAuthStateChanged(auth, handleAdminAuthStateChange);
        });
    