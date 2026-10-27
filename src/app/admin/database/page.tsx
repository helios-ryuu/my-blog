import DatabaseTab from "@/components/features/admin/tabs/DatabaseTab";

export default async function DatabasePage() {
    return (
        <div className="mx-auto w-full max-w-[1760px] px-4 md:px-8 xl:px-10 py-6 md:py-8">
            <DatabaseTab />
        </div>
    );
}
