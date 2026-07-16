# Hướng dẫn viết bài MDX

Tài liệu này mô tả cú pháp được Helios Blog hỗ trợ trong trường `content` của bài viết. Nội dung được biên dịch bằng MDX, mở rộng Markdown với `remark-gfm`, tô màu code bằng `rehype-pretty-code` và render qua `mdx-components.tsx`.

Các bài mẫu có thể dùng trực tiếp trong CMS:

- [`examples/kubernetes-homelab.mdx`](examples/kubernetes-homelab.mdx)
- [`examples/cka-ckad-learning-journey.mdx`](examples/cka-ckad-learning-journey.mdx)

## Quy ước chung

- Tiêu đề, mô tả, ảnh bìa, category, level, thời gian đọc, type/series/order và tag được nhập ở các field riêng trong CMS, không viết frontmatter trong nội dung. Category được chọn từ danh sách quản lý tại `/admin`.
- Chọn Standalone cho bài độc lập. Khi chọn Series, tìm hoặc tạo series ngay trong field rồi chọn order chưa được dùng; metadata này không viết bằng JSX hay frontmatter trong MDX.
- Dùng một dòng trống để tách paragraph, danh sách, bảng và code block.
- Chỉ heading cấp 2 và 3 xuất hiện trong mục lục.
- Nội dung heading cấp 2 và 3 nên là text thuần, ngắn và duy nhất trong bài.
- Không dùng `import` hoặc `export` trong nội dung MDX.
- Preview được render sau khoảng 500 ms kể từ lần nhập cuối. Trang bài viết thật có thêm syntax highlighting.

## Heading và mục lục

```md
# Heading cấp 1

## Heading cấp 2

### Heading cấp 3
```

Tiêu đề bài viết đã được giao diện render bên ngoài nội dung, vì vậy thông thường bắt đầu nội dung bằng `##`. Mục lục chỉ đọc các dòng bắt đầu bằng `## ` hoặc `### `.

ID của heading được tạo bằng cách chuyển sang chữ thường, thay nhóm ký tự không phải `a-z` hoặc `0-9` bằng dấu `-`, rồi loại dấu `-` ở đầu và cuối. Tránh hai heading tạo ra cùng một ID.

## Paragraph và xuống dòng

```md
Đây là paragraph thứ nhất.

Đây là paragraph thứ hai.

Dòng này có hai khoảng trắng ở cuối.  
Dòng này sẽ xuống dòng nhưng vẫn thuộc cùng paragraph.
```

## Định dạng chữ

```md
**In đậm**

*In nghiêng* hoặc _in nghiêng_

***In đậm và nghiêng***

~~Gạch ngang~~

Ký hiệu `inline code`
```

## Liên kết

```md
[Helios Blog](/)

[Trang bên ngoài](https://example.com)

https://example.com
```

Ưu tiên đường dẫn tương đối như `/post/slug` cho trang nội bộ và URL đầy đủ có `https://` cho trang bên ngoài. Với MDX 3, bare URL được `remark-gfm` tự chuyển thành liên kết; không bọc URL trong dấu `< >` vì trình biên dịch sẽ hiểu đó là JSX.

## Hình ảnh

```md
![Mô tả ảnh](/api/media/posts/example.webp)

![Mô tả ảnh](https://bucket-blog.helios.id.vn/posts/example.webp)
```

Chọn hoặc upload ảnh tại `/admin/bucket`, sau đó dùng URL do media manager trả về. Production hiện dùng custom domain `https://bucket-blog.helios.id.vn`; khi chưa cấu hình `R2_PUBLIC_URL`, URL ổn định có dạng `/api/media/<object-key>` và ảnh được đọc từ bucket R2 private qua server.

Media manager nhận AVIF, GIF, JPEG, PNG và WebP, tối đa 10 MB mỗi file. SVG không được upload qua CMS để tránh nội dung thực thi khi media được phục vụ cùng origin.

Luôn viết alt text có ý nghĩa. Ảnh trong nội dung giữ đúng tỷ lệ, co theo chiều rộng bài và không cần khai báo kích thước.

## Danh sách

Danh sách không thứ tự:

```md
- Mục thứ nhất
- Mục thứ hai
  - Mục lồng nhau
```

Danh sách có thứ tự:

```md
1. Bước thứ nhất
2. Bước thứ hai
3. Bước thứ ba
```

Task list theo GitHub Flavored Markdown:

```md
- [x] Đã hoàn thành
- [ ] Chưa hoàn thành
```

## Trích dẫn và alert

Trích dẫn thông thường:

```md
> Một đoạn trích dẫn ngắn.
```

