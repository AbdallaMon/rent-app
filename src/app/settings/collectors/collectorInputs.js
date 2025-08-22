export const collectorInputs = [
  {
    data: {
      id: "name",
      type: "text",
      label: "اسم المحصل",
      name: "name",
    },
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
        md: "47%",
        lg: "48%",
      },
      mr: "auto",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم المالك",
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
        sm: "48%",
        md: "47%",
        lg: "48%",
      },
    },
  }, {
    data: {
      id: "nationalId",
      type: "text",
      label: "هوية المحصل",
      name: "nationalId",
    },
  },
];
