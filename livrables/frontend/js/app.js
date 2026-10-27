/**
 * ========================================================
 * VOCABMASTER - MAIN APPLICATION (APP.JS)
 * Sprint 2 & Sprint 3: Flashcard, 3-Column, Progress & Quiz Integration
 * ========================================================
 */

import { api } from './api.js';
import { FlashcardController } from './flashcard.js';
import { QuizController } from './quiz.js';
import { MatchingController } from './matching.js';
import { TypingController } from './typing.js';
import { ListeningController } from './listening.js';
import { ClozeController } from './cloze.js';
import { MixedController } from './mixed.js';
import { MyDecksController } from './mydecks.js';
import { DeckDetailController } from './deckdetail.js';
import { ImportModalController } from './import.js';
import { SharedDeckController } from './shared.js';

class VocabApp {
  constructor() {
    this.currentView = 'sets'; // 'sets' | 'my-decks' | 'deck-detail' | 'study'
    this.lastListView = 'sets'; // 'sets' | 'my-decks' | 'deck-detail'
    this.studySubMode = 'flashcard'; // 'flashcard' | 'quiz' | 'matching' | 'typing' | 'listening' | 'cloze' | 'mixed'
    this.sets = [];
    this.filteredSets = [];
    this.activeSet = null;
    this.currentStats = null;

    // Flashcard Controller
    this.flashcardCtrl = new FlashcardController({
      onComplete: (data) => this.showCompletionModal(data),
      onToast: (msg) => this.showToast(msg),
      onRate: (ratingData) => this.handleCardRating(ratingData)
    });

    // Quiz Controller (Sprint 3)
    this.quizCtrl = new QuizController({
      onToast: (msg) => this.showToast(msg),
      onBackToFlashcard: () => this.switchStudySubMode('flashcard'),
      onBackToSets: () => this.switchView(this.lastListView || 'sets')
    });

    // Matching Controller (Sprint 4: Task F9 & F10)
    this.matchingCtrl = new MatchingController({
      onToast: (msg) => this.showToast(msg),
      onBackToFlashcard: () => this.switchStudySubMode('flashcard'),
      onBackToSets: () => this.switchView(this.lastListView || 'sets')
    });

    // Typing Controller (Sprint 5: Task F11)
    this.typingCtrl = new TypingController({
      onToast: (msg) => this.showToast(msg),
      onBackToFlashcard: () => this.switchStudySubMode('flashcard'),
      onSwitchToListening: () => this.switchStudySubMode('listening'),
      onBackToSets: () => this.switchView(this.lastListView || 'sets')
    });

    // Listening Controller (Sprint 5: Task F12)
    this.listeningCtrl = new ListeningController({
      onToast: (msg) => this.showToast(msg),
      onBackToFlashcard: () => this.switchStudySubMode('flashcard'),
      onSwitchToTyping: () => this.switchStudySubMode('typing'),
      onBackToSets: () => this.switchView(this.lastListView || 'sets')
    });

    // Cloze Controller (Sprint 6: Task F13)
    this.clozeCtrl = new ClozeController({
      onToast: (msg) => this.showToast(msg),
      onBackToFlashcard: () => this.switchStudySubMode('flashcard'),
      onSwitchToMixed: () => this.switchStudySubMode('mixed'),
      onBackToSets: () => this.switchView(this.lastListView || 'sets')
    });

    // Mixed Controller (Sprint 6: Task F14)
    this.mixedCtrl = new MixedController({
      onToast: (msg) => this.showToast(msg),
      onBackToFlashcard: () => this.switchStudySubMode('flashcard'),
      onBackToSets: () => this.switchView(this.lastListView || 'sets')
    });

    // My Decks Controller (Sprint 7: Task F15)
    this.myDecksCtrl = new MyDecksController({
      onToast: (msg) => this.showToast(msg),
      onOpenDeckDetail: (deck) => {
        this.deckDetailCtrl.setDeck(deck);
        this.switchView('deck-detail');
      },
      onStudyDeck: (deck) => {
        this.lastListView = 'my-decks';
        this.startStudy(deck);
      },
      onViewSharedDeck: (shareId) => {
        this.navigateToShared(shareId);
      }
    });

    // Deck Detail Controller (Sprint 7: Task F16)
    this.deckDetailCtrl = new DeckDetailController({
      onToast: (msg) => this.showToast(msg),
      onBackToMyDecks: () => this.switchView('my-decks'),
      onStudyDeck: (deck) => {
        this.lastListView = 'deck-detail';
        this.startStudy(deck);
      },
      onStudyGroup: ({ group, deck, cards, payload }) => {
        this.lastListView = 'deck-detail';
        this.startStudy(payload);
      },
      onOpenImportModal: (data) => {
        this.importModalCtrl.openModal(data);
      },
      onShareDeck: (deck) => {
        this.myDecksCtrl.handleShareDeck(deck);
      }
    });

    // Import Modal Controller (Sprint 7: Task F17)
    this.importModalCtrl = new ImportModalController({
      onToast: (msg) => this.showToast(msg),
      onImportSuccess: () => {
        this.deckDetailCtrl.loadGroups();
      }
    });

    // Shared Deck Controller (Sprint 8: Task F18)
    this.sharedCtrl = new SharedDeckController({
      onToast: (msg) => this.showToast(msg),
      onGoHome: () => {
        this.switchView(this.lastListView || 'sets');
      },
      onStudyDeck: (deck) => {
        this.lastListView = 'shared';
        this.startStudy(deck);
      },
      onCloneSuccess: (clonedDeck) => {
        this.switchView('my-decks');
      }
    });

    this.bindDomElements();
    this.bindEvents();
    this.init();
  }

