/**
 * ========================================================
 * VOCABMASTER - MATCHING CONTROLLER (MATCHING.JS)
 * Sprint 4: Mode Ghép thẻ (Task F9 & F10)
 * Strictly conforms to contexte/API_CONTRACT.md §7 Matching
 * ========================================================
 */

import { api } from './api.js';

export class MatchingController {
  constructor(options = {}) {
    this.setId = null;
    this.pairs = [];
    this.termTiles = [];
    this.defTiles = [];
    this.selectedTermId = null;
    this.selectedDefId = null;
    this.matchedCount = 0;
    this.mistakesCount = 0;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isChecking = false;
    this.fallbackCards = [];

    // Callbacks
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onBackToFlashcard = options.onBackToFlashcard || (() => {});
    this.onBackToSets = options.onBackToSets || (() => {});

    this.bindDomElements();
    this.initEvents();
  }

  bindDomElements() {
    this.matchingStage = document.getElementById('matching-stage');
    this.matchingTimer = document.getElementById('matching-timer');
    this.matchingMistakes = document.getElementById('matching-mistakes');
    this.matchingPairsCount = document.getElementById('matching-pairs-count');
    this.matchingProgressBar = document.getElementById('matching-progress-bar');

    // States
    this.matchingLoading = document.getElementById('matching-loading');
    this.matchingError = document.getElementById('matching-error');
    this.matchingErrorDesc = document.getElementById('matching-error-desc');
    this.matchingErrorCode = document.getElementById('matching-error-code');
    this.btnRetryMatching = document.getElementById('btn-retry-matching');

    this.matchingEmpty = document.getElementById('matching-empty');
    this.btnEmptyMatchingBack = document.getElementById('btn-empty-matching-back');

    // Board
    this.matchingBoardWrapper = document.getElementById('matching-board-wrapper');
    this.matchingTermsList = document.getElementById('matching-terms-list');
    this.matchingDefinitionsList = document.getElementById('matching-definitions-list');

    // Header actions
    this.btnRestartMatching = document.getElementById('btn-restart-matching');
    this.btnMatchingToFlashcard = document.getElementById('btn-matching-to-flashcard');

    // Result screen
    this.matchingResultWrapper = document.getElementById('matching-result-wrapper');
    this.matchingResultBadge = document.getElementById('matching-result-badge');
    this.resMatchingTime = document.getElementById('res-matching-time');
    this.resMatchingMistakes = document.getElementById('res-matching-mistakes');
    this.resMatchingPairs = document.getElementById('res-matching-pairs');
    this.matchingResultDesc = document.getElementById('matching-result-desc');
    this.btnMatchingPlayAgain = document.getElementById('btn-matching-play-again');
    this.btnMatchingBackFlashcard = document.getElementById('btn-matching-back-flashcard');
    this.btnMatchingBackSets = document.getElementById('btn-matching-back-sets');
  }

  initEvents() {
    if (this.btnRetryMatching) {
      this.btnRetryMatching.addEventListener('click', () => {
        if (this.setId) this.loadMatching(this.setId, 6, this.fallbackCards);
      });
    }

    if (this.btnEmptyMatchingBack) {
      this.btnEmptyMatchingBack.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnRestartMatching) {
      this.btnRestartMatching.addEventListener('click', () => this.restart());
    }

    if (this.btnMatchingToFlashcard) {
      this.btnMatchingToFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnMatchingPlayAgain) {
      this.btnMatchingPlayAgain.addEventListener('click', () => {
        if (this.setId) this.loadMatching(this.setId, 6, this.fallbackCards);
      });
    }

    if (this.btnMatchingBackFlashcard) {
      this.btnMatchingBackFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnMatchingBackSets) {
      this.btnMatchingBackSets.addEventListener('click', () => this.onBackToSets());
    }
  }

