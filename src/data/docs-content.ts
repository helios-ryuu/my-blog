export interface DocItem {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    updatedAt: string;
}

export interface DocsConfig {
    items: DocItem[];
}

const DEFAULT_MARKDOWN_SYNTAX_MDX = `## Quy ước chung

Hệ thống bài viết và tài liệu trên **Helios Space** sử dụng trình biên dịch **MDX**, mở rộng chuẩn GitHub Flavored Markdown (\`remark-gfm\`), tô màu cú pháp mã nguồn bằng **Shiki** (\`rehype-pretty-code\`) và hiển thị qua bộ thành phần tuỳ chỉnh tại \`mdx-components.tsx\`.

- Khi tạo bài trực tiếp trên trình soạn thảo CMS (\`/admin/posts/new\`), các thông tin như **Tiêu đề**, **Slug**, **Mô tả**, **Danh mục**, **Mức độ**, **Thời gian đọc**, **Ảnh bìa** và **Tags** được nhập ở các trường riêng biệt.
- Khi sử dụng tính năng **Upload bài viết (.mdx)** tại trang Admin, bạn có thể khai báo khối **YAML Frontmatter** ở đầu file \`.mdx\` để hệ thống tự động điền toàn bộ thông tin và lưu thành **Bản nháp (Draft)**.
- Chỉ các tiêu đề cấp 2 (\`##\`) và cấp 3 (\`###\`) được tự động tổng hợp vào thanh **Mục lục (Table of Contents)**.
- Không sử dụng câu lệnh \`import\` hoặc \`export\` bên trong nội dung MDX.

## Cấu trúc YAML Frontmatter (Upload .mdx)

Khi chuẩn bị sẵn file \`.mdx\` ở máy cá nhân để tải lên qua nút **Upload Post** tại Admin, hãy đặt khối cấu hình sau ở đầu file (nếu bỏ trống trường nào, hệ thống sẽ tự động suy luận giá trị mặc định hợp lệ):

\`\`\`yaml
---
title: "Hướng dẫn triển khai Kubernetes Homelab"
slug: "huong-dan-trien-khai-kubernetes-homelab"
description: "Cài đặt và vận hành cụm Kubernetes tại nhà từ phần cứng tới GitOps."
category: "articles"
level: "intermediate"
reading_time: 10
image_url: "/api/media/posts/k8s-cover.webp"
tags: ["kubernetes", "devops", "linux"]
---
\`\`\`

> [!TIP]
> Bạn có thể nhấn nút **Tải Template (.mdx)** ngay tại cột trái của trang Tài liệu này hoặc trong hộp thoại **Upload Post** tại trang Quản trị để lấy file mẫu chuẩn.

## Heading và Mục lục tự động

Tiêu đề chính của bài viết đã được giao diện hiển thị ở phần mở đầu, vì vậy nội dung bài viết nên bắt đầu từ \`## Heading cấp 2\`:

\`\`\`md
## Phần 1: Kiến trúc tổng quan

### 1.1. Thành phần Control Plane
\`\`\`

ID của mỗi đề mục được tạo tự động bằng cách chuyển về chữ thường và nối bằng dấu gạch ngang \`-\`. Tránh đặt hai tiêu đề có nội dung trùng hệt nhau trong cùng một bài viết.

## Định dạng văn bản & Đoạn văn

Sử dụng một dòng trống để tách giữa các đoạn văn (paragraph), danh sách, bảng và khối lệnh:

\`\`\`md
**Chữ in đậm** để nhấn mạnh ý chính.

*Chữ in nghiêng* hoặc _in nghiêng_ cho thuật ngữ.

***Kết hợp in đậm và nghiêng*** hoặc ~~gạch ngang nội dung cũ~~.

Chèn \`inline code\` cho tên biến, câu lệnh ngắn hoặc đường dẫn tệp.
\`\`\`

Kết quả hiển thị trực tiếp:
- **Chữ in đậm** để nhấn mạnh ý chính.
- *Chữ in nghiêng* cho thuật ngữ.
- ~~Gạch ngang nội dung cũ~~ và ký hiệu \`inline code\`.

## Danh sách (Lists)

Danh sách không thứ tự trên Helios Space được chuẩn hoá hiển thị bằng dấu gạch đầu dòng (\`- \`) rõ ràng:

\`\`\`md
- Mục thứ nhất
- Mục thứ hai
  - Mục con lồng bên trong
\`\`\`

Danh sách có thứ tự:

\`\`\`md
1. Khởi tạo môi trường
2. Kiểm tra cấu hình
3. Triển khai lên máy chủ
\`\`\`

## Trích dẫn & Hộp thông báo (Alerts / Callouts)

Trích dẫn thông thường:

\`\`\`md
> Mọi hệ thống phức tạp hoạt động hiệu quả đều bắt nguồn từ một hệ thống đơn giản hoạt động tốt.
\`\`\`

> Mọi hệ thống phức tạp hoạt động hiệu quả đều bắt nguồn từ một hệ thống đơn giản hoạt động tốt.

Hệ thống hỗ trợ 5 cấp độ **GitHub-style Alert** khi đặt marker \`[!TYPE]\` ở dòng đầu tiên của blockquote:

\`\`\`md
> [!NOTE]
> Thông tin bổ sung hoặc bối cảnh kỹ thuật cần lưu ý.

> [!TIP]
> Mẹo thực hành giúp tối ưu hóa hiệu suất hoặc thao tác nhanh hơn.

> [!IMPORTANT]
> Yêu cầu bắt buộc hoặc bước quan trọng không được bỏ qua.

> [!WARNING]
> Cảnh báo các vấn đề tương thích hoặc rủi ro tiềm ẩn.

> [!CAUTION]
> Hành động có nguy cơ gây mất dữ liệu hoặc khó khôi phục.
\`\`\`

Kết quả hiển thị của 5 loại hộp thông báo:

> [!NOTE]
> Thông tin bổ sung hoặc bối cảnh kỹ thuật cần lưu ý.

> [!TIP]
> Mẹo thực hành giúp tối ưu hóa hiệu suất hoặc thao tác nhanh hơn.

> [!IMPORTANT]
> Yêu cầu bắt buộc hoặc bước quan trọng không được bỏ qua.

> [!WARNING]
> Cảnh báo các vấn đề tương thích hoặc rủi ro tiềm ẩn.

> [!CAUTION]
> Hành động có nguy cơ gây mất dữ liệu hoặc khó khôi phục.

## Khối mã nguồn (Code Blocks)

Sử dụng cặp ba dấu backtick (\`\`\`) kèm định danh ngôn ngữ của Shiki (\`ts\`, \`tsx\`, \`js\`, \`bash\`, \`sql\`, \`yaml\`, \`json\`, \`dockerfile\`, \`python\`, \`go\`...) để kích hoạt tô màu cú pháp và nút sao chép nhanh:

\`\`\`\`md
\`\`\`ts
export function calculateReadingTime(content: string): number {
    const words = content.trim().split(/\\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}
\`\`\`
\`\`\`\`

Kết quả hiển thị:

\`\`\`ts
export function calculateReadingTime(content: string): number {
    const words = content.trim().split(/\\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}
\`\`\`

## Bảng dữ liệu (Tables)

Hỗ trợ bảng theo chuẩn GitHub Flavored Markdown, tự động cuộn ngang mượt mà trên màn hình di động:

\`\`\`md
| Ký hiệu | Căn lề | Công dụng |
| :--- | :---: | ---: |
| \`:---\` | Trái | Cột văn bản mô tả |
| \`:---:\` | Giữa | Cột trạng thái, phiên bản |
| \`---:\` | Phải | Cột số liệu, dung lượng |
\`\`\`

| Ký hiệu | Căn lề | Công dụng |
| :--- | :---: | ---: |
| \`:---\` | Trái | Cột văn bản mô tả |
| \`:---:\` | Giữa | Cột trạng thái, phiên bản |
| \`---:\` | Phải | Cột số liệu, dung lượng |

## Liên kết & Hình ảnh (Cloudflare R2)

Ưu tiên đường dẫn tương đối (ví dụ \`/post/ten-bai-viet\`) cho liên kết nội bộ và URL đầy đủ có \`https://\` cho liên kết bên ngoài:

\`\`\`md
[Khám phá danh sách bài viết](/post)
\`\`\`

Với hình ảnh, tải ảnh lên tại **Thư viện ảnh (\`/admin/bucket\`)** hoặc ngay trong khung soạn thảo bài viết, sau đó chèn bằng cú pháp Markdown chuẩn:

\`\`\`md
![Mô tả hình ảnh](/api/media/posts/example.webp)
\`\`\`

## Thành phần MDX mở rộng (YouTube, Video & HTML)

Bạn có thể nhúng trực tiếp video YouTube hoặc tệp video HTML5 trong nội dung bài viết và tài liệu:

\`\`\`mdx
<YouTube id="dQw4w9WgXcQ" title="Video hướng dẫn" />

<Video src="/api/media/posts/demo.mp4" title="Video minh họa trực tiếp" />
\`\`\`

Ngoài ra, các thẻ HTML/JSX ngữ nghĩa như \`<details>\`, \`<summary>\` và \`<kbd>\` đều được hỗ trợ đầy đủ:

\`\`\`mdx
<details>
  <summary>Nhấn để xem cấu hình nâng cao</summary>

  Nội dung chi tiết được ẩn gọn cho tới khi người đọc mở ra.
</details>

Tổ hợp phím tắt: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
\`\`\`

<details>
  <summary>Nhấn để xem cấu hình nâng cao</summary>

  Nội dung chi tiết được ẩn gọn cho tới khi người đọc mở ra.
</details>
`;

export const DEFAULT_DOCS_CONFIG: DocsConfig = {
    items: [
        {
            id: "markdown-syntax",
            slug: "markdown-syntax",
            title: "Cú pháp Markdown & MDX",
            description: "Quy chuẩn soạn thảo bài viết, hộp thông báo, khối code Shiki, thành phần MDX và cấu trúc YAML Frontmatter trên Helios Space.",
            content: DEFAULT_MARKDOWN_SYNTAX_MDX,
            updatedAt: "2026-10-27T00:00:00.000Z",
        },
    ],
};

