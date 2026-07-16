"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
    Upload,
    Trash2,
    Copy,
    Check,
    FileImage,
    File as FileIcon,
    RefreshCw,
    Pencil,
    X,
    Search,
    FolderPlus,
    Folder,
    FolderOpen,
    ChevronRight,
    Home,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../common/Button";
import { useToast } from "../../../ui/Toast";

interface BucketEntry {
    name: string;
    path: string;
    publicUrl: string;
    size: number;
    mimetype: string;
    createdAt: string | null;
    updatedAt: string | null;
}

interface BucketFolder {
    name: string;
    path: string;
}

interface BucketListResponse {
    success: boolean;
    data?: { bucket: string; prefix: string; folders: BucketFolder[]; files: BucketEntry[] };
    message?: string;
}

interface BucketManagerProps {
    mode?: "manage" | "picker";
    onPick?: (file: BucketEntry) => void;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
const isImage = (name: string) => IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

function formatSize(bytes: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BucketManager({
    mode = "manage",
    onPick,
}: BucketManagerProps) {
    const { showToast } = useToast();
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [prefix, setPrefix] = useState<string>("");
    const [folders, setFolders] = useState<BucketFolder[]>([]);
    const [files, setFiles] = useState<BucketEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [selectedFile, setSelectedFile] = useState<BucketEntry | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [renameState, setRenameState] = useState<{ from: string; to: string; type: "file" | "folder" } | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = new URL("/api/admin/bucket", window.location.origin);
            if (prefix) url.searchParams.set("prefix", prefix);
            const res = await fetch(url.toString());
            const json: BucketListResponse = await res.json();
            if (json.success && json.data) {
                setFolders(json.data.folders);
                setFiles(json.data.files);
            } else {
                showToast("error", json.message || t("loadFilesError"));
                setFolders([]);
                setFiles([]);
            }
        } catch (e) {
            showToast("error", e instanceof Error ? e.message : t("loadFilesError"));
        } finally {
            setIsLoading(false);
        }
    }, [prefix, showToast, t]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    function navigateInto(folder: BucketFolder) {
        setPrefix(folder.path);
        setSearchQuery("");
    }

    function pathInCurrentFolder(name: string) {
        const cleanName = name.replace(/^\/+|\/+$/g, "");
        return prefix ? `${prefix}/${cleanName}` : cleanName;
    }

