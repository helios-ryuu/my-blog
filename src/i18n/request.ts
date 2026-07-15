import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

async function resolveLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
    if (isLocale(fromCookie)) return fromCookie;

    const hdrs = await headers();
    const accept = hdrs.get("accept-language") ?? "";
    if (/\bvi\b/i.test(accept)) return "vi";
    return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
    const locale = await resolveLocale();
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return {
        locale,
        messages,
    };
});
