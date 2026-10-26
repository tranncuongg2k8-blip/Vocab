/**
 * ========================================================
 * VOCABMASTER - CLOZE CONTROLLER (CLOZE.JS)
 * Sprint 6: Mode Điền vào chỗ trống (Task F13)
 * Hiện câu ví dụ khuyết từ (____) + nghĩa VI -> Gõ từ còn thiếu, chấm đúng/sai, sai gửi POST /progress forgot
 * ========================================================
 */

import { api } from './api.js';

export class ClozeController {
  constructor(options = {}) {
    this.setId = null;
    this.cards = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    // Callbacks
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onBackToFlashcard = options.onBackToFlashcard || (() => {});
    this.onSwitchToMixed = options.onSwitchToMixed || (() => {});
    this.onBackToSets = options.onBackToSets || (() => {});

    this.bindDomElements();
    this.initEvents();
  }

  bindDomElements() {
    this.clozeStage = document.getElementById('cloze-stage');
    this.clozeProgressText = document.getElementById('cloze-progress-text');
    this.clozeScoreTracker = document.getElementById('cloze-score-tracker');
    this.clozeProgressBar = document.getElementById('cloze-progress-bar');

    // States
    this.clozeLoading = document.getElementById('cloze-loading');
    this.clozeEmpty = document.getElementById('cloze-empty');
    this.clozeError = document.getElementById('cloze-error');
    this.btnEmptyClozeBack = document.getElementById('btn-empty-cloze-back');
    this.btnRetryCloze = document.getElementById('btn-retry-cloze');

    // Card & Form elements
    this.clozeCardWrapper = document.getElementById('cloze-card-wrapper');
    this.clozeSentenceEn = document.getElementById('cloze-sentence-en');
    this.clozeTranslationVi = document.getElementById('cloze-translation-vi');
    this.clozeMeaningHint = document.getElementById('cloze-meaning-hint');
    this.clozeWordType = document.getElementById('cloze-word-type');
    this.clozePhoneticHint = document.getElementById('cloze-phonetic-hint');
    this.clozeInput = document.getElementById('cloze-input');
    this.btnClozeSubmit = document.getElementById('btn-cloze-submit');
    this.btnClozeAudio = document.getElementById('btn-cloze-audio');
    this.clozeFeedback = document.getElementById('cloze-feedback');
    this.btnClozeNext = document.getElementById('btn-cloze-next');

    // Result screen
    this.clozeResultWrapper = document.getElementById('cloze-result-wrapper');
    this.clozeResultBadge = document.getElementById('cloze-result-badge');
    this.clozeResultScore = document.getElementById('cloze-result-score');
    this.clozeResultPercent = document.getElementById('cloze-result-percent');
    this.clozeResultDesc = document.getElementById('cloze-result-desc');
    this.btnClozeRetry = document.getElementById('btn-cloze-retry');
    this.btnClozeToMixed = document.getElementById('btn-cloze-to-mixed');
    this.btnClozeBackFlashcard = document.getElementById('btn-cloze-back-flashcard');
    this.btnClozeBackSets = document.getElementById('btn-cloze-back-sets');
  }