  bindDomElements() {
    // Views
    this.viewSets = document.getElementById('view-sets');
    this.viewStudy = document.getElementById('view-study');
    this.viewMyDecks = document.getElementById('view-my-decks');
    this.viewDeckDetail = document.getElementById('view-deck-detail');
    this.viewSharedDeck = document.getElementById('view-shared-deck');

    // Main Nav Tabs (Sprint 7)
    this.navTabSets = document.getElementById('nav-tab-sets');
    this.navTabMyDecks = document.getElementById('nav-tab-my-decks');

    // Brand / Home
    this.btnBrandHome = document.getElementById('btn-brand-home');

    // API Status Indicator
    this.apiStatusIndicator = document.getElementById('api-status-indicator');
    this.apiStatusText = document.getElementById('api-status-text');

    // Sets view elements
    this.setsContainer = document.getElementById('sets-container');
    this.setsLoading = document.getElementById('sets-loading');
    this.setsEmpty = document.getElementById('sets-empty');
    this.setsError = document.getElementById('sets-error');
    this.setsErrorTitle = document.getElementById('sets-error-title');
    this.setsErrorDesc = document.getElementById('sets-error-desc');
    this.setsErrorCode = document.getElementById('sets-error-code');
    this.setsSearchInput = document.getElementById('sets-search-input');
    this.btnRefreshSets = document.getElementById('btn-refresh-sets');
    this.btnRetrySets = document.getElementById('btn-retry-sets');
    this.btnRetryEmptySets = document.getElementById('btn-retry-empty-sets');

    // Study view elements
    this.btnBackToSets = document.getElementById('btn-back-to-sets');
    this.studySetTitle = document.getElementById('study-set-title');
    this.studySetLang = document.getElementById('study-set-lang');
    this.studyLoading = document.getElementById('study-loading');
    this.studyEmpty = document.getElementById('study-empty');
    this.studyError = document.getElementById('study-error');
    this.studyErrorCode = document.getElementById('study-error-code');
    this.studyErrorDesc = document.getElementById('study-error-desc');

    // Containers for all 7 study modes (Sprint 1-6)
    this.modeContainerFlashcard = document.getElementById('mode-container-flashcard');
    this.quizStage = document.getElementById('quiz-stage');
    this.matchingStage = document.getElementById('matching-stage');
    this.typingStage = document.getElementById('typing-stage');
    this.listeningStage = document.getElementById('listening-stage');
    this.clozeStage = document.getElementById('cloze-stage');
    this.mixedStage = document.getElementById('mixed-stage');
    this.learningModesBar = document.getElementById('learning-modes-bar');

    // Mode tabs
    this.modeTabFlashcard = document.getElementById('mode-tab-flashcard');
    this.modeTabQuiz = document.getElementById('mode-tab-quiz');
    this.modeTabMatching = document.getElementById('mode-tab-matching');
    this.modeTabTyping = document.getElementById('mode-tab-typing');
    this.modeTabListening = document.getElementById('mode-tab-listening');
    this.modeTabCloze = document.getElementById('mode-tab-cloze');
    this.modeTabMixed = document.getElementById('mode-tab-mixed');
    this.btnEmptyQuizBack = document.getElementById('btn-empty-quiz-back');

    // Stats bar elements
    this.studyStatsBar = document.getElementById('study-stats-bar');
    this.statCountMastered = document.getElementById('stat-count-mastered');
    this.statCountReview = document.getElementById('stat-count-review');
    this.statCountUnseen = document.getElementById('stat-count-unseen');
    this.statsTotalText = document.getElementById('stats-total-text');
    this.segMastered = document.getElementById('seg-mastered');
    this.segReview = document.getElementById('seg-review');
    this.segUnseen = document.getElementById('seg-unseen');

    // Study actions & errors
    this.btnRetryStudy = document.getElementById('btn-retry-study');
    this.btnErrorBackSets = document.getElementById('btn-error-back-sets');
    this.btnEmptyBackSets = document.getElementById('btn-empty-back-sets');
    this.btnShuffleTop = document.getElementById('btn-shuffle-top');
    this.btnFlipCard = document.getElementById('btn-flip-card');
    this.btnPrevCard = document.getElementById('btn-prev-card');
    this.btnNextCard = document.getElementById('btn-next-card');

    // Modals
    this.completionModal = document.getElementById('completion-modal');
    this.completionText = document.getElementById('completion-text');
    this.compStatTotal = document.getElementById('comp-stat-total');
    this.compStatMastered = document.getElementById('comp-stat-mastered');
    this.btnModalRestart = document.getElementById('btn-modal-restart');
    this.btnModalShuffle = document.getElementById('btn-modal-shuffle');
    this.btnModalBackSets = document.getElementById('btn-modal-back-sets');

    this.shortcutsModal = document.getElementById('shortcuts-modal');
    this.btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
    this.btnCloseShortcuts = document.getElementById('btn-close-shortcuts');

    this.settingsModal = document.getElementById('settings-modal');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.inputApiUrl = document.getElementById('input-api-url');
    this.btnTestApi = document.getElementById('btn-test-api');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.settingsDebugStatus = document.getElementById('settings-debug-status');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');
  }