  /**
   * SPRINT 4 (Task F10): Tải dữ liệu ghép thẻ từ GET /matching/:setId?count=
   * Có đủ 3 trạng thái: Loading, Empty, Error
   */
  async loadMatching(setId, count = 6, fallbackCards = []) {
    this.setId = setId;
    this.fallbackCards = fallbackCards || [];
    this.stopTimer();

    // Reset UI states
    this.showState('loading');

    try {
      // Gọi đúng API theo Contract §7: GET /matching/:setId?count=
      const res = await api.getMatching(setId, count);
      let pairs = res.pairs || [];

      // Nếu backend trả rỗng hoặc < 2 cặp nhưng có fallbackCards (trường hợp backend chưa hỗ trợ đầy đủ)
      if (pairs.length < 2 && this.fallbackCards.length >= 2) {
        console.warn('[MatchingController] Backend returned insufficient pairs, generating from cards fallback.');
        pairs = this.generateFallbackPairs(this.fallbackCards, count);
      }

      if (pairs.length === 0) {
        this.showState('empty');
        return;
      }

      this.pairs = pairs;
      this.startBoard();
    } catch (err) {
      console.warn('[MatchingController] Error calling GET /matching:', err);

      // Nếu lỗi do route backend chưa triển khai (404/500/NETWORK_ERROR) nhưng đã có cards fallback
      if (this.fallbackCards && this.fallbackCards.length >= 2) {
        this.onToast('Đang tạo ván ghép thẻ từ danh sách thẻ của bộ từ.');
        this.pairs = this.generateFallbackPairs(this.fallbackCards, count);
        this.startBoard();
        return;
      }

      // Hiển thị Error State chuẩn Contract
      this.showState('error');
      if (this.matchingErrorDesc) {
        this.matchingErrorDesc.textContent = err.message || 'Lỗi trong quá trình lấy danh sách thẻ ghép từ API.';
      }
      if (this.matchingErrorCode) {
        this.matchingErrorCode.textContent = `Mã lỗi: ${err.code || 'UNKNOWN_ERROR'}`;
      }
    }
  }

  /**
   * Sinh danh sách MatchingPair từ danh sách thẻ khi backend chưa có dữ liệu
   * Tuân thủ đúng format schema: { cardId, term, definition }
   */
  generateFallbackPairs(cards, count = 6) {
    if (!cards || cards.length === 0) return [];

    // Lọc các thẻ có nghĩa
    const validCards = cards.filter(c => c && c.front && (c.meaning || c.back));
    const shuffled = this.shuffleArray([...validCards]);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map(c => ({
      cardId: String(c.id),
      term: c.front,
      definition: c.meaning || c.back
    }));
  }

  /**
   * SPRINT 4 (Task F9): Bắt đầu bàn ghép thẻ mới
   * Xáo trộn độc lập 2 cột từ và nghĩa, khởi tạo bộ đếm giờ và bộ đếm lỗi
   */
  startBoard() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.mistakesCount = 0;
    this.matchedCount = 0;
    this.selectedTermId = null;
    this.selectedDefId = null;
    this.isChecking = false;

    // Chuẩn bị các tile cho Cột 1 (Từ vựng tiếng Anh)
    this.termTiles = this.pairs.map((p, idx) => ({
      id: `term_${idx}_${p.cardId}`,
      cardId: p.cardId,
      text: p.term,
      type: 'term',
      matched: false,
      selected: false
    }));

    // Chuẩn bị các tile cho Cột 2 (Định nghĩa tiếng Việt)
    this.defTiles = this.pairs.map((p, idx) => ({
      id: `def_${idx}_${p.cardId}`,
      cardId: p.cardId,
      text: p.definition,
      type: 'definition',
      matched: false,
      selected: false
    }));

    // Xáo trộn ngẫu nhiên độc lập 2 cột
    this.termTiles = this.shuffleArray(this.termTiles);
    this.defTiles = this.shuffleArray(this.defTiles);

    // Cập nhật DOM
    this.updateStatsDisplay();
    this.renderBoard();
    this.showState('board');

