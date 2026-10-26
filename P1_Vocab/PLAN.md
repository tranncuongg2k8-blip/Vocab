# KẾ HOẠCH THỰC HIỆN & BẢNG GIAO VIỆC (ACTION PLAN)

> **Hướng dẫn:** Claude cập nhật file này. Codex và Gemini nhìn vào phần việc của mình để thực thi.
> Trạng thái: `[ ] Chưa làm` | `[~] Đang làm` | `[?] Chờ Claude duyệt` | `[x] Đã hoàn thành`

## Sprint 1: Khung dự án + API read-only + UI Flashcard cơ bản (dựa trên SPEC.md; trang tham chiếu không truy cập được nên dùng bố cục flashcard chuẩn: lưới sets → thẻ lật mặt trước/sau → nút prev/next/shuffle)

### Nhiệm vụ của Claude (Manager)
- [x] Đọc `SPEC.md`, `AGENTS.md`, `MAP.md`, `PLAN.md`, `STATUS.md`, workflow Sprint.
- [x] Viết `contexte/API_CONTRACT.md` Sprint 1 (4 endpoint read-only + format lỗi chuẩn).

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B1:** Khởi tạo `livrables/backend/` (package, server đọc PORT từ `.env`, route đúng 4 endpoint trong Contract). Seed tối thiểu 1 set + 10 cards mẫu.
- [ ] **Task B2:** Implement đúng Contract: `GET /health`, `GET /sets`, `GET /sets/:id`, `GET /sets/:id/cards` (+ `limit/offset`, 404 `SET_NOT_FOUND`). Không thêm endpoint/trường ngoài Contract. CORS cho `http://localhost:3000`.
- [ ] **Task B3:** Viết test tự động (mỗi endpoint ≥ 1 case thành công + 1 case lỗi 404) + script chạy trong `scripts/`. Báo cáo theo mẫu trong `.claude/output-styles/report-template.md` vào `.claude/agent-memory/STATUS.md`. Tiêu chí duyệt: 100% test pass.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F1:** Khởi tạo `livrables/frontend/` (trang danh sách sets + trang học flashcard).
- [ ] **Task F2:** UI flashcard: thẻ lật (front/back), nút Prev/Next/Shuffle, bộ đếm tiến độ; hiệu ứng chuyển động mượt.
- [ ] **Task F3:** Gọi đúng Contract qua Base URL `http://localhost:8000/api/v1`; xử lý đủ 3 trạng thái Loading/Empty/Error; không hard-code data từ vựng. Báo cáo theo mẫu vào `STATUS.md`. Tiêu chí duyệt: gọi API không CORS/lệch JSON.

## Sprint 1: Khung dự án + API read-only + UI Flashcard cơ bản — NGHIỆM THU: ĐẠT
- Codex B1–B3: 36/36 test PASS, đủ 4 endpoint + file test đi kèm → [x].
- Gemini F1–F3: UI 3D + gọi đúng Contract + đủ Loading/Empty/Error → [x].

## Sprint 2: Chấm điểm ghi nhớ + Thống kê + Bố cục theo ảnh tham chiếu — NGHIỆM THU: ĐẠT
- Codex B4–B6: 66/66 test PASS (Claude chạy lại xác minh), đủ 2 endpoint progress + backward-compatible → [x].
- Gemini F4–F6: bố cục 3 cột + thống kê + POST progress, không hard-code → [x].
- Ghi chú: mâu thuẫn §6 cũ đã sửa — §5 giữ nguyên hiệu lực, §7 ghi việc Sprint 4.

## Sprint 3: Quiz trắc nghiệm — NGHIỆM THU: ĐẠT
- Codex B7–B8: 95/95 test PASS (Claude chạy lại xác minh), đúng Contract §6 → [x].
- Gemini F7–F8: mode Quiz + kết quả + POST forgot khi sai, syntax OK → [x].

## Sprint 4: Ghép thẻ Matching — NGHIỆM THU: ĐẠT
- Codex B9–B10: 122/122 test PASS (Claude chạy lại xác minh), đúng Contract §7 → [x].
- Gemini F9–F10: mode Matching 2 cột + timer + kết quả, syntax OK → [x].

## Sprint 5: Mở rộng data + 2 mode không cần API mới — NGHIỆM THU: ĐẠT
- Codex B11–B12: 127/127 test PASS (Claude chạy lại xác minh), 3 sets / 30 cards → [x].
- Gemini F11–F12: mode Gõ từ + Nghe–Viết, đủ 5 tabs modes, syntax OK → [x].

