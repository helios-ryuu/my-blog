import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "../../../mdx-components";
import { getDocsConfig } from "@/lib/site-settings";
import DocsPage, { type RenderedDocSection } from "@/components/features/docs/DocsPage";

const rehypePrettyCodeOptions = {
    theme: "github-dark",
    keepBackground: true,
};

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("docs");
    return {
        title: `${t("pageTitle")} · Helios Space`,
        description: t("pageDescription"),
    };
}

export default async function DocsRoute() {
    const docsConfig = await getDocsConfig();

    const sections: RenderedDocSection[] = docsConfig.items.map((item) => ({
        ...item,
        renderedContent: (
            <MDXRemote
                source={item.content}
                components={mdxComponents}
                options={{
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
                    },
                }}
            />
        ),
    }));

    return <DocsPage sections={sections} />;
}

