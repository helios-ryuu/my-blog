import type { Metadata } from "next";
import ContestManagementClient from "./ContestManagementClient";

export const metadata: Metadata = {
    title: "Contest Management — Toán Mô Hình Hà Nội",
};

export default function ContestManagementPage() {
    return <ContestManagementClient />;
}
