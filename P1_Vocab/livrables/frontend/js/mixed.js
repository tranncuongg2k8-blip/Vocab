/**
 * ========================================================
 * VOCABMASTER - MIXED CONTROLLER (MIXED.JS)
 * Sprint 6: Mode Tổng hợp (Task F14)
 * Trộn 4 dạng câu hỏi (Quiz, Gõ từ, Nghe–Viết, Điền từ) trong 1 phiên + Tổng kết chung
 * ========================================================
 */

import { api } from './api.js';

export class MixedController {
  constructor(options = {}) {
    this.setId = null;
    this.cards = [];
    this.questions = []; // { type: 'quiz'|'typing'|'listening'|'cloze', card, options?, answerIndex? }
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    // Thống kê chi tiết 4 kỹ năng
    this.breakdown = {
      quiz: { total: 0, correct: 0, label: 'Trắc nghiệm' },
      typing: { total: 0, correct: 0, label: 'Gõ từ' },
      listening: { total: 0, correct: 0, label: 'Nghe–Viết' },
      cloze: { total: 0, correct: 0, label: 'Điền từ' }
    };

    // Callbacks
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onBackToFlashcard = options.onBackToFlashcard || (() => {});
    this.onBackToSets = options.onBackToSets || (() => {});

    this.bindDomElements();
    this.initEvents();
  }

  bindDomElements() {
    this.mixedStage = document.getElementById('mixed-stage');
    this.mixedHeaderBar = this.mixedStage ? this.mixedStage.querySelector('.mixed-header-bar') : null;
    this.mixedProgressText = document.getElementById('mixed-progress-text');
    this.mixedScoreTracker = document.getElementById('mixed-score-tracker');
    this.mixedProgressBar = document.getElementById('mixed-progress-bar');
    this.mixedTypeBadge = document.getElementById('mixed-type-badge');

    // States
    this.mixedLoading = document.getElementById('mixed-loading');
    this.mixedEmpty = document.getElementById('mixed-empty');
    this.mixedError = document.getElementById('mixed-error');
    this.btnEmptyMixedBack = document.getElementById('btn-empty-mixed-back');
    this.btnRetryMixed = document.getElementById('btn-retry-mixed');

    // Main Card Wrapper & Dynamic Container
    this.mixedCardWrapper = document.getElementById('mixed-card-wrapper');
    this.mixedContentArea = document.getElementById('mixed-content-area');

    // Result screen
    this.mixedResultWrapper = document.getElementById('mixed-result-wrapper');
    this.mixedResultBadge = document.getElementById('mixed-result-badge');
    this.mixedResultScore = document.getElementById('mixed-result-score');
    this.mixedResultPercent = document.getElementById('mixed-result-percent');
    this.mixedBreakdownGrid = document.getElementById('mixed-breakdown-grid');
    this.mixedResultDesc = document.getElementById('mixed-result-desc');
    this.btnMixedRetry = document.getElementById('btn-mixed-retry');
    this.btnMixedBackFlashcard = document.getElementById('btn-mixed-back-flashcard');
    this.btnMixedBackSets = document.getElementById('btn-mixed-back-sets');
  }

  initEvents() {
    if (this.btnEmptyMixedBack) {
      this.btnEmptyMixedBack.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnMixedRetry) {
      this.btnMixedRetry.addEventListener('click', () => this.startSession(this.cards, this.setId));
    }

    if (this.btnMixedBackFlashcard) {
      this.btnMixedBackFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnMixedBackSets) {
      this.btnMixedBackSets.addEventListener('click', () => this.onBackToSets());
    }
  }

