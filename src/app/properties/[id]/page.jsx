"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import { useEffect, useState } from "react";
import { propertyInputs } from "@/app/properties/propertyInputs";
import { Form } from "@/components/ui/FormComponents/Forms/Form";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import { Box, Button, Modal } from "@mui/material";
import Link from "next/link";
import CustomTable from "@/components/Tables/CustomTable";
import { unitInputs } from "@/app/units/unitInputs";
import { CreateModal } from "@/components/ui/Modals/CreateModal";
import useEditState from "@/helpers/hooks/useEditState";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { usePathname } from "next/navigation";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import EditProperty from "../EditPropertyDialog";
import UnitModal from "@/app/units/UnitPageModal";

export default function PropertyPage({ params }) {
  const id = params.id;
  return (
    <TableFormProvider url={"fast-handler"}>
      <PropertyWrapper urlId={id} />
    </TableFormProvider>
  );
}

const PropertyWrapper = ({ urlId }) => {
  const {
    data: units,
    loading: unitsLoading,
    page,
    setPage,
    limit,
    setLimit,
    setData: setUnits,
    total,
    setTotal,
    setRender,
  } = useDataFetcher("main/properties/" + urlId + "/units", true);
  const { submitData } = useTableForm();

  const { user } = useAuth();
  const pathName = usePathname();

  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }

  async function handleDelete(id) {
    const deleted = await submitData(
      null,
      null,
      null,
      "DELETE",
      null,
      "json",
      "main/units/" + id
    );
    if (deleted) {
      setUnits(units.filter((unit) => unit.id !== id));
    }
  }

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/units/" + params.row.id}>
          <Button variant={"text"}>{params.row.id}</Button>
        </Link>
      ),
    },

    {
      field: "number",
      headerName: "رقم الوحدة",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "unitId",
      headerName: "معرف الوحده",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "typeId",
      headerName: "نوع الوحدة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.type?.name}</>,
    },
    {
      field: "yearlyRentPrice",
      headerName: "سعر الإيجار السنوي",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{formatCurrencyAED(params.row.yearlyRentPrice)}</>
      ),
    },
    {
      field: "client",
      headerName: "اسم المستاجر",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.client?.name}</>,
    },
    {
      field: "rentAgreements",
      headerName: "الحاله",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        let id;
        const isActiveAndNotExpired = params.row.rentAgreements?.some(
          (agreement) => {
            if (
              agreement.status === "ACTIVE" &&
              new Date(agreement.endDate) > new Date()
            ) {
              id = agreement.id;
              return true;
            }
          }
        );

        return (
          <div>
            {isActiveAndNotExpired ? (
              <Link href={`/rent/${id}`}>
                <Button variant={"text"}>مؤجره</Button>
              </Link>
            ) : (
              <div>شاغرة</div>
            )}
          </div>
        );
      },
    },
    {
      field: "electricityMeter",
      headerName: "عداد الكهرباء",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "floor",
      headerName: "الدور",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "actions",
      width: 250,
      printable: false,
      renderCell: (params) => (
        <>
          {canEdit() && (
            <UnitModal
              unitId={params.row.id}
              onSubmit={() => {
                setRender((old) => !old);
              }}
            />
          )}
          <DeleteBtn handleDelete={() => handleDelete(params.row.id)} />
        </>
      ),
    },
  ];

  return (
    <div>
      {
        <>
          {unitsLoading && !units ? (
            <div>جاري تحميل </div>
          ) : (
            <>
              {canEdit() && (
                <div className={"flex gap-3 items-center"}>
                  <EditProperty id={urlId} />
                  <div className={"flex gap-3 items-center"}>
                    اضافه وحده جديده
                    <CreateUnit
                      propertyId={urlId}
                      setUnits={setUnits}
                      units={units}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      }
      {unitsLoading && !units ? (
        <div>جاري تحميل وحدات العقار</div>
      ) : (
        <CustomTable
          rows={units ? units : []}
          columns={columns}
          loading={unitsLoading || !units}
          setTotal={setTotal}
          total={total}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
        />
      )}
    </div>
  );
};

function CreateUnit({ propertyId, setUnits, units }) {
  async function getUnitTypes() {
    const res = await fetch("/api/fast-handler?id=unitType");
    const data = await res.json();

    return { data };
  }

  async function getProperties() {
    const res = await fetch("/api/fast-handler?id=properties");
    const data = await res.json();
    return { data };
  }

  const modalInputs = unitInputs;
  modalInputs[2] = {
    ...modalInputs[2],
    extraId: false,
    getData: getUnitTypes,
  };
  modalInputs[0] = {
    ...modalInputs[0],
    extraId: false,
    getData: getProperties,
    value: propertyId,
    data: {
      ...modalInputs[0].data,
      disabled: true,
    },
  };
  return (
    <CreateModal
      oldData={units}
      setData={setUnits}
      modalInputs={modalInputs}
      id={"unit"}
    />
  );
}
