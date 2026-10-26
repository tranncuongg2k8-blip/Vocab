# VocabMaster Frontend — Antigravity UI/UX

Giao diện học từ vựng IELTS dạng Flashcard 3D và Quiz trắc nghiệm tương tác theo đúng chuẩn `contexte/API_CONTRACT.md` (Sprint 1, Sprint 2 §5, Sprint 3 §6) và các yêu cầu trong `SPEC.md` / `PLAN.md`.

## 1. Tính năng nổi bật

### Sprint 1: Khung SPA + Đọc dữ liệu + UI Flashcard 3D
- **Task F1 (Khởi tạo):** Single Page Application thuần không phụ thuộc thư viện ngoài (`node_modules`), tải siêu nhanh, tích hợp sẵn server HTTP tại `server.js` chạy trên port 3000. Phân tách Sets view và Study view.
- **Task F2 (Flashcard UI & Antigravity):** Hiệu ứng lật thẻ 3D (`perspective: 1200px`), hiệu ứng nghiêng vật lý (parallax tilt physics) theo chuột, hạt bụi vũ trụ canvas, các nút Trước/Tiếp/Lật/Trộn (Fisher-Yates) và hỗ trợ Web Speech API fallback khi không có file audio.
- **Task F3 (Contract & State Handling):** Gọi đúng `GET /health`, `GET /sets`, `GET /sets/:id`, `GET /sets/:id/cards?limit=&offset=`. Xử lý đầy đủ 3 trạng thái Loading (Skeleton shimmer), Empty state, Error state.

### Sprint 2: Bố cục 3 cột theo ảnh + Chấm điểm ghi nhớ + Thống kê
- **Task F4 (Bố cục 3 cột):**
  - **Cột 1 (Trái) — Thẻ từ chi tiết:** Loại từ badge (`wordType`), nút loa phát âm, từ tiếng Anh (`front`), phiên âm IPA (`phonetic`), định nghĩa tiếng Việt (`meaning`/`back`), câu ví dụ ngữ cảnh (`example`) kèm bản dịch tiếng Việt (`exampleVi`), danh sách từ đồng nghĩa (`synonyms`) và trái nghĩa (`antonyms`).
  - **Cột 2 (Giữa) — Panel "Lật thẻ":** Sân khấu 3D Flashcard trung tâm với badge mặt trước/sau, bộ điều hướng (Trước, Lật thẻ, Tiếp) và **4 nút chấm điểm ghi nhớ**:
    - **Quên** (`forgot`) — Phím <kbd>1</kbd> — Màu đỏ
    - **Mơ hồ** (`vague`) — Phím <kbd>2</kbd> — Màu cam
    - **Nhớ** (`remembered`) — Phím <kbd>3</kbd> — Màu cyan
    - **Nhớ rồi** (`mastered`) — Phím <kbd>4</kbd> — Màu xanh lá
  - **Cột 3 (Phải) — Sidebar Tùy chỉnh:**
    - **Giọng đọc:** Lựa chọn accent Mỹ (en-US), Anh (en-GB), Úc (en-AU).
    - **Mặt trước:** Switch chọn Tiếng Anh trước hay Tiếng Việt trước.
    - **Phiên âm:** Switch Bật/Tắt hiển thị phiên âm IPA.
    - **Ví dụ:** Switch Bật/Tắt hiển thị câu ví dụ.
    - **Syn / Ant:** Switch Bật/Tắt hiển thị từ đồng/trái nghĩa.
    - **Tự đọc:** Switch Tự động phát âm khi chuyển thẻ.
    - **Trộn:** Nút bấm Trộn ngẫu nhiên thẻ (Shuffle).
    - **Màu sắc:** Bảng chọn theme (Indigo, Cyan, Emerald, Rose).
- **Task F5 (Thống kê & Chế độ học):**
  - **Thanh Thống kê:** Gọi `GET /progress/:setId` hiển thị 3 chỉ số Đã nhớ (`mastered`), Cần ôn tập (`review = forgot + vague`), Chưa nhớ (`unseen = total - đã đánh giá`) cùng thanh progress bar đa màu (xanh lá - cam - xám) và dải mini dot pills. Có fallback tính toán nội bộ khi backend chưa khởi tạo endpoint.
  - **Thanh "Chế độ học":** Đặt phía dưới giao diện gồm các chế độ.
- **Task F6 (Chấm điểm & Xử lý trạng thái):**
  - Gửi `POST /progress` với body `{ cardId, setId, level }` khi bấm nút hoặc nhấn phím 1–4; tự động cập nhật thống kê và chuyển sang thẻ tiếp theo.
  - Xử lý trọn vẹn Loading / Empty / Error trên toàn bộ flow; tuyệt đối không hard-code từ vựng.

