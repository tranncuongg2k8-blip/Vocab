/**
 * ========================================================
 * VOCABMASTER - LISTENING CONTROLLER (LISTENING.JS)
 * Sprint 5: Mode Nghe–Viết (Task F12)
 * Phát âm bằng Speech API -> Gõ lại từ EN, chấm điểm + màn hình kết quả
 * ========================================================
 */

import { api } from './api.js';

export class ListeningController {
  constructor(options = {}) {
    this.setId = null;
    this.cards = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    // Callbacks
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onBackToFlashcard = options.onBackToFlashcard || (() => {});
    this.onSwitchToTyping = options.onSwitchToTyping || (() => {});
    this.onBackToSets = options.onBackToSets || (() => {});

    this.bindDomElements();
    this.initEvents();
  }

  bindDomElements() {
    this.listeningStage = document.getElementById('listening-stage');
    this.listeningProgressText = document.getElementById('listening-progress-text');
    this.listeningScoreTracker = document.getElementById('listening-score-tracker');
    this.listeningProgressBar = document.getElementById('listening-progress-bar');

    // States
    this.listeningLoading = document.getElementById('listening-loading');
    this.listeningEmpty = document.getElementById('listening-empty');
    this.listeningError = document.getElementById('listening-error');
    this.btnEmptyListeningBack = document.getElementById('btn-empty-listening-back');
    this.btnRetryListening = document.getElementById('btn-retry-listening');

    // Card & Audio controls
    this.listeningCardWrapper = document.getElementById('listening-card-wrapper');
    this.btnAudioMain = document.getElementById('btn-listening-audio-main');
    this.btnAudioSlow = document.getElementById('btn-listening-audio-slow');
    this.listeningSoundwave = document.getElementById('listening-soundwave');
    this.listeningMeaningHint = document.getElementById('listening-meaning-hint');
    this.listeningInput = document.getElementById('listening-input');
    this.btnListeningSubmit = document.getElementById('btn-listening-submit');
    this.listeningFeedback = document.getElementById('listening-feedback');
    this.btnListeningNext = document.getElementById('btn-listening-next');

    // Result screen
    this.listeningResultWrapper = document.getElementById('listening-result-wrapper');
    this.listeningResultBadge = document.getElementById('listening-result-badge');
    this.listeningResultScore = document.getElementById('listening-result-score');
    this.listeningResultPercent = document.getElementById('listening-result-percent');
    this.listeningResultDesc = document.getElementById('listening-result-desc');
    this.btnListeningRetry = document.getElementById('btn-listening-retry');
    this.btnListeningToTyping = document.getElementById('btn-listening-to-typing');
    this.btnListeningBackFlashcard = document.getElementById('btn-listening-back-flashcard');
    this.btnListeningBackSets = document.getElementById('btn-listening-back-sets');
  }

