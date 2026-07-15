# Requirements v1.1.0

## Auth và tài khoản

- Admin cấp tài khoản thủ công trong `/admin/accounts`.
- Người dùng đăng nhập bằng `username/password`.
- `username`, `password`, `full_name` là bắt buộc khi tạo tài khoản.
- `username` chỉ gồm chữ, số, `_`, tối thiểu 6 ký tự.
- `password` tối thiểu 8 ký tự và không có khoảng trắng.
- Khi tài khoản có vai trò `admin`, thông tin trường/tổ chức không hiển thị trong form quản trị.
- Màn quản lý tài khoản có tìm kiếm, filter, sort, highlight row đang sửa và pagination 50 dòng/trang.
- User thường chỉ xem hồ sơ cá nhân ở chế độ read-only; admin vẫn tự cập nhật được.

## Contest và đội thi

- Public contest page hiển thị thông tin cuộc thi, mô tả, timeline và hướng dẫn nộp bài.
- Admin quản lý cuộc thi và đội thi trong `/contest-management`.
- Cuộc thi cá nhân có min/max thành viên = `1-1`.
- Cuộc thi đội/both mặc định min/max thành viên = `2-3`, và `max >= min`.
- Stage có thể chứa `prompt_text` để hiển thị đề bài trong My Contests.
- Đội thi được tạo trực tiếp bằng `TEAM_CODE`, `TEAM_NAME`, `LEVEL`, leader và members; không có bước duyệt/từ chối.
- Thành viên đội xem cuộc thi của mình trong `/profile/contests`.
- My Contests có search/filter/sort, vòng hiện tại, countdown có giây và đề bài link được.

## Submission

- Web phục vụ nộp bài qua stage có `allow_submission=true`.
- Thành viên của đội được admin gán có thể nộp bài khi stage nộp bài đang mở.
- Bài đã nộp luôn có thể thay thế trong thời gian stage nộp bài còn mở.
- Bài nộp mới lưu trong Storage theo cấu trúc `contestSlug/TEAM_CODE/file`.
- Admin xem và tải bài nộp trong panel quản lý đội.

## UI

- Accent chính là `#1F51FF`; toàn site dùng font Lexend.
- Header có navigation panel dùng chung và không hiển thị GitHub.
- Header có Facebook và Instagram chính thức.
- Footer hiển thị hotline, email, Facebook, Instagram và copyright chính thức.
- Homepage có `Bài viết nổi bật` và danh sách compact `Các cuộc thi`.
- Bucket manager hiển thị rõ cây thư mục/file, hỗ trợ tạo, đổi tên và xoá folder/file.
- Q&A chung dành cho thí sinh; Q&A Admin tách riêng và chỉ hiện với admin.