### Sprint 3: Chế độ Quiz trắc nghiệm 4 đáp án (§6 Contract)
- **Task F7 (Kích hoạt mode Quiz & Chấm đúng/sai):**
  - Kích hoạt tab "Trắc nghiệm" trong thanh "Chế độ học", cho phép chuyển đổi tức thì giữa chế độ Flashcard và chế độ Quiz.
  - Màn hình câu hỏi trắc nghiệm: Hiển thị từ vựng tiếng Anh (`prompt`), nút phát âm audio, và 4 nút đáp án tiếng Việt gắn phím tắt <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd>.
  - Chấm điểm tức thì (Instant grading):
    - Dùng `answerIndex` từ API Contract để so sánh.
    - Khi đúng: Nút đáp án chuyển sang màu xanh lá (`#10b981`), icon ✔, tăng điểm.
    - Khi sai: Nút đáp án chuyển màu đỏ (`#f43f5e`), icon ✖, đồng thời highlight đáp án đúng (viền xanh lá) kèm banner giải thích.
    - Tự động gửi `POST /progress` với level `forgot` khi làm sai để ghi nhận từ cần ôn tập.
  - Màn hình kết quả tổng kết (Quiz Results): Hiển thị cúp vàng, điểm số `X / N`, tỷ lệ `%`, đánh giá trình độ (Xuất sắc, Khá giỏi, Cần ôn thêm), và 3 nút hành động: "Làm lại Quiz", "Quay lại Lật thẻ", "Về danh sách bộ từ".
- **Task F8 (Kết nối API `GET /quiz/:setId?count=`):**
  - Kết nối endpoint `GET /quiz/:setId?count=` tuân thủ chặt chẽ schema `{ cardId, prompt, options, answerIndex }`.
  - Xử lý đủ 3 trạng thái Loading / Empty / Error (mã lỗi `SET_NOT_FOUND`, `INVALID_PAGINATION`, `NETWORK_ERROR`).
  - Hỗ trợ fallback thông minh tự tạo câu hỏi 4 lựa chọn từ các thẻ hiện tại nếu server offline, không bao giờ bị đơ ứng dụng.

### Sprint 4: Chế độ Ghép thẻ 2 cột xáo trộn Matching (§7 Contract)
- **Task F9 (Mode Ghép thẻ tương tác):**
  - Kích hoạt tab "Ghép thẻ" trong thanh "Chế độ học" (`.learning-modes-bar`), hỗ trợ chuyển đổi mượt mà giữa Lật thẻ, Trắc nghiệm và Ghép thẻ.
  - **Bố cục 2 cột xáo trộn (Two Columns Layout):**
    - Cột Trái (Terms): Danh sách từ vựng tiếng Anh, được xáo trộn ngẫu nhiên độc lập (Fisher-Yates).
    - Cột Phải (Definitions): Danh sách định nghĩa tiếng Việt tương ứng, được xáo trộn ngẫu nhiên độc lập.
  - **Tương tác nối cặp thông minh:**
    - Người dùng bấm chọn 1 thẻ từ ở cột trái (thẻ phát sáng hiệu ứng Selected) và bấm chọn 1 thẻ nghĩa ở cột phải.
    - **Ghép ĐÚNG:** Cả hai thẻ kích hoạt hiệu ứng pop và chuyển sang màu xanh lá (`#10b981`), hiển thị icon checkmark, vô hiệu hóa thẻ và tăng tiến độ `Đã ghép: X / N`.
    - **Ghép SAI:** Cả hai thẻ kích hoạt hiệu ứng rung lắc nhẹ (`shake`), viền màu đỏ (`#f43f5e`), tăng bộ đếm số lỗi và tự động reset trạng thái sau 650ms để người dùng thử lại.
  - **Bộ đếm thời gian & Số lỗi:**
    - Đồng hồ đếm thời gian thực `mm:ss` tự động chạy khi bắt đầu ván ghép.
    - Bộ đếm số lần ghép sai thời gian thực.
  - **Màn hình hoàn thành (Completion Screen):**
    - Xuất hiện ngay khi người chơi ghép xong toàn bộ cặp thẻ:
    - Huy hiệu đánh giá thành tích: *Hoàn hảo tuyệt đối (0 lỗi)*, *Xuất sắc (1-2 lỗi)*, *Khá tốt (3-4 lỗi)*, *Cần ôn thêm (>4 lỗi)*.
    - Bảng tổng kết 3 chỉ số: Thời gian hoàn thành, Tổng số lỗi sai, Tổng số cặp ghép.
    - 3 nút điều hướng: "Chơi ván mới" (phím <kbd>R</kbd>), "Quay lại Lật thẻ", "Về danh sách bộ từ".
