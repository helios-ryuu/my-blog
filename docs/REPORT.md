# Report v1.2.2

## Tổng quan

v1.2.2 là patch release sửa dứt điểm lỗi header search không chuyển trang khi nhấn vào kết quả:

- Điều tra cho thấy item search dùng `Link` điều hướng ở sự kiện `click`, trong khi input `blur` có thể đóng dropdown trước khi `click` chạy, đặc biệt khi click/tap và giữ.
- Search result nay điều hướng bằng `onPointerDown`, chạy trước blur/click và dùng được cho mouse, touch, pen.
- Giữ nguyên các cải thiện v1.2.1: Q&A Operational, countdown có giây, và màu copy contest/footer đồng bộ với body post.

## Thay đổi chính

- Gỡ `Link` khỏi item trong `SearchBar`.
- Dùng `button` với `onPointerDown`, `preventDefault()` và `router.push(path)` để điều hướng ngay khi nhấn vào kết quả.
- Bỏ qua non-primary mouse button để tránh điều hướng khi click phải hoặc click phụ.
- Cập nhật docs/README/package version lên `1.2.2`.

## Rủi ro đã biết

- Search header vẫn lọc client-side trên dữ liệu cache 60 giây.
- Kết quả search dùng điều hướng client-side qua `router.push`, không mở tab mới bằng middle-click như anchor truyền thống.

## Kiểm thử cần chạy

- `./node_modules/.bin/tsc --noEmit`
- `./node_modules/.bin/eslint`
- `./node_modules/.bin/next build --webpack`
- Trên localhost, tìm kiếm rồi click nhanh, tap, và nhấn giữ vào kết quả bài viết/kỳ thi/tag; kết quả phải chuyển trang ngay.
- Kiểm tra keyboard Enter vẫn điều hướng khi chọn kết quả bằng ArrowUp/ArrowDown.
