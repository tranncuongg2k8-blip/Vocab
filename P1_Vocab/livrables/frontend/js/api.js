/**
 * ========================================================
 * VOCABMASTER - API CLIENT (API.JS)
 * Strictly conforms to contexte/API_CONTRACT.md - Sprint 1, 2 & 3 (§6 Quiz)
 * ========================================================
 */

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = localStorage.getItem('vocab_api_base_url') || DEFAULT_API_BASE_URL;
  }

  setBaseUrl(url) {
    if (!url) return;
    this.baseUrl = url.replace(/\/+$/, '');
    localStorage.setItem('vocab_api_base_url', this.baseUrl);
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Universal fetch helper that handles JSON parsing and error normalization
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      const payload = isJson ? await response.json() : null;

      if (!response.ok) {
        // Contract error format: { error: { code: "STRING", message: "STRING" } }
        const errorCode = payload?.error?.code || `HTTP_${response.status}`;
        const errorMessage = payload?.error?.message || response.statusText || 'Lỗi không xác định từ máy chủ';
        
        const err = new Error(errorMessage);
        err.code = errorCode;
        err.status = response.status;
        err.payload = payload;
        throw err;
      }

      return payload;
    } catch (error) {
      if (error.code) {
        // Already normalized error
        throw error;
      }
      // Network failure / CORS block / Server down
      const netErr = new Error(`Không thể kết nối đến máy chủ tại ${this.baseUrl}: ${error.message}`);
      netErr.code = 'NETWORK_ERROR';
      netErr.status = 0;
      throw netErr;
    }
  }

  /**
   * GET /health -> { "status": "ok" }
   */
  async checkHealth() {
    return await this.request('/health');
  }

  /**
   * GET /sets -> { "data": VocabularySet[] }
   * VocabularySet: { id, title, description, cardCount, language }
   */
  async getSets() {
    const res = await this.request('/sets');
    return res.data || [];
  }

  /**
   * GET /sets/:id -> { "data": VocabularySet }
   */
  async getSetById(id) {
    const encodedId = encodeURIComponent(id);
    const res = await this.request(`/sets/${encodedId}`);
    return res.data;
  }

  /**
   * GET /sets/:id/cards -> { "data": Card[], "total": number }
   * Card: { id, setId, front, back, phonetic, example, audioUrl, meaning?, exampleVi?, synonyms?, antonyms?, wordType? }
   */
  async getCards(setId, limit = 100, offset = 0) {
    const encodedId = encodeURIComponent(setId);
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });
    const res = await this.request(`/sets/${encodedId}/cards?${params.toString()}`);
    return {
      cards: res.data || [],
      total: res.total !== undefined ? res.total : (res.data ? res.data.length : 0)
    };
  }

  /**
   * SPRINT 2 (§5): POST /progress
   * Lưu đánh giá 1 thẻ
   * Body: { cardId: string, setId: string, level: "forgot" | "vague" | "remembered" | "mastered" }
   * Response 200: { data: { cardId: string, level: RatingLevel } }
   * Errors: 400 INVALID_LEVEL, 404 SET_NOT_FOUND / CARD_NOT_FOUND
   */
  async saveProgress({ cardId, setId, level }) {
    const validLevels = ['forgot', 'vague', 'remembered', 'mastered'];
    if (!validLevels.includes(level)) {
      const err = new Error('Rating level không hợp lệ (phải là forgot, vague, remembered, mastered)');
      err.code = 'INVALID_LEVEL';
      err.status = 400;
      throw err;
    }

    return await this.request('/progress', {
      method: 'POST',
      body: JSON.stringify({ cardId: String(cardId), setId: String(setId), level })
    });
  }

  /**
   * SPRINT 2 (§5): GET /progress/:setId
   * Thống kê tiến độ học 1 bộ từ vựng
   * Response 200: { data: { setId: string, mastered: number, review: number, unseen: number, total: number } }
   * Error: 404 SET_NOT_FOUND
   */
  async getProgress(setId) {
    const encodedId = encodeURIComponent(setId);
    const res = await this.request(`/progress/${encodedId}`);
    return res.data;
  }

  /**
   * SPRINT 3 (§6): GET /quiz/:setId?count=
   * Lấy danh sách câu trắc nghiệm cho 1 bộ từ vựng
   * Response 200: { data: QuizQuestion[], total: number }
   * QuizQuestion: { cardId: string, prompt: string, options: string[4], answerIndex: number }
   * Error: 404 SET_NOT_FOUND, 400 INVALID_PAGINATION
   */
  async getQuiz(setId, count) {
    const encodedId = encodeURIComponent(setId);
    const query = count !== undefined ? `?count=${encodeURIComponent(String(count))}` : '';
    const res = await this.request(`/quiz/${encodedId}${query}`);
    return {
      questions: res.data || [],
      total: res.total !== undefined ? res.total : (res.data ? res.data.length : 0)
    };
  }

  /**
   * SPRINT 4 (§7): GET /matching/:setId?count=
   * Lấy danh sách N cặp từ-nghĩa để ghép thẻ (mặc định count = 6)
   * Response 200: { data: MatchingPair[], total: number }
   * MatchingPair: { cardId: string, term: string, definition: string }
   * Error: 404 SET_NOT_FOUND, 400 INVALID_PAGINATION
   */
  async getMatching(setId, count = 6) {
    const encodedId = encodeURIComponent(setId);
    const query = count !== undefined ? `?count=${encodeURIComponent(String(count))}` : '';
    const res = await this.request(`/matching/${encodedId}${query}`);
    return {
      pairs: res.data || [],
      total: res.total !== undefined ? res.total : (res.data ? res.data.length : 0)
    };
  }

  // ========================================================
  // SPRINT 7 (Task 2): BỘ THẺ CỦA TÔI (§10, §11, §12)
  // ========================================================

  /**
   * SPRINT 7 (§10): GET /my/decks
   * Danh sách bộ thẻ của tôi
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async getMyDecks() {
    const res = await this.request('/my/decks');
    return res.data || [];
  }

  /**
   * SPRINT 7 (§10): POST /my/decks
   * Tạo bộ thẻ mới: { title }
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async createMyDeck({ title }) {
    if (!title || !title.trim()) {
      const err = new Error('Tiêu đề bộ thẻ không được để trống');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }

    const res = await this.request('/my/decks', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim() })
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§10): PUT /my/decks/:id
   * Đổi tên bộ thẻ: { title }
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async updateMyDeck(id, { title }) {
    if (!title || !title.trim()) {
      const err = new Error('Tiêu đề bộ thẻ không được để trống');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }

    const encodedId = encodeURIComponent(id);
    const res = await this.request(`/my/decks/${encodedId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: title.trim() })
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§10): DELETE /my/decks/:id
   * Xóa bộ thẻ
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async deleteMyDeck(id) {
    const encodedId = encodeURIComponent(id);
    const res = await this.request(`/my/decks/${encodedId}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  /**
   * SPRINT 8 & 9 (§13): PUT /my/decks/:id/publish
   * Công bố bộ thẻ ra cộng đồng (đổi status: "published", idempotent)
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async publishDeck(id) {
    const encodedId = encodeURIComponent(id);
    const res = await this.request(`/my/decks/${encodedId}/publish`, {
      method: 'PUT'
    });
    return res.data;
  }

  /**
   * SPRINT 8 & 9 (§13): POST /my/decks/:id/unpublish
   * Gỡ công bố bộ thẻ (đổi status về "draft", idempotent)
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async unpublishDeck(id) {
    const encodedId = encodeURIComponent(id);
    const res = await this.request(`/my/decks/${encodedId}/unpublish`, {
      method: 'POST'
    });
    return res.data;
  }

  /**
   * SPRINT 8 & 9 (§13): Lấy đường dẫn chia sẻ bộ thẻ
   * Contract §13: Xem deck published (không auth; shareId = deck id)
   * CHỈ tạo link chuẩn theo API Contract - KHÔNG dùng fallback localStorage
   */
  getShareLink(id) {
    const origin = window.location.origin;
    const shareId = id;
    return {
      shareId,
      shareUrl: `${origin}/shared/${encodeURIComponent(shareId)}`
    };
  }

  /**
   * SPRINT 8 & 9 (§13): GET /shared/:shareId
   * Lấy thông tin chi tiết và danh sách thẻ của bộ thẻ được chia sẻ
   * Response 200: { "data": { "deck": Deck, "groups": Group[], "cards": Card[], "total": number } }
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   * Errors: 404 DECK_NOT_FOUND
   */
  async getSharedDeck(shareId) {
    const encodedId = encodeURIComponent(shareId);
    const res = await this.request(`/shared/${encodedId}`);
    if (!res || !res.data) {
      const err = new Error('Phản hồi từ máy chủ không hợp lệ');
      err.code = 'INVALID_RESPONSE';
      throw err;
    }
    const data = res.data;
    return {
      deck: data.deck || data,
      groups: Array.isArray(data.groups) ? data.groups : [],
      cards: Array.isArray(data.cards) ? data.cards : [],
      total: typeof data.total === 'number' ? data.total : (Array.isArray(data.cards) ? data.cards.length : 0)
    };
  }

  /**
   * SPRINT 8 (§13) & SPRINT 12 (§15): Lưu bộ thẻ được chia sẻ về "Bộ thẻ của tôi" (Clone Deck)
   * Không giới hạn số lượng bộ thẻ theo Contract §15
   */
  async cloneSharedDeck(sourceDeck, groupsList = [], cardsList = []) {
    const title = `${sourceDeck.title || 'Bộ thẻ chia sẻ'} (Bản sao)`;
    const newDeck = await this.createMyDeck({ title });

    // Clone groups & cards
    if (groupsList.length > 0) {
      for (const grp of groupsList) {
        const newGrp = await this.createGroup(newDeck.id, { title: grp.title || 'Nhóm từ vựng' });
        const grpCards = cardsList.filter(c => c.groupId === grp.id);
        if (grpCards.length > 0) {
          await this.importCards(newGrp.id, grpCards);
        }
      }
    } else if (cardsList.length > 0) {
      const defaultGrp = await this.createGroup(newDeck.id, { title: 'Tất cả từ vựng' });
      await this.importCards(defaultGrp.id, cardsList);
    }

    return newDeck;
  }

  /**
   * SPRINT 7 (§11): GET /my/decks/:id/groups
   * Danh sách nhóm trong deck
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async getDeckGroups(deckId) {
    const encodedId = encodeURIComponent(deckId);
    const res = await this.request(`/my/decks/${encodedId}/groups`);
    return res.data || [];
  }

  /**
   * SPRINT 7 (§11): POST /my/decks/:id/groups
   * Tạo nhóm mới: { title }
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async createGroup(deckId, { title }) {
    if (!title || !title.trim()) {
      const err = new Error('Tên nhóm không được để trống');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }

    const encodedId = encodeURIComponent(deckId);
    const res = await this.request(`/my/decks/${encodedId}/groups`, {
      method: 'POST',
      body: JSON.stringify({ title: title.trim() })
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§11): PUT /my/groups/:gid
   * Đổi tên nhóm
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async updateGroup(groupId, { title }) {
    if (!title || !title.trim()) {
      const err = new Error('Tên nhóm không được để trống');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }

    const encodedId = encodeURIComponent(groupId);
    const res = await this.request(`/my/groups/${encodedId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: title.trim() })
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§11): DELETE /my/groups/:gid
   * Xóa nhóm (+ cards trong nhóm)
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async deleteGroup(groupId) {
    const encodedId = encodeURIComponent(groupId);
    const res = await this.request(`/my/groups/${encodedId}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§11): POST /my/groups/:gid/cards
   * Tạo thẻ thủ công vào nhóm: { front, meaning, phonetic?, wordType?, example?, exampleVi? }
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async createCard(groupId, cardData) {
    if (!cardData.front || !cardData.front.trim()) {
      const err = new Error('Từ vựng (mặt trước) bắt buộc phải có');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }
    if (!cardData.meaning || !cardData.meaning.trim()) {
      const err = new Error('Bản dịch / Định nghĩa (mặt sau) bắt buộc phải có');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }

    const payload = {
      front: cardData.front.trim(),
      meaning: cardData.meaning.trim(),
      back: cardData.back ? cardData.back.trim() : cardData.meaning.trim(),
      phonetic: cardData.phonetic ? cardData.phonetic.trim() : '',
      wordType: cardData.wordType || 'noun',
      example: cardData.example ? cardData.example.trim() : '',
      exampleVi: cardData.exampleVi ? cardData.exampleVi.trim() : ''
    };

    const encodedId = encodeURIComponent(groupId);
    const res = await this.request(`/my/groups/${encodedId}/cards`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§12): POST /my/groups/:gid/import
   * Nhập hàng loạt thẻ từ CSV/Excel: { cards: Card[] }
   * Response: { data: { imported: number, failed: [{ line: number, error: string }] } }
   * CHỈ gọi API thật - KHÔNG dùng fallback localStorage
   */
  async importCards(groupId, cardsList) {
    if (!Array.isArray(cardsList)) {
      const err = new Error('Danh sách thẻ phải là một mảng');
      err.code = 'INVALID_REQUEST';
      err.status = 400;
      throw err;
    }

    const encodedId = encodeURIComponent(groupId);
    const res = await this.request(`/my/groups/${encodedId}/import`, {
      method: 'POST',
      body: JSON.stringify({ cards: cardsList })
    });
    return res.data;
  }

  /**
   * SPRINT 7 (§12): GET /my/import/template
   * Tải template CSV mẫu 7 cột
   */
  async getImportTemplate() {
    try {
      const url = `${this.baseUrl}/my/import/template`;
      const response = await fetch(url, {
        headers: { 'Accept': 'text/csv' }
      });
      if (response.ok) {
        return await response.text();
      }
    } catch (_) {}
    // Standard 7-column CSV template as defined in Contract §12
    return 'word,IPA,loại từ,nghĩa VI,ví dụ EN,nghĩa VD VI,ghi chú\n' +
      'biodiversity,/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/,noun,sự đa dạng sinh học,Conservation protects biodiversity.,Bảo tồn bảo vệ đa dạng sinh học.,IELTS Environment\n' +
      'breakthrough,/ˈbreɪk.θruː/,noun,bước đột phá,Scientists made a great breakthrough.,Các nhà khoa học tạo bước đột phá.,Technology\n' +
      'sustainable,/səˈsteɪ.nə.bəl/,adjective,bền vững,We need sustainable energy.,Chúng ta cần năng lượng bền vững.,Writing Task 2';
  }
}

export const api = new ApiClient();
export default api;
