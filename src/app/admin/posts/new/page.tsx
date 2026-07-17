"use client";

import { useRouter } from "next/navigation";
import AddPostForm from "@/components/features/admin/forms/AddPostForm";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { startNavigationLoading } from "@/lib/navigation-loading";

function NewPostInner() {
    const router = useRouter();
    const { showToast } = useToast();
    return (
        <AddPostForm
            onShowToast={showToast}
            onSuccess={() => {
                startNavigationLoading("/admin");
                router.push("/admin");
            }}
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
