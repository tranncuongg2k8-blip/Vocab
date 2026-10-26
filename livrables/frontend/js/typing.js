/**
 * ========================================================
 * VOCABMASTER - TYPING CONTROLLER (TYPING.JS)
 * Sprint 5: Mode Gõ từ (Task F11)
 * Hiển thị nghĩa VI -> Gõ từ EN, chấm đúng/sai, sai gửi POST /progress forgot
 * ========================================================
 */

import { api } from './api.js';

export class TypingController {
  constructor(options = {}) {
    this.setId = null;
    this.cards = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    // Callbacks
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onBackToFlashcard = options.onBackToFlashcard || (() => {});
    this.onSwitchToListening = options.onSwitchToListening || (() => {});
    this.onBackToSets = options.onBackToSets || (() => {});

    this.bindDomElements();
    this.initEvents();
  }

  bindDomElements() {
    this.typingStage = document.getElementById('typing-stage');
    this.typingProgressText = document.getElementById('typing-progress-text');
    this.typingScoreTracker = document.getElementById('typing-score-tracker');
    this.typingProgressBar = document.getElementById('typing-progress-bar');

    // States
    this.typingLoading = document.getElementById('typing-loading');
    this.typingEmpty = document.getElementById('typing-empty');
    this.typingError = document.getElementById('typing-error');
    this.btnEmptyTypingBack = document.getElementById('btn-empty-typing-back');
    this.btnRetryTyping = document.getElementById('btn-retry-typing');

    // Card & Form elements
    this.typingCardWrapper = document.getElementById('typing-card-wrapper');
    this.typingPromptVi = document.getElementById('typing-prompt-vi');
    this.typingWordType = document.getElementById('typing-word-type');
    this.typingPhoneticHint = document.getElementById('typing-phonetic-hint');
    this.typingExampleVi = document.getElementById('typing-example-vi');
    this.typingInput = document.getElementById('typing-input');
    this.btnTypingSubmit = document.getElementById('btn-typing-submit');
    this.btnTypingAudio = document.getElementById('btn-typing-audio');
    this.typingFeedback = document.getElementById('typing-feedback');
    this.btnTypingNext = document.getElementById('btn-typing-next');

    // Result screen
    this.typingResultWrapper = document.getElementById('typing-result-wrapper');
    this.typingResultBadge = document.getElementById('typing-result-badge');
    this.typingResultScore = document.getElementById('typing-result-score');
    this.typingResultPercent = document.getElementById('typing-result-percent');
    this.typingResultDesc = document.getElementById('typing-result-desc');
    this.btnTypingRetry = document.getElementById('btn-typing-retry');
    this.btnTypingToListening = document.getElementById('btn-typing-to-listening');
    this.btnTypingBackFlashcard = document.getElementById('btn-typing-back-flashcard');
    this.btnTypingBackSets = document.getElementById('btn-typing-back-sets');
  }

