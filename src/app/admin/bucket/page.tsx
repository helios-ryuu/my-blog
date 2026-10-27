import BucketManager from "@/components/features/admin/tabs/BucketManager";

export default async function BucketPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="max-w-[1760px] mx-auto w-full flex flex-col flex-1 px-4 md:px-8 xl:px-10 py-6 md:py-8">
                <div className="flex-1 overflow-hidden">
                    <BucketManager mode="manage" />
                </div>
            </div>
        </div>
    );
}
