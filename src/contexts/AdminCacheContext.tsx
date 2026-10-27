"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { AdminCategory, AdminPost, AdminTag } from "@/types/admin";
import { DEFAULT_DOCS_CONFIG, type DocsConfig } from "@/data/docs-content";

interface BucketEntryItem {
    name: string;
    path: string;
    publicUrl: string;
    size: number;
    mimetype: string;
    createdAt: string | null;
    updatedAt: string | null;
}

interface BucketFolderItem {
    name: string;
    path: string;
    size?: number;
    fileCount?: number;
}

export interface DatabaseTableData {
    post: Record<string, unknown>[];
    category: Record<string, unknown>[];
    series: Record<string, unknown>[];
    tag: Record<string, unknown>[];
    post_tags: Record<string, unknown>[];
    site_settings: Record<string, unknown>[];
}

const EMPTY_DB_DATA: DatabaseTableData = {
    post: [],
    category: [],
    series: [],
    tag: [],
    post_tags: [],
    site_settings: [],
};

export function formatLoadedTime(date: Date | null): string | null {
    if (!date) return null;
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

interface BucketPrefixCacheEntry {
    folders: BucketFolderItem[];
    files: BucketEntryItem[];
}

interface AdminCacheContextValue {
    // Admin Workspace (/admin)
    posts: AdminPost[];
    tags: AdminTag[];
    categories: AdminCategory[];
    docsConfig: DocsConfig;
    setDocsConfig: (config: DocsConfig) => void;
    pendingDocsEditorSlug: string | null;
    setPendingDocsEditorSlug: (slug: string | null) => void;
    pendingEditPostId: number | null;
    setPendingEditPostId: (id: number | null) => void;
    isAdminLoading: boolean;
    hasLoadedAdmin: boolean;
    adminLoadedAt: Date | null;
    ensureAdminLoaded: (onError?: (msg: string) => void) => Promise<void>;
    refreshAdminData: (onError?: (msg: string) => void) => Promise<void>;

    // Storage Bucket (/admin/bucket)
    getBucketPrefixCache: (prefix: string) => BucketPrefixCacheEntry | undefined;
    totalBucketStats: { totalSize: number; totalFiles: number } | null;
    isBucketLoading: boolean;
    bucketLoadedAt: Date | null;
    loadBucketPrefix: (
        prefix: string,
        opts?: { force?: boolean; onError?: (msg: string) => void },
    ) => Promise<BucketPrefixCacheEntry | null>;
    invalidateBucketCache: () => void;

    // Database Viewer (/admin/database)
    databaseData: DatabaseTableData;
    isDatabaseLoading: boolean;
    hasLoadedDatabase: boolean;
    databaseLoadedAt: Date | null;
    ensureDatabaseLoaded: (onError?: (msg: string) => void) => Promise<void>;
    refreshDatabaseData: (onError?: (msg: string) => void) => Promise<void>;
}

const AdminCacheContext = createContext<AdminCacheContextValue | null>(null);

export function AdminCacheProvider({ children }: { children: ReactNode }) {
    // 1. Admin Workspace state
    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [tags, setTags] = useState<AdminTag[]>([]);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [docsConfig, setDocsConfig] = useState<DocsConfig>(DEFAULT_DOCS_CONFIG);
    const [pendingDocsEditorSlug, setPendingDocsEditorSlug] = useState<string | null>(null);
    const [pendingEditPostId, setPendingEditPostId] = useState<number | null>(null);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [hasLoadedAdmin, setHasLoadedAdmin] = useState(false);
    const [adminLoadedAt, setAdminLoadedAt] = useState<Date | null>(null);
    const adminInFlightRef = useRef(false);

    const refreshAdminData = useCallback(async (onError?: (msg: string) => void) => {
        if (adminInFlightRef.current) return;
        adminInFlightRef.current = true;
        setIsAdminLoading(true);
        try {
            const [postsRes, tagsRes, categoriesRes, docsRes] = await Promise.all([
                fetch("/api/admin/posts?pageSize=50"),
                fetch("/api/admin/tags"),
                fetch("/api/admin/categories"),
                fetch("/api/admin/docs"),
            ]);
            const [postsJson, tagsJson, categoriesJson, docsJson] = await Promise.all([
                postsRes.json(),
                tagsRes.json(),
                categoriesRes.json(),
                docsRes.json().catch(() => ({ success: false })),
            ]);
            if (postsJson.success) setPosts(postsJson.data.items ?? []);
            if (tagsJson.success) setTags(tagsJson.data ?? []);
            if (categoriesJson.success) setCategories(categoriesJson.data ?? []);
            if (docsJson.success && docsJson.data) setDocsConfig(docsJson.data);
            setHasLoadedAdmin(true);
            setAdminLoadedAt(new Date());
        } catch (err) {
            onError?.(err instanceof Error ? err.message : "Failed to load admin data");
        } finally {
            setIsAdminLoading(false);
            adminInFlightRef.current = false;
        }
    }, []);

    const ensureAdminLoaded = useCallback(async (onError?: (msg: string) => void) => {
        if (hasLoadedAdmin) return;
        await refreshAdminData(onError);
    }, [hasLoadedAdmin, refreshAdminData]);

    // 2. Bucket state
    const bucketCacheRef = useRef<Map<string, BucketPrefixCacheEntry>>(new Map());
    const [, setBucketVersion] = useState(0);
    const [totalBucketStats, setTotalBucketStats] = useState<{ totalSize: number; totalFiles: number } | null>(null);
    const [isBucketLoading, setIsBucketLoading] = useState(false);
    const [bucketLoadedAt, setBucketLoadedAt] = useState<Date | null>(null);

    const getBucketPrefixCache = useCallback((prefix: string) => {
        return bucketCacheRef.current.get(prefix);
    }, []);

    const invalidateBucketCache = useCallback(() => {
        bucketCacheRef.current.clear();
        setBucketVersion((v) => v + 1);
    }, []);

    const loadBucketPrefix = useCallback(async (
        prefix: string,
        opts?: { force?: boolean; onError?: (msg: string) => void },
    ): Promise<BucketPrefixCacheEntry | null> => {
        if (!opts?.force) {
            const cached = bucketCacheRef.current.get(prefix);
            if (cached) {
                return cached;
            }
        } else {
            bucketCacheRef.current.clear();
        }

        setIsBucketLoading(true);
        try {
            const url = new URL("/api/admin/bucket", window.location.origin);
            if (prefix) url.searchParams.set("prefix", prefix);
            const res = await fetch(url.toString());
            const json = await res.json();
            if (json.success && json.data) {
                const entry: BucketPrefixCacheEntry = {
                    folders: json.data.folders ?? [],
                    files: json.data.files ?? [],
                };
                bucketCacheRef.current.set(prefix, entry);
                if (json.data.totalSize !== undefined && json.data.totalFiles !== undefined) {
                    setTotalBucketStats({
                        totalSize: json.data.totalSize,
                        totalFiles: json.data.totalFiles,
                    });
                }
                setBucketLoadedAt(new Date());
                setBucketVersion((v) => v + 1);
                return entry;
            }
            opts?.onError?.(json.message || "Unable to load files");
            return null;
        } catch (err) {
            opts?.onError?.(err instanceof Error ? err.message : "Unable to load files");
            return null;
        } finally {
            setIsBucketLoading(false);
        }
    }, []);

    // 3. Database state
    const [databaseData, setDatabaseData] = useState<DatabaseTableData>(EMPTY_DB_DATA);
    const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
    const [hasLoadedDatabase, setHasLoadedDatabase] = useState(false);
    const [databaseLoadedAt, setDatabaseLoadedAt] = useState<Date | null>(null);
    const dbInFlightRef = useRef(false);

    const refreshDatabaseData = useCallback(async (onError?: (msg: string) => void) => {
        if (dbInFlightRef.current) return;
        dbInFlightRef.current = true;
        setIsDatabaseLoading(true);
        try {
            const res = await fetch("/api/admin/data");
            const json = await res.json();
            if (json.success && json.data) {
                setDatabaseData(json.data);
                setHasLoadedDatabase(true);
                setDatabaseLoadedAt(new Date());
            } else {
                onError?.(json.message || "Unable to load database tables");
            }
        } catch (err) {
            onError?.(err instanceof Error ? err.message : "Unable to load database tables");
        } finally {
            setIsDatabaseLoading(false);
            dbInFlightRef.current = false;
        }
    }, []);

    const ensureDatabaseLoaded = useCallback(async (onError?: (msg: string) => void) => {
        if (hasLoadedDatabase) return;
        await refreshDatabaseData(onError);
    }, [hasLoadedDatabase, refreshDatabaseData]);

    return (
        <AdminCacheContext.Provider
            value={{
                posts,
                tags,
                categories,
                docsConfig,
                setDocsConfig,
                pendingDocsEditorSlug,
                setPendingDocsEditorSlug,
                pendingEditPostId,
                setPendingEditPostId,
                isAdminLoading,
                hasLoadedAdmin,
                adminLoadedAt,
                ensureAdminLoaded,
                refreshAdminData,
                getBucketPrefixCache,
                totalBucketStats,
                isBucketLoading,
                bucketLoadedAt,
                loadBucketPrefix,
                invalidateBucketCache,
                databaseData,
                isDatabaseLoading,
                hasLoadedDatabase,
                databaseLoadedAt,
                ensureDatabaseLoaded,
                refreshDatabaseData,
            }}
        >
            {children}
        </AdminCacheContext.Provider>
    );
}

export function useAdminCache(): AdminCacheContextValue {
    const ctx = useContext(AdminCacheContext);
    if (!ctx) {
        throw new Error("useAdminCache must be used within an AdminCacheProvider");
    }
    return ctx;
}