## Sprint 6 (cuối — hoàn thiện theo ảnh tham chiếu): Điền vào chỗ trống + Tổng hợp + đánh bóng — NGHIỆM THU: ĐẠT
- Codex B13–B14: 127/127 test PASS (Claude chạy lại xác minh), README/.env hoàn chỉnh, không endpoint mới → [x].
- Gemini F13–F14: mode Điền từ + Tổng hợp 4 dạng + responsive 3 breakpoints, syntax OK → [x].
- Kiểm tra tích hợp live: /health, /sets, /quiz/:setId đều trả đúng schema.

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B13:** CẤM thêm endpoint/trường. Chỉ rà soát: README hướng dẫn chạy đầy đủ, `.env.example` đúng, test suite xanh. Sửa lỗi nếu Claude/CI phát hiện.
- [ ] **Task B14:** Chạy test hồi quy toàn suite 100% pass lần cuối. Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F13:** Mode Điền vào chỗ trống: hiện câu ví dụ khuyết từ (___) + nghĩa VI gợi ý → gõ từ còn thiếu, chấm đúng/sai (sai gửi `POST /progress` forgot).
- [ ] **Task F14:** Mode Tổng hợp: trộn ngẫu nhiên 4 dạng câu (flashcard/quiz/matching/typing) trong 1 phiên, màn hình tổng kết chung. Kiểm tra responsive + đồng nhất Loading/Empty/Error toàn app. Báo cáo F13–F14 theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B11:** Seed thêm 2 sets mới (mỗi set ≥ 10 cards đầy đủ trường §5: meaning, exampleVi, synonyms, antonyms, wordType). Không thêm endpoint/trường mới.
- [ ] **Task B12:** Test hồi quy toàn suite 100% pass sau khi seed thêm (cardCount/total nhất quán, quiz/matching/progress vẫn đúng). Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F11:** Mode Gõ từ: hiện nghĩa VI → gõ từ EN, chấm đúng/sai, sai gửi `POST /progress` level forgot.
- [ ] **Task F12:** Mode Nghe–Viết (Listening): phát âm từ bằng Speech API → gõ lại từ EN, chấm điểm + màn hình kết quả. Báo cáo F11–F12 theo mẫu vào `STATUS.md`.

## Sprint 7 (Task 2): Bộ thẻ của tôi — Deck + Group + Tạo thẻ + Nhập Excel/CSV — NGHIỆM THU: ĐẠT
- Codex B15–B17: 144/144 test PASS (Claude chạy lại xác minh), CRUD Deck/Group/Card/import đúng §10–§12 → [x].
- Gemini F15–F17: trang My Decks + chi tiết Deck + form tạo thẻ + modal Excel/CSV 2 tab, syntax OK → [x].
- Kiểm tra live: GET /my/decks, POST tạo deck, GET template CSV đều đúng schema.
- Sửa Contract §11: "13 wordType" → "14 wordType" (theo danh sách liệt kê thực tế).

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B15:** CRUD Deck theo Contract §10 (tối đa 3 decks, 400 QUOTA_EXCEEDED, 404 DECK_NOT_FOUND) + test.
- [ ] **Task B16:** CRUD Group + tạo Card thủ công theo Contract §11 (13 wordType, front + meaning bắt buộc, 600 cards/deck) + test.
- [ ] **Task B17:** Import hàng loạt + template CSV theo Contract §12 (`imported/failed` từng dòng) + test. Toàn suite 100% pass. Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F15:** Trang Bộ thẻ của tôi theo ảnh 1 (quota, Tạo Bộ Thẻ, card deck + Học/Sửa/Xóa/Công bố disabled).
- [ ] **Task F16:** Trang chi tiết Deck theo ảnh 2 (nút Học/Công bố/Nhập Excel/Tạo Nhóm, lưới group) + form tạo thẻ theo ảnh 3 (validate front + bản dịch, 13 loại từ). Đủ Loading/Empty/Error.
- [ ] **Task F17:** Modal nhập Excel/CSV theo ảnh 4–5 (tab Tệp: tải mẫu + chọn .csv/.xlsx + Nhập N thẻ; tab Dán nhanh: sao chép câu lệnh + textarea + nhập hàng loạt). Báo cáo F15–F17 theo mẫu vào `STATUS.md`.