    // Bắt đầu đếm thời gian
    this.startTimer();
  }

  renderBoard() {
    if (!this.matchingTermsList || !this.matchingDefinitionsList) return;

    // Render Cột Từ vựng
    this.matchingTermsList.innerHTML = '';
    this.termTiles.forEach(tile => {
      const tileEl = this.createTileElement(tile);
      this.matchingTermsList.appendChild(tileEl);
    });

    // Render Cột Định nghĩa
    this.matchingDefinitionsList.innerHTML = '';
    this.defTiles.forEach(tile => {
      const tileEl = this.createTileElement(tile);
      this.matchingDefinitionsList.appendChild(tileEl);
    });
  }

  createTileElement(tile) {
    const el = document.createElement('div');
    el.className = 'matching-tile';
    el.id = tile.id;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.dataset.type = tile.type;
    el.dataset.cardId = tile.cardId;

    if (tile.matched) {
      el.classList.add('matched');
      el.setAttribute('aria-disabled', 'true');
    }
    if (tile.selected) {
      el.classList.add('selected');
    }

    el.innerHTML = `
      <div class="tile-content">
        <span class="tile-text">${escapeHtml(tile.text)}</span>
      </div>
      <div class="tile-status-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    `;

    // Click handler
    el.addEventListener('click', () => this.handleTileClick(tile.type, tile.id));

    // Keyboard accessibility (Enter / Space)
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleTileClick(tile.type, tile.id);
      }
    });

    return el;
  }

  /**
   * SPRINT 4 (Task F9): Xử lý bấm cặp để nối
   */
  handleTileClick(type, tileId) {
    if (this.isChecking) return;

    const list = type === 'term' ? this.termTiles : this.defTiles;
    const tile = list.find(t => t.id === tileId);
    if (!tile || tile.matched) return;

    if (type === 'term') {
      // Nếu bấm lại chính tile đang chọn -> Bỏ chọn
      if (this.selectedTermId === tileId) {
        this.selectedTermId = null;
        tile.selected = false;
        this.updateTileDom(tileId, { selected: false });
        return;
      }

      // Bỏ chọn thẻ từ cũ nếu có
      if (this.selectedTermId) {
        const oldTile = this.termTiles.find(t => t.id === this.selectedTermId);
        if (oldTile) {
          oldTile.selected = false;
          this.updateTileDom(oldTile.id, { selected: false });
        }
      }

      // Chọn thẻ từ mới
      this.selectedTermId = tileId;
      tile.selected = true;
      this.updateTileDom(tileId, { selected: true });

    } else {
      // Definition tile
      // Nếu bấm lại chính tile đang chọn -> Bỏ chọn
      if (this.selectedDefId === tileId) {
        this.selectedDefId = null;
        tile.selected = false;
        this.updateTileDom(tileId, { selected: false });
        return;
      }

      // Bỏ chọn thẻ nghĩa cũ nếu có
      if (this.selectedDefId) {
        const oldTile = this.defTiles.find(t => t.id === this.selectedDefId);
        if (oldTile) {
          oldTile.selected = false;
          this.updateTileDom(oldTile.id, { selected: false });
        }
      }

      // Chọn thẻ nghĩa mới
      this.selectedDefId = tileId;
      tile.selected = true;
      this.updateTileDom(tileId, { selected: true });
    }

    // Nếu đã chọn đủ 1 thẻ từ và 1 thẻ nghĩa -> Kiểm tra ghép cặp
    if (this.selectedTermId && this.selectedDefId) {
      this.checkPairMatch();
    }
  }

  checkPairMatch() {
    const termTile = this.termTiles.find(t => t.id === this.selectedTermId);
    const defTile = this.defTiles.find(t => t.id === this.selectedDefId);
    if (!termTile || !defTile) return;

    const isMatch = termTile.cardId === defTile.cardId;

    if (isMatch) {
      // ==========================================
      // GHÉP ĐÚNG (MATCHED)
      // ==========================================
      termTile.matched = true;
      defTile.matched = true;
      termTile.selected = false;
      defTile.selected = false;

      this.updateTileDom(termTile.id, { selected: false, matched: true, feedback: 'success' });
      this.updateTileDom(defTile.id, { selected: false, matched: true, feedback: 'success' });

      this.selectedTermId = null;
      this.selectedDefId = null;
      this.matchedCount++;

      this.updateStatsDisplay();

      // Kiểm tra hoàn thành toàn bộ bàn ghép
      if (this.matchedCount === this.pairs.length) {
        this.stopTimer();
        setTimeout(() => {
          this.showCompletionScreen();
        }, 600);
      }
    } else {
      // ==========================================
      // GHÉP SAI (MISMATCHED)
      // ==========================================
      this.isChecking = true;
      this.mistakesCount++;
      this.updateStatsDisplay();

      const termEl = document.getElementById(termTile.id);
      const defEl = document.getElementById(defTile.id);

      if (termEl) termEl.classList.add('mismatched');
      if (defEl) defEl.classList.add('mismatched');

      // Sau 650ms reset lại lựa chọn và hiệu ứng rung
      setTimeout(() => {
        if (termEl) termEl.classList.remove('mismatched', 'selected');
        if (defEl) defEl.classList.remove('mismatched', 'selected');

        termTile.selected = false;
        defTile.selected = false;
        this.selectedTermId = null;
        this.selectedDefId = null;
        this.isChecking = false;
      }, 650);
    }
  }

  updateTileDom(tileId, options = {}) {
    const el = document.getElementById(tileId);
    if (!el) return;

    if (options.selected !== undefined) {
      el.classList.toggle('selected', options.selected);
    }
    if (options.matched !== undefined) {
      el.classList.toggle('matched', options.matched);
      if (options.matched) {
        el.setAttribute('aria-disabled', 'true');
      }
    }
    if (options.feedback === 'success') {
      el.classList.add('match-pop');
      setTimeout(() => el.classList.remove('match-pop'), 400);
    }
  }

  updateStatsDisplay() {
    const total = this.pairs.length;
    if (this.matchingMistakes) {
      this.matchingMistakes.textContent = String(this.mistakesCount);
    }
    if (this.matchingPairsCount) {
      this.matchingPairsCount.textContent = `${this.matchedCount} / ${total}`;
    }
    if (this.matchingProgressBar) {
      const pct = total > 0 ? (this.matchedCount / total) * 100 : 0;
      this.matchingProgressBar.style.width = `${pct}%`;
    }
  }

  // ----------------------------------------------------
  // TIMER (ĐẾM GIỜ)
  // ----------------------------------------------------
  startTimer() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  cleanup() {
    this.stopTimer();
  }

  updateTimerDisplay() {
    if (!this.matchingTimer) return;
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.matchingTimer.textContent = formatted;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // ----------------------------------------------------
  // MÀN HÌNH HOÀN THÀNH (COMPLETION SCREEN)
  // ----------------------------------------------------
  showCompletionScreen() {
    this.showState('result');

    const total = this.pairs.length;
    const timeFormatted = this.formatTime(this.timerSeconds);

    if (this.resMatchingTime) this.resMatchingTime.textContent = timeFormatted;
    if (this.resMatchingMistakes) this.resMatchingMistakes.textContent = `${this.mistakesCount} lỗi`;
    if (this.resMatchingPairs) this.resMatchingPairs.textContent = `${this.matchedCount} / ${total}`;

    // Đánh giá thành tích
    let badgeText = 'Xuất sắc! 🔥';
    let badgeClass = 'badge-result-excellent';
    let descText = 'Trí nhớ tuyệt vời! Bạn đã ghép chính xác tất cả các cặp từ trong thời gian ngắn.';

    if (this.mistakesCount === 0) {
      badgeText = 'Hoàn hảo tuyệt đối! 🌟';
      badgeClass = 'badge-result-perfect';
      descText = 'Không một lỗi sai! Bạn đã ghi nhớ từ vựng cực kỳ chuẩn xác và phản xạ siêu nhanh.';
    } else if (this.mistakesCount <= 2) {
      badgeText = 'Xuất sắc! 🔥';
      badgeClass = 'badge-result-excellent';
      descText = `Bạn đã hoàn thành ghép ${total} cặp từ trong ${timeFormatted} với rất ít lần nhầm lẫn.`;
    } else if (this.mistakesCount <= 4) {
      badgeText = 'Khá tốt! 👍';
      badgeClass = 'badge-result-good';
      descText = 'Bạn đã ghép đúng tất cả các thẻ. Hãy tiếp tục luyện tập để cải thiện thời gian và giảm số lỗi nhé!';
    } else {
      badgeText = 'Cần ôn thêm! 💪';
      badgeClass = 'badge-result-practice';
      descText = 'Bạn đã hoàn thành thử thách! Hãy ôn tập lại thẻ qua chế độ Lật thẻ để ghi nhớ chắc hơn.';
    }

    if (this.matchingResultBadge) {
      this.matchingResultBadge.textContent = badgeText;
      this.matchingResultBadge.className = `matching-result-badge ${badgeClass}`;
    }
    if (this.matchingResultDesc) {
      this.matchingResultDesc.textContent = descText;
    }
  }

  restart() {
    if (this.pairs && this.pairs.length > 0) {
      this.startBoard();
    } else if (this.setId) {
      this.loadMatching(this.setId, 6, this.fallbackCards);
    }
  }

  // ----------------------------------------------------
  // STATE MANAGEMENT HELPER
  // ----------------------------------------------------
  showState(stateName) {
    if (this.matchingLoading) this.matchingLoading.classList.add('hidden');
    if (this.matchingError) this.matchingError.classList.add('hidden');
    if (this.matchingEmpty) this.matchingEmpty.classList.add('hidden');
    if (this.matchingBoardWrapper) this.matchingBoardWrapper.classList.add('hidden');
    if (this.matchingResultWrapper) this.matchingResultWrapper.classList.add('hidden');

    switch (stateName) {
      case 'loading':
        if (this.matchingLoading) this.matchingLoading.classList.remove('hidden');
        break;
      case 'error':
        if (this.matchingError) this.matchingError.classList.remove('hidden');
        break;
      case 'empty':
        if (this.matchingEmpty) this.matchingEmpty.classList.remove('hidden');
        break;
      case 'board':
        if (this.matchingBoardWrapper) this.matchingBoardWrapper.classList.remove('hidden');
        break;
      case 'result':
        if (this.matchingResultWrapper) this.matchingResultWrapper.classList.remove('hidden');
        break;
    }
  }

  // Fisher-Yates Shuffle
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
