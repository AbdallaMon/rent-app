import { renterInputs } from "@/app/renters/renterInputs";
import dayjs from "dayjs";

export const rentAgreementInputs = [
  {
    data: {
      id: "propertyId",
      type: "select",
      label: "العقار",
      name: "propertyId",
    },
    autocomplete: true,
    extraId: false,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال العقار",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "unitId",
      type: "select",
      label: "الوحدة",
      name: "unitId",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال الوحدة",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },

  {
    id: "renter",
    data: {
      id: "renterId",
      type: "select",
      label: "المستأجر",
      name: "renterId",
    },
    createData: renterInputs,
    autocomplete: true,

    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال المستأجر",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "totalPrice",
      type: "number",
      label: "السعر الكلي",
      name: "totalPrice",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال السعر الكلي",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  {
    data: {
      id: "discount",
      type: "number",
      label: "الخصم",
      name: "discount",
      defaultValue: 0,
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    id: "rentCollectionNumber",
    data: {
      id: "rentCollectionNumber",
      type: "number",
      label: "عدد الدفعات",
      name: "rentCollectionNumber",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال عدد الدفعات",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },

  {
    data: {
      id: "startDate",
      type: "date",
      label: "تاريخ البداية",
      name: "startDate",
    },
    mobilePiker: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ البداية",
      },
    },
    onChange: (date, setValue) => {
      const newEndDate = dayjs(date).add(1, "year").subtract(1, "day");
      setValue("endDate", newEndDate.format("YYYY-MM-DD"));
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "endDate",
      type: "date",
      label: "تاريخ النهاية",
      name: "endDate",
    },
    watchData: "startDate",
    mobilePiker: true,

    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ النهاية",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  {
    data: {
      id: "tax",
      type: "number",
      label: "الضريبة",
      name: "tax",
      defaultValue: 0,
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال الضريبة",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "registrationFees",
      type: "number",
      label: "رسوم التسجيل",
      name: "registrationFees",
      defaultValue: 0,
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رسوم التسجيل",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  {
    data: {
      id: "insuranceFees",
      type: "number",
      label: "رسوم التأمين",
      name: "insuranceFees",
      defaultValue: 0,
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رسوم التأمين",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
];
