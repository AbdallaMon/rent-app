export const depositsInputs = [
  {
    data: {
      id: "renterId",
      type: "select",
      label: "المستاجر",
      name: "renterId",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال المستجر",
      },
    },
    sx: {
      width: {
        xs: "100%",
      },
    },
  },
  {
    data: {
      id: "rentAgreementId",
      type: "select",
      label: "عقد الايجار",
      name: "number",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال عقد الايجار",
      },
    },
    sx: {
      width: {
        xs: "100%",
      },
    },
  },
  {
    data: {
      id: "amount",
      type: "number",
      label: "قيمة الوديعة",
      name: "amount",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال قيمة الوديعة",
      },
    },
    sx: {
      width: {
        xs: "100%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "receivedAt",
      type: "date",
      label: "تاريخ الاستلام",
      name: "receivedAt",
    },
    mobilePiker: true,

    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ الاستلام",
      },
    },
    sx: {
      width: {
        xs: "100%",
      },
    },
  },
];
