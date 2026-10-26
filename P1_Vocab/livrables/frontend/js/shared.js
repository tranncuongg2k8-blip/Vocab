/**
 * ========================================================
 * VOCABMASTER - SPRINT 8: SHARED DECK CONTROLLER (SHARED.JS)
 * Task F18: Trang xem deck được chia sẻ (Public View & Clone & Study)
 * Strictly conforms to contexte/API_CONTRACT.md §13
 * ========================================================
 */

import { api } from './api.js';

export class SharedDeckController {
  constructor({ onToast, onStudyDeck, onGoHome, onCloneSuccess }) {
    this.onToast = onToast || console.log;
    this.onStudyDeck = onStudyDeck || (() => {});
    this.onGoHome = onGoHome || (() => {});
    this.onCloneSuccess = onCloneSuccess || (() => {});

    this.currentShareId = null;
    this.sharedData = null; // { deck, groups, cards, total }
    this.isLoading = false;

    this.bindDomElements();
    this.bindEvents();
  }

  bindDomElements() {
    this.viewSharedDeck = document.getElementById('view-shared-deck');
    this.btnBackHome = document.getElementById('btn-back-shared-home');

    // Header elements
    this.deckTitle = document.getElementById('shared-deck-title');
    this.deckStatusBadge = document.getElementById('shared-deck-status-badge');
    this.deckCardCount = document.getElementById('shared-deck-card-count');
    this.deckGroupCount = document.getElementById('shared-deck-group-count');

    // Header action buttons
    this.btnStudyDeck = document.getElementById('btn-study-shared-deck');
    this.btnCloneDeck = document.getElementById('btn-clone-shared-deck');
    this.btnCopyShareLink = document.getElementById('btn-copy-shared-link');

    // State containers
    this.loadingContainer = document.getElementById('shared-deck-loading');
    this.emptyContainer = document.getElementById('shared-deck-empty');
    this.errorContainer = document.getElementById('shared-deck-error');
    this.errorCode = document.getElementById('shared-deck-error-code');
    this.errorDesc = document.getElementById('shared-deck-error-desc');
    this.btnRetry = document.getElementById('btn-retry-shared-deck');
    this.btnErrorBackHome = document.getElementById('btn-error-shared-back-home');
    this.btnEmptyBackHome = document.getElementById('btn-empty-shared-back-home');

    // Content container
    this.contentContainer = document.getElementById('shared-deck-content');
    this.groupsContainer = document.getElementById('shared-deck-groups-summary');
    this.cardsTableBody = document.getElementById('shared-cards-table-body');
  }

  bindEvents() {
    if (this.btnBackHome) {
      this.btnBackHome.addEventListener('click', () => this.onGoHome());
    }
    if (this.btnErrorBackHome) {
      this.btnErrorBackHome.addEventListener('click', () => this.onGoHome());
    }
    if (this.btnEmptyBackHome) {
      this.btnEmptyBackHome.addEventListener('click', () => this.onGoHome());
    }

    if (this.btnRetry) {
      this.btnRetry.addEventListener('click', () => {
        if (this.currentShareId) this.loadSharedDeck(this.currentShareId);
      });
    }

    if (this.btnStudyDeck) {
      this.btnStudyDeck.addEventListener('click', () => {
        if (this.sharedData && this.sharedData.deck) {
          this.onStudyDeck({
            id: this.sharedData.deck.id,
            title: this.sharedData.deck.title,
            language: this.sharedData.deck.language || 'en-vi',
            cards: this.sharedData.cards || []
          });
        }
      });
    }

    if (this.btnCloneDeck) {
      this.btnCloneDeck.addEventListener('click', () => this.handleCloneDeck());
    }

    if (this.btnCopyShareLink) {
      this.btnCopyShareLink.addEventListener('click', () => this.handleCopyCurrentUrl());
    }
  }

  /**
   * Load shared deck by shareId (§13)
   */
  async loadSharedDeck(shareId) {
    if (!shareId) return;
    this.currentShareId = shareId;
    this.isLoading = true;
    this.setState('loading');

    try {
      this.sharedData = await api.getSharedDeck(shareId);
      const { deck, groups, cards, total } = this.sharedData;

      if (!deck) {
        throw new Error('Dữ liệu bộ thẻ không hợp lệ');
      }

      this.renderSharedHeader(deck, total);
      this.renderGroupsSummary(groups || []);
      this.renderCardsTable(cards || []);

      if (!cards || cards.length === 0) {
        this.setState('empty');
      } else {
        this.setState('success');
      }
    } catch (err) {
      console.error('Lỗi khi tải bộ thẻ chia sẻ:', err);
      const errCode = err.code || (err.status === 404 ? 'DECK_NOT_FOUND' : 'UNKNOWN_ERROR');
      if (this.errorCode) this.errorCode.textContent = `Mã lỗi: ${errCode}`;
      if (this.errorDesc) {
        if (errCode === 'DECK_NOT_FOUND' || err.status === 404) {
          this.errorDesc.textContent = 'Bộ thẻ không tồn tại, chưa được công bố hoặc liên kết chia sẻ đã hết hạn.';
        } else {
          this.errorDesc.textContent = err.message || 'Không thể tải bộ thẻ được chia sẻ từ máy chủ.';
        }
      }
      this.setState('error');
    } finally {
      this.isLoading = false;
    }
  }

