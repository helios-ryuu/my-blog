# Project Charter v1.1.0

## Mục tiêu

Toán Mô Hình Hà Nội Portal là cổng thông tin cho bài viết chuyên môn, thông tin cuộc thi và nộp bài theo đội.

Domain vận hành: `toanmohinhvietnam.com`. Domain này không thay đổi nội dung hoặc branding hiển thị của web.

## Phạm vi v1.1.0

- Bài viết/news chuyên môn.
- Contest public listing/detail và timeline.
- Account management do admin vận hành với validation username/password.
- Team management do admin vận hành với min/max thành viên.
- Submission cho các vòng thi được mở, cho phép thay thế bài trong thời gian còn hạn.
- My Contests có search/filter/sort, vòng hiện tại, countdown và đề bài.
- Q&A chung cho thí sinh và Q&A Admin tách riêng.
- Bucket management cho ảnh bài viết và bài nộp.

## Ngoài phạm vi

- User tự đăng ký tài khoản.
- User tự đăng ký tham gia cuộc thi.
- User thường tự sửa hồ sơ cá nhân.
- Email automation.
- Payment hoặc scoring tự động.

## Vai trò

- Admin: quản lý tài khoản, bài viết, cuộc thi, đội thi, bài nộp, bucket và Q&A Admin.
- User/thí sinh: đăng nhập, xem hồ sơ read-only, xem đội đã được cấp, xem đề bài và nộp/thay thế bài khi vòng nộp bài đang mở.