## Sprint 8 (Task 2 tiếp): Công bố + Chia sẻ — NGHIỆM THU: ĐẠT CÓ ĐIỀU KIỆN
- Codex B18: 150/150 test PASS (chạy lại xác minh). PUT publish + GET /shared đúng; THIẾU POST /unpublish và GET /shared chỉ trả `{data: Deck}` thay vì `{deck, groups, cards, total}` → chuyển sang Sprint 9.
- Gemini F18: nút Công bố 2 chiều + Chia sẻ + trang shared + Học ngay/Clone, tương thích cả 2 shape response, syntax OK → [x].
- Đã bổ sung Contract §13 + PLAN Sprint 8 (trước đó 2 AI tự suy luận vì prompt chưa kèm Contract).

## Sprint 9 (sửa lệch + hoàn thiện Task 2)

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B19:** Thêm `POST /my/decks/:id/unpublish` (idempotent) + mở rộng `GET /shared/:shareId` trả `{ deck, groups, cards, total }` đúng §13 + test. Toàn suite 100% pass. Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F19:** Bỏ fallback localStorage trong publish/unpublish/share (chỉ dùng API thật), trang shared hiển thị đủ groups + cards từ response mới. Báo cáo theo mẫu vào `STATUS.md`.

## Sprint 10: Lưu dữ liệu bền vững bằng SQLite — NGHIỆM THU: ĐẠT CÓ ĐIỀU KIỆN
- Codex B20–B21: 162/162 pass trên máy Codex; Claude chạy lại được 160/162 — 2 fail do assert path Windows (`\`) trong `config.test.js`, không phải lỗi logic; SQLite ghi/đọc thật OK trên sandbox.
- Gemini F20–F21: bỏ hết fallback localStorage My Deck, kiểm chứng restart giữ dữ liệu, syntax OK → [x].
- Chuyển sang Sprint 11: sửa 2 assert path + dọn file DB thừa/rác journal.

## Sprint 11 (sửa tồn đọng Sprint 10) — NGHIỆM THU: ĐẠT
- Codex B22: 162/162 pass trên cả Windows và Linux (Claude chạy lại xác minh), assert path đa nền tảng, data/ chỉ còn vocab.sqlite, .gitignore phủ data/ → [x].
- Gemini: nghỉ Sprint 11 → [x].

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B22:** Sửa 2 assert path trong `config.test.js` cho đúng đa nền tảng (dùng `path.sep`/`endsWith('test.sqlite')`), xóa `data/test_f21.sqlite` và file journal thừa khỏi repo nếu còn, bảo đảm `.gitignore` phủ `data/`. Toàn suite 100% pass trên Windows và Linux. Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — không có việc Sprint 11 (nghỉ).
- F20–F21 đã nghiệm thu → [x].

## Sprint 12 (Task 3): Bỏ quota + Single-mode view — NGHIỆM THU: ĐẠT CÓ ĐIỀU KIỆN
- Codex B23–B24: 163/163 pass (chạy lại xác minh), quota đã bỏ, import transactional giữ nguyên → [x].
- Gemini F22–F23: single-mode đúng 1 stage + cleanup timer/audio, syntax OK → [x] có điều kiện.
- Còn sót text cũ (không chặn hành vi): comment "tối đa 3 bộ" trong `api.js`, title nút tạo deck trong `index.html`, 2 message QUOTA_EXCEEDED thân thiện → chuyển sang Sprint 13.
- Deploy subdomain (D25–D26) chưa làm — cần user chốt nền tảng.

## Sprint 13 (dọn sót Task 3) — NGHIỆM THU: ĐẠT
- Gemini F24: xóa hết text quota hiển thị + message lỗi chung, syntax 15/15 OK (Claude chạy lại xác minh) → [x].
- Còn lại chỉ comment/tên biến nội bộ (`updateQuotaDisplay`, `quotaBadge`), không ảnh hưởng người dùng.
- Codex nghỉ Sprint 13 → [x].

## Sprint 14 (deploy Fly.io — subdomain miễn phí) — NGHIỆM THU CODE: ĐẠT
- Codex B25: 163/163 pass (chạy lại xác minh), 1 service serve static + API, Dockerfile + fly.toml + README đầy đủ → [x].
- Còn lại D25–D26: cần user chạy deploy (tài khoản + flyctl thuộc về user).

### Nhiệm vụ của Codex (Backend) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B25:** Backend serve frontend tĩnh (1 service duy nhất): thêm Dockerfile + `fly.toml` mẫu, cấu hình `PORT`/`SQLITE_PATH` theo env Fly volume, hướng dẫn deploy trong README. Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của user + Claude
- [ ] **Task D25:** User tạo tài khoản Fly.io, chạy `fly launch` + `fly volumes create` + `fly deploy` theo README; Claude hỗ trợ khi lỗi.
- [ ] **Task D26:** Kiểm tra toàn bộ flow trên `https://<ten-app>.fly.dev`, ghi hạn chế gói miễn phí.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F24:** Xóa/sửa text quota còn sót: comment `api.js`, title nút `index.html`, 2 message QUOTA_EXCEEDED (đổi thành lỗi chung). `node --check` sạch. Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Codex (Backend) — không có việc Sprint 13 (nghỉ).
- B23–B24 đã nghiệm thu → [x].

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B23:** Bỏ giới hạn 3 decks/600 cards theo Contract §15 (xóa check quota + sửa test quota cũ, giữ transactional import). Toàn suite 100% pass. Báo cáo theo mẫu vào `STATUS.md`.
- [ ] **Task B24:** Hỗ trợ hồi quy single-mode (không thêm endpoint/trường; chỉ sửa nếu Gemini phát hiện backend cản). Báo cáo theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F22:** Bỏ mọi hiển thị/chặn quota (text "tối đa", "X/3", disable nút) theo §15.
- [ ] **Task F23:** Single-mode view theo §16: mỗi tab chỉ hiện 1 stage + mode bar, dừng timer/audio mode cũ. Đủ Loading/Empty/Error. Báo cáo F22–F23 theo mẫu vào `STATUS.md`.

### Nhiệm vụ của Claude + user (Deploy)
- [ ] **Task D25:** Chọn nền tảng subdomain miễn phí, tạo service + cấu hình build/start/env, ghi URL và cách redeploy vào `docs/`.
- [ ] **Task D26:** Kiểm tra toàn bộ flow trên link public, ghi hạn chế gói miễn phí + lỗi còn lại (nếu có).

### Nhiệm vụ của Codex (Backend & Tester) — chỉ ghi trong `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task B20:** Hạ tầng SQLite: init schema trên `SQLITE_PATH` (mặc định `livrables/backend/data/vocab.sqlite`), biến backend thành lựa chọn đúng mà không được hạ cấp feature, chuyển Deck/Group/Card/progress qua DB; bảo đảm giao dịch import nguyên tử; DB lỗi không được tự ghi đè/xóa; cập nhật `.env.example`, `.gitignore`, README ví dụ kiểm tra khởi động lại; script kiểm tra sức khỏe SQLite trong `scripts/`. Kiểm chứng runtime Node hiện tại dùng SQLite ổn định (cẩn trọng cảnh báo experimental `node:sqlite`).
- [ ] **Task B21:** Kiểm thử SQLite: test trống DB lần đầu, tạo/sửa/xóa Deck/Group/Card, publish/unpublish/share, quota 3 decks/600 cards, import nguyên tử đúng/sai, giữ tiến độ khi khởi động lại, hành vi DB lỗi và đồng thời an toàn cho cùng cặp `(setId, cardId)`; toàn suite giữ 100% pass. Báo cáo cả hai Task B20–B21 theo mẫu vào cuối `STATUS.md`.

### Nhiệm vụ của Gemini (Frontend) — chỉ ghi trong `livrables/frontend/`, `.claude/agent-memory/STATUS.md`
- [ ] **Task F20:** Dọn dự phòng localStorage trong `livrables/frontend/js/api.js` cho mọi luồng My Deck/Group/Card/import còn lại (`getMyDecks`, create/update/delete Deck, `createGroup`, `createCard`, `importCards`); chỉ hiển thị lỗi API thật khi backend báo lỗi. Đủ Loading/Empty/Error, không hard-code dữ liệu từ vựng, không sửa backend/test backend.
- [ ] **Task F21:** Rà soát My Deck/Group/Card/import/share sau chuyển đổi: mỗi luồng có test thủ công khởi động lại backend kiểm chứng không mất dữ liệu; thêm/hợp nhất tài liệu trạng thái dữ liệu bền vững trong `livrables/frontend/README.md`. Báo cáo cả hai Task F20–F21 theo mẫu vào cuối `STATUS.md`.

### Kiểm chứng của Claude
1. Test backend toàn suite 100% pass, có file test Sprint 10 đi kèm.
2. Thử tay backend khởi động lại: API trả lại cùng Deck/Group/Card/progress.
3. Lỗi DB phải rõ ràng và không mất dữ liệu.
4. API JSON/kiểu lỗi/quota không đổi so với §1–§13.

### Tiêu chí nghiệm thu (DoD theo SPEC.md)
1. Codex: 100% test pass, có file test đi kèm (nếu thiếu → từ chối nghiệm thu).
2. Gemini: gọi API thành công, không lỗi CORS/lệch trường JSON.
3. Trường mới ngoài Contract → rollback hoặc cập nhật Contract trước (theo `strict-boundaries.md`).
