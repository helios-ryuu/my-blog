# Release Report v2.0.0

## Kết quả

Helios Blog v2.0.0 là một blog cá nhân tập trung, kèm CMS tối giản và schema dữ liệu mới.

## Thay đổi chính

- Nhận diện, metadata, homepage, navigation, search, footer, About và Q&A được viết lại cho Helios Blog.
- Auth được thu gọn thành một admin cấu hình bằng biến môi trường.
- Database chỉ còn nội dung blog, danh mục, series, tag và site settings.
- Database initialization được hợp nhất hoàn toàn vào `supabase/schema.sql`.
- Media library dùng Cloudflare R2 thay cho Supabase Storage.
- Bucket R2 private được hỗ trợ qua media proxy ổn định và có thể chuyển sang custom domain.
- Tài liệu `INSTRUCTION.md` mô tả đầy đủ cú pháp MDX được hỗ trợ.
- Admin có color selector để cập nhật accent toàn site.
- Field sửa/xoá post và tag có tìm nhanh tại chỗ, cùng selector nâng cao có filter và phân trang.
- Metadata bài viết có category động, ba mức độ và thời gian đọc thủ công; card, list, detail, preview, selector và database viewer dùng chung contract này.
- Series độc lập với category, có schema/API/CMS hoàn chỉnh, order unique, xoá có bảo vệ và điều hướng public chỉ gồm bài published.
- Badge SERIES/order hoặc STANDALONE dùng bố cục full-width ở đáy card và QR như giao diện tham khảo; list và preview dùng cùng component.
- Media manager báo lỗi tên folder rỗng, có loading state và làm mới bộ lọc/danh sách sau khi tạo folder R2.
- CMS quản lý category bằng tên, slug, icon tuỳ chọn, mục đích và ví dụ; schema seed 12 danh mục cá nhân và bảo vệ tham chiếu bằng foreign key.
- Trang Giới thiệu được hoàn thiện với định hướng nội dung, danh mục động, hướng dẫn level/reading time và các kênh liên hệ.
- API admin có lớp validation thống nhất; schema có constraint tương ứng cho nội dung cốt lõi.
- Hydration của trạng thái loading trong CMS được chuẩn hoá thành boolean ổn định giữa server/client.
- Toàn bộ trang public, CMS và trạng thái rỗng/lỗi chính được đồng bộ tiếng Việt/Anh.
- Dependency và package manager được nâng lên bản mới nhất tương thích.
- Dependency không dùng, route dư thừa, helper, export và component chết đã được dọn; Knip không còn phát hiện mã không được sử dụng.
- README, schema, quy trình và yêu cầu được đồng bộ với code v2.

## Kiểm tra

- `pnpm typecheck`.
- `pnpm lint`.
- Peer dependency và security audit.
- Next.js production build.
- Knip, `git diff --check` và quét dấu vết legacy hoặc placeholder triển khai.
- Smoke test API, route public/admin và giao diện desktop/mobile ở light/dark theme.

## Kết quả xác nhận

- Production build hoàn tất; manifest chỉ còn page/API blog, auth và CMS, không còn route legacy.
- Smoke test API đạt yêu cầu cho public read/type filter, admin auth, validation, category/series CRUD, duplicate order, protected delete, database viewer, R2 folder và tải Markdown.
- Các route public trả đúng status; `/admin/database` giữ nguyên URL và tải đủ sáu bảng dữ liệu.
- Bài `mdx-component-showcase`, tag `mdx` và quan hệ tương ứng đều có đúng một bản ghi.
- Database vận hành seed 12 category cá nhân, ba level và constraint thời gian đọc 1–120 phút; bài showcase dùng `articles`, `intermediate`, `12` phút.
- Migration series live giữ nguyên bài hiện có, tạo bảng/cột/ràng buộc thành công; access token và dữ liệu smoke test đã được xoá sau xác minh.
- Toàn bộ nhóm cú pháp trong bài showcase render thành công: alert, code, table, task list, media, JSX và mục lục.
- Desktop/mobile, light/dark, banner cooldown, social link, quick search, ba cột metadata và selector nâng cao không có hydration warning, page error hoặc horizontal overflow.
- Audit dependency production không phát hiện lỗ hổng đã biết; peer dependency không có xung đột.

## Ghi chú dependency

TypeScript 7 hiện làm `@typescript-eslint` của Next.js lỗi khi khởi động; ESLint 10 thay API context mà `eslint-plugin-react` hiện tại chưa hỗ trợ. Vì vậy release dùng TypeScript 6 và ESLint 9 ở bản patch mới nhất. Các package còn lại dùng phiên bản mới nhất được registry và supply-chain policy chấp nhận.
