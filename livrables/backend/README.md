# Vocab backend — Sprint 1–14

Yêu cầu Node.js >= 22. Không có dependency ngoài; không cần chạy npm install.

## Chạy web và API

Mở PowerShell ở thư mục gốc dự án `D:\Project\P1_Vocab`.
Kiểm tra Node.js và tạo cấu hình mẫu nếu chưa có (không ghi đè cấu hình hiện tại):

```powershell
node --version
if (-not (Test-Path -LiteralPath ./livrables/backend/.env)) {
    Copy-Item -LiteralPath ./livrables/backend/.env.example -Destination ./livrables/backend/.env
}
./scripts/start-backend.ps1
```

Mở `http://localhost:8000`. Backend phục vụ cả giao diện tĩnh và API trên cùng
origin. API giữ nguyên prefix `/api/v1`; client frontend tự gọi API cùng origin.
Nếu PowerShell chặn script `.ps1`, từ gốc dự án chạy
`node ./livrables/backend/src/server.js`.

Backend đọc `livrables/backend/.env` (không phụ thuộc thư mục chạy lệnh).
Nếu chưa có file này, sao chép `.env.example` thành `.env`.
`PORT` mặc định là `8000`; biến môi trường của tiến trình có ưu tiên cao hơn `.env`.
`SQLITE_PATH` mặc định là `livrables/backend/data/vocab.sqlite`; đường dẫn tương đối
được tính từ thư mục backend. Deck, Group, Card do người dùng tạo và progress được
lưu bền vững; dữ liệu seed giữ trong source và chỉ đọc.
SQLite dùng `node:sqlite` tích hợp trong Node.js 24; runtime có thể in cảnh báo API experimental.
`PORT=0` dùng cổng tự động cho kiểm thử. PORT không hợp lệ làm tiến trình thoát với mã 1.
PORT hợp lệ nằm trong 0–65535; khi dùng giao diện mặc định, giữ PORT=8000.
Khởi động lại server sau khi đổi cấu hình. Dừng server bằng `Ctrl+C`.

## Chạy frontend riêng khi phát triển

Nếu muốn chạy frontend dev server riêng như trước, mở terminal thứ hai tại gốc dự án:

```powershell
node ./livrables/frontend/server.js
```

Mở `http://localhost:3000`. Dùng hostname `localhost` và cổng 3000 theo CORS
Contract; không mở trực tiếp file HTML. Trong dev server riêng, cấu hình API Base URL
là `http://localhost:8000/api/v1`.
Backend đọc `.env` riêng trong `livrables/backend`; frontend dùng `FRONTEND_PORT`
của tiến trình hoặc `.env` ở gốc dự án và mặc định 3000. Để dùng cấu hình chuẩn,
giữ frontend ở 3000 và backend ở 8000. Với một service, chỉ cần chạy backend ở 8000.

Từ một terminal khác, kiểm tra API đang chạy:

```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/health'
Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/sets'
Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/sets/2/cards?limit=2&offset=0'
```

Health trả `status: ok`, danh sách có 3 sets, truy vấn cards trả 2 thẻ với `total: 10`.

## Deploy một service lên Fly.io

Docker build context là thư mục gốc repo vì Dockerfile copy cả backend và frontend.
Mẫu này dùng app `vocab-diamond`; đổi tên nếu app đó đã được người khác đăng ký.
Sau khi cài `flyctl` và đăng nhập bằng `fly auth login`, tại thư mục gốc repo chạy:

```powershell
fly launch --config livrables/backend/fly.toml --no-deploy
fly volumes create vocab_data --region sin --size 1 --app vocab-diamond
fly scale count 1 --app vocab-diamond
fly deploy --config livrables/backend/fly.toml --app vocab-diamond
```

Nếu đổi tên app, dùng cùng tên ở cả `fly.toml` và các lệnh trên.

`fly.toml` đặt app ở region `sin`, HTTP port 8080, `SQLITE_PATH=/data/vocab.sqlite`
và mount volume `vocab_data` tại `/data`. Dùng một Machine vì SQLite nằm trên volume
cục bộ, không chia sẻ giữa nhiều Machines. Sau deploy, mở `https://<app-name>.fly.dev`;
web và API cùng origin, API vẫn ở `/api/v1`. Volume sống qua deploy/restart nhưng
cần có quy trình backup riêng nếu dữ liệu quan trọng.

## Dữ liệu và API

Base URL: `http://localhost:8000/api/v1`. Seed có 3 sets, tổng 30 cards en-vi:

| Set ID | Tên | Card ID | Số thẻ |
| --- | --- | --- | --- |
| `1` | Everyday English | `1`–`10` | 10 |
| `2` | Travel & Transport | `11`–`20` | 10 |
| `3` | Study & Work | `21`–`30` | 10 |

Sprint 5 bổ sung 2 sets; mọi card có đủ trường §3/§5, audioUrl=null để frontend
dùng Speech API. Từ không có trái nghĩa trực tiếp dùng antonyms=[]. cardCount được
tính từ số cards của từng set. Mode Gõ từ và Listening dùng lại API hiện có theo §8.

| Method | Path | Kết quả |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok" }` |
| GET | `/sets` | `{ "data": [...] }` |
| GET | `/sets/1` | `{ "data": {...} }` |
| GET | `/sets/1/cards?limit=5&offset=0` | `{ "data": [...], "total": 10 }` |
| POST | `/progress` | `{ "data": { "cardId": "1", "level": "remembered" } }` |
| GET | `/progress/1` | `{ "data": { "setId": "1", "mastered": 0, "review": 0, "unseen": 10, "total": 10 } }` (trước khi đánh giá) |
| GET | `/quiz/1?count=5` | `{ "data": [...], "total": 10 }` |
| GET | `/matching/1?count=6` | `{ "data": [...], "total": 10 }` |
| GET | `/my/decks` | `{ "data": [...] }` |
| POST | `/my/decks` | `{ "data": { "id": "...", "title": "My words", "status": "draft", "cardCount": 0, "groupCount": 0, "language": "en-vi" } }` |
| GET | `/my/import/template` | CSV template, 7 columns |
| PUT | `/my/decks/:id/publish` | `{ "data": Deck }` with `status: "published"` |
| POST | `/my/decks/:id/unpublish` | `{ "data": Deck }` with `status: "draft"` |
| GET | `/shared/:shareId` | `{ "data": { "deck": Deck, "groups": Group[], "cards": Card[], "total": number } }` |

## Bộ thẻ cá nhân Sprint 7

Deck/Group/Card cá nhân được lưu trong SQLite, không giới hạn số Deck hoặc Card.
Deck được đưa vào `/sets` dưới đúng schema VocabularySet,
để Cards, Quiz, Matching và Progress đang có dùng lại được. Cards do người dùng
tạo có thêm `groupId` theo §11. Xóa deck hoặc group sẽ xóa cards liên quan.

Deck API: `GET/POST /my/decks`, `PUT/DELETE /my/decks/:id`.
`PUT /my/decks/:id/publish` changes draft status to published. The existing deck ID
is the share ID; `POST /my/decks/:id/unpublish` returns a deck to draft. Both
transitions are idempotent. `GET /shared/:shareId` returns the deck, its groups,
cards and total only when published, with no authentication. Deleting or
unpublishing a deck revokes public access to the share ID.
Group API: `GET/POST /my/decks/:id/groups`, `PUT/DELETE /my/groups/:gid`.
Tạo card: `POST /my/groups/:gid/cards`, yêu cầu `front` và `meaning` hoặc `back`;
`wordType` nhận các giá trị §11 (Contract liệt kê 14 giá trị dù ghi 13).
Import: `POST /my/groups/:gid/import` với `{ "cards": [{ "front": "...", "meaning": "..." }] }`.
Dòng không hợp lệ được trả theo vị trí 1-based trong `failed`; hợp lệ vẫn được nhập.
Nếu tổng thẻ hợp lệ vượt quota, cả lần import bị từ chối nguyên tử bằng 400
Import request tối đa 2 MiB theo giới hạn body.
Template: `GET /my/import/template`, CSV header `word,IPA,wordType,meaning,example,exampleVi,notes`.

Không truyền phân trang thì trả tất cả cards. `limit` và `offset` là số nguyên
không âm trong khoảng an toàn của JavaScript; mặc định lần lượt là số cards và 0.
`limit=0` hoặc offset vượt số cards trả mảng rỗng, vẫn giữ total trước phân trang.
Giá trị rỗng, âm, thập phân, không phải số hoặc tham số phân trang lặp lại trả 400
`INVALID_PAGINATION`. Đây là quy ước triển khai cho các chi tiết Contract chưa quy định.

Set không tồn tại trả đúng 404 `SET_NOT_FOUND` / `Set not found`.
Route/method ngoài phạm vi trả 404 `ROUTE_NOT_FOUND`; ID mã hóa sai trả 400
`INVALID_REQUEST`. Lỗi nội bộ trả 500 `INTERNAL_SERVER_ERROR` với thông báo chung.
Mọi JSON tuân thủ các trường và format lỗi trong `contexte/API_CONTRACT.md`.