  initEvents() {
    if (this.btnClozeSubmit) {
      this.btnClozeSubmit.addEventListener('click', () => this.checkAnswer());
    }

    if (this.clozeInput) {
      this.clozeInput.addEventListener('keydown', (e) => {
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

    if (this.btnClozeNext) {
      this.btnClozeNext.addEventListener('click', () => this.nextCard());
    }

    if (this.btnClozeAudio) {
      this.btnClozeAudio.addEventListener('click', () => this.pronounceCurrentWord());
    }

    if (this.btnEmptyClozeBack) {
      this.btnEmptyClozeBack.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnClozeRetry) {
      this.btnClozeRetry.addEventListener('click', () => this.startSession(this.cards, this.setId));
    }

    if (this.btnClozeToMixed) {
      this.btnClozeToMixed.addEventListener('click', () => this.onSwitchToMixed());
    }

    if (this.btnClozeBackFlashcard) {
      this.btnClozeBackFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnClozeBackSets) {
      this.btnClozeBackSets.addEventListener('click', () => this.onBackToSets());
    }
  }

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
    if (this.clozeProgressText) {
      this.clozeProgressText.textContent = `Câu ${this.currentIndex + 1} / ${total}`;
    }
    if (this.clozeScoreTracker) {
      this.clozeScoreTracker.textContent = `Điểm: ${this.score}`;
    }
    if (this.clozeProgressBar) {
      const pct = (this.currentIndex / total) * 100;
      this.clozeProgressBar.style.width = `${pct}%`;
    }

    // Tạo câu ví dụ khuyết từ
    const rawExample = card.example || `The student used the word [blank] in an English essay.`;
    const targetWord = (card.front || '').trim();

    // Thay thế từ mục tiêu bằng chỗ trống
    let clozeHtml = '';
    const regex = new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, 'i');

    if (regex.test(rawExample)) {
      clozeHtml = rawExample.replace(regex, `<span class="cloze-blank" id="active-cloze-blank">______</span>`);
    } else {
      // Fallback nếu câu ví dụ không chứa trực tiếp từ đó
      clozeHtml = `Complete the sentence with <em>${escapeHtml(card.meaning || card.back || '')}</em>: "<span class="cloze-blank" id="active-cloze-blank">______</span>"`;
    }

    if (this.clozeSentenceEn) {
      this.clozeSentenceEn.innerHTML = clozeHtml;
    }

    // Gợi ý bản dịch tiếng Việt
    if (this.clozeTranslationVi) {
      if (card.exampleVi) {
        this.clozeTranslationVi.textContent = `Dịch nghĩa: "${card.exampleVi}"`;
        this.clozeTranslationVi.classList.remove('hidden');
      } else {
        this.clozeTranslationVi.classList.add('hidden');
      }
    }

    // Gợi ý nghĩa tiếng Việt
    if (this.clozeMeaningHint) {
      this.clozeMeaningHint.textContent = `Từ cần điền mang nghĩa: ${card.meaning || card.back || '...'}`;
    }

    // Loại từ & Phiên âm
    if (this.clozeWordType) {
      if (card.wordType) {
        this.clozeWordType.textContent = card.wordType;
        this.clozeWordType.classList.remove('hidden');
      } else {
        this.clozeWordType.classList.add('hidden');
      }
    }

    if (this.clozePhoneticHint) {
      if (card.phonetic) {
        this.clozePhoneticHint.textContent = `/${card.phonetic.replace(/^\/|\/$/g, '')}/`;
        this.clozePhoneticHint.classList.remove('hidden');
      } else {
        this.clozePhoneticHint.classList.add('hidden');
      }
    }

    // Reset Input & Feedback
    if (this.clozeInput) {
      this.clozeInput.value = '';
      this.clozeInput.disabled = false;
      this.clozeInput.className = 'typing-input';
      setTimeout(() => this.clozeInput.focus(), 120);
    }

    if (this.btnClozeSubmit) {
      this.btnClozeSubmit.classList.remove('hidden');
      this.btnClozeSubmit.disabled = false;
    }

    if (this.btnClozeNext) {
      this.btnClozeNext.classList.add('hidden');
    }

    if (this.clozeFeedback) {
      this.clozeFeedback.classList.add('hidden');
      this.clozeFeedback.innerHTML = '';
      this.clozeFeedback.className = 'typing-feedback hidden';
    }
  }

  /**
   * SPRINT 6 (Task F13): Chấm đúng/sai, khi sai gửi POST /progress forgot
   */
  async checkAnswer() {
    if (this.isAnswered) return;

    const card = this.cards[this.currentIndex];
    if (!card) return;

    const inputVal = (this.clozeInput ? this.clozeInput.value : '').trim();
    if (!inputVal) {
      this.onToast('Vui lòng gõ từ cần điền vào chỗ trống!');
      if (this.clozeInput) this.clozeInput.focus();
      return;
    }

    this.isAnswered = true;
    if (this.clozeInput) this.clozeInput.disabled = true;
    if (this.btnClozeSubmit) this.btnClozeSubmit.classList.add('hidden');

    const expectedWord = (card.front || '').trim();
    const isCorrect = inputVal.toLowerCase() === expectedWord.toLowerCase();
    const activeBlank = document.getElementById('active-cloze-blank');

    if (isCorrect) {
      // ==========================================
      // CHẤM ĐÚNG
      // ==========================================
      this.score++;
      if (this.clozeScoreTracker) {
        this.clozeScoreTracker.textContent = `Điểm: ${this.score}`;
      }

      if (this.clozeInput) {
        this.clozeInput.classList.add('input-correct');
      }

      if (activeBlank) {
        activeBlank.textContent = expectedWord;
        activeBlank.className = 'cloze-blank blank-filled-correct';
      }

      if (this.clozeFeedback) {
        this.clozeFeedback.className = 'typing-feedback feedback-correct';
        this.clozeFeedback.innerHTML = `
          <div class="feedback-icon">✔</div>
          <div class="feedback-text">
            <strong>Chính xác!</strong> Từ cần điền là: <span class="highlight-en">${escapeHtml(expectedWord)}</span>
          </div>
        `;
        this.clozeFeedback.classList.remove('hidden');
      }

      // Phát âm từ đúng
      this.pronounceWord(expectedWord);

    } else {
      // ==========================================
      // CHẤM SAI -> GỬI POST /progress level forgot
      // ==========================================
      if (this.clozeInput) {
        this.clozeInput.classList.add('input-wrong', 'shake');
      }

      if (activeBlank) {
        activeBlank.textContent = expectedWord;
        activeBlank.className = 'cloze-blank blank-filled-wrong';
      }

      if (this.clozeFeedback) {
        this.clozeFeedback.className = 'typing-feedback feedback-wrong';
        this.clozeFeedback.innerHTML = `
          <div class="feedback-icon">✖</div>
          <div class="feedback-text">
            <div>Từ bạn gõ: <span class="wrong-typed">${escapeHtml(inputVal)}</span></div>
            <div>Đáp án đúng: <strong class="correct-answer">${escapeHtml(expectedWord)}</strong> ${card.phonetic ? `<code>/${escapeHtml(card.phonetic.replace(/^\/|\/$/g, ''))}/</code>` : ''}</div>
          </div>
        `;
        this.clozeFeedback.classList.remove('hidden');
      }

      // Phát âm từ đúng
      this.pronounceWord(expectedWord);

      // GỬI POST /progress { cardId, setId, level: "forgot" } theo Task F13
      this.reportForgotProgress(card.id);
    }

    if (this.btnClozeNext) {
      this.btnClozeNext.classList.remove('hidden');
      this.btnClozeNext.focus();
    }
  }

  async reportForgotProgress(cardId) {
    try {
      await api.saveProgress({
        cardId: String(cardId),
        setId: String(this.setId || '1'),
        level: 'forgot'
      });
      console.log(`[ClozeController] Recorded forgot level for card ${cardId}`);
    } catch (err) {
      console.warn('[ClozeController] Failed to record forgot progress:', err.message);
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

    if (this.clozeResultScore) {
      this.clozeResultScore.textContent = `${this.score} / ${total}`;
    }
    if (this.clozeResultPercent) {
      this.clozeResultPercent.textContent = `${percent}%`;
    }

    let badgeText = 'Xuất sắc! 🔥';
    let badgeClass = 'badge-result-excellent';
    let descText = 'Khả năng ứng dụng từ vựng vào ngữ cảnh cực kỳ tốt! Bạn đã điền chính xác hầu hết các câu.';

    if (percent === 100) {
      badgeText = 'Ngữ cảnh hoàn hảo! 🌟';
      badgeClass = 'badge-result-perfect';
      descText = 'Không sai một câu nào! Bạn hiểu sâu sắc cách dùng từ vựng trong văn cảnh tiếng Anh.';
    } else if (percent >= 75) {
      badgeText = 'Rất tốt! 👏';
      badgeClass = 'badge-result-good';
      descText = 'Kỹ năng điền từ ngữ cảnh rất vững vàng. Tiếp tục duy trì phong độ nhé!';
    } else {
      badgeText = 'Cần ôn thêm! 📖';
      badgeClass = 'badge-result-practice';
      descText = 'Một số ngữ cảnh bạn chưa điền đúng. Các từ sai đã được tự động ghi nhận vào mục Cần ôn tập!';
    }

    if (this.clozeResultBadge) {
      this.clozeResultBadge.textContent = badgeText;
      this.clozeResultBadge.className = `cloze-result-badge ${badgeClass}`;
    }
    if (this.clozeResultDesc) {
      this.clozeResultDesc.textContent = descText;
    }
  }

  pronounceCurrentWord() {
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
    if (this.clozeLoading) this.clozeLoading.classList.add('hidden');
    if (this.clozeEmpty) this.clozeEmpty.classList.add('hidden');
    if (this.clozeError) this.clozeError.classList.add('hidden');
    if (this.clozeCardWrapper) this.clozeCardWrapper.classList.add('hidden');
    if (this.clozeResultWrapper) this.clozeResultWrapper.classList.add('hidden');

    switch (state) {
      case 'loading':
        if (this.clozeLoading) this.clozeLoading.classList.remove('hidden');
        break;
      case 'empty':
        if (this.clozeEmpty) this.clozeEmpty.classList.remove('hidden');
        break;
      case 'error':
        if (this.clozeError) this.clozeError.classList.remove('hidden');
        break;
      case 'card':
        if (this.clozeCardWrapper) this.clozeCardWrapper.classList.remove('hidden');
        break;
      case 'result':
        if (this.clozeResultWrapper) this.clozeResultWrapper.classList.remove('hidden');
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

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
