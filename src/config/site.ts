export const SITE_NAME = "Helios Space";
export const SITE_DESCRIPTION = "Knowledge and practical journeys through software, system architecture, and modern technology.";
export const COPYRIGHT_YEAR = 2026;
export const DEFAULT_ACCENT_COLOR = "#1f51ff";
export const ACCENT_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const SOCIAL_LINKS = {
    facebook: "https://www.facebook.com/elio.torres.42",
    instagram: "https://www.instagram.com/helios_innov/",
    github: "https://github.com/helios-ryuu",
    other: "https://vi.wikipedia.org/wiki/Ng%C3%A0y_Qu%E1%BB%91c_kh%C3%A1nh_(Vi%E1%BB%87t_Nam)"
} as const;

export interface BannerConfig {
    enabled: boolean;
    content: { vi: string; en: string };
    color1: string;
    color2: string;
    color3: string;
    height: number;
    cooldownMinutes: number;
    hasButton: boolean;
    buttonText: { vi: string; en: string };
    buttonLink: string;
    buttonBgColor: string;
    buttonTextColor: string;
    buttonBorderColor: string;
    buttonOpacity: number;
}

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
    enabled: true,
    content: {
        vi: "🇻🇳 Chào mừng kỷ niệm 81 năm ngày Quốc khánh (02/09/1945 - 02/09/2026)",
        en: "🇻🇳 Celebrating 81 years of Vietnam's National Day (02/09/1945 - 02/09/2026)",
    },
    color1: "#f2f536",
    color2: "#ca2800",
    color3: "#ca0000",
    height: 40,
    cooldownMinutes: 5,
    hasButton: false,
    buttonText: {
        vi: "Đọc thêm",
        en: "Learn more",
    },
    buttonLink: "https://vi.wikipedia.org/wiki/Ngày_Quốc_khánh_(Việt_Nam)",
    buttonBgColor: "#eab308",
    buttonTextColor: "#ffffff",
    buttonBorderColor: "#eab308",
    buttonOpacity: 100,
};
