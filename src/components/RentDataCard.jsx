import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import Link from "next/link";
import dayjs from "dayjs";
import { RentCollectionType, StatusType } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";

export const DataCard = ({ data }) => {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef,

    documentTitle: "rent-card",

    pageStyle: `
      @page { size: auto; margin: 10mm; }
    `,
  });
  return (
    <Card sx={{ padding: 2 }} ref={componentRef}>
      <CardContent>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            mb: 5,
            textAlign: "center",
            width: "fit-content",
            mx: "auto",
            padding: 1,
            px: 1.5,
            backgroundColor: "primary.main",
            color: "white",
            borderRadius: 1,
          }}
        >
          رقم العقد: {data.rentAgreementNumber}
        </Typography>
        <Divider sx={{ width: "100%", marginY: 1 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)",
            },
            gap: 2,
          }}
          container
          spacing={2}
        >
          <GridRow
            label="رقم الوحدة"
            value={
              <Button variant="text" color="primary">
                <Link href={`/units/${data.unit.id}`}>{data.unit.number}</Link>
              </Button>
            }
          />
          <GridRow
            label="اسم العقار"
            value={
              <Link href={`/properties/${data.unit.property.id}`}>
                <Button variant="text" color="primary">
                  {data.unit.property.name}
                </Button>
              </Link>
            }
          />
          <GridRow
            label="اسم المالك"
            value={
              <Link href={`/owners/${data.unit.property.client.id}`}>
                <Button variant="text" color="primary">
                  {data.unit.property.client.name}
                </Button>
              </Link>
            }
          />
          <GridRow
            label="اسم المستأجر"
            value={
              <Link href={`/renters/${data.renter.id}`}>
                <Button variant="text" color="primary">
                  {data.renter.name}
                </Button>
              </Link>
            }
          />
          <GridRow
            label=" يتم تحصيل الايجار كل"
            value={RentCollectionType[data.rentCollectionType]}
          />
          <GridRow
            label={"سعر عقد الايجار سنويا  قبل الخصم"}
            value={formatCurrencyAED(data.totalContractPrice)}
          />
          <GridRow
            label="الخصم"
            value={formatCurrencyAED(data.totalContractPrice - data.totalPrice)}
          />
          <GridRow
            label="سعر عقد الايجار سنويا "
            value={formatCurrencyAED(data.totalPrice)}
          />
          <GridRow label="الضريبة" value={data.tax + "%"} />
          <GridRow
            label="قمية الضريبه"
            value={formatCurrencyAED((data.tax * data.totalPrice) / 100)}
          />
          <GridRow
            label="التأمين"
            value={formatCurrencyAED(data.insuranceFees)}
          />
          <GridRow
            label="رسوم التسجيل"
            value={formatCurrencyAED(data.registrationFees)}
          />
          <GridRow label="الحالة" value={StatusType[data.status]} />
          <GridRow />
          <GridRow
            label="تاريخ البداية"
            value={dayjs(data.startDate).format("DD/MM/YYYY")}
          />
          <GridRow
            label="تاريخ النهاية"
            value={dayjs(data.endDate).format("DD/MM/YYYY")}
          />

          {data.contractExpenses && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>مصروفات العقد:</strong>
              </Typography>
              <Box component="ul" sx={{ paddingLeft: 2 }}>
                {data.contractExpenses.map((expense, index) => (
                  <Typography component="li" key={index} variant="body2">
                    {expense.name}: {expense.value}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          <GridRow
            label="المبلغ الكلي"
            value={formatCurrencyAED(
              data.totalPrice +
                (data.tax * data.totalPrice) / 100 +
                data.insuranceFees +
                data.registrationFees +
                contractExpensesTotalPrice(data.contractExpenses)
            )}
          />
        </Box>

        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handlePrint}>
            طباعة
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const contractExpensesTotalPrice = (contractExpenses) => {
  return contractExpenses?.reduce((acc, item) => acc + item.value, 0);
};

const GridRow = ({ label, value }) => (
  <Box>
    <Box display="flex" flexDirection="column">
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <strong>{label}:</strong> {value}
      </Typography>
      <Divider sx={{ width: "100%", marginY: 1 }} orientation="vertical" />
      <Divider sx={{ width: "100%", marginY: 1 }} />
    </Box>
  </Box>
);