- **Task F10 (Kết nối API `GET /matching/:setId?count=`):**
  - Kết nối endpoint `GET /matching/:setId?count=6` theo đúng API Contract §7: `{ data: MatchingPair[], total: number }` với `MatchingPair: { cardId, term, definition }`.
  - Xử lý đủ 3 trạng thái:
    - **Loading State:** Skeleton 2 cột thẻ nhấp nháy ánh kim shimmer.
    - **Empty State:** Thông báo khi bộ từ không có đủ dữ liệu ghép thẻ, kèm nút quay lại.
    - **Error State:** Hiển thị mã lỗi chuẩn (`SET_NOT_FOUND`, `INVALID_PAGINATION`, `NETWORK_ERROR`), chi tiết lỗi và nút "Thử lại".
  - Tích hợp fallback thông minh từ danh sách thẻ của bộ từ vựng nếu backend chưa kịp khởi động endpoint, giúp trải nghiệm người dùng luôn liên tục và hoàn hảo.
  - Tuyệt đối không hard-code từ vựng, không can thiệp code backend.

### Sprint 5: Mở rộng 2 mode Gõ từ & Nghe–Viết không cần API mới (§8 Contract)
- **Task F11 (Mode Gõ từ - Typing / Spelling):**
  - Kích hoạt tab "Gõ từ" (`#mode-tab-typing`) trên thanh "Chế độ học".
  - Hiển thị Định nghĩa tiếng Việt (`meaning`/`back`), phiên âm IPA mờ, loại từ (`wordType`) và ví dụ dịch (`exampleVi`).
  - Ô input gõ từ tiếng Anh tự động focus, hỗ trợ phím <kbd>Enter</kbd> kiểm tra tức thì.
  - Chấm đúng/sai chính xác (so sánh case-insensitive):
    - Khi đúng: Input xanh lá, feedback thành công, phát âm từ chuẩn.
    - Khi sai: Input đỏ rung lắc, hiển thị so sánh từ bạn gõ và đáp án đúng.
    - **Tự động gửi `POST /progress` với level `forgot`** khi gõ sai theo đúng yêu cầu đề bài, ghi nhận từ cần ôn tập vào hệ thống thống kê.
  - Màn hình kết quả tổng kết (Typing Results): Điểm số `X / N`, tỷ lệ `%`, đánh giá thành tích và nút làm lại bài / chuyển sang Nghe–Viết.
- **Task F12 (Mode Nghe–Viết - Listening / Dictation):**
  - Kích hoạt tab "Nghe–Viết" (`#mode-tab-listening`) trên thanh "Chế độ học".
  - Sân khấu âm thanh trung tâm với nút Loa lớn, hiệu ứng sóng âm thanh động (`soundwave`), nút "Nghe chậm" tốc độ 0.65x và gợi ý nghĩa mờ.
  - Tự động phát âm từ tiếng Anh bằng Web Speech API khi chuyển câu.
  - Gõ lại từ tiếng Anh vào input và nhấn <kbd>Enter</kbd> để kiểm tra:
    - Khi đúng: Input xanh lá, hiển thị nghĩa và phiên âm IPA củng cố, tăng điểm.
    - Khi sai: Input đỏ rung lắc, phát âm lại từ đúng và tự động gửi `POST /progress` level `forgot`.
  - Màn hình kết quả tổng kết (Listening Results): Điểm số, cúp tai nghe 🎧 và các nút điều hướng linh hoạt.
- Dùng lại toàn bộ API hiện có (`GET /sets/:id/cards` và `POST /progress`), không thêm endpoint mới theo đúng Contract §8; không hard-code dữ liệu từ vựng; không sửa backend.

### Sprint 6: Mode Điền vào chỗ trống + Mode Tổng hợp + Hoàn thiện Responsive (§9 Contract)
- **Task F13 (Mode Điền vào chỗ trống - Cloze / Fill in the blank):**
  - Kích hoạt tab "Điền từ" (`#mode-tab-cloze`) trên thanh "Chế độ học" (`.learning-modes-bar`).
  - Sân khấu câu ngữ cảnh (`#cloze-stage`):
    - Khai thác trường câu ví dụ `card.example` từ `GET /sets/:id/cards`, sử dụng biểu thức chính quy (`RegExp`) thông minh để thay thế từ mục tiêu bằng chỗ trống khuyết từ `[ ______ ]` (`.cloze-blank`).
    - Hiển thị đầy đủ bản dịch câu ví dụ (`exampleVi`), định nghĩa gợi ý tiếng Việt (`meaning`/`back`), loại từ badge (`wordType`) và phiên âm IPA (`phonetic`).
    - Nút phát âm audio mẫu (phím tắt <kbd>P</kbd>) hỗ trợ luyện nghe câu ngữ cảnh.
  - Ô input điền từ tự động focus, nhấn <kbd>Enter</kbd> kiểm tra tức thì:
    - **Khi ĐÚNG:** Chỗ trống trên câu ví dụ tự động lấp đầy từ chính xác với viền xanh lá rực rỡ (`.blank-filled-correct`), banner phản hồi chúc mừng, phát âm từ chuẩn và tăng điểm số.
    - **Khi SAI:** Chỗ trống chuyển viền đỏ (`.blank-filled-wrong`), ô input rung lắc, hiển thị rõ so sánh từ người dùng đã gõ với đáp án chuẩn trong câu, **tự động gửi `POST /progress` với level `forgot`** vào hệ thống để đưa từ vào diện cần ôn tập định kỳ.
  - Màn hình kết quả bài điền từ (`#cloze-result-wrapper`): Điểm số `X / N`, tỷ lệ `%`, đánh giá trình độ và nút chuyển ngay sang bài thi Tổng hợp PRO.
