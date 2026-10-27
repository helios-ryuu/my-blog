"use client";

import { useRouter } from "next/navigation";
import AddPostForm from "@/components/features/admin/forms/AddPostForm";
import { useToast } from "@/components/ui/Toast";
import { useAdminCache } from "@/contexts/AdminCacheContext";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function NewPostPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { refreshAdminData } = useAdminCache();
    return (
        <AddPostForm
            onShowToast={showToast}
            onSuccess={() => {
                void refreshAdminData();
                startNavigationLoading("/admin");
                router.push("/admin");
            }}
        />
    );
}
