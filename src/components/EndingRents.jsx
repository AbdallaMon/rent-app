"use client"
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import {useDataFetcher} from "@/helpers/hooks/useDataFetcher";
import TableFormProvider, {useTableForm} from "@/app/context/TableFormProvider/TableFormProvider";
import React, {useState} from "react";
import {rentAgreementInputs} from "@/app/rent/rentInputs";
import {submitRentAgreement} from "@/services/client/createRentAgreement";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider";
import Link from "next/link";
import {Alert, Button, Snackbar, Typography} from "@mui/material";
import {StatusType} from "@/config/Enums";
import dayjs from "dayjs";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";
import {RenewRentModal} from "@/components/ui/Modals/RenewRent";
import {CancelRentModal} from "@/components/ui/Modals/CancelRentModal";
import {getCurrentPrivilege} from "@/helpers/functions/getUserPrivilege";
import {useAuth} from "@/app/context/AuthProvider/AuthProvider";
import {usePathname} from "next/navigation";

export default function EndingRents() {
    return (
          <TableFormProvider url={"fast-handler"}>
              <RentWrapper/>
          </TableFormProvider>
    );
}

function RentWrapper() {
    const {
        data: expiredData,
        loading: expiredLoading,
        page: expiredPage,
        setPage: setExpiredPage,
        limit: expiredLimit,
        setLimit: setExpiredLimit,
        totalPages: expiredTotalPages,
        setData: setExpiredData,
        total: expiredTotal,
        setTotal: setExpiredTotal,

    } = useDataFetcher(`main/rentAgreements?rented=expired&`);
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const {id, submitData} = useTableForm();
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [renewData, setRenewData] = useState(null);
    const [cancelData, setCancelData] = useState(null);

    const {user} = useAuth();
    const pathName = usePathname();

    async function getRenters() {
        const res = await fetch("/api/fast-handler?id=renter");
        const data = await res.json();

        return {data};
    }


    async function getRentCollectionType() {
        const data = [
            {id: "TWO_MONTHS", name: "شهرين"},
            {id: "THREE_MONTHS", name: "ثلاثة أشهر"},
            {id: "FOUR_MONTHS", name: "أربعة أشهر"},
            {id: "SIX_MONTHS", name: "ستة أشهر"},
            {id: "ONE_YEAR", name: "سنة واحدة"},
        ];
        return {data};
    }

    const dataInputs = rentAgreementInputs.map((input) => {
        switch (input.data.id) {
            case "rentCollectionType":
                return {
                    ...input,
                    extraId: false,
                    getData: getRentCollectionType,
                };
            case "renterId":
                return {
                    ...input,
                    extraId: false,
                    getData: getRenters,
                };

            case "propertyId":
                return {
                    ...input,
                };
            case "unitId":
                return {
                    ...input,
                };
            default:
                return input;
        }
    });


    const handleOpenRenewModal = (rentData) => {
        setRenewData(rentData);
        setRenewModalOpen(true);
    };

    const handleCloseRenewModal = () => {
        setRenewModalOpen(false);
        setRenewData(null);
    };

    const handleOpenCancelModal = (rentData) => {
        setCancelData(rentData);
        setCancelModalOpen(true);
    };

    const handleCloseCancelModal = () => {
        setCancelModalOpen(false);
        setCancelData(null);
    };
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const validateTotalPrice = (data) => {
        const discountedTotalPrice = parseFloat(data.totalPrice) - (parseFloat(data.discount) || 0);

        const totalInstallmentAmount = data.installments.reduce((sum, installment) => sum + parseFloat(installment.amount), 0);

        return totalInstallmentAmount === discountedTotalPrice;
    };
    const handleCancelConfirm = async () => {
        await submitRentAgreement(
              {...cancelData, canceling: true},
              setSubmitLoading,
              "PUT",
              [
                  {
                      route: `/${cancelData.id}?installments=true`,
                      message: "جاري البحث عن اي دفعات لم يتم استلامها...",
                  },
                  {
                      route: `/${cancelData.id}?feeInvoices=true`,
                      message: "جاري البحث عن اي رسوم لم يتم دفعها...",
                  },
                  {
                      route: `/${cancelData.id}?otherExpenses=true`,
                      message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
                  },
                  {
                      route: `/${cancelData.id}?cancel=true`,
                      message: "جاري تحديث حالة العقد القديم...",
                  },
              ],
              true,
        );
        const newData = expiredData.filter((item) => {
            return +item.id !== +cancelData.id;
        });
        setExpiredData(newData);
        cancelData.status = "CANCELED";
        handleCloseCancelModal();
    };

    const {setLoading: setSubmitLoading} = useToastContext();
    const handleRenewSubmit = async (data) => {
        if (!validateTotalPrice(data)) {
            setSnackbarOpen(true);
            return;
        }
        const extraData = {otherExpenses: []};
        data = {...data, extraData};
        await submitRentAgreement(
              {...data},
              setSubmitLoading,
              "PUT",
              [
                  {
                      route: `/${renewData.id}?installments=true`,
                      message: "جاري البحث عن اي دفعات لم يتم استلامها...",
                  },
                  {
                      route: `/${renewData.id}?feeInvoices=true`,
                      message: "جاري البحث عن اي رسوم لم يتم دفعها...",
                  },
                  {
                      route: `/${renewData.id}?otherExpenses=true`,
                      message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
                  },
                  {
                      route: `/${renewData.id}?renew=true`,
                      message: "جاري تحديث حالة العقد القديم...",
                  },
              ],
        );
        const newData = expiredData.filter((item) => {
            return +item.id !== +renewData.id;
        });
        setExpiredData(newData);
        handleCloseRenewModal();
    };


    function canEdit() {
        const currentPrivilege = getCurrentPrivilege(user, pathName);
        return currentPrivilege?.privilege.canEdit;
    }


    const columns = [
        {
            field: "rentAgreementNumber",
            headerName: "رقم العقد",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <Link href={"rent/" + params.row.id}>
                      <Button variant={"text"}>{params.row.rentAgreementNumber}</Button>
                  </Link>
            ),
        },
        {
            field: "propertyId",
            headerName: "اسم العقار",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <Link href={"/properties/" + params.row.unit.property.id}>
                      <Button variant={"text"}>{params.row.unit.property.name}</Button>
                  </Link>
            ),
        },
        {
            field: "unit",
            headerName: "رقم الوحده",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <Link href={"/units/" + params.row.unit?.id}>
                      <Button
                            variant={"text"}
                            sx={{
                                maxWidth: 100,
                                overflow: "auto",
                            }}
                      >
                          {params.row.unit?.number}
                      </Button>
                  </Link>
            ),
        },

        {
            field: "renter",
            headerName: "المستأجر",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <Link
                        href={"/renters/" + params.row.renter?.id}
                        className={"flex justify-center"}
                  >
                      <Button variant={"text"}>{params.row.renter?.name}</Button>
                  </Link>
            ),
        },
        {
            field: "status",
            headerName: "الحالة",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => {
                const today = new Date();
                const endDate = new Date(params.row.endDate);

                return (
                      <Typography
                            sx={{
                                color:
                                      params.row.status === "ACTIVE" && endDate < today
                                            ? "purple"
                                            : params.row.status === "ACTIVE"
                                                  ? "green"
                                                  : "red",
                            }}
                      >
                          {params.row.status === "ACTIVE" && endDate < today
                                ? "يجب اتخاذ اجراء"
                                : StatusType[params.row.status]}
                      </Typography>
                );
            },
        },
        {
            field: "startDate",
            headerName: "تاريخ البداية",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <>{dayjs(params.row.startDate).format('DD/MM/YYYY')}</>
            ),
        },
        {
            field: "endDate",
            headerName: "تاريخ النهاية",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <>{dayjs(params.row.endDate).format('DD/MM/YYYY')}</>
            ),
        },
        {
            field: "totalPrice",
            headerName: "السعر الكلي",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => <>{formatCurrencyAED(params.row.totalPrice)}</>,
        },
        {
            field: "actions",
            width: 250,
            printable: false,
            renderCell: (params) => (
                  <>
                      {canEdit() &&
                            <>
                                <Button
                                      variant="contained"
                                      color="primary"
                                      sx={{
                                          mt: 1,
                                          mr: 1,
                                      }}
                                      onClick={() => handleOpenRenewModal(params.row)}
                                >
                                    تجديد
                                </Button>
                                {params.row.status === "ACTIVE" && (

                                      <>
                                          <Button
                                                variant="contained"
                                                color="secondary"
                                                sx={{
                                                    mt: 1,
                                                    mr: 1,
                                                }}
                                                onClick={() => handleOpenCancelModal(params.row)}
                                          >
                                              الغاء العقد
                                          </Button>
                                      </>
                                )}
                            </>
                      }
                  </>
            ),
        },
    ];

    async function submit(data) {
        if (!validateTotalPrice(data)) {
            setSnackbarOpen(true);
            return;
        }
        return await submitRentAgreement(data, setSubmitLoading);
    }

    return (
          <>
              <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
              >
                  <Alert onClose={handleSnackbarClose} severity="error">
                      المجموع الكلي للأقساط لا يتطابق مع السعر الكلي. يرجى التحقق من المدخلات.
                  </Alert>
              </Snackbar>
              <ViewComponent
                    inputs={dataInputs}
                    formTitle={"عقد ايجار "}
                    totalPages={expiredTotalPages}
                    rows={expiredData}
                    columns={columns}
                    page={expiredPage}
                    setPage={setExpiredPage}
                    limit={expiredLimit}
                    setLimit={setExpiredLimit}
                    id={id}
                    loading={expiredLoading}
                    setData={setExpiredData}
                    setTotal={setExpiredTotal}
                    total={expiredTotal}
                    noModal={true}
                    submitFunction={submit}
                    noTabs={true}
                    url={"main/expiredRentAgreements"}
                    title={"عقود ايجار بحاجة الي اتخاذ اجراء معها"}
              />
              <RenewRentModal
                    open={renewModalOpen}
                    handleClose={handleCloseRenewModal}
                    initialData={renewData}
                    inputs={dataInputs}
                    onSubmit={handleRenewSubmit}
              ></RenewRentModal>

              <CancelRentModal
                    open={cancelModalOpen}
                    handleClose={handleCloseCancelModal}
                    handleConfirm={handleCancelConfirm}
              />
          </>
    )
}
