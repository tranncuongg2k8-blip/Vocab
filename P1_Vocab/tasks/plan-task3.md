# Implementation Plan: Task 3 — Bỏ quota + Chế độ học hiển thị đơn + Subdomain deploy

## Overview
Ba yêu cầu độc lập: bỏ giới hạn 3 decks/600 cards, sửa study view chỉ hiện 1 mode đang chọn (ảnh 7 đang dồn kết quả tổng hợp với thanh mode), và đưa web lên subdomain miễn phí để không cần chạy terminal. Phase 1–2 là code (Codex/Gemini song song được sau khi chốt Contract §15–§16), Phase 3 là deploy (Claude làm cùng user vì cần tài khoản/OTP).

## Architecture Decisions
- Bỏ quota ở backend + UI (không thêm flag, không giữ mã QUOTA_EXCEEDED cho flow mới; test cũ sửa theo).
- Single-mode view: `setSubMode()` là điểm chuyển duy nhất; stage không active phải `hidden` + dừng timer/audio; giữ thanh mode bar để chuyển qua lại.
- Deploy: giữ nguyên Node + SQLite, không đổi DB; subdomain miễn phí; backend và frontend cùng 1 service (frontend serve từ backend hoặc 2 service miễn phí tùy nền tảng).

## Task List

### Phase 1: Bỏ giới hạn (Unlimited)
- [ ] Task 1: Bỏ quota backend (Codex) — B23
- [ ] Task 2: Bỏ hiển thị quota frontend (Gemini) — F22

### Checkpoint: Unlimited
- [ ] Tạo deck thứ 4+ và import >600 cards thành công
- [ ] Không còn chữ "tối đa"/"1/3" trên UI
- [ ] Backend suite 100% pass

### Phase 2: Single-mode view
- [ ] Task 3: Chuẩn hóa chuyển mode (Gemini) — F23
- [ ] Task 4: Hồi quy mode sau refactor (Codex hỗ trợ nếu cần) — B24

### Checkpoint: Single-mode
- [ ] Mỗi tab chỉ hiện đúng 1 stage + thanh mode bar
- [ ] Chuyển mode dừng timer/audio của mode cũ
- [ ] Human review trên trình duyệt

### Phase 3: Subdomain deploy
- [ ] Task 5: Chuẩn bị deploy (Claude + user) — D25
- [ ] Task 6: Kiểm tra sau deploy (Claude) — D26

### Checkpoint: Complete
- [ ] Web mở bằng subdomain không cần terminal
- [ ] Tạo deck/import/học/publish chạy được trên link public
- [ ] Ready for review

Chi tiết từng task: xem `tasks/todo-task3.md`.
Tasks tracked in PLAN.md Sprint 12 (B23–B24 cho Codex, F22–F23 cho Gemini, D25–D26 Claude + user).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Gói miễn phí ngủ đông/lưu trữ tạm | High | Cảnh báo trước; chọn gói có disk bền vững hoặc chấp nhận mất dữ liệu test |
| Refactor mode làm vỡ timer/audio | Med | Mỗi mode có hàm dừng riêng, test click qua cả 7 tabs |
| Bỏ quota gây DB phình khi import lớn | Low | Import giữ transactional + giới hạn kích thước body 2 MiB hiện có |

## Open Questions
- Subdomain cụ thể nền tảng nào (Render/Fly.io/Koyeb)? — chốt ở Task 5 cùng user.