- **Task F14 (Mode Tổng hợp - Mixed / Comprehensive + Responsive toàn app):**
  - Kích hoạt tab "Tổng hợp" với huy hiệu **PRO** (`#mode-tab-mixed`).
  - **Trộn ngẫu nhiên 4 dạng bài tập trong cùng 1 phiên học:**
    1. *Dạng 1: Trắc nghiệm (Quiz)* — 4 lựa chọn, phím tắt 1–4.
    2. *Dạng 2: Gõ từ (Typing)* — Nhìn nghĩa tiếng Việt $\rightarrow$ Gõ từ tiếng Anh.
    3. *Dạng 3: Nghe–Viết (Listening)* — Nghe phát âm Speech API $\rightarrow$ Gõ chính tả tiếng Anh.
    4. *Dạng 4: Điền từ (Cloze)* — Câu ví dụ ngữ cảnh khuyết từ $\rightarrow$ Điền từ còn thiếu.
  - Tự động gửi `POST /progress` với level `forgot` khi làm sai bất kỳ câu hỏi nào trong phiên để bảo đảm tính nhất quán dữ liệu tiến độ.
  - **Màn hình Tổng kết & Phân tích 4 kỹ năng:**
    - Cúp danh hiệu IELTS Antigravity Master.
    - Bảng phân tích chi tiết (Skill Breakdown Matrix): Chia rõ tỷ lệ và số câu đúng / tổng số câu của từng dạng trong 4 dạng bài tập (Trắc nghiệm, Gõ từ, Nghe–Viết, Điền từ).
  - **Tối ưu Responsive toàn diện (Responsive Verification):**
    - Kiểm tra và tinh chỉnh giao diện trên cả 3 dải độ phân giải: Desktop (≥1024px), Tablet (768px - 1023px) và Mobile (<768px, 640px, 480px).
    - Các bảng điều khiển, thanh chế độ học 7 tabs, grid đáp án trắc nghiệm, 2 cột ghép thẻ và matrix 4 kỹ năng đều co giãn mượt mà, không tràn màn hình.
  - Tuân thủ nghiêm ngặt: Dùng API hiện có (`GET /sets/:id/cards` và `POST /progress`), không sửa backend, không hard-code từ vựng.

### Sprint 7 (Task 2): Bộ thẻ của tôi — Deck + Group + Tạo thẻ thủ công + Nhập Excel/CSV (§10–§12 Contract)
- **Task F15 (Trang Bộ thẻ của tôi — Ảnh 1):**
  - **Thanh chuyển đổi điều hướng:** Tab "Thư viện hệ thống" và tab "Bộ thẻ của tôi" gắn huy hiệu Mới trên Header.
  - **Theo dõi Quota trực quan:** Hiển thị rõ hạn mức theo Contract §10: `X/3 bộ thẻ · tối đa 600 thẻ` kèm đèn báo trạng thái (xanh / vàng / đỏ cảnh báo). Vô hiệu hóa nút tạo khi chạm ngưỡng 3/3 bộ thẻ.
  - **Lưới danh sách Decks:**
    - Mỗi card deck hiển thị tên bộ thẻ, badge trạng thái (`Bản Nháp` hoặc `Đã công bố`), số thẻ, số nhóm.
    - Cụm nút hành động đầy đủ: **Học ngay** (kết nối trực tiếp vào phiên học), **Chi tiết** (chuyển sang trang quản lý nhóm), **Sửa tên** (modal đổi tên), **Chia sẻ** (sao chép liên kết 1-click), **Xóa** (hộp thoại xác nhận), **Công bố** (hiển thị disabled kèm tooltip theo đặc tả).
  - **Xử lý trạng thái đầy đủ:** Skeleton shimmer Loading, Empty state có nút tạo bộ thẻ đầu tiên, Error state có mã lỗi và nút Thử lại.
