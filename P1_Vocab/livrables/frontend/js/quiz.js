/**
 * ========================================================
 * VOCABMASTER - QUIZ CONTROLLER (QUIZ.JS)
 * Sprint 3: Mode Quiz trắc nghiệm (Task F7 & F8)
 * Strictly conforms to contexte/API_CONTRACT.md §6 Quiz
 * ========================================================
 */

import { api } from './api.js';

export class QuizController {
  constructor(options = {}) {
    this.setId = null;
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;
    this.fallbackCards = [];

    // Callbacks
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onBackToFlashcard = options.onBackToFlashcard || (() => {});
    this.onBackToSets = options.onBackToSets || (() => {});

    this.bindDomElements();
    this.initEvents();
  }

  bindDomElements() {
    this.quizContainer = document.getElementById('quiz-stage');
    this.quizLoading = document.getElementById('quiz-loading');
    this.quizEmpty = document.getElementById('quiz-empty');
    this.quizError = document.getElementById('quiz-error');
    this.quizErrorCode = document.getElementById('quiz-error-code');
    this.quizErrorDesc = document.getElementById('quiz-error-desc');
    this.btnRetryQuiz = document.getElementById('btn-retry-quiz');

    this.quizCardWrapper = document.getElementById('quiz-card-wrapper');
    this.quizResultWrapper = document.getElementById('quiz-result-wrapper');

    // Progress
    this.quizProgressText = document.getElementById('quiz-progress-text');
    this.quizProgressBar = document.getElementById('quiz-progress-bar');
    this.quizScoreTracker = document.getElementById('quiz-score-tracker');

    // Question
    this.quizPromptWord = document.getElementById('quiz-prompt-word');
    this.btnQuizAudio = document.getElementById('btn-quiz-audio');
    this.quizOptionsGrid = document.getElementById('quiz-options-grid');
    this.quizFeedback = document.getElementById('quiz-feedback');
    this.btnNextQuestion = document.getElementById('btn-next-question');

    // Results
    this.quizResultScore = document.getElementById('quiz-result-score');
    this.quizResultPercent = document.getElementById('quiz-result-percent');
    this.quizResultBadge = document.getElementById('quiz-result-badge');
    this.quizResultDesc = document.getElementById('quiz-result-desc');
    this.btnQuizRetry = document.getElementById('btn-quiz-retry');
    this.btnQuizBackFlashcard = document.getElementById('btn-quiz-back-flashcard');
    this.btnQuizBackSets = document.getElementById('btn-quiz-back-sets');
  }