  renderSharedHeader(deck, total) {
    if (this.deckTitle) {
      this.deckTitle.textContent = deck.title || 'Bộ thẻ chia sẻ';
    }

    const isPublished = (deck.status || 'published') === 'published';
    if (this.deckStatusBadge) {
      this.deckStatusBadge.textContent = isPublished ? 'Đã công bố' : 'Bản Nháp';
      this.deckStatusBadge.className = `deck-status-badge ${isPublished ? 'published' : 'draft'}`;
    }

    const actualCardCount = total !== undefined ? total : (this.sharedData?.cards ? this.sharedData.cards.length : (deck.cardCount || 0));
    if (this.deckCardCount) {
      this.deckCardCount.textContent = `${actualCardCount} thẻ`;
    }

    const actualGroupCount = this.sharedData?.groups ? this.sharedData.groups.length : (deck.groupCount || 0);
    if (this.deckGroupCount) {
      this.deckGroupCount.textContent = `${actualGroupCount} nhóm`;
    }
  }

  renderGroupsSummary(groups) {
    if (!this.groupsContainer) return;
    if (!groups || groups.length === 0) {
      this.groupsContainer.innerHTML = '';
      return;
    }

    const totalCards = this.sharedData?.cards?.length || 0;
    this.groupsContainer.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">
          DANH SÁCH NHÓM (${groups.length} nhóm):
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="group-count-pill interactive active" data-group-id="all">
            📁 Tất cả nhóm (${totalCards} thẻ)
          </button>
          ${groups.map(g => `
            <button type="button" class="group-count-pill interactive" data-group-id="${this.escapeHtml(g.id)}">
              📁 ${this.escapeHtml(g.title)} (${g.cardCount || 0} thẻ)
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const pills = this.groupsContainer.querySelectorAll('.group-count-pill.interactive');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const groupId = pill.getAttribute('data-group-id');
        this.filterCardsByGroup(groupId);
      });
    });
  }

  filterCardsByGroup(groupId) {
    const allCards = this.sharedData?.cards || [];
    if (!groupId || groupId === 'all') {
      this.renderCardsTable(allCards);
    } else {
      const filtered = allCards.filter(c => c.groupId === groupId);
      this.renderCardsTable(filtered);
    }
  }

  renderCardsTable(cards) {
    if (!this.cardsTableBody) return;
    this.cardsTableBody.innerHTML = '';

    if (!cards || cards.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          Không có thẻ từ vựng nào trong nhóm này.
        </td>
      `;
      this.cardsTableBody.appendChild(tr);
      return;
    }

    const hasMultipleGroups = this.sharedData?.groups && this.sharedData.groups.length > 1;

    cards.forEach((card, index) => {
      const tr = document.createElement('tr');
      const groupName = hasMultipleGroups && card.groupId
        ? (this.sharedData.groups.find(g => g.id === card.groupId)?.title || '')
        : '';

      tr.innerHTML = `
        <td style="color: var(--text-muted); font-size: 0.8rem; width: 40px;">#${index + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <strong style="color: var(--text-main); font-size: 0.95rem;">${this.escapeHtml(card.front)}</strong>
            <button type="button" class="btn btn-ghost btn-icon btn-sm btn-pronounce-row" title="Phát âm từ này" aria-label="Phát âm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
          ${groupName ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">📁 ${this.escapeHtml(groupName)}</div>` : ''}
        </td>
        <td><code style="font-size: 0.82rem;">${this.escapeHtml(card.phonetic || '')}</code></td>
        <td><span class="word-type-tag">${this.escapeHtml(card.wordType || 'noun')}</span></td>
        <td><span style="color: #6ee7b7; font-weight: 600;">${this.escapeHtml(card.meaning || card.back || '')}</span></td>
        <td>
          <div style="font-size: 0.84rem; line-height: 1.4;">
            <div style="color: var(--text-secondary);">${this.escapeHtml(card.example || '')}</div>
            ${card.exampleVi ? `<div style="color: var(--text-muted); font-size: 0.78rem;">${this.escapeHtml(card.exampleVi)}</div>` : ''}
          </div>
        </td>
      `;

      tr.querySelector('.btn-pronounce-row').addEventListener('click', () => {
        this.pronounceWord(card.front);
      });

      this.cardsTableBody.appendChild(tr);
    });
  }

  async handleCloneDeck() {
    if (!this.sharedData || !this.sharedData.deck) return;

    try {
      if (this.btnCloneDeck) {
        this.btnCloneDeck.disabled = true;
        this.btnCloneDeck.textContent = 'Đang lưu...';
      }

      const cloned = await api.cloneSharedDeck(
        this.sharedData.deck,
        this.sharedData.groups || [],
        this.sharedData.cards || []
      );

      this.onToast(`✔ Đã lưu thành công bộ thẻ "${cloned.title}" vào Bộ thẻ của tôi!`);
      this.onCloneSuccess(cloned);
    } catch (err) {
      this.onToast(`Không thể lưu bộ thẻ: ${err.message}`);
    } finally {
      if (this.btnCloneDeck) {
        this.btnCloneDeck.disabled = false;
        this.btnCloneDeck.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Lưu về Bộ thẻ của tôi
        `;
      }
    }
  }

  handleCopyCurrentUrl() {
    const shareUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => this.onToast('✔ Đã sao chép liên kết chia sẻ vào Clipboard!'))
        .catch(() => this.onToast(`Liên kết: ${shareUrl}`));
    } else {
      this.onToast(`Liên kết: ${shareUrl}`);
    }
  }

  pronounceWord(word) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  setState(state) {
    if (this.loadingContainer) this.loadingContainer.classList.toggle('hidden', state !== 'loading');
    if (this.emptyContainer) this.emptyContainer.classList.toggle('hidden', state !== 'empty');
    if (this.errorContainer) this.errorContainer.classList.toggle('hidden', state !== 'error');
    if (this.contentContainer) this.contentContainer.classList.toggle('hidden', state !== 'success');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