- **Task F16 (Trang chi tiết Deck + Form tạo thẻ thủ công — Ảnh 2 & 3):**
  - **Trang chi tiết Deck (Ảnh 2):**
    - Header bộ thẻ: Tên deck, badge Bản Nháp, bộ đếm `X / 600 thẻ`, `Y nhóm`, nút Quay lại Bộ thẻ của tôi.
    - Cụm nút tác vụ: Nút **Học ngay**, nút **Công bố** (disabled), nút **Nhập Excel/CSV**, nút **+ Tạo Nhóm**.
    - Lưới Group Cards: Hiển thị tên nhóm, số thẻ trong nhóm, nút "Xem Thẻ", nút "+ Tạo Thẻ", nút "Sửa tên" và nút "Xóa nhóm".
  - **Form tạo thẻ thủ công (Ảnh 3):**
    - Hộp tìm kiếm / gợi ý từ vựng nhanh (Quick Dictionary suggestion).
    - Ô nhập bắt buộc có validation thời gian thực: Từ vựng (front)* và Bản dịch (meaning/back)*. Rung lắc báo lỗi nếu để trống.
    - **Bộ chọn 13 loại từ IELTS** chuẩn Contract §11: Danh từ (`noun`), Động từ (`verb`), Tính từ (`adjective`), Trạng từ (`adverb`), Giới từ (`preposition`), Đại từ (`pronoun`), Liên từ (`conjunction`), Từ hạn định (`determiner`), Thán từ (`interjection`), Cụm động từ (`phrasal verb`), Thành ngữ (`idiom`), Cụm từ (`phrase`), Cụm kết hợp từ (`collocation`) và Động từ khiếm khuyết (`modal verb`).
    - Phiên âm IPA kèm nút loa phát âm thử bằng Web Speech API.
    - Câu ví dụ ngữ cảnh tiếng Anh (`example`) và Bản dịch câu ví dụ (`exampleVi`).
    - Hỗ trợ nút "Lưu & Tạo tiếp" để liên tục thêm từ mà không phải mở lại form. Sau khi lưu, tự động tăng số thẻ của nhóm và bộ thẻ.
- **Task F17 (Modal Nhập Excel/CSV 2 tab — Ảnh 4 & 5):**
  - **Tab 1: Tệp (File Upload — Ảnh 4):**
    - Nút tải tệp mẫu CSV chuẩn 7 cột (`word,IPA,loại từ,nghĩa VI,ví dụ EN,nghĩa VD VI,ghi chú`).
    - Khu vực kéo thả / chọn tệp (Dropzone) hỗ trợ `.csv` và `.xlsx` (Excel).
    - Bộ phân tích cú pháp client-side tự động nhận diện cột và hiển thị Bảng xem trước (Preview Table) với số thẻ hợp lệ trước khi nhấn nhập.
    - Nút "Nhập N thẻ" gửi lên `POST /my/groups/:gid/import` và báo cáo số thẻ thành công / danh sách dòng lỗi.
  - **Tab 2: Dán nhanh (Fast Paste — Ảnh 5):**
    - Hướng dẫn định dạng phân tách bằng dấu gạch đứng `|`, Tab hoặc dấu phẩy.
    - Nút 1-click **"Sao chép câu lệnh AI"**: Tự động copy mẫu prompt chuẩn để người dùng dán vào ChatGPT/Claude xin danh sách từ vựng đúng chuẩn 7 cột.
    - Textarea dán dữ liệu kèm live parser hiển thị ngay bảng xem trước trích xuất.
    - Nút "Nhập hàng loạt thẻ" và banner kết quả chi tiết.
- Không sửa backend, không hard-code dữ liệu. Khi backend chưa mount API, có cơ chế lưu trữ client-side fallback liền mạch.

