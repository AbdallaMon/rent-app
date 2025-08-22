"use client";
import React, {useEffect, useMemo, useState} from "react";
import {Calendar, momentLocalizer, Views} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
    Box,
    Button,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import dayjs from "dayjs";
import {useFetchPayments} from "@/helpers/hooks/useFetchPayments";
import TableFormProvider, {useTableForm,} from "@/app/context/TableFormProvider/TableFormProvider";
import {PaymentStatus, PaymentType} from "@/config/Enums";
import {PaymentModal} from "@/components/ui/Modals/PaymentModal";
import {updatePayment} from "@/services/client/updatePayment";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider";
import {getEndingRentAgreements} from "@/services/client/getEndingRentAgreements";
import Link from "next/link";
import "moment/locale/ar";
import {TableLoading} from "@/components/ui/loaders/TableLoading";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";
import {useSubmitLoader} from "@/app/context/SubmitLoaderProvider/SubmitLoaderProvider";
import {RenewRent} from "@/components/ui/Modals/RenewRent";
import {CancelRent} from "@/components/ui/Modals/CancelRentModal";
import EndingRents from "@/components/EndingRents";
import {useAuth} from "@/app/context/AuthProvider/AuthProvider";
import {usePathname} from "next/navigation";
import {getCurrentPrivilege} from "@/helpers/functions/getUserPrivilege";
import { RefreshOutlined } from "@mui/icons-material";

moment.locale("ar"); // Set moment locale globally to Arabic
const localizer = momentLocalizer(moment);