CORS cho origin `http://localhost:3000`, hỗ trợ OPTIONS preflight cho GET
và POST tại `/progress`.

## Card và tiến độ Sprint 2

10 cards của set 1 giữ nguyên mọi trường Sprint 1; toàn bộ 30 cards có 5 trường tùy chọn:
`meaning` (nghĩa tiếng Việt), `exampleVi` (dịch ví dụ), `synonyms`, `antonyms`,
`wordType` (loại từ). Từ không có từ trái nghĩa trực tiếp dùng `antonyms: []`.
API vẫn xử lý được card cũ không có các trường tùy chọn.

Gửi JSON với Content-Type `application/json` đến `POST /progress`:

```json
{ "cardId": "1", "setId": "1", "level": "remembered" }
```

`level` nhận `forgot`, `vague`, `remembered`, `mastered`.
Mỗi cặp set/card giữ đánh giá mới nhất; đánh giá lặp lại không tăng số thẻ đã học.
`GET /progress/:setId` tính `review` = forgot + vague, `mastered` = remembered + mastered,
`unseen` = total − số thẻ đã đánh giá. Thống kê dùng toàn bộ cards của set, không phụ thuộc phân trang.
Progress mới nhất theo cặp set/card được lưu trong SQLite. Sprint 2 chưa có tài khoản riêng.

Level sai hoặc thiếu trả 400 `INVALID_LEVEL`; set không tồn tại trả 404
`SET_NOT_FOUND`; card không tồn tại hoặc không thuộc set trả 404 `CARD_NOT_FOUND`.
Quy ước đầu vào chưa chi tiết trong Contract: JSON lỗi/không phải object, ID thiếu
hoặc không phải string, trường request ngoài Contract, body vượt 16 KiB đều trả
400 `INVALID_REQUEST`. Kiểm tra body/level trước, sau đó set và card; request lỗi
không thay đổi tiến độ. Endpoint thực hiện theo §5.

## Quiz Sprint 3

`GET /quiz/:setId?count=` trả đúng `{ data: QuizQuestion[], total: number }`.
Mỗi câu chỉ có `cardId`, `prompt` (front), `options` (4 nghĩa Việt khác nhau),
`answerIndex` (0–3). Đáp án dùng `meaning`, fallback về `back` khi không có trường
tùy chọn. Câu hỏi được lấy ngẫu nhiên không lặp; các lựa chọn được xáo trộn bằng
Fisher–Yates với `crypto.randomInt`, đáp án đúng xuất hiện đúng một lần.

Quy ước triển khai cho các chi tiết §6 chưa định nghĩa cụ thể:
- Bỏ qua `count`: lấy tất cả cards của set; truyền `count`: số nguyên dương an toàn.
- `count` lớn hơn số cards được giới hạn về số cards; `total` luôn là tổng trước giới hạn.
- `count` bằng 0, âm, rỗng, không phải số nguyên, lặp lại hoặc vượt số nguyên an toàn
  trả 400 `INVALID_PAGINATION`. Set không tồn tại trả 404 `SET_NOT_FOUND` trước kiểm tra count.
- Set rỗng trả `{ "data": [], "total": 0 }` với count hợp lệ hoặc không truyền count.
- Ưu tiên nghĩa nhiễu trong cùng set; set có ít hơn 4 nghĩa khác nhau lấy bổ sung
  từ cards của các set khác. Dữ liệu toàn hệ thống cần ít nhất 4 nghĩa khác nhau để
  tạo câu hỏi có 4 lựa chọn phân biệt. Nếu dữ liệu không đáp ứng, trả lỗi nội bộ 500
  theo format chuẩn; mỗi set hiện tại có đủ 10 nghĩa khác nhau.

Quiz chỉ đọc: không thay đổi thứ tự cards, nội dung seed hoặc tiến độ học.
Không có endpoint nộp bài/chấm điểm mới; frontend dùng `answerIndex` theo Contract.

## Matching Sprint 4

`GET /matching/:setId?count=` trả đúng `{ data: MatchingPair[], total: number }`.
Mỗi cặp chỉ có `cardId`, `term` (front), `definition` (meaning, fallback back
cho Card cũ). Backend lấy các cards đầu tiên trong set theo thứ tự hiện có;
frontend tự xáo trộn hai cột theo Contract §7.

Không truyền `count` thì mặc định 6; số cặp luôn giới hạn ở số cards thực tế.
Quy ước cho các chi tiết §7 chưa định nghĩa cụ thể: `count` phải là số nguyên
dương an toàn, `total` là tổng cards của set trước giới hạn. Giá trị 0, âm, rỗng,
thập phân, không phải số, lặp lại hoặc vượt số nguyên an toàn trả 400
`INVALID_PAGINATION`. Set không tồn tại trả 404 `SET_NOT_FOUND` trước kiểm tra count.
Set rỗng trả `{ "data": [], "total": 0 }` khi count hợp lệ hoặc không truyền count.
Matching chỉ đọc, không thay đổi cards hay tiến độ; CORS/preflight dùng GET.

