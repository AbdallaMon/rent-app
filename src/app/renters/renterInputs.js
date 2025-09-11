// renterInputs.js
export const renterInputs = [
  {
    data: {
      id: "name",
      type: "text",
      label: "اسم المستأجر",
      name: "name",
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم المستأجر",
      },
    },
  },
  {
    data: {
      id: "phone",
      type: "number",
      label: "رقم الهاتف",
      name: "phone",
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
      id: "altPhone",
      type: "number",
      label: "رقم هاتف اخر",
      name: "altPhone",
    },
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
        md: "47%",
        lg: "48%",
      },
    },
  },
  {
    data: {
      id: "licenceNumber",
      type: "text",
      label: "رقم الرخصة",
      name: "licenceNumber",
    },
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
        md: "47%",
        lg: "48%",
      },
    },
  },
  {
    data: {
      id: "email",
      type: "text",
      label: "الإيميل",
      name: "email",
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
      id: "nationalId",
      type: "text",
      label: "هوية المستأجر",
      name: "nationalId",
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
      id: "language",
      type: "switch",
      label: "تفضيل اللغة الإنجليزية",
      name: "language",
      defaultValue: false,
      labelPlacement: "start",
      transformValue: {
        fromDb: (value) => value === "ENGLISH",
        toDb: (value) => (value ? "ENGLISH" : "ARABIC"),
      },
      sx: {
        width: {
          xs: "100%",
          md: "48%",
        },
        mr: "auto",
      },
    },
  },
];
