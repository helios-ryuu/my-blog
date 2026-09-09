"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import EditPostForm from "@/components/features/admin/forms/EditPostForm";
import { useToast } from "@/components/ui/Toast";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const postId = Number(id);
    const router = useRouter();
    const { showToast } = useToast();

    return (
        <EditPostForm
            postId={postId}
            onShowToast={showToast}
            onSuccess={() => {
                startNavigationLoading("/admin");
                router.push("/admin");
            }}
        />
    );
}
