"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditPostForm from "@/components/features/admin/forms/EditPostForm";
import { useToast } from "@/components/ui/Toast";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { showToast } = useToast();
    const initialNumericId = !Number.isNaN(Number(id)) && Number(id) > 0 ? Number(id) : null;
    const [resolvedId, setResolvedId] = useState<number | null>(initialNumericId);
    const [isLoading, setIsLoading] = useState(() => initialNumericId === null);

    useEffect(() => {
        if (initialNumericId !== null) {
            setResolvedId(initialNumericId);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        fetch(`/api/posts/${id}`)
            .then((res) => res.json())
            .then((json) => {
                if (!isMounted) return;
                if (json?.data?.id) {
                    setResolvedId(Number(json.data.id));
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [id, initialNumericId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!resolvedId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-foreground/70">Không tìm thấy bài viết để chỉnh sửa.</p>
                <button
                    onClick={() => {
                        startNavigationLoading("/admin");
                        router.push("/admin");
                    }}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg cursor-pointer"
                >
                    Về trang quản trị
                </button>
            </div>
        );
    }

    return (
        <EditPostForm
            postId={resolvedId}
            onShowToast={showToast}
            onSuccess={() => {
                startNavigationLoading("/admin");
                router.push("/admin");
            }}
        />
    );
}