Năm loại GitHub-style alert được hỗ trợ:

```md
> [!NOTE]
> Thông tin bổ sung.

> [!TIP]
> Một gợi ý thực hành.

> [!IMPORTANT]
> Thông tin người đọc cần chú ý.

> [!WARNING]
> Cảnh báo về rủi ro có thể xảy ra.

> [!CAUTION]
> Cảnh báo nghiêm trọng hoặc hành động khó hoàn tác.
```

Marker `[!TYPE]` phải nằm ở đầu blockquote. Giữ nội dung alert trong cùng blockquote bằng cách thêm `>` ở mỗi dòng.

## Code

Inline code:

```md
Chạy lệnh `pnpm build` trước khi deploy.
```

Code block không chỉ định ngôn ngữ:

````md
```
plain text
```
````

Code block có syntax highlighting:

````md
```ts
export function greet(name: string) {
    return `Hello, ${name}`;
}
```
````

Tên ngôn ngữ được hiển thị trên thanh đầu code block. Nút copy sao chép toàn bộ nội dung code. Có thể dùng các identifier phổ biến của Shiki như `ts`, `tsx`, `js`, `jsx`, `json`, `bash`, `sql`, `css`, `html`, `md` và `yaml`.

## Bảng

```md
| Cột | Mô tả | Trạng thái |
| --- | --- | :---: |
| MDX | Nội dung bài viết | Có |
| R2 | Lưu trữ media | Có |
```

Bảng rộng sẽ cuộn ngang trên màn hình nhỏ. Dấu `:` trong hàng phân cách điều khiển căn lề theo cú pháp GFM.

## Đường phân cách

```md
Nội dung phía trên.

---

Nội dung phía dưới.
```

## YouTube

```mdx
<YouTube id="dQw4w9WgXcQ" title="Tên video" />
```

`id` là phần đứng sau `v=` trong URL YouTube, không phải toàn bộ URL. `title` là tuỳ chọn nhưng nên có để hỗ trợ accessibility.

## Video

```mdx
<Video src="/api/media/posts/demo.mp4" title="Video minh hoạ" />
```

Component dùng trình phát HTML5 có controls. URL phải trỏ trực tiếp tới file video mà trình duyệt hỗ trợ. Media manager hiện chỉ nhận upload ảnh, vì vậy video cần được đưa lên R2 bằng công cụ khác hoặc một URL bên ngoài.

## HTML và JSX cơ bản

MDX chấp nhận các HTML element hợp lệ dưới dạng JSX:

```mdx
<details>
  <summary>Xem thêm</summary>

  Nội dung được thu gọn.
</details>

<kbd>Ctrl</kbd> + <kbd>K</kbd>
```

Trong JSX dùng `className` thay cho `class`. Chỉ dùng component đã đăng ký là `YouTube` và `Video`; component không tồn tại sẽ làm nội dung không biên dịch được.

## Ký tự đặc biệt

Dùng dấu `\` để hiển thị ký tự Markdown theo nghĩa đen:

```md
\*không in nghiêng\*

\# không phải heading
```

Trong văn bản MDX, `{` và `}` mở biểu thức JavaScript. Khi chỉ muốn hiển thị chúng trong ví dụ, ưu tiên đặt nội dung trong inline code hoặc code block.

## Mẫu bài hoàn chỉnh

~~~mdx
## Bối cảnh

Đây là phần mở đầu với **ý chính** và một [liên kết tham khảo](https://example.com).

> [!NOTE]
> Ghi chú ngắn trước khi bắt đầu.

## Cài đặt

1. Cài dependency.
2. Tạo file môi trường.
3. Chạy ứng dụng.

```bash
pnpm install
pnpm dev
```

### Kiểm tra kết quả

| Kiểm tra | Lệnh |
| --- | --- |
| TypeScript | `pnpm typecheck` |
| ESLint | `pnpm lint` |

![Ảnh minh hoạ](/api/media/posts/example.webp)

<YouTube id="dQw4w9WgXcQ" title="Video minh hoạ" />

## Kết luận

Tóm tắt kết quả và bước tiếp theo.
~~~

## Checklist trước khi xuất bản

- Heading cấp 2 và 3 có text thuần, ID không trùng nhau.
- Link nội bộ và link ngoài đều mở đúng.
- Ảnh có alt text và URL còn hoạt động.
- Code fence có đúng tên ngôn ngữ và đóng đủ ba dấu backtick.
- JSX đóng đủ tag và dùng đúng tên component.
- Preview không báo lỗi, bố cục bảng và media ổn trên mobile.
- Bài có description, category, level, thời gian đọc, tag và ảnh bìa phù hợp trước khi publish.