    async function handleCreateFolder() {
        const name = newFolderName.trim();
        if (!name) {
            showToast("warning", t("folderNameRequired"));
            return;
        }
        setIsCreatingFolder(true);
        try {
            const res = await fetch("/api/admin/bucket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create-folder", path: pathInCurrentFolder(name) }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("createFolderError"));
            showToast("success", t("createFolderSuccess"));
            setNewFolderName("");
            setSearchQuery("");
            await fetchEntries();
        } catch (e) {
            showToast("error", e instanceof Error ? e.message : t("createFolderError"));
        } finally {
            setIsCreatingFolder(false);
        }
    }

    function navigateToCrumb(target: string) {
        setPrefix(target);
        setSearchQuery("");
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files;
        if (!selected || selected.length === 0) return;
        setIsUploading(true);
        let count = 0;
        try {
            for (const file of Array.from(selected)) {
                const fd = new FormData();
                fd.append("file", file);
                if (prefix) fd.append("prefix", prefix);
                const res = await fetch("/api/admin/bucket", { method: "POST", body: fd });
                const json = await res.json();
                if (json.success) count++;
                else showToast("error", json.message || t("uploadFileError", { name: file.name }));
            }
            if (count > 0) showToast("success", t("uploadSuccess", { count }));
            await fetchEntries();
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleDelete(path: string, type: "file" | "folder" = "file") {
        try {
            const res = await fetch("/api/admin/bucket", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, type }),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", type === "folder" ? t("folderDeleted") : t("fileDeleted"));
                setSelectedFile(null);
                setDeleteConfirm(null);
                await fetchEntries();
            } else {
                showToast("error", json.message || t("deleteFailed"));
            }
        } catch (e) {
            showToast("error", e instanceof Error ? e.message : t("deleteFailed"));
        }
    }

    async function handleRename() {
        if (!renameState || !renameState.to.trim() || renameState.to === renameState.from) {
            setRenameState(null);
            return;
        }
        // Preserve folder prefix on rename if user typed only a filename.
        const slashIdx = renameState.from.lastIndexOf("/");
        const folderPrefix = slashIdx >= 0 ? renameState.from.slice(0, slashIdx + 1) : "";
        const toBase = renameState.to.includes("/") ? renameState.to : folderPrefix + renameState.to;
        try {
            const res = await fetch("/api/admin/bucket", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from: renameState.from, to: toBase, type: renameState.type }),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", t("renameSuccess"));
                setRenameState(null);
                setSelectedFile(null);
                await fetchEntries();
            } else {
                showToast("error", json.message || t("renameFailed"));
            }
        } catch (e) {
            showToast("error", e instanceof Error ? e.message : t("renameFailed"));
        }
    }

    async function copyUrl(url: string) {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 1500);
        } catch {
            showToast("error", t("clipboardError"));
        }
    }

    const filteredFolders = folders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredFiles = files.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const breadcrumbs = prefix ? prefix.split("/") : [];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">{t("storageBucket")}</h2>
                        <span className="rounded-sm border border-(--border-color) bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60">
                            Cloudflare R2
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={fetchEntries}
                            disabled={isLoading}
                            icon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
                        >
                            {tCommon("refresh")}
                        </Button>
                        <label className="inline-flex items-center justify-center font-medium rounded-md transition-colors px-3 py-1.5 text-sm gap-1.5 bg-accent text-white hover:bg-accent/90 cursor-pointer">
                            <Upload size={14} />
                            {isUploading ? t("uploading") : t("upload")}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleUpload}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-1 text-xs text-foreground/60 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigateToCrumb("")}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                    >
                        <Home size={12} />
                        {t("bucketMedia")}
                    </button>
                    {breadcrumbs.map((crumb, idx) => {
                        const target = breadcrumbs.slice(0, idx + 1).join("/");
                        return (
                            <span key={target} className="flex items-center gap-1">
                                <ChevronRight size={12} />
                                <button
                                    type="button"
                                    onClick={() => navigateToCrumb(target)}
                                    className="px-1.5 py-0.5 rounded hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {crumb}
                                </button>
                            </span>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("filterFolder")}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                </div>

                {mode === "manage" && (
                    <div className="flex flex-col gap-2 rounded-md border border-(--border-color) bg-foreground/5 p-2 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <FolderPlus size={15} className="shrink-0 text-accent" />
                            <input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateFolder();
                                    }
                                }}
                                placeholder={t("newFolderPlaceholder")}
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="utility"
                            size="sm"
                            onClick={handleCreateFolder}
                            isLoading={isCreatingFolder}
                            disabled={isCreatingFolder}
                            loadingText={t("creatingFolder")}
                        >
                            {t("createFolder")}
                        </Button>
                    </div>
                )}

                {renameState && (
                    <div className="rounded-md border border-accent/40 bg-accent/10 p-2">
                        <p className="mb-2 text-xs text-foreground/70">{t(renameState.type === "folder" ? "renameFolderTitle" : "newName")}</p>
                        <div className="flex gap-2">
                            <input
                                value={renameState.to}
                                onChange={(e) => setRenameState({ ...renameState, to: e.target.value })}
                                className="min-w-0 flex-1 rounded-md border border-(--border-color) bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRename();
                                    if (e.key === "Escape") setRenameState(null);
                                }}
                            />
                            <Button variant="cancel" size="sm" onClick={() => setRenameState(null)}>{tCommon("cancel")}</Button>
                            <Button variant="primary" size="sm" onClick={handleRename}>{tCommon("save")}</Button>
                        </div>
                    </div>
                )}

                {deleteConfirm && !selectedFile && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2">
                        <span className="text-sm text-foreground/80">{t("deleteFolderConfirm")}</span>
                        <div className="flex gap-2">
                            <Button variant="cancel" size="sm" onClick={() => setDeleteConfirm(null)}>{tCommon("cancel")}</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(deleteConfirm, "folder")}>{tCommon("delete")}</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            {isLoading ? (
                <div className="p-8 text-center text-foreground/50">{t("loadingFiles")}</div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <div className="p-8 rounded-lg border border-(--border-color) bg-(--post-card) text-center">
                    <FileImage size={40} className="mx-auto mb-3 text-foreground/30" />
                    <p className="text-foreground/50 text-sm">{t("emptyFolder")}</p>
                </div>
            ) : (
                <div className="rounded-lg border border-(--border-color) bg-(--post-card) divide-y divide-(--border-color)">
                    {filteredFolders.map((f) => (
                        <div
                            key={f.path}
                            className="w-full flex items-center gap-3 p-3 hover:bg-foreground/5 transition-colors text-left"
                        >
                            <button
                                type="button"
                                onClick={() => navigateInto(f)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-md bg-foreground/5 flex items-center justify-center">
                                    <Folder size={18} className="text-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{f.name}/</p>
                                    <p className="text-xs text-foreground/50 break-all">{f.path}</p>
                                </div>
                                <ChevronRight size={16} className="text-foreground/40" />
                            </button>
                            {mode === "manage" && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setRenameState({ from: f.path, to: f.name, type: "folder" })}
                                        className="p-2 rounded-md hover:bg-foreground/10 text-foreground/50 hover:text-foreground"
                                        title={t("rename")}
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirm(f.path)}
                                        className="p-2 rounded-md hover:bg-red-500/10 text-red-400"
                                        title={tCommon("delete")}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredFiles.map((file) => (
                        <div
                            key={file.path}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedFile(file)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedFile(file);
                                }
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-foreground/5 transition-colors text-left cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-foreground/5 shrink-0 flex items-center justify-center relative">
                                {isImage(file.name) ? (
                                    <Image
                                        src={file.publicUrl}
                                        alt={file.name}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <FileIcon size={18} className="text-foreground/40" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                <div className="flex items-center gap-2 text-xs text-foreground/50">
                                    <span>{formatSize(file.size)}</span>
                                    {file.createdAt && (
                                        <>
                                            <span>•</span>
                                            <span>{new Date(file.createdAt).toLocaleString()}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {mode === "picker" ? (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPick?.(file);
                                    }}
                                >
                                    {t("useFilePicker")}
                                </Button>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyUrl(file.publicUrl);
                                    }}
                                    className="p-2 rounded-md hover:bg-foreground/10 transition-colors text-foreground/50 hover:text-foreground cursor-pointer"
                                    title={t("copyUrl")}
                                >
                                    {copiedUrl === file.publicUrl ? (
                                        <Check size={16} className="text-green-500" />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Detail modal */}
            {selectedFile && (
                <div
                    className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => {
                        setSelectedFile(null);
                        setDeleteConfirm(null);
                        setRenameState(null);
                    }}
                >
                    <div
                        className="relative w-full max-w-lg p-6 rounded-xl border border-(--border-color) bg-background shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground truncate pr-4">{selectedFile.name}</h3>
                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setDeleteConfirm(null);
                                    setRenameState(null);
                                }}
                                className="p-1 text-foreground/50 hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="aspect-video bg-foreground/5 rounded-lg overflow-hidden mb-4 flex items-center justify-center relative">
                            {isImage(selectedFile.name) ? (
                                <Image
                                    src={selectedFile.publicUrl}
                                    alt={selectedFile.name}
                                    fill
                                    sizes="100vw"
                                    className="object-contain"
                                    unoptimized
                                />
                            ) : (
                                <FolderOpen size={64} className="text-foreground/30" />
                            )}
                        </div>

                        <div className="text-sm text-foreground/60 mb-4 space-y-1">
                            <p><span className="text-foreground/80">{t("fileSize")}:</span> {formatSize(selectedFile.size)}</p>
                            <p className="break-all"><span className="text-foreground/80">{t("filePath")}:</span> {selectedFile.path}</p>
                        </div>

                        {renameState && renameState.from === selectedFile.path && renameState.type === "file" && (
                            <div className="mb-4">
                                <p className="text-sm text-foreground/70 mb-2">{t("newName")}</p>
                                <p className="text-yellow-500 text-xs mb-2">
                                    ⚠️ {t("renameWarning")}
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={renameState.to}
                                        onChange={(e) => setRenameState({ ...renameState, to: e.target.value })}
                                        className="flex-1 px-3 py-2 text-sm rounded-md border border-(--border-color) bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRename();
                                            if (e.key === "Escape") setRenameState(null);
                                        }}
                                    />
                                    <Button variant="cancel" size="sm" onClick={() => setRenameState(null)}>{tCommon("cancel")}</Button>
                                    <Button variant="primary" size="sm" onClick={handleRename}>{tCommon("save")}</Button>
                                </div>
                            </div>
                        )}

                        {deleteConfirm === selectedFile.path && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-sm text-foreground font-medium mb-2">{t("deleteFileConfirm")}</p>
                                <div className="flex gap-2">
                                    <Button variant="cancel" size="sm" onClick={() => setDeleteConfirm(null)}>{tCommon("cancel")}</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(selectedFile.path, "file")}>{tCommon("delete")}</Button>
                                </div>
                            </div>
                        )}

                        {!renameState && deleteConfirm !== selectedFile.path && (
                            <div className="grid grid-cols-2 gap-2">
                                {mode === "picker" && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon={<Check size={14} />}
                                        onClick={() => onPick?.(selectedFile)}
                                    >
                                        {t("useFile")}
                                    </Button>
                                )}
                                <Button
                                    variant="utility"
                                    size="sm"
                                    icon={copiedUrl === selectedFile.publicUrl ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    onClick={() => copyUrl(selectedFile.publicUrl)}
                                >
                                    {copiedUrl === selectedFile.publicUrl ? t("copied") : t("copyUrl")}
                                </Button>
                                <a
                                    href={selectedFile.publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-(--border-color) text-foreground/70 hover:border-accent hover:text-accent transition-colors"
                                >
                                    {t("openFile")}
                                </a>
                                {mode === "manage" && (
                                    <>
                                        <Button
                                            variant="attention"
                                            size="sm"
                                            icon={<Pencil size={14} />}
                                            onClick={() => setRenameState({ from: selectedFile.path, to: selectedFile.name, type: "file" })}
                                        >
                                            {t("rename")}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 size={14} />}
                                            onClick={() => setDeleteConfirm(selectedFile.path)}
                                        >
                                            {tCommon("delete")}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export type { BucketEntry };
