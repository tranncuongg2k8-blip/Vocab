/**
 * ========================================================
 * VOCABMASTER - SPRINT 7: IMPORT EXCEL / CSV MODAL (IMPORT.JS)
 * Task F17: Modal nhập Excel/CSV 2 tab (Tệp & Dán nhanh)
 * Strictly conforms to contexte/API_CONTRACT.md §12
 * ========================================================
 */

import { api } from './api.js';

export class ImportModalController {
  constructor({ onToast, onImportSuccess }) {
    this.onToast = onToast || console.log;
    this.onImportSuccess = onImportSuccess || (() => {});

    this.activeDeck = null;
    this.groups = [];
    this.selectedGroupId = null;
    this.activeTab = 'file'; // 'file' | 'paste'

    this.parsedCardsFromFile = [];
    this.parsedCardsFromPaste = [];

    this.bindDomElements();
    this.bindEvents();
  }

  bindDomElements() {
    this.modal = document.getElementById('modal-import-cards');
    this.btnCloseModal = document.getElementById('btn-close-import-modal');
    this.btnCancelModal = document.getElementById('btn-cancel-import-modal');

    // Group selector
    this.selectTargetGroup = document.getElementById('select-import-target-group');

    // Tabs
    this.tabBtnFile = document.getElementById('tab-btn-import-file');
    this.tabBtnPaste = document.getElementById('tab-btn-import-paste');
    this.tabPaneFile = document.getElementById('tab-pane-import-file');
    this.tabPanePaste = document.getElementById('tab-pane-import-paste');

    // Tab 1: File Upload Elements
    this.btnDownloadTemplate = document.getElementById('btn-download-import-template');
    this.dropzone = document.getElementById('file-import-dropzone');
    this.fileInput = document.getElementById('input-file-import');
    this.fileInfoBanner = document.getElementById('file-info-banner');
    this.fileNameText = document.getElementById('file-name-text');
    this.previewTableFileContainer = document.getElementById('preview-table-file-container');
    this.previewTableFileBody = document.getElementById('preview-table-file-body');
    this.fileValidCountText = document.getElementById('file-valid-count-text');
    this.btnSubmitFileImport = document.getElementById('btn-submit-file-import');

    // Tab 2: Fast Paste Elements
    this.btnCopyAiPrompt = document.getElementById('btn-copy-ai-prompt');
    this.textareaFastPaste = document.getElementById('textarea-fast-paste');
    this.previewTablePasteContainer = document.getElementById('preview-table-paste-container');
    this.previewTablePasteBody = document.getElementById('preview-table-paste-body');
    this.pasteValidCountText = document.getElementById('paste-valid-count-text');
    this.btnSubmitPasteImport = document.getElementById('btn-submit-paste-import');

    // Result Banners
    this.resultBannerFile = document.getElementById('result-banner-file');
    this.resultBannerPaste = document.getElementById('result-banner-paste');
  }

