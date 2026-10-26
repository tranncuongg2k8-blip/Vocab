/**
 * ========================================================
 * VOCABMASTER - SPRINT 7: DECK DETAIL & CARD FORM (DECKDETAIL.JS)
 * Task F16: Trang chi tiết Deck + Lưới Groups + Form tạo thẻ thủ công
 * Strictly conforms to contexte/API_CONTRACT.md §11 (13 word types)
 * ========================================================
 */

import { api } from './api.js';

export const WORD_TYPES = [
  { key: 'noun', label: 'Danh từ (n)' },
  { key: 'verb', label: 'Động từ (v)' },
  { key: 'adjective', label: 'Tính từ (adj)' },
  { key: 'adverb', label: 'Trạng từ (adv)' },
  { key: 'preposition', label: 'Giới từ (prep)' },
  { key: 'pronoun', label: 'Đại từ (pron)' },
  { key: 'conjunction', label: 'Liên từ (conj)' },
  { key: 'determiner', label: 'Từ hạn định (det)' },
  { key: 'interjection', label: 'Thán từ (int)' },
  { key: 'phrasal verb', label: 'Cụm động từ (phr v)' },
  { key: 'idiom', label: 'Thành ngữ (idiom)' },
  { key: 'phrase', label: 'Cụm từ (phrase)' },
  { key: 'collocation', label: 'Cụm kết hợp từ (coll)' },
  { key: 'modal verb', label: 'Động từ khiếm khuyết' }
];

export class DeckDetailController {
  constructor({ onToast, onBackToMyDecks, onStudyDeck, onOpenImportModal, onShareDeck }) {
    this.onToast = onToast || console.log;
    this.onBackToMyDecks = onBackToMyDecks || (() => {});
    this.onStudyDeck = onStudyDeck || (() => {});
    this.onOpenImportModal = onOpenImportModal || (() => {});
    this.onShareDeck = onShareDeck || (() => {});

    this.activeDeck = null;
    this.groups = [];
    this.isLoading = false;

    // Active group for creating cards or editing
    this.selectedGroupId = null;
    this.editingGroupId = null;
    this.deletingGroupId = null;

    // Form state
    this.selectedWordType = 'noun';

    this.bindDomElements();
    this.bindEvents();
  }

