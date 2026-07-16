# Project Charter v2.0

## Mục tiêu

Helios Blog là không gian xuất bản cá nhân có trải nghiệm đọc rõ ràng và một CMS đủ gọn để vận hành lâu dài.

## Phạm vi

- Bài viết MDX có ảnh bìa, tag, danh mục, series có thứ tự, mức độ, thời gian đọc và trạng thái nháp/xuất bản.
- Trang chủ, danh sách, trang chi tiết, tag, danh mục và tìm kiếm.
- Giao diện responsive, sáng/tối và song ngữ.
- Công cụ chia sẻ liên kết, QR và ảnh.
- CMS quản lý nội dung và thư viện ảnh trên Cloudflare R2.
- CMS quản lý vòng đời series; public UI hiển thị Type và điều hướng bài trước/sau mà không cần route `/series` riêng.
- Màu accent toàn cục do admin cấu hình.
- Một admin duy nhất qua biến môi trường.

## Ngoài phạm vi

- Đăng ký tài khoản công khai.
- Nhiều vai trò hoặc nhiều tài khoản quản trị.
- Bình luận, newsletter và thanh toán.
- Trình soạn thảo WYSIWYG.

## Nguyên tắc

- Giữ kiến trúc đơn giản và ưu tiên helper sẵn có.
- Component mới dùng CSS token và pattern giao diện hiện tại.
- Dữ liệu bí mật chỉ tồn tại ở server.
- Mọi thay đổi nội dung đi qua API có kiểm quyền.
- Schema và tài liệu phải phản ánh đúng code đang chạy.
