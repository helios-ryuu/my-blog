import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
    title: "Hồ sơ cá nhân — Toán Mô Hình Hà Nội",
};

export default function ProfilePage() {
    return <ProfileClient />;
}