  bindDomElements() {
    this.viewDeckDetail = document.getElementById('view-deck-detail');
    this.btnBackToMyDecks = document.getElementById('btn-back-to-my-decks');

    // Header info elements
    this.deckDetailTitle = document.getElementById('deck-detail-title');
    this.deckDetailStatusBadge = document.getElementById('deck-detail-status-badge');
    this.deckDetailCardCount = document.getElementById('deck-detail-card-count');
    this.deckDetailGroupCount = document.getElementById('deck-detail-group-count');

    // Header action buttons
    this.btnStudyDeckDetail = document.getElementById('btn-study-deck-detail');
    this.btnOpenImportDeckDetail = document.getElementById('btn-open-import-deck-detail');
    this.btnOpenCreateGroup = document.getElementById('btn-open-create-group');
    this.btnPublishDeck = document.getElementById('btn-publish-deck') || document.getElementById('btn-publish-deck-disabled');
    this.btnShareDeck = document.getElementById('btn-share-deck-detail');

    // Groups grid and state containers
    this.groupsContainer = document.getElementById('groups-container');
    this.groupsLoading = document.getElementById('groups-loading');
    this.groupsEmpty = document.getElementById('groups-empty');
    this.groupsError = document.getElementById('groups-error');
    this.groupsErrorCode = document.getElementById('groups-error-code');
    this.groupsErrorDesc = document.getElementById('groups-error-desc');
    this.btnRetryGroups = document.getElementById('btn-retry-groups');
    this.btnEmptyCreateGroup = document.getElementById('btn-empty-create-group');

    // Group Modals
    this.modalCreateGroup = document.getElementById('modal-create-group');
    this.inputCreateGroupTitle = document.getElementById('input-create-group-title');
    this.btnSubmitCreateGroup = document.getElementById('btn-submit-create-group');
    this.btnCloseCreateGroup = document.getElementById('btn-close-create-group');
    this.btnCancelCreateGroup = document.getElementById('btn-cancel-create-group');

    this.modalEditGroup = document.getElementById('modal-edit-group');
    this.inputEditGroupTitle = document.getElementById('input-edit-group-title');
    this.btnSubmitEditGroup = document.getElementById('btn-submit-edit-group');
    this.btnCloseEditGroup = document.getElementById('btn-close-edit-group');
    this.btnCancelEditGroup = document.getElementById('btn-cancel-edit-group');

    this.modalDeleteGroup = document.getElementById('modal-delete-group');
    this.deleteGroupNameSpan = document.getElementById('delete-group-name');
    this.btnConfirmDeleteGroup = document.getElementById('btn-confirm-delete-group');
    this.btnCloseDeleteGroup = document.getElementById('btn-close-delete-group');
    this.btnCancelDeleteGroup = document.getElementById('btn-cancel-delete-group');

    // Card Form Modal (Ảnh 3)
    this.modalCardForm = document.getElementById('modal-card-form');
    this.cardFormGroupTitle = document.getElementById('card-form-group-title');
    this.inputCardSearch = document.getElementById('input-card-search');
    this.inputCardFront = document.getElementById('input-card-front');
    this.inputCardMeaning = document.getElementById('input-card-meaning');
    this.inputCardPhonetic = document.getElementById('input-card-phonetic');
    this.btnPronouncePhonetic = document.getElementById('btn-pronounce-phonetic');
    this.wordTypeGrid = document.getElementById('word-type-grid');
    this.inputCardExample = document.getElementById('input-card-example');
    this.inputCardExampleVi = document.getElementById('input-card-example-vi');
    this.btnSaveAndContinue = document.getElementById('btn-save-and-continue-card');
    this.btnSaveCard = document.getElementById('btn-save-card');
    this.btnCloseCardForm = document.getElementById('btn-close-card-form');
    this.btnCancelCardForm = document.getElementById('btn-cancel-card-form');

    // Validation messages
    this.errorCardFront = document.getElementById('error-card-front');
    this.errorCardMeaning = document.getElementById('error-card-meaning');

    // Group Cards Preview Modal
    this.modalViewCards = document.getElementById('modal-view-cards');
    this.viewCardsGroupTitle = document.getElementById('view-cards-group-title');
    this.viewCardsContainer = document.getElementById('view-cards-container');
    this.btnCloseViewCards = document.getElementById('btn-close-view-cards');
  }

