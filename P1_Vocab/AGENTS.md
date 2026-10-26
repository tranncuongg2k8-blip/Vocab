# QUY TẮC PHỐI HỢP ĐA TÁC TỬ (MULTI-AGENT CONSTITUTION)

Dự án này được vận hành bởi 3 AI độc lập cùng truy cập vào một thư mục. Tất cả các Agent BẮT BUỘC đọc file này trước khi thực hiện bất kỳ thao tác nào.

## 1. Phân quyền vùng làm việc (Strict Isolation)
| Agent | Vai trò | Quyền Ghi (Write Access) | Quyền Đọc (Read Access) |
| :--- | :--- | :--- | :--- |
| **Claude** | Manager / Tech Lead | `MAP.md`, `SPEC.md`, `PLAN.md`, `contexte/`, `docs/`, `.claude/` | Toàn bộ dự án |
| **Codex** | Backend Coder & QA Tester | `livrables/backend/`, `scripts/`, `.claude/agent-memory/STATUS.md` | Toàn bộ dự án |
| **Gemini** | Frontend (Antigravity UI/UX) | `livrables/frontend/`, `.claude/agent-memory/STATUS.md` | Toàn bộ dự án |

*LƯU Ý TUỆT ĐỐI:* Codex KHÔNG ĐƯỢC sửa file trong `livrables/frontend/`. Gemini KHÔNG ĐƯỢC sửa file trong `livrables/backend/`. Claude KHÔNG ĐƯỢC tự ý sửa code trong `livrables/` mà phải yêu cầu Codex/Gemini sửa thông qua `PLAN.md`.

## 2. Giao thức bàn giao công việc (Handoff Protocol)
1. **Nhận việc:** Codex và Gemini đọc nhiệm vụ của mình tại `PLAN.md` và chuẩn giao tiếp tại `contexte/API_CONTRACT.md`.
2. **Làm việc:** Lưu toàn bộ kết quả code vào đúng thư mục được phân quyền trong `livrables/`.
3. **Báo cáo:** Sau khi lưu file xong, Codex và Gemini BẮT BUỘC ghi nối tiếp (append) báo cáo vào cuối file `.claude/agent-memory/STATUS.md` theo đúng mẫu trong `.claude/output-styles/report-template.md`.
