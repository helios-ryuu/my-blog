"use client";

import { useRouter } from "next/navigation";
import AddPostForm from "@/components/features/admin/forms/AddPostForm";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function NewPostInner() {
    const router = useRouter();
    const { showToast } = useToast();
    return (
        <AddPostForm
            onShowToast={showToast}
            onSuccess={() => router.push("/admin")}
        />
    );
}

export default function NewPostPage() {
    return (
        <ToastProvider>
            <NewPostInner />
        </ToastProvider>
    );
}
