import { Suspense } from "react";
import PaymentsPage from "./PaymentsPage";
export default async function page({ searchParams }) {
  const awaitedSearParams = await searchParams;

  return (
    <Suspense>
      <PaymentsPage searchParams={awaitedSearParams} />
    </Suspense>
  );
}