  initEvents() {
    if (this.btnAudioMain) {
      this.btnAudioMain.addEventListener('click', () => this.playCurrentAudio(0.95));
    }

    if (this.btnAudioSlow) {
      this.btnAudioSlow.addEventListener('click', () => this.playCurrentAudio(0.65));
    }

    if (this.btnListeningSubmit) {
      this.btnListeningSubmit.addEventListener('click', () => this.checkAnswer());
    }

    if (this.listeningInput) {
      this.listeningInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (this.isAnswered) {
            this.nextCard();
          } else {
            this.checkAnswer();
          }
        }
      });
    }

    if (this.btnListeningNext) {
      this.btnListeningNext.addEventListener('click', () => this.nextCard());
    }

    if (this.btnEmptyListeningBack) {
      this.btnEmptyListeningBack.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnListeningRetry) {
      this.btnListeningRetry.addEventListener('click', () => this.startSession(this.cards, this.setId));
    }

    if (this.btnListeningToTyping) {
      this.btnListeningToTyping.addEventListener('click', () => this.onSwitchToTyping());
    }

    if (this.btnListeningBackFlashcard) {
      this.btnListeningBackFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnListeningBackSets) {
      this.btnListeningBackSets.addEventListener('click', () => this.onBackToSets());
    }
  }

  /**
   * Khởi chạy phiên Nghe–Viết với danh sách thẻ
   */
  startSession(cards, setId) {
    this.setId = setId;
    this.cards = cards || [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    if (!this.cards || this.cards.length === 0) {
      this.showState('empty');
      return;
    }

    this.showState('card');
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    const card = this.cards[this.currentIndex];
    if (!card) {
      this.showResults();
      return;
    }

    this.isAnswered = false;

    // Header info
    const total = this.cards.length;
    if (this.listeningProgressText) {
      this.listeningProgressText.textContent = `Câu ${this.currentIndex + 1} / ${total}`;
    }
    if (this.listeningScoreTracker) {
      this.listeningScoreTracker.textContent = `Điểm: ${this.score}`;
    }
    if (this.listeningProgressBar) {
      const pct = (this.currentIndex / total) * 100;
      this.listeningProgressBar.style.width = `${pct}%`;
    }

    // Gợi ý nghĩa ẩn (chỉ hiện khi click gợi ý hoặc sau khi trả lời)
    if (this.listeningMeaningHint) {
      this.listeningMeaningHint.innerHTML = `
        <span class="hint-toggle-text">💡 Gợi ý nghĩa: <span class="hint-blurred">${escapeHtml(card.meaning || card.back || '...')}</span></span>
      `;
    }

    // Reset Input & Feedback
    if (this.listeningInput) {
      this.listeningInput.value = '';
      this.listeningInput.disabled = false;
      this.listeningInput.className = 'typing-input';
      setTimeout(() => this.listeningInput.focus(), 150);
    }

    if (this.btnListeningSubmit) {
      this.btnListeningSubmit.classList.remove('hidden');
      this.btnListeningSubmit.disabled = false;
    }

    if (this.btnListeningNext) {
      this.btnListeningNext.classList.add('hidden');
    }

    if (this.listeningFeedback) {
      this.listeningFeedback.classList.add('hidden');
      this.listeningFeedback.innerHTML = '';
      this.listeningFeedback.className = 'typing-feedback hidden';
    }

    // Tự động phát âm từ tiếng Anh sau 350ms
    if (this.audioTimeout) clearTimeout(this.audioTimeout);
    this.audioTimeout = setTimeout(() => {
      this.playCurrentAudio(0.95);
    }, 350);
  }

  /**
   * SPRINT 12 (Task F23): Dọn dẹp âm thanh và animation khi chuyển mode
   */
  cleanup() {
    if (this.audioTimeout) {
      clearTimeout(this.audioTimeout);
      this.audioTimeout = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.listeningSoundwave) {
      this.listeningSoundwave.classList.remove('active');
    }
  }

  /**
   * SPRINT 5 (Task F12): Phát âm từ tiếng Anh bằng Web Speech API
   */
  playCurrentAudio(rate = 0.95) {
    const card = this.cards[this.currentIndex];
    if (!card || !card.front) return;

    if (!('speechSynthesis' in window)) {
      this.onToast('Trình duyệt không hỗ trợ Web Speech API.');
      return;
    }

    window.speechSynthesis.cancel();

    // Hiệu ứng sóng âm
    if (this.listeningSoundwave) {
      this.listeningSoundwave.classList.add('active');
    }

    const utterance = new SpeechSynthesisUtterance(card.front);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    utterance.onend = () => {
      if (this.listeningSoundwave) {
        this.listeningSoundwave.classList.remove('active');
      }
    };

    utterance.onerror = () => {
      if (this.listeningSoundwave) {
        this.listeningSoundwave.classList.remove('active');
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * SPRINT 5 (Task F12): Chấm điểm Nghe–Viết
   */
  async checkAnswer() {
    if (this.isAnswered) return;

    const card = this.cards[this.currentIndex];
    if (!card) return;

    const inputVal = (this.listeningInput ? this.listeningInput.value : '').trim();
    if (!inputVal) {
      this.onToast('Vui lòng gõ từ bạn nghe được trước khi kiểm tra!');
      if (this.listeningInput) this.listeningInput.focus();
      return;
    }

    this.isAnswered = true;
    if (this.listeningInput) this.listeningInput.disabled = true;
    if (this.btnListeningSubmit) this.btnListeningSubmit.classList.add('hidden');

    const expectedWord = (card.front || '').trim();
    const isCorrect = inputVal.toLowerCase() === expectedWord.toLowerCase();

    if (isCorrect) {
      // ==========================================
      // CHẤM ĐÚNG
      // ==========================================
      this.score++;
      if (this.listeningScoreTracker) {
        this.listeningScoreTracker.textContent = `Điểm: ${this.score}`;
      }

      if (this.listeningInput) {
        this.listeningInput.classList.add('input-correct');
      }

      if (this.listeningFeedback) {
        this.listeningFeedback.className = 'typing-feedback feedback-correct';
        this.listeningFeedback.innerHTML = `
          <div class="feedback-icon">✔</div>
          <div class="feedback-text">
            <strong>Nghe chính xác!</strong> Từ: <span class="highlight-en">${escapeHtml(expectedWord)}</span> 
            ${card.phonetic ? `<code>/${escapeHtml(card.phonetic.replace(/^\/|\/$/g, ''))}/</code>` : ''}
            <div>Nghĩa: <em>${escapeHtml(card.meaning || card.back || '')}</em></div>
          </div>
        `;
        this.listeningFeedback.classList.remove('hidden');
      }

    } else {
      // ==========================================
      // CHẤM SAI -> GỬI POST /progress level forgot
      // ==========================================
      if (this.listeningInput) {
        this.listeningInput.classList.add('input-wrong', 'shake');
      }

      if (this.listeningFeedback) {
        this.listeningFeedback.className = 'typing-feedback feedback-wrong';
        this.listeningFeedback.innerHTML = `
          <div class="feedback-icon">✖</div>
          <div class="feedback-text">
            <div>Bạn đã gõ: <span class="wrong-typed">${escapeHtml(inputVal)}</span></div>
            <div>Từ đúng là: <strong class="correct-answer">${escapeHtml(expectedWord)}</strong> ${card.phonetic ? `<code>/${escapeHtml(card.phonetic.replace(/^\/|\/$/g, ''))}/</code>` : ''}</div>
            <div>Nghĩa: <em>${escapeHtml(card.meaning || card.back || '')}</em></div>
          </div>
        `;
        this.listeningFeedback.classList.remove('hidden');
      }

      // Phát âm lại từ đúng
      this.playCurrentAudio(0.85);

      // Ghi nhận vào thống kê
      this.reportForgotProgress(card.id);
    }

    if (this.btnListeningNext) {
      this.btnListeningNext.classList.remove('hidden');
      this.btnListeningNext.focus();
    }
  }

  async reportForgotProgress(cardId) {
    try {
      await api.saveProgress({
        cardId: String(cardId),
        setId: String(this.setId || '1'),
        level: 'forgot'
      });
      console.log(`[ListeningController] Recorded forgot level for card ${cardId}`);
    } catch (err) {
      console.warn('[ListeningController] Failed to record forgot progress:', err.message);
    }
  }

  nextCard() {
    this.currentIndex++;
    if (this.currentIndex >= this.cards.length) {
      this.showResults();
    } else {
      this.renderCurrentQuestion();
    }
  }

  showResults() {
    this.showState('result');

    const total = this.cards.length;
    const percent = total > 0 ? Math.round((this.score / total) * 100) : 0;

    if (this.listeningResultScore) {
      this.listeningResultScore.textContent = `${this.score} / ${total}`;
    }
    if (this.listeningResultPercent) {
      this.listeningResultPercent.textContent = `${percent}%`;
    }

    let badgeText = 'Xuất sắc! 🎧';
    let badgeClass = 'badge-result-excellent';
    let descText = 'Đôi tai IELTS cực bén! Bạn đã nhận diện và viết chính xác hầu hết các từ phát âm.';

    if (percent === 100) {
      badgeText = 'Thính giác hoàn hảo! 🌟';
      badgeClass = 'badge-result-perfect';
      descText = 'Nghe chuẩn 100%! Bạn phản xạ ngữ âm và chính tả xuất sắc không tì vết.';
    } else if (percent >= 75) {
      badgeText = 'Khá giỏi! 👏';
      badgeClass = 'badge-result-good';
      descText = 'Khả năng nghe nhận diện từ vựng rất tốt. Luyện tập thêm để đạt phản xạ tối đa!';
    } else {
      badgeText = 'Cần luyện thêm! 👂';
      badgeClass = 'badge-result-practice';
      descText = 'Một số từ phát âm nhanh bạn chưa kịp nhận diện. Hãy dùng nút "Nghe chậm" và luyện tập lại nhé!';
    }

    if (this.listeningResultBadge) {
      this.listeningResultBadge.textContent = badgeText;
      this.listeningResultBadge.className = `typing-result-badge ${badgeClass}`;
    }
    if (this.listeningResultDesc) {
      this.listeningResultDesc.textContent = descText;
    }
  }

  showState(state) {
    if (this.listeningLoading) this.listeningLoading.classList.add('hidden');
    if (this.listeningEmpty) this.listeningEmpty.classList.add('hidden');
    if (this.listeningError) this.listeningError.classList.add('hidden');
    if (this.listeningCardWrapper) this.listeningCardWrapper.classList.add('hidden');
    if (this.listeningResultWrapper) this.listeningResultWrapper.classList.add('hidden');

    switch (state) {
      case 'loading':
        if (this.listeningLoading) this.listeningLoading.classList.remove('hidden');
        break;
      case 'empty':
        if (this.listeningEmpty) this.listeningEmpty.classList.remove('hidden');
        break;
      case 'error':
        if (this.listeningError) this.listeningError.classList.remove('hidden');
        break;
      case 'card':
        if (this.listeningCardWrapper) this.listeningCardWrapper.classList.remove('hidden');
        break;
      case 'result':
        if (this.listeningResultWrapper) this.listeningResultWrapper.classList.remove('hidden');
        break;
    }
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
