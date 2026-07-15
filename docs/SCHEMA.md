# Schema v1.1.0

Portal dùng Supabase Postgres + Storage. Auth người dùng portal là nội bộ, dựa trên bảng `public.users` và cookie session HTTP-only của ứng dụng.

## Bảng chính

### `public.users`

Tài khoản do admin cấp thủ công.

| Field | Ghi chú |
| :--- | :--- |
| `id uuid` | Primary key, default `gen_random_uuid()` |
| `username text` | Định danh đăng nhập, unique, chỉ chữ/số/`_`, tối thiểu 6 ký tự |
| `password text` | Plaintext theo yêu cầu vận hành nội bộ |
| `full_name text` | Họ và tên hiển thị |
| `email text` | Email liên hệ |
| `phone text` | Số điện thoại liên hệ |
| `school text` | Trường/tổ chức, không dùng cho admin |
| `role user_role` | `user` hoặc `admin` |

### `public.contest`

Cuộc thi công khai hoặc bản nháp do admin quản lý.

| Field | Ghi chú |
| :--- | :--- |
| `participation_type` | `individual`, `team`, hoặc `both` |
| `min_team_size` | Cá nhân = 1; đội/both mặc định tối thiểu 2 |
| `max_team_size` | Cá nhân = 1; đội/both phải lớn hơn hoặc bằng `min_team_size` |
| `status` | `draft`, `active`, `closed`, `cancelled`; UI dịch `active` là `Đang diễn ra` |

### `public.contest_stage`

Lịch các vòng thi. Public UI dùng stage để hiển thị timeline và mở/đóng nộp bài qua `allow_submission`.

| Field | Ghi chú |
| :--- | :--- |
| `allow_registration` | Bật/tắt đăng ký theo vòng nếu dùng flow đăng ký |
| `allow_submission` | Bật/tắt form nộp bài theo vòng |
| `submission_type` | Gợi ý loại bài nộp |
| `prompt_text` | Đề bài dạng text; URL được UI linkify trong My Contests |

### `public.contest_registration`

Một đội/nhóm dự thi do admin tạo.

| Field | Ghi chú |
| :--- | :--- |
| `contest_id` | Cuộc thi |
| `team_code` | Mã đội, unique trong từng contest |
| `team_name` | Tên đội |
| `level` | Bảng/level thi |
| `status` | Schema vẫn giữ enum để tương thích dữ liệu, flow v1.1.0 luôn tạo đội dùng ngay |

### `public.registration_member`

Liên kết user với đội thi, có `role = leader | member`.

### `public.submission`

Bài nộp của một đội. Thành viên của đội được nộp và thay thế bài trong thời gian có stage đang bật `allow_submission`.

## Storage

- `post-images`: ảnh bài viết, public read.
- `submissions`: file bài nộp, truy cập qua API và signed URL.
- Bài nộp mới dùng path `contestSlug/TEAM_CODE/file`.
- Bucket manager hỗ trợ thao tác folder bằng object `.keep` và thao tác đệ quy khi đổi tên/xoá folder.
