export const NAVIGATION_START_EVENT = "helios:navigation-start";

function normalizePathname(pathname: string) {
    return pathname === "/" ? pathname : pathname.replace(/\/$/, "");
}

export function startNavigationLoading(href: string) {
    if (typeof window === "undefined") return;

    let destination: URL;
    try {
        destination = new URL(href, window.location.href);
    } catch {
        return;
    }

    if (destination.origin !== window.location.origin) return;

    const targetPathname = normalizePathname(destination.pathname);
    const currentPathname = normalizePathname(window.location.pathname);
    if (targetPathname === currentPathname) return;

    window.dispatchEvent(new CustomEvent<string>(NAVIGATION_START_EVENT, {
        detail: targetPathname,
    }));
}
