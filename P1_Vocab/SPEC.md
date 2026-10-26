# ĐẶC TẢ YÊU CẦU DỰ ÁN (PROJECT SPECIFICATION)

## 1. Mục tiêu tổng quan
- **Tên dự án:** [Vocab]
- **Mô tả ý tưởng:** 
Task1:
[hãy truy cập vào trang này "https://theieltsdictionary.com/practice/flashcard?set=1"
và phân tích toàn bộ bố cục, cấu trúc và màu sắc của trang này. Hãy xây dựng cho tôi một trang web có dao diện giống hệt như vậy để tôi học từ vựng tiếng anh.
Website phải có đầy đủ các chức năng,các trò chơi và các hiệu ứng như trang web đã cung cấp]

## 2. Yêu cầu kỹ thuật đối với Backend & Test (Dành cho Codex)
- Xây dựng API rõ ràng, xử lý lỗi (error handling) chặt chẽ.
- Mọi tính năng hoàn thành phải đi kèm Unit Test / Integration Test tự động.
- Không hard-code các biến nhạy cảm (phải đọc từ `.env`).

## 3. Yêu cầu kỹ thuật đối với Frontend (Dành cho Gemini Antigravity)
- Giao diện hiện đại, hỗ trợ hiệu ứng tương tác vật lý / chuyển động mượt mà (Antigravity / Smooth animations).
- Tương thích hoàn toàn với các endpoint được quy định trong `contexte/API_CONTRACT.md`.
- Xử lý đầy đủ các trạng thái Loading, Empty, Error trên giao diện.

## 4. Tiêu chí nghiệm thu (Definition of Done - DoD)
Một tính năng chỉ được Claude xác nhận hoàn thành khi:
1. Code của Codex vượt qua 100% test cases.
2. Giao diện của Gemini gọi API thành công mà không phát sinh lỗi CORS hay lệch trường JSON.
