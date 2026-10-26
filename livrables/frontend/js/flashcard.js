/**
 * ========================================================
 * VOCABMASTER - FLASHCARD CONTROLLER (FLASHCARD.JS)
 * Sprint 2: 3-Column Layout, Rating & Customization Sidebar
 * ========================================================
 */

import { attachTiltPhysics } from './antigravity.js';

export class FlashcardController {
  constructor(options = {}) {
    this.cards = [];
    this.originalCards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.currentSet = null;
    this.cardRatings = new Map(); // cardId -> "forgot" | "vague" | "remembered" | "mastered"

    // Preferences with localStorage persistence
    this.preferences = {
      voiceAccent: localStorage.getItem('vocab_pref_voice') || 'en-US',
      frontEnFirst: localStorage.getItem('vocab_pref_front_first') !== 'false',
      showPhonetic: localStorage.getItem('vocab_pref_phonetic') !== 'false',
      showExample: localStorage.getItem('vocab_pref_example') !== 'false',
      showSynAnt: localStorage.getItem('vocab_pref_syn_ant') !== 'false',
      autoPlay: localStorage.getItem('vocab_pref_auto_play') === 'true',
      themeColor: localStorage.getItem('vocab_pref_theme') || 'indigo'
    };

    // Callbacks
    this.onComplete = options.onComplete || (() => {});
    this.onToast = options.onToast || ((msg) => console.log(msg));
    this.onRate = options.onRate || (() => {});

    this.bindDomElements();
    this.initEvents();
    this.applyPreferencesToUI();
  }

  bindDomElements() {
    // Center Card Elements
    this.cardElement = document.getElementById('flashcard-element');
    this.cardFrontBadge = document.getElementById('card-face-front-badge');
    this.cardBackBadge = document.getElementById('card-face-back-badge');
    this.frontWordEl = document.getElementById('card-front-word');
    this.phoneticIpaEl = document.getElementById('card-phonetic-ipa');
    this.backReminderEl = document.getElementById('card-back-word-reminder');
    this.backMeaningEl = document.getElementById('card-back-meaning');
    this.exampleContainerEl = document.getElementById('card-example-container');
    this.exampleTextEl = document.getElementById('card-example-text');
    this.exampleViSubEl = document.getElementById('card-example-vi-sub');
    this.cardRatingPillFront = document.getElementById('card-rating-pill-front');
    this.cardRatingPillBack = document.getElementById('card-rating-pill-back');

    // Controls
    this.btnPrev = document.getElementById('btn-prev-card');
    this.btnNext = document.getElementById('btn-next-card');
    this.btnFlip = document.getElementById('btn-flip-card');
    this.btnAudioFront = document.getElementById('btn-audio-front');
    this.btnAudioBack = document.getElementById('btn-audio-back');
    this.pillsStripEl = document.getElementById('card-pills-strip');

    // Column 1 (Left): Detailed Word Panel
    this.sideWordType = document.getElementById('side-word-type');
    this.sideWordText = document.getElementById('side-word-text');
    this.sideWordPhonetic = document.getElementById('side-word-phonetic');
    this.sideWordMeaning = document.getElementById('side-word-meaning');
    this.sideWordExample = document.getElementById('side-word-example');
    this.sideWordExampleVi = document.getElementById('side-word-example-vi');
    this.sideWordSynonyms = document.getElementById('side-word-synonyms');
    this.sideWordAntonyms = document.getElementById('side-word-antonyms');
    this.sideExampleWrapper = document.getElementById('side-example-wrapper');
    this.sideSynAntWrapper = document.getElementById('side-syn-ant-wrapper');
    this.btnSideAudio = document.getElementById('btn-side-audio');

    // Column 2: Rating Buttons
    this.ratingButtons = document.querySelectorAll('.btn-rating');

    // Column 3 (Right): Sidebar Controls
    this.optVoiceAccent = document.getElementById('opt-voice-accent');
    this.optFrontEnFirst = document.getElementById('opt-front-en-first');
    this.optShowPhonetic = document.getElementById('opt-show-phonetic');
    this.optShowExample = document.getElementById('opt-show-example');
    this.optShowSynAnt = document.getElementById('opt-show-syn-ant');
    this.optAutoPlay = document.getElementById('opt-auto-play');
    this.btnSidebarShuffle = document.getElementById('btn-sidebar-shuffle');
    this.themePalette = document.getElementById('theme-color-palette');
  }

