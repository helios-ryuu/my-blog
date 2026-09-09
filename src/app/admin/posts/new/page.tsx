"use client";

import { useRouter } from "next/navigation";
import AddPostForm from "@/components/features/admin/forms/AddPostForm";
import { useToast } from "@/components/ui/Toast";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function NewPostPage() {
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
