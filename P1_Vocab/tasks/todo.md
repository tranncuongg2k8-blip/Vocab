# Todo: Task 2 — Bộ thẻ của tôi

## Task 1: CRUD Deck (Codex — B15)

**Description:** Thêm model Deck + endpoints quản lý bộ thẻ do user tạo, làm nền cho Task 2–6.

**Acceptance criteria:**
- [x] `POST /my/decks` tạo deck (title bắt buộc), tối đa 3 decks, quá giới hạn trả 400 QUOTA_EXCEEDED
- [x] `GET /my/decks`, `PUT /my/decks/:id`, `DELETE /my/decks/:id` đúng schema, 404 DECK_NOT_FOUND khi sai id
- [x] Deck mới có `status: draft`, `cardCount: 0`

**Verification:**
- [x] Tests pass: `npm test` trong `livrables/backend` 100%
- [x] Manual check: curl tạo tới deck thứ 4 bị từ chối

**Dependencies:** None

**Files likely touched:**
- `livrables/backend/src/app.js`
- `livrables/backend/src/decks.js`
- `livrables/backend/test/decks.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 2: Trang Bộ thẻ của tôi (Gemini — F15)

**Description:** Trang danh sách decks theo ảnh 1: tiêu đề + quota, nút Tạo Bộ Thẻ, card mỗi deck (tên, badge Bản Nháp, số thẻ, nút Học/Chia sẻ/Sửa/Xóa/Công bố).

**Acceptance criteria:**
- [x] Hiển thị đúng quota "1/3 bộ thẻ · tối đa 600 thẻ"
- [x] Tạo deck qua modal, xóa có xác nhận, Học chuyển sang study view
- [x] Đủ 3 trạng thái Loading/Empty/Error

**Verification:**
- [x] `node --check` toàn bộ js frontend không lỗi
- [x] Manual check: tạo deck mới hiện ngay trong danh sách

**Dependencies:** Task 1

**Files likely touched:**
- `livrables/frontend/js/mydecks.js`
- `livrables/frontend/index.html`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Phase 1
- [x] All tests pass
- [x] Deck CRUD end-to-end qua API thật
- [x] Review với user trước khi sang Phase 2

## Task 3: CRUD Group + tạo Card thủ công (Codex — B16)

**Description:** Thêm model Group (thư mục trong deck) + endpoint tạo card thủ công vào group.

**Acceptance criteria:**
- [x] `POST /my/decks/:id/groups` tạo nhóm (tên bắt buộc), `GET/PUT/DELETE` group đúng schema
- [x] `POST /my/groups/:gid/cards` tạo card (front + back/meaning bắt buộc), đúng 13 loại từ ảnh 3
- [x] Tổng cards/deck quá 600 trả 400 QUOTA_EXCEEDED

**Verification:**
- [x] Tests pass: `npm test` 100%
- [x] Manual check: tạo card rồi GET /sets/:id/cards thấy card mới

**Dependencies:** Task 1

**Files likely touched:**
- `livrables/backend/src/app.js`
- `livrables/backend/src/groups.js`
- `livrables/backend/test/groups.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 4: Trang chi tiết Deck + form tạo thẻ (Gemini — F16)

**Description:** Trang chi tiết deck theo ảnh 2 (header + nút Học/Công bố/Nhập Excel/Tạo Nhóm, lưới group cards) + form tạo thẻ theo ảnh 3 (tìm từ, từ vựng*, bản dịch*, 13 loại từ, định nghĩa EN/VI, ví dụ EN/VI).

**Acceptance criteria:**
- [x] Mỗi group card có nút Xem Thẻ + Tạo Thẻ, sửa/xóa group có xác nhận
- [x] Form validate front + meaning bắt buộc, lưu xong group tăng số thẻ
- [x] Đủ 3 trạng thái Loading/Empty/Error

**Verification:**
- [x] `node --check` không lỗi
- [x] Manual check: tạo thẻ thủ công rồi học ngay bằng Flashcard

**Dependencies:** Task 3

**Files likely touched:**
- `livrables/frontend/js/deckdetail.js`
- `livrables/frontend/js/cardform.js`
- `livrables/frontend/index.html`

**Estimated scope:** Large: 5-8 files

## Checkpoint: Phase 2
- [x] Tạo group → tạo thẻ → học end-to-end
- [x] Cards user tương thích quiz/matching hiện có
- [x] Review với user trước khi sang Phase 3

## Task 5: Import hàng loạt + template + dán nhanh (Codex — B17)

**Description:** Endpoint import CSV + endpoint trả template mẫu + parse định dạng dán nhanh `word|IPA|loại từ|nghĩa|ví dụ|nghĩa VD|ghi chú`.

**Acceptance criteria:**
- [x] `POST /my/groups/:gid/import` nhận mảng cards, validate từng dòng, trả `{ imported, failed: [{line, error}] }`
- [x] `GET /my/import/template` trả CSV mẫu 7 cột đúng thứ tự ảnh 5
- [x] Dòng sai không chặn dòng đúng; quá quota trả 400 QUOTA_EXCEEDED

**Verification:**
- [x] Tests pass: `npm test` 100%
- [x] Manual check: import file lỗi 1 dòng vẫn nhập được các dòng đúng

**Dependencies:** Task 3

**Files likely touched:**
- `livrables/backend/src/app.js`
- `livrables/backend/src/import.js`
- `livrables/backend/test/import.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 6: Modal nhập Excel/CSV 2 tab (Gemini — F17)

**Description:** Modal theo ảnh 4–5: tab Tệp (tải mẫu + chọn .csv/.xlsx + nút Nhập N thẻ) và tab Dán nhanh (hướng dẫn + sao chép câu lệnh + textarea + nút nhập).

**Acceptance criteria:**
- [x] Tab Tệp: tải mẫu gọi API template, chọn file preview số thẻ, nhập xong báo imported/failed
- [x] Tab Dán nhanh: sao chép câu lệnh 1 click, paste text parse preview, nhập hàng loạt
- [x] .xlsx convert sang CSV ở frontend trước khi gửi

**Verification:**
- [x] `node --check` không lỗi
- [x] Manual check: dán 3 dòng mẫu → tạo đúng 3 thẻ

**Dependencies:** Task 5

**Files likely touched:**
- `livrables/frontend/js/import.js`
- `livrables/frontend/index.html`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Complete
- [x] All acceptance criteria met
- [x] Backend suite 100% pass
- [x] Flow tạo deck → import → học end-to-end
- [x] Ready for review
