# Todo: Task 3 — Bỏ quota + Single-mode + Subdomain

## Task 1: Bỏ quota backend (Codex — B23)

**Description:** Xóa giới hạn 3 decks và 600 cards/deck khỏi mọi luồng tạo/import.

**Acceptance criteria:**
- [ ] Tạo deck thứ 4+ thành công, không còn 400 QUOTA_EXCEEDED cho flow mới
- [ ] Import >600 cards/deck thành công, giữ transactional (lỗi rollback)
- [ ] Sửa/xóa test quota cũ, giữ 100% pass

**Verification:**
- [ ] Tests pass: `npm test` trong `livrables/backend` 100%
- [ ] Manual check: tạo deck thứ 4 + import 601 cards OK

**Dependencies:** None

**Files likely touched:**
- `livrables/backend/src/my-decks.js`
- `livrables/backend/test/decks.test.js`
- `livrables/backend/test/groups.test.js`
- `livrables/backend/test/import.test.js`

**Estimated scope:** Medium: 3-5 files

## Task 2: Bỏ hiển thị quota frontend (Gemini — F22)

**Description:** Xóa mọi chữ/hành vi chặn theo quota trên trang My Decks.

**Acceptance criteria:**
- [ ] Không còn text "tối đa 600 thẻ", "X/3 bộ thẻ", đèn báo full
- [ ] Nút Tạo Bộ Thẻ không bao giờ disable vì quota
- [ ] Lỗi QUOTA_EXCEEDED cũ (nếu backend chưa deploy) hiển thị message thân thiện

**Verification:**
- [ ] `node --check` toàn bộ js frontend không lỗi
- [ ] Manual check: tạo deck thứ 4 ngay trên UI

**Dependencies:** Task 1 (chờ API mới) — có thể làm UI trước với mock, chốt khi API xong

**Files likely touched:**
- `livrables/frontend/js/mydecks.js`
- `livrables/frontend/js/api.js`
- `livrables/frontend/index.html`

**Estimated scope:** Small: 1-2 files

## Checkpoint: Unlimited
- [ ] Tạo deck thứ 4+ và import >600 cards thành công
- [ ] Không còn chữ quota trên UI
- [ ] Backend suite 100% pass

## Task 3: Single-mode view (Gemini — F23)

**Description:** Mỗi tab chế độ chỉ hiện đúng stage của nó + thanh mode bar; ẩn 6 stage còn lại, dừng timer/audio mode cũ.

**Acceptance criteria:**
- [ ] Click mỗi tab (Lật thẻ/Quiz/Ghép/Gõ/Nghe/Điền/Tổng hợp) chỉ hiện 1 stage tương ứng
- [ ] Màn hình kết quả (như ảnh 7) không hiện lẫn với stage khác
- [ ] Chuyển mode dừng timer Matching và audio Listening/Speech của mode cũ

**Verification:**
- [ ] `node --check` không lỗi
- [ ] Manual check: click qua cả 7 tabs, mỗi lần đúng 1 nội dung

**Dependencies:** None (độc lập với Task 1–2)

**Files likely touched:**
- `livrables/frontend/js/app.js`
- `livrables/frontend/js/matching.js`
- `livrables/frontend/js/listening.js`
- `livrables/frontend/index.html`

**Estimated scope:** Medium: 3-5 files

## Task 4: Hồi quy mode sau refactor (Codex — B24, hỗ trợ)

**Description:** Không đổi API; chỉ sửa test/chỉnh nhỏ nếu Gemini phát hiện backend cản single-mode.

**Acceptance criteria:**
- [ ] Không thêm endpoint/trường mới
- [ ] Backend suite giữ 100% pass

**Verification:**
- [ ] Tests pass: `npm test` 100%

**Dependencies:** Task 3

**Files likely touched:**
- `livrables/backend/test/*.test.js` (nếu cần)

**Estimated scope:** Small: 1-2 files

## Checkpoint: Single-mode
- [ ] Mỗi tab đúng 1 stage + mode bar
- [ ] Không rò timer/audio giữa các mode
- [ ] Human review trên trình duyệt

## Task 5: Chuẩn bị deploy subdomain (Claude + user) — D25

**Description:** Chọn nền tảng subdomain miễn phí, tạo service, cấu hình build/start + biến môi trường.

**Acceptance criteria:**
- [ ] Có subdomain public truy cập được
- [ ] `PORT`/`SQLITE_PATH` cấu hình đúng, web tải được decks/cards
- [ ] Ghi lại URL + cách redeploy vào `docs/`

**Verification:**
- [ ] Mở subdomain không cần terminal
- [ ] Tạo deck + import + học thử trên link public

**Dependencies:** Task 1–4

**Estimated scope:** Small: config + docs

## Task 6: Kiểm tra sau deploy (Claude) — D26

**Description:** Rà soát toàn bộ flow trên link public, ghi lỗi còn lại (nếu có) thành Sprint tiếp theo.

**Acceptance criteria:**
- [ ] Checklist 7 modes + My Deck + share chạy qua trên public URL
- [ ] Ghi rõ hạn chế gói miễn phí (ngủ đông/mất dữ liệu nếu có)

**Verification:**
- [ ] Manual check trên trình duyệt sạch (không localhost)

**Dependencies:** Task 5

**Estimated scope:** Small: kiểm tra + báo cáo

## Checkpoint: Complete
- [ ] Web mở bằng subdomain không cần terminal
- [ ] Tạo deck/import/học/publish chạy được trên link public
- [ ] Ready for review
