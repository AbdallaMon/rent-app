"use client";

import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import BankActions from "@/components/accounting/BankActions";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import dayjs from "dayjs";
import { useToastContext } from "../context/ToastLoading/ToastLoadingProvider";
import AccountTypeChip from "@/components/accounting/AccountTypeChip";
import { accountInputs } from "./inputs";
import DeleteModal from "@/components/ui/Modals/DeleteModal";
import { Typography } from "antd";
dayjs.locale("ar");

export default function page() {
  return (
    <TableFormProvider url={"fast-handler"}>
      <AccountingWrapper />
    </TableFormProvider>
  );
}

function AccountingWrapper() {
  const { data, loading, setRender, setData, setTotal } = useDataFetcher(
    `main/accounting/accounts`
  );
  const { setLoading } = useToastContext();

  const columns = [
    {
      field: "id",
      headerName: "معرف",
      width: 50,
      printable: false,
      cardWidth: 48,
    },
    {
      field: "name",
      headerName: "اسم الحساب",
      width: 100,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "code",
      headerName: "كود الحساب",
      width: 100,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "type",
      headerName: "نوع الحساب",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <AccountTypeChip variant="solid" type={params.row.type} size="medium" />
      ),
    },
    {
      field: "balance",
      headerName: "الرصيد",
      width: 100,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "actions",
      headerName: "الإجراءات",
      width: 100,
      printable: false,
      cardWidth: 48,
      renderCell: (params) => (
        <>
          {params.row.isSystem ? (
            <Typography variant="caption" color="textSecondary">
              لا يمكن حذف الحسابات النظامية.
            </Typography>
          ) : (
            <DeleteModal
              href={`main/accounting/accounts/gl`}
              item={params.row}
              externalSubText={`سيتم حذف جميع القيود المتعلقة بحساب ${params.row.name}.`}
              handleClose={() => {
                setRender((old) => !old);
              }}
            />
          )}
        </>
      ),
    },
  ];
  async function onSubmit(data) {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "/main/accounting/accounts",
      false,
      "جاري المعالجة"
    );
    if (response && response.status === 200) {
      setRender((old) => !old);
      return response;
    }
  }

  return (
    <>
      <BankActions onSubmit={onSubmit} />
      <ViewComponent
        rows={data}
        columns={columns}
        loading={loading}
        noPagination
        inputs={accountInputs}
        setData={setData}
        formTitle={`حساب جديد`}
        url={"main/accounting/accounts/gl"}
        setTotal={setTotal}
      />
    </>
  );
}
