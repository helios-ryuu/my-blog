"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import EditPostForm from "@/components/features/admin/forms/EditPostForm";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function EditPostInner({ postId }: { postId: number }) {
    const router = useRouter();
    const { showToast } = useToast();
    return (
        <EditPostForm
            postId={postId}
            onShowToast={showToast}
            onSuccess={() => router.push("/admin")}
        />
    );
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const postId = Number(id);
    return (
        <ToastProvider>
            <EditPostInner postId={postId} />
        </ToastProvider>
    );
}