  /**
   * Khởi chạy phiên Tổng hợp: Tạo các câu hỏi trộn ngẫu nhiên 4 dạng bài
   */
  startSession(cards, setId) {
    this.setId = setId;
    this.cards = cards || [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    // Reset breakdown
    this.breakdown = {
      quiz: { total: 0, correct: 0, label: 'Trắc nghiệm' },
      typing: { total: 0, correct: 0, label: 'Gõ từ' },
      listening: { total: 0, correct: 0, label: 'Nghe–Viết' },
      cloze: { total: 0, correct: 0, label: 'Điền từ' }
    };

    if (!this.cards || this.cards.length === 0) {
      this.showState('empty');
      return;
    }

    // Xây dựng danh sách câu hỏi tổng hợp
    this.buildMixedQuestions();
    this.showState('card');
    this.renderCurrentQuestion();
  }

  buildMixedQuestions() {
    const types = ['quiz', 'typing', 'listening', 'cloze'];
    const shuffledCards = this.shuffleArray([...this.cards]);

    this.questions = shuffledCards.map((card, idx) => {
      // Phân bổ đều hoặc luân phiên 4 dạng câu
      const type = types[idx % types.length];
      this.breakdown[type].total++;

      const item = { type, card };

      // Nếu là quiz, chuẩn bị 4 options
      if (type === 'quiz') {
        const correctMeaning = card.meaning || card.back || 'Định nghĩa';
        const otherCards = this.cards.filter(c => c.id !== card.id);
        const distractors = this.shuffleArray(
          otherCards.map(c => c.meaning || c.back).filter(Boolean)
        ).slice(0, 3);

        while (distractors.length < 3) {
          distractors.push(`Ý nghĩa bổ trợ ${distractors.length + 1}`);
        }

        const options = this.shuffleArray([correctMeaning, ...distractors]);
        item.options = options;
        item.answerIndex = options.indexOf(correctMeaning);
      }

      return item;
    });
  }

  renderCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) {
      this.showResults();
      return;
    }

    this.isAnswered = false;

    // Header updates
    const total = this.questions.length;
    if (this.mixedProgressText) {
      this.mixedProgressText.textContent = `Câu ${this.currentIndex + 1} / ${total}`;
    }
    if (this.mixedScoreTracker) {
      this.mixedScoreTracker.textContent = `Điểm: ${this.score}`;
    }
    if (this.mixedProgressBar) {
      const pct = (this.currentIndex / total) * 100;
      this.mixedProgressBar.style.width = `${pct}%`;
    }

    // Cập nhật Badge Dạng bài
    if (this.mixedTypeBadge) {
      const typeLabels = {
        quiz: 'Dạng 1: Trắc nghiệm 4 đáp án',
        typing: 'Dạng 2: Gõ từ tiếng Anh',
        listening: 'Dạng 3: Nghe–Viết phát âm',
        cloze: 'Dạng 4: Điền từ vào chỗ trống'
      };
      this.mixedTypeBadge.textContent = typeLabels[q.type] || 'Tổng hợp';
      this.mixedTypeBadge.className = `mixed-type-badge badge-type-${q.type}`;
    }

    // Render nội dung tùy theo dạng câu hỏi
    if (!this.mixedContentArea) return;
    this.mixedContentArea.innerHTML = '';

