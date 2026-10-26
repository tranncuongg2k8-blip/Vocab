# HỢP ĐỒNG DỮ LIỆU (API CONTRACT) — Sprint 1
*(Do Claude biên soạn. Codex và Gemini bắt buộc tuân thủ cấu trúc JSON tại đây. Mọi thêm/bớt trường đều phải được Claude duyệt trước — xem `.claude/rules/strict-boundaries.md`.)*

## 1. Base URL
`http://localhost:8000/api/v1`

## 2. Quy ước chung
- Content-Type: `application/json; charset=utf-8`
- Format lỗi chuẩn: `{ "error": { "code": "STRING", "message": "STRING" } }` + HTTP status phù hợp (400/404/500).
- Không hard-code secret; đọc từ `.env`.
- CORS: cho phép origin của frontend (`http://localhost:3000`).

## 3. Data models (Sprint 1 — tối thiểu)

### VocabularySet
```json
{ "id": "string", "title": "string", "description": "string", "cardCount": "number", "language": "en-vi" }
```

### Card
```json
{
  "id": "string",
  "setId": "string",
  "front": "string",
  "back": "string",
  "phonetic": "string",
  "example": "string",
  "audioUrl": "string|null"
}
```

## 4. Endpoints (Sprint 1 — chỉ read + health)

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| GET | `/health` | Kiểm tra server | `{ "status": "ok" }` |
| GET | `/sets` | Danh sách bộ từ vựng | `{ "data": VocabularySet[] }` |
| GET | `/sets/:id` | Chi tiết 1 bộ | `{ "data": VocabularySet }` |
| GET | `/sets/:id/cards` | Danh sách thẻ của bộ (hỗ trợ `?limit=&offset=`) | `{ "data": Card[], "total": "number" }` |

Chi tiết lỗi: `GET /sets/:id` không tồn tại → 404 `{ "error": { "code": "SET_NOT_FOUND", "message": "Set not found" } }`. Tương tự `SET_ID/cards` → 404 nếu set không tồn tại.

## 5. Mở rộng Sprint 2 (dựa trên ảnh UI tham chiếu)

### Card — thêm trường tùy chọn (backward-compatible)
```json
{
  "meaning": "string (nghĩa tiếng Việt — mặt sau thẻ)",
  "exampleVi": "string|null (bản dịch ví dụ)",
  "synonyms": "string[]",
  "antonyms": "string[]",
  "wordType": "string|null (vd: Danh từ)"
}
```
Các trường Sprint 1 (`front`=từ EN, `back`, `phonetic`, `example`, `audioUrl`) giữ nguyên.

### Rating level
`"forgot" | "vague" | "remembered" | "mastered"`
(tương ứng UI: Quên / Mơ hồ / Nhớ / Nhớ rồi — phím 1/2/3/4)

### Endpoints mới