  initEvents() {
    if (this.btnTypingSubmit) {
      this.btnTypingSubmit.addEventListener('click', () => this.checkAnswer());
    }

    if (this.typingInput) {
      this.typingInput.addEventListener('keydown', (e) => {
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

    if (this.btnTypingNext) {
      this.btnTypingNext.addEventListener('click', () => this.nextCard());
    }

    if (this.btnTypingAudio) {
      this.btnTypingAudio.addEventListener('click', () => this.pronounceCurrentCard());
    }

    if (this.btnEmptyTypingBack) {
      this.btnEmptyTypingBack.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnTypingRetry) {
      this.btnTypingRetry.addEventListener('click', () => this.startSession(this.cards, this.setId));
    }

    if (this.btnTypingToListening) {
      this.btnTypingToListening.addEventListener('click', () => this.onSwitchToListening());
    }

    if (this.btnTypingBackFlashcard) {
      this.btnTypingBackFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnTypingBackSets) {
      this.btnTypingBackSets.addEventListener('click', () => this.onBackToSets());
    }
  }

  /**
   * Khởi chạy phiên Gõ từ với danh sách thẻ
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

    // Cập nhật Header
    const total = this.cards.length;
    if (this.typingProgressText) {
      this.typingProgressText.textContent = `Từ ${this.currentIndex + 1} / ${total}`;
    }
    if (this.typingScoreTracker) {
      this.typingScoreTracker.textContent = `Điểm: ${this.score}`;
    }
    if (this.typingProgressBar) {
      const pct = (this.currentIndex / total) * 100;
      this.typingProgressBar.style.width = `${pct}%`;
    }

    // Hiển thị Nghĩa VI (Mặt trước bài học gõ từ)
    if (this.typingPromptVi) {
      this.typingPromptVi.textContent = card.meaning || card.back || 'Chưa có định nghĩa';
    }

    // Gợi ý Loại từ
    if (this.typingWordType) {
      if (card.wordType) {
        this.typingWordType.textContent = card.wordType;
        this.typingWordType.classList.remove('hidden');
      } else {
        this.typingWordType.classList.add('hidden');
      }
    }

    // Gợi ý Phiên âm (mờ)
    if (this.typingPhoneticHint) {
      if (card.phonetic) {
        const cleanIpa = card.phonetic.replace(/^\/|\/$/g, '');
        this.typingPhoneticHint.textContent = `/${cleanIpa}/`;
        this.typingPhoneticHint.classList.remove('hidden');
      } else {
        this.typingPhoneticHint.classList.add('hidden');
      }
    }

    // Gợi ý Ví dụ tiếng Việt
    if (this.typingExampleVi) {
      if (card.exampleVi) {
        this.typingExampleVi.textContent = `Ví dụ: "${card.exampleVi}"`;
        this.typingExampleVi.classList.remove('hidden');
      } else {
        this.typingExampleVi.classList.add('hidden');
      }
    }

    // Reset Input & Feedback
    if (this.typingInput) {
      this.typingInput.value = '';
      this.typingInput.disabled = false;
      this.typingInput.className = 'typing-input';
      setTimeout(() => this.typingInput.focus(), 100);
    }

    if (this.btnTypingSubmit) {
      this.btnTypingSubmit.classList.remove('hidden');
      this.btnTypingSubmit.disabled = false;
    }

    if (this.btnTypingNext) {
      this.btnTypingNext.classList.add('hidden');
    }

    if (this.typingFeedback) {
      this.typingFeedback.classList.add('hidden');
      this.typingFeedback.innerHTML = '';
      this.typingFeedback.className = 'typing-feedback hidden';
    }
  }

  /**
   * SPRINT 5 (Task F11): Chấm đúng / sai và gửi POST /progress level forgot khi sai
   */
  async checkAnswer() {
    if (this.isAnswered) return;

    const card = this.cards[this.currentIndex];
    if (!card) return;

    const inputVal = (this.typingInput ? this.typingInput.value : '').trim();
    if (!inputVal) {
      this.onToast('Vui lòng gõ từ tiếng Anh trước khi kiểm tra!');
      if (this.typingInput) this.typingInput.focus();
      return;
    }

    this.isAnswered = true;
    if (this.typingInput) this.typingInput.disabled = true;
    if (this.btnTypingSubmit) this.btnTypingSubmit.classList.add('hidden');

    const expectedWord = (card.front || '').trim();
    const isCorrect = inputVal.toLowerCase() === expectedWord.toLowerCase();

    if (isCorrect) {
      // ==========================================
      // CHẤM ĐÚNG
      // ==========================================
      this.score++;
      if (this.typingScoreTracker) {
        this.typingScoreTracker.textContent = `Điểm: ${this.score}`;
      }

      if (this.typingInput) {
        this.typingInput.classList.add('input-correct');
      }

      if (this.typingFeedback) {
        this.typingFeedback.className = 'typing-feedback feedback-correct';
        this.typingFeedback.innerHTML = `
          <div class="feedback-icon">✔</div>
          <div class="feedback-text">
            <strong>Chính xác!</strong> Từ tiếng Anh: <span class="highlight-en">${escapeHtml(expectedWord)}</span>
          </div>
        `;
        this.typingFeedback.classList.remove('hidden');
      }

      // Phát âm từ đúng
      this.pronounceWord(expectedWord);

    } else {
      // ==========================================
      // CHẤM SAI -> GỬI POST /progress level forgot
      // ==========================================
      if (this.typingInput) {
        this.typingInput.classList.add('input-wrong', 'shake');
      }

      if (this.typingFeedback) {
        this.typingFeedback.className = 'typing-feedback feedback-wrong';
        this.typingFeedback.innerHTML = `
          <div class="feedback-icon">✖</div>
          <div class="feedback-text">
            <div>Từ bạn gõ: <span class="wrong-typed">${escapeHtml(inputVal)}</span></div>
            <div>Đáp án đúng: <strong class="correct-answer">${escapeHtml(expectedWord)}</strong> ${card.phonetic ? `<code>/${escapeHtml(card.phonetic.replace(/^\/|\/$/g, ''))}/</code>` : ''}</div>
          </div>
        `;
        this.typingFeedback.classList.remove('hidden');
      }

      // Phát âm từ đúng để người dùng ghi nhớ
      this.pronounceWord(expectedWord);

      // GỬI POST /progress { cardId, setId, level: "forgot" } theo Task F11
      this.reportForgotProgress(card.id);
    }

    // Hiển thị nút "Tiếp theo"
    if (this.btnTypingNext) {
      this.btnTypingNext.classList.remove('hidden');
      this.btnTypingNext.focus();
    }
  }

  /**
   * Báo cáo thẻ bị sai vào hệ thống thống kê qua POST /progress
   */
  async reportForgotProgress(cardId) {
    try {
      await api.saveProgress({
        cardId: String(cardId),
        setId: String(this.setId || '1'),
        level: 'forgot'
      });
      console.log(`[TypingController] Recorded forgot level for card ${cardId}`);
    } catch (err) {
      console.warn('[TypingController] Failed to record forgot progress:', err.message);
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

    if (this.typingResultScore) {
      this.typingResultScore.textContent = `${this.score} / ${total}`;
    }
    if (this.typingResultPercent) {
      this.typingResultPercent.textContent = `${percent}%`;
    }

    let badgeText = 'Xuất sắc! 🔥';
    let badgeClass = 'badge-result-excellent';
    let descText = 'Trí nhớ chính tả tuyệt vời! Bạn đã gõ đúng hầu hết các từ vựng.';

    if (percent === 100) {
      badgeText = 'Hoàn hảo tuyệt đối! 🌟';
      badgeClass = 'badge-result-perfect';
      descText = 'Không sai một từ nào! Khả năng ghi nhớ từ vựng và chính tả tiếng Anh của bạn quá xuất sắc.';
    } else if (percent >= 75) {
      badgeText = 'Rất tốt! 👏';
      badgeClass = 'badge-result-good';
      descText = 'Khả năng viết từ tiếng Anh rất tốt! Tiếp tục phát huy nhé.';
    } else {
      badgeText = 'Cần luyện thêm! ✍';
      badgeClass = 'badge-result-practice';
      descText = 'Một số từ bạn còn chưa nhớ chính xác chính tả. Các từ gõ sai đã được tự động lưu vào danh mục Cần ôn tập!';
    }

    if (this.typingResultBadge) {
      this.typingResultBadge.textContent = badgeText;
      this.typingResultBadge.className = `typing-result-badge ${badgeClass}`;
    }
    if (this.typingResultDesc) {
      this.typingResultDesc.textContent = descText;
    }
  }

  pronounceCurrentCard() {
    const card = this.cards[this.currentIndex];
    if (card && card.front) {
      this.pronounceWord(card.front);
    }
  }

  pronounceWord(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  showState(state) {
    if (this.typingLoading) this.typingLoading.classList.add('hidden');
    if (this.typingEmpty) this.typingEmpty.classList.add('hidden');
    if (this.typingError) this.typingError.classList.add('hidden');
    if (this.typingCardWrapper) this.typingCardWrapper.classList.add('hidden');
    if (this.typingResultWrapper) this.typingResultWrapper.classList.add('hidden');

    switch (state) {
      case 'loading':
        if (this.typingLoading) this.typingLoading.classList.remove('hidden');
        break;
      case 'empty':
        if (this.typingEmpty) this.typingEmpty.classList.remove('hidden');
        break;
      case 'error':
        if (this.typingError) this.typingError.classList.remove('hidden');
        break;
      case 'card':
        if (this.typingCardWrapper) this.typingCardWrapper.classList.remove('hidden');
        break;
      case 'result':
        if (this.typingResultWrapper) this.typingResultWrapper.classList.remove('hidden');
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