const HomePage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);
    const {payments: rent, loading: rentLoading} = useFetchPayments("RENT", selectedDate);
    const {payments: maintenance, loading: maintenanceLoading} =
          useFetchPayments("MAINTENANCE", selectedDate);
    const {payments: other, loading: otherLoading} =
          useFetchPayments("RENTEXPENCES", selectedDate);
    const {payments: overdue, loading: overdueLoading} =
          useFetchPayments("OVERRUDE");
    const [endingAgreements, setEndingAgreements] = useState([]);
    const [endingAgreementsLoading, setEndingAgreementsLoading] = useState(true);
    
    useEffect(() => {
    const fetchEndingAgreements = async () => {
        setEndingAgreementsLoading(true);
        try {
            const {data} = await getEndingRentAgreements();
            
            // Filter to only include active agreements
            const activeAgreements = data.filter(agreement => 
                agreement.status === "ACTIVE"
            );
            
            setEndingAgreements(activeAgreements);
        } catch (error) {
            console.error("Error fetching ending rent agreements:", error);
        } finally {
            setEndingAgreementsLoading(false);
        }
    };

    fetchEndingAgreements();
}, []);

    /* ==================== CALENDAR FUNCTIONS - COMMENTED FOR FUTURE USE ====================
    const handleDateChange = (event) => {
        setSelectedDate(event.start);
    };

    const handleViewChange = (newView) => {
        setView(newView);
    };
    
    const handleNavigate = (action) => {
        let newDate;
        const currentDate = selectedDate || new Date();

        switch (view) {
            case Views.DAY:
                newDate = 
                      action === "next"
                            ? moment(currentDate).add(1, "days").toDate()
                            : moment(currentDate).subtract(1, "days").toDate();
                break;
            case Views.WEEK:
                newDate =
                      action === "next"
                            ? moment(currentDate).add(1, "weeks").toDate()
                            : moment(currentDate).subtract(1, "weeks").toDate();
                break;
            case Views.MONTH:
                newDate =
                      action === "next"
                            ? moment(currentDate).add(1, "months").toDate()
                            : moment(currentDate).subtract(1, "months").toDate();
                break;
            default:
                newDate = currentDate;
        }

        setSelectedDate(newDate);
    };
    =================================================================================== */

    const filterPaymentsByDate = (payments) => {
        if (!selectedDate) return payments;
        return payments;
    };

    const sortedPayments = (payments) => {
        return payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };
    
    /* ==================== CALENDAR CODE - COMMENTED FOR FUTURE USE ====================
    // إنشاء أحداث التقويم من الدفعات
    const events = [...rent, ...maintenance, ...other, ...overdue].map(
          (payment) => ({
              title: `دفعة ${PaymentType[payment.paymentType]} خاصة بالوحدة رقم ${
                    payment.rentAgreement?.unit.number || payment.unit?.number
              } للعقار ${payment.property?.name}`,
              start: new Date(payment.dueDate),
              end: new Date(payment.dueDate),
              allDay: true,
              resource: payment,
              isOverdue: overdue.includes(payment),
          }),
    );

    // ترتيب الأحداث حسب التاريخ
    const sortedEvents = events.sort((a, b) => a.start - b.start);

    // تحديد ألوان الأحداث
    const eventPropGetter = (event) => {
        let style = {};
        if (event.isOverdue) {
            style = {backgroundColor: "#ffcccc"};
        }
        return {style};
    };
    =================================================================================== */

    return (
          <div className={"container mx-auto"}>
              <TableFormProvider url={"main/payments/"}>
                  
                  {/* ==================== CALENDAR SECTION - COMMENTED FOR FUTURE USE ====================
                  <Box
                        sx={{
                            mt: 5,
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            overflow: "auto",
                            position: "relative",
                        }}
                  >
                      {rentLoading || maintenanceLoading || otherLoading || overdueLoading ? (
                            <TableLoading loadingMessage={"جاري تحميل الدفعات"}/>
                      ) : (
                            null)
                      }
                      <Box>
                          <IconButton onClick={() => handleNavigate("prev")}>
                              <NavigateNextIcon/>
                          </IconButton>
                          <IconButton onClick={() => handleNavigate("next")}>
                              <NavigateBeforeIcon/>
                          </IconButton>
                      </Box>
                      <Calendar
                            localizer={localizer}
                            events={sortedEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{height: 500, flex: 1}}
                            onSelectEvent={handleDateChange}
                            view={view}
                            onView={handleViewChange}
                            views={[Views.MONTH, Views.WEEK, Views.DAY]}
                            date={selectedDate || new Date()}
                            eventPropGetter={eventPropGetter}
                            className={"calender"}
                      />
                  </Box>
                  =================================================================================== */}
                  
                  <PaymentSection
                        payments={sortedPayments(filterPaymentsByDate(rent))}
                        title="Rent Payments"
                        description="فاتورة دفعة ايجار"
                        heading="دفعات الايجار"
                        loading={rentLoading}
                        loadingMessage="جاري تحميل دفعات عقد الايجار"
                  />
                  <PaymentSection
                        payments={sortedPayments(filterPaymentsByDate(maintenance))}
                        title="Maintenance Payments"
                        description="فاتورة الصيانة"
                        heading="الصيانة"
                        maintenance={true}
                        loading={maintenanceLoading}
                        loadingMessage="جاري تحميل دفعات الصيانة"
                  />

                  <PaymentSection
                        payments={sortedPayments(filterPaymentsByDate(other))}
                        title="Other Payments"
                        description="فاتورة رسوم العقد"
                        heading="رسوم العقد"
                        loading={otherLoading}
                        loadingMessage="جاري تحميل الدفعات الأخرى"
                  />

                  <PaymentSection
                        payments={sortedPayments(overdue)}
                        title="Overdue Payments"
                        description="الدفعات المتأخرة"
                        heading="الدفعات المتأخرة"
                        overdue={true}
                        loading={overdueLoading}
                        loadingMessage="جاري تحميل الدفعات المتأخرة"
                  />

                  <EndingAgreementsSection
                        agreements={endingAgreements}
                        heading="اتفاقيات الايجار التي على وشك الانتهاء"
                        loading={endingAgreementsLoading}
                        loadingMessage="جاري تحميل اتفاقيات الايجار التي على وشك الانتهاء"
                  />
                  <EndingRents/>
              </TableFormProvider>
          </div>
    );
};

