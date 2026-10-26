/**
 * ========================================================
 * VOCABMASTER - SPRINT 7: MY DECKS CONTROLLER (MYDECKS.JS)
 * Task F15: Trang Bộ thẻ của tôi (Quota, CRUD Deck, Loading/Empty/Error)
 * Strictly conforms to contexte/API_CONTRACT.md §10
 * ========================================================
 */

import { api } from './api.js';

export class MyDecksController {
  constructor({ onToast, onOpenDeckDetail, onStudyDeck, onViewSharedDeck }) {
    this.onToast = onToast || console.log;
    this.onOpenDeckDetail = onOpenDeckDetail || (() => {});
    this.onStudyDeck = onStudyDeck || (() => {});
    this.onViewSharedDeck = onViewSharedDeck || (() => {});

    this.decks = [];
    this.filteredDecks = [];
    this.isLoading = false;
    this.currentSearch = '';
    this.editingDeckId = null;
    this.deletingDeckId = null;
    this.activeShareData = null;

    this.bindDomElements();
    this.bindEvents();
  }

  bindDomElements() {
    this.viewMyDecks = document.getElementById('view-my-decks');
    this.decksContainer = document.getElementById('my-decks-container');
    this.decksLoading = document.getElementById('my-decks-loading');
    this.decksEmpty = document.getElementById('my-decks-empty');
    this.decksError = document.getElementById('my-decks-error');
    this.decksErrorDesc = document.getElementById('my-decks-error-desc');
    this.decksErrorCode = document.getElementById('my-decks-error-code');
    this.btnRetryDecks = document.getElementById('btn-retry-my-decks');
    this.btnRefreshDecks = document.getElementById('btn-refresh-my-decks');
    this.decksSearchInput = document.getElementById('my-decks-search-input');
    this.quotaBadge = document.getElementById('my-decks-quota-badge');

    // Create Deck Elements
    this.btnOpenCreateDeck = document.getElementById('btn-open-create-deck');
    this.btnEmptyCreateDeck = document.getElementById('btn-empty-create-deck');
    this.modalCreateDeck = document.getElementById('modal-create-deck');
    this.inputCreateDeckTitle = document.getElementById('input-create-deck-title');
    this.btnSubmitCreateDeck = document.getElementById('btn-submit-create-deck');
    this.btnCloseCreateDeck = document.getElementById('btn-close-create-deck');
    this.btnCancelCreateDeck = document.getElementById('btn-cancel-create-deck');

    // Edit Deck Elements
    this.modalEditDeck = document.getElementById('modal-edit-deck');
    this.inputEditDeckTitle = document.getElementById('input-edit-deck-title');
    this.btnSubmitEditDeck = document.getElementById('btn-submit-edit-deck');
    this.btnCloseEditDeck = document.getElementById('btn-close-edit-deck');
    this.btnCancelEditDeck = document.getElementById('btn-cancel-edit-deck');

    // Delete Deck Elements
    this.modalDeleteDeck = document.getElementById('modal-delete-deck');
    this.deleteDeckNameSpan = document.getElementById('delete-deck-name');
    this.btnConfirmDeleteDeck = document.getElementById('btn-confirm-delete-deck');
    this.btnCloseDeleteDeck = document.getElementById('btn-close-delete-deck');
    this.btnCancelDeleteDeck = document.getElementById('btn-cancel-delete-deck');

    // Share Deck Modal (Sprint 8: Task F18)
    this.modalShareDeck = document.getElementById('modal-share-deck');
    this.shareDeckTitleText = document.getElementById('share-deck-title-text');
    this.inputShareUrl = document.getElementById('input-share-url');
    this.btnCopyShareUrl = document.getElementById('btn-copy-share-url');
    this.btnOpenSharedPage = document.getElementById('btn-open-shared-page');
    this.btnCloseShareModal = document.getElementById('btn-close-share-modal');
    this.btnCloseShareModalFooter = document.getElementById('btn-close-share-modal-footer');
  }