  initEvents() {
    // 3D tilt physics & flip on card click
    if (this.cardElement) {
      attachTiltPhysics(this.cardElement);

      this.cardElement.addEventListener('click', (e) => {
        if (e.target.closest('.btn-card-audio')) return;
        this.flip();
      });
    }

    // Audio buttons
    [this.btnAudioFront, this.btnAudioBack, this.btnSideAudio].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.pronounceCurrentCard();
        });
      }
    });

    // Rating buttons
    if (this.ratingButtons) {
      this.ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const level = btn.getAttribute('data-level');
          if (level) this.rateCurrentCard(level);
        });
      });
    }

    // Sidebar inputs
    if (this.optVoiceAccent) {
      this.optVoiceAccent.addEventListener('change', (e) => {
        this.preferences.voiceAccent = e.target.value;
        localStorage.setItem('vocab_pref_voice', e.target.value);
        this.onToast(`Đã đổi giọng phát âm: ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    if (this.optFrontEnFirst) {
      this.optFrontEnFirst.addEventListener('change', (e) => {
        this.preferences.frontEnFirst = e.target.checked;
        localStorage.setItem('vocab_pref_front_first', String(e.target.checked));
        this.renderCurrentCard();
      });
    }

    if (this.optShowPhonetic) {
      this.optShowPhonetic.addEventListener('change', (e) => {
        this.preferences.showPhonetic = e.target.checked;
        localStorage.setItem('vocab_pref_phonetic', String(e.target.checked));
        this.applyVisibilityPreferences();
      });
    }

    if (this.optShowExample) {
      this.optShowExample.addEventListener('change', (e) => {
        this.preferences.showExample = e.target.checked;
        localStorage.setItem('vocab_pref_example', String(e.target.checked));
        this.applyVisibilityPreferences();
      });
    }

    if (this.optShowSynAnt) {
      this.optShowSynAnt.addEventListener('change', (e) => {
        this.preferences.showSynAnt = e.target.checked;
        localStorage.setItem('vocab_pref_syn_ant', String(e.target.checked));
        this.applyVisibilityPreferences();
      });
    }

    if (this.optAutoPlay) {
      this.optAutoPlay.addEventListener('change', (e) => {
        this.preferences.autoPlay = e.target.checked;
        localStorage.setItem('vocab_pref_auto_play', String(e.target.checked));
        this.onToast(e.target.checked ? 'Đã bật tự động phát âm khi chuyển thẻ.' : 'Đã tắt tự động phát âm.');
      });
    }

    if (this.btnSidebarShuffle) {
      this.btnSidebarShuffle.addEventListener('click', () => this.shuffle());
    }

    if (this.themePalette) {
      this.themePalette.addEventListener('click', (e) => {
        const dot = e.target.closest('.theme-dot');
        if (dot) {
          const color = dot.getAttribute('data-color');
          this.setThemeColor(color);
        }
      });
    }
  }

  applyPreferencesToUI() {
    if (this.optVoiceAccent) this.optVoiceAccent.value = this.preferences.voiceAccent;
    if (this.optFrontEnFirst) this.optFrontEnFirst.checked = this.preferences.frontEnFirst;
    if (this.optShowPhonetic) this.optShowPhonetic.checked = this.preferences.showPhonetic;
    if (this.optShowExample) this.optShowExample.checked = this.preferences.showExample;
    if (this.optShowSynAnt) this.optShowSynAnt.checked = this.preferences.showSynAnt;
    if (this.optAutoPlay) this.optAutoPlay.checked = this.preferences.autoPlay;
    this.setThemeColor(this.preferences.themeColor, false);
    this.applyVisibilityPreferences();
  }

  setThemeColor(color, save = true) {
    if (!color) return;
    this.preferences.themeColor = color;
    if (save) localStorage.setItem('vocab_pref_theme', color);

    if (color === 'indigo') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', color);
    }

    if (this.themePalette) {
      this.themePalette.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.getAttribute('data-color') === color);
      });
    }
  }

  applyVisibilityPreferences() {
    // Phonetic visibility
    const phoneticDisplay = this.preferences.showPhonetic ? 'inline-block' : 'none';
    if (this.phoneticIpaEl) this.phoneticIpaEl.style.display = phoneticDisplay;
    if (this.sideWordPhonetic) this.sideWordPhonetic.style.display = phoneticDisplay;

    // Example visibility
    const exampleDisplay = this.preferences.showExample ? 'block' : 'none';
    if (this.exampleContainerEl) this.exampleContainerEl.style.display = exampleDisplay;
    if (this.sideExampleWrapper) this.sideExampleWrapper.style.display = exampleDisplay;

    // Syn/Ant visibility
    if (this.sideSynAntWrapper) {
      this.sideSynAntWrapper.style.display = this.preferences.showSynAnt ? 'flex' : 'none';
    }
  }

  loadCards(cards, currentSet = null, initialRatings = {}) {
    if (!cards || !Array.isArray(cards)) {
      this.cards = [];
      this.originalCards = [];
    } else {
      this.cards = [...cards];
      this.originalCards = [...cards];
    }

    this.currentSet = currentSet;
    this.currentIndex = 0;
    this.isFlipped = false;

    // Load existing ratings into map
    this.cardRatings = new Map(Object.entries(initialRatings || {}));

    this.renderCardPills();
    this.renderCurrentCard();

    // Auto-play if enabled
    if (this.preferences.autoPlay && this.cards.length > 0) {
      setTimeout(() => this.pronounceCurrentCard(), 400);
    }
  }

  getCurrentCard() {
    if (!this.cards || this.cards.length === 0) return null;
    return this.cards[this.currentIndex];
  }

  flip() {
    if (!this.cardElement || this.cards.length === 0) return;
    this.isFlipped = !this.isFlipped;
    this.cardElement.classList.toggle('flipped', this.isFlipped);
  }

  next() {
    if (this.cards.length === 0) return;

    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
      this.cardElement.classList.remove('flipped');
      this.renderCurrentCard();

      if (this.preferences.autoPlay) {
        setTimeout(() => this.pronounceCurrentCard(), 250);
      }
    } else {
      // Reached the end of the set
      this.onComplete({
        total: this.cards.length,
        set: this.currentSet,
        ratings: Object.fromEntries(this.cardRatings)
      });
    }
  }

  prev() {
    if (this.cards.length === 0 || this.currentIndex <= 0) return;
    this.currentIndex--;
    this.isFlipped = false;
    this.cardElement.classList.remove('flipped');
    this.renderCurrentCard();

    if (this.preferences.autoPlay) {
      setTimeout(() => this.pronounceCurrentCard(), 250);
    }
  }

  goToCard(index) {
    if (index < 0 || index >= this.cards.length) return;
    this.currentIndex = index;
    this.isFlipped = false;
    this.cardElement.classList.remove('flipped');
    this.renderCurrentCard();

    if (this.preferences.autoPlay) {
      setTimeout(() => this.pronounceCurrentCard(), 250);
    }
  }

  restart() {
    this.currentIndex = 0;
    this.isFlipped = false;
    if (this.cardElement) {
      this.cardElement.classList.remove('flipped');
    }
    this.renderCurrentCard();
    this.onToast('Đã quay lại thẻ đầu tiên.');
  }

  /**
   * Fisher-Yates Shuffle
   */
  shuffle() {
    if (this.cards.length <= 1) {
      this.onToast('Bộ từ chỉ có 1 thẻ, không thể trộn.');
      return;
    }

    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }

    this.currentIndex = 0;
    this.isFlipped = false;
    if (this.cardElement) {
      this.cardElement.classList.remove('flipped');
    }

    this.renderCardPills();
    this.renderCurrentCard();
    this.onToast(`Đã xáo trộn ngẫu nhiên ${this.cards.length} thẻ từ vựng!`);
  }

  /**
   * Rate current card (Sprint 2: POST /progress)
   */
  async rateCurrentCard(level) {
    const card = this.getCurrentCard();
    if (!card) return;

    // Update local rating map
    this.cardRatings.set(card.id, level);

    // Update UI immediately (optimistic)
    this.renderRatingButtons(level);
    this.updateCardRatingPill(level);
    this.updateCardPills();

    // Trigger onRate callback to dispatch POST /progress and refresh stats
    if (this.onRate) {
      this.onRate({
        cardId: card.id,
        setId: card.setId || (this.currentSet ? this.currentSet.id : '1'),
        level
      });
    }

    // Auto-advance to next card after a pleasant 320ms visual feedback
    setTimeout(() => {
      this.next();
    }, 320);
  }

  renderCurrentCard() {
    const card = this.getCurrentCard();
    if (!card) return;

    // Reset 3D transform style
    if (this.cardElement) {
      this.cardElement.style.transform = this.isFlipped ? 'rotateY(180deg)' : '';
    }

    const enText = card.front || 'Chưa có từ';
    const viText = card.meaning || card.back || 'Chưa có nghĩa';
    const phonetic = card.phonetic ? `/${card.phonetic.replace(/^\/|\/$/g, '')}/` : '';
    const exampleEn = card.example || '';
    const exampleVi = card.exampleVi || '';

    // Face assignment based on preferences.frontEnFirst
    if (this.preferences.frontEnFirst) {
      // Front is English
      if (this.cardFrontBadge) this.cardFrontBadge.textContent = 'Mặt trước • Tiếng Anh';
      if (this.cardBackBadge) this.cardBackBadge.textContent = 'Mặt sau • Tiếng Việt';
      if (this.frontWordEl) this.frontWordEl.textContent = enText;
      if (this.backReminderEl) this.backReminderEl.textContent = enText;
      if (this.backMeaningEl) this.backMeaningEl.textContent = viText;
    } else {
      // Front is Vietnamese
      if (this.cardFrontBadge) this.cardFrontBadge.textContent = 'Mặt trước • Tiếng Việt';
      if (this.cardBackBadge) this.cardBackBadge.textContent = 'Mặt sau • Tiếng Anh';
      if (this.frontWordEl) this.frontWordEl.textContent = viText;
      if (this.backReminderEl) this.backReminderEl.textContent = viText;
      if (this.backMeaningEl) this.backMeaningEl.textContent = enText;
    }

    if (this.phoneticIpaEl) {
      this.phoneticIpaEl.textContent = phonetic;
      this.phoneticIpaEl.style.display = (this.preferences.showPhonetic && phonetic) ? 'inline-block' : 'none';
    }

    // Example in central card
    if (this.exampleTextEl) this.exampleTextEl.textContent = exampleEn || 'Không có câu ví dụ';
    if (this.exampleViSubEl) {
      this.exampleViSubEl.textContent = exampleVi ? `(${exampleVi})` : '';
      this.exampleViSubEl.style.display = exampleVi ? 'block' : 'none';
    }

    // Update Left Column (Thẻ từ chi tiết)
    this.renderSideCard(card);

    // Rating buttons & pill state
    const currentRating = this.cardRatings.get(card.id);
    this.renderRatingButtons(currentRating);
    this.updateCardRatingPill(currentRating);

    // Nav button states
    const totalNum = this.cards.length;
    if (this.btnPrev) {
      this.btnPrev.disabled = this.currentIndex === 0;
    }
    if (this.btnNext) {
      this.btnNext.innerHTML = this.currentIndex === totalNum - 1
        ? `<span>Hoàn tất</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<span>Tiếp</span><kbd class="shortcut-tag">D</kbd><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    }

    this.updateCardPills();
    this.applyVisibilityPreferences();
  }

  renderSideCard(card) {
    if (!card) return;

    if (this.sideWordType) {
      this.sideWordType.textContent = card.wordType || 'Từ vựng';
    }
    if (this.sideWordText) {
      this.sideWordText.textContent = card.front || '--';
    }
    if (this.sideWordPhonetic) {
      const phonetic = card.phonetic ? `/${card.phonetic.replace(/^\/|\/$/g, '')}/` : '';
      this.sideWordPhonetic.textContent = phonetic;
      this.sideWordPhonetic.style.display = (this.preferences.showPhonetic && phonetic) ? 'inline-block' : 'none';
    }
    if (this.sideWordMeaning) {
      this.sideWordMeaning.textContent = card.meaning || card.back || 'Chưa có định nghĩa';
    }
    if (this.sideWordExample) {
      this.sideWordExample.textContent = card.example || 'Chưa có ví dụ';
    }
    if (this.sideWordExampleVi) {
      this.sideWordExampleVi.textContent = card.exampleVi || '';
      this.sideWordExampleVi.style.display = card.exampleVi ? 'block' : 'none';
    }

    // Synonyms
    if (this.sideWordSynonyms) {
      this.sideWordSynonyms.innerHTML = '';
      const syns = Array.isArray(card.synonyms) ? card.synonyms : [];
      if (syns.length === 0) {
        this.sideWordSynonyms.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted);">Không có</span>';
      } else {
        syns.forEach(s => {
          const tag = document.createElement('span');
          tag.className = 'tag-syn';
          tag.textContent = s;
          this.sideWordSynonyms.appendChild(tag);
        });
      }
    }

    // Antonyms
    if (this.sideWordAntonyms) {
      this.sideWordAntonyms.innerHTML = '';
      const ants = Array.isArray(card.antonyms) ? card.antonyms : [];
      if (ants.length === 0) {
        this.sideWordAntonyms.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted);">Không có</span>';
      } else {
        ants.forEach(a => {
          const tag = document.createElement('span');
          tag.className = 'tag-ant';
          tag.textContent = a;
          this.sideWordAntonyms.appendChild(tag);
        });
      }
    }
  }

  renderRatingButtons(activeLevel) {
    if (!this.ratingButtons) return;
    this.ratingButtons.forEach(btn => {
      const level = btn.getAttribute('data-level');
      btn.classList.toggle('active', level === activeLevel);
    });
  }

  updateCardRatingPill(level) {
    const pills = [this.cardRatingPillFront, this.cardRatingPillBack].filter(Boolean);
    if (!level) {
      pills.forEach(p => p.classList.add('hidden'));
      return;
    }

    const labelMap = {
      forgot: 'Quên',
      vague: 'Mơ hồ',
      remembered: 'Đã nhớ',
      mastered: 'Nhớ rất tốt'
    };

    const isMasteredGroup = level === 'remembered' || level === 'mastered';

    pills.forEach(pill => {
      pill.classList.remove('hidden', 'pill-mastered', 'pill-review');
      pill.classList.add(isMasteredGroup ? 'pill-mastered' : 'pill-review');
      pill.textContent = `Đánh giá: ${labelMap[level] || level}`;
    });
  }

  renderCardPills() {
    if (!this.pillsStripEl) return;
    this.pillsStripEl.innerHTML = '';

    this.cards.forEach((card, idx) => {
      const dot = document.createElement('div');
      dot.className = 'card-pill-dot';
      dot.setAttribute('title', `Thẻ ${idx + 1}: ${card.front}`);
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.addEventListener('click', () => this.goToCard(idx));
      this.pillsStripEl.appendChild(dot);
    });
  }

  updateCardPills() {
    if (!this.pillsStripEl) return;
    const dots = this.pillsStripEl.querySelectorAll('.card-pill-dot');
    dots.forEach((dot, idx) => {
      const card = this.cards[idx];
      const rating = card ? this.cardRatings.get(card.id) : null;

      dot.classList.toggle('active', idx === this.currentIndex);
      dot.classList.remove('rated-mastered', 'rated-review');

      if (rating === 'remembered' || rating === 'mastered') {
        dot.classList.add('rated-mastered');
      } else if (rating === 'forgot' || rating === 'vague') {
        dot.classList.add('rated-review');
      }
    });
  }

  /**
   * Pronounce word using audioUrl or Web Speech Synthesis API
   */
  pronounceCurrentCard() {
    const card = this.getCurrentCard();
    if (!card) return;

    const buttons = [this.btnAudioFront, this.btnAudioBack, this.btnSideAudio].filter(Boolean);
    const setAudioPlaying = (playing) => {
      buttons.forEach(btn => btn.classList.toggle('playing', playing));
    };

    if (card.audioUrl) {
      try {
        setAudioPlaying(true);
        const audio = new Audio(card.audioUrl);
        audio.onended = () => setAudioPlaying(false);
        audio.onerror = () => {
          this.speakWithSynthesis(card.front, setAudioPlaying);
        };
        audio.play().catch(() => {
          this.speakWithSynthesis(card.front, setAudioPlaying);
        });
        return;
      } catch (err) {
        // Fallback
      }
    }

    this.speakWithSynthesis(card.front, setAudioPlaying);
  }

  speakWithSynthesis(text, onPlayingChange) {
    if (!('speechSynthesis' in window)) {
      this.onToast('Trình duyệt không hỗ trợ Web Speech API.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.preferences.voiceAccent || 'en-US';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = utterance.lang.slice(0, 2);
    const matchedVoice = voices.find(v => v.lang === utterance.lang) || voices.find(v => v.lang.startsWith(langPrefix));
    if (matchedVoice) utterance.voice = matchedVoice;

    if (onPlayingChange) onPlayingChange(true);
    utterance.onend = () => {
      if (onPlayingChange) onPlayingChange(false);
    };
    utterance.onerror = () => {
      if (onPlayingChange) onPlayingChange(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * SPRINT 12 (Task F23): Dừng âm thanh và Speech Synthesis khi chuyển mode
   */
  stopAudio() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const buttons = [this.btnAudioFront, this.btnAudioBack, this.btnSideAudio].filter(Boolean);
    buttons.forEach(btn => btn.classList.remove('playing'));
  }
}