| Method | Path | Mô tả | Request | Response 200 |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/progress` | Lưu đánh giá 1 thẻ | `{ "cardId": "string", "setId": "string", "level": "RatingLevel" }` | `{ "data": { "cardId": "string", "level": "RatingLevel" } }` |
| GET | `/progress/:setId` | Thống kê 1 bộ | — | `{ "data": { "setId": "string", "mastered": "number", "review": "number", "unseen": "number", "total": "number" } }` |

Lỗi: `level` sai → 400 `{ "error": { "code": "INVALID_LEVEL", ... } }`; `setId/cardId` không tồn tại → 404 `SET_NOT_FOUND` / `CARD_NOT_FOUND`.
`review` = forgot + vague; `mastered` = remembered + mastered; `unseen` = total − đã đánh giá.

## 6. Mở rộng Sprint 3 — Quiz trắc nghiệm

### QuizQuestion
```json
{
  "cardId": "string",
  "prompt": "string (từ tiếng Anh cần đoán nghĩa)",
  "options": "string[4] (4 nghĩa tiếng Việt, xáo trộn, chứa đáp án đúng)",
  "answerIndex": "number (0–3)"
}
```

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| GET | `/quiz/:setId?count=` | Lấy N câu trắc nghiệm (mặc định tất cả, tối đa = số cards) | `{ "data": QuizQuestion[], "total": "number" }` |

Lỗi: set không tồn tại → 404 `SET_NOT_FOUND`; `count` không hợp lệ → 400 `INVALID_PAGINATION`.

## 7. Mở rộng Sprint 4 — Matching (Ghép thẻ)

### MatchingPair
```json
{ "cardId": "string", "term": "string (từ EN)", "definition": "string (nghĩa VI)" }
```

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| GET | `/matching/:setId?count=` | Lấy N cặp từ–nghĩa (mặc định 6, tối đa = số cards) | `{ "data": MatchingPair[], "total": "number" }` |

Lỗi: set không tồn tại → 404 `SET_NOT_FOUND`; `count` không hợp lệ → 400 `INVALID_PAGINATION`. Frontend tự xáo trộn 2 cột để chơi.

## 8. Sprint 5 — Không thêm endpoint (dùng lại API cũ)
- Mode Gõ từ + Listening dùng `GET /sets/:id/cards` hiện có (kèm `meaning`/`exampleVi`).
- Codex chỉ seed thêm sets, không thêm endpoint/trường mới.

## 9. Sprint 6 — Không thêm endpoint (dùng lại API cũ)
- Mode Điền vào chỗ trống + Tổng hợp dùng `GET /sets/:id/cards` và `POST /progress` hiện có.
- Cấm thêm endpoint/trường mới.

## 10. Sprint 7 (Task 2) — Bộ thẻ của tôi: Deck

### Deck
```json
{ "id": "string", "title": "string", "status": "draft|published", "cardCount": "number", "groupCount": "number", "language": "en-vi" }
```
Giới hạn: tối đa 3 decks, 600 cards/deck. Quá giới hạn → 400 `QUOTA_EXCEEDED`.

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| GET | `/my/decks` | Danh sách bộ thẻ của tôi | `{ "data": Deck[] }` |
| POST | `/my/decks` | Tạo bộ thẻ `{ "title": "string" }` | `{ "data": Deck }` |
| PUT | `/my/decks/:id` | Đổi tên `{ "title": "string" }` | `{ "data": Deck }` |
| DELETE | `/my/decks/:id` | Xóa bộ thẻ | `{ "data": { "id": "string" } }` |

Lỗi: thiếu title → 400 `INVALID_REQUEST`; sai id → 404 `DECK_NOT_FOUND`.

## 11. Sprint 7 (Task 2) — Group + Card thủ công

### Group
```json
{ "id": "string", "deckId": "string", "title": "string", "cardCount": "number" }
```

`wordType` hợp lệ (14 giá trị ảnh 3): noun, verb, adjective, adverb, preposition, pronoun, conjunction, determiner, interjection, phrasal verb, idiom, phrase, collocation, modal verb.

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| GET | `/my/decks/:id/groups` | Danh sách nhóm trong deck | `{ "data": Group[] }` |
| POST | `/my/decks/:id/groups` | Tạo nhóm `{ "title": "string" }` | `{ "data": Group }` |
| PUT | `/my/groups/:gid` | Đổi tên nhóm | `{ "data": Group }` |
| DELETE | `/my/groups/:gid` | Xóa nhóm (+ cards trong nhóm) | `{ "data": { "id": "string" } }` |
| POST | `/my/groups/:gid/cards` | Tạo thẻ thủ công (full Card + `groupId`, front + meaning/back bắt buộc) | `{ "data": Card }` |

Lỗi: sai deck/group id → 404 `DECK_NOT_FOUND` / `GROUP_NOT_FOUND`; quá 600 cards → 400 `QUOTA_EXCEEDED`.

## 12. Sprint 7 (Task 2) — Import Excel/CSV + Dán nhanh

Format dán nhanh (ảnh 5, cột ngăn cách `|`): `word | IPA | loại từ | nghĩa VI | ví dụ EN | nghĩa VD VI | ghi chú`.

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| POST | `/my/groups/:gid/import` | Nhập hàng loạt `{ "cards": [{front, phonetic?, wordType?, meaning, example?, exampleVi?}] }` | `{ "data": { "imported": "number", "failed": [{ "line": "number", "error": "string" }] } }` |
| GET | `/my/import/template` | Tải CSV mẫu 7 cột | `text/csv` |

Lỗi: dòng thiếu front/meaning → liệt kê trong `failed`, không chặn dòng đúng.

## 13. Sprint 8 — Công bố + Chia sẻ (Task 2 tiếp)

| Method | Path | Mô tả | Response 200 |
| :--- | :--- | :--- | :--- |
| PUT | `/my/decks/:id/publish` | Công bố deck (draft → published, idempotent) | `{ "data": Deck }` |
| POST | `/my/decks/:id/unpublish` | Gỡ công bố (published → draft, idempotent) | `{ "data": Deck }` |
| GET | `/shared/:shareId` | Xem deck published (không auth; shareId = deck id) | `{ "data": { "deck": "Deck", "groups": "Group[]", "cards": "Card[]", "total": "number" } }` |

Lỗi: sai id / deck chưa published → 404 `DECK_NOT_FOUND`. Xóa deck thu hồi link chia sẻ.

## 15. Sprint 12 (Task 3) — Bỏ giới hạn số lượng

Không còn giới hạn 3 decks hay 600 cards/deck. Mọi endpoint tạo/import (§10–§12) chấp nhận số lượng tùy ý; mã lỗi `QUOTA_EXCEEDED` không còn dùng cho flow mới. Import giữ nguyên tắc transactional và giới hạn kích thước body.

## 16. Sprint 12 (Task 3) — Quy ước hiển thị chế độ học

Không đổi API. Study view hiển thị đúng 1 stage của mode đang chọn cùng thanh chuyển mode; các stage khác ở trạng thái ẩn và dừng timer/audio nền.

## 14. Sprint 10 — Lưu dữ liệu bền vững bằng SQLite

Không đổi endpoint, request/response JSON, mã lỗi hoặc quota đã định nghĩa ở các mục trước. SQLite là nguồn dữ liệu bền vững cho nội dung do người dùng tạo và tiến độ học.

### Phạm vi lưu trữ
- Lưu Deck, Group, Card do người dùng tạo (bao gồm trạng thái draft/published và groupId).
- Lưu đánh giá tiến độ mới nhất theo cặp `(setId, cardId)` cho cả bộ từ seed và deck người dùng.
- Dữ liệu bộ từ seed (`sets`/`cards` có sẵn trong source) tiếp tục là dữ liệu chỉ đọc, không cần sao chép vào SQLite.
- Xóa Deck/Group phải xóa theo quan hệ hiện hành; xóa Deck cũng xóa tiến độ thuộc Deck. Các thao tác import hợp lệ được ghi nguyên tử; lỗi không được để lại dữ liệu một phần.

### Cấu hình và an toàn dữ liệu
- File DB mặc định: `livrables/backend/data/vocab.sqlite`; có thể đặt đường dẫn khác bằng `SQLITE_PATH` trong `.env`/environment.
- Tạo thư mục DB nếu chưa tồn tại; không commit file DB vào Git.
- Khởi động lại server không làm mất dữ liệu. DB lỗi/không đọc được phải báo lỗi khởi động rõ ràng và không tự ghi đè hoặc xóa file.
- Không cần migration dữ liệu in-memory hiện tại. Nếu DB đã tồn tại, không xóa/reset dữ liệu để khởi tạo schema.