  bindEvents() {
    if (this.btnRefreshDecks) {
      this.btnRefreshDecks.addEventListener('click', () => this.loadDecks());
    }
    if (this.btnRetryDecks) {
      this.btnRetryDecks.addEventListener('click', () => this.loadDecks());
    }
    if (this.decksSearchInput) {
      this.decksSearchInput.addEventListener('input', (e) => this.filterDecks(e.target.value));
    }

    // Open Create Modal
    if (this.btnOpenCreateDeck) {
      this.btnOpenCreateDeck.addEventListener('click', () => this.openCreateModal());
    }
    if (this.btnEmptyCreateDeck) {
      this.btnEmptyCreateDeck.addEventListener('click', () => this.openCreateModal());
    }

    // Submit Create
    if (this.btnSubmitCreateDeck) {
      this.btnSubmitCreateDeck.addEventListener('click', () => this.handleCreateDeck());
    }
    if (this.inputCreateDeckTitle) {
      this.inputCreateDeckTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleCreateDeck();
      });
    }

    // Close Create Modal
    if (this.btnCloseCreateDeck) {
      this.btnCloseCreateDeck.addEventListener('click', () => this.closeCreateModal());
    }
    if (this.btnCancelCreateDeck) {
      this.btnCancelCreateDeck.addEventListener('click', () => this.closeCreateModal());
    }

    // Submit Edit
    if (this.btnSubmitEditDeck) {
      this.btnSubmitEditDeck.addEventListener('click', () => this.handleEditDeck());
    }
    if (this.inputEditDeckTitle) {
      this.inputEditDeckTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleEditDeck();
      });
    }

    // Close Edit Modal
    if (this.btnCloseEditDeck) {
      this.btnCloseEditDeck.addEventListener('click', () => this.closeEditModal());
    }
    if (this.btnCancelEditDeck) {
      this.btnCancelEditDeck.addEventListener('click', () => this.closeEditModal());
    }

    // Confirm Delete
    if (this.btnConfirmDeleteDeck) {
      this.btnConfirmDeleteDeck.addEventListener('click', () => this.handleDeleteDeck());
    }

    // Close Delete Modal
    if (this.btnCloseDeleteDeck) {
      this.btnCloseDeleteDeck.addEventListener('click', () => this.closeDeleteModal());
    }
    if (this.btnCancelDeleteDeck) {
      this.btnCancelDeleteDeck.addEventListener('click', () => this.closeDeleteModal());
    }

    // Share Modal Events (Sprint 8: Task F18)
    if (this.btnCopyShareUrl) {
      this.btnCopyShareUrl.addEventListener('click', () => this.copyShareUrlFromModal());
    }
    if (this.btnOpenSharedPage) {
      this.btnOpenSharedPage.addEventListener('click', () => {
        if (this.activeShareData && this.activeShareData.shareId) {
          this.closeShareModal();
          this.onViewSharedDeck(this.activeShareData.shareId);
        }
      });
    }
    if (this.btnCloseShareModal) {
      this.btnCloseShareModal.addEventListener('click', () => this.closeShareModal());
    }
    if (this.btnCloseShareModalFooter) {
      this.btnCloseShareModalFooter.addEventListener('click', () => this.closeShareModal());
    }
  }

  /**
   * Load Decks from API §10
   */
  async loadDecks() {
    this.isLoading = true;
    this.setState('loading');

    try {
      this.decks = await api.getMyDecks();
      this.filteredDecks = [...this.decks];
      this.updateQuotaDisplay();

      if (this.decks.length === 0) {
        this.setState('empty');
      } else {
        this.renderDecks();
        this.setState('success');
      }
    } catch (err) {
      console.error('Lỗi khi tải bộ thẻ:', err);
      if (this.decksErrorCode) this.decksErrorCode.textContent = err.code || 'DECK_FETCH_ERROR';
      if (this.decksErrorDesc) this.decksErrorDesc.textContent = err.message || 'Không thể tải danh sách bộ thẻ của bạn.';
      this.setState('error');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * SPRINT 12 (Task F22): Update Deck count badge (Đã xóa bỏ quota 3 bộ thẻ / 600 cards)
   */
  updateQuotaDisplay() {
    if (!this.quotaBadge) return;
    const count = this.decks.length;
    this.quotaBadge.innerHTML = `
      <span>${count} bộ thẻ</span>
    `;

    // Nút Tạo Bộ Thẻ không bao giờ disable vì quota
    if (this.btnOpenCreateDeck) {
      this.btnOpenCreateDeck.removeAttribute('disabled');
      this.btnOpenCreateDeck.setAttribute('title', 'Tạo bộ thẻ mới');
    }
  }

  /**
   * Filter decks by title
   */
  filterDecks(query) {
    this.currentSearch = (query || '').toLowerCase().trim();
    if (!this.currentSearch) {
      this.filteredDecks = [...this.decks];
    } else {
      this.filteredDecks = this.decks.filter(d => 
        (d.title || '').toLowerCase().includes(this.currentSearch)
      );
    }

    if (this.filteredDecks.length === 0) {
      this.setState('empty');
    } else {
      this.renderDecks();
      this.setState('success');
    }
  }

  /**
   * Render deck cards
   */
  renderDecks() {
    if (!this.decksContainer) return;
    this.decksContainer.innerHTML = '';

    this.filteredDecks.forEach(deck => {
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.setAttribute('data-id', deck.id);

      const status = deck.status || 'draft';
      const statusLabel = status === 'published' ? 'Đã công bố' : 'Bản Nháp';
      const statusClass = status === 'published' ? 'published' : 'draft';

      card.innerHTML = `
        <div class="deck-card-header">
          <div class="deck-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <span class="deck-status-badge ${statusClass}">${statusLabel}</span>
        </div>

        <div class="deck-card-body">
          <h3 class="deck-card-title">${this.escapeHtml(deck.title)}</h3>
          <div class="deck-meta-chips">
            <span class="deck-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"></rect>
              </svg>
              ${deck.cardCount || 0} thẻ
            </span>
            <span class="deck-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              ${deck.groupCount || 0} nhóm
            </span>
          </div>
        </div>

        <div class="deck-card-actions">
          <div class="deck-actions-primary">
            <button type="button" class="btn btn-deck-study btn-action-study" title="Học ngay bộ thẻ này">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Học ngay
            </button>
            <button type="button" class="btn btn-deck-detail btn-action-detail" title="Xem chi tiết & quản lý nhóm thẻ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Chi tiết
            </button>
          </div>
          <div class="deck-actions-secondary">
            <button type="button" class="btn btn-ghost btn-sm btn-action-edit" title="Sửa tên bộ thẻ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Sửa
            </button>
            <button type="button" class="btn btn-ghost btn-sm btn-action-share" title="Chia sẻ bộ thẻ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Chia sẻ
            </button>
            <button type="button" class="btn btn-ghost btn-sm btn-action-delete" title="Xóa bộ thẻ" style="color: var(--accent-rose);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Xóa
            </button>
            <button type="button" class="btn btn-ghost btn-sm btn-action-publish ${deck.status === 'published' ? 'published text-emerald' : ''}" title="${deck.status === 'published' ? 'Bộ thẻ đã công bố. Nhấn để quản lý công bố.' : 'Công bố bộ thẻ ra cộng đồng'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${deck.status === 'published'
                  ? '<path d="M20 6L9 17l-5-5"></path>'
                  : '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'}
              </svg>
              ${deck.status === 'published' ? 'Đã công bố' : 'Công bố'}
            </button>
          </div>
        </div>
      `;

      // Event bindings
      card.querySelector('.btn-action-study').addEventListener('click', () => {
        this.onStudyDeck(deck);
      });

      card.querySelector('.btn-action-detail').addEventListener('click', () => {
        this.onOpenDeckDetail(deck);
      });

      card.querySelector('.btn-action-edit').addEventListener('click', () => {
        this.openEditModal(deck);
      });

      card.querySelector('.btn-action-share').addEventListener('click', () => {
        this.handleShareDeck(deck);
      });

      card.querySelector('.btn-action-delete').addEventListener('click', () => {
        this.openDeleteModal(deck);
      });

      card.querySelector('.btn-action-publish').addEventListener('click', () => {
        this.handlePublishDeck(deck);
      });

      this.decksContainer.appendChild(card);
    });
  }

  async handlePublishDeck(deck) {
    const isPublished = deck.status === 'published';
    const actionText = isPublished ? 'hủy công bố' : 'công bố';
    const confirmMsg = isPublished
      ? `Bạn có chắc muốn chuyển bộ thẻ "${deck.title}" về Bản Nháp không?`
      : `Bạn có chắc muốn công bố bộ thẻ "${deck.title}" ra cộng đồng? Sau khi công bố, mọi người có thể xem và học bộ thẻ qua liên kết chia sẻ.`;

    if (!confirm(confirmMsg)) return;

    try {
      if (isPublished) {
        await api.unpublishDeck(deck.id);
        this.onToast(`Đã chuyển bộ thẻ "${deck.title}" về trạng thái Bản Nháp.`);
      } else {
        await api.publishDeck(deck.id);
        this.onToast(`✔ Đã công bố bộ thẻ "${deck.title}" thành công!`);
      }
      await this.loadDecks();
    } catch (err) {
      this.onToast(`Lỗi khi ${actionText}: ${err.message}`);
    }
  }

  async handleShareDeck(deck) {
    try {
      const { shareId, shareUrl } = await api.getShareLink(deck.id);
      this.openShareModal({ deck, shareId, shareUrl });
    } catch (err) {
      this.onToast(`Lỗi tạo liên kết chia sẻ: ${err.message}`);
    }
  }

  openShareModal({ deck, shareId, shareUrl }) {
    this.activeShareData = { deck, shareId, shareUrl };
    if (this.shareDeckTitleText) {
      this.shareDeckTitleText.textContent = deck.title || '';
    }
    if (this.inputShareUrl) {
      this.inputShareUrl.value = shareUrl;
    }
    if (this.modalShareDeck) {
      this.modalShareDeck.classList.add('active');
    }

    // Auto copy to clipboard on open as requested: "nút Chia sẻ (copy link /shared/:shareId)"
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => this.onToast(`✔ Đã tự động sao chép liên kết chia sẻ: ${shareUrl}`))
        .catch(() => {});
    }
  }

  closeShareModal() {
    this.activeShareData = null;
    if (this.modalShareDeck) {
      this.modalShareDeck.classList.remove('active');
    }
  }

  copyShareUrlFromModal() {
    const url = this.inputShareUrl?.value || (this.activeShareData ? this.activeShareData.shareUrl : '');
    if (!url) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => this.onToast('✔ Đã sao chép liên kết chia sẻ vào Clipboard!'))
        .catch(() => this.onToast(`Liên kết chia sẻ: ${url}`));
    } else {
      this.onToast(`Liên kết chia sẻ: ${url}`);
    }
  }

  // --------------------------------------------------------
  // MODALS: CREATE DECK
  // --------------------------------------------------------
  openCreateModal() {
    if (this.inputCreateDeckTitle) {
      this.inputCreateDeckTitle.value = '';
    }
    if (this.modalCreateDeck) {
      this.modalCreateDeck.classList.add('active');
      setTimeout(() => this.inputCreateDeckTitle?.focus(), 100);
    }
  }

  closeCreateModal() {
    if (this.modalCreateDeck) {
      this.modalCreateDeck.classList.remove('active');
    }
  }

  async handleCreateDeck() {
    const title = this.inputCreateDeckTitle?.value?.trim();
    if (!title) {
      this.onToast('Vui lòng nhập tên bộ thẻ!');
      this.inputCreateDeckTitle?.focus();
      return;
    }

    try {
      if (this.btnSubmitCreateDeck) this.btnSubmitCreateDeck.disabled = true;
      const createdDeck = await api.createMyDeck({ title });
      this.onToast(`Đã tạo thành công bộ thẻ "${createdDeck.title}"!`);
      this.closeCreateModal();
      await this.loadDecks();
      // Directly navigate to deck detail
      this.onOpenDeckDetail(createdDeck);
    } catch (err) {
      this.onToast(`Lỗi tạo bộ thẻ: ${err.message}`);
    } finally {
      if (this.btnSubmitCreateDeck) this.btnSubmitCreateDeck.disabled = false;
    }
  }

  // --------------------------------------------------------
  // MODALS: EDIT DECK
  // --------------------------------------------------------
  openEditModal(deck) {
    this.editingDeckId = deck.id;
    if (this.inputEditDeckTitle) {
      this.inputEditDeckTitle.value = deck.title || '';
    }
    if (this.modalEditDeck) {
      this.modalEditDeck.classList.add('active');
      setTimeout(() => this.inputEditDeckTitle?.focus(), 100);
    }
  }

  closeEditModal() {
    this.editingDeckId = null;
    if (this.modalEditDeck) {
      this.modalEditDeck.classList.remove('active');
    }
  }

  async handleEditDeck() {
    if (!this.editingDeckId) return;
    const title = this.inputEditDeckTitle?.value?.trim();
    if (!title) {
      this.onToast('Vui lòng nhập tên bộ thẻ!');
      this.inputEditDeckTitle?.focus();
      return;
    }

    try {
      if (this.btnSubmitEditDeck) this.btnSubmitEditDeck.disabled = true;
      const updated = await api.updateMyDeck(this.editingDeckId, { title });
      this.onToast(`Đã cập nhật tên bộ thẻ thành "${updated.title}"!`);
      this.closeEditModal();
      await this.loadDecks();
    } catch (err) {
      this.onToast(`Lỗi cập nhật: ${err.message}`);
    } finally {
      if (this.btnSubmitEditDeck) this.btnSubmitEditDeck.disabled = false;
    }
  }

  // --------------------------------------------------------
  // MODALS: DELETE DECK
  // --------------------------------------------------------
  openDeleteModal(deck) {
    this.deletingDeckId = deck.id;
    if (this.deleteDeckNameSpan) {
      this.deleteDeckNameSpan.textContent = deck.title || '';
    }
    if (this.modalDeleteDeck) {
      this.modalDeleteDeck.classList.add('active');
    }
  }

  closeDeleteModal() {
    this.deletingDeckId = null;
    if (this.modalDeleteDeck) {
      this.modalDeleteDeck.classList.remove('active');
    }
  }

  async handleDeleteDeck() {
    if (!this.deletingDeckId) return;

    try {
      if (this.btnConfirmDeleteDeck) this.btnConfirmDeleteDeck.disabled = true;
      await api.deleteMyDeck(this.deletingDeckId);
      this.onToast('Đã xóa bộ thẻ thành công!');
      this.closeDeleteModal();
      await this.loadDecks();
    } catch (err) {
      this.onToast(`Lỗi khi xóa bộ thẻ: ${err.message}`);
    } finally {
      if (this.btnConfirmDeleteDeck) this.btnConfirmDeleteDeck.disabled = false;
    }
  }

  // --------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------
  setState(state) {
    if (this.decksLoading) this.decksLoading.classList.toggle('hidden', state !== 'loading');
    if (this.decksEmpty) this.decksEmpty.classList.toggle('hidden', state !== 'empty');
    if (this.decksError) this.decksError.classList.toggle('hidden', state !== 'error');
    if (this.decksContainer) this.decksContainer.classList.toggle('hidden', state !== 'success');
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
