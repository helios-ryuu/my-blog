# Toán Mô Hình Hà Nội — Portal

Portal chính thức của tổ chức **Toán Mô Hình Hà Nội** — nơi đăng bài viết, chia sẻ kiến thức và tổ chức các cuộc thi toán mô hình. Xây dựng trên Next.js 16, React 19 và Supabase.

> **Phiên bản hiện tại: v1.2.2**
>
> Domain vận hành: `https://toanmohinhvietnam.com`

---

## Tech Stack

| Hạng mục | Công nghệ |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Compiler) |
| **UI** | [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [next-themes](https://github.com/pacocoursey/next-themes), Lexend |
| **Backend** | [Supabase](https://supabase.com/) — Postgres + Storage, API tự kiểm quyền |
| **Auth** | Session nội bộ bằng cookie HTTP-only, đăng nhập `username/password` |
| **Supabase SDK** | `@supabase/supabase-js` |
| **Content** | [MDX](https://mdxjs.com/) qua `next-mdx-remote` + [Shiki](https://shiki.style/) + `rehype-pretty-code` |
| **Animation** | [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## Cấu trúc thư mục

```
toanmohinhhanoi-portal/
├── public/                         # Ảnh, favicon, file tĩnh
├── docs/                           # Tài liệu dự án (Charter, Requirements, Schema, ...)
├── supabase/
│   ├── schema.sql                  # DDL: bảng, enum, RLS, triggers, buckets
│   └── migrations/                 # Versioned SQL migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/               # login, logout, me
│   │   │   ├── users/              # [id], me (GET; PATCH chỉ dành cho admin)
│   │   │   ├── posts/              # GET list, GET [slug]
│   │   │   ├── tags/               # GET
│   │   │   ├── contests/           # GET list, GET [slug]
│   │   │   ├── submissions/        # POST, mark-final, download
│   │   │   ├── search/             # search posts, contests and tags
│   │   │   └── admin/              # accounts, posts, tags, uploads, contests, teams
│   │   ├── admin/                  # Dashboard quản trị (role = 'admin')
│   │   │   ├── bucket/             # Quản lý Storage bucket
│   │   │   ├── accounts/           # Quản lý tài khoản
│   │   │   ├── database/           # Xem dữ liệu DB
│   │   │   └── posts/              # Tạo / sửa bài viết (new, [id]/edit)
│   │   ├── auth/                   # Trang đăng nhập username/password
│   │   ├── about/                  # Giới thiệu tổ chức
│   │   ├── profile/                # Hồ sơ cá nhân (FR_USER_01–05)
│   │   ├── contest-management/     # Quản lý cuộc thi, đội thi, thành viên, bài nộp
│   │   ├── contests/               # Public list + [slug] detail (FR_CONTEST_10–13)
│   │   ├── post/                   # Danh sách + [slug] chi tiết (cover image + category badge)
│   │   ├── tag/[slug]/             # Lọc bài viết theo tag (FR_POST_04)
│   │   ├── category/[type]/        # Lọc theo category news/announcement/tutorial/result
│   │   ├── not-found.tsx           # Trang 404
│   │   └── page.tsx                # Trang chủ
│   ├── components/
│   │   ├── features/               # post, admin, ui
│   │   └── layout/                 # Header, MobileDropdown, Footer, AppShell
│   ├── contexts/                   # UserContext, MobileMenuContext
│   ├── lib/
│   │   ├── auth/                   # session cookie helpers
│   │   ├── supabase/               # server.ts, admin.ts
│   │   ├── posts-db.ts             # Query bài viết (supabase-js)
│   │   ├── users-db.ts             # Query user
│   │   ├── tags-db.ts              # Query tag
│   │   ├── contests-db.ts          # Query + validate contest/registration/submission
│   │   ├── storage.ts              # Upload + signed URL
│   │   └── api-helpers.ts          # { success, data, message } + revalidateTag
│   ├── hooks/                      # usePostForm, useResizablePanel, usePostFormValidation
│   ├── config/                     # navigation.ts (menu items)
│   ├── types/                      # user, database, post, contest, admin
│   └── proxy.ts                    # Next.js 16 proxy (cũ: middleware)
├── package.json
└── README.md
```

---

## Setup

### Yêu cầu
- **fnm** để quản lý Node.js
- **Node.js** v24+ qua `fnm`
- **corepack** để bật `pnpm`
- **Supabase project** (free tier OK — [supabase.com](https://supabase.com))

### 1. Cài đặt dependency

```bash
git clone https://github.com/helios-ryuu/toanmohinhhanoi-portal.git
cd toanmohinhhanoi-portal
fnm install 24
fnm use 24
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install
```

### 2. Biến môi trường

Tạo file `.env.local` ở thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
SESSION_SECRET=<long-random-string>
NEXT_PUBLIC_SITE_URL=https://toanmohinhvietnam.com
```

### 3. Áp dụng schema Supabase

Mở Supabase Dashboard → **SQL Editor** → paste nội dung `supabase/schema.sql` → **Run**. Script tạo bảng nghiệp vụ, enum, trigger `updated_at`, bucket `post-images` / `submissions`, và schema tài khoản nội bộ.

### 4. Tạo admin đầu tiên

Vì tài khoản do quản trị viên cấp thủ công, hãy seed admin đầu tiên trực tiếp bằng SQL:

```sql
insert into public.users (username, password, full_name, email, role)
values ('admin_01', 'admin1234', 'Portal Admin', 'admin@example.com', 'admin');
```

Sau khi đăng nhập, đổi mật khẩu hoặc tạo admin khác trong `/admin/accounts`.

### 5. Chạy dev server

```bash
pnpm dev
```

Mở [http://localhost:3456](http://localhost:3456).

---

## Scripts

| Lệnh | Mô tả |
| :--- | :--- |
| `pnpm dev` | Dev server tại port 3456 (Turbopack) |
| `pnpm build` | Build production |
| `pnpm start` | Chạy bản production |
| `pnpm lint` | ESLint |

---

## Kiến trúc

```
Pages/Components (App Router, React 19)
    ↓ fetch
API Routes (/api/*)  — { success, data?, message? }
    ↓ supabase-js
DB helpers (src/lib/*-db.ts)
    ↓
Supabase (Postgres + Storage)
```

## v1.2.2 Notes

- Search dropdown điều hướng ngay từ `pointerdown`, nên click/tap/nhấn giữ vào kết quả không còn bị blur đóng dropdown trước khi chuyển trang.
- Q&A user/admin có thêm nhóm Operational hướng dẫn đăng nhập, xem cuộc thi, nộp/thay bài, tạo tài khoản, tạo kỳ thi, thêm đội và tải bài nộp.
- Countdown public luôn hiển thị giây, kể cả khi còn nhiều ngày: `x ngày y giờ z phút t giây`.
- Footer và các vùng copy của contest được đồng bộ màu chữ body với nội dung post.
- Kế thừa v1.2.1: Q&A Operational, search bài viết/kỳ thi/tag, FAQ i18n có cấu trúc, ảnh Supabase không qua optimizer và cleanup `THREE.Timer`.
- `password` đang được lưu plaintext theo yêu cầu vận hành nội bộ của phiên bản này.