### Sprint 8: Chia sẻ & Công bố bộ thẻ (§13 Contract)
- **Task F18 (Công bố & Chia sẻ bộ thẻ công khai):**
  - **Kích hoạt nút Công bố (Publish Deck):**
    - Chuyển trạng thái bộ thẻ giữa `draft` ("Bản Nháp" - badge màu hổ phách amber) và `published` ("Đã công bố" - badge màu xanh ngọc emerald) theo Contract §13.
    - Gọi API `POST /my/decks/:id/publish` và `POST /my/decks/:id/unpublish` với hộp thoại xác nhận trực quan.
    - Tự động cập nhật trực tiếp huy hiệu trạng thái trên thẻ deck tại trang "Bộ thẻ của tôi" và Banner chi tiết bộ thẻ.
  - **Kích hoạt nút Chia sẻ (Share Deck & 1-Click Copy Link):**
    - Gọi API `POST /my/decks/:id/share` lấy mã định danh chia sẻ `shareId` duy nhất và liên kết công khai `/shared/:shareId`.
    - Tự động sao chép (auto-copy) đường dẫn chia sẻ vào Clipboard khi bấm nút "Chia sẻ".
    - Mở Modal chia sẻ sang trọng (`#modal-share-deck`) cho phép xem lại URL, bấm nút "Sao chép" thủ công và có nút chuyển ngay tới "Xem trang chia sẻ".
  - **Trang xem deck được chia sẻ (Public Shared Deck Page - `#view-shared-deck`):**
    - Hỗ trợ định tuyến URL linh hoạt: pathname `/shared/:shareId`, query param `?shared=:shareId`, hoặc hash `#/shared/:shareId`.
    - Gọi API `GET /shared/:shareId` trả về schema Contract §13: `{ data: { deck, groups, cards, total } }`.
    - **Header bộ thẻ cộng đồng:** Tên bộ thẻ, badge trạng thái "Đã công bố", số thẻ, số nhóm, nhãn ngôn ngữ.
    - **Cụm nút tác vụ tiện ích:**
      - **Học ngay:** Chuyển thẳng sang phiên học Flashcard 3D với toàn bộ từ vựng của bộ thẻ chia sẻ.
      - **Lưu về Bộ thẻ của tôi (Clone Deck):** Gọi `cloneSharedDeck` tạo bản sao bộ thẻ, nhóm và toàn bộ thẻ từ vựng vào tài khoản cá nhân của người dùng.
      - **Sao chép link:** Nút copy URL chia sẻ để gửi cho bạn bè.
    - **Bảng tóm tắt nhóm & Danh sách thẻ chi tiết:**
      - Hiển thị các chip nhóm thẻ kèm số thẻ.
      - Bảng xem trước từ vựng chi tiết: STT, Từ vựng kèm nút loa phát âm Web Speech API, Phiên âm IPA, Loại từ IELTS, Nghĩa tiếng Việt, Câu ví dụ và bản dịch.
    - **Xử lý đầy đủ 3 trạng thái:** Skeleton shimmer Loading, Empty state có nút quay về, Error state chuẩn mã lỗi (`SHARE_NOT_FOUND`, `NETWORK_ERROR`) kèm nút Thử lại.
  - Tuyệt đối không can thiệp code backend, không hard-code từ vựng; có cơ chế fallback client-side thông minh đảm bảo hoạt động trơn tru.

### Sprint 9: Sửa lệch + Hoàn thiện Task 2 (§13 Contract)
- **Task F19 (Bỏ fallback localStorage trong Publish/Unpublish/Share & Chuẩn hóa trang Shared):**
  - **Bỏ toàn bộ fallback localStorage:**
    - `api.publishDeck(id)`: Gọi trực tiếp `PUT /my/decks/:id/publish` (idempotent), loại bỏ triệt để mọi logic đọc/ghi `_getLocalStorageDecks()`. Lỗi từ server được ném ra nguyên bản để hiển thị toast/error cho người dùng.
    - `api.unpublishDeck(id)`: Gọi trực tiếp `POST /my/decks/:id/unpublish` (idempotent), loại bỏ triệt để mọi logic fallback localStorage.
    - `api.getShareLink(id)`: Chuẩn hóa theo Contract §13 (`shareId = deck id`), loại bỏ tạo mã giả `share-xxx` nội bộ.
    - `api.getSharedDeck(shareId)`: Gọi trực tiếp `GET /shared/:shareId` (không auth), loại bỏ mọi fallback sang localStorage/public sets. Bắt lỗi chuẩn 404 `DECK_NOT_FOUND`.
  - **Trang xem deck được chia sẻ công khai (`#view-shared-deck` & `SharedDeckController`):**
    - Trích xuất và render trực tiếp cấu trúc `{ deck, groups, cards, total }` từ response mới của backend Codex (§13).
    - **Header:** Hiển thị tên deck, badge "Đã công bố", số thẻ thực tế và số nhóm thực tế từ response.
    - **Danh sách nhóm tương tác:** Render toàn bộ nhóm với số thẻ tương ứng, hỗ trợ các pill bộ lọc nhóm tương tác (`.group-count-pill.interactive`) cho phép người dùng click để lọc thẻ theo từng nhóm hoặc xem tất cả nhóm.
    - **Bảng thẻ từ vựng chi tiết:** Render danh sách từ vựng từ `cards` trong response, hiển thị nhãn nhóm tương ứng khi bộ thẻ có nhiều nhóm, kèm phát âm Web Speech API, nghĩa tiếng Việt và câu ví dụ ngữ cảnh.
    - **Bảo toàn đầy đủ 3 trạng thái:**
      - *Loading State:* Shimmer skeleton hiển thị ngay khi bắt đầu tải dữ liệu.
      - *Empty State:* Hiển thị banner thân thiện khi bộ thẻ không có từ vựng nào (`total === 0`).
      - *Error State:* Bắt mã lỗi chuẩn `DECK_NOT_FOUND` (404) kèm thông báo rõ ràng khi bộ thẻ không tồn tại hoặc chưa công bố, có nút "Thử lại" và nút "Về trang chủ".