// Rest of the code remains the same...
const PaymentSection = ({
                            title,
                            payments,
                            maintenance,
                            description,
                            heading,
                            overdue,
                            loading,
                            loadingMessage,
                        }) => {
    const [data, setData] = useState([]);
    const [id, setId] = useState(null);
    const [modalInputs, setModalInputs] = useState([]);
    const {setOpenModal} = useTableForm();
    const {setMessage, setSeverity, setOpen} = useSubmitLoader();

    useEffect(() => {
        setData(payments);
    }, [payments]);

    const {setLoading: setSubmitLoading} = useToastContext();

    async function submit(d) {
        const currentPayment = data.find((item) => item.id === id);
        d.paymentTypeMethod = currentPayment.paymentTypeMethod;
        d.chequeNumber = currentPayment.chequeNumber;

        if (currentPayment.paymentTypeMethod !== "CASH") {
            if (
                  !currentPayment.property.bankAccount
            ) {
                setOpen(true);
                setSeverity("error");
                setMessage(
                      "لا يمكن اتمام هذه العمليه ليس هناك حساب بنكي مرتبط بهذا العقار عليك تغير طريقة الدفع او ربط العقار بحساب بنكي",
                );
                return null;
            }
        }
        const submitData = {
            ...d,
            currentPaidAmount: +currentPayment.paidAmount,
            id,
            amount: currentPayment.amount,
            propertyId: currentPayment.propertyId,
            rentAgreementId: currentPayment.rentAgreementId,
            installmentId: currentPayment.installmentId,
            renterId: currentPayment.rentAgreement?.unit.client.id,
            ownerId: currentPayment.client.id,
            title: title,
            description: description,
            invoiceType: currentPayment.paymentType,
            bankId: currentPayment.property.bankAccount
                  ? currentPayment.property.bankAccount?.id
                  : null,
            bankAccount: currentPayment.property.bankAccount
                  ? currentPayment.property.bankAccount?.id
                  : null,
        };

        const newData = await updatePayment(submitData, setSubmitLoading);
        if (newData) {
            let updateData;
            if (newData.payment.paidAmount < newData.payment.amount) {
                updateData = data.map((item) => {
                    if (item.id === id) {
                        return {
                            ...newData.payment,

                            invoices: [...item.invoices, newData.invoice],
                        };
                    }
                    return item;
                });
            } else {
                updateData = data.filter((item) => item.id !== id);
            }
            if (updateData) {
                setData(updateData);
                setOpenModal(false);
            }
        }
    }

    return (
          <Box sx={{mt: 5, position: "relative", minHeight: 200}}>
              {loading && <TableLoading loadingMessage={loadingMessage}/>}
              <Typography variant="h5" gutterBottom>
                  {heading}
              </Typography>

              <TableContainer
                    component={Paper}
                    sx={{
                        maxHeight: "100vh",
                    }}
              >
                  <Table sx={{minWidth: 650}} aria-label="payment table" stickyHeader>
                  <TableHead>
                          <TableRow sx={{
                              backgroundColor: "primary.main",
                          }}>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main", // Important to keep the bg color
                                  zIndex: 1 // Help with layering
                              }}>دفعه رقم</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>ميعاد الدفع</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>قيمة الدفعه</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>ما تم دفعه</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>الباقي</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>النوع</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>الحالة</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>اسم العقار</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}> رقم الوحدة</TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>
                                  {maintenance ? "اسم المالك" : "اسم المستأجر"}
                              </TableCell>
                              <TableCell sx={{
                                  color: "white", 
                                  backgroundColor: "primary.main",
                                  zIndex: 1
                              }}>دفع</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {data?.map((item, index) => (
                                <>
                                    <PaymentRow
                                          maintenance={maintenance}
                                          item={item}
                                          setId={setId}
                                          id={id}
                                          setModalInputs={setModalInputs}
                                          showName
                                          index={index + 1}
                                          overdue={overdue}
                                          setOpenModal={setOpenModal}
                                          key={item.id}
                                    />
                                    {item.invoices && item.invoices.length > 0 && (
                                          <InvoiceRows invoices={item.invoices} index={index + 1}/>
                                    )}
                                </>
                          ))}
                      </TableBody>
                  </Table>
              </TableContainer>
              <PaymentModal
                    id={id}
                    modalInputs={modalInputs}
                    submit={submit}
                    setId={setId}
              />
          </Box>
    );
};