  bindEvents() {
    // Main Navigation Tabs
    if (this.navTabSets) {
      this.navTabSets.addEventListener('click', () => {
        this.lastListView = 'sets';
        this.switchView('sets');
      });
    }
    if (this.navTabMyDecks) {
      this.navTabMyDecks.addEventListener('click', () => {
        this.lastListView = 'my-decks';
        this.switchView('my-decks');
      });
    }

    // Navigation
    if (this.btnBrandHome) {
      this.btnBrandHome.addEventListener('click', () => {
        this.lastListView = 'sets';
        this.switchView('sets');
      });
    }
    if (this.btnBackToSets) {
      this.btnBackToSets.addEventListener('click', () => this.switchView(this.lastListView || 'sets'));
    }
    if (this.btnErrorBackSets) {
      this.btnErrorBackSets.addEventListener('click', () => this.switchView(this.lastListView || 'sets'));
    }
    if (this.btnEmptyBackSets) {
      this.btnEmptyBackSets.addEventListener('click', () => this.switchView(this.lastListView || 'sets'));
    }

    // Learning mode tabs
    if (this.modeTabFlashcard) {
      this.modeTabFlashcard.addEventListener('click', () => this.switchStudySubMode('flashcard'));
    }
    if (this.modeTabQuiz) {
      this.modeTabQuiz.addEventListener('click', () => this.switchStudySubMode('quiz'));
    }
    if (this.modeTabMatching) {
      this.modeTabMatching.addEventListener('click', () => this.switchStudySubMode('matching'));
    }
    if (this.modeTabTyping) {
      this.modeTabTyping.addEventListener('click', () => this.switchStudySubMode('typing'));
    }
    if (this.modeTabListening) {
      this.modeTabListening.addEventListener('click', () => this.switchStudySubMode('listening'));
    }
    if (this.modeTabCloze) {
      this.modeTabCloze.addEventListener('click', () => this.switchStudySubMode('cloze'));
    }
    if (this.modeTabMixed) {
      this.modeTabMixed.addEventListener('click', () => this.switchStudySubMode('mixed'));
    }
    if (this.btnEmptyQuizBack) {
      this.btnEmptyQuizBack.addEventListener('click', () => this.switchStudySubMode('flashcard'));
    }

    // Sets controls
    if (this.btnRefreshSets) {
      this.btnRefreshSets.addEventListener('click', () => this.loadSets());
    }
    if (this.btnRetrySets) {
      this.btnRetrySets.addEventListener('click', () => this.loadSets());
    }
    if (this.btnRetryEmptySets) {
      this.btnRetryEmptySets.addEventListener('click', () => this.loadSets());
    }
    if (this.setsSearchInput) {
      this.setsSearchInput.addEventListener('input', (e) => this.filterSets(e.target.value));
    }

    // Flashcard study controls
    if (this.btnFlipCard) {
      this.btnFlipCard.addEventListener('click', () => this.flashcardCtrl.flip());
    }
    if (this.btnPrevCard) {
      this.btnPrevCard.addEventListener('click', () => this.flashcardCtrl.prev());
    }
    if (this.btnNextCard) {
      this.btnNextCard.addEventListener('click', () => this.flashcardCtrl.next());
    }
    if (this.btnShuffleTop) {
      this.btnShuffleTop.addEventListener('click', () => {
        if (this.studySubMode === 'flashcard') {
          this.flashcardCtrl.shuffle();
        } else {
          this.quizCtrl.retryQuiz();
        }
      });
    }
    if (this.btnRetryStudy) {
      this.btnRetryStudy.addEventListener('click', () => {
        if (this.activeSet) this.startStudy(this.activeSet);
      });
    }

    // Completion modal actions
    if (this.btnModalRestart) {
      this.btnModalRestart.addEventListener('click', () => {
        this.closeModal(this.completionModal);
        this.flashcardCtrl.restart();
      });
    }
    if (this.btnModalShuffle) {
      this.btnModalShuffle.addEventListener('click', () => {
        this.closeModal(this.completionModal);
        this.flashcardCtrl.shuffle();
      });
    }
    if (this.btnModalBackSets) {
      this.btnModalBackSets.addEventListener('click', () => {
        this.closeModal(this.completionModal);
        this.switchView(this.lastListView || 'sets');
      });
    }

    // Shortcuts modal
    if (this.btnOpenShortcuts) {
      this.btnOpenShortcuts.addEventListener('click', () => this.openModal(this.shortcutsModal));
    }
    if (this.btnCloseShortcuts) {
      this.btnCloseShortcuts.addEventListener('click', () => this.closeModal(this.shortcutsModal));
    }

    // Settings modal
    if (this.btnOpenSettings) {
      this.btnOpenSettings.addEventListener('click', () => {
        this.inputApiUrl.value = api.getBaseUrl();
        this.testApiConnection();
        this.openModal(this.settingsModal);
      });
    }
    if (this.btnCloseSettings) {
      this.btnCloseSettings.addEventListener('click', () => this.closeModal(this.settingsModal));
    }
    if (this.btnTestApi) {
      this.btnTestApi.addEventListener('click', () => this.testApiConnection(this.inputApiUrl.value));
    }
    if (this.btnSaveSettings) {
      this.btnSaveSettings.addEventListener('click', () => {
        api.setBaseUrl(this.inputApiUrl.value.trim());
        this.closeModal(this.settingsModal);
        this.showToast('Đã lưu cấu hình API Base URL!');
        this.checkApiHealth();
        this.loadSets();
      });
    }

    // Close modals on clicking backdrop
    [this.shortcutsModal, this.settingsModal, this.completionModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Handle History Popstate (Back/Forward browser buttons)
    window.addEventListener('popstate', () => {
      const shareId = this.detectShareIdFromUrl();
      if (shareId) {
        this.switchView('shared');
        this.sharedCtrl.loadSharedDeck(shareId);
      } else if (this.currentView === 'shared') {
        this.switchView(this.lastListView || 'sets');
      }
    });
  }

  async init() {
    await this.checkApiHealth();
    const shareId = this.detectShareIdFromUrl();
    if (shareId) {
      this.switchView('shared');
      await this.sharedCtrl.loadSharedDeck(shareId);
    } else {
      await this.loadSets();
    }
  }

  // ----------------------------------------------------
  // ROUTING & NAVIGATION (SPRINT 8: TASK F18)
  // ----------------------------------------------------
  detectShareIdFromUrl() {
    // 1. Pathname: /shared/:shareId
    const pathMatch = window.location.pathname.match(/\/shared\/([^\/\?#]+)/);
    if (pathMatch && pathMatch[1]) return decodeURIComponent(pathMatch[1]);

    // 2. Query param: ?shared=:shareId
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared')) return params.get('shared');

    // 3. Hash: #/shared/:shareId or #shared=:shareId
    const hash = window.location.hash;
    const hashMatch = hash.match(/#\/?shared\/([^\/\?#]+)/) || hash.match(/#shared=([^&]+)/);
    if (hashMatch && hashMatch[1]) return decodeURIComponent(hashMatch[1]);

    return null;
  }

  navigateToShared(shareId) {
    const shareUrl = `/shared/${encodeURIComponent(shareId)}`;
    try {
      window.history.pushState({ shareId }, '', shareUrl);
    } catch (e) {
      window.location.hash = `/shared/${encodeURIComponent(shareId)}`;
    }
    this.switchView('shared');
    this.sharedCtrl.loadSharedDeck(shareId);
  }

  // ----------------------------------------------------
  // API HEALTH CHECK
  // ----------------------------------------------------
  async checkApiHealth() {
    this.setApiStatus('checking', 'Đang kiểm tra API...');
    try {
      const res = await api.checkHealth();
      if (res && res.status === 'ok') {
        this.setApiStatus('connected', 'API Đã kết nối');
        return true;
      } else {
        this.setApiStatus('offline', 'API phản hồi không hợp lệ');
        return false;
      }
    } catch (err) {
      this.setApiStatus('offline', 'Backend Offline');
      return false;
    }
  }

  setApiStatus(state, label) {
    if (!this.apiStatusIndicator) return;
    const dot = this.apiStatusIndicator.querySelector('.status-dot');
    if (dot) {
      dot.className = `status-dot status-${state}`;
    }
    if (this.apiStatusText) {
      this.apiStatusText.textContent = label;
    }
  }

  async testApiConnection(customUrl) {
    if (customUrl) api.setBaseUrl(customUrl);
    if (this.settingsDebugStatus) {
      this.settingsDebugStatus.textContent = `Đang gửi GET ${api.getBaseUrl()}/health ...`;
    }
    try {
      const res = await api.checkHealth();
      if (this.settingsDebugStatus) {
        this.settingsDebugStatus.innerHTML = `<span style="color: var(--accent-emerald);">✔ Kết nối thành công: ${JSON.stringify(res)}</span>`;
      }
    } catch (err) {
      if (this.settingsDebugStatus) {
        this.settingsDebugStatus.innerHTML = `<span style="color: var(--accent-rose);">✖ Lỗi: [${err.code || 'ERR'}] ${err.message}</span>`;
      }
    }
  }

  // ----------------------------------------------------
  // VIEW SWITCHING (SPRINT 7: SETS / MY DECKS / DECK DETAIL / STUDY)
  // ----------------------------------------------------
  switchView(viewName) {
    if (this.currentView === 'study' && viewName !== 'study') {
      this.cleanupStudyModes();
    }
    this.currentView = viewName;

    if (this.viewSets) this.viewSets.classList.toggle('active', viewName === 'sets');
    if (this.viewMyDecks) this.viewMyDecks.classList.toggle('active', viewName === 'my-decks');
    if (this.viewDeckDetail) this.viewDeckDetail.classList.toggle('active', viewName === 'deck-detail');
    if (this.viewStudy) this.viewStudy.classList.toggle('active', viewName === 'study');
    if (this.viewSharedDeck) this.viewSharedDeck.classList.toggle('active', viewName === 'shared');

    if (this.navTabSets) this.navTabSets.classList.toggle('active', viewName === 'sets');
    if (this.navTabMyDecks) this.navTabMyDecks.classList.toggle('active', viewName === 'my-decks' || viewName === 'deck-detail');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'my-decks') {
      this.lastListView = 'my-decks';
      this.myDecksCtrl.loadDecks();
    } else if (viewName === 'sets') {
      this.lastListView = 'sets';
    }
  }

  /**
   * SPRINT 12 (Task F23): Dừng toàn bộ timer, audio và Web Speech API khi chuyển mode hoặc thoát study
   */
  cleanupStudyModes() {
    try {
      if (this.matchingCtrl && typeof this.matchingCtrl.stopTimer === 'function') {
        this.matchingCtrl.stopTimer();
      }
    } catch (_) {}

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}

    try {
      if (this.listeningCtrl && typeof this.listeningCtrl.cleanup === 'function') {
        this.listeningCtrl.cleanup();
      }
    } catch (_) {}

    try {
      if (this.mixedCtrl && typeof this.mixedCtrl.cleanup === 'function') {
        this.mixedCtrl.cleanup();
      }
    } catch (_) {}

    try {
      if (this.flashcardCtrl && typeof this.flashcardCtrl.stopAudio === 'function') {
        this.flashcardCtrl.stopAudio();
      }
    } catch (_) {}
  }

  /**
   * SPRINT 12 (Task F23): Switch between 7 study sub-modes with strict single-stage isolation
   * Mỗi tab chế độ chỉ hiện đúng 1 stage tương ứng + thanh mode bar; ẩn 6 stage còn lại, dừng timer/audio mode cũ
   */
  switchStudySubMode(subMode) {
    this.studySubMode = subMode;

    // 1. Dừng timer Matching, âm thanh Speech API / Audio từ mode cũ
    this.cleanupStudyModes();

    // 2. Ẩn toàn bộ 7 stages, chỉ hiện duy nhất stage tương ứng với subMode đang chọn
    const stages = [
      { id: 'flashcard', el: this.modeContainerFlashcard },
      { id: 'quiz', el: this.quizStage },
      { id: 'matching', el: this.matchingStage },
      { id: 'typing', el: this.typingStage },
      { id: 'listening', el: this.listeningStage },
      { id: 'cloze', el: this.clozeStage },
      { id: 'mixed', el: this.mixedStage },
    ];

    stages.forEach(({ id, el }) => {
      if (!el) return;
      const isActive = (id === subMode);
      el.classList.toggle('hidden', !isActive);
      el.style.display = isActive ? '' : 'none';
    });

    // 3. Cập nhật trạng thái active trên thanh chế độ học
    if (this.modeTabFlashcard) this.modeTabFlashcard.classList.toggle('active', subMode === 'flashcard');
    if (this.modeTabQuiz) this.modeTabQuiz.classList.toggle('active', subMode === 'quiz');
    if (this.modeTabMatching) this.modeTabMatching.classList.toggle('active', subMode === 'matching');
    if (this.modeTabTyping) this.modeTabTyping.classList.toggle('active', subMode === 'typing');
    if (this.modeTabListening) this.modeTabListening.classList.toggle('active', subMode === 'listening');
    if (this.modeTabCloze) this.modeTabCloze.classList.toggle('active', subMode === 'cloze');
    if (this.modeTabMixed) this.modeTabMixed.classList.toggle('active', subMode === 'mixed');

    // 4. Luôn đảm bảo thanh chế độ học (Learning Modes Bar) hiển thị
    if (this.learningModesBar) {
      this.learningModesBar.style.display = 'block';
      this.learningModesBar.classList.remove('hidden');
    }

    // 5. Khởi tạo dữ liệu cho sub-mode được chọn
    if (subMode === 'flashcard') {
      if (this.activeSet) {
        if (this.activeSet.isGroup) {
          this.updateLocalStats(this.flashcardCtrl.cards.length);
        } else {
          this.loadProgressStats(this.activeSet.id);
        }
      }
    } else if (subMode === 'quiz') {
      if (this.activeSet) {
        if (this.activeSet.isGroup) {
          if (this.flashcardCtrl.cards && this.flashcardCtrl.cards.length >= 2) {
            this.quizCtrl.setId = this.activeSet.id;
            this.quizCtrl.fallbackCards = this.flashcardCtrl.cards;
            this.quizCtrl.questions = this.quizCtrl.generateFallbackQuiz(this.flashcardCtrl.cards);
            this.quizCtrl.startQuizSession();
          } else {
            this.quizCtrl.showState('empty');
          }
        } else {
          this.quizCtrl.loadQuiz(this.activeSet.id, null, this.flashcardCtrl.cards);
        }
      }
    } else if (subMode === 'matching') {
      if (this.activeSet) {
        if (this.activeSet.isGroup) {
          if (this.flashcardCtrl.cards && this.flashcardCtrl.cards.length >= 2) {
            this.matchingCtrl.setId = this.activeSet.id;
            this.matchingCtrl.fallbackCards = this.flashcardCtrl.cards;
            this.matchingCtrl.stopTimer();
            this.matchingCtrl.pairs = this.matchingCtrl.generateFallbackPairs(this.flashcardCtrl.cards, 6);
            this.matchingCtrl.startBoard();
          } else {
            this.matchingCtrl.showState('empty');
          }
        } else {
          this.matchingCtrl.loadMatching(this.activeSet.id, 6, this.flashcardCtrl.cards);
        }
      }
    } else if (subMode === 'typing') {
      if (this.activeSet) {
        this.typingCtrl.startSession(this.flashcardCtrl.cards, this.activeSet.id);
      }
    } else if (subMode === 'listening') {
      if (this.activeSet) {
        this.listeningCtrl.startSession(this.flashcardCtrl.cards, this.activeSet.id);
      }
    } else if (subMode === 'cloze') {
      if (this.activeSet) {
        this.clozeCtrl.startSession(this.flashcardCtrl.cards, this.activeSet.id);
      }
    } else if (subMode === 'mixed') {
      if (this.activeSet) {
        this.mixedCtrl.startSession(this.flashcardCtrl.cards, this.activeSet.id);
      }
    }
  }

  // ----------------------------------------------------
  // SETS VIEW CONTROLLER
  // ----------------------------------------------------
  async loadSets() {
    this.setsLoading.classList.remove('hidden');
    this.setsEmpty.classList.add('hidden');
    this.setsError.classList.add('hidden');
    this.setsContainer.innerHTML = '';

    try {
      const sets = await api.getSets();
      this.sets = sets || [];
      this.filteredSets = [...this.sets];

      this.setsLoading.classList.add('hidden');

      if (this.sets.length === 0) {
        this.setsEmpty.classList.remove('hidden');
      } else {
        this.renderSets(this.filteredSets);
      }
      this.checkApiHealth();
    } catch (err) {
      this.setsLoading.classList.add('hidden');
      this.setsError.classList.remove('hidden');
      this.setsErrorTitle.textContent = 'Không thể tải danh sách bộ từ';
      this.setsErrorDesc.textContent = err.message || 'Lỗi mạng hoặc server không phản hồi.';
      this.setsErrorCode.textContent = `Mã lỗi: ${err.code || 'UNKNOWN_ERROR'}`;
      this.checkApiHealth();
    }
  }

  filterSets(keyword) {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      this.filteredSets = [...this.sets];
    } else {
      this.filteredSets = this.sets.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    this.renderSets(this.filteredSets);
  }

  renderSets(sets) {
    this.setsContainer.innerHTML = '';

    if (sets.length === 0) {
      this.setsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          Không tìm thấy bộ từ vựng nào khớp với từ khóa tìm kiếm.
        </div>
      `;
      return;
    }

    sets.forEach(set => {
      const card = document.createElement('div');
      card.className = 'set-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <div>
          <div class="set-card-header">
            <span class="badge badge-lang">${escapeHtml(set.language || 'en-vi')}</span>
            <span class="badge badge-count">${escapeHtml(String(set.cardCount || 0))} thẻ</span>
          </div>
          <h3 class="set-card-title" style="margin-top: 0.75rem;">${escapeHtml(set.title || 'Bộ từ vựng')}</h3>
          <p class="set-card-desc" style="margin-top: 0.5rem;">${escapeHtml(set.description || 'Chưa có mô tả.')}</p>
        </div>
        <div class="set-card-footer">
          <span class="set-card-meta">Nhấn để bắt đầu</span>
          <span class="set-card-cta">
            Học ngay
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </div>
      `;

      card.addEventListener('click', () => this.startStudy(set));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.startStudy(set);
        }
      });

      this.setsContainer.appendChild(card);
    });
  }

  // ----------------------------------------------------
  // STUDY VIEW CONTROLLER (SPRINT 2 & 3)
  // ----------------------------------------------------
  async startStudy(set) {
    this.activeSet = set;
    this.switchView('study');

    // Update back button text if in deck detail view or my decks view
    if (this.btnBackToSets) {
      const span = this.btnBackToSets.querySelector('span');
      if (span) {
        if (this.lastListView === 'deck-detail') {
          span.textContent = 'Quay lại nhóm thẻ';
        } else if (this.lastListView === 'my-decks') {
          span.textContent = 'Quay lại Bộ thẻ của tôi';
        } else {
          span.textContent = 'Quay lại danh sách';
        }
      }
    }

    // Default to flashcard sub-mode
    this.switchStudySubMode('flashcard');

    // Header info
    if (this.studySetTitle) this.studySetTitle.textContent = set.title || 'Bộ từ vựng';
    if (this.studySetLang) this.studySetLang.textContent = set.language || 'en-vi';

    // State handling
    this.studyLoading.classList.remove('hidden');
    this.studyEmpty.classList.add('hidden');
    this.studyError.classList.add('hidden');
    [
      this.modeContainerFlashcard,
      this.quizStage,
      this.matchingStage,
      this.typingStage,
      this.listeningStage,
      this.clozeStage,
      this.mixedStage
    ].forEach(el => {
      if (el) {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    });
    if (this.learningModesBar) {
      this.learningModesBar.style.display = 'none';
      this.learningModesBar.classList.add('hidden');
    }

    try {
      // 1. Fetch cards for this set (or use preloaded cards if provided from group / shared deck)
      let cards = set.cards;
      if (!cards || cards.length === 0) {
        const res = await api.getCards(set.id);
        cards = res.cards || [];
      }

      this.studyLoading.classList.add('hidden');

      if (!cards || cards.length === 0) {
        this.studyEmpty.classList.remove('hidden');
        return;
      }

      if (this.modeContainerFlashcard) {
        this.modeContainerFlashcard.classList.remove('hidden');
        this.modeContainerFlashcard.style.display = '';
      }
      if (this.learningModesBar) {
        this.learningModesBar.style.display = 'block';
        this.learningModesBar.classList.remove('hidden');
      }

      // 2. Fetch progress stats from GET /progress/:setId (hoặc tính local nếu học theo nhóm)
      if (set.isGroup) {
        this.updateLocalStats(cards.length);
      } else {
        await this.loadProgressStats(set.id, cards.length);
      }

      // 3. Load cards into controller
      this.flashcardCtrl.loadCards(cards, set);
    } catch (err) {
      this.studyLoading.classList.add('hidden');
      this.studyError.classList.remove('hidden');
      this.studyErrorCode.textContent = `Mã lỗi: ${err.code || 'UNKNOWN_ERROR'}`;
      this.studyErrorDesc.textContent = err.message || 'Không thể lấy dữ liệu thẻ từ API.';
    }
  }

  /**
   * SPRINT 2 (Task F5): Load progress stats from GET /progress/:setId
   */
  async loadProgressStats(setId, fallbackTotal = 0) {
    try {
      const stats = await api.getProgress(setId);
      if (stats) {
        this.currentStats = stats;
        this.renderStatsBar(stats.mastered, stats.review, stats.unseen, stats.total);
        return;
      }
    } catch (err) {
      this.updateLocalStats(fallbackTotal);
    }
  }

  updateLocalStats(overrideTotal) {
    const total = overrideTotal || this.flashcardCtrl.cards.length || 0;
    let mastered = 0;
    let review = 0;

    for (const [_, level] of this.flashcardCtrl.cardRatings.entries()) {
      if (level === 'remembered' || level === 'mastered') {
        mastered++;
      } else if (level === 'forgot' || level === 'vague') {
        review++;
      }
    }

    const unseen = Math.max(0, total - (mastered + review));
    this.renderStatsBar(mastered, review, unseen, total);
  }

  renderStatsBar(mastered = 0, review = 0, unseen = 0, total = 0) {
    if (this.statCountMastered) this.statCountMastered.textContent = String(mastered);
    if (this.statCountReview) this.statCountReview.textContent = String(review);
    if (this.statCountUnseen) this.statCountUnseen.textContent = String(unseen);
    if (this.statsTotalText) this.statsTotalText.textContent = `Tổng số: ${total} thẻ`;

    if (total > 0) {
      const masteredPct = (mastered / total) * 100;
      const reviewPct = (review / total) * 100;
      const unseenPct = (unseen / total) * 100;

      if (this.segMastered) this.segMastered.style.width = `${masteredPct.toFixed(1)}%`;
      if (this.segReview) this.segReview.style.width = `${reviewPct.toFixed(1)}%`;
      if (this.segUnseen) this.segUnseen.style.width = `${unseenPct.toFixed(1)}%`;
    } else {
      if (this.segMastered) this.segMastered.style.width = '0%';
      if (this.segReview) this.segReview.style.width = '0%';
      if (this.segUnseen) this.segUnseen.style.width = '100%';
    }
  }

  /**
   * SPRINT 2 (Task F6): Call POST /progress when rating a card
   */
  async handleCardRating({ cardId, setId, level }) {
    try {
      await api.saveProgress({ cardId, setId, level });
      if (this.activeSet && this.activeSet.isGroup) {
        this.updateLocalStats(this.flashcardCtrl.cards.length);
      } else {
        await this.loadProgressStats(setId);
      }
    } catch (err) {
      console.warn('POST /progress warning:', err.message);
      this.updateLocalStats();
      this.showToast(`Đánh giá cục bộ (${err.code || 'OFFLINE'}): ${level}`);
    }
  }

  // ----------------------------------------------------
  // MODALS & NOTIFICATIONS
  // ----------------------------------------------------
  showCompletionModal(data) {
    if (this.completionText) {
      const targetName = data.set?.isGroup ? `nhóm từ "${data.set?.groupTitle || data.set?.title || ''}"` : `bộ từ vựng "${data.set?.title || ''}"`;
      this.completionText.textContent = `Bạn đã hoàn thành toàn bộ ${data.total} thẻ trong ${targetName}.`;
    }
    if (this.btnModalBackSets) {
      this.btnModalBackSets.textContent = (this.lastListView === 'deck-detail' ? 'Quay lại nhóm thẻ' : 'Về danh sách bộ từ');
    }
    if (this.compStatTotal) {
      this.compStatTotal.textContent = String(data.total);
    }

    let masteredCount = 0;
    if (data.ratings) {
      for (const level of Object.values(data.ratings)) {
        if (level === 'remembered' || level === 'mastered') masteredCount++;
      }
    }
    if (this.compStatMastered) {
      this.compStatMastered.textContent = String(masteredCount);
    }

    this.openModal(this.completionModal);
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <span>${escapeHtml(message)}</span>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3200);
  }

  // ----------------------------------------------------
  // KEYBOARD SHORTCUTS (SPRINT 2 & 3)
  // ----------------------------------------------------
  handleKeyboardShortcuts(e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }

    if (e.key === 'Escape') {
      [this.shortcutsModal, this.settingsModal, this.completionModal].forEach(m => this.closeModal(m));
      return;
    }

    if (e.key.toLowerCase() === 'h') {
      e.preventDefault();
      this.openModal(this.shortcutsModal);
      return;
    }

    // Study view shortcuts
    if (this.currentView === 'study') {
      // 1. QUIZ SUB-MODE SHORTCUTS
      if (this.studySubMode === 'quiz') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          this.quizCtrl.handleKeyInput(Number(e.key));
        } else if (e.code === 'Space' || e.key === 'Enter') {
          // If already answered, Space or Enter proceeds to next question
          if (this.quizCtrl.isAnswered) {
            e.preventDefault();
            this.quizCtrl.nextQuestion();
          }
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          this.quizCtrl.pronounceCurrentPrompt();
        }
        return;
      }

      // 2. MATCHING SUB-MODE SHORTCUTS (SPRINT 4)
      if (this.studySubMode === 'matching') {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.matchingCtrl.restart();
        }
        return;
      }

      // 3. TYPING SUB-MODE SHORTCUTS (SPRINT 5)
      if (this.studySubMode === 'typing') {
        if (e.key.toLowerCase() === 'p' && document.activeElement !== this.typingCtrl.typingInput) {
          e.preventDefault();
          this.typingCtrl.pronounceCurrentCard();
        }
        return;
      }

      // 4. LISTENING SUB-MODE SHORTCUTS (SPRINT 5)
      if (this.studySubMode === 'listening') {
        if ((e.code === 'Space' || e.key.toLowerCase() === 'p') && document.activeElement !== this.listeningCtrl.listeningInput) {
          e.preventDefault();
          this.listeningCtrl.playCurrentAudio(0.95);
        }
        return;
      }

      // 5. CLOZE SUB-MODE SHORTCUTS (SPRINT 6: TASK F13)
      if (this.studySubMode === 'cloze') {
        if (e.key.toLowerCase() === 'p' && document.activeElement !== this.clozeCtrl.clozeInput) {
          e.preventDefault();
          this.clozeCtrl.pronounceCurrentWord();
        }
        return;
      }

      // 6. MIXED SUB-MODE SHORTCUTS (SPRINT 6: TASK F14)
      if (this.studySubMode === 'mixed') {
        if (['1', '2', '3', '4'].includes(e.key) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          this.mixedCtrl.handleKeyInput(Number(e.key));
        } else if (e.key.toLowerCase() === 'p' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          this.mixedCtrl.pronounceCurrentWord();
        }
        return;
      }

      // 7. FLASHCARD SUB-MODE SHORTCUTS
      if (this.studySubMode === 'flashcard') {
        if (e.key === '1') {
          e.preventDefault();
          this.flashcardCtrl.rateCurrentCard('forgot');
        } else if (e.key === '2') {
          e.preventDefault();
          this.flashcardCtrl.rateCurrentCard('vague');
        } else if (e.key === '3') {
          e.preventDefault();
          this.flashcardCtrl.rateCurrentCard('remembered');
        } else if (e.key === '4') {
          e.preventDefault();
          this.flashcardCtrl.rateCurrentCard('mastered');
        } else if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          this.flashcardCtrl.flip();
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
          e.preventDefault();
          this.flashcardCtrl.next();
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
          e.preventDefault();
          this.flashcardCtrl.prev();
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          this.flashcardCtrl.shuffle();
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          this.flashcardCtrl.pronounceCurrentCard();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.flashcardCtrl.restart();
        }
      }
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.vocabApp = new VocabApp();
});
