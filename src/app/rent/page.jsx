import { Suspense } from "react";
import RentPage from "./RentPage";
export default async function page({ searchParams }) {
  const awaitedSearParams = await searchParams;

  return (
    <Suspense>
      <RentPage searchParams={awaitedSearParams} />
    </Suspense>
  );
}