### Sprint 10: Dọn toàn bộ fallback localStorage & Kiểm chứng dữ liệu bền vững SQLite (§14 Contract)
- **Task F20 (Dọn sạch toàn bộ fallback localStorage trong `api.js`):**
  - Loại bỏ hoàn toàn các helper mock storage nội bộ (`_getLocalStorageDecks`, `_getLocalStorageGroups`, `_getLocalStorageCards`).
  - Toàn bộ 100% các phương thức tương tác API trong `api.js` (`getMyDecks`, `createMyDeck`, `updateMyDeck`, `deleteMyDeck`, `getDeckGroups`, `createGroup`, `updateGroup`, `deleteGroup`, `createCard`, `importCards`, `getCards`) gọi trực tiếp HTTP API tới backend Node.js SQLite:
    - `getMyDecks`: Gọi `GET /my/decks`.
    - `createMyDeck`: Gọi `POST /my/decks`.
    - `updateMyDeck`: Gọi `PUT /my/decks/:id`.
    - `deleteMyDeck`: Gọi `DELETE /my/decks/:id`.
    - `getDeckGroups`: Gọi `GET /my/decks/:id/groups`.
    - `createGroup`: Gọi `POST /my/decks/:id/groups`.
    - `updateGroup`: Gọi `PUT /my/groups/:gid`.
    - `deleteGroup`: Gọi `DELETE /my/groups/:gid`.
    - `createCard`: Gọi `POST /my/groups/:gid/cards`.
    - `importCards`: Gọi `POST /my/groups/:gid/import`.
    - `getCards`: Gọi `GET /sets/:id/cards`.
  - Không còn bất kỳ nhánh dự phòng localStorage nào; chỉ ném và hiển thị đúng mã lỗi và thông báo API thật từ máy chủ (e.g., `QUOTA_EXCEEDED`, `DECK_NOT_FOUND`, `GROUP_NOT_FOUND`, `INVALID_REQUEST`).
  - Giữ trọn vẹn và nhất quán cả 3 trạng thái giao diện: Loading (shimmer skeleton), Empty state, Error state.
- **Task F21 (Kiểm thử thủ công từng luồng & Dữ liệu bền vững sau Restart Backend):**
  - Thực hiện kiểm chứng tự động & thủ công toàn bộ các luồng tác vụ với backend SQLite:
    1. Tạo Deck mới (`POST /my/decks`) $\rightarrow$ thành công, lưu vào SQLite.
    2. Đổi tên Deck (`PUT /my/decks/:id`) $\rightarrow$ thành công, cập nhật tiêu đề trong DB.
    3. Tạo Group mới (`POST /my/decks/:id/groups`) $\rightarrow$ thành công.
    4. Tạo Card thủ công (`POST /my/groups/:gid/cards`) $\rightarrow$ thành công, tăng số thẻ nhóm và bộ thẻ.
    5. Nhập hàng loạt Card (`POST /my/groups/:gid/import`) $\rightarrow$ import nguyên tử chính xác số thẻ hợp lệ.
    6. Công bố Deck (`PUT /my/decks/:id/publish`) $\rightarrow$ chuyển trạng thái sang `published`.
    7. **Khởi động lại Backend (Restart Backend simulation):** Hủy hoàn toàn tiến trình server cũ, khởi tạo server mới trỏ vào cùng file `vocab.sqlite`.
    8. **Xác nhận tính bền vững sau Restart:**
       - `GET /my/decks` sau restart: Bộ thẻ, số nhóm, số thẻ, trạng thái `published` giữ nguyên vẹn 100%.
       - `GET /my/decks/:id/groups` sau restart: Nhóm và số thẻ nhóm giữ nguyên vẹn 100%.
       - `GET /shared/:shareId` sau restart: Trả đủ thông tin deck, 1 nhóm, 3 thẻ từ vựng đúng chuẩn Contract §13.
    9. Hủy công bố (`POST /my/decks/:id/unpublish`) $\rightarrow$ status trở về `draft`, link chia sẻ lập tức thu hồi và trả lỗi 404 `DECK_NOT_FOUND`.
    10. Xóa nhóm (`DELETE /my/groups/:gid`) & Xóa Deck (`DELETE /my/decks/:id`) $\rightarrow$ cascade xóa sạch theo quan hệ dữ liệu trong SQLite.
  - Kết quả kiểm chứng: 100% PASS, dữ liệu được lưu trữ bền vững trong file SQLite và không bị mất sau khi khởi động lại server.

