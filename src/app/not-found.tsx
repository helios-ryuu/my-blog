import UnderDevelopment from "@/components/ui/UnderDevelopment";

export default function NotFound() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <UnderDevelopment
                title="Trang không tồn tại"
                description="Trang bạn tìm kiếm không tồn tại hoặc đang được phát triển. Vui lòng quay lại sau."
            />
        </div>
    );
}
