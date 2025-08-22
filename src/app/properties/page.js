"use client";
import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";

import PropertyComponent from "@/components/PropertyComponent/PropertyComponent";

export default function PropertyPage() {
  return (
    <TableFormProvider url={"fast-handler"}>
      <PropertyComponent />
    </TableFormProvider>
  );
}