  bindEvents() {
    // Close modal
    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => this.closeModal());
    }
    if (this.btnCancelModal) {
      this.btnCancelModal.addEventListener('click', () => this.closeModal());
    }

    // Switch tabs
    if (this.tabBtnFile) {
      this.tabBtnFile.addEventListener('click', () => this.switchTab('file'));
    }
    if (this.tabBtnPaste) {
      this.tabBtnPaste.addEventListener('click', () => this.switchTab('paste'));
    }

    // Group select
    if (this.selectTargetGroup) {
      this.selectTargetGroup.addEventListener('change', (e) => {
        this.selectedGroupId = e.target.value;
      });
    }

    // Download template
    if (this.btnDownloadTemplate) {
      this.btnDownloadTemplate.addEventListener('click', () => this.handleDownloadTemplate());
    }

    // Dropzone & File Input
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', () => this.fileInput.click());

      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone.classList.add('dragover');
      });

      this.dropzone.addEventListener('dragleave', () => {
        this.dropzone.classList.remove('dragover');
      });

      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.processFile(e.dataTransfer.files[0]);
        }
      });

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.processFile(e.target.files[0]);
        }
      });
    }

    // Submit File Import
    if (this.btnSubmitFileImport) {
      this.btnSubmitFileImport.addEventListener('click', () => this.submitImport('file'));
    }

    // Copy AI Prompt 1-Click
    if (this.btnCopyAiPrompt) {
      this.btnCopyAiPrompt.addEventListener('click', () => this.handleCopyAiPrompt());
    }

    // Textarea input
    if (this.textareaFastPaste) {
      this.textareaFastPaste.addEventListener('input', () => {
        this.processPastedText(this.textareaFastPaste.value);
      });
    }

    // Submit Paste Import
    if (this.btnSubmitPasteImport) {
      this.btnSubmitPasteImport.addEventListener('click', () => this.submitImport('paste'));
    }
  }

  /**
   * Open Import Modal with Context
   */
  openModal({ deck, groups, selectedGroupId }) {
    this.activeDeck = deck;
    this.groups = groups || [];
    this.selectedGroupId = selectedGroupId || (this.groups[0]?.id || null);

    this.renderGroupSelector();
    this.resetModal();
    this.switchTab('file');

    if (this.modal) {
      this.modal.classList.add('active');
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }

  renderGroupSelector() {
    if (!this.selectTargetGroup) return;
    this.selectTargetGroup.innerHTML = '';

    if (this.groups.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(Chưa có nhóm nào - vui lòng tạo nhóm trước)';
      this.selectTargetGroup.appendChild(opt);
      return;
    }

    this.groups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.title} (${g.cardCount || 0} thẻ)`;
      if (g.id === this.selectedGroupId) opt.selected = true;
      this.selectTargetGroup.appendChild(opt);
    });

    this.selectedGroupId = this.selectTargetGroup.value;
  }

  resetModal() {
    this.parsedCardsFromFile = [];
    this.parsedCardsFromPaste = [];

    if (this.fileInput) this.fileInput.value = '';
    if (this.fileInfoBanner) this.fileInfoBanner.classList.add('hidden');
    if (this.fileNameText) this.fileNameText.textContent = '';
    if (this.previewTableFileContainer) this.previewTableFileContainer.classList.add('hidden');
    if (this.previewTableFileBody) this.previewTableFileBody.innerHTML = '';
    if (this.btnSubmitFileImport) {
      this.btnSubmitFileImport.disabled = true;
      this.btnSubmitFileImport.textContent = 'Nhập thẻ';
    }

    if (this.textareaFastPaste) this.textareaFastPaste.value = '';
    if (this.previewTablePasteContainer) this.previewTablePasteContainer.classList.add('hidden');
    if (this.previewTablePasteBody) this.previewTablePasteBody.innerHTML = '';
    if (this.btnSubmitPasteImport) {
      this.btnSubmitPasteImport.disabled = true;
      this.btnSubmitPasteImport.textContent = 'Nhập hàng loạt thẻ';
    }

    this.hideResultBanners();
  }

  hideResultBanners() {
    if (this.resultBannerFile) {
      this.resultBannerFile.className = 'import-result-banner';
      this.resultBannerFile.innerHTML = '';
    }
    if (this.resultBannerPaste) {
      this.resultBannerPaste.className = 'import-result-banner';
      this.resultBannerPaste.innerHTML = '';
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    if (this.tabBtnFile) this.tabBtnFile.classList.toggle('active', tabName === 'file');
    if (this.tabBtnPaste) this.tabBtnPaste.classList.toggle('active', tabName === 'paste');
    if (this.tabPaneFile) this.tabPaneFile.classList.toggle('active', tabName === 'file');
    if (this.tabPanePaste) this.tabPanePaste.classList.toggle('active', tabName === 'paste');
  }

  /**
   * Handle Download CSV Template (§12)
   */
  async handleDownloadTemplate() {
    try {
      const csvContent = await api.getImportTemplate();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'ielts_vocab_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.onToast('Đã tải tệp mẫu CSV thành công!');
    } catch (err) {
      this.onToast(`Lỗi tải tệp mẫu: ${err.message}`);
    }
  }

  /**
   * Copy 1-Click Prompt for ChatGPT / AI (§12 Fast Paste)
   */
  handleCopyAiPrompt() {
    const promptText = `Hãy tạo cho tôi danh sách 10 từ vựng tiếng Anh IELTS theo chủ đề [CHỦ ĐỀ CỦA BẠN].
Bắt buộc xuất dữ liệu theo định dạng mỗi dòng 1 từ, các trường phân cách bằng dấu gạch đứng (|) theo đúng thứ tự 7 cột sau:
Từ vựng | Phiên âm IPA | Loại từ (noun/verb/adjective/adverb/...) | Nghĩa tiếng Việt | Câu ví dụ tiếng Anh | Bản dịch câu ví dụ | Ghi chú

Ví dụ mẫu:
biodiversity | /ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/ | noun | sự đa dạng sinh học | Conservation protects biodiversity. | Bảo tồn bảo vệ đa dạng sinh học. | IELTS Environment
breakthrough | /ˈbreɪk.θruː/ | noun | bước đột phá | Scientists made a great breakthrough. | Các nhà khoa học tạo bước đột phá. | Technology
sustainable | /səˈsteɪ.nə.bəl/ | adjective | bền vững | We need sustainable energy. | Chúng ta cần năng lượng bền vững. | Writing Task 2`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText)
        .then(() => this.onToast('✔ Đã sao chép câu lệnh tạo từ vựng vào Clipboard! Hãy dán vào ChatGPT/Claude.'))
        .catch(() => this.onToast('Không thể tự động sao chép, vui lòng copy thủ công.'));
    } else {
      this.onToast('Clipboard API không hỗ trợ, vui lòng copy thủ công.');
    }
  }

  /**
   * Process File (.csv or .xlsx)
   */
  async processFile(file) {
    if (!file) return;
    if (this.fileNameText) this.fileNameText.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (this.fileInfoBanner) this.fileInfoBanner.classList.remove('hidden');

    const extension = file.name.split('.').pop().toLowerCase();

    try {
      let textContent = '';
      if (extension === 'csv' || extension === 'txt') {
        textContent = await file.text();
        this.parseCsvContent(textContent);
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Try reading xlsx as text or XML sheet data
        textContent = await this.readSpreadsheetText(file);
        this.parseCsvContent(textContent);
      } else {
        this.onToast('Định dạng tệp không được hỗ trợ. Vui lòng chọn .csv hoặc .xlsx!');
      }
    } catch (err) {
      console.error('Error reading file:', err);
      this.onToast(`Lỗi đọc tệp: ${err.message}`);
    }
  }

  /**
   * Basic spreadsheet reader for xlsx / text fallback
   */
  async readSpreadsheetText(file) {
    // If browser environment has TextDecoder
    try {
      const buffer = await file.arrayBuffer();
      // Look for sharedStrings.xml or strings inside buffer as fallback
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      // If it contains plain delimiters
      if (text.includes(',') || text.includes('|')) {
        return text;
      }
      return await file.text();
    } catch (_) {
      return await file.text();
    }
  }

  /**
   * Parse CSV content into Card objects (§12)
   */
  parseCsvContent(text) {
    if (!text || !text.trim()) {
      this.parsedCardsFromFile = [];
      this.renderFilePreview();
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const cards = [];

    // Check if first line is header
    let startIndex = 0;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('word') || firstLine.includes('từ') || firstLine.includes('front')) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = this.splitCsvLine(line);
      if (cols.length >= 2) {
        // Expected columns: word (0), IPA (1), wordType (2), meaning (3), example (4), exampleVi (5), note (6)
        const front = cols[0] || '';
        let phonetic = '';
        let wordType = 'noun';
        let meaning = '';
        let example = '';
        let exampleVi = '';

        if (cols.length === 2) {
          meaning = cols[1] || '';
        } else if (cols.length === 3) {
          phonetic = cols[1] || '';
          meaning = cols[2] || '';
        } else if (cols.length === 4) {
          phonetic = cols[1] || '';
          wordType = cols[2] || 'noun';
          meaning = cols[3] || '';
        } else {
          phonetic = cols[1] || '';
          wordType = cols[2] || 'noun';
          meaning = cols[3] || '';
          example = cols[4] || '';
          exampleVi = cols[5] || '';
        }

        if (front && meaning) {
          cards.push({
            front,
            phonetic,
            wordType: this.normalizeWordType(wordType),
            meaning,
            example,
            exampleVi,
            lineNum: i + 1
          });
        }
      }
    }

    this.parsedCardsFromFile = cards;
    this.renderFilePreview();
  }

  /**
   * Process Pasted Text (§12 Fast Paste)
   */
  processPastedText(text) {
    if (!text || !text.trim()) {
      this.parsedCardsFromPaste = [];
      this.renderPastePreview();
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const cards = [];

    lines.forEach((line, index) => {
      // Support | or tab or comma
      let cols = [];
      if (line.includes('|')) {
        cols = line.split('|').map(s => s.trim());
      } else if (line.includes('\t')) {
        cols = line.split('\t').map(s => s.trim());
      } else {
        cols = this.splitCsvLine(line);
      }

      if (cols.length >= 2) {
        const front = cols[0] || '';
        let phonetic = '';
        let wordType = 'noun';
        let meaning = '';
        let example = '';
        let exampleVi = '';

        if (cols.length === 2) {
          meaning = cols[1] || '';
        } else if (cols.length === 3) {
          phonetic = cols[1] || '';
          meaning = cols[2] || '';
        } else if (cols.length === 4) {
          phonetic = cols[1] || '';
          wordType = cols[2] || 'noun';
          meaning = cols[3] || '';
        } else {
          phonetic = cols[1] || '';
          wordType = cols[2] || 'noun';
          meaning = cols[3] || '';
          example = cols[4] || '';
          exampleVi = cols[5] || '';
        }

        if (front && meaning) {
          cards.push({
            front,
            phonetic,
            wordType: this.normalizeWordType(wordType),
            meaning,
            example,
            exampleVi,
            lineNum: index + 1
          });
        }
      }
    });

    this.parsedCardsFromPaste = cards;
    this.renderPastePreview();
  }

  /**
   * Split CSV line handling quotes
   */
  splitCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' || c === ';') && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  normalizeWordType(wt) {
    const raw = (wt || '').toLowerCase().trim();
    if (raw.includes('danh') || raw === 'n' || raw === 'noun') return 'noun';
    if (raw.includes('động') || raw === 'v' || raw === 'verb') return 'verb';
    if (raw.includes('tính') || raw === 'adj' || raw === 'adjective') return 'adjective';
    if (raw.includes('trạng') || raw === 'adv' || raw === 'adverb') return 'adverb';
    if (raw.includes('giới') || raw === 'prep' || raw === 'preposition') return 'preposition';
    if (raw.includes('đại') || raw === 'pron' || raw === 'pronoun') return 'pronoun';
    if (raw.includes('liên') || raw === 'conj' || raw === 'conjunction') return 'conjunction';
    if (raw.includes('định') || raw === 'det' || raw === 'determiner') return 'determiner';
    if (raw.includes('thán') || raw === 'int' || raw === 'interjection') return 'interjection';
    if (raw.includes('phrasal') || raw.includes('cụm động')) return 'phrasal verb';
    if (raw.includes('idiom') || raw.includes('thành ngữ')) return 'idiom';
    if (raw.includes('phrase') || raw.includes('cụm từ')) return 'phrase';
    if (raw.includes('collocation') || raw.includes('kết hợp')) return 'collocation';
    if (raw.includes('modal') || raw.includes('khiếm khuyết')) return 'modal verb';
    return 'noun';
  }

  renderFilePreview() {
    const count = this.parsedCardsFromFile.length;
    if (this.fileValidCountText) {
      this.fileValidCountText.textContent = `${count} thẻ hợp lệ`;
    }

    if (count === 0) {
      if (this.previewTableFileContainer) this.previewTableFileContainer.classList.add('hidden');
      if (this.btnSubmitFileImport) {
        this.btnSubmitFileImport.disabled = true;
        this.btnSubmitFileImport.textContent = 'Nhập thẻ';
      }
      return;
    }

    if (this.previewTableFileContainer) this.previewTableFileContainer.classList.remove('hidden');
    if (this.btnSubmitFileImport) {
      this.btnSubmitFileImport.disabled = false;
      this.btnSubmitFileImport.textContent = `Nhập ${count} thẻ`;
    }

    if (this.previewTableFileBody) {
      this.previewTableFileBody.innerHTML = this.parsedCardsFromFile.map(c => `
        <tr>
          <td><strong>${this.escapeHtml(c.front)}</strong></td>
          <td><code>${this.escapeHtml(c.phonetic || '')}</code></td>
          <td><span class="word-type-tag">${this.escapeHtml(c.wordType || '')}</span></td>
          <td>${this.escapeHtml(c.meaning)}</td>
          <td><em>${this.escapeHtml(c.example || '')}</em></td>
        </tr>
      `).join('');
    }
  }

  renderPastePreview() {
    const count = this.parsedCardsFromPaste.length;
    if (this.pasteValidCountText) {
      this.pasteValidCountText.textContent = `${count} thẻ hợp lệ`;
    }

    if (count === 0) {
      if (this.previewTablePasteContainer) this.previewTablePasteContainer.classList.add('hidden');
      if (this.btnSubmitPasteImport) {
        this.btnSubmitPasteImport.disabled = true;
        this.btnSubmitPasteImport.textContent = 'Nhập hàng loạt thẻ';
      }
      return;
    }

    if (this.previewTablePasteContainer) this.previewTablePasteContainer.classList.remove('hidden');
    if (this.btnSubmitPasteImport) {
      this.btnSubmitPasteImport.disabled = false;
      this.btnSubmitPasteImport.textContent = `Nhập ${count} thẻ`;
    }

    if (this.previewTablePasteBody) {
      this.previewTablePasteBody.innerHTML = this.parsedCardsFromPaste.map(c => `
        <tr>
          <td><strong>${this.escapeHtml(c.front)}</strong></td>
          <td><code>${this.escapeHtml(c.phonetic || '')}</code></td>
          <td><span class="word-type-tag">${this.escapeHtml(c.wordType || '')}</span></td>
          <td>${this.escapeHtml(c.meaning)}</td>
          <td><em>${this.escapeHtml(c.example || '')}</em></td>
        </tr>
      `).join('');
    }
  }

  /**
   * Submit Import to API POST /my/groups/:gid/import
   */
  async submitImport(mode = 'file') {
    const targetGroupId = this.selectTargetGroup?.value || this.selectedGroupId;
    if (!targetGroupId) {
      this.onToast('Vui lòng chọn nhóm cần nhập thẻ!');
      return;
    }

    const cardsToImport = mode === 'file' ? this.parsedCardsFromFile : this.parsedCardsFromPaste;
    if (!cardsToImport || cardsToImport.length === 0) {
      this.onToast('Không có thẻ nào hợp lệ để nhập!');
      return;
    }

    const banner = mode === 'file' ? this.resultBannerFile : this.resultBannerPaste;
    const btnSubmit = mode === 'file' ? this.btnSubmitFileImport : this.btnSubmitPasteImport;

    try {
      if (btnSubmit) btnSubmit.disabled = true;

      const result = await api.importCards(targetGroupId, cardsToImport);
      const imported = result.imported || 0;
      const failed = result.failed || [];

      if (banner) {
        if (failed.length === 0) {
          banner.className = 'import-result-banner success';
          banner.innerHTML = `
            <strong>✔ Hoàn tất!</strong> Đã nhập thành công <strong>${imported}</strong> thẻ vào nhóm.
          `;
        } else {
          banner.className = 'import-result-banner has-errors';
          banner.innerHTML = `
            <div><strong>Nhập thành công ${imported} thẻ.</strong> Có ${failed.length} dòng không thể nhập:</div>
            <ul style="margin-top: 0.5rem; padding-left: 1.25rem;">
              ${failed.map(f => `<li>Dòng ${f.line}: ${this.escapeHtml(f.error)}</li>`).join('')}
            </ul>
          `;
        }
      }

      this.onToast(`Đã nhập ${imported} thẻ từ vựng vào nhóm!`);
      this.onImportSuccess({ groupId: targetGroupId, importedCount: imported });

      // If all succeeded, close after a delay
      if (failed.length === 0) {
        setTimeout(() => this.closeModal(), 1200);
      }
    } catch (err) {
      if (banner) {
        banner.className = 'import-result-banner has-errors';
        banner.innerHTML = `<strong>Lỗi nhập thẻ:</strong> ${this.escapeHtml(err.message)}`;
      }
      this.onToast(`Lỗi nhập thẻ: ${err.message}`);
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
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