## Dùng lại API trong Sprint 5–6

Gõ từ, Nghe–Viết và Điền vào chỗ trống lấy dữ liệu từ `GET /sets/:id/cards`:
`front` là đáp án tiếng Anh, `meaning`/`back` là nghĩa Việt, `example` là câu ví dụ
và `exampleVi` là bản dịch. Tổng hợp dùng lại các API Cards/Quiz/Matching hiện có.
Frontend có thể ghi đánh giá bằng `POST /progress` theo §9. Sprint 6 không bổ sung
endpoint hoặc trường dữ liệu. Việc phát âm do Speech API của trình duyệt xử lý
khi `audioUrl` là null.

## Kiểm thử

Từ thư mục gốc: `./scripts/test-backend.ps1`.
Hoặc tại `livrables/backend`: `npm test`.
Nếu không dùng script PowerShell, từ gốc dự án chạy `npm.cmd --prefix ./livrables/backend test`.
Test dùng HTTP thật trên cổng tự động, không cần server đang chạy.
Suite dùng server riêng, không ghi vào progress của server đang phục vụ giao diện;
mã thoát 0 là thành công. Suite gồm hồi quy API và kiểm tra SQLite/persistence.
Health và danh sách sets không có resource ID để phát sinh 404, nên kiểm tra
404 bằng đường dẫn tương ứng không tồn tại; detail và cards kiểm tra ID không tồn tại.
Suite Sprint 2 kiểm tra hồi quy Card theo fixture Sprint 1, bốn mức đánh giá,
thống kê/re-rating, cách ly giữa các sets, CORS POST và đầu vào lỗi.
Suite Sprint 3 kiểm tra cấu trúc Quiz, đáp án/vị trí xáo trộn, count, lỗi, CORS,
không thay đổi dữ liệu/tiến độ và tương thích cards Sprint 1.
Suite Sprint 4 kiểm tra mặc định 6 cặp, count/total, term/definition khớp card,
set nhỏ/rỗng, cách ly giữa sets, lỗi, CORS và không thay đổi cards/progress.
Suite Sprint 5 kiểm tra dữ liệu cả 3 sets, ID duy nhất, đầy đủ trường Card,
cardCount/total qua phân trang, Quiz, Matching và Progress, cùng cách ly đánh giá giữa sets.

## Xử lý lỗi khi chạy

- `node` không được nhận diện: cài Node.js >=22, mở lại terminal và kiểm tra `node --version`.
- `EADDRINUSE`: cổng đang được dùng. Kiểm tra terminal server đã chạy; nếu đúng server
  dự án thì dùng lại, hoặc dừng bằng `Ctrl+C` ở terminal đó trước khi chạy lại.
- `PORT must be an integer between 0 and 65535`: kiểm tra PORT trong `.env` backend
  và biến môi trường của tiến trình. Giá trị rỗng, âm hoặc thập phân không hợp lệ.
- `NETWORK_ERROR` hoặc không kết nối: kiểm tra health URL, server backend và cổng 8000.
  Nếu frontend đã lưu API URL tùy chỉnh, kiểm tra khóa `vocab_api_base_url` trong
  localStorage. Dev server frontend riêng dùng `http://localhost:8000/api/v1`;
  backend phục vụ frontend cùng origin sẽ dùng `/api/v1`.
- Lỗi CORS: mở giao diện tại `http://localhost:3000`; `127.0.0.1`, cổng khác và
  `file://` là origin khác. Kiểm tra request gửi đến backend có tiền tố `/api/v1`.
- SQLite báo lỗi khi khởi động: kiểm tra file DB, quyền truy cập thư mục `SQLITE_PATH`
  và dung lượng đĩa. Server thoát với lỗi rõ ràng; không xóa hoặc tạo lại DB bị lỗi.

## Kiểm chứng lưu bền vững

Tạo Deck, Group, Card và progress qua UI/API, dừng backend bằng `Ctrl+C`, rồi chạy
lại `./scripts/start-backend.ps1`. Kiểm tra `/my/decks`, `/my/decks/:id/groups`,
`/sets/:id/cards` và `/progress/:setId`; dữ liệu phải còn nguyên. Chạy
`node ./scripts/check-sqlite.mjs` để kiểm tra integrity, schema và số lượng bảng.