    switch (q.type) {
      case 'quiz':
        this.renderQuizItem(q);
        break;
      case 'typing':
        this.renderTypingItem(q);
        break;
      case 'listening':
        this.renderListeningItem(q);
        break;
      case 'cloze':
        this.renderClozeItem(q);
        break;
    }
  }

  // ----------------------------------------------------------------
  // DẠNG 1: QUIZ TRẮC NGHIỆM
  // ----------------------------------------------------------------
  renderQuizItem(q) {
    const card = q.card;
    const container = document.createElement('div');
    container.className = 'mixed-sub-card';

    container.innerHTML = `
      <div class="quiz-prompt-header">
        <span class="quiz-badge-question">Trắc nghiệm</span>
        <div class="quiz-prompt-row">
          <span class="quiz-prompt-word">${escapeHtml(card.front)}</span>
          <button type="button" class="btn-audio-circle" id="mixed-btn-audio" title="Phát âm (P)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
        </div>
        <p class="quiz-instruction">Chọn 1 trong 4 đáp án đúng bên dưới (Bấm phím 1 - 4):</p>
      </div>

      <div class="quiz-options-grid" id="mixed-options-grid"></div>
      <div class="quiz-feedback hidden" id="mixed-feedback"></div>

      <div class="quiz-action-dock">
        <button type="button" class="btn btn-primary btn-next-question hidden" id="mixed-btn-next">
          <span>Câu tiếp theo</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    `;

    this.mixedContentArea.appendChild(container);

    const btnAudio = container.querySelector('#mixed-btn-audio');
    if (btnAudio) btnAudio.addEventListener('click', () => this.pronounceWord(card.front));

    const optionsGrid = container.querySelector('#mixed-options-grid');
    const feedbackEl = container.querySelector('#mixed-feedback');
    const btnNext = container.querySelector('#mixed-btn-next');

    btnNext.addEventListener('click', () => this.nextQuestion());

    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-quiz-option';
      btn.innerHTML = `
        <span class="quiz-option-key">${idx + 1}</span>
        <span class="quiz-option-text">${escapeHtml(optText)}</span>
        <span class="quiz-option-icon" aria-hidden="true"></span>
      `;

      btn.addEventListener('click', () => {
        if (this.isAnswered) return;
        this.handleQuizAnswer(idx, q, optionsGrid, feedbackEl, btnNext);
      });

      optionsGrid.appendChild(btn);
    });
  }

  handleQuizAnswer(selectedIndex, q, optionsGrid, feedbackEl, btnNext) {
    this.isAnswered = true;
    const isCorrect = selectedIndex === q.answerIndex;
    const buttons = optionsGrid.querySelectorAll('.btn-quiz-option');

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.answerIndex) {
        btn.classList.add('option-correct');
      } else if (idx === selectedIndex && !isCorrect) {
        btn.classList.add('option-wrong');
      }
    });

    if (isCorrect) {
      this.score++;
      this.breakdown.quiz.correct++;
      this.updateScoreDisplay();

      feedbackEl.className = 'quiz-feedback feedback-correct';
      feedbackEl.innerHTML = `<strong>Chính xác!</strong> Đáp án đúng là: <em>${escapeHtml(q.options[q.answerIndex])}</em>`;
      feedbackEl.classList.remove('hidden');
    } else {
      feedbackEl.className = 'quiz-feedback feedback-wrong';
      feedbackEl.innerHTML = `<strong>Chưa đúng!</strong> Đáp án chính xác là: <em>${escapeHtml(q.options[q.answerIndex])}</em>`;
      feedbackEl.classList.remove('hidden');

      this.reportForgotProgress(q.card.id);
    }

    btnNext.classList.remove('hidden');
    btnNext.focus();
  }

  // ----------------------------------------------------------------
  // DẠNG 2: GÕ TỪ (TYPING)
  // ----------------------------------------------------------------
  renderTypingItem(q) {
    const card = q.card;
    const container = document.createElement('div');
    container.className = 'mixed-sub-card';

    container.innerHTML = `
      <div class="typing-prompt-section">
        <span class="typing-prompt-label">Định nghĩa tiếng Việt:</span>
        <h2 class="typing-prompt-vi">${escapeHtml(card.meaning || card.back || '')}</h2>
        ${card.wordType ? `<span class="badge badge-wordtype">${escapeHtml(card.wordType)}</span>` : ''}
      </div>

      <div class="typing-form">
        <div class="typing-input-group">
          <input type="text" id="mixed-input-typing" class="typing-input" placeholder="Gõ từ tiếng Anh tương ứng..." autocomplete="off">
          <button type="button" class="btn-audio-circle" id="mixed-btn-audio" title="Nghe gợi ý (P)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
        </div>

        <div class="typing-feedback hidden" id="mixed-feedback"></div>

        <div class="typing-actions-row">
          <button type="button" class="btn btn-primary" id="mixed-btn-submit">Kiểm tra (Enter)</button>
          <button type="button" class="btn btn-primary hidden" id="mixed-btn-next">Câu tiếp theo (Enter)</button>
        </div>
      </div>
    `;

    this.mixedContentArea.appendChild(container);

    const input = container.querySelector('#mixed-input-typing');
    const btnSubmit = container.querySelector('#mixed-btn-submit');
    const btnNext = container.querySelector('#mixed-btn-next');
    const feedbackEl = container.querySelector('#mixed-feedback');
    const btnAudio = container.querySelector('#mixed-btn-audio');

    if (btnAudio) btnAudio.addEventListener('click', () => this.pronounceWord(card.front));
    setTimeout(() => input.focus(), 120);

    const check = () => {
      if (this.isAnswered) {
        this.nextQuestion();
        return;
      }

      const val = input.value.trim();
      if (!val) {
        this.onToast('Vui lòng gõ từ trước khi kiểm tra!');
        input.focus();
        return;
      }

      this.isAnswered = true;
      input.disabled = true;
      btnSubmit.classList.add('hidden');

      const isCorrect = val.toLowerCase() === card.front.trim().toLowerCase();

      if (isCorrect) {
        this.score++;
        this.breakdown.typing.correct++;
        this.updateScoreDisplay();
        input.classList.add('input-correct');

        feedbackEl.className = 'typing-feedback feedback-correct';
        feedbackEl.innerHTML = `<strong>Chính xác!</strong> Từ tiếng Anh: <em>${escapeHtml(card.front)}</em>`;
        feedbackEl.classList.remove('hidden');
        this.pronounceWord(card.front);
      } else {
        input.classList.add('input-wrong', 'shake');

        feedbackEl.className = 'typing-feedback feedback-wrong';
        feedbackEl.innerHTML = `<div>Bạn đã gõ: <span class="wrong-typed">${escapeHtml(val)}</span></div><div>Đáp án đúng: <strong class="correct-answer">${escapeHtml(card.front)}</strong></div>`;
        feedbackEl.classList.remove('hidden');
        this.pronounceWord(card.front);
        this.reportForgotProgress(card.id);
      }

      btnNext.classList.remove('hidden');
      btnNext.focus();
    };

    btnSubmit.addEventListener('click', check);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    });
    btnNext.addEventListener('click', () => this.nextQuestion());
  }

  // ----------------------------------------------------------------
  // DẠNG 3: NGHE–VIẾT (LISTENING)
  // ----------------------------------------------------------------
  renderListeningItem(q) {
    const card = q.card;
    const container = document.createElement('div');
    container.className = 'mixed-sub-card';

    container.innerHTML = `
      <div class="listening-audio-stage">
        <button type="button" class="btn-listening-audio-main" id="mixed-btn-audio-main">
          <div class="audio-main-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </div>
          <span class="audio-main-label">Nghe phát âm</span>
        </button>

        <button type="button" class="btn btn-ghost btn-sm btn-audio-slow" id="mixed-btn-audio-slow">
          Nghe chậm (0.65x)
        </button>
      </div>

      <div class="typing-form">
        <div class="typing-input-group">
          <input type="text" id="mixed-input-listening" class="typing-input" placeholder="Gõ lại từ bạn vừa nghe được..." autocomplete="off">
        </div>

        <div class="typing-feedback hidden" id="mixed-feedback"></div>

        <div class="typing-actions-row">
          <button type="button" class="btn btn-primary" id="mixed-btn-submit">Kiểm tra (Enter)</button>
          <button type="button" class="btn btn-primary hidden" id="mixed-btn-next">Câu tiếp theo (Enter)</button>
        </div>
      </div>
    `;

    this.mixedContentArea.appendChild(container);

    const input = container.querySelector('#mixed-input-listening');
    const btnAudioMain = container.querySelector('#mixed-btn-audio-main');
    const btnAudioSlow = container.querySelector('#mixed-btn-audio-slow');
    const btnSubmit = container.querySelector('#mixed-btn-submit');
    const btnNext = container.querySelector('#mixed-btn-next');
    const feedbackEl = container.querySelector('#mixed-feedback');

    btnAudioMain.addEventListener('click', () => this.pronounceWord(card.front, 0.95));
    btnAudioSlow.addEventListener('click', () => this.pronounceWord(card.front, 0.65));

    // Tự động phát âm lần đầu
    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.pronounceWord(card.front, 0.95);
      input.focus();
    }, 250);

    const check = () => {
      if (this.isAnswered) {
        this.nextQuestion();
        return;
      }

      const val = input.value.trim();
      if (!val) {
        this.onToast('Vui lòng gõ từ bạn nghe được!');
        input.focus();
        return;
      }

      this.isAnswered = true;
      input.disabled = true;
      btnSubmit.classList.add('hidden');

      const isCorrect = val.toLowerCase() === card.front.trim().toLowerCase();

      if (isCorrect) {
        this.score++;
        this.breakdown.listening.correct++;
        this.updateScoreDisplay();
        input.classList.add('input-correct');

        feedbackEl.className = 'typing-feedback feedback-correct';
        feedbackEl.innerHTML = `<strong>Nghe chính xác!</strong> Từ: <em>${escapeHtml(card.front)}</em> (${escapeHtml(card.meaning || card.back || '')})`;
        feedbackEl.classList.remove('hidden');
      } else {
        input.classList.add('input-wrong', 'shake');

        feedbackEl.className = 'typing-feedback feedback-wrong';
        feedbackEl.innerHTML = `<div>Bạn đã gõ: <span class="wrong-typed">${escapeHtml(val)}</span></div><div>Từ đúng: <strong class="correct-answer">${escapeHtml(card.front)}</strong> (${escapeHtml(card.meaning || card.back || '')})</div>`;
        feedbackEl.classList.remove('hidden');
        this.pronounceWord(card.front, 0.85);
        this.reportForgotProgress(card.id);
      }

      btnNext.classList.remove('hidden');
      btnNext.focus();
    };

    btnSubmit.addEventListener('click', check);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    });
    btnNext.addEventListener('click', () => this.nextQuestion());
  }

  // ----------------------------------------------------------------
  // DẠNG 4: ĐIỀN VÀO CHỖ TRỐNG (CLOZE)
  // ----------------------------------------------------------------
  renderClozeItem(q) {
    const card = q.card;
    const container = document.createElement('div');
    container.className = 'mixed-sub-card';

    const rawExample = card.example || `The teacher explained the word [blank] in class.`;
    const targetWord = (card.front || '').trim();
    const regex = new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, 'i');

    let sentenceHtml = '';
    if (regex.test(rawExample)) {
      sentenceHtml = rawExample.replace(regex, `<span class="cloze-blank" id="mixed-active-blank">______</span>`);
    } else {
      sentenceHtml = `Complete with <em>${escapeHtml(card.meaning || card.back || '')}</em>: "<span class="cloze-blank" id="mixed-active-blank">______</span>"`;
    }

    container.innerHTML = `
      <div class="cloze-prompt-section">
        <span class="cloze-prompt-label">Điền từ còn thiếu vào câu:</span>
        <blockquote class="cloze-sentence-en">${sentenceHtml}</blockquote>
        <p class="cloze-meaning-hint">Nghĩa: ${escapeHtml(card.meaning || card.back || '...')}</p>
      </div>

      <div class="typing-form">
        <div class="typing-input-group">
          <input type="text" id="mixed-input-cloze" class="typing-input" placeholder="Gõ từ còn thiếu..." autocomplete="off">
        </div>

        <div class="typing-feedback hidden" id="mixed-feedback"></div>

        <div class="typing-actions-row">
          <button type="button" class="btn btn-primary" id="mixed-btn-submit">Kiểm tra (Enter)</button>
          <button type="button" class="btn btn-primary hidden" id="mixed-btn-next">Câu tiếp theo (Enter)</button>
        </div>
      </div>
    `;

    this.mixedContentArea.appendChild(container);

    const input = container.querySelector('#mixed-input-cloze');
    const activeBlank = container.querySelector('#mixed-active-blank');
    const btnSubmit = container.querySelector('#mixed-btn-submit');
    const btnNext = container.querySelector('#mixed-btn-next');
    const feedbackEl = container.querySelector('#mixed-feedback');

    setTimeout(() => input.focus(), 120);

    const check = () => {
      if (this.isAnswered) {
        this.nextQuestion();
        return;
      }

      const val = input.value.trim();
      if (!val) {
        this.onToast('Vui lòng gõ từ cần điền!');
        input.focus();
        return;
      }

      this.isAnswered = true;
      input.disabled = true;
      btnSubmit.classList.add('hidden');

      const isCorrect = val.toLowerCase() === targetWord.toLowerCase();

      if (isCorrect) {
        this.score++;
        this.breakdown.cloze.correct++;
        this.updateScoreDisplay();
        input.classList.add('input-correct');

        if (activeBlank) {
          activeBlank.textContent = targetWord;
          activeBlank.className = 'cloze-blank blank-filled-correct';
        }

        feedbackEl.className = 'typing-feedback feedback-correct';
        feedbackEl.innerHTML = `<strong>Chính xác!</strong> Từ cần điền là: <em>${escapeHtml(targetWord)}</em>`;
        feedbackEl.classList.remove('hidden');
        this.pronounceWord(targetWord);
      } else {
        input.classList.add('input-wrong', 'shake');

        if (activeBlank) {
          activeBlank.textContent = targetWord;
          activeBlank.className = 'cloze-blank blank-filled-wrong';
        }

        feedbackEl.className = 'typing-feedback feedback-wrong';
        feedbackEl.innerHTML = `<div>Bạn đã gõ: <span class="wrong-typed">${escapeHtml(val)}</span></div><div>Đáp án đúng: <strong class="correct-answer">${escapeHtml(targetWord)}</strong></div>`;
        feedbackEl.classList.remove('hidden');
        this.pronounceWord(targetWord);
        this.reportForgotProgress(card.id);
      }

      btnNext.classList.remove('hidden');
      btnNext.focus();
    };

    btnSubmit.addEventListener('click', check);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    });
    btnNext.addEventListener('click', () => this.nextQuestion());
  }

  // ----------------------------------------------------------------
  // COMMON HELPERS
  // ----------------------------------------------------------------
  updateScoreDisplay() {
    if (this.mixedScoreTracker) {
      this.mixedScoreTracker.textContent = `Điểm: ${this.score}`;
    }
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      this.showResults();
    } else {
      this.renderCurrentQuestion();
    }
  }

  async reportForgotProgress(cardId) {
    try {
      await api.saveProgress({
        cardId: String(cardId),
        setId: String(this.setId || '1'),
        level: 'forgot'
      });
      console.log(`[MixedController] Recorded forgot progress for card ${cardId}`);
    } catch (err) {
      console.warn('[MixedController] Failed to record forgot progress:', err.message);
    }
  }

  pronounceWord(text, rate = 0.95) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  showResults() {
    this.showState('result');

    const total = this.questions.length;
    const percent = total > 0 ? Math.round((this.score / total) * 100) : 0;

    if (this.mixedResultScore) {
      this.mixedResultScore.textContent = `${this.score} / ${total}`;
    }
    if (this.mixedResultPercent) {
      this.mixedResultPercent.textContent = `${percent}%`;
    }

    // Render Breakdown Grid 4 Kỹ năng
    if (this.mixedBreakdownGrid) {
      this.mixedBreakdownGrid.innerHTML = '';
      const order = ['quiz', 'typing', 'listening', 'cloze'];

      order.forEach(typeKey => {
        const item = this.breakdown[typeKey];
        if (item.total === 0) return;

        const subPct = Math.round((item.correct / item.total) * 100);
        const col = document.createElement('div');
        col.className = 'mixed-breakdown-card';

        col.innerHTML = `
          <span class="breakdown-skill-title">${item.label}</span>
          <span class="breakdown-skill-score">${item.correct} / ${item.total}</span>
          <div class="breakdown-mini-bar">
            <div class="breakdown-mini-fill" style="width: ${subPct}%;"></div>
          </div>
          <span class="breakdown-skill-pct">${subPct}%</span>
        `;

        this.mixedBreakdownGrid.appendChild(col);
      });
    }

    let badgeText = 'IELTS Antigravity Master 🏆';
    let badgeClass = 'badge-result-perfect';
    let descText = 'Phong độ xuất sắc toàn diện! Bạn làm chủ cả 4 kỹ năng Nhận biết, Viết chính tả, Nghe phát âm và Vận dụng ngữ cảnh.';

    if (percent === 100) {
      badgeText = 'Hoàn hảo 100% 🌟';
      badgeClass = 'badge-result-perfect';
      descText = 'Đỉnh cao ghi nhớ! Tất cả 4 dạng câu hỏi đều được bạn xử lý chính xác tuyệt đối.';
    } else if (percent >= 75) {
      badgeText = 'Khá giỏi! 🔥';
      badgeClass = 'badge-result-excellent';
      descText = 'Kết quả rất ấn tượng! Xem bảng phân tích bên dưới để biết kỹ năng nào cần tối ưu thêm nhé.';
    } else {
      badgeText = 'Cần luyện thêm! 💪';
      badgeClass = 'badge-result-practice';
      descText = 'Bạn đã hoàn thành phiên học tổng hợp. Các từ sai đã được tự động lưu vào mục Cần ôn tập để ôn lại!';
    }

    if (this.mixedResultBadge) {
      this.mixedResultBadge.textContent = badgeText;
      this.mixedResultBadge.className = `mixed-result-badge ${badgeClass}`;
    }
    if (this.mixedResultDesc) {
      this.mixedResultDesc.textContent = descText;
    }
  }

  /**
   * SPRINT 12 (Task F23): Dọn dẹp âm thanh khi chuyển mode
   */
  cleanup() {
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
      this.speechTimeout = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  showState(state) {
    if (this.mixedLoading) this.mixedLoading.classList.add('hidden');
    if (this.mixedEmpty) this.mixedEmpty.classList.add('hidden');
    if (this.mixedError) this.mixedError.classList.add('hidden');
    if (this.mixedCardWrapper) this.mixedCardWrapper.classList.add('hidden');
    if (this.mixedResultWrapper) this.mixedResultWrapper.classList.add('hidden');

    switch (state) {
      case 'loading':
        if (this.mixedHeaderBar) this.mixedHeaderBar.classList.remove('hidden');
        if (this.mixedLoading) this.mixedLoading.classList.remove('hidden');
        break;
      case 'empty':
        if (this.mixedHeaderBar) this.mixedHeaderBar.classList.add('hidden');
        if (this.mixedEmpty) this.mixedEmpty.classList.remove('hidden');
        break;
      case 'error':
        if (this.mixedHeaderBar) this.mixedHeaderBar.classList.add('hidden');
        if (this.mixedError) this.mixedError.classList.remove('hidden');
        break;
      case 'card':
        if (this.mixedHeaderBar) this.mixedHeaderBar.classList.remove('hidden');
        if (this.mixedCardWrapper) this.mixedCardWrapper.classList.remove('hidden');
        break;
      case 'result':
        if (this.mixedHeaderBar) this.mixedHeaderBar.classList.add('hidden');
        if (this.mixedResultWrapper) this.mixedResultWrapper.classList.remove('hidden');
        break;
    }
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  handleKeyInput(keyNum) {
    const q = this.questions[this.currentIndex];
    if (!q || q.type !== 'quiz' || this.isAnswered) return;
    const idx = keyNum - 1;
    if (idx >= 0 && idx < (q.options || []).length) {
      const optionsGrid = this.mixedContentArea.querySelector('#mixed-options-grid');
      const feedbackEl = this.mixedContentArea.querySelector('#mixed-feedback');
      const btnNext = this.mixedContentArea.querySelector('#mixed-btn-next');
      if (optionsGrid && feedbackEl && btnNext) {
        this.handleQuizAnswer(idx, q, optionsGrid, feedbackEl, btnNext);
      }
    }
  }

  pronounceCurrentWord() {
    const q = this.questions[this.currentIndex];
    if (q && q.card && q.card.front) {
      this.pronounceWord(q.card.front, 0.95);
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