const PaymentRow = ({
                        item,
                        setModalInputs,
                        setId,
                        index,
                        overdue,
                        setOpenModal,
                    }) => {

    const modalInputs = [
        {
            data: {
                name: "paidAmount",
                label: "القيمة المراد دفعها",
                type: "number",
                id: "paidAmount",
                defaultValue: (item.amount - item.paidAmount).toFixed(2),
            },
            pattern: {
                required: {
                    value: true,
                    message: "يرجى إدخال القيمة المراد دفعها",
                },
                sx: {
                    width: {
                        xs: "100%",
                        sm: "68%",
                    },
                    mr: "auto",
                },
                max: {
                    value: item.amount - item.paidAmount,
                    message: `القيمة المراد دفعها يجب أن تكون أقل من ${
                          item.amount - item.paidAmount
                    } والتي هي القيمة المتبقية لهذه الدفعة`,
                },
            },
        },
        {
            data: {
                id: "timeOfPayment",
                type: "date",
                label: " تاريخ الدفع",
                name: "timeOfPayment",
            },
            value: dayjs().format("YYYY-MM-DD"),
            pattern: {
                required: {
                    value: true,
                    message: "يرجى إدخال تاريخ الدفع",
                },
            },
            sx: {
                width: {
                    xs: "100%",
                    sm: "30%",
                },
            },
        },
    ];
    const {user} = useAuth();
    const pathName = usePathname();

    function canCreate() {
        const currentPrivilege = getCurrentPrivilege(user, pathName);
        return currentPrivilege?.privilege.canWrite;
    }


    return (
          <TableRow hover sx={{backgroundColor: "inherit"}}>
              <TableCell>{index}</TableCell>
              <TableCell>{dayjs(item.dueDate).format("DD/MM/YYYY")}</TableCell>
              <TableCell>{formatCurrencyAED(item.amount)}</TableCell>
              <TableCell>{formatCurrencyAED(item.paidAmount.toFixed(2))}</TableCell>
              <TableCell>
                  {formatCurrencyAED((item.amount - item.paidAmount).toFixed(2))}
              </TableCell>
              <TableCell>
                  {item.maintenance
                        ? item.maintenance.type.name
                        : PaymentType[item.paymentType]}
              </TableCell>
              <TableCell>
                  <Typography
                        variant="body2"
                        sx={{
                            color: overdue
                                  ? "#ff1b1b"
                                  : item.status === "PAID"
                                        ? "green"
                                        : item.status === "PENDING"
                                              ? "orange"
                                              : "red",
                            fontWeight: "bold",
                        }}
                  >
                      {overdue ? "دفعه متاخرة" : PaymentStatus[item.status]}
                  </Typography>
              </TableCell>
              <TableCell>{item.property?.name}</TableCell>
              <TableCell>
                  {item.rentAgreement?.unit.number || item.unit?.number}
              </TableCell>
              <TableCell>
                  {item.rentAgreement?.unit.client.name || item.client?.name + "(مالك)"}
              </TableCell>
              <TableCell>
                  {item.status !== "PAID" && canCreate() && (
                        <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                  setId(item.id);
                                  setModalInputs(modalInputs);
                                  setTimeout(() => {
                                      setOpenModal(true);
                                  }, 100);
                              }}
                        >
                            دفع
                        </Button>
                  )}
              </TableCell>
          </TableRow>
    );
};

const InvoiceRows = ({invoices, index}) => {
    return invoices.map((invoice) => (
          <TableRow key={invoice.id} sx={{backgroundColor: "#f9f9f9"}}>
              <TableCell colSpan={8}>
                  <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr 1fr 1fr ",
                            gap: 1,
                            padding: 1,
                            backgroundColor: "#f1f1f1",
                            borderRadius: 1,
                        }}
                  >
                      <Typography variant="h6"> {index}</Typography>
                      <Typography variant="body2">
                          تاريخ الدفع: {dayjs(invoice.createdAt).format("DD/MM/YYYY")}
                      </Typography>
                      <Typography variant="body2">
                          القيمة: {formatCurrencyAED(invoice.amount)}
                      </Typography>
                      <Typography variant="body2">
                          طريقة الدفع:{" "}
                          {invoice.paymentTypeMethod === "CASH"
                                ? "كاش"
                                : invoice.paymentTypeMethod === "BANK"
                                      ? "تحويل بنكي"
                                      : "شيك"}{" "}
                      </Typography>
                      <Typography variant="body2">
                          {invoice.paymentTypeMethod === "BANK" && invoice.bankAccount && (
                                <>رقم حساب المالك: {invoice.bankAccount.accountNumber}</>
                          )}
                          {invoice.chequeNumber && <>رقم الشيك: {invoice.chequeNumber}</>}
                      </Typography>
                  </Box>
              </TableCell>
          </TableRow>
    ));
};


