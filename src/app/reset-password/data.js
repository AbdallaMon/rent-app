export const resetInputs = [
    {
        data: {
            id: "email",
            type: "email",
            name: "email",
            label: "الايميل",
        },
        pattern: {
            required: {
                value: true,
                message: "الايميل مطلوب ",
            },
            pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Invalid email address",
            },
        },
    },
];
export const resetPasswordInputs = [
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
                message: "كلمة السر مطلوبة",
            },
        },
    },
    {
        data: {
            id: "confirmPassword",
            type: "password",
            label: "Confirm Password",
            name: "confirmPassword",
        },
        pattern: {
            required: {
                value: true,
                message: "Confirm password is required",
            },
            validate: {
                matchesPreviousPassword: (value) => {
                    const password = document.getElementById("password").value;
                    return password === value || "Passwords should match!";
                },
            },
        },
    },
];
