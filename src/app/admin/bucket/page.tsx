import BucketManager from "@/components/features/admin/tabs/BucketManager";

export default async function BucketPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 px-4 py-8">
                <div className="flex-1 overflow-hidden">
                    <BucketManager mode="manage" />
                </div>
            </div>
        </div>
    );
}
