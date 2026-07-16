import CodeBlock from "@/components/ui/CodeBlock";
import Image from "next/image";
import { Info, Lightbulb, AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import type { ComponentType, JSX, ReactNode } from "react";

type MDXComponents = {
    [Key in keyof JSX.IntrinsicElements]?: (props: JSX.IntrinsicElements[Key]) => ReactNode;
    // MDX custom components can receive arbitrary props from authored content.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, ComponentType<any> | ((props: any) => ReactNode)>;

// Helper to create URL-friendly slug from text
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// Alert component configuration
const alertConfig = {
    note: {
        icon: Info,
        title: "Note",
        bg: "rgba(59, 130, 246, 0.08)",
        border: "rgba(59, 130, 246, 0.3)",
        color: "#60a5fa",
        textColor: "#4d94f8",
        darkText: "#e2e8f0",
        lightBg: "rgba(59, 130, 246, 0.1)",
        lightBorder: "rgba(59, 130, 246, 0.6)",
        lightColor: "#2563eb",
        lightText: "#1e293b",
    },
    tip: {
        icon: Lightbulb,
        title: "Tip",
        bg: "rgba(34, 197, 94, 0.08)",
        border: "rgba(34, 197, 94, 0.3)",
        color: "#4ade80",
        textColor: "#36d36f",
        darkText: "#e2e8f0",
        lightBg: "rgba(34, 197, 94, 0.1)",
        lightBorder: "rgba(34, 197, 94, 0.6)",
        lightColor: "#16a34a",
        lightText: "#1e293b",
    },
    important: {
        icon: AlertCircle,
        title: "Important",
        bg: "rgba(168, 85, 247, 0.08)",
        border: "rgba(168, 85, 247, 0.3)",
        color: "#c084fc",
        textColor: "#b36dfa",
        darkText: "#e2e8f0",
        lightBg: "rgba(168, 85, 247, 0.1)",
        lightBorder: "rgba(168, 85, 247, 0.6)",
        lightColor: "#9333ea",
        lightText: "#1e293b",
    },
    warning: {
        icon: AlertTriangle,
        title: "Warning",
        bg: "rgba(245, 158, 11, 0.08)",
        border: "rgba(245, 158, 11, 0.3)",
        color: "#fbbf24",
        textColor: "#f7af18",
        darkText: "#e2e8f0",
        lightBg: "rgba(245, 158, 11, 0.1)",
        lightBorder: "rgba(245, 158, 11, 0.6)",
        lightColor: "#d97706",
        lightText: "#1e293b",
    },
    caution: {
        icon: ShieldAlert,
        title: "Caution",
        bg: "rgba(239, 68, 68, 0.08)",
        border: "rgba(239, 68, 68, 0.3)",
        color: "#f87171",
        textColor: "#f55a5a",
        darkText: "#e2e8f0",
        lightBg: "rgba(239, 68, 68, 0.1)",
        lightBorder: "rgba(239, 68, 68, 0.6)",
        lightColor: "#dc2626",
        lightText: "#1e293b",
    },
};

type AlertType = keyof typeof alertConfig;

// Custom Alert component
function Alert({ type = "note", title, children }: { type?: AlertType; title?: string; children: ReactNode }) {
    const config = alertConfig[type];
    const Icon = config.icon;
    const displayTitle = title || config.title;

    return (
        <div
            className="alert-box my-6 px-4 pt-4 pb-2 rounded-md border"
            style={{
                background: `var(--alert-${type}-bg, ${config.bg})`,
                borderColor: `var(--alert-${type}-border, ${config.border})`,
            }}
        >
            <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide" style={{ color: config.color }}>
                <Icon size={18} strokeWidth={3} />
                <span>{displayTitle}</span>
            </div>
            <div className="text-sm leading-relaxed my-2" style={{ color: config.textColor }}>
                {children}
            </div>
        </div>
    );
}

// YouTube embed component
function YouTube({ id, title }: { id: string; title?: string }) {
    return (
        <div className="relative w-full aspect-video my-6 rounded-md overflow-hidden">
            <iframe
                src={`https://www.youtube.com/embed/${id}`}
                title={title || "YouTube video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
            />
        </div>
    );
}

// Video component
function Video({ src, title }: { src: string; title?: string }) {
    return (
        <div className="relative w-full my-6 rounded-md overflow-hidden">
            <video
                src={src}
                title={title}
                controls
                className="w-full"
            >
                Your browser does not support video.
            </video>
        </div>
    );
}

function createMDXComponents(components: MDXComponents = {}): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
        ),
        h2: ({ children }) => {
            const id = slugify(String(children));
            return (
                <>
                    <hr className="mt-8 border-t border-(--border-color)" />
                    <h2 id={id} className="text-2xl font-bold mt-4 mb-3 scroll-mt-20">{children}</h2>
                </>
            );
        },
        h3: ({ children }) => {
            const id = slugify(String(children));
            return <h3 id={id} className="text-xl font-semibold mt-4 mb-2 scroll-mt-20">{children}</h3>;
        },
        p: ({ children }) => (
            <p className="text-sm my-2 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
            <ul className="text-sm list-disc list-inside my-2 ml-4 space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="text-sm list-decimal list-inside my-2 ml-4 space-y-2">{children}</ol>
        ),

        // Inline code - for code blocks, code inside pre will have styles reset
        code: ({ children, className, ...props }) => {
            // If has language class, it's inside a pre block - pass through
            if (className?.includes('language-')) {
                return <code className={className} {...props}>{children}</code>;
            }
            // Inline code styling
            return (
                <code
                    className="bg-(--code-block) text-gray-200 px-1.5 py-0.5 rounded text-xs"
                    style={{ fontFamily: 'var(--font-fira-code), monospace' }}
                >
                    {children}
                </code>
            );
        },
        pre: ({ children, ...props }) => (
            <CodeBlock {...props}>
                {children}
            </CodeBlock>
        ),
        blockquote: ({ children }) => {
            // Check for GitHub-style alerts: > [!NOTE], > [!TIP], etc.
            const childArray = Array.isArray(children) ? children : [children];

            // Find the first paragraph to check for alert pattern
            for (const child of childArray) {
                if (child?.props?.children) {
                    const grandChildren = child.props.children;

                    // Get text for matching - handle both string and array
                    let textToMatch: string | null = null;
                    if (typeof grandChildren === 'string') {
                        textToMatch = grandChildren;
                    } else if (Array.isArray(grandChildren)) {
                        const firstString = grandChildren.find((c: unknown) => typeof c === 'string');
                        if (typeof firstString === 'string') {
                            textToMatch = firstString;
                        }
                    }

                    if (textToMatch) {
                        const alertMatch = textToMatch.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
                        if (alertMatch) {
                            const alertType = alertMatch[1].toLowerCase() as AlertType;

                            // Extract clean content - remove the alert marker from the text
                            const cleanedFirstText = textToMatch.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');

                            // Build clean content for Alert
                            let alertContent: ReactNode;
                            if (typeof grandChildren === 'string') {
                                alertContent = cleanedFirstText;
                            } else if (Array.isArray(grandChildren)) {
                                alertContent = grandChildren.map((gc: unknown) =>
                                    gc === textToMatch ? cleanedFirstText : gc
                                ) as ReactNode[];
                            } else {
                                alertContent = cleanedFirstText;
                            }

                            return <Alert type={alertType}>{alertContent}</Alert>;
                        }
                    }
                }
            }

            // Regular blockquote
            return (
                <blockquote className="border-l-4 border-accent pl-4 my-2 italic">
                    {children}
                </blockquote>
            );
        },
        hr: () => <hr className="mt-8 border-t border-(--border-color)" />,
        table: ({ children }) => (
            <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-(--border-color)">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className="text-md bg-(--post-card)">{children}</thead>
        ),
        tbody: ({ children }) => (
            <tbody>{children}</tbody>
        ),
        tr: ({ children }) => (
            <tr className="border-b border-(--border-color)">{children}</tr>
        ),
        th: ({ children, ...props }) => (
            <th {...props} className="px-4 py-2 text-left font-semibold border-r border-(--border-color) last:border-r-0">
                {children}
            </th>
        ),
        td: ({ children, ...props }) => (
            <td {...props} className="text-sm px-4 py-2 border-r border-(--border-color) last:border-r-0">
                {children}
            </td>
        ),
        a: ({ href, children }) => (
            <a href={href} className="text-accent hover:underline">
                {children}
            </a>
        ),
        img: ({ src, alt }) => {
            if (!src || typeof src !== "string") return null;
            // Check if external URL
            const isExternal = src.startsWith('http://') || src.startsWith('https://');
            if (isExternal) {
                // eslint-disable-next-line @next/next/no-img-element
                return <img src={src} alt={alt || ''} className="rounded-md my-4 max-w-full" />;
            }
            return (
                <span className="block relative w-full my-4">
                    <Image
                        src={src}
                        alt={alt || ''}
                        width={800}
                        height={450}
                        className="rounded-md object-cover"
                        style={{ width: '100%', height: 'auto' }}
                    />
                </span>
            );
        },
        // Custom components
        YouTube,
        Video,
        ...components,
    };
}

// Pre-built components object for use in async Server Components
export const mdxComponents = createMDXComponents();
