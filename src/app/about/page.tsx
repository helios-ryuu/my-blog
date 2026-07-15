import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
    title: "Giới thiệu — Toán Mô Hình Hà Nội",
    description: "Không gian học thuật dành cho cộng đồng quan tâm tới mô hình hóa và ứng dụng toán học.",
};

export default function AboutPage() {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <PageHeader
                title="Giới thiệu"
                description="Toán Mô Hình Hà Nội là không gian học thuật dành cho những bạn trẻ quan tâm tới mô hình hóa, tư duy định lượng và ứng dụng toán học vào các vấn đề thực tiễn."
            />

            <div className="grid gap-6 md:grid-cols-3">
                <section className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-5">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest">Sứ mệnh</h2>
                    <p className="text-sm leading-relaxed text-foreground/74">
                        Xây dựng cộng đồng học hỏi nghiêm túc, nơi kiến thức toán học được nối với dữ liệu,
                        kinh tế, tài chính, kỹ thuật và các bài toán xã hội.
                    </p>
                </section>
                <section className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-5">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest">Hoạt động</h2>
                    <p className="text-sm leading-relaxed text-foreground/74">
                        Portal này tập trung đăng tải bài viết chuyên môn, thông tin cuộc thi và hỗ trợ thí sinh
                        nộp bài trong các vòng thi được ban tổ chức mở.
                    </p>
                </section>
                <section className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-5">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest">Liên hệ</h2>
                    <p className="text-sm leading-relaxed text-foreground/74">
                        Thông tin liên hệ chính thức sẽ được cập nhật sau. Trong thời gian này, vui lòng theo dõi
                        fanpage của Toán Mô Hình Hà Nội để nhận thông báo mới nhất.
                    </p>
                </section>
            </div>
        </main>
    );
}
