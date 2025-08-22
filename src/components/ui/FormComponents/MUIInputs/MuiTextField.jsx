import {TextField} from "@mui/material";

export function MuiTextField({
                                 input,
                                 variant = "contained",
                                 register,
                                 errors,
                             }) {
    const inputData = input.data;
    return (
          <TextField
                fullWidth
                sx={input.sx && input.sx}
                className={"mb-3"}
                defaultValue={input.value}
                disabled={input.disabled}
                variant={variant}
                error={Boolean(errors[inputData.id])}
                helperText={errors[inputData.id]?.message}
                {...inputData}
                {...register(inputData.id, input.pattern)}
          />
    );
}
