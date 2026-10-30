import CodeBlock from "@/components/ui/CodeBlock";
import Image from "next/image";
import { Info, Lightbulb, AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import type { JSX, ReactNode } from "react";

type MDXComponents = {
    [Key in keyof JSX.IntrinsicElements]?: (props: JSX.IntrinsicElements[Key]) => ReactNode;
} & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

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
    note: { icon: Info, title: "Note", variant: "note" },
    tip: { icon: Lightbulb, title: "Tip", variant: "tip" },
    important: { icon: AlertCircle, title: "Important", variant: "important" },
    warning: { icon: AlertTriangle, title: "Warning", variant: "warning" },
    caution: { icon: ShieldAlert, title: "Caution", variant: "caution" },
};

type AlertType = keyof typeof alertConfig;

// Custom Alert component
function Alert({ type = "note", title, children }: { type?: AlertType; title?: string; children: ReactNode }) {
    const config = alertConfig[type];
    const Icon = config.icon;
    const displayTitle = title || config.title;

    return (
        <div
            className="alert-box my-6 md:mx-2 lg:mx:4 xl:mx-8 px-4 pt-3.5 pb-3 rounded-lg border"
            style={{
                backgroundColor: `var(--alert-${config.variant}-bg)`,
                borderColor: `var(--alert-${config.variant}-border)`,
            }}
        >
            <div
                className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2"
                style={{ color: `var(--alert-${config.variant}-title)` }}
            >
                <Icon size={16} strokeWidth={2.5} />
                <span>{displayTitle}</span>
            </div>
            <div
                className="text-sm leading-relaxed"
                style={{ color: `var(--alert-text)` }}
            >
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
                    <h2 id={id} className="text-2xl font-bold mt-4 mb-5 scroll-mt-20">{children}</h2>
                </>
            );
        },
        h3: ({ children }) => {
            const id = slugify(String(children));
            return <h3 id={id} className="text-xl font-semibold mt-4 mb-2 scroll-mt-20">{children}</h3>;
        },
        p: ({ children }) => (
            <p className="text-base mt-4 mb-2 leading-relaxed">{children}</p>
        ),
        ul: ({ children, className, ...props }) => (
            <ul
                className={`text-base list-inside mb-4 ml-2 space-y-0.5 list-['-_'] ${className || ""}`}
                style={{ listStyleType: "'-  '" }}
                {...props}
            >
                {children}
            </ul>
        ),
        ol: ({ children, className, ...props }) => (
            <ol className={`text-base list-decimal list-inside mb-4 ml-4 space-y-0.5 ${className || ""}`} {...props}>
                {children}
            </ol>
        ),
        li: ({ children, className, ...props }) => (
            <li className={`leading-relaxed ${className || ""}`} {...props}>
                {children}
            </li>
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
                    className={`mdx-inline-code ${className || ''}`}
                    {...props}
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
                <blockquote className="border-l-4 border-accent pl-4 my-3 italic text-foreground/90">
                    {children}
                </blockquote>
            );
        },
        // Collapsible block: <details> và <summary>
        details: ({ children, className, ...props }) => (
            <details
                className={`group my-4 rounded-lg border border-(--border-color) bg-(--post-card)/60 px-4 py-3 transition-all [&[open]]:bg-(--post-card) ${className || ""}`}
                {...props}
            >
                {children}
            </details>
        ),
        summary: ({ children, className, ...props }) => (
            <summary
                className={`cursor-pointer font-medium text-base text-foreground hover:text-accent select-none py-1 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent rounded ${className || ""}`}
                {...props}
            >
                {children}
            </summary>
        ),
        hr: () => <hr className="mt-8 border-t border-(--border-color)" />,
        table: ({ children }) => (
            <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-(--border-color)">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className="text-md">{children}</thead>
        ),
        tbody: ({ children }) => (
            <tbody>{children}</tbody>
        ),
        tr: ({ children }) => (
            <tr className="border-b border-(--border-color)">{children}</tr>
        ),
        th: ({ children, ...props }) => (
            <th {...props} className="px-4 py-2 text-left font-semibold text-base border-r border-(--border-color) last:border-r-0 bg-(--post-card) transition-colors">
                {children}
            </th>
        ),
        td: ({ children, ...props }) => (
            <td {...props} className="text-base px-4 py-2 border-r border-(--border-color) last:border-r-0">
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
