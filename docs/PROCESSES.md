# Processes v1.1.0

## Đăng nhập

1. User mở `/auth`.
2. User nhập `username/password` do admin cấp.
3. API `/api/auth/login` validate username/password rồi kiểm tra `public.users`.
4. Server set cookie session HTTP-only.
5. `proxy.ts` và server helpers kiểm quyền dựa trên session nội bộ.

## Cấp tài khoản

1. Admin mở `/admin/accounts`.
2. Admin tạo user với username, password, họ tên, email, phone, school, role.
3. Username chỉ gồm chữ, số, `_`, tối thiểu 6 ký tự; password tối thiểu 8 ký tự và không có khoảng trắng.
4. Nếu role là admin, form ẩn school và payload xoá school.
5. User đăng nhập bằng thông tin được cấp. User thường chỉ xem hồ sơ ở chế độ read-only.

## Tạo cuộc thi và vòng thi

1. Admin mở `/contest-management`.
2. Admin tạo cuộc thi với hình thức tham gia, `min_team_size`, `max_team_size`, timeline và status.
3. Với cá nhân, min/max luôn là `1-1`; với đội hoặc both, mặc định `2-3` và `max >= min`.
4. Admin thêm các stage, bật `allow_submission` cho vòng được nộp bài và nhập `prompt_text` nếu cần hiển thị đề bài.

## Tạo đội thi

1. Admin mở `/contest-management`.
2. Admin chọn cuộc thi và mở panel đội thi.
3. Admin tạo đội với `TEAM_CODE`, `TEAM_NAME`, `LEVEL`, leader và members.
4. Hệ thống kiểm tra số thành viên theo min/max của cuộc thi.
5. Đội có thể nộp bài khi stage nộp bài của cuộc thi mở.

## Nộp và thay thế bài

1. User đăng nhập và mở `/profile/contests`.
2. Hệ thống liệt kê các đội mà user là thành viên, có search/filter/sort.
3. Nếu stage hiện tại bật `allow_submission`, UI hiển thị vòng hiện tại, countdown có giây, đề bài và form upload.
4. API `/api/submissions` kiểm quyền thành viên và stage rồi upload file vào `submissions/contestSlug/TEAM_CODE/`.
5. Nếu đội đã có bài nộp, hệ thống xoá bài cũ và nhận bài mới miễn vòng nộp bài còn mở.

## Admin xem bài nộp

1. Admin mở panel đội thi trong `/contest-management`.
2. Admin mở từng đội để xem danh sách submission.
3. Download dùng signed URL ngắn hạn qua API admin.

## Q&A

1. `/faq` chỉ hiển thị hướng dẫn chung cho thí sinh.
2. `/faq/admin` chỉ hiện với admin và chứa quy trình quản trị.

## Quản lý bucket

1. Admin mở `/admin/bucket`.
2. Admin chọn bucket, duyệt breadcrumb/tree thư mục.
3. Admin có thể tạo, đổi tên, xoá folder/file và tải file lên thư mục hiện tại.
