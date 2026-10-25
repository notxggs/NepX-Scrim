// Firebase Imports
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
        import { getDatabase, ref, get, set, update, push, query, orderByChild, equalTo, onValue, off, limitToLast, serverTimestamp, onChildAdded } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, PhoneAuthProvider, RecaptchaVerifier, signInWithCredential, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

        // MODIFICATION START: Admin se control karne ke liye note
        // ADMIN NOTE: Apne Firebase project ki config yahan daalein.
        // Theme, app update, aur dusri settings Firebase Realtime Database ke '/settings' node se control hongi.
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
// MODIFICATION END

        let app, db, auth;
        try {
            app = initializeApp(firebaseConfig);
            db = getDatabase(app);
            auth = getAuth(app);
            console.log("Firebase Initialized");
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            document.body.innerHTML = `<div class="alert alert-danger m-5 position-fixed top-0 start-0 end-0" style="z-index: 10000;">Critical Error: Could not connect. Check Firebase config & console. Error: ${error.message}</div>`;
        }

         const getElement = (id) => document.getElementById(id);
         const querySel = (selector) => document.querySelector(selector);
         const querySelAll = (selector) => document.querySelectorAll(selector);
         async function apiRequest(path, options = {}) {
             if (!currentUser) throw new Error("Please sign in to continue.");
             const token = await currentUser.getIdToken();
             const response = await fetch(`${API_BASE_URL}${path}`, {
                 ...options,
                 headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${token}`,
                     ...(options.headers || {})
                 }
             });
             const result = await response.json().catch(() => ({}));
             if (!response.ok) {
                 const fallbackMessage = response.status === 405
                     ? 'The API endpoint is not deployed at this address. Update the backend to the latest version and configure window.APP_API_BASE_URL to your deployed API URL.'
                     : `Request failed (${response.status}).`;
                 const error = new Error(result.error?.message || fallbackMessage);
                 error.code = result.error?.code;
                 throw error;
             }
             return result;
         }
         const elements = {
             sections: querySelAll('.section'), bottomNavItems: querySelAll('.bottom-nav .nav-item'), globalLoader: getElement('globalLoaderEl'),
             headerBackBtn: getElement('headerBackBtnEl'), headerTitleContainer: getElement('headerTitleContainerEl'), headerGameTitle: getElement('headerGameTitleEl'), headerWalletChip: getElement('headerWalletChipEl'), headerChipBalance: getElement('headerChipBalanceEl'), headerUserGreeting: getElement('headerUserGreetingEl'), appLogo: getElement('appLogoEl'), notificationBtn: getElement('notificationBtnEl'), notificationBadge: querySel('.notification-badge'),
             loginSection: getElement('login-section'),
             emailLoginForm: getElement('emailLoginForm'), loginEmailInput: getElement('loginEmailInputEl'), loginPasswordInput: getElement('loginPasswordInputEl'), loginEmailBtn: getElement('loginEmailBtnEl'), showSignupToggleBtn: getElement('showSignupToggleBtnEl'), loginStatusMessage: getElement('loginStatusMessageEl'), forgotPasswordLink: getElement('forgotPasswordLinkEl'), googleSignInBtn: getElement('googleSignInBtnEl'), phoneSignInBtn: getElement('phoneSignInBtnEl'),
             emailSignupForm: getElement('emailSignupForm'), signupNameInput: getElement('signupNameInputEl'), signupEmailInput: getElement('signupEmailInputEl'), signupPhoneInput: getElement('signupPhoneInputEl'), signupPasswordInput: getElement('signupPasswordInputEl'), signupConfirmPasswordInput: getElement('signupConfirmPasswordInputEl'), signupReferralCodeInput: getElement('signupReferralCodeInputEl'), signupEmailBtn: getElement('signupEmailBtnEl'), showLoginToggleBtn: getElement('showLoginToggleBtnEl'), signupStatusMessage: getElement('signupStatusMessageEl'),
             phoneOtpForm: getElement('phoneOtpForm'), phoneOtpNumberDisplay: getElement('phoneOtpNumberDisplay'), phoneOtpInput: getElement('phoneOtpInputEl'), phoneOtpStatusMessage: getElement('phoneOtpStatusMessageEl'), verifyOtpBtn: getElement('verifyOtpBtnEl'), backToLoginBtn: getElement('backToLoginBtnEl'),
             homeSection: getElement('home-section'), announcementBar: getElement('announcementBarEl'), announcementText: getElement('announcementTextEl'), promotionSlider: getElement('promotionSliderEl'), gamesList: getElement('gamesListEl'), contestStatusNav: getElement('contestStatusNavEl'),
             myContestsSection: getElement('my-contests-section'), myContestsList: getElement('myContestsListEl'), noContestsMessage: getElement('noContestsMessageEl'),
             tournamentsSection: getElement('tournaments-section'), tournamentsListContainer: getElement('tournamentsListContainerEl'), noTournamentsMessage: getElement('noTournamentsMessageEl'), tournamentTabs: querySelAll('.tournament-tabs .tab-item'),
             walletSection: getElement('wallet-section'), walletTotalBalance: getElement('walletTotalBalanceEl'), walletWinningCash: getElement('walletWinningCashEl'), walletBonusCash: getElement('walletBonusCashEl'), allTransactionsBtn: getElement('allTransactionsBtnEl'), withdrawBtn: getElement('withdrawBtnEl'), addAmountWalletBtn: getElement('addAmountWalletBtnEl'), recentTransactionsList: getElement('recentTransactionsListEl'), noTransactionsMessage: getElement('noTransactionsMessageEl'),
             earningsSection: getElement('earnings-section'), earningsTotal: getElement('earningsTotalEl'), earningsReferral: getElement('earningsReferralEl'),
             profileSection: getElement('profile-section'), profileAvatarWrapper: getElement('profileAvatarWrapperEl'), profileAvatar: getElement('profileAvatarEl'), profileAvatarInput: getElement('profileAvatarInput'), profileName: getElement('profileNameEl'), profileEmail: getElement('profileEmailEl'), profileTotalMatches: getElement('profileTotalMatchesEl'), profileWonMatches: getElement('profileWonMatchesEl'), profileTotalEarnings: getElement('profileTotalEarningsEl'), logoutProfileBtn: getElement('logoutProfileBtnEl'), policyLinks: querySelAll('.profile-links a[data-policy], .profile-links button[data-policy]'), enableNotificationsBtn: getElement('enableNotificationsBtn'), changePasswordBtn: getElement('changePasswordBtn'), developerContactBtn: getElement('developerContactBtn'),
             leaderboardSection: getElement('leaderboard-section'), leaderboardListEl: getElement('leaderboardListEl'), noLeaderboardMessageEl: getElement('noLeaderboardMessageEl'),
             contactUsBtn: getElement('contactUsBtnEl'),
             supportReportForm: getElement('supportReportForm'), supportReportType: getElement('supportReportType'), supportReportDescriptionLabel: getElement('supportReportDescriptionLabel'), supportReportDescription: getElement('supportReportDescription'), supportReportFiles: getElement('supportReportFiles'), supportReportStatus: getElement('supportReportStatus'), submitSupportReportBtn: getElement('submitSupportReportBtn'), userSupportReportsList: getElement('userSupportReportsList'), openSupportReportBtn: getElement('openSupportReportBtnEl'), supportReportBackBtn: getElement('supportReportBackBtn'),
             openGameTopupBtn: getElement('openGameTopupBtnEl'), gameTopupForm: getElement('gameTopupForm'), gameTopupGame: getElement('gameTopupGame'), gameTopupPackage: getElement('gameTopupPackage'), gameTopupPlayerId: getElement('gameTopupPlayerId'), gameTopupServerId: getElement('gameTopupServerId'), gameTopupStatus: getElement('gameTopupStatus'), submitGameTopupBtn: getElement('submitGameTopupBtn'), userGameTopupOrders: getElement('userGameTopupOrders'), gameTopupBackBtn: getElement('gameTopupBackBtn'),
             rechargeSection: getElement('recharge-section'), rechargeStep1: getElement('recharge-step-1-amount'), rechargeStep2: getElement('recharge-step-2-method'), rechargeStep3: getElement('recharge-step-3-payment'), rechargeBalanceDisplay: getElement('rechargeBalanceDisplay'), rechargeAmountInput: getElement('rechargeAmountInput'), rechargePresetBtns: querySelAll('.amount-preset-btn'), rechargeStep1Status: getElement('rechargeStep1Status'), goToStep2Btn: getElement('goToStep2Btn'), rechargeAmountConfirm: getElement('rechargeAmountConfirm'), paymentOptionCards: querySelAll('.payment-option-card'), rechargeStep2Status: getElement('rechargeStep2Status'), goToStep3Btn: getElement('goToStep3Btn'), rechargeFinalAmount: getElement('rechargeFinalAmount'), rechargeStep3Status: getElement('rechargeStep3Status'), rechargeCancelBtn: getElement('rechargeCancelBtn'), rechargeReturnWalletBtn: getElement('rechargeReturnWalletBtn'), rechargeSubmitBtn: getElement('rechargeSubmitBtn'),
             policyModalInstance: getElement('policyModalEl') ? new bootstrap.Modal(getElement('policyModalEl')) : null, policyModalTitle: getElement('policyModalTitleEl'), policyModalBody: getElement('policyModalBodyEl'),
             appUpdateModalInstance: getElement('appUpdateModal') ? new bootstrap.Modal(getElement('appUpdateModal')) : null, appUpdateMessage: getElement('appUpdateMessage'), appUpdateLink: getElement('appUpdateLink'),
             changePasswordModalInstance: getElement('changePasswordModal') ? new bootstrap.Modal(getElement('changePasswordModal')) : null, currentPasswordInput: getElement('currentPasswordInput'), newPasswordInput: getElement('newPasswordInput'), confirmNewPasswordInput: getElement('confirmNewPasswordInput'), changePasswordStatusMessage: getElement('changePasswordStatusMessage'), savePasswordChangeBtn: getElement('savePasswordChangeBtn'),
             withdrawMethodModalInstance: getElement('withdrawMethodModal') ? new bootstrap.Modal(getElement('withdrawMethodModal')) : null, withdrawMethodOptions: querySelAll('.withdraw-method-option'),
             withdrawModalInstance: getElement('withdrawModalEl') ? new bootstrap.Modal(getElement('withdrawModalEl')) : null, withdrawModalBalance: getElement('withdrawModalBalanceEl'), withdrawAmountInput: getElement('withdrawAmountInputEl'), withdrawMethodInput: getElement('withdrawMethodInputEl'), minWithdrawAmount: getElement('minWithdrawAmountEl'), withdrawMethodLabel: getElement('withdrawMethodLabelEl'), withdrawStatusMessage: getElement('withdrawStatusMessageEl'), submitWithdrawRequestBtn: getElement('submitWithdrawRequestBtnEl'),
             matchDetailsModalInstance: getElement('matchDetailsModalEl') ? new bootstrap.Modal(getElement('matchDetailsModalEl')) : null, matchDetailsModalTitle: getElement('matchDetailsModalTitleEl'), matchDetailsModalBody: getElement('matchDetailsModalBodyEl'),
             idPasswordModalInstance: getElement('idPasswordModalEl') ? new bootstrap.Modal(getElement('idPasswordModalEl')) : null, roomIdDisplay: getElement('roomIdDisplayEl'), roomPasswordDisplay: getElement('roomPasswordDisplayEl'),
             joinTournamentDetailsModalInstance: getElement('joinTournamentDetailsModal') ? new bootstrap.Modal(getElement('joinTournamentDetailsModal')) : null,
             joinFeeDisplayEl: getElement('joinFeeDisplayEl'),
             joinTournamentIdInput: getElement('joinTournamentIdInput'),
             joinTournamentFeeInput: getElement('joinTournamentFeeInput'),
             joinTournamentModeInput: getElement('joinTournamentModeInput'),
             joinUsernameInput: getElement('joinUsernameInput'),
             joinGameUidInput: getElement('joinGameUidInput'),
             joinTeamFieldsContainer: getElement('joinTeamFieldsContainer'),
             teammateInputsContainer: getElement('teammateInputsContainer'),
             joinTournamentStatusMessage: getElement('joinTournamentStatusMessageEl'),
             confirmJoinBtn: getElement('confirmJoinBtn'),
             securityWarning: getElement('securityWarning'),
             notificationsModalInstance: getElement('notificationsModalEl') ? new bootstrap.Modal(getElement('notificationsModalEl')) : null,
             notificationsListEl: getElement('notificationsListEl'),
             notificationsEmptyMsgEl: getElement('notificationsEmptyMsgEl'),
             editNameBtnEl: getElement('editNameBtnEl'),
             editNameModalInstance: getElement('editNameModal') ? new bootstrap.Modal(getElement('editNameModal')) : null,
             editNameInput: getElement('editNameInput'),
             editNameStatusMessage: getElement('editNameStatusMessage'),
             saveNameChangeBtn: getElement('saveNameChangeBtn'),
             matchHistoryBtn: getElement('matchHistoryBtn'),
             matchHistoryModalInstance: getElement('matchHistoryModal') ? new bootstrap.Modal(getElement('matchHistoryModal')) : null,
             matchHistoryBodyEl: getElement('matchHistoryBodyEl'),
             slotSelectionModalInstance: getElement('slotSelectionModal') ? new bootstrap.Modal(getElement('slotSelectionModal')) : null,
             slotSelectionGridEl: getElement('slotSelectionGridEl'),
             slotSelectionStatus: getElement('slotSelectionStatus'),
             slotSelectionCount: getElement('slotSelectionCount'),
             confirmSlotSelectionBtn: getElement('confirmSlotSelectionBtn'),
             tournamentChatModalInstance: getElement('tournamentChatModal') ? new bootstrap.Modal(getElement('tournamentChatModal')) : null,
             tournamentChatModalTitle: getElement('tournamentChatModalTitle'),
             chatMessagesEl: getElement('chatMessagesEl'),
             chatForm: getElement('chatForm'),
             chatMessageInput: getElement('chatMessageInput'),
             chatReplyContextEl: getElement('chatReplyContextEl'),
             replyToNameEl: getElement('replyToNameEl'),
             replyToMessageEl: getElement('replyToMessageEl'),
             cancelReplyBtn: getElement('cancelReplyBtn'),
             splashLogo: getElement('splashLogoEl'), // Added splash logo element
         };

        let currentUser = null; let userProfile = {}; let currentSectionId = 'login-section'; let dbListeners = {};
        let swiperInstance; let currentTournamentGameId = null; let appSettings = {};
        let tempReferralCode = null;
        let currentRechargeData = { amount: 0, paymentMethod: null };
        let currentTopupSessionId = null;
        let topupPollTimeout = null;
        let currentGameTopupSessionId = null;
        let gameTopupPollTimeout = null;
        let currentJoinRequestId = null;
        let currentWithdrawData = { method: null };
        let currentJoinTournamentData = { tId: null, fee: 0, mode: 'Solo', hasSlots: false, slotConfig: null, selectedSlots: [] };
        let currentChatListener = null; 
        let currentReply = null; 
        let phoneVerification = { confirmationResult: null, phoneNumber: null };
        let countdownInterval = null;

        // MODIFICATION START: Back button ke liye Navigation Stack banaya gaya
        let navigationStack = ['login-section']; 
        // MODIFICATION END

        const showLoader = (show) => { if (elements.globalLoader) elements.globalLoader.style.display = show ? 'flex' : 'none'; };
        function showStatusMessage(element, message, type = 'danger', autohide = true) { if (!element) return; element.innerHTML = message; element.className = `alert alert-${type} mt-3`; element.style.display = 'block'; element.setAttribute('role', 'alert'); if (autohide) { setTimeout(() => { if (element.innerHTML === message) element.style.display = 'none'; }, 5000); } }
        function clearStatusMessage(element) { if (!element) return; element.style.display = 'none'; element.innerHTML = ''; element.removeAttribute('role'); }
        function copyToClipboard(targetSelectorOrText, isText = false) { let textToCopy; if (isText) { textToCopy = targetSelectorOrText; } else { if (!targetSelectorOrText) { alert('Copy target not defined.'); return; } const targetElement = querySel(targetSelectorOrText); if (!targetElement) { alert('Element to copy from not found.'); return; } textToCopy = targetElement.textContent; } if (!textToCopy || textToCopy === 'N/A' || textToCopy.includes('placeholder')) { alert('Nothing to copy.'); return; } navigator.clipboard.writeText(textToCopy).then(() => alert('Copied!')).catch(err => { console.error('Failed to copy:', err); alert('Failed to copy.'); }); }
        
        function shareReferral(code) {
            if (!code || code === 'N/A') { alert('Referral code not available.'); return; }
            const appName = appSettings.appName || "Battle Raja";
            const signupBonus = appSettings.signupBonus || 10;
            const referralBonus = appSettings.referralBonus || 5;

            const shareText = 
`Free Fire tournament App🚨

App Name - ${appName}
Free Joining ✅
Sign up Bonus - रु ${signupBonus}💸
Per Refer - रु ${referralBonus} 🌟
Fast Join Free

Use Code - ( ${code} ) Free रु ${signupBonus} 😀

Download 👇
https://adixclash.wuaze.com/?i=1`;

            if (navigator.share) {
                 navigator.share({
                    title: `Join ${appName}!`,
                    text: shareText
                }).catch((error) => console.log('Error sharing', error));
            } else {
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                window.open(whatsappUrl, '_blank');
            }
        }

        function generateReferralCode(length = 8) { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let result = ''; for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length)); return result; }
        const formatDate = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            const diffSeconds = Math.floor((now - date) / 1000);
            if (diffSeconds < 60) return 'Just now';
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes < 60) return `${diffMinutes}m ago`;
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        };
        const formatFullDateTime = (timestamp) => {
             if (!timestamp) return 'N/A';
             const date = new Date(timestamp);
             return date.toLocaleString('en-IN', {
                 year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
             });
        };
        function getTimeRemaining(startTime, element) { 
            if (!startTime) return 'TBA'; 
            const now = Date.now(); const diff = startTime - now; 
            if (diff <= 0) {
                 if (element && element.closest('.tournament-card')?.dataset.status === 'upcoming') {
                    element.textContent = 'Starting Soon';
                 }
                 return 'Starting Soon';
            }
            const days = Math.floor(diff / 86400000); 
            const hours = Math.floor((diff % 86400000) / 3600000); 
            const minutes = Math.floor((diff % 3600000) / 60000); 
            const seconds = Math.floor((diff % 60000) / 1000);
            let o = ''; 
            if (days > 0) o += `${days}d `; 
            if (hours > 0 || days > 0) o += `${hours}h `; 
            o += `${minutes}m `;
            if (days === 0 && hours === 0) o += `${seconds}s`; // Show seconds only in the last hour
            return o.trim() || 'Now'; 
        }

        function startLiveTimers() {
            if (countdownInterval) clearInterval(countdownInterval);
            countdownInterval = setInterval(() => {
                const timerElements = document.querySelectorAll('.tournament-card-timer[data-starttime]');
                timerElements.forEach(el => {
                    const startTime = parseInt(el.dataset.starttime, 10);
                    if (!isNaN(startTime)) {
                        el.textContent = getTimeRemaining(startTime, el);
                    }
                });
            }, 1000);
        }

        const removePlaceholders = (parentElement) => { if (!parentElement) return; parentElement.classList.remove('placeholder-glow'); parentElement.querySelectorAll('.placeholder').forEach(el => el.remove()); };

        // MODIFICATION START: showSection function ko navigation stack manage karne ke liye update kiya gaya hai
        function showSection(sectionId, isBackAction = false) { 
            if (!auth || !sectionId || !elements.sections) { console.error("Cannot show section", sectionId); return; } 
            const targetSection = getElement(sectionId); if (!targetSection) { console.error(`Section element "${sectionId}" not found.`); showSection(currentUser ? 'home-section' : 'login-section'); return; } 
            const protectedSections = ['home-section', 'my-contests-section', 'wallet-section', 'earnings-section', 'profile-section', 'tournaments-section', 'recharge-section', 'leaderboard-section', 'support-report-section', 'game-topup-section']; 
            const isLoggedIn = !!currentUser; 
            if (protectedSections.includes(sectionId) && !isLoggedIn) { showSection('login-section'); return; } 
            if (sectionId === 'login-section' && isLoggedIn) { showSection('home-section'); return; } 
            
            // Manage navigation stack
            if (!isBackAction) {
                if (navigationStack[navigationStack.length - 1] !== sectionId) {
                    navigationStack.push(sectionId);
                }
            }
            history.pushState({section: sectionId}, sectionId, `#${sectionId}`);


            elements.sections.forEach(sec => sec.classList.remove('active')); 
            targetSection.classList.add('active'); 
            currentSectionId = sectionId; 
            updateHeaderForSection(sectionId); 
            elements.bottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.section === sectionId)); 
            
            // Load data for the section
            switch (sectionId) { 
                case 'home-section': loadHomePageData(); break; 
                case 'my-contests-section': loadMyContests(); break; 
                case 'wallet-section': loadWalletData(); break; 
                case 'profile-section': loadProfileData(); break; 
                case 'earnings-section': loadEarningsData(); break; 
                case 'leaderboard-section': loadLeaderboardData(); break; 
                case 'recharge-section': break; 
                case 'support-report-section': loadUserSupportReports(); break;
                case 'game-topup-section': loadGameTopupOptions(); loadUserGameTopupOrders(); break;
                case 'tournaments-section': 
                    if(currentTournamentGameId) { 
                        const activeTab = querySel('.tournament-tabs .tab-item.active')?.dataset.status || 'upcoming'; 
                        filterTournaments(currentTournamentGameId, activeTab); 
                    } else { 
                        elements.tournamentsListContainer.innerHTML = '<p class="text-secondary text-center mt-4">Select a game from Home page first.</p>'; 
                    } 
                    break; 
            } 
            if (sectionId === 'login-section') { 
                toggleAuthForm('login'); 
                navigationStack = ['login-section']; // Reset stack on logout/login page
            } 
            window.scrollTo(0, 0); 
        }

        function updateHeaderForSection(sectionId) { 
            const isSubPage = (sectionId === 'tournaments-section' || sectionId === 'recharge-section' || sectionId === 'earnings-section' || sectionId === 'support-report-section' || sectionId === 'game-topup-section');
            const defaultTitleVisible = !isSubPage; 
            let gameTitleVisible = (sectionId === 'tournaments-section'); 
            let pageTitle = '';

            if (isSubPage) {
                switch(sectionId) {
                    case 'tournaments-section':
                        pageTitle = appSettings?.games?.[currentTournamentGameId]?.name || `Tournaments`;
                        break;
                    case 'recharge-section':
                        pageTitle = 'Recharge';
                        break;
                    case 'earnings-section':
                        pageTitle = 'Earnings History';
                        break;
                    case 'support-report-section':
                        pageTitle = 'Support ticket';
                        break;
                    case 'game-topup-section':
                        pageTitle = 'Free Fire top-up';
                        break;
                }
            }

            if (elements.headerBackBtn) { 
                elements.headerBackBtn.style.display = isSubPage ? 'inline-block' : 'none'; 
            } 
            if (elements.headerTitleContainer) elements.headerTitleContainer.style.display = defaultTitleVisible ? 'flex' : 'none'; 
            if (elements.headerGameTitle) {
                elements.headerGameTitle.style.display = isSubPage ? 'block' : 'none';
                if(isSubPage) elements.headerGameTitle.textContent = pageTitle;
            }
            
            if (defaultTitleVisible && elements.headerUserGreeting) { 
                const nameToShow = userProfile?.displayName?.split(' ')[0] || (currentUser ? currentUser.email?.split('@')[0] : 'Guest') || 'Guest'; 
                elements.headerUserGreeting.textContent = nameToShow; 
            } 
        }
        // MODIFICATION END

         function updateGlobalUI(isLoggedIn) { if (elements.headerWalletChip) { elements.headerWalletChip.style.display = isLoggedIn ? 'flex' : 'none'; if (isLoggedIn) elements.headerWalletChip.onclick = () => showSection('wallet-section'); else elements.headerWalletChip.onclick = null; } if (!isLoggedIn && elements.headerUserGreeting) elements.headerUserGreeting.textContent = 'Guest'; if (!isLoggedIn && elements.headerChipBalance) elements.headerChipBalance.textContent = '0'; elements.bottomNavItems.forEach(item => { const section = item.dataset.section; item.style.display = (section === 'home-section' || isLoggedIn) ? 'flex' : 'none'; }); }
         function populateUserInfo(user, profile) { if (!user || !profile) return; const displayName = profile.displayName || user.email?.split('@')[0] || 'User'; const photoURL = profile.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=E2E8F0&bold=true&size=70`; const balance = (profile.balance || 0); const winningCash = (profile.winningCash || 0); const bonusCash = (profile.bonusCash || 0); const totalEarnings = (profile.totalEarnings || 0); const referralEarnings = (profile.referralEarnings || 0); const totalMatches = profile.totalMatches || 0; const wonMatches = profile.wonMatches || 0; const formatCurrency = (amount) => `रु ${amount.toFixed(2)}`; if (elements.headerUserGreeting) elements.headerUserGreeting.textContent = displayName.split(' ')[0]; if (elements.headerChipBalance) elements.headerChipBalance.textContent = Math.floor(balance); if (elements.walletTotalBalance) { elements.walletTotalBalance.textContent = formatCurrency(balance); removePlaceholders(elements.walletTotalBalance.closest('.placeholder-glow')); } if (elements.walletWinningCash) { elements.walletWinningCash.textContent = formatCurrency(winningCash); removePlaceholders(elements.walletWinningCash.closest('.placeholder-glow')); } if (elements.walletBonusCash) { elements.walletBonusCash.textContent = formatCurrency(bonusCash); removePlaceholders(elements.walletBonusCash.closest('.placeholder-glow')); } if (elements.withdrawModalBalance) elements.withdrawModalBalance.textContent = formatCurrency(winningCash); if (elements.rechargeBalanceDisplay) elements.rechargeBalanceDisplay.textContent = balance.toFixed(2); if (elements.profileAvatar) elements.profileAvatar.src = photoURL; if (elements.profileName) { elements.profileName.textContent = displayName; removePlaceholders(elements.profileName.closest('.placeholder-glow')); } if (elements.profileEmail) { elements.profileEmail.textContent = user.email || user.phoneNumber || 'N/A'; removePlaceholders(elements.profileEmail.closest('.placeholder-glow')); } if (elements.profileTotalMatches) { elements.profileTotalMatches.textContent = totalMatches; removePlaceholders(elements.profileTotalMatches.closest('.placeholder-glow')); } if (elements.profileWonMatches) { elements.profileWonMatches.textContent = wonMatches; removePlaceholders(elements.profileWonMatches.closest('.placeholder-glow')); } if (elements.profileTotalEarnings) { elements.profileTotalEarnings.textContent = formatCurrency(profile.totalEarnings || 0); removePlaceholders(elements.profileTotalEarnings.closest('.placeholder-glow')); } if (elements.earningsTotal) { elements.earningsTotal.textContent = formatCurrency(totalEarnings); removePlaceholders(elements.earningsTotal.closest('.placeholder-glow')); } if (elements.earningsReferral) { elements.earningsReferral.textContent = formatCurrency(referralEarnings); removePlaceholders(elements.earningsReferral.closest('.placeholder-glow')); } if (elements.modalUserEmail) elements.modalUserEmail.textContent = user.email || 'N/A'; }
        
        function toggleAuthForm(formToShow) {
            ['login', 'signup', 'otp'].forEach(form => {
                const formEl = getElement(form === 'login' ? 'emailLoginForm' : (form === 'signup' ? 'emailSignupForm' : 'phoneOtpForm'));
                if (formEl) formEl.style.display = 'none';
            });
            clearStatusMessage(elements.loginStatusMessage);
            clearStatusMessage(elements.signupStatusMessage);
            clearStatusMessage(elements.phoneOtpStatusMessage);

            if (formToShow === 'login') {
                elements.emailLoginForm.style.display = 'block';
            } else if (formToShow === 'signup') {
                elements.emailSignupForm.style.display = 'block';
            } else if (formToShow === 'otp') {
                elements.phoneOtpForm.style.display = 'block';
            }
        }
        
        async function signUpWithEmail() { 
            if (!auth) return; 
            const name = elements.signupNameInput.value.trim(); 
            const em = elements.signupEmailInput.value.trim(); 
            const ph = elements.signupPhoneInput.value.trim();
            const pw = elements.signupPasswordInput.value; 
            const cpw = elements.signupConfirmPasswordInput.value;
            
            if (!name || !em || !pw || !ph) { showStatusMessage(elements.signupStatusMessage, 'Name, Email, Phone, and Password are required.', 'warning'); return; } 
            if (pw.length < 6) { showStatusMessage(elements.signupStatusMessage, 'Password must be at least 6 characters.', 'warning'); return; } 
            if (pw !== cpw) { showStatusMessage(elements.signupStatusMessage, 'Passwords do not match.', 'warning'); return; }
            
            showLoader(true); 
            clearStatusMessage(elements.signupStatusMessage); 
            
            try { 
                tempReferralCode = elements.signupReferralCodeInput.value.trim(); 
                const cred = await createUserWithEmailAndPassword(auth, em, pw); 
                await update(ref(db, `users/${cred.user.uid}`), { displayName: name, phoneNumber: ph }); 
            } catch (e) { 
                console.error("Signup Error:", e); 
                let m = `Signup failed.`; 
                switch (e.code) { 
                    case 'auth/email-already-in-use': m = 'Email already registered.'; break; 
                    case 'auth/weak-password': m = 'Password too weak.'; break; 
                    case 'auth/invalid-email': m = 'Invalid email.'; break; 
                    case 'auth/network-request-failed': m = 'Network error.'; break; 
                    default: m = `Error: ${e.message}`; 
                } 
                showStatusMessage(elements.signupStatusMessage, m, 'danger'); 
            } finally { 
                showLoader(false); 
            } 
        }

        async function loginWithEmail() { if (!auth) return; const em = elements.loginEmailInput.value.trim(); const pw = elements.loginPasswordInput.value; if (!em || !pw) { showStatusMessage(elements.loginStatusMessage, 'Enter email & password.', 'warning'); return; } showLoader(true); clearStatusMessage(elements.loginStatusMessage); try { await signInWithEmailAndPassword(auth, em, pw); } catch (e) { console.error("Login Error:", e); let m = `Login failed.`; switch (e.code) { case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': m = 'Invalid email or password.'; break; case 'auth/invalid-email': m = 'Invalid email format.'; break; case 'auth/too-many-requests': m = 'Too many attempts. Reset pass or wait.'; break; case 'auth/network-request-failed': m = 'Network error.'; break; case 'auth/user-disabled': m = 'Account disabled.'; break; default: m = `Error: ${e.message}`; } showStatusMessage(elements.loginStatusMessage, m, 'danger'); } finally { showLoader(false); } }
        async function resetPassword() { if (!auth) return; const em = prompt("Please enter your email address to receive a password reset link."); if (!em) { return; } showLoader(true); try { await sendPasswordResetEmail(auth, em); alert('Password reset email sent! Check your inbox/spam folder.'); } catch (e) { console.error("Reset Pass Error:", e); let m = `Failed to send email.`; switch (e.code) { case 'auth/user-not-found': case 'auth/invalid-email': m = 'Email not found.'; break; case 'auth/network-request-failed': m = 'Network error.'; break; default: m = `Error: ${e.message}`; } alert(m); } finally { showLoader(false); } }
        async function logoutUser() { if (!auth) return; try { showLoader(true); await signOut(auth); } catch (e) { console.error("Sign Out Error:", e); alert(`Logout failed: ${e.message}`); showLoader(false); } }
        async function signInWithGoogle() { if (!auth) return; showLoader(true); try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); } catch (e) { console.error("Google Sign In Error:", e); alert(`Google Sign-In failed: ${e.message}`); } finally { showLoader(false); } }
        
        async function signInWithPhone() {
            if (!auth) return;
            const phoneNumber = prompt("Please enter your phone number with country code (e.g., +97798...):");
            if (!phoneNumber) return;

            showLoader(true);
            clearStatusMessage(elements.loginStatusMessage);
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
                const provider = new PhoneAuthProvider(auth);
                phoneVerification.confirmationResult = await provider.verifyPhoneNumber(phoneNumber, window.recaptchaVerifier);
                phoneVerification.phoneNumber = phoneNumber;
                
                elements.phoneOtpNumberDisplay.textContent = phoneNumber;
                toggleAuthForm('otp');
            } catch (error) {
                console.error("Phone Auth Error:", error);
                showStatusMessage(elements.loginStatusMessage, `Error sending OTP: ${error.message}`, 'danger', false);
            } finally {
                showLoader(false);
            }
        }

        async function verifyOtp() {
            const code = elements.phoneOtpInput.value.trim();
            if (!code || !phoneVerification.confirmationResult) return;

            showLoader(true);
            clearStatusMessage(elements.phoneOtpStatusMessage);
            try {
                await phoneVerification.confirmationResult.confirm(code);
            } catch (error) {
                console.error("OTP Verification Error:", error);
                showStatusMessage(elements.phoneOtpStatusMessage, "Invalid OTP. Please try again.", 'danger');
            } finally {
                showLoader(false);
            }
        }

        async function handleAuthStateChange(user) {
             if (!auth || !db) { showLoader(false); return; }
             showLoader(true);
             stopTopupMonitoring(); stopGameTopupMonitoring(); currentTopupSessionId = null; detachAllDbListeners(); currentUser = user;
             const referralCodeFromSignup = tempReferralCode; tempReferralCode = null;
             
             if (user) {
                 const userRef = ref(db, 'users/' + user.uid);
                 try {
                     const snapshot = await get(userRef);
                     if (snapshot.exists()) {
                         userProfile = snapshot.val();
                         await update(userRef, { lastLogin: serverTimestamp() });
                     } else {
                         console.log("New user detected, creating profile...");
                         const displayName = user.displayName || elements.signupNameInput.value.trim() || user.email?.split('@')[0] || `User${user.uid.substring(0,5)}`;
                         
                         const initializedProfile = await apiRequest('/api/profile/initialize', {
                             method: 'POST',
                             body: JSON.stringify({
                                 profile: {
                                     displayName,
                                     phoneNumber: user.phoneNumber || elements.signupPhoneInput.value.trim() || '',
                                     referralCode: referralCodeFromSignup || ''
                                 }
                             })
                         });
                         userProfile = initializedProfile.profile;
                     }
                     populateUserInfo(user, userProfile); setupRealtimeListeners(user.uid); updateGlobalUI(true);
                     loadAndDisplayNotifications();
                     
                     navigationStack = ['home-section']; // Reset navigation for new session
                     showSection('home-section');

                 } catch (error) { console.error("Profile handling error:", error); alert("Error loading profile. Logging out. " + error.message); try { await logoutUser(); } catch (logoutErr) {} }
             } else { console.log("Auth State: Logged Out"); currentUser = null; userProfile = {}; updateGlobalUI(false); showSection('login-section'); }
             showLoader(false);
        }

        // MODIFICATION START: Admin se theme control karne ke liye function
        function applyTheme(theme) {
            // ADMIN NOTE: Firebase DB ke /settings/theme mein CSS variables set karein
            // Example: { "accent-color": "#ff5733", "primary-bg": "#111111" }
            if (!theme) return;
            const root = document.documentElement;
            for (const [key, value] of Object.entries(theme)) {
                if (value) {
                    root.style.setProperty(`--${key}`, value);
                }
            }
        }
        // MODIFICATION END

        async function loadAppSettings() {
            console.log("Loading App Settings...");
            try {
                const settingsRef = ref(db, 'settings');
                const snapshot = await get(settingsRef);
                if (snapshot.exists()) {
                    appSettings = snapshot.val() || {};
                    if (appSettings.logoUrl && elements.appLogo) elements.appLogo.src = appSettings.logoUrl;
                    
                    // ADMIN NOTE: Control splash screen logo from /settings/splashLogoUrl in Firebase.
                    if (appSettings.splashLogoUrl && elements.splashLogo) {
                    }

                    if (appSettings.minWithdraw && elements.minWithdrawAmount) elements.minWithdrawAmount.textContent = appSettings.minWithdraw;
                    
                    if (appSettings.theme) {
                        console.log("Applying theme from admin settings...");
                        applyTheme(appSettings.theme);
                    }
                    
                    // MODIFICATION START: App update popup ka logic
                    // ADMIN NOTE: App update dikhane ke liye, Firebase DB mein /settings/appUpdate/isUpdateAvailable ko true karein.
                    // Update ke baad isko false kar dein taaki popup hat jaaye.
                    if (appSettings.appUpdate && appSettings.appUpdate.isUpdateAvailable) {
                        elements.appUpdateMessage.innerHTML = appSettings.appUpdate.updateMessage || 'A new version is available. Please update.';
                        elements.appUpdateLink.href = appSettings.appUpdate.updateUrl || '#';
                        if (!elements.appUpdateModalInstance._isShown) {
                           elements.appUpdateModalInstance.show();
                        }
                    } else {
                         if (elements.appUpdateModalInstance._isShown) {
                           elements.appUpdateModalInstance.hide();
                        }
                    }
                    // MODIFICATION END

                } else {
                    console.warn("App Settings not found in database! Using defaults.");
                    appSettings = { 
                        minWithdraw: 50, 
                        signupBonus: 10, 
                        referralBonus: 5, 
                        supportContact: '9389660753', 
                        developerContact: '9848988740',
                    };
                }
            } catch (e) {
                console.error("Settings load failed", e);
            }
        }
        
        function loadHomePageData() { console.log("Loading Home Page Data..."); if (!currentUser) { if(elements.promotionSlider?.querySelector('.swiper-wrapper')) elements.promotionSlider.querySelector('.swiper-wrapper').innerHTML = ''; if(elements.gamesList) elements.gamesList.innerHTML = ''; return; } loadAnnouncement(); loadPromotions(); loadGames(); }
        async function loadAnnouncement() {
            // ADMIN NOTE: Is function ko Firebase ke '/settings/announcementBar' se control kiya jaata hai.
            // Wahan 'isEnabled: true' aur 'text: "Aapka message yahan"' set karein.
            if (!elements.announcementBar) return;
            try {
                if (appSettings.announcementBar && appSettings.announcementBar.isEnabled && appSettings.announcementBar.text) {
                    elements.announcementText.innerHTML = appSettings.announcementBar.text; 
                    elements.announcementBar.style.display = 'flex';
                } else {
                    elements.announcementBar.style.display = 'none';
                }
            } catch (e) {
                console.error("Failed to process announcement:", e);
                elements.announcementBar.style.display = 'none';
            }
        }

        async function loadPromotions() { console.log("Loading Promotions..."); if (!elements.promotionSlider) return; const sliderWrapper = elements.promotionSlider.querySelector('.swiper-wrapper'); if (!sliderWrapper) return; sliderWrapper.classList.add('placeholder-glow'); sliderWrapper.innerHTML = `<div class="swiper-slide"><span class="placeholder" style="height: 100%; border-radius: 10px; display: block; width: 100%;"></span></div>`; const promoRef = ref(db, 'promotions'); try { const snapshot = await get(promoRef); const promotions = snapshot.val() || {}; const activePromotions = Object.values(promotions).filter(p => p.imageUrl); removePlaceholders(elements.promotionSlider); sliderWrapper.innerHTML = ''; if (activePromotions.length > 0) { elements.promotionSlider.style.display = 'block'; activePromotions.forEach(promo => { const slide = document.createElement('div'); slide.className = 'swiper-slide'; slide.innerHTML = promo.link ? `<a href="${promo.link}" target="_blank"><img src="${promo.imageUrl}" alt="Promo"></a>` : `<img src="${promo.imageUrl}" alt="Promo">`; sliderWrapper.appendChild(slide); }); if (swiperInstance) swiperInstance.destroy(true, true); swiperInstance = new Swiper(elements.promotionSlider, { loop: activePromotions.length > 1, autoplay: { delay: 3500, disableOnInteraction: false }, pagination: { el: '.swiper-pagination', clickable: true }, slidesPerView: 1 }); } else { elements.promotionSlider.style.display = 'none'; } } catch (e) { console.error("Promo load failed:", e); removePlaceholders(elements.promotionSlider); sliderWrapper.innerHTML = '<p class="text-danger text-center small p-3">Could not load promotions.</p>'; elements.promotionSlider.style.display = 'block'; } }
        async function loadGames() { console.log("Loading Games..."); if (!elements.gamesList) return; elements.gamesList.classList.add('placeholder-glow'); elements.gamesList.innerHTML = `<div class="col-4"><div class="game-card custom-card"><span class="placeholder d-block" style="height: 100px;"></span><span class="placeholder d-block mt-2 col-8 mx-auto" style="height: 18px;"></span></div></div>`.repeat(3); const gamesRef = ref(db, 'games'); try { const snapshot = await get(gamesRef); const games = snapshot.val() || {}; const activeGames = Object.entries(games).filter(([, game]) => game.imageUrl && game.name).sort(([, gameA], [, gameB]) => (gameA.order || 0) - (gameB.order || 0)); removePlaceholders(elements.gamesList); elements.gamesList.innerHTML = ''; if (activeGames.length > 0) { if (!appSettings.games) appSettings.games = {}; activeGames.forEach(([gameId, game]) => { appSettings.games[gameId] = { name: game.name }; const col = document.createElement('div'); col.className = 'col-4'; col.innerHTML = `<div class="game-card custom-card" data-game-id="${gameId}" data-game-name="${game.name}"><img src="${game.imageUrl}" alt="${game.name}"><span>${game.name}</span></div>`; col.querySelector('.game-card').addEventListener('click', () => { currentTournamentGameId = gameId; loadTournamentsForGame(gameId, game.name); }); elements.gamesList.appendChild(col); }); } else { elements.gamesList.innerHTML = '<p class="text-secondary text-center col-12">No games available.</p>'; } } catch (e) { console.error("Games load failed:", e); removePlaceholders(elements.gamesList); elements.gamesList.innerHTML = '<p class="text-danger text-center col-12">Could not load games.</p>'; } }
        function loadTournamentsForGame(gameId, gameName) { if (!elements.tournamentsSection) return; currentTournamentGameId = gameId; elements.tournamentTabs.forEach(t => t.classList.remove('active')); querySel('.tournament-tabs .tab-item[data-status="upcoming"]')?.classList.add('active'); showSection('tournaments-section'); filterTournaments(gameId, 'upcoming'); }
        async function filterTournaments(gameId, status) { if (!elements.tournamentsListContainer) return; elements.tournamentsListContainer.innerHTML = ''; elements.tournamentsListContainer.classList.add('placeholder-glow'); elements.tournamentsListContainer.innerHTML = `<div class="tournament-card placeholder-glow mb-3"><div class="tournament-card-content"><span class="placeholder col-6"></span><span class="placeholder col-12 mt-2"></span><span class="placeholder col-10 mt-2"></span><div class="d-flex justify-content-between mt-3"><span class="placeholder col-4 h-30"></span><span class="placeholder col-4 h-30"></span></div></div></div>`; elements.noTournamentsMessage.style.display = 'none'; try { const tQuery = query(ref(db, 'tournaments'), orderByChild('gameId'), equalTo(gameId)); const s = await get(tQuery); const allT = s.val() || {}; const fT = Object.entries(allT).filter(([, t]) => t.status === status).sort(([, tA], [, tB]) => (tA.startTime || 0) - (tB.startTime || 0)); removePlaceholders(elements.tournamentsListContainer); elements.tournamentsListContainer.innerHTML = ''; if (fT.length > 0) { fT.forEach(([tId, t]) => { const card = createTournamentCardElement(tId, t); elements.tournamentsListContainer.appendChild(card); }); } else { elements.noTournamentsMessage.style.display = 'block'; elements.noTournamentsMessage.textContent = `No ${status} tournaments found.`; } } catch (e) { console.error(`Tournaments filter failed (${status}):`, e); removePlaceholders(elements.tournamentsListContainer); elements.tournamentsListContainer.innerHTML = '<p class="text-danger tc mt-4">Could not load tournaments.</p>'; elements.noTournamentsMessage.style.display = 'none'; } }
        function createTournamentCardElement(tId, t) {
            const card = document.createElement('div');
            card.className = 'tournament-card';
            card.dataset.tournamentId = tId;
            card.dataset.status = t.status || 'unknown';
        
            const bannerUrl = t.bannerUrl || 'https://via.placeholder.com/400x225/1E293B/94A3B8?text=16:9+Banner';
            const eFee = t.entryFee || 0; const pkPrize = t.perKillPrize || 0; const pPool = t.prizePool || 0; const sTime = t.startTime ? new Date(t.startTime) : null; const sTimeLoc = sTime ? sTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBA'; const regP = t.registeredPlayers || {}; const regC = Object.keys(regP).length; const maxP = t.maxPlayers || 0; const spotsL = maxP > 0 ? Math.max(0, maxP - regC) : Infinity; const isF = maxP > 0 && spotsL <= 0; const isJ = currentUser && userProfile?.joinedTournaments?.[tId];
            
            // ADMIN NOTE: To enable slot selection for a tournament, set 'slotConfig.type' to 'individual' or 'team' in its Firebase data via admin panel.
            const hasSlots = t.slotConfig && t.slotConfig.type !== 'disabled'; 
            const canJ = !isJ && !isF && t.status === 'upcoming';

            let timerTxt = t.status?.toUpperCase() || 'N/A';
            if (t.status === 'upcoming' && sTime) timerTxt = getTimeRemaining(t.startTime);
            else if (t.status === 'ongoing') timerTxt = 'LIVE';
            else if (t.status === 'completed' || t.status === 'result') timerTxt = 'ENDED';
            
            let spotsTxt = 'Unlimited Spots';
            let progP = 0;
            if (maxP > 0) {
                spotsTxt = `<span class="${spotsL <= 5 ? 'text-danger' : 'text-accent'}">${spotsL}</span> Spots Left (${regC}/${maxP})`;
                progP = Math.min(100, (regC / maxP) * 100);
            }
        
            let joinBtnHtml = '';
            let idPassBtn = '';
            let chatBtnHtml = '';
        
            if (isJ) {
                joinBtnHtml = `<button class="btn btn-custom btn-sm btn-joined" disabled><i class="bi bi-check-circle-fill"></i> Joined</button>`;
                if (t.status === 'ongoing' || (t.status === 'upcoming' && t.showIdPass && sTime && Date.now() > sTime.getTime() - 900000)) {
                    idPassBtn = `<button class="btn btn-custom btn-idpass w-100 mt-2 btn-sm" data-tournament-id="${tId}"><i class="bi bi-key-fill"></i> View ID & Pass</button>`;
                }
                if(t.status === 'ongoing' || t.status === 'upcoming') {
                    chatBtnHtml = `<button class="btn btn-custom btn-custom-secondary btn-sm btn-chat" data-tournament-id="${tId}" data-tournament-name="${t.name || 'Tournament'}"><i class="bi bi-chat-dots-fill"></i> Chat</button>`
                }
            } else if (canJ) {
                const joinButtonText = hasSlots ? "Select Slot" : `रु ${eFee} Join`;
                const slotConfigString = t.slotConfig ? JSON.stringify(t.slotConfig) : '{}';
                joinBtnHtml = `<button class="btn btn-custom btn-sm btn-custom-accent btn-join" data-tournament-id="${tId}" data-fee="${eFee}" data-mode="${t.mode || 'Solo'}" data-has-slots="${hasSlots}" data-slot-config='${slotConfigString}'>${joinButtonText} <i class="bi bi-arrow-right-short"></i></button>`;
            } else {
                let disR = t.status !== 'upcoming' ? t.status?.toUpperCase() : (isF ? 'Full' : 'Closed');
                joinBtnHtml = `<button class="btn btn-custom btn-sm btn-disabled" disabled>${disR || 'N/A'}</button>`;
            }
        
            card.innerHTML = `
                <img src="${bannerUrl}" alt="Tournament Banner" class="tournament-banner-image">
                <div class="tournament-card-content">
                    <div class="tournament-card-header">
                        <div class="tournament-card-tags">${t.mode ? `<span>${t.mode}</span>` : ''}${t.map ? `<span>${t.map}</span>` : ''}${t.tags ? (Array.isArray(t.tags) ? t.tags.map(tag => `<span>${tag}</span>`).join('') : Object.values(t.tags).map(tag => `<span>${tag}</span>`).join('')) : ''}</div>
                        <div class="tournament-card-timer" ${t.startTime ? `data-starttime="${t.startTime}"` : ''}>${timerTxt}</div>
                    </div>
                    <h3 class="tournament-card-title">${t.icon ? `<i class="${t.icon}"></i>` : '<i class="bi bi-joystick text-accent"></i>'} ${t.name || 'Tournament'}</h3>
                    <p class="small text-secondary mb-2"><i class="bi bi-calendar-event"></i> ${sTimeLoc}</p>
                    <div class="tournament-card-info">
                        <div class="info-item"><span>Prize Pool</span><strong><i class="bi bi-trophy-fill text-accent prize-icon"></i> रु ${pPool}</strong></div>
                        <div class="info-item"><span>Per Kill</span><strong>रु ${pkPrize}</strong></div>
                        <div class="info-item"><span>Entry Fee</span><strong class="${eFee > 0 ? 'text-info' : ''}">${eFee > 0 ? `रु ${eFee}` : 'Free'}</strong></div>
                    </div>
                    <div class="tournament-card-spots">${spotsTxt}${maxP > 0 ? `<div class="progress mt-1" style="height: 6px;"><div class="progress-bar bg-warning" role="progressbar" style="width: ${progP}%"></div></div>` : ''}</div>
                    <div class="tournament-card-actions">
                        <button class="btn btn-custom btn-custom-secondary btn-sm btn-details" data-tournament-id="${tId}">Details</button>
                        ${chatBtnHtml}
                        ${joinBtnHtml}
                    </div>
                    ${idPassBtn}
                </div>`;
        
            const jBtn = card.querySelector('.btn-join'); if (jBtn) jBtn.addEventListener('click', handleJoinTournamentClick);
            const dBtn = card.querySelector('.btn-details'); if (dBtn) dBtn.addEventListener('click', handleMatchDetailsClick);
            const ipBtn = card.querySelector('.btn-idpass'); if (ipBtn) ipBtn.addEventListener('click', handleIdPasswordClick);
            const cBtn = card.querySelector('.btn-chat'); if (cBtn) cBtn.addEventListener('click', (e) => openTournamentChat(e.currentTarget.dataset.tournamentId, e.currentTarget.dataset.tournamentName));
            return card;
        }

        async function loadMyContests() { if (!currentUser || !elements.myContestsList) { if(elements.myContestsList) removePlaceholders(elements.myContestsList); if(elements.myContestsList) elements.myContestsList.innerHTML = ''; if (elements.noContestsMessage) elements.noContestsMessage.style.display = 'block'; return; } const joinedIds = Object.keys(userProfile.joinedTournaments || {}); elements.myContestsList.classList.add('placeholder-glow'); elements.myContestsList.innerHTML = `<div class="tournament-card placeholder-glow mb-3"><div class="tournament-card-content"><span class="placeholder col-6"></span><span class="placeholder col-12 mt-2"></span><span class="placeholder col-10 mt-2"></span><div class="d-flex justify-content-between mt-3"><span class="placeholder col-4 h-30"></span><span class="placeholder col-4 h-30"></span></div></div></div>`; if (elements.noContestsMessage) elements.noContestsMessage.style.display = 'none'; if (joinedIds.length === 0) { removePlaceholders(elements.myContestsList); elements.myContestsList.innerHTML = ''; if (elements.noContestsMessage) elements.noContestsMessage.style.display = 'block'; return; } try { const contestPromises = joinedIds.map(id => get(ref(db, `tournaments/${id}`))); const snapshots = await Promise.all(contestPromises); removePlaceholders(elements.myContestsList); elements.myContestsList.innerHTML = ''; const contestCards = []; snapshots.forEach((snapshot, index) => { if (snapshot.exists()) { const t = snapshot.val(); if (t.status === 'upcoming' || t.status === 'ongoing') { const tId = joinedIds[index]; contestCards.push({ startTime: t.startTime || 0, card: createTournamentCardElement(tId, t) }); } } }); contestCards.sort((a, b) => a.startTime - b.startTime); if (contestCards.length > 0) { contestCards.forEach(item => elements.myContestsList.appendChild(item.card)); } else if (elements.noContestsMessage) { elements.noContestsMessage.style.display = 'block'; elements.noContestsMessage.textContent = "No upcoming/ongoing joined contests."; } } catch (e) { console.error("My contests load failed:", e); removePlaceholders(elements.myContestsList); elements.myContestsList.innerHTML = '<p class="text-danger tc">Could not load contests.</p>'; } }
        function loadWalletData() { if (!currentUser) return; loadRecentTransactions(); }
        function loadProfileData() { if (!currentUser) return; if (userProfile?.displayName) { removePlaceholders(elements.profileName?.closest('.placeholder-glow')); removePlaceholders(elements.profileEmail?.closest('.placeholder-glow')); removePlaceholders(elements.profileTotalMatches?.closest('.placeholder-glow')); removePlaceholders(elements.profileWonMatches?.closest('.placeholder-glow')); removePlaceholders(elements.profileTotalEarnings?.closest('.placeholder-glow')); } }
        function loadEarningsData() { if (!currentUser) return; if (typeof userProfile?.totalEarnings !== 'undefined') removePlaceholders(elements.earningsTotal?.closest('.placeholder-glow')); if (typeof userProfile?.referralEarnings !== 'undefined') removePlaceholders(elements.earningsReferral?.closest('.placeholder-glow')); }
        
        async function loadLeaderboardData() {
            if (!currentUser) return;
            const listEl = elements.leaderboardListEl;
            const emptyMsgEl = elements.noLeaderboardMessageEl;
            listEl.innerHTML = `<div class="leaderboard-item placeholder-glow mb-2">...</div>`.repeat(5);
            emptyMsgEl.style.display = 'none';

            try {
                const response = await apiRequest('/api/leaderboard');
                const leaderboardData = response.leaderboard || [];

                removePlaceholders(listEl);
                listEl.innerHTML = '';
                
                if (leaderboardData.length === 0) {
                    emptyMsgEl.style.display = 'block';
                    return;
                }
                leaderboardData.sort((a, b) => a.leaderboardRank - b.leaderboardRank);

                if (leaderboardData.length === 0) {
                    emptyMsgEl.style.display = 'block';
                    return;
                }

                leaderboardData.forEach(user => {
                    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                    const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1E293B&color=E2E8F0&bold=true&size=45`;
                    const displayEarnings = user.leaderboardDisplayEarnings || 0; 
                    
                    const itemEl = document.createElement('div');
                    itemEl.className = 'leaderboard-item';
                    const rankEl = document.createElement('div');
                    rankEl.className = 'leaderboard-rank';
                    rankEl.textContent = `#${user.leaderboardRank}`;
                    const avatarEl = document.createElement('img');
                    avatarEl.src = photoURL;
                    avatarEl.alt = displayName;
                    avatarEl.className = 'leaderboard-avatar';
                    const infoEl = document.createElement('div');
                    infoEl.className = 'leaderboard-user-info';
                    const nameEl = document.createElement('div');
                    nameEl.className = 'leaderboard-name';
                    nameEl.textContent = displayName;
                    infoEl.appendChild(nameEl);
                    const earningsEl = document.createElement('div');
                    earningsEl.className = 'leaderboard-earnings';
                    earningsEl.textContent = `रु ${Number(displayEarnings).toLocaleString('en-NP')}`;
                    itemEl.append(rankEl, avatarEl, infoEl, earningsEl);
                    listEl.appendChild(itemEl);
                });

            } catch(error) {
                 console.error("Error loading leaderboard:", error);
                 listEl.innerHTML = `<p class="text-center text-danger">Could not load leaderboard. ${error.message}</p>`;
            }
        }
        
        async function loadRecentTransactions() { if (!currentUser || !elements.recentTransactionsList) return; const limit = 5; elements.recentTransactionsList.innerHTML = ''; elements.recentTransactionsList.classList.add('placeholder-glow'); for (let i = 0; i < 3; i++) elements.recentTransactionsList.innerHTML += `<div class="custom-card p-2 mb-2 placeholder-glow"><div class="d-flex justify-content-between"><span class="placeholder col-5 h-16"></span><span class="placeholder col-3 h-16"></span></div><div class="small text-secondary mt-1"><span class="placeholder col-6 h-14"></span></div></div>`; if (elements.noTransactionsMessage) { elements.noTransactionsMessage.style.display = 'block'; elements.noTransactionsMessage.textContent = 'Loading transactions...'; } try { const transRef = query(ref(db, `transactions/${currentUser.uid}`), limitToLast(limit)); const s = await get(transRef); const transactions = s.val() || {}; const sortedT = Object.values(transactions).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); removePlaceholders(elements.recentTransactionsList); elements.recentTransactionsList.innerHTML = ''; if (sortedT.length > 0) { if (elements.noTransactionsMessage) elements.noTransactionsMessage.style.display = 'none'; sortedT.forEach(t => { const item = document.createElement('div'); item.className = 'custom-card p-2 mb-2 d-flex justify-content-between align-items-center'; const isCr = t.amount > 0; const amt = `${isCr ? '+' : ''}रु ${Math.abs(t.amount || 0).toFixed(2)}`; const time = t.timestamp ? new Date(t.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'; item.innerHTML = `<div><div class="small fw-bold">${t.description || t.type || 'Txn'}</div><div class="small text-secondary">${time}</div></div><div class="fw-bold ${isCr ? 'text-success' : 'text-danger'}">${amt}</div>`; elements.recentTransactionsList.appendChild(item); }); } else if (elements.noTransactionsMessage) { elements.noTransactionsMessage.style.display = 'block'; elements.noTransactionsMessage.textContent = 'No recent transactions.'; } } catch (e) { console.error("Transactions load failed:", e); removePlaceholders(elements.recentTransactionsList); elements.recentTransactionsList.innerHTML = '<p class="text-danger tc">Could not load transactions.</p>'; if (elements.noTransactionsMessage) elements.noTransactionsMessage.style.display = 'none'; } }
        
        function handleWithdrawClick() {
            if (!currentUser || !elements.withdrawMethodModalInstance) return;
            elements.withdrawMethodModalInstance.show();
        }

        function openWithdrawalModal(method) {
            currentWithdrawData.method = method;
            currentWithdrawData.requestId = null;
            elements.withdrawMethodModalInstance.hide();
            
            const wc = userProfile.winningCash || 0;
            const minW = appSettings?.minWithdraw || 50;
            elements.minWithdrawAmount.textContent = minW;
            elements.withdrawModalBalance.textContent = `रु ${wc.toFixed(2)}`;
            elements.withdrawAmountInput.value = '';
            elements.withdrawAmountInput.min = minW;
            elements.withdrawMethodInput.value = userProfile[method.toLowerCase()] || '';
            elements.withdrawMethodLabel.textContent = `Your ${method} ID`;
            elements.withdrawMethodInput.placeholder = `Enter your ${method} ID`;
            clearStatusMessage(elements.withdrawStatusMessage);
            
            elements.withdrawModalInstance.show();
        }

        async function submitWithdrawRequestHandler() {
            if (!currentUser || !elements.withdrawModalInstance || !currentWithdrawData.method) return;
            const amount = Number(elements.withdrawAmountInput.value);
            const accountInfo = elements.withdrawMethodInput.value.trim();
            const minWithdraw = Number(appSettings?.minWithdraw || 50);
            clearStatusMessage(elements.withdrawStatusMessage);
            if (!Number.isSafeInteger(amount) || amount <= 0) {
                showStatusMessage(elements.withdrawStatusMessage, 'Enter a valid whole NPR amount.', 'warning');
                return;
            }
            if (amount < minWithdraw) {
                showStatusMessage(elements.withdrawStatusMessage, `Minimum withdrawal is रु ${minWithdraw}.`, 'warning');
                return;
            }
            if (amount > Number(userProfile.winningCash || 0)) {
                showStatusMessage(elements.withdrawStatusMessage, 'Insufficient winning balance.', 'warning');
                return;
            }
            if (!accountInfo) {
                showStatusMessage(elements.withdrawStatusMessage, 'Enter withdrawal account details.', 'warning');
                return;
            }

            elements.submitWithdrawRequestBtn.disabled = true;
            elements.submitWithdrawRequestBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
            try {
                if (!currentWithdrawData.requestId) currentWithdrawData.requestId = crypto.randomUUID();
                await apiRequest('/api/wallet/withdraw', {
                    method: 'POST',
                    body: JSON.stringify({
                        requestId: currentWithdrawData.requestId,
                        amountNpr: amount,
                        methodName: currentWithdrawData.method,
                        accountInfo
                    })
                });
                currentWithdrawData.requestId = null;
                showStatusMessage(elements.withdrawStatusMessage, 'Request submitted successfully!', 'success', false);
                setTimeout(() => {
                    if (elements.withdrawModalInstance) elements.withdrawModalInstance.hide();
                }, 2500);
                if (currentSectionId === 'wallet-section') loadRecentTransactions();
            } catch (error) {
                console.error("Withdraw error:", error);
                if (error.code) currentWithdrawData.requestId = null;
                showStatusMessage(elements.withdrawStatusMessage, error.message, 'danger', false);
            } finally {
                elements.submitWithdrawRequestBtn.disabled = false;
                elements.submitWithdrawRequestBtn.innerHTML = 'Submit Request';
            }
        }

        async function handleMatchDetailsClick(event) { if (!elements.matchDetailsModalInstance) return; const tId = event.currentTarget.dataset.tournamentId; if (!tId) return; elements.matchDetailsModalTitle.textContent = 'Loading...'; elements.matchDetailsModalBody.innerHTML = '<div class="tc p-5"><div class="spinner-border spinner-border-sm"></div></div>'; elements.matchDetailsModalInstance.show(); try { const tRef = ref(db, `tournaments/${tId}`); const s = await get(tRef); if (s.exists()) { const t = s.val(); const gName = appSettings.games?.[t.gameId]?.name || t.gameId || 'N/A'; const sTimeLoc = t.startTime ? new Date(t.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short'}) : 'TBA'; let pDistHTML = ''; if (t.prizeDistribution) { let fmtDist = ''; if (typeof t.prizeDistribution === 'object') { fmtDist = Object.entries(t.prizeDistribution).map(([rank, prize]) => `Rank ${rank}: रु ${prize}`).join('\n'); } else { fmtDist = String(t.prizeDistribution).replace(/\\n/g, '\n'); } pDistHTML = `<h5>Prize Distribution:</h5><pre>${fmtDist}</pre>`; } const desc = t.description || 'Standard rules apply.'; const fmtDesc = desc.replace(/\n/g, '<br>'); elements.matchDetailsModalTitle.textContent = t.name || 'Match Details'; elements.matchDetailsModalBody.innerHTML = `<p><strong>Game:</strong> ${gName}</p><p><strong>Mode:</strong> ${t.mode || 'N/A'}</p><p><strong>Map:</strong> ${t.map || 'N/A'}</p><p><strong>Starts:</strong> ${sTimeLoc}</p><hr><p><strong>Entry:</strong> ${t.entryFee > 0 ? `रु ${t.entryFee}` : 'Free'}</p><p><strong>Prize:</strong> रु ${t.prizePool || 0}</p><p><strong>Per Kill:</strong> रु ${t.perKillPrize || 0}</p><p><strong>Max Players:</strong> ${t.maxPlayers > 0 ? t.maxPlayers : 'Unlimited'}</p><hr><h5>Rules:</h5><div style="white-space: pre-wrap; line-height: 1.6;">${fmtDesc}</div>${pDistHTML}`; } else elements.matchDetailsModalBody.innerHTML = '<p class="text-danger">Details not found.</p>'; } catch (e) { console.error("Details load failed:", e); elements.matchDetailsModalBody.innerHTML = '<p class="text-danger">Error loading details.</p>'; } }
        async function handleIdPasswordClick(event) { if (!elements.idPasswordModalInstance) return; const tId = event.currentTarget.dataset.tournamentId; if (!tId) return; if (!currentUser || !userProfile?.joinedTournaments?.[tId]) { alert("Join the tournament first or refresh the page."); return; } elements.roomIdDisplay.innerHTML = '<span class="placeholder col-6"></span>'; elements.roomPasswordDisplay.innerHTML = '<span class="placeholder col-6"></span>'; elements.idPasswordModalInstance.show(); try { const tournamentRef = ref(db, `tournaments/${tId}`); const s = await get(tournamentRef); removePlaceholders(elements.roomIdDisplay.closest('.placeholder-glow')); removePlaceholders(elements.roomPasswordDisplay.closest('.placeholder-glow')); if (s.exists()) { const tournamentData = s.val(); if (tournamentData.showIdPass) { elements.roomIdDisplay.textContent = tournamentData.roomId || 'Not updated yet'; elements.roomPasswordDisplay.textContent = tournamentData.roomPassword || 'Not updated yet'; } else { elements.roomIdDisplay.textContent = 'Hidden by Admin'; elements.roomPasswordDisplay.textContent = 'Hidden by Admin'; } } else { elements.roomIdDisplay.textContent = 'Not Found'; elements.roomPasswordDisplay.textContent = 'Not Found'; } } catch (e) { console.error("ID/Pass fetch error:", e); removePlaceholders(elements.roomIdDisplay.closest('.placeholder-glow')); removePlaceholders(elements.roomPasswordDisplay.closest('.placeholder-glow')); elements.roomIdDisplay.textContent = 'Error'; elements.roomPasswordDisplay.textContent = 'Error'; alert("Error loading ID/Password."); } }
        async function handlePolicyClick(event) { if (!elements.policyModalInstance) return; event.preventDefault(); const target = event.currentTarget; const policyType = target.dataset.policy; if (!policyType) return; let title = '', modalBodyContent = '<div class="text-center p-5"><div class="spinner-border spinner-border-sm"></div></div>'; elements.policyModalBody.innerHTML = modalBodyContent; switch (policyType) { case 'privacy': title = 'Privacy Policy'; modalBodyContent = appSettings.policyPrivacy || 'Content not available.'; break; case 'terms': title = 'Terms and Conditions'; modalBodyContent = appSettings.policyTerms || 'Content not available.'; break; case 'refund': title = 'Refund and Cancellation'; modalBodyContent = appSettings.policyRefund || 'Content not available.'; break; case 'fairPlay': title = 'Fair Play Policy'; modalBodyContent = appSettings.policyFairPlay || 'Content not available.'; break; case 'refer': title = 'Refer & Earn'; if (!currentUser) { alert("Login to view referral."); return; } const refCode = userProfile.referralCode || 'N/A'; const referralBonus = appSettings.referralBonus || 5; modalBodyContent = `<div class="text-center"><h4>Refer Friends!</h4><p class="text-secondary">Share code & earn!</p><div class="my-4 p-3" style="background: var(--primary-bg); border-radius: 8px;"><p class="small text-secondary mb-1">Your Code:</p><h3 class="text-accent referral-code" id="referralCodeDisplay">${refCode}</h3><div class="mt-3"><button class="btn btn-sm btn-custom btn-custom-secondary me-2 copy-btn" data-target="#referralCodeDisplay"><i class="bi bi-clipboard"></i> Copy</button><button class="btn btn-sm btn-custom btn-custom-secondary" id="shareReferralBtn"><i class="bi bi-share-fill"></i> Share</button></div></div><p class="mt-3 small text-secondary">Get रु ${referralBonus} when your friend joins using your code, and they get a signup bonus!</p></div>`; break; default: title = 'Info'; modalBodyContent = '<p>Content unavailable.</p>'; } elements.policyModalTitle.textContent = title; if (typeof modalBodyContent === 'string' && policyType !== 'refer') { elements.policyModalBody.innerHTML = modalBodyContent.replace(/\n/g, '<br>'); } else { elements.policyModalBody.innerHTML = modalBodyContent; } elements.policyModalInstance.show(); }
        function setupRealtimeListeners(uid) { if (!uid || !db || !currentUser) return; detachAllDbListeners(); const uRef = ref(db, `users/${uid}`); const listFunc = onValue(uRef, (s) => { if (currentUser && currentUser.uid === uid) { if (s.exists()) { const oldProfile = userProfile; userProfile = s.val(); populateUserInfo(currentUser, userProfile); if (currentSectionId === 'my-contests-section') loadMyContests(); if (currentSectionId === 'wallet-section') loadRecentTransactions(); if (oldProfile.lastCheckedNotifications !== userProfile.lastCheckedNotifications) { loadAndDisplayNotifications(); } } else { alert("Account data missing or deleted. Logging out."); logoutUser(); } } else { off(uRef, 'value', listFunc); } }, (e) => { console.error("Listener error (user profile):", e); }); dbListeners['userProfile'] = { path: `users/${uid}`, func: listFunc }; }
        function detachAllDbListeners() { for (const k in dbListeners) { try { const { path, func } = dbListeners[k]; if (path && func) { off(ref(db, path), 'value', func); } } catch (e) { console.error(`Detach error ${k}:`, e); } } dbListeners = {}; }
        async function checkSecurityRules() { try { if (!currentUser) { } else if (elements.securityWarning) { elements.securityWarning.style.display = 'none'; } } catch (error) { if (elements.securityWarning) elements.securityWarning.style.display = 'none'; } }
        async function loadUserSupportReports() {
            if (!currentUser || !elements.userSupportReportsList) return;
            elements.userSupportReportsList.textContent = 'Loading your tickets...';
            try {
                const snapshot = await get(ref(db, `supportReports/${currentUser.uid}`));
                const reports = snapshot.exists() ? Object.values(snapshot.val()) : [];
                reports.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
                elements.userSupportReportsList.replaceChildren();
                if (reports.length === 0) {
                    elements.userSupportReportsList.textContent = 'You have not submitted any tickets yet.';
                    return;
                }
                const labels = {
                    user_hacking: 'Account hacked / suspicious activity',
                    payment_not_received: 'Payment not received',
                    mistake: 'Mistake / incorrect result',
                    other: 'Other'
                };
                reports.slice(0, 30).forEach((report) => {
                    const card = document.createElement('div');
                    card.className = 'border-bottom border-secondary py-3';
                    const title = document.createElement('strong');
                    title.textContent = `Ticket ${report.reportId || ''} · ${labels[report.reportType] || 'Support ticket'} · ${String(report.status || 'open').replace(/_/g, ' ')}`;
                    const date = document.createElement('small');
                    date.className = 'd-block text-secondary mt-1';
                    date.textContent = report.createdAt ? new Date(Number(report.createdAt)).toLocaleString() : 'Recently submitted';
                    const description = document.createElement('p');
                    description.className = 'mb-0 mt-2';
                    description.textContent = report.description || '';
                    card.append(title, date, description);
                    elements.userSupportReportsList.append(card);
                });
            } catch (error) {
                console.error('Could not load support tickets:', error);
                elements.userSupportReportsList.textContent = 'Could not load your tickets. Please try again.';
            }
        }

        async function submitSupportReport(event) {
            event.preventDefault();
            if (!currentUser) {
                showSection('login-section');
                return;
            }
            const files = Array.from(elements.supportReportFiles.files || []);
            const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
            if (files.length > 3 || files.some((file) => file.size > 5 * 1024 * 1024 || !allowedTypes.has(file.type))) {
                showStatusMessage(elements.supportReportStatus, 'Attach up to 3 PDF, JPEG, PNG, or WEBP files, each 5 MB or smaller.', 'warning', false);
                return;
            }

            const formData = new FormData();
            formData.append('reportType', elements.supportReportType.value);
            formData.append('description', elements.supportReportDescription.value.trim());
            files.forEach((file) => formData.append('attachments', file));
            elements.submitSupportReportBtn.disabled = true;
            elements.submitSupportReportBtn.textContent = 'Sending...';
            try {
                const token = await currentUser.getIdToken();
                const response = await fetch(`${API_BASE_URL}/api/reports`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const message = response.status === 405
                        ? 'The support API is missing or outdated at this address. Deploy the latest backend and configure window.APP_API_BASE_URL to your backend URL.'
                        : result.error?.message || `Report could not be sent (${response.status}).`;
                    throw new Error(message);
                }
                elements.supportReportForm.reset();
                showStatusMessage(elements.supportReportStatus, 'Your support ticket was sent successfully.', 'success');
                await loadUserSupportReports();
            } catch (error) {
                console.error('Could not submit support ticket:', error);
                showStatusMessage(elements.supportReportStatus, error.message, 'danger', false);
            } finally {
                elements.submitSupportReportBtn.disabled = false;
                elements.submitSupportReportBtn.textContent = 'Send report';
            }
        }

        async function loadGameTopupOptions() {
            elements.gameTopupGame.replaceChildren();
            elements.gameTopupPackage.replaceChildren();
            try {
                const [gamesSnapshot, catalogSnapshot] = await Promise.all([
                    get(ref(db, 'games')),
                    get(ref(db, 'settings/gameTopupCatalog'))
                ]);
                const games = gamesSnapshot.val() || {};
                const catalog = catalogSnapshot.val() || {};
                const availableGames = Object.entries(games).filter(([gameId, game]) =>
                    game?.name && game?.imageUrl && catalog[gameId] && Object.keys(catalog[gameId]).length > 0
                );
                if (!availableGames.length) {
                    elements.gameTopupGame.innerHTML = '<option value="">No game packages available yet</option>';
                    elements.gameTopupPackage.innerHTML = '<option value="">Please check back later</option>';
                    elements.gameTopupGame.disabled = true;
                    elements.gameTopupPackage.disabled = true;
                    showStatusMessage(elements.gameTopupStatus, 'Game top-up packages are not configured yet. Please try again later.', 'info', false);
                    return;
                }
                elements.gameTopupGame.disabled = false;
                clearStatusMessage(elements.gameTopupStatus);
                elements.gameTopupGame.add(new Option('Choose a game', ''));
                availableGames.forEach(([gameId, game]) => {
                    elements.gameTopupGame.add(new Option(game.name, gameId));
                });
                elements.gameTopupGame.onchange = () => renderGameTopupPackages(catalog);
                renderGameTopupPackages(catalog);
            } catch (error) {
                console.error('Could not load game top-up packages:', error);
                elements.gameTopupGame.innerHTML = '<option value="">Could not load games</option>';
                elements.gameTopupPackage.innerHTML = '<option value="">Please retry later</option>';
                showStatusMessage(elements.gameTopupStatus, 'Could not load game packages. Please try again.', 'danger', false);
            }
        }

        function renderGameTopupPackages(catalog) {
            const gameId = elements.gameTopupGame.value;
            const packages = catalog[gameId] || {};
            elements.gameTopupPackage.replaceChildren();
            elements.gameTopupPackage.add(new Option(
                gameId ? 'Choose a package' : 'Choose a game first',
                ''
            ));
            Object.entries(packages).forEach(([packageId, product]) => {
                const price = Number(product.priceNpr);
                const units = Number(product.units);
                if (!product.name || !Number.isSafeInteger(price) || price < 1 || !Number.isSafeInteger(units) || units < 1) return;
                elements.gameTopupPackage.add(new Option(`${product.name} · ${units} · रु ${price}`, packageId));
            });
            elements.gameTopupPackage.disabled = elements.gameTopupPackage.options.length <= 1;
        }

        async function loadUserGameTopupOrders() {
            if (!currentUser || !elements.userGameTopupOrders) return;
            elements.userGameTopupOrders.textContent = 'Loading your orders...';
            try {
                const snapshot = await get(ref(db, `gameTopupOrders/${currentUser.uid}`));
                const orders = snapshot.exists() ? Object.values(snapshot.val()) : [];
                orders.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
                elements.userGameTopupOrders.replaceChildren();
                if (!orders.length) {
                    elements.userGameTopupOrders.textContent = 'You have no game top-up orders yet.';
                    return;
                }
                orders.slice(0, 20).forEach((order) => {
                    const item = document.createElement('div');
                    item.className = 'border-bottom border-secondary py-3';
                    const title = document.createElement('strong');
                    title.textContent = `${order.gameName || 'Game'} · ${order.packageName || 'Top-up'} · रु ${Number(order.priceNpr || 0)}`;
                    const status = document.createElement('small');
                    status.className = 'd-block text-secondary mt-1';
                    status.textContent = `${String(order.status || 'pending').replace(/_/g, ' ')} · Player ID ${order.playerId || ''}`;
                    const date = document.createElement('small');
                    date.className = 'd-block text-secondary';
                    date.textContent = order.createdAt ? new Date(Number(order.createdAt)).toLocaleString() : 'Recently placed';
                    item.append(title, status, date);
                    elements.userGameTopupOrders.append(item);
                });
            } catch (error) {
                console.error('Could not load game top-up orders:', error);
                elements.userGameTopupOrders.textContent = 'Could not load your orders. Please try again.';
            }
        }

        async function submitGameTopup(event) {
            event.preventDefault();
            if (!currentUser) {
                showSection('login-section');
                return;
            }
            if (!elements.gameTopupGame.value || !elements.gameTopupPackage.value) {
                showStatusMessage(elements.gameTopupStatus, 'Choose a game and top-up package.', 'warning', false);
                return;
            }
            elements.submitGameTopupBtn.disabled = true;
            elements.submitGameTopupBtn.textContent = 'Preparing checkout...';
            try {
                const session = await apiRequest('/api/game-topups', {
                    method: 'POST',
                    body: JSON.stringify({
                        gameId: elements.gameTopupGame.value,
                        packageId: elements.gameTopupPackage.value,
                        playerId: elements.gameTopupPlayerId.value.trim(),
                        serverId: elements.gameTopupServerId.value.trim()
                    })
                });
                currentGameTopupSessionId = session.sessionId;
                if (!window.PayBridgeNP?.openSession?.(session.checkoutUrl)) {
                    throw new Error('Embedded PayBridgeNP checkout is unavailable. Check the checkout script and allowed app origin.');
                }
                showStatusMessage(elements.gameTopupStatus, 'Complete payment in the checkout overlay. Your order will update after server verification.', 'info', false);
                pollGameTopupVerification(session.sessionId);
            } catch (error) {
                console.error('Could not start game top-up:', error);
                const message = error.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED'
                    ? 'Secure game top-up checkout is not configured yet. No payment was taken.'
                    : error.message;
                showStatusMessage(elements.gameTopupStatus, message, 'danger', false);
            } finally {
                elements.submitGameTopupBtn.disabled = false;
                elements.submitGameTopupBtn.textContent = 'Pay securely';
            }
        }

        async function pollGameTopupVerification(sessionId) {
            if (currentGameTopupSessionId !== sessionId) return;
            try {
                const result = await apiRequest(`/api/game-topups/${encodeURIComponent(sessionId)}/verify`);
                if (result.status === 'awaiting_fulfillment' || result.status === 'fulfilled') {
                    showStatusMessage(elements.gameTopupStatus, result.status === 'fulfilled'
                        ? 'Your game top-up order has been fulfilled.'
                        : 'Payment verified. Your order is waiting for game-currency fulfillment.', 'success', false);
                    await loadUserGameTopupOrders();
                    return;
                }
                if (result.status === 'failed') {
                    showStatusMessage(elements.gameTopupStatus, 'Payment was not completed. No game top-up order was charged.', 'danger', false);
                    await loadUserGameTopupOrders();
                    return;
                }
                gameTopupPollTimeout = setTimeout(() => pollGameTopupVerification(sessionId), 5000);
            } catch (error) {
                console.error('Game top-up verification failed:', error);
                showStatusMessage(elements.gameTopupStatus, error.message, 'warning', false);
                gameTopupPollTimeout = setTimeout(() => pollGameTopupVerification(sessionId), 15000);
            }
        }

        function stopGameTopupMonitoring() {
            if (gameTopupPollTimeout) clearTimeout(gameTopupPollTimeout);
            gameTopupPollTimeout = null;
            currentGameTopupSessionId = null;
        }

        function startRechargeFlow() {
            if (!currentUser) { alert("Please login to add amount."); showSection('login-section'); return; }
            stopTopupMonitoring();
            currentRechargeData = { amount: 0, paymentMethod: 'nepal_gateway' };
            currentTopupSessionId = null;
            elements.rechargeAmountInput.value = '';
            clearStatusMessage(elements.rechargeStep1Status);
            clearStatusMessage(elements.rechargeStep2Status);
            clearStatusMessage(elements.rechargeStep3Status);
            elements.rechargeSubmitBtn.disabled = false;
            elements.rechargeBalanceDisplay.textContent = Number(userProfile.balance || 0).toFixed(2);
            showSection('recharge-section');
            goToRechargeStep(1);
        }
        function goToRechargeStep(step) { elements.rechargeStep1.style.display = (step === 1) ? 'block' : 'none'; elements.rechargeStep2.style.display = (step === 2) ? 'block' : 'none'; elements.rechargeStep3.style.display = (step === 3) ? 'block' : 'none'; }
        function handleGoToStep2() {
            const amount = Number(elements.rechargeAmountInput.value);
            if (!Number.isSafeInteger(amount) || amount < 50 || amount > 100000) {
                showStatusMessage(elements.rechargeStep1Status, "Enter a whole NPR amount between रु 50 and रु 100000.", 'warning');
                return;
            }
            clearStatusMessage(elements.rechargeStep1Status);
            currentRechargeData.amount = amount;
            elements.rechargeAmountConfirm.textContent = amount.toFixed(0);
            goToRechargeStep(2);
        }
        
        async function handleGoToStep3() {
            clearStatusMessage(elements.rechargeStep2Status);
            currentRechargeData.paymentMethod = 'nepal_gateway';
            elements.rechargeFinalAmount.textContent = currentRechargeData.amount.toFixed(0);
            goToRechargeStep(3);
            showStatusMessage(elements.rechargeStep3Status, "Creating your secure checkout session...", "info", false);
            elements.goToStep3Btn.disabled = true;
            try {
                const session = await apiRequest('/api/create-topup', {
                    method: 'POST',
                    body: JSON.stringify({
                        amountNpr: currentRechargeData.amount,
                        paymentMethod: currentRechargeData.paymentMethod
                    })
                });
                currentTopupSessionId = session.sessionId;
                if (!window.PayBridgeNP?.openSession?.(session.checkoutUrl)) {
                    throw new Error("Embedded PayBridgeNP checkout is unavailable. Check the checkout script and allowed app origin.");
                }
                showStatusMessage(elements.rechargeStep3Status, "Complete payment in the checkout overlay. This page will update after server verification.", "info", false);
                watchTopupStatus(currentUser.uid, session.sessionId);
                pollTopupVerification(session.sessionId);
            } catch (error) {
                goToRechargeStep(2);
                showStatusMessage(elements.rechargeStep2Status, error.message, "danger", false);
            } finally {
                elements.goToStep3Btn.disabled = false;
            }
        }

        function watchTopupStatus(uid, sessionId) {
            const topupPath = `walletTopups/${uid}/${sessionId}`;
            const topupRef = ref(db, topupPath);
            const listener = (snapshot) => {
                if (currentTopupSessionId !== sessionId || !snapshot.exists()) return;
                const status = snapshot.val().status;
                if (status === 'completed') finishTopup("Payment verified. Your NPR wallet balance has been updated.", 'success');
                if (status === 'failed') finishTopup("Payment was not completed. No balance was added.", 'danger');
            };
            onValue(topupRef, listener, (error) => {
                console.error("Top-up status listener failed:", error);
                showStatusMessage(elements.rechargeStep3Status, "Could not listen for payment updates. Use Check payment to retry.", "warning", false);
            });
            dbListeners.topup = { path: topupPath, func: listener };
        }

        function finishTopup(message, type) {
            if (topupPollTimeout) clearTimeout(topupPollTimeout);
            topupPollTimeout = null;
            showStatusMessage(elements.rechargeStep3Status, message, type, false);
            elements.rechargeSubmitBtn.disabled = type === 'success';
            if (currentSectionId === 'wallet-section') loadRecentTransactions();
        }

        async function pollTopupVerification(sessionId) {
            if (currentTopupSessionId !== sessionId) return;
            try {
                const result = await apiRequest(`/api/verify-topup/${encodeURIComponent(sessionId)}`);
                if (result.status === 'completed') {
                    finishTopup("Payment verified. Your NPR wallet balance has been updated.", 'success');
                    return;
                }
                if (result.status === 'failed') {
                    finishTopup("Payment was not completed. No balance was added.", 'danger');
                    return;
                }
            } catch (error) {
                console.error("Top-up verification request failed:", error);
                showStatusMessage(elements.rechargeStep3Status, `${error.message} Retrying verification shortly.`, 'warning', false);
            }
            topupPollTimeout = setTimeout(() => pollTopupVerification(sessionId), 30000);
        }

        function stopTopupMonitoring() {
            if (topupPollTimeout) clearTimeout(topupPollTimeout);
            topupPollTimeout = null;
            if (dbListeners.topup) {
                const { path, func } = dbListeners.topup;
                off(ref(db, path), 'value', func);
                delete dbListeners.topup;
            }
        }

        async function uploadImageToAPI(file) {
            if (!currentUser) throw new Error("Please sign in before uploading an image.");
            const formData = new FormData();
            formData.append('image', file);
            const token = await currentUser.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || typeof result.imageUrl !== 'string') {
                throw new Error(result.error?.message || `Image upload failed (${response.status}).`);
            }
            return result.imageUrl;
        }

        async function submitDepositRequest() {
            if (!currentTopupSessionId) {
                showStatusMessage(elements.rechargeStep3Status, "Start a payment checkout first.", "warning");
                return;
            }
            elements.rechargeSubmitBtn.disabled = true;
            try {
                const result = await apiRequest(`/api/verify-topup/${encodeURIComponent(currentTopupSessionId)}`);
                if (result.status === 'completed') finishTopup("Payment verified. Your NPR wallet balance has been updated.", 'success');
                else if (result.status === 'failed') finishTopup("Payment was not completed. No balance was added.", 'danger');
                else showStatusMessage(elements.rechargeStep3Status, "Payment is still pending. This page will keep checking.", "info", false);
            } catch (error) {
                showStatusMessage(elements.rechargeStep3Status, error.message, "danger", false);
            } finally {
                elements.rechargeSubmitBtn.disabled = false;
            }
        }
        
        function handleJoinTournamentClick(event) {
            if (!currentUser) { alert("Login to join."); showSection('login-section'); return; }
            const btn = event.currentTarget;
            currentJoinTournamentData.tId = btn.dataset.tournamentId;
            currentJoinTournamentData.fee = parseFloat(btn.dataset.fee || 0);
            currentJoinTournamentData.mode = btn.dataset.mode || 'Solo';
            currentJoinRequestId = null;
            currentJoinTournamentData.hasSlots = (btn.dataset.hasSlots === 'true');
            try {
                currentJoinTournamentData.slotConfig = JSON.parse(btn.dataset.slotConfig);
            } catch (e) {
                currentJoinTournamentData.slotConfig = null;
            }
            currentJoinTournamentData.selectedSlots = [];

            if (!currentJoinTournamentData.tId) return;

            if (currentJoinTournamentData.hasSlots) {
                openSlotSelectionModal();
            } else {
                openJoinDetailsModal();
            }
        }

        function openJoinDetailsModal() {
            const { fee, slotConfig } = currentJoinTournamentData;
            elements.joinTournamentIdInput.value = currentJoinTournamentData.tId;
            elements.joinTournamentFeeInput.value = fee;

            elements.joinUsernameInput.value = userProfile.username || '';
            elements.joinGameUidInput.value = userProfile.gameUid || '';
            elements.teammateInputsContainer.innerHTML = ''; 
            clearStatusMessage(elements.joinTournamentStatusMessage);

            let teamSize = 1;
            if (slotConfig && slotConfig.type === 'team' && slotConfig.slotsPerEntry > 1) {
                teamSize = slotConfig.slotsPerEntry;
            }
            
            const totalFee = fee * teamSize;
            elements.joinFeeDisplayEl.textContent = `रु ${totalFee.toFixed(2)} (${teamSize > 1 ? `रु ${fee} per player` : ''})`;

            if (teamSize > 1) {
                elements.joinTeamFieldsContainer.style.display = 'block';
                for (let i = 1; i < teamSize; i++) {
                    const teammateFields = `
                        <h6 class="text-secondary small mt-3">Teammate ${i + 1}</h6>
                        <div class="mb-2">
                            <input type="text" class="form-control" placeholder="Teammate ${i + 1} Username" required>
                        </div>
                        <div class="mb-2">
                             <input type="text" class="form-control" placeholder="Teammate ${i + 1} Game UID" required>
                        </div>
                    `;
                    elements.teammateInputsContainer.innerHTML += teammateFields;
                }
            } else {
                elements.joinTeamFieldsContainer.style.display = 'none';
            }
            
            elements.joinTournamentDetailsModalInstance.show();
        }
        
        async function confirmAndJoinTournament() {
             const { tId, fee, slotConfig, selectedSlots, hasSlots } = currentJoinTournamentData;
             const username = elements.joinUsernameInput.value.trim();
             const gameUid = elements.joinGameUidInput.value.trim();
             
            let teamSize = 1;
            if (hasSlots && slotConfig && slotConfig.type === 'team' && slotConfig.slotsPerEntry > 1) {
                 teamSize = slotConfig.slotsPerEntry;
            }

             const totalFee = fee * teamSize;
             const teammateInputs = elements.teammateInputsContainer.querySelectorAll('input');
             const teammates = [];
             let allTeammateFieldsValid = true;

             if(teamSize > 1) {
                 for(let i=0; i < teammateInputs.length; i+=2) {
                     const teamUsername = teammateInputs[i].value.trim();
                     const teamUid = teammateInputs[i+1].value.trim();
                     if(!teamUsername || !teamUid) {
                         allTeammateFieldsValid = false;
                         break;
                     }
                     teammates.push({ username: teamUsername, gameUid: teamUid });
                 }
             }

             if (!username || !gameUid) { showStatusMessage(elements.joinTournamentStatusMessage, 'Your Player Username and Game UID are required.', 'warning'); return; }
             if (!allTeammateFieldsValid) { showStatusMessage(elements.joinTournamentStatusMessage, "All teammate details are required.", 'warning'); return; }
             
             clearStatusMessage(elements.joinTournamentStatusMessage);
             const btn = elements.confirmJoinBtn;
             btn.disabled = true;
             btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Joining...';
             try {
                 if (!currentJoinRequestId) currentJoinRequestId = crypto.randomUUID();
                 await apiRequest('/api/tournaments/join', {
                     method: 'POST',
                     body: JSON.stringify({
                         requestId: currentJoinRequestId,
                         tournamentId: tId,
                         username,
                         gameUid,
                         teammates,
                         slots: hasSlots ? selectedSlots : []
                     })
                 });
                 currentJoinRequestId = null;
                 alert(`Joined successfully! रु ${totalFee.toFixed(2)} deducted.`);
                 
                 elements.joinTournamentDetailsModalInstance.hide();
                 if (currentSectionId === 'my-contests-section') loadMyContests();
                 if (currentSectionId === 'tournaments-section' && currentTournamentGameId) {
                     const activeTab = querySel('.tournament-tabs .tab-item.active')?.dataset.status || 'upcoming';
                     filterTournaments(currentTournamentGameId, activeTab);
                 }
                 if (currentSectionId === 'wallet-section') loadRecentTransactions();
             } catch (e) {
                 console.error("Join failed:", e);
                 if (e.code) currentJoinRequestId = null;
                 showStatusMessage(elements.joinTournamentStatusMessage, `Failed: ${e.message}`, 'danger', false);
             } finally {
                 btn.disabled = false;
                 btn.innerHTML = 'Confirm & Join';
             }
        }
        
        async function openSlotSelectionModal() {
            elements.slotSelectionGridEl.innerHTML = '<div class="spinner-border text-accent"></div>';
            clearStatusMessage(elements.slotSelectionStatus);
            
            let slotsToSelect = 1;
            const { slotConfig } = currentJoinTournamentData;
            if (slotConfig && slotConfig.type === 'team' && slotConfig.slotsPerEntry > 1) {
                slotsToSelect = slotConfig.slotsPerEntry;
            }

            elements.slotSelectionCount.textContent = slotsToSelect;
            
            elements.slotSelectionModalInstance.show();
            
            try {
                const tRef = ref(db, `tournaments/${currentJoinTournamentData.tId}`);
                const snapshot = await get(tRef);
                if (!snapshot.exists()) throw new Error("Tournament not found.");
                
                const tData = snapshot.val();
                const maxPlayers = tData.maxPlayers || 0;
                const takenSlots = tData.slots || {};

                if (maxPlayers === 0) {
                    elements.slotSelectionGridEl.innerHTML = `<p class="text-danger text-center w-100">This tournament does not have defined slots.</p>`;
                    return;
                }

                elements.slotSelectionGridEl.innerHTML = '';
                for (let i = 1; i <= maxPlayers; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'slot-btn';
                    btn.textContent = i;
                    btn.dataset.slotNumber = i;
                    if (takenSlots[i]) {
                        btn.disabled = true;
                    }
                    elements.slotSelectionGridEl.appendChild(btn);
                }
            } catch (e) {
                elements.slotSelectionGridEl.innerHTML = `<p class="text-danger">${e.message}</p>`;
            }
        }

        function handleSlotButtonClick(event) {
            const btn = event.target;
            if (btn.classList.contains('slot-btn') && !btn.disabled) {
                const slotNumber = btn.dataset.slotNumber;
                let slotsToSelect = 1;
                const { slotConfig } = currentJoinTournamentData;
                if (slotConfig && slotConfig.type === 'team' && slotConfig.slotsPerEntry > 1) {
                    slotsToSelect = slotConfig.slotsPerEntry;
                }
                
                const isSelected = btn.classList.contains('selected');
                
                if (isSelected) {
                    btn.classList.remove('selected');
                    currentJoinTournamentData.selectedSlots = currentJoinTournamentData.selectedSlots.filter(s => s !== slotNumber);
                } else {
                    if (currentJoinTournamentData.selectedSlots.length < slotsToSelect) {
                        btn.classList.add('selected');
                        currentJoinTournamentData.selectedSlots.push(slotNumber);
                    } else {
                        showStatusMessage(elements.slotSelectionStatus, `You can only select ${slotsToSelect} slot(s).`, 'warning');
                    }
                }
            }
        }

        function confirmSlotSelection() {
            let slotsToSelect = 1;
            const { slotConfig } = currentJoinTournamentData;
            if (slotConfig && slotConfig.type === 'team' && slotConfig.slotsPerEntry > 1) {
                slotsToSelect = slotConfig.slotsPerEntry;
            }

            if (currentJoinTournamentData.selectedSlots.length !== slotsToSelect) {
                showStatusMessage(elements.slotSelectionStatus, `Please select exactly ${slotsToSelect} slot(s).`, 'warning');
                return;
            }
            elements.slotSelectionModalInstance.hide();
            openJoinDetailsModal();
        }

        async function loadAndDisplayNotifications() {
            if (!currentUser) return;
            const listEl = elements.notificationsListEl;
            const badgeEl = elements.notificationBadge;
            const emptyMsgEl = elements.notificationsEmptyMsgEl;

            listEl.innerHTML = '';
            badgeEl.style.display = 'none';
            emptyMsgEl.style.display = 'none';

            try {
                const globalNotifRef = ref(db, 'notifications');
                const userNotifRef = ref(db, `users/${currentUser.uid}/notifications`);

                const [globalSnapshot, userSnapshot] = await Promise.all([ get(globalNotifRef), get(userNotifRef) ]);

                let allNotifications = [];
                if (globalSnapshot.exists()) allNotifications.push(...Object.values(globalSnapshot.val()));
                if (userSnapshot.exists()) allNotifications.push(...Object.values(userSnapshot.val()));

                if (allNotifications.length === 0) { emptyMsgEl.style.display = 'block'; return; }

                allNotifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                let unreadCount = 0;
                const lastChecked = userProfile.lastCheckedNotifications || 0;
                let notificationsHtml = '';

                allNotifications.forEach(notif => {
                    const isUnread = notif.timestamp > lastChecked;
                    if (isUnread) unreadCount++;
                    notificationsHtml += createNotificationItemHTML(notif, isUnread);
                });

                listEl.innerHTML = notificationsHtml;
                if (unreadCount > 0) {
                    badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
                    badgeEl.style.display = 'flex';
                }
            } catch (error) {
                console.error("Error loading notifications:", error);
                listEl.innerHTML = '<p class="text-danger text-center">Could not load notifications.</p>';
            }
        }
        
        function createNotificationItemHTML(notification, isUnread) {
            return `
                <div class="notification-item">
                    ${isUnread ? '<span class="unread-indicator"></span>' : ''}
                    ${notification.imageUrl ? `<img src="${notification.imageUrl}" class="notification-item-img" alt="Notification Image">` : ''}
                    <div class="notification-item-content">
                        <div class="notification-item-title">${notification.title || 'Notification'}</div>
                        <div class="notification-item-message">${notification.message || ''}</div>
                        <div class="notification-item-time">${formatDate(notification.timestamp)}</div>
                    </div>
                </div>`;
        }

        async function markNotificationsAsRead() {
            if (!currentUser) return;
            const userRef = ref(db, `users/${currentUser.uid}`);
            try {
                await update(userRef, { lastCheckedNotifications: serverTimestamp() });
                console.log("Marked notifications as read.");
                elements.notificationBadge.style.display = 'none';
                elements.notificationsListEl.querySelectorAll('.unread-indicator').forEach(indicator => indicator.remove());
            } catch (error) { console.error("Failed to mark notifications as read:", error); }
        }
        
        function openNotificationsModal() {
            if (!currentUser) return;
            elements.notificationsModalInstance.show();
            markNotificationsAsRead();
        }

        function handleContactUs() {
            if (!currentUser) { alert("Please login to contact us."); return; }
            const contactNumber = appSettings.supportContact || '9389660753';
            const userName = userProfile.displayName || "a user";
            const message = `Hello Sir I Am ${userName} I need your help.`;
            const whatsappUrl = `https://wa.me/${contactNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
        
        function handleDeveloperContact() {
            const devNumber = appSettings.developerContact || '9848988740';
            const whatsappUrl = `https://wa.me/${devNumber}?text=${encodeURIComponent("Hello Developer!")}`;
            window.open(whatsappUrl, '_blank');
        }

        async function loadMatchHistory() {
            if (!currentUser || !elements.matchHistoryModalInstance) return;
            
            elements.matchHistoryBodyEl.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-accent"></div><p class="mt-2 text-secondary">Loading history...</p></div>';
            elements.matchHistoryModalInstance.show();
            
            try {
                const historyRef = ref(db, `users/${currentUser.uid}/matchHistory`);
                const snapshot = await get(historyRef);
                
                if (!snapshot.exists()) {
                    elements.matchHistoryBodyEl.innerHTML = '<p class="text-center text-secondary p-4">You haven\'t played any matches yet.</p>';
                    return;
                }
                
                const historyData = snapshot.val();
                const sortedHistory = Object.values(historyData).sort((a,b) => (b.date || 0) - (a.date || 0));

                let historyHtml = '';
                sortedHistory.forEach(match => {
                    historyHtml += `
                     <div class="custom-card">
                         <h5 class="tournament-card-title mb-2">${match.tournamentName || 'Tournament'}</h5>
                         <p class="small text-secondary mb-3">${formatFullDateTime(match.date)}</p>
                         <div class="d-flex justify-content-around text-center">
                            <div><span class="text-secondary small d-block">Rank</span><strong class="h5">#${match.rank || 'N/A'}</strong></div>
                            <div><span class="text-secondary small d-block">Kills</span><strong class="h5">${match.kills ?? 'N/A'}</strong></div>
                            <div><span class="text-secondary small d-block">Winnings</span><strong class="h5 text-success">रु ${(match.earnings || 0).toFixed(2)}</strong></div>
                         </div>
                     </div>
                    `;
                });
                elements.matchHistoryBodyEl.innerHTML = historyHtml;

            } catch (error) {
                 console.error("Error loading match history:", error);
                 elements.matchHistoryBodyEl.innerHTML = `<p class="text-center text-danger p-4">Could not load match history. Error: ${error.message}</p>`;
            }
        }

        function openTournamentChat(tournamentId, tournamentName) {
            if (!currentUser || !elements.tournamentChatModalInstance) return;

            if (currentChatListener) {
                off(currentChatListener.ref, 'child_added', currentChatListener.func);
                currentChatListener = null;
                console.log("Detached previous chat listener.");
            }

            elements.tournamentChatModalTitle.textContent = tournamentName;
            elements.chatForm.dataset.tournamentId = tournamentId;
            elements.chatMessagesEl.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-accent"></div></div>';
            elements.tournamentChatModalInstance.show();
            
            const chatRef = query(ref(db, `chats/${tournamentId}`), limitToLast(50));
            const messages = [];
            currentChatListener = {
                 ref: chatRef,
                 func: onChildAdded(chatRef, (snapshot) => {
                    if (elements.chatMessagesEl.querySelector('.spinner-border')) {
                        elements.chatMessagesEl.innerHTML = '';
                    }
                    const msg = snapshot.val();
                    if(msg) {
                        appendChatMessage(msg, true);
                    }
                }, { onlyOnce: false })
            };
        }
        
        function cancelReply(){
            currentReply = null;
            elements.chatReplyContextEl.style.display = 'none';
        }

        function appendChatMessage(msg, prepend = false) {
            const isMyMessage = msg.uid === currentUser.uid;
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${isMyMessage ? 'my-message' : 'other-message'}`;
            bubble.dataset.senderName = msg.displayName;
            bubble.dataset.messageText = msg.message;
            
            let replyHtml = '';
            if (msg.replyTo) {
                 replyHtml = `
                     <div class="reply-quote-block">
                        <span class="sender-name">${msg.replyTo.originalSenderName}</span>
                        <p>${msg.replyTo.originalMessage}</p>
                     </div>
                 `;
            }

            bubble.innerHTML = `
                ${replyHtml}
                ${!isMyMessage ? `<span class="sender-name">${msg.displayName || 'User'}</span>` : ''}
                ${msg.message}
                <span class="msg-time">${formatFullDateTime(msg.timestamp)}</span>
            `;

            if(prepend){
                 elements.chatMessagesEl.prepend(bubble);
            } else {
                 elements.chatMessagesEl.appendChild(bubble);
                 elements.chatMessagesEl.scrollTop = 0;
            }
        }

        async function handleChatSubmit(event) {
            event.preventDefault();
            const tournamentId = event.currentTarget.dataset.tournamentId;
            const messageText = elements.chatMessageInput.value.trim();
            
            if (!messageText || !tournamentId || !currentUser) return;
            
            if (!userProfile?.joinedTournaments?.[tournamentId]) {
                 alert("You can only chat in tournaments you have joined.");
                 return;
            }

            const messageData = {
                uid: currentUser.uid,
                displayName: userProfile.displayName,
                message: messageText,
                timestamp: serverTimestamp()
            };
            
            if (currentReply) {
                 messageData.replyTo = currentReply;
            }
            
            try {
                await push(ref(db, `chats/${tournamentId}`), messageData);
                elements.chatMessageInput.value = '';
                cancelReply();
            } catch(error) {
                console.error("Error sending chat message:", error);
                alert(`Could not send message: ${error.message}`);
            }
        }

        function openEditNameModal() {
            if (!currentUser) return;
            elements.editNameInput.value = userProfile.displayName || '';
            clearStatusMessage(elements.editNameStatusMessage);
            elements.editNameModalInstance.show();
        }

        async function saveNameChange() {
            const newName = elements.editNameInput.value.trim();
            if (!newName) {
                showStatusMessage(elements.editNameStatusMessage, "Name cannot be empty.", "warning");
                return;
            }
            if (newName === userProfile.displayName) {
                elements.editNameModalInstance.hide();
                return;
            }

            showLoader(true);
            const userRef = ref(db, `users/${currentUser.uid}`);
            try {
                await update(userRef, { displayName: newName });
                userProfile.displayName = newName; 
                populateUserInfo(currentUser, userProfile);
                elements.editNameModalInstance.hide();
            } catch (error) {
                console.error("Error updating name:", error);
                showStatusMessage(elements.editNameStatusMessage, `Error: ${error.message}`, "danger", false);
            } finally {
                showLoader(false);
            }
        }
        
        async function handleProfilePictureChange(event) {
            const file = event.target.files[0];
            if (!file) return;

            showLoader(true);
            try {
                const imageUrl = await uploadImageToAPI(file);
                await update(ref(db, `users/${currentUser.uid}`), { photoURL: imageUrl });
                alert("Profile picture updated!");
            } catch (error) {
                console.error("Profile picture upload failed:", error);
                alert(`Error: ${error.message}`);
            } finally {
                showLoader(false);
            }
        }

        async function handleChangePassword() {
            const currentPassword = elements.currentPasswordInput.value;
            const newPassword = elements.newPasswordInput.value;
            const confirmNewPassword = elements.confirmNewPasswordInput.value;
            const statusEl = elements.changePasswordStatusMessage;

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showStatusMessage(statusEl, "All fields are required.", "warning");
                return;
            }
            if (newPassword.length < 6) {
                showStatusMessage(statusEl, "New password must be at least 6 characters.", "warning");
                return;
            }
            if (newPassword !== confirmNewPassword) {
                showStatusMessage(statusEl, "New passwords do not match.", "warning");
                return;
            }

            showLoader(true);
            clearStatusMessage(statusEl);
            try {
                const user = auth.currentUser;
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                showStatusMessage(statusEl, "Password updated successfully!", "success", false);
                setTimeout(() => {
                    elements.changePasswordModalInstance.hide();
                    elements.changePasswordForm.reset();
                }, 2000);
            } catch (error) {
                console.error("Password change error:", error);
                let msg = "An error occurred.";
                if (error.code === 'auth/wrong-password') {
                    msg = "Incorrect current password.";
                }
                showStatusMessage(statusEl, msg, "danger", false);
            } finally {
                showLoader(false);
            }
        }
        
        // MODIFICATION START: Notification enable problem ka solution
        function requestNotificationPermission() {
            const btn = elements.enableNotificationsBtn;
            if (!('Notification' in window)) {
                alert('This browser does not support desktop notifications.');
                btn.textContent = 'Not Supported';
                btn.disabled = true;
                return;
            }
            if (Notification.permission === 'granted') {
                alert('Notifications are already enabled!');
                btn.textContent = 'Enabled';
                btn.disabled = true;
                return;
            }
            if (Notification.permission === 'denied') {
                alert('Notifications are blocked. Please enable them in your browser settings.');
                 btn.textContent = 'Blocked';
                 btn.disabled = true;
                return;
            }

            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Notifications Enabled!', {
                        body: 'You will now receive notifications from this app.',
                        icon: 'https://i.ibb.co/Fny3v3b/logo.png'
                    });
                    btn.textContent = 'Enabled';
                    btn.disabled = true;
                } else {
                    alert('You have denied notification permissions.');
                }
            });
        }
        // MODIFICATION END


         function initializeEventListeners() {
             if (!elements) return; console.log("Initializing listeners...");
             document.getElementById('dismissAnnouncementBtn')?.addEventListener('click', (event) => {
                 event.currentTarget.parentElement.style.display = 'none';
             });
             elements.bottomNavItems?.forEach(item => item.addEventListener('click', (e) => { e.preventDefault(); showSection(item.dataset.section); }));
             
             // MODIFICATION START: Back button ka handler
             elements.headerBackBtn?.addEventListener('click', () => {
                 navigationStack.pop(); // Remove current page
                 const prevSection = navigationStack[navigationStack.length - 1]; // Get previous page
                 if (prevSection) {
                     showSection(prevSection, true); // Show previous page, isBackAction = true
                 }
             });
             window.addEventListener('popstate', (event) => {
                 if (navigationStack.length > 1) {
                     navigationStack.pop();
                     const prevSection = navigationStack[navigationStack.length - 1];
                     if(prevSection && getElement(prevSection)) {
                        showSection(prevSection, true);
                     }
                 } else {
                     // If on home/login and back is pressed, do nothing, let the browser handle it (or show exit prompt)
                     history.pushState(null, null, window.location.href);
                 }
             });
             // MODIFICATION END

             elements.tournamentTabs?.forEach(tab => tab.addEventListener('click', (e) => { const s = e.currentTarget.dataset.status; if (currentTournamentGameId && s) { elements.tournamentTabs.forEach(t => t.classList.remove('active')); e.currentTarget.classList.add('active'); filterTournaments(currentTournamentGameId, s); } }));
             
             elements.loginEmailBtn?.addEventListener('click', loginWithEmail);
             elements.signupEmailBtn?.addEventListener('click', signUpWithEmail);
             elements.showSignupToggleBtn?.addEventListener('click', () => toggleAuthForm('signup'));
             elements.showLoginToggleBtn?.addEventListener('click', () => toggleAuthForm('login'));
             elements.backToLoginBtn?.addEventListener('click', () => toggleAuthForm('login'));
             elements.forgotPasswordLink?.addEventListener('click', (e) => { e.preventDefault(); resetPassword(); });
             elements.googleSignInBtn?.addEventListener('click', signInWithGoogle);
             elements.phoneSignInBtn?.addEventListener('click', signInWithPhone);
             elements.verifyOtpBtn?.addEventListener('click', verifyOtp);
             
             elements.logoutProfileBtn?.addEventListener('click', logoutUser);
             elements.policyLinks?.forEach(link => link.addEventListener('click', handlePolicyClick));
             elements.withdrawBtn?.addEventListener('click', handleWithdrawClick);
             elements.withdrawMethodOptions.forEach(opt => opt.addEventListener('click', () => openWithdrawalModal(opt.dataset.method)));
             elements.addAmountWalletBtn?.addEventListener('click', startRechargeFlow);
             elements.submitWithdrawRequestBtn?.addEventListener('click', submitWithdrawRequestHandler);
             elements.rechargePresetBtns.forEach(btn => { btn.addEventListener('click', () => { elements.rechargeAmountInput.value = btn.dataset.amount; }); });
             elements.goToStep2Btn?.addEventListener('click', handleGoToStep2);
             elements.goToStep3Btn?.addEventListener('click', handleGoToStep3);
             elements.paymentOptionCards.forEach(card => { card.addEventListener('click', () => { elements.paymentOptionCards.forEach(c => c.classList.remove('selected')); card.classList.add('selected'); card.querySelector('input[type="radio"]').checked = true; }); });
             elements.rechargeSubmitBtn?.addEventListener('click', submitDepositRequest);
             elements.rechargeCancelBtn?.addEventListener('click', () => showSection('wallet-section'));
             elements.rechargeReturnWalletBtn?.addEventListener('click', () => showSection('wallet-section'));
             elements.openSupportReportBtn?.addEventListener('click', (event) => { event.preventDefault(); showSection('support-report-section'); });
             elements.openGameTopupBtn?.addEventListener('click', (event) => { event.preventDefault(); showSection('game-topup-section'); });
             elements.gameTopupForm?.addEventListener('submit', submitGameTopup);
             elements.gameTopupBackBtn?.addEventListener('click', () => showSection('profile-section'));
             elements.supportReportForm?.addEventListener('submit', submitSupportReport);
             elements.supportReportType?.addEventListener('change', () => {
                 const isOther = elements.supportReportType.value === 'other';
                 elements.supportReportDescriptionLabel.textContent = isOther ? 'Describe the issue in detail (required)' : 'Describe what happened (required)';
                 elements.supportReportDescription.placeholder = isOther ? 'Please explain the issue in detail.' : 'Include details that can help us investigate.';
             });
             elements.supportReportBackBtn?.addEventListener('click', () => showSection('profile-section'));
             elements.confirmJoinBtn?.addEventListener('click', confirmAndJoinTournament);
             elements.contactUsBtn?.addEventListener('click', handleContactUs);
             elements.developerContactBtn?.addEventListener('click', handleDeveloperContact);
             elements.allTransactionsBtn?.addEventListener('click', () => showSection('earnings-section'));
             elements.notificationBtn?.addEventListener('click', openNotificationsModal);
             elements.profileAvatarWrapper?.addEventListener('click', () => elements.profileAvatarInput.click());
             elements.profileAvatarInput?.addEventListener('change', handleProfilePictureChange);
             elements.editNameBtnEl?.addEventListener('click', openEditNameModal);
             elements.saveNameChangeBtn?.addEventListener('click', saveNameChange);
             elements.changePasswordBtn?.addEventListener('click', () => elements.changePasswordModalInstance.show());
             elements.savePasswordChangeBtn?.addEventListener('click', handleChangePassword);
             elements.enableNotificationsBtn?.addEventListener('click', requestNotificationPermission);
             elements.matchHistoryBtn?.addEventListener('click', loadMatchHistory);
             elements.chatForm?.addEventListener('submit', handleChatSubmit);
             elements.cancelReplyBtn?.addEventListener('click', cancelReply);
             elements.slotSelectionGridEl.addEventListener('click', handleSlotButtonClick);
             elements.confirmSlotSelectionBtn.addEventListener('click', confirmSlotSelection);
             elements.contestStatusNav?.addEventListener('click', (e) => {
                 e.preventDefault();
                 const target = e.target.closest('.contest-status-btn');
                 if(target) {
                     const status = target.dataset.status;
                     const firstGame = Object.entries(appSettings.games || {}).sort(([,a],[,b]) => (a.order||99) - (b.order||99))[0];
                     if(firstGame) {
                        currentTournamentGameId = firstGame[0];
                        elements.tournamentTabs.forEach(t => t.classList.toggle('active', t.dataset.status === status));
                        filterTournaments(currentTournamentGameId, status);
                        showSection('tournaments-section');
                     } else {
                        alert("No games are available to show tournaments.");
                     }
                 }
             });

             elements.chatMessagesEl.addEventListener('click', (e) => {
                 const bubble = e.target.closest('.chat-bubble');
                 if(!bubble) return;
                 const sender = bubble.dataset.senderName;
                 let message = bubble.dataset.messageText;
                 if (message.length > 50) message = message.substring(0, 50) + '...';
                 currentReply = { originalSenderName: sender, originalMessage: message };
                 elements.replyToNameEl.textContent = sender;
                 elements.replyToMessageEl.textContent = message;
                 elements.chatReplyContextEl.style.display = 'block';
             });
             
             getElement('tournamentChatModal')?.addEventListener('hidden.bs.modal', () => {
                if (currentChatListener && currentChatListener.ref) {
                     off(currentChatListener.ref, 'child_added', currentChatListener.func);
                     currentChatListener = null;
                     console.log('Detached chat listener.');
                 }
                 cancelReply();
             });

             document.body.addEventListener('click', (event) => { if (event.target.matches('.copy-btn') || event.target.closest('.copy-btn')) { const btn = event.target.closest('.copy-btn'); const targetSelector = btn.dataset.target; if (targetSelector) { copyToClipboard(targetSelector); } } if (event.target.matches('#shareReferralBtn') || event.target.closest('#shareReferralBtn')) { const cel = getElement('referralCodeDisplay'); if (cel) shareReferral(cel.textContent); } });
             console.log("Listeners initialized.");
         }

         document.addEventListener('DOMContentLoaded', () => {
             console.log("DOM Loaded. Init App...");
             
             const splashScreen = document.getElementById('splash-screen');
             setTimeout(() => {
                 splashScreen.classList.add('hidden');
             }, 2500); // Splash screen time reduced slightly

             if (typeof initializeApp !== 'function' || !auth || !db) { console.error("Firebase SDK failed/not ready. Cannot proceed."); return; }
             showLoader(true);
             loadAppSettings()
                 .then(() => {
                     initializeEventListeners();
                     updateGlobalUI(false);
                     onAuthStateChanged(auth, handleAuthStateChange);
                     startLiveTimers();
                 })
                 .catch(err => {
                     console.error("CRITICAL: Initial settings load failed:", err);
                     alert("Error loading essential app settings. Please try again later.");
                     initializeEventListeners();
                     updateGlobalUI(false);
                     onAuthStateChanged(auth, handleAuthStateChange);
                     startLiveTimers();
                 });
         });
