import { unitTypeInputs } from "@/app/settings/unit-type/unitTypeInputs";

export const unitInputs = [
  {
    data: {
      id: "propertyId",
      type: "select",
      label: "العقار",
      name: "propertyId",
    },
    noFastCreate: true,
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم العقار",
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
      type: "text",
      label: "معرف الوحده",
      name: "unitId",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال معرف الوحده",
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
    id: "unitType",
    data: {
      id: "typeId",
      type: "select",
      label: "نوع الوحدة",
      name: "typeId",
    },
    createData: unitTypeInputs,
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع الوحدة",
      },
    },
    sx: {
      mr: "auto",
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },

  {
    data: {
      id: "number",
      type: "text",
      label: "رقم الوحدة",
      name: "number",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رقم الوحدة",
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
      id: "yearlyRentPrice",
      type: "number",
      label: "سعر الإيجار السنوي",
      name: "yearlyRentPrice",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال سعر الإيجار السنوي",
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
      id: "electricityMeter",
      type: "text",
      label: "رقم عداد الكهرباء",
      name: "electricityMeter",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رقم عداد الكهرباء",
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
      id: "numBedrooms",
      type: "number",
      label: "عدد غرف النوم",
      name: "numBedrooms",
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
      id: "floor",
      type: "number",
      label: "الدور",
      name: "floor",
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
      id: "numBathrooms",
      type: "number",
      label: "عدد الحمامات",
      name: "numBathrooms",
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
      id: "numACs",
      type: "number",
      label: "عدد مكيف",
      name: "numACs",
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
      id: "numSaloons",
      type: "number",
      label: "عدد الصالة",
      name: "numSaloons",
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
      id: "numKitchens",
      type: "number",
      label: "عدد المطابخ",
      name: "numKitchens",
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
      id: "numLivingRooms",
      type: "number",
      label: "عدد غرف الجلوس",
      name: "numLivingRooms",
    },

    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
];
