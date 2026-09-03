# Processes v2.0

## Khởi tạo

1. Tạo Supabase project mới.
2. Chạy `supabase/schema.sql` trong SQL Editor.
3. Tạo Cloudflare R2 API token có quyền Object Read & Write cho bucket `my-blog`.
4. Tạo `.env` từ `.env.example`.
5. Cấu hình Supabase keys, R2 credentials, admin credential và session secret.
6. Chạy `pnpm dev`.

## Đăng nhập admin

1. Admin mở `/auth`.
2. Server xác nhận đúng một nguồn mật khẩu được cấu hình: plaintext hoặc SHA-256 hash 64 ký tự hex.
3. API so sánh username và SHA-256 của mật khẩu theo thời gian cố định.
4. Server ký session bằng HMAC-SHA256.
5. Cookie HTTP-only được dùng để bảo vệ trang và API quản trị.

Production nên chỉ dùng `ADMIN_PASSWORD_HASH`. Sau khi đặt lại env trên Vercel, xóa `ADMIN_PASSWORD` và redeploy để deployment mới nhận credential.

## Viết và xuất bản

1. Admin mở `/admin` và tạo bài mới.
2. Nhập title, slug, description, category, level, thời gian đọc, kiểu bài, image, tag và nội dung MDX.
3. Kiểm tra preview trước khi lưu.
4. Lưu nháp để tiếp tục chỉnh sửa hoặc bật xuất bản ngay.
5. Bài được revalidate trên homepage, danh sách và trang chi tiết.

Category chọn từ danh sách do CMS quản lý. Level chọn cơ bản, trung cấp hoặc nâng cao. Thời gian đọc là số phút do tác giả ước tính thủ công trong khoảng 1–120.

Với bài độc lập, giữ chế độ Standalone. Với bài theo chuỗi, chọn Series, tìm series theo ID/tên/slug rồi dùng order được đề xuất hoặc nhập order khác chưa được dùng. Nút `+` trong field mở modal tạo series và tự chọn series mới. Chuyển lại Standalone sẽ xoá cả series và order khi lưu.

Khi sửa hoặc xoá, nhập trực tiếp vào field để tìm nhanh. Nút bộ lọc trong field mở selector nâng cao: post có thể lọc theo từ khoá, category, level, type, trạng thái và tag; post/tag/series đều có phân trang để không phụ thuộc một dropdown dài.

## Quản lý series

1. Tạo series tại section Tạo mới hoặc từ field Series trong form bài viết.
2. Nhập name, slug và description tuỳ chọn; slug tự sinh nhưng có thể chỉnh.
3. Sửa hoặc xoá qua quick search hay advanced selector theo ID, name và slug.
4. Trước khi xoá, gỡ toàn bộ bài khỏi series bằng cách chuyển chúng sang Standalone hoặc sang series khác.
5. API trả `409` nếu order bị trùng hoặc series vẫn còn bài.

## Quản lý danh mục

1. Admin mở section Danh mục tại `/admin`.
2. Tạo hoặc sửa tên, slug, mục đích, ví dụ và emoji tuỳ chọn.
3. Khi đổi slug, foreign key tự cập nhật category của các bài đang dùng.
4. Chỉ xoá danh mục có số bài bằng 0; UI và API đều chặn xoá khi còn tham chiếu.

## Quản lý ảnh

1. Admin mở `/admin/bucket`.
2. Nhập tên và nhấn Tạo thư mục; danh sách và bộ lọc được làm mới để folder mới xuất hiện ngay, sau đó mở folder và upload ảnh.
3. Server ghi object qua S3 API của Cloudflare R2.
4. Chọn ảnh trực tiếp trong form bài viết hoặc sao chép URL `/api/media/*`.
5. Custom domain hiện tại là `https://bucket-space.helios.id.vn`, được cấu hình qua `R2_PUBLIC_URL` để URL mới dùng Cloudflare trực tiếp.
6. Khi đổi tên hoặc xoá file, kiểm tra các bài đang tham chiếu URL cũ.

## Chỉnh màu accent

