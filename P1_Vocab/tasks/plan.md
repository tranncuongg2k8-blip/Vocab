# Implementation Plan: Task 2 — Bộ thẻ của tôi (My Decks + Groups + Card Editor + Excel/CSV Import)

## Overview
Xây dựng khu vực "Bộ thẻ của tôi": trang danh sách bộ thẻ (ảnh 1), trang chi tiết bộ thẻ với các nhóm chứa thẻ (ảnh 2), khung nhập liệu tạo thẻ thủ công (ảnh 3), modal nhập từ Excel/CSV gồm 2 tab Tệp và Dán nhanh (ảnh 4–5). Cắt dọc thành 3 phase: quản lý bộ thẻ → quản lý nhóm + thẻ thủ công → nhập hàng loạt. Mọi dữ liệu dùng API mới §10–§12; mode học hiện có (flashcard/quiz/...) dùng lại không đổi.

## Architecture Decisions
- Model mới `Deck` (bộ thẻ do user tạo, có `status: draft|published`) và `Group` (thư mục trong deck), Card hiện có thêm `groupId` tùy chọn; deck/seed cũ giữ nguyên và coi như published.
- Endpoint viết mới dùng POST/PUT/DELETE với format lỗi chuẩn hiện có; import CSV parse ở frontend + validate từng dòng ở backend.
- Frontend thêm trang `my-decks` độc lập, không sửa logic 7 mode học.

## Task List

### Phase 1: Quản lý Bộ thẻ (My Decks)
- [ ] Task 1: CRUD Deck (Codex) — B15
- [ ] Task 2: Trang Bộ thẻ của tôi (Gemini) — F15

### Checkpoint: Phase 1
- [ ] Deck tạo/sửa/xóa/list chạy qua API thật
- [ ] Giới hạn 3 decks / 600 cards được hiển thị đúng
- [ ] Human review trước khi sang Phase 2

### Phase 2: Nhóm + Tạo thẻ thủ công
- [ ] Task 3: CRUD Group + tạo Card thủ công (Codex) — B16
- [ ] Task 4: Trang chi tiết Deck + form tạo thẻ (Gemini) — F16

### Checkpoint: Phase 2
- [ ] Tạo group → tạo thẻ thủ công → học ngay bằng mode hiện có
- [ ] Human review trước khi sang Phase 3

### Phase 3: Nhập Excel/CSV
- [ ] Task 5: Import hàng loạt + template + dán nhanh (Codex) — B17
- [ ] Task 6: Modal nhập Excel/CSV 2 tab (Gemini) — F17

### Checkpoint: Complete
- [ ] Toàn bộ suite backend 100% pass
- [ ] Flow tạo deck → import → học end-to-end
- [ ] Ready for review

Chi tiết từng task (acceptance, verification, files): xem `tasks/todo.md`.
Tasks tracked in PLAN.md Sprint 7 (B15–B17 cho Codex, F15–F17 cho Gemini).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| File Excel .xlsx parse nặng ở backend không dependency | Med | Backend chỉ nhận CSV; .xlsx convert ở frontend (SheetJS CDN) hoặc yêu cầu user lưu CSV |
| Import hàng loạt vượt 600 cards/deck | Med | Validate ở backend, trả 400 QUOTA_EXCEEDED + báo số dòng lỗi chi tiết |
| Card của deck user lọt vào quiz/matching seed | Low | Quiz/matching lấy theo setId nên deck mới tự tương thích; test cách ly giữa sets |

## Open Questions
- Có cần nút Công bố (draft → published) ngay Sprint 7 hay để Sprint sau? (Tạm scope: chỉ CRUD + import, nút Công bố hiển thị disabled.)
