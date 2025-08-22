export const loginInputs = [
  {
    data: {
      id: "email",
      type: "email",
      label: "الايميل",
      name: "email",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter an email",
      },
      pattern: {
        value: /\w+@[a-z]+\.[a-z]{2,}/gi,
        message: "Please enter a valid email",
      },
    },
  },
  {
    data: {
      id: "password",
      type: "password",
      label: "كلمة السر",
      name: "password",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a password",
      },
    },
  },
];