export const EndingAgreementsSection = ({
    agreements,
    heading,
    loading,
    loadingMessage,
    tableSx = {},
    containerSx = {},
    cellSx = {},
}) => {
    // Sort agreements by end date (ascending order - nearest ending first)
    const sortedAgreements = useMemo(() => {
        if (!agreements) return [];
        return [...agreements].sort((a, b) => 
            new Date(a.endDate) - new Date(b.endDate)
        );
    }, [agreements]);

    const [data, setData] = useState(sortedAgreements);
    const {user} = useAuth();
    const pathName = usePathname();

    function canEdit() {
        const currentPrivilege = getCurrentPrivilege(user, pathName);
        return currentPrivilege?.privilege.canEdit;
    }

    useEffect(() => {
        if (!loading) {
            // Make sure to use the sorted version when updating state
            setData(sortedAgreements);
        }
    }, [loading, sortedAgreements]);
    
    // Function to update styles dynamically if needed
    const updateStyles = (newData) => {
        setData(newData.sort((a, b) => new Date(a.endDate) - new Date(b.endDate)));
    };

    // Scrollable cell style - merge with any passed cellSx
    const scrollableCellStyle = {
        maxWidth: 150,
        overflow: "auto",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        "&:hover": {
            overflow: "visible",
            whiteSpace: "normal",
            height: "auto",
        },
        ...cellSx
    };

    return (
        <Box sx={{mt: 5, position: "relative", minHeight: 200}}>
            {loading && <TableLoading loadingMessage={loadingMessage}/>}

            <Typography variant="h5" gutterBottom>
                {heading}
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 450, ...containerSx }}>
                <Table stickyHeader sx={{minWidth: 650, ...tableSx}} aria-label="ending agreements table">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{backgroundColor: "primary.main", color:"white"}}>عقد الايجار</TableCell>
                            <TableCell sx={{backgroundColor: "primary.main", color:"white"}}>اسم العقار</TableCell>
                            <TableCell sx={{backgroundColor: "primary.main", color:"white"}}>رقم الوحدة</TableCell>
                            <TableCell sx={{backgroundColor: "primary.main", color:"white"}}>اسم المستأجر</TableCell>
                            <TableCell sx={{backgroundColor: "primary.main", color:"white"}}>تاريخ انتهاء العقد</TableCell>
                            <TableCell sx={{
                                textAlign: "center",
                                backgroundColor: "primary.main", 
                                color:"white"
                            }}>اتخاذ اجراء</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.map((agreement, index) => (
                            <TableRow key={agreement.id}>
                                <TableCell sx={scrollableCellStyle}>
                                    <Link href={`/rent/${agreement.id}`}>
                                        <Button>{agreement.id}</Button>
                                    </Link>
                                </TableCell>
                                <TableCell sx={scrollableCellStyle}>{agreement.unit.property.name}</TableCell>
                                <TableCell sx={scrollableCellStyle}>{agreement.unit.number}</TableCell>
                                <TableCell sx={scrollableCellStyle}>{agreement.renter.name}</TableCell>
                                <TableCell sx={scrollableCellStyle}>
                                    {dayjs(agreement.endDate).format("DD/MM/YYYY")}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                    }}
                                >
                                    {canEdit() &&
                                        <>
                                            <RenewRent data={agreement} setData={updateStyles}/>
                                            {agreement?.status === "ACTIVE" && (
                                                <CancelRent data={agreement} setData={updateStyles}/>
                                            )}
                                        </>
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export  {HomePage};
