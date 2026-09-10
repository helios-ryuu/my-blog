import fs from "fs";
import path from "path";

const GITHUB_README_URL = "https://raw.githubusercontent.com/helios-ryuu/helios-ryuu/main/README.md";

export async function getProfileReadme(): Promise<string> {
    try {
        const res = await fetch(GITHUB_README_URL, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const text = await res.text();
            if (text && text.trim().length > 0) {
                return text;
            }
        }
    } catch {
        // network error or timeout - fall through to fallback
    }

    try {
        const fallbackPath = path.join(process.cwd(), "src/data/profile-fallback.md");
        return fs.readFileSync(fallbackPath, "utf-8");
    } catch {
        return "# Helios\n\nDevOps Engineer";
    }
}