  initEvents() {
    if (this.btnQuizAudio) {
      this.btnQuizAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pronounceCurrentPrompt();
      });
    }

    if (this.btnNextQuestion) {
      this.btnNextQuestion.addEventListener('click', () => this.nextQuestion());
    }

    if (this.btnQuizRetry) {
      this.btnQuizRetry.addEventListener('click', () => this.retryQuiz());
    }

    if (this.btnQuizBackFlashcard) {
      this.btnQuizBackFlashcard.addEventListener('click', () => this.onBackToFlashcard());
    }

    if (this.btnQuizBackSets) {
      this.btnQuizBackSets.addEventListener('click', () => this.onBackToSets());
    }

    if (this.btnRetryQuiz) {
      this.btnRetryQuiz.addEventListener('click', () => {
        if (this.setId) this.loadQuiz(this.setId, null, this.fallbackCards);
      });
    }
  }

  /**
   * SPRINT 3 (Task F8): Load Quiz from GET /quiz/:setId?count=
   * Includes smart client fallback generation if backend is not yet restarted or deployed.
   */
  async loadQuiz(setId, count = null, fallbackCards = []) {
    this.setId = String(setId);
    this.fallbackCards = fallbackCards || [];

    // State reset
    this.showState('loading');
    if (this.quizCardWrapper) this.quizCardWrapper.style.display = 'none';
    if (this.quizResultWrapper) this.quizResultWrapper.style.display = 'none';

    try {
      const res = await api.getQuiz(this.setId, count);
      const questions = res.questions || [];

      if (!questions || questions.length === 0) {
        // Fallback to client generation if set has cards
        if (this.fallbackCards && this.fallbackCards.length >= 2) {
          this.questions = this.generateFallbackQuiz(this.fallbackCards, count);
        } else {
          this.showState('empty');
          return;
        }
      } else {
        // Successfully loaded from Contract API
        this.questions = questions;
      }

      this.startQuizSession();
    } catch (err) {
      console.warn('GET /quiz/:setId warning:', err.message);

      // If backend endpoint is not ready (404/ROUTE_NOT_FOUND/NETWORK_ERROR), generate from fallback cards
      if (this.fallbackCards && this.fallbackCards.length >= 2) {
        this.questions = this.generateFallbackQuiz(this.fallbackCards, count);
        this.startQuizSession();
        this.onToast('Đang chạy Quiz với câu hỏi từ bộ từ vựng.');
      } else {
        this.showState('error', err.code || 'UNKNOWN_ERROR', err.message);
      }
    }
  }

  showState(stateName, errorCode = '', errorDesc = '') {
    if (this.quizLoading) this.quizLoading.classList.toggle('hidden', stateName !== 'loading');
    if (this.quizEmpty) this.quizEmpty.classList.toggle('hidden', stateName !== 'empty');
    if (this.quizError) this.quizError.classList.toggle('hidden', stateName !== 'error');

    if (stateName === 'error') {
      if (this.quizErrorCode) this.quizErrorCode.textContent = `Mã lỗi: ${errorCode}`;
      if (this.quizErrorDesc) this.quizErrorDesc.textContent = errorDesc || 'Không thể tải câu hỏi trắc nghiệm từ API.';
    }
  }

  startQuizSession() {
    this.showState('none');
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    if (this.quizCardWrapper) this.quizCardWrapper.style.display = 'block';
    if (this.quizResultWrapper) this.quizResultWrapper.style.display = 'none';

    this.renderQuestion();
  }

  renderQuestion() {
    if (this.currentIndex >= this.questions.length) {
      this.showResults();
      return;
    }

    const q = this.questions[this.currentIndex];
    this.isAnswered = false;

    // Progress updates
    const currentNum = this.currentIndex + 1;
    const totalNum = this.questions.length;
    const pct = Math.round((currentNum / totalNum) * 100);

    if (this.quizProgressText) this.quizProgressText.textContent = `Câu hỏi ${currentNum} / ${totalNum}`;
    if (this.quizProgressBar) this.quizProgressBar.style.width = `${pct}%`;
    if (this.quizScoreTracker) this.quizScoreTracker.textContent = `Điểm: ${this.score}`;

    // Prompt word
    if (this.quizPromptWord) this.quizPromptWord.textContent = q.prompt || '--';

    // Clear feedback and hide next button
    if (this.quizFeedback) {
      this.quizFeedback.className = 'quiz-feedback hidden';
      this.quizFeedback.textContent = '';
    }
    if (this.btnNextQuestion) {
      this.btnNextQuestion.classList.add('hidden');
    }

    // Render 4 options
    if (this.quizOptionsGrid) {
      this.quizOptionsGrid.innerHTML = '';

      const options = Array.isArray(q.options) ? q.options : [];
      options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-quiz-option';
        btn.setAttribute('data-index', String(idx));

        btn.innerHTML = `
          <span class="quiz-option-key">${idx + 1}</span>
          <span class="quiz-option-text">${escapeHtml(optText)}</span>
          <span class="quiz-option-icon"></span>
        `;

        btn.addEventListener('click', () => this.handleAnswerSelection(idx));
        this.quizOptionsGrid.appendChild(btn);
      });
    }

    // Auto pronounce prompt word
    this.pronounceCurrentPrompt();
  }

  /**
   * SPRINT 3 (Task F7 & F8): Chấm đúng/sai dùng answerIndex từ API
   */
  async handleAnswerSelection(selectedIndex) {
    if (this.isAnswered || this.currentIndex >= this.questions.length) return;
    this.isAnswered = true;

    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIndex === q.answerIndex;

    const optionButtons = this.quizOptionsGrid.querySelectorAll('.btn-quiz-option');

    // Disable all options
    optionButtons.forEach(btn => btn.disabled = true);

    const selectedBtn = optionButtons[selectedIndex];
    const correctBtn = optionButtons[q.answerIndex];

    if (isCorrect) {
      this.score++;
      if (selectedBtn) {
        selectedBtn.classList.add('option-correct');
        const icon = selectedBtn.querySelector('.quiz-option-icon');
        if (icon) icon.innerHTML = '✔';
      }

      if (this.quizFeedback) {
        this.quizFeedback.className = 'quiz-feedback feedback-correct';
        this.quizFeedback.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Chính xác! Bạn ghi nhớ rất tốt từ này.</span>
        `;
      }
    } else {
      if (selectedBtn) {
        selectedBtn.classList.add('option-wrong');
        const icon = selectedBtn.querySelector('.quiz-option-icon');
        if (icon) icon.innerHTML = '✖';
      }

      if (correctBtn) {
        correctBtn.classList.add('option-highlight-correct');
        const icon = correctBtn.querySelector('.quiz-option-icon');
        if (icon) icon.innerHTML = '✔';
      }

      const correctMeaning = q.options[q.answerIndex] || '';
      if (this.quizFeedback) {
        this.quizFeedback.className = 'quiz-feedback feedback-wrong';
        this.quizFeedback.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <span>Chưa chính xác! Đáp án đúng là: <strong>${escapeHtml(correctMeaning)}</strong></span>
        `;
      }

      // SPRINT 3 (Task F8): Quiz sai gửi POST /progress level: "forgot" để ghi nhận cần ôn tập
      if (q.cardId && this.setId) {
        api.saveProgress({ cardId: q.cardId, setId: this.setId, level: 'forgot' }).catch(() => {
          // Silent fallback if progress endpoint offline
        });
      }
    }

    if (this.quizScoreTracker) {
      this.quizScoreTracker.textContent = `Điểm: ${this.score}`;
    }

    // Show Next Button
    if (this.btnNextQuestion) {
      this.btnNextQuestion.classList.remove('hidden');
      this.btnNextQuestion.focus();
    }
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex < this.questions.length) {
      this.renderQuestion();
    } else {
      this.showResults();
    }
  }

  showResults() {
    if (this.quizCardWrapper) this.quizCardWrapper.style.display = 'none';
    if (this.quizResultWrapper) this.quizResultWrapper.style.display = 'block';

    const total = this.questions.length;
    const percent = total > 0 ? Math.round((this.score / total) * 100) : 0;

    if (this.quizResultScore) this.quizResultScore.textContent = `${this.score} / ${total}`;
    if (this.quizResultPercent) this.quizResultPercent.textContent = `${percent}%`;

    let badgeText = 'Hoàn thành';
    let badgeClass = 'badge-result-good';
    let desc = 'Bạn đã hoàn thành bài kiểm tra trắc nghiệm!';

    if (percent === 100) {
      badgeText = 'Xuất sắc! 🏆';
      badgeClass = 'badge-result-perfect';
      desc = 'Tuyệt vời! Bạn đã trả lời đúng 100% tất cả các câu hỏi trong bộ từ vựng này!';
    } else if (percent >= 70) {
      badgeText = 'Khá giỏi! 🌟';
      badgeClass = 'badge-result-good';
      desc = 'Rất tốt! Bạn đã nắm chắc hầu hết các từ vựng cốt lõi.';
    } else {
      badgeText = 'Cần ôn thêm! 📚';
      badgeClass = 'badge-result-review';
      desc = 'Hãy lật thẻ và ôn lại các từ chưa nhớ để đạt điểm số cao hơn nhé!';
    }

    if (this.quizResultBadge) {
      this.quizResultBadge.textContent = badgeText;
      this.quizResultBadge.className = `quiz-result-badge ${badgeClass}`;
    }
    if (this.quizResultDesc) {
      this.quizResultDesc.textContent = desc;
    }
  }

  retryQuiz() {
    // Re-shuffle questions order
    for (let i = this.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
    }
    this.startQuizSession();
    this.onToast('Đã bắt đầu lại bài kiểm tra trắc nghiệm!');
  }

  /**
   * Generates a 4-option Quiz deck in client memory if backend endpoint is offline
   */
  generateFallbackQuiz(cards, count) {
    const list = [...cards];
    // Shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    const selectedCards = count ? list.slice(0, Math.min(count, list.length)) : list;

    return selectedCards.map(c => {
      const correctMeaning = c.meaning || c.back || c.front;
      const otherMeanings = list
        .filter(item => item.id !== c.id)
        .map(item => item.meaning || item.back || item.front);

      // Pick 3 random distractors
      for (let i = otherMeanings.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherMeanings[i], otherMeanings[j]] = [otherMeanings[j], otherMeanings[i]];
      }
      const distractors = otherMeanings.slice(0, 3);

      // Combine 4 options and shuffle
      const options = [correctMeaning, ...distractors];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      const answerIndex = options.indexOf(correctMeaning);

      return {
        cardId: c.id,
        prompt: c.front,
        options,
        answerIndex: answerIndex !== -1 ? answerIndex : 0
      };
    });
  }

  pronounceCurrentPrompt() {
    if (this.currentIndex >= this.questions.length) return;
    const q = this.questions[this.currentIndex];
    if (!q || !q.prompt) return;

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(q.prompt);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;

    if (this.btnQuizAudio) this.btnQuizAudio.classList.add('playing');
    utterance.onend = () => {
      if (this.btnQuizAudio) this.btnQuizAudio.classList.remove('playing');
    };
    utterance.onerror = () => {
      if (this.btnQuizAudio) this.btnQuizAudio.classList.remove('playing');
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Selects answer by key (1-4)
   */
  handleKeyInput(keyNumber) {
    if (this.isAnswered) {
      // If already answered, pressing Space or Enter goes to next question
      return;
    }
    const idx = keyNumber - 1;
    if (idx >= 0 && idx < 4) {
      this.handleAnswerSelection(idx);
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
