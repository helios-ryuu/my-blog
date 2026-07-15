"use client";

import { useEffect, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Button } from "@/components/features/admin/common/Button";
import { FormField, FormInput } from "@/components/features/admin/common/FormFields";
import { useUser } from "@/contexts/UserContext";
import type { User } from "@/types/user";

const LIMITS = { full_name: 100, email: 200, phone: 30, school: 200 } as const;

function ProfileForm() {
    const { refresh } = useUser();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<User | null>(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [school, setSchool] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store" });
                const json = await res.json();
                if (!cancelled && json.success) {
                    const data = json.data as User;
                    setProfile(data);
                    setFullName(data.full_name ?? "");
                    setEmail(data.email ?? "");
                    setPhone(data.phone ?? "");
                    setSchool(data.school ?? "");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const hasError =
        !fullName.trim() ||
        fullName.length > LIMITS.full_name ||
        email.length > LIMITS.email ||
        phone.length > LIMITS.phone ||
        school.length > LIMITS.school;
    const canEdit = profile?.role === "admin";

    const onSave = async () => {
        if (hasError) {
            showToast("error", "Vui lòng kiểm tra lại thông tin hồ sơ.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    email: email.trim() || null,
                    phone: phone.trim() || null,
                    school: school.trim() || null,
                }),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", "Đã lưu hồ sơ.");
                setProfile(json.data as User);
                await refresh();
            } else {
                showToast("error", json.message ?? "Lưu hồ sơ thất bại.");
            }
        } catch {
            showToast("error", "Không thể kết nối máy chủ.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="text-foreground/60 text-sm">Đang tải...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="text-red-500 text-sm">Không thể tải hồ sơ.</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold tracking-widest text-accent">Hồ sơ cá nhân</h1>
            <p className="text-sm text-foreground/70 mt-0.5 mb-6">
                Thông tin tài khoản do ban quản trị cấp và dùng cho cuộc thi.
            </p>

            <div className="rounded-lg border border-(--border-color) bg-(--post-card) p-6 mb-6 space-y-4">
                <ReadonlyRow label="Username" value={profile.username} />
                <ReadonlyRow label="Vai trò" value={profile.role === "admin" ? "Admin" : "Thí sinh"} />
            </div>

            <div className="rounded-lg border border-(--border-color) bg-(--post-card) p-6 space-y-4">
                <h2 className="text-sm font-semibold tracking-widest text-foreground/80 uppercase">Thông tin cá nhân</h2>

                {canEdit ? (
                    <>
                        <FormField label="Họ và tên">
                            <FormInput
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                hasError={!fullName.trim() || fullName.length > LIMITS.full_name}
                                maxLength={LIMITS.full_name + 20}
                            />
                        </FormField>

                        <FormField label="Email">
                            <FormInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                hasError={email.length > LIMITS.email}
                                maxLength={LIMITS.email + 20}
                            />
                        </FormField>

                        <FormField label="Số điện thoại">
                            <FormInput
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                hasError={phone.length > LIMITS.phone}
                                maxLength={LIMITS.phone + 10}
                            />
                        </FormField>

                        <FormField label="Trường/Tổ chức">
                            <FormInput
                                type="text"
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                hasError={school.length > LIMITS.school}
                                maxLength={LIMITS.school + 20}
                            />
                        </FormField>

                        <div className="flex justify-end pt-2">
                            <Button
                                variant="primary"
                                onClick={onSave}
                                isLoading={saving}
                                loadingText="Đang lưu..."
                                disabled={hasError}
                            >
                                Lưu thay đổi
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        <ReadonlyRow label="Họ và tên" value={profile.full_name || "—"} />
                        <ReadonlyRow label="Email" value={profile.email || "—"} />
                        <ReadonlyRow label="Số điện thoại" value={profile.phone || "—"} />
                        <ReadonlyRow label="Trường/Tổ chức" value={profile.school || "—"} />
                    </div>
                )}
            </div>

            {canEdit && (
                <p className="text-xs text-foreground/40 mt-4">
                    Admin có thể chỉnh sửa toàn bộ tài khoản tại trang Quản lý tài khoản.
                </p>
            )}
        </div>
    );
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="text-sm text-foreground/60 sm:w-40 shrink-0">{label}</div>
            <div className="text-sm text-foreground break-all">{value}</div>
        </div>
    );
}

export default function ProfileClient() {
    return (
        <ToastProvider>
            <ProfileForm />
        </ToastProvider>
    );
}
