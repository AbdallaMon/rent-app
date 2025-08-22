async function getPayEveryOptions() {
  const data = [
    { id: "ONCE", name: "مرة واحدة" },
    { id: "TWO_MONTHS", name: "كل شهرين" },
    { id: "FOUR_MONTHS", name: "كل أربعة أشهر" },
    { id: "SIX_MONTHS", name: "كل ستة أشهر" },
    { id: "ONE_YEAR", name: "كل سنة" },
  ];
  return { data };
}

export const maintenanceInputs = [
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
      label: "الوحدة (اختياري)",
      name: "unitId",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    pattern: {
      required: {
        value: false, // جعل الوحدة اختيارية
        message: "يرجى إدخال الوحدة",
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
      id: "cost",
      type: "number",
      label: "التكلفة",
      name: "cost",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال التكلفة",
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
      id: "date",
      type: "date",
      label: "تاريخ الصيانة",
      name: "date",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ الصيانة",
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
      id: "typeId",
      type: "select",
      label: "نوع الصياتة",
      name: "typeId",
    },
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع الصيانة",
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
      id: "payEvery",
      type: "select",
      label: "الدفع كل",
      name: "payEvery",
    },
    getData: getPayEveryOptions,
    hasOptions: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع التحصيل",
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
];