1. Admin mở `/admin`.
2. Chọn màu hoặc nhập mã hex sáu chữ số.
3. API lưu `accent_color` vào `site_settings`.
4. Cache settings được revalidate.
5. Context phía client cập nhật CSS token ngay sau khi lưu.

## Kiểm tra trước release

```bash
pnpm check
```

Sau đó kiểm tra homepage, search, bài showcase MDX, đăng nhập, series CRUD/order/navigation, CMS, selector nâng cao, database viewer, tạo folder/upload R2, banner cooldown, theme và accent trên desktop/mobile.

## Quy trình Gitflow (Branching Strategy)

Dự án áp dụng mô hình Gitflow tiêu chuẩn với 5 loại nhánh:

```text
main ──────────────────────────────● (v2.2.1) ───────────────● (v2.3.0) ───
      \                           /     \                   /
hotfix \─────────────────────────/       \                 /
        \                                 \               /
release  \                                 \───●─────────/
          \                                   / \       /
develop ───●─────────────────────────────────●───\─────●──────────────────
            \                               /     \   /
feature      \───●─────────────────────────/       \─/
```

### 1. `main` (Production)
- Chứa mã nguồn ổn định nhất đang chạy thực tế trên production.
- Không commit trực tiếp vào `main`.
- Chỉ nhận merge từ nhánh `release/*` (khi ra mắt bản mới) hoặc `hotfix/*` (khi sửa lỗi khẩn cấp).
- Mỗi lần merge vào `main` luôn tạo một Git Tag tương ứng (`vX.Y.Z`).

### 2. `develop` (Integration)
- Nhánh cơ sở tích hợp cho toàn bộ quá trình phát triển.
- Chứa các tính năng đã hoàn thành và sẵn sàng cho lần phát hành tiếp theo.
- Tách từ `main` ban đầu; nhận merge từ các nhánh `feature/*`, `release/*` và `hotfix/*`.

### 3. `feature/*` (Tính năng mới)
- **Tách từ**: `develop`.
- **Merge vào**: `develop`.
- **Đặt tên**: `feature/<tên-tính-năng>` (ví dụ: `feature/dark-mode-toggle`, `feature/comment-system`).
- **Quy trình**:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/awesome-feature
  # Code và commit...
  git checkout develop
  git merge --no-ff feature/awesome-feature
  git branch -d feature/awesome-feature
  ```

### 4. `release/*` (Chuẩn bị phát hành)
- **Tách từ**: `develop` khi đã đủ tính năng cho một phiên bản mới.
- **Merge vào**: Cả `main` (để release) VÀ `develop` (để đồng bộ các chỉnh sửa cuối cùng).
- **Đặt tên**: `release/vX.Y.Z` (ví dụ: `release/v2.3.0`).
- **Nhiệm vụ**: Chạy `pnpm check`, cập nhật số phiên bản trong `package.json`, hoàn thiện `README.md`, changelog và sửa các lỗi phát sinh nhỏ.
- **Quy trình hoàn tất**:
  ```bash
  # Merge vào main & gắn tag
  git checkout main
  git merge --no-ff release/v2.3.0
  git tag -a v2.3.0 -m "Release version v2.3.0"

  # Merge ngược lại vào develop để đồng bộ
  git checkout develop
  git merge --no-ff release/v2.3.0

  # Xóa nhánh release
  git branch -d release/v2.3.0
  ```

### 5. `hotfix/*` (Sửa lỗi khẩn cấp trên Production)
- **Tách từ**: `main` khi phát hiện lỗi nghiêm trọng trên production cần xử lý ngay lập tức mà không chờ chu kỳ release.
- **Merge vào**: Cả `main` (gắn tag patch, ví dụ: `v2.2.2`) VÀ `develop`.
- **Đặt tên**: `hotfix/vX.Y.Z` hoặc `hotfix/<tên-lỗi>`.
- **Quy trình**:
  ```bash
  git checkout main
  git checkout -b hotfix/v2.2.2
  # Sửa lỗi, kiểm tra pnpm check...
  git checkout main
  git merge --no-ff hotfix/v2.2.2
  git tag -a v2.2.2 -m "Hotfix version v2.2.2"

  git checkout develop
  git merge --no-ff hotfix/v2.2.2

  git branch -d hotfix/v2.2.2
  ```
