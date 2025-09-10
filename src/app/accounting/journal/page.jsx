import { Suspense } from "react";
import JournalPage from "./JournalPage";

export default async function page({ searchParams }) {
  const awaitedSearchParams = await searchParams;

  return (
    <Suspense>
      <JournalPage searchParams={awaitedSearchParams} />
    </Suspense>
  );
}
