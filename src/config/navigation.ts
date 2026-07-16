import {
    DatabaseIcon,
    FolderIcon,
    HelpCircleIcon,
    HomeIcon,
    InfoIcon,
    NewspaperIcon,
    ShieldIcon,
    type LucideIcon,
} from "lucide-react";

export interface MenuItem {
    icon: LucideIcon;
    labelKey: string;
    href: string;
    requiresAdmin?: boolean;
}

export const menuItems: MenuItem[] = [
    { icon: HomeIcon, labelKey: "home", href: "/" },
    { icon: NewspaperIcon, labelKey: "posts", href: "/post" },
    { icon: InfoIcon, labelKey: "about", href: "/about" },
    { icon: HelpCircleIcon, labelKey: "faq", href: "/faq" },
    { icon: ShieldIcon, labelKey: "adminWorkspace", href: "/admin", requiresAdmin: true },
    { icon: FolderIcon, labelKey: "bucket", href: "/admin/bucket", requiresAdmin: true },
    { icon: DatabaseIcon, labelKey: "database", href: "/admin/database", requiresAdmin: true },
];