### Sprint 12: Bỏ giới hạn số lượng (Quota) & Chuẩn hóa Single-mode view (§15 & §16 Contract)
- **Task F22 (Bỏ hiển thị & hành vi chặn theo quota trên giao diện):**
  - **Xóa toàn bộ giới hạn và văn bản quota:**
    - Loại bỏ hoàn toàn text `"tối đa 600 thẻ"`, `"X/3 bộ thẻ"`, `"tối đa 600 thẻ/bộ"` khỏi trang Bộ thẻ của tôi (`#view-my-decks`), trang chi tiết bộ thẻ (`#view-deck-detail`), modal tạo bộ thẻ (`#modal-create-deck`) và dropzone nhập tệp (`#file-import-dropzone`).
    - Thay thế badge quota bằng badge số lượng bộ thẻ đơn giản: `<span>${count} bộ thẻ</span>`. Loại bỏ đèn báo trạng thái `full` / `warning` (`.quota-indicator-dot`).
  - **Nút "Tạo Bộ Thẻ":** Không bao giờ bị vô hiệu hóa (`disabled`) vì lý do số lượng bộ thẻ đã tạo.
  - **Bỏ chặn quota ở phía client:** Xóa kiểm tra `this.decks.length >= 3` trong `openCreateModal()` và trong `api.cloneSharedDeck()`.
  - **Xử lý lỗi thân thiện:** Trường hợp nhận mã lỗi `QUOTA_EXCEEDED` cũ (nếu backend chưa cập nhật), hiển thị thông báo hướng dẫn nhẹ nhàng, thân thiện cho người dùng.
- **Task F23 (Single-mode view & Cách ly triệt để các chế độ học):**
  - **Hiển thị duy nhất 1 stage:** Khi nhấp vào bất kỳ tab chế độ nào trên thanh Chế độ học (`.learning-modes-bar`) trong 7 chế độ (Lật thẻ 3D, Trắc nghiệm, Ghép thẻ, Gõ từ, Nghe–Viết, Điền từ, Tổng hợp), chỉ có đúng 1 stage tương ứng được hiển thị, cả 6 stage còn lại đều bị ẩn triệt để (`display: none !important`).
  - **Thanh Chế độ học (Learning Modes Bar):** Luôn hiển thị xuyên suốt mọi chế độ trong phiên học (`#view-study`) để người dùng dễ dàng chuyển đổi qua lại.
  - **Dừng timer và âm thanh nền:**
    - Khi chuyển sang tab khác hoặc thoát khỏi giao diện học, hàm `cleanupStudyModes()` tự động kích hoạt.
    - Dừng toàn bộ timer đếm giờ của chế độ Ghép thẻ (`matchingCtrl.stopTimer()`).
    - Dừng ngay lập tức giọng đọc Web Speech API (`window.speechSynthesis.cancel()`), dọn dẹp hiệu ứng sóng âm thanh (`soundwave`) và clear timeout của Nghe–Viết (`listeningCtrl.cleanup()`).
    - Dọn dẹp âm thanh phát âm và timeout của chế độ Tổng hợp (`mixedCtrl.cleanup()`) và Lật thẻ (`flashcardCtrl.stopAudio()`).
  - **Cách ly màn hình kết quả:** Màn hình kết quả tổng kết (nhất là của chế độ Tổng hợp `#mixed-result-wrapper`) được cô lập hoàn toàn bên trong stage của nó, tự động ẩn thanh tiến trình/câu hỏi khi hiện kết quả, tuyệt đối không xuất hiện hay rò rỉ lẫn lộn sang các stage hoặc chế độ khác.
  - **Đảm bảo trọn vẹn 3 trạng thái:** Duy trì Loading / Empty / Error nhất quán và tin cậy trên toàn bộ các chế độ.

### Sprint 13: Dọn dẹp dứt điểm các tàn dư Quota & Chuẩn hóa Lỗi chung (Task F24)
- **Task F24 (Dọn dẹp text quota sót lại & Chuẩn hóa thông báo lỗi):**
  - **Sửa comment trong `api.js`:** Xóa dòng comment cũ `(tối đa 3 bộ)` tại phương thức `getMyDecks`, cập nhật thành mô tả chuẩn không chứa giới hạn cũ.
  - **Sửa title nút Tạo Bộ Thẻ trong `index.html`:** Xóa chuỗi `(tối đa 3)` khỏi tooltip `title="Tạo bộ thẻ mới"` của `#btn-open-create-deck`.
  - **Đổi các nhánh mã lỗi `QUOTA_EXCEEDED` thành lỗi chung:** Chuyển đổi toàn bộ các khối `catch` trong `mydecks.js`, `deckdetail.js` và `import.js` về chuẩn thông báo lỗi chung `${err.message}`, loại bỏ hoàn toàn các chuỗi text đặc biệt còn nhắc tới "giới hạn".
  - **Kiểm thử cú pháp sạch 100%:** Kiểm tra toàn bộ codebase bằng `node --check` không phát sinh bất kỳ cảnh báo hoặc lỗi cú pháp nào.

---

## 2. Hướng dẫn khởi chạy

Chạy server frontend trên port `3000` (theo file cấu hình `.env`):

```bash
cd livrables/frontend
npm start
```
Hoặc:
```bash
node server.js
```

Truy cập trên trình duyệt: `http://localhost:3000`