  bindEvents() {
    // Navigation back
    if (this.btnBackToMyDecks) {
      this.btnBackToMyDecks.addEventListener('click', () => this.onBackToMyDecks());
    }

    // Study
    if (this.btnStudyDeckDetail) {
      this.btnStudyDeckDetail.addEventListener('click', () => {
        if (this.activeDeck) this.onStudyDeck(this.activeDeck);
      });
    }

    // Open Import
    if (this.btnOpenImportDeckDetail) {
      this.btnOpenImportDeckDetail.addEventListener('click', () => {
        if (this.groups.length === 0) {
          this.onToast('Vui lòng tạo ít nhất 1 nhóm trước khi nhập thẻ!');
          this.openCreateGroupModal();
          return;
        }
        this.onOpenImportModal({
          deck: this.activeDeck,
          groups: this.groups,
          selectedGroupId: this.groups[0]?.id
        });
      });
    }

    // Publish & Share (Sprint 8: Task F18)
    if (this.btnPublishDeck) {
      this.btnPublishDeck.addEventListener('click', () => this.handlePublishDeck());
    }
    if (this.btnShareDeck) {
      this.btnShareDeck.addEventListener('click', () => this.handleShareDeck());
    }

    // Create Group triggers
    if (this.btnOpenCreateGroup) {
      this.btnOpenCreateGroup.addEventListener('click', () => this.openCreateGroupModal());
    }
    if (this.btnEmptyCreateGroup) {
      this.btnEmptyCreateGroup.addEventListener('click', () => this.openCreateGroupModal());
    }
    if (this.btnRetryGroups) {
      this.btnRetryGroups.addEventListener('click', () => this.loadGroups());
    }

    // Submit Create Group
    if (this.btnSubmitCreateGroup) {
      this.btnSubmitCreateGroup.addEventListener('click', () => this.handleCreateGroup());
    }
    if (this.inputCreateGroupTitle) {
      this.inputCreateGroupTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleCreateGroup();
      });
    }
    if (this.btnCloseCreateGroup) {
      this.btnCloseCreateGroup.addEventListener('click', () => this.closeCreateGroupModal());
    }
    if (this.btnCancelCreateGroup) {
      this.btnCancelCreateGroup.addEventListener('click', () => this.closeCreateGroupModal());
    }

    // Submit Edit Group
    if (this.btnSubmitEditGroup) {
      this.btnSubmitEditGroup.addEventListener('click', () => this.handleEditGroup());
    }
    if (this.inputEditGroupTitle) {
      this.inputEditGroupTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleEditGroup();
      });
    }
    if (this.btnCloseEditGroup) {
      this.btnCloseEditGroup.addEventListener('click', () => this.closeEditGroupModal());
    }
    if (this.btnCancelEditGroup) {
      this.btnCancelEditGroup.addEventListener('click', () => this.closeEditGroupModal());
    }

    // Confirm Delete Group
    if (this.btnConfirmDeleteGroup) {
      this.btnConfirmDeleteGroup.addEventListener('click', () => this.handleDeleteGroup());
    }
    if (this.btnCloseDeleteGroup) {
      this.btnCloseDeleteGroup.addEventListener('click', () => this.closeDeleteGroupModal());
    }
    if (this.btnCancelDeleteGroup) {
      this.btnCancelDeleteGroup.addEventListener('click', () => this.closeDeleteGroupModal());
    }

    // Card Form Events
    this.renderWordTypePicker();

    if (this.btnPronouncePhonetic) {
      this.btnPronouncePhonetic.addEventListener('click', () => {
        const text = this.inputCardFront?.value?.trim();
        if (text) this.pronounceWord(text);
      });
    }

    if (this.inputCardSearch) {
      this.inputCardSearch.addEventListener('input', (e) => this.handleQuickSearch(e.target.value));
    }

    if (this.btnSaveCard) {
      this.btnSaveCard.addEventListener('click', () => this.handleSaveCard(false));
    }
    if (this.btnSaveAndContinue) {
      this.btnSaveAndContinue.addEventListener('click', () => this.handleSaveCard(true));
    }
    if (this.btnCloseCardForm) {
      this.btnCloseCardForm.addEventListener('click', () => this.closeCardForm());
    }
    if (this.btnCancelCardForm) {
      this.btnCancelCardForm.addEventListener('click', () => this.closeCardForm());
    }

    // Close View Cards
    if (this.btnCloseViewCards) {
      this.btnCloseViewCards.addEventListener('click', () => this.closeViewCardsModal());
    }
  }

  /**
   * Render 13 word types selector
   */
  renderWordTypePicker() {
    if (!this.wordTypeGrid) return;
    this.wordTypeGrid.innerHTML = '';

    WORD_TYPES.forEach(wt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `word-type-btn ${wt.key === this.selectedWordType ? 'active' : ''}`;
      btn.setAttribute('data-key', wt.key);
      btn.textContent = wt.label;
      btn.addEventListener('click', () => {
        this.selectedWordType = wt.key;
        this.wordTypeGrid.querySelectorAll('.word-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      this.wordTypeGrid.appendChild(btn);
    });
  }

  /**
   * Set Active Deck & Load Groups
   */
  async setDeck(deck) {
    this.activeDeck = deck;
    this.updateDeckHeader();
    await this.loadGroups();
  }

  /**
   * Update header metadata
   */
  updateDeckHeader() {
    if (!this.activeDeck) return;
    if (this.deckDetailTitle) this.deckDetailTitle.textContent = this.activeDeck.title;

    const status = this.activeDeck.status || 'draft';
    const statusLabel = status === 'published' ? 'Đã công bố' : 'Bản Nháp';
    const statusClass = status === 'published' ? 'published' : 'draft';

    if (this.deckDetailStatusBadge) {
      this.deckDetailStatusBadge.textContent = statusLabel;
      this.deckDetailStatusBadge.className = `deck-status-badge ${statusClass}`;
    }

    if (this.deckDetailCardCount) {
      this.deckDetailCardCount.textContent = `${this.activeDeck.cardCount || 0} thẻ`;
    }

    if (this.deckDetailGroupCount) {
      this.deckDetailGroupCount.textContent = `${this.activeDeck.groupCount || 0} nhóm`;
    }

    if (this.btnPublishDeck) {
      this.btnPublishDeck.removeAttribute('disabled');
      this.btnPublishDeck.style.opacity = '1';
      this.btnPublishDeck.style.cursor = 'pointer';

      if (status === 'published') {
        this.btnPublishDeck.className = 'btn btn-secondary active';
        this.btnPublishDeck.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Đã công bố
        `;
        this.btnPublishDeck.setAttribute('title', 'Bộ thẻ đã được công bố. Nhấn để chuyển về Bản Nháp nếu muốn.');
      } else {
        this.btnPublishDeck.className = 'btn btn-secondary';
        this.btnPublishDeck.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          Công bố
        `;
        this.btnPublishDeck.setAttribute('title', 'Công bố bộ thẻ này để chia sẻ cho mọi người');
      }
    }
  }

  async handlePublishDeck() {
    if (!this.activeDeck) return;
    const isPublished = (this.activeDeck.status || 'draft') === 'published';
    const actionText = isPublished ? 'hủy công bố' : 'công bố';
    const confirmMsg = isPublished
      ? `Bạn có chắc muốn chuyển bộ thẻ "${this.activeDeck.title}" về Bản Nháp không?`
      : `Bạn có chắc muốn công bố bộ thẻ "${this.activeDeck.title}" ra cộng đồng? Sau khi công bố, bộ thẻ có thể chia sẻ cho mọi người.`;

    if (!confirm(confirmMsg)) return;

    try {
      if (isPublished) {
        await api.unpublishDeck(this.activeDeck.id);
        this.activeDeck.status = 'draft';
        this.onToast(`Đã chuyển bộ thẻ "${this.activeDeck.title}" về trạng thái Bản Nháp.`);
      } else {
        await api.publishDeck(this.activeDeck.id);
        this.activeDeck.status = 'published';
        this.onToast(`✔ Đã công bố bộ thẻ "${this.activeDeck.title}" thành công!`);
      }
      this.updateDeckHeader();
    } catch (err) {
      this.onToast(`Lỗi khi ${actionText}: ${err.message}`);
    }
  }

  handleShareDeck() {
    if (!this.activeDeck) return;
    this.onShareDeck(this.activeDeck);
  }

  /**
   * Load Groups from API §11
   */
  async loadGroups() {
    if (!this.activeDeck) return;
    this.isLoading = true;
    this.setGroupsState('loading');

    try {
      this.groups = await api.getDeckGroups(this.activeDeck.id);
      this.activeDeck.groupCount = this.groups.length;
      this.updateDeckHeader();

      if (this.groups.length === 0) {
        this.setGroupsState('empty');
      } else {
        this.renderGroups();
        this.setGroupsState('success');
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhóm:', err);
      if (this.groupsErrorCode) this.groupsErrorCode.textContent = err.code || 'GROUP_FETCH_ERROR';
      if (this.groupsErrorDesc) this.groupsErrorDesc.textContent = err.message || 'Không thể tải danh sách nhóm của bộ thẻ.';
      this.setGroupsState('error');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render Groups Grid
   */
  renderGroups() {
    if (!this.groupsContainer) return;
    this.groupsContainer.innerHTML = '';

    this.groups.forEach(group => {
      const card = document.createElement('div');
      card.className = 'group-card';
      card.setAttribute('data-id', group.id);

      card.innerHTML = `
        <div class="group-card-header">
          <h4 class="group-card-title">${this.escapeHtml(group.title)}</h4>
          <span class="group-count-pill">${group.cardCount || 0} thẻ</span>
        </div>

        <div class="group-card-actions">
          <div class="group-main-btns">
            <button type="button" class="btn btn-secondary btn-sm btn-action-view-cards" title="Xem danh sách thẻ trong nhóm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Xem Thẻ
            </button>
            <button type="button" class="btn btn-primary btn-sm btn-action-add-card" title="Tạo thẻ mới cho nhóm này">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Tạo Thẻ
            </button>
          </div>
          <div class="group-option-btns">
            <button type="button" class="btn btn-ghost btn-icon btn-sm btn-action-edit-group" title="Sửa tên nhóm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="btn btn-ghost btn-icon btn-sm btn-action-delete-group" title="Xóa nhóm" style="color: var(--accent-rose);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Event bindings
      card.querySelector('.btn-action-view-cards').addEventListener('click', () => {
        this.openViewCardsModal(group);
      });

      card.querySelector('.btn-action-add-card').addEventListener('click', () => {
        this.openCardForm(group);
      });

      card.querySelector('.btn-action-edit-group').addEventListener('click', () => {
        this.openEditGroupModal(group);
      });

      card.querySelector('.btn-action-delete-group').addEventListener('click', () => {
        this.openDeleteGroupModal(group);
      });

      this.groupsContainer.appendChild(card);
    });
  }

  // --------------------------------------------------------
  // MODALS: CREATE GROUP
  // --------------------------------------------------------
  openCreateGroupModal() {
    if (this.inputCreateGroupTitle) this.inputCreateGroupTitle.value = '';
    if (this.modalCreateGroup) {
      this.modalCreateGroup.classList.add('active');
      setTimeout(() => this.inputCreateGroupTitle?.focus(), 100);
    }
  }

  closeCreateGroupModal() {
    if (this.modalCreateGroup) this.modalCreateGroup.classList.remove('active');
  }

  async handleCreateGroup() {
    const title = this.inputCreateGroupTitle?.value?.trim();
    if (!title) {
      this.onToast('Vui lòng nhập tên nhóm!');
      this.inputCreateGroupTitle?.focus();
      return;
    }

    try {
      if (this.btnSubmitCreateGroup) this.btnSubmitCreateGroup.disabled = true;
      const newGroup = await api.createGroup(this.activeDeck.id, { title });
      this.onToast(`Đã tạo nhóm "${newGroup.title}" thành công!`);
      this.closeCreateGroupModal();
      await this.loadGroups();
    } catch (err) {
      this.onToast(`Lỗi tạo nhóm: ${err.message}`);
    } finally {
      if (this.btnSubmitCreateGroup) this.btnSubmitCreateGroup.disabled = false;
    }
  }

  // --------------------------------------------------------
  // MODALS: EDIT GROUP
  // --------------------------------------------------------
  openEditGroupModal(group) {
    this.editingGroupId = group.id;
    if (this.inputEditGroupTitle) this.inputEditGroupTitle.value = group.title || '';
    if (this.modalEditGroup) {
      this.modalEditGroup.classList.add('active');
      setTimeout(() => this.inputEditGroupTitle?.focus(), 100);
    }
  }

  closeEditGroupModal() {
    this.editingGroupId = null;
    if (this.modalEditGroup) this.modalEditGroup.classList.remove('active');
  }

  async handleEditGroup() {
    if (!this.editingGroupId) return;
    const title = this.inputEditGroupTitle?.value?.trim();
    if (!title) {
      this.onToast('Vui lòng nhập tên nhóm!');
      this.inputEditGroupTitle?.focus();
      return;
    }

    try {
      if (this.btnSubmitEditGroup) this.btnSubmitEditGroup.disabled = true;
      const updated = await api.updateGroup(this.editingGroupId, { title });
      this.onToast(`Đã cập nhật tên nhóm thành "${updated.title}"!`);
      this.closeEditGroupModal();
      await this.loadGroups();
    } catch (err) {
      this.onToast(`Lỗi cập nhật: ${err.message}`);
    } finally {
      if (this.btnSubmitEditGroup) this.btnSubmitEditGroup.disabled = false;
    }
  }

  // --------------------------------------------------------
  // MODALS: DELETE GROUP
  // --------------------------------------------------------
  openDeleteGroupModal(group) {
    this.deletingGroupId = group.id;
    if (this.deleteGroupNameSpan) this.deleteGroupNameSpan.textContent = group.title || '';
    if (this.modalDeleteGroup) this.modalDeleteGroup.classList.add('active');
  }

  closeDeleteGroupModal() {
    this.deletingGroupId = null;
    if (this.modalDeleteGroup) this.modalDeleteGroup.classList.remove('active');
  }

  async handleDeleteGroup() {
    if (!this.deletingGroupId) return;

    try {
      if (this.btnConfirmDeleteGroup) this.btnConfirmDeleteGroup.disabled = true;
      await api.deleteGroup(this.deletingGroupId);
      this.onToast('Đã xóa nhóm thành công!');
      this.closeDeleteGroupModal();
      await this.loadGroups();
    } catch (err) {
      this.onToast(`Lỗi khi xóa nhóm: ${err.message}`);
    } finally {
      if (this.btnConfirmDeleteGroup) this.btnConfirmDeleteGroup.disabled = false;
    }
  }

  // --------------------------------------------------------
  // CARD FORM (TASK F16 - ẢNH 3)
  // --------------------------------------------------------
  openCardForm(group) {
    this.selectedGroupId = group.id;
    if (this.cardFormGroupTitle) {
      this.cardFormGroupTitle.textContent = group.title || '';
    }

    this.resetCardForm();
    if (this.modalCardForm) {
      this.modalCardForm.classList.add('active');
      setTimeout(() => this.inputCardFront?.focus(), 100);
    }
  }

  closeCardForm() {
    this.selectedGroupId = null;
    if (this.modalCardForm) this.modalCardForm.classList.remove('active');
  }

  resetCardForm() {
    if (this.inputCardSearch) this.inputCardSearch.value = '';
    if (this.inputCardFront) this.inputCardFront.value = '';
    if (this.inputCardMeaning) this.inputCardMeaning.value = '';
    if (this.inputCardPhonetic) this.inputCardPhonetic.value = '';
    if (this.inputCardExample) this.inputCardExample.value = '';
    if (this.inputCardExampleVi) this.inputCardExampleVi.value = '';

    this.selectedWordType = 'noun';
    this.renderWordTypePicker();

    this.clearValidationErrors();
  }

  clearValidationErrors() {
    if (this.errorCardFront) this.errorCardFront.classList.remove('visible');
    if (this.errorCardMeaning) this.errorCardMeaning.classList.remove('visible');
    if (this.inputCardFront) this.inputCardFront.classList.remove('input-has-error');
    if (this.inputCardMeaning) this.inputCardMeaning.classList.remove('input-has-error');
  }

  handleQuickSearch(val) {
    const query = (val || '').trim().toLowerCase();
    if (!query) return;

    // Quick auto-fill helper for common IELTS words
    const commonIelts = {
      'sustainable': { meaning: 'bền vững', phonetic: '/səˈsteɪ.nə.bəl/', type: 'adjective', ex: 'We need sustainable solutions.', exVi: 'Chúng ta cần các giải pháp bền vững.' },
      'innovation': { meaning: 'sự đổi mới sáng tạo', phonetic: '/ˌɪn.əˈveɪ.ʃən/', type: 'noun', ex: 'Technological innovation drives growth.', exVi: 'Đổi mới công nghệ thúc đẩy tăng trưởng.' },
      'biodiversity': { meaning: 'đa dạng sinh học', phonetic: '/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/', type: 'noun', ex: 'Preserve biodiversity in rainforests.', exVi: 'Bảo tồn đa dạng sinh học trong rừng mưa nhiệt đới.' },
      'comprehensive': { meaning: 'toàn diện, bao quát', phonetic: '/ˌkɒm.prɪˈhen.sɪv/', type: 'adjective', ex: 'A comprehensive study was conducted.', exVi: 'Một nghiên cứu toàn diện đã được tiến hành.' },
      'mitigate': { meaning: 'giảm nhẹ, xoa dịu', phonetic: '/ˈmɪt.ɪ.ɡeɪt/', type: 'verb', ex: 'Measures to mitigate climate change.', exVi: 'Các biện pháp để giảm nhẹ biến đổi khí hậu.' }
    };

    if (commonIelts[query]) {
      const item = commonIelts[query];
      if (this.inputCardFront) this.inputCardFront.value = query;
      if (this.inputCardMeaning) this.inputCardMeaning.value = item.meaning;
      if (this.inputCardPhonetic) this.inputCardPhonetic.value = item.phonetic;
      if (this.inputCardExample) this.inputCardExample.value = item.ex;
      if (this.inputCardExampleVi) this.inputCardExampleVi.value = item.exVi;
      this.selectedWordType = item.type;
      this.renderWordTypePicker();
    }
  }

  async handleSaveCard(continueAdding = false) {
    if (!this.selectedGroupId) return;

    this.clearValidationErrors();

    const front = this.inputCardFront?.value?.trim();
    const meaning = this.inputCardMeaning?.value?.trim();
    const phonetic = this.inputCardPhonetic?.value?.trim() || '';
    const example = this.inputCardExample?.value?.trim() || '';
    const exampleVi = this.inputCardExampleVi?.value?.trim() || '';
    const wordType = this.selectedWordType || 'noun';

    let hasError = false;

    if (!front) {
      if (this.errorCardFront) this.errorCardFront.classList.add('visible');
      if (this.inputCardFront) this.inputCardFront.classList.add('input-has-error');
      hasError = true;
    }

    if (!meaning) {
      if (this.errorCardMeaning) this.errorCardMeaning.classList.add('visible');
      if (this.inputCardMeaning) this.inputCardMeaning.classList.add('input-has-error');
      hasError = true;
    }

    if (hasError) {
      this.onToast('Vui lòng điền đầy đủ Từ vựng và Bản dịch bắt buộc!');
      return;
    }

    const payload = {
      front,
      meaning,
      back: meaning,
      phonetic,
      wordType,
      example,
      exampleVi
    };

    try {
      if (this.btnSaveCard) this.btnSaveCard.disabled = true;
      if (this.btnSaveAndContinue) this.btnSaveAndContinue.disabled = true;

      const createdCard = await api.createCard(this.selectedGroupId, payload);
      this.onToast(`Đã tạo thẻ "${createdCard.front}" thành công!`);

      // Refresh groups to update counts
      await this.loadGroups();

      if (continueAdding) {
        this.resetCardForm();
        setTimeout(() => this.inputCardFront?.focus(), 100);
      } else {
        this.closeCardForm();
      }
    } catch (err) {
      this.onToast(`Lỗi tạo thẻ: ${err.message}`);
    } finally {
      if (this.btnSaveCard) this.btnSaveCard.disabled = false;
      if (this.btnSaveAndContinue) this.btnSaveAndContinue.disabled = false;
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

  // --------------------------------------------------------
  // VIEW CARDS MODAL
  // --------------------------------------------------------
  openViewCardsModal(group) {
    if (this.viewCardsGroupTitle) this.viewCardsGroupTitle.textContent = group.title;
    if (this.viewCardsContainer) this.viewCardsContainer.innerHTML = '<div class="loading-spinner"></div>';
    if (this.modalViewCards) this.modalViewCards.classList.add('active');

    // Retrieve cards for this deck and filter by group
    api.getCards(group.deckId).then(res => {
      const cardsInGroup = (res.cards || []).filter(c => c.groupId === group.id);
      if (cardsInGroup.length === 0) {
        this.viewCardsContainer.innerHTML = `
          <div class="state-container" style="padding: 2rem;">
            <p style="color: var(--text-secondary);">Nhóm này chưa có thẻ từ vựng nào.</p>
          </div>
        `;
        return;
      }

      this.viewCardsContainer.innerHTML = `
        <div class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th>Từ vựng</th>
                <th>Phiên âm</th>
                <th>Loại từ</th>
                <th>Nghĩa tiếng Việt</th>
                <th>Ví dụ</th>
              </tr>
            </thead>
            <tbody>
              ${cardsInGroup.map(c => `
                <tr>
                  <td><strong>${this.escapeHtml(c.front)}</strong></td>
                  <td><code>${this.escapeHtml(c.phonetic || '')}</code></td>
                  <td><span class="word-type-tag">${this.escapeHtml(c.wordType || '')}</span></td>
                  <td>${this.escapeHtml(c.meaning || c.back || '')}</td>
                  <td><em>${this.escapeHtml(c.example || '')}</em></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).catch(err => {
      this.viewCardsContainer.innerHTML = `
        <p style="color: var(--accent-rose); padding: 1rem;">Lỗi tải thẻ: ${err.message}</p>
      `;
    });
  }

  closeViewCardsModal() {
    if (this.modalViewCards) this.modalViewCards.classList.remove('active');
  }

  // --------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------
  setGroupsState(state) {
    if (this.groupsLoading) this.groupsLoading.classList.toggle('hidden', state !== 'loading');
    if (this.groupsEmpty) this.groupsEmpty.classList.toggle('hidden', state !== 'empty');
    if (this.groupsError) this.groupsError.classList.toggle('hidden', state !== 'error');
    if (this.groupsContainer) this.groupsContainer.classList.toggle('hidden', state !== 'success');
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
