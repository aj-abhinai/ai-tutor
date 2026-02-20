import { getCatalogFromDB } from "@/lib/rag";
import ClientPage from "./ClientPage";

export default async function Page() {
    // Fetch initial default catalog on the server
    // This eliminates the client-side network waterfall for the initial load
    const initialCatalog = await getCatalogFromDB("Science");

    return <ClientPage initialCatalog={initialCatalog} initialSubject="Science" />;
}
