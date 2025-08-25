"use client";
import InputField from "../../Inputs/InputField";
import { useForm } from "react-hook-form";
import SimpleSelect from "../../MUIInputs/SimpleSelect";
import { Box, Button, Typography } from "@mui/material";

export default function MainForm({
  inputs,
  onSubmit,
  differentButton,
  btnText,
  formTitle,
  subTitle = "",
  formStyle, // <- keep using this exactly
  variant,
  children,
  inputGap = "16px",
}) {
  const { formState, register, handleSubmit, watch, trigger, control } =
    useForm();
  const { errors } = formState;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      // All styling via MUI/theme; still merges any incoming `formStyle`
      sx={(theme) => ({
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, sm: 4 },
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
        ...formStyle,
      })}
    >
      <Typography
        variant="h4"
        sx={(theme) => ({
          mb: 2,
          fontWeight: 700,
          color: theme.palette.primary.main,
        })}
      >
        {formTitle}
      </Typography>

      {subTitle && (
        <Typography
          variant="subtitle1"
          sx={(theme) => ({
            mb: 2,
            fontWeight: 600,
            color: theme.palette.secondary.main,
          })}
        >
          {subTitle}
        </Typography>
      )}

      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: inputGap,
        }}
      >
        {inputs.map((input) => {
          if (input.data.type === "select") {
            return (
              <SimpleSelect
                key={input.data.id}
                select={input}
                register={register}
                errors={errors}
                variant={variant}
              />
            );
          } else {
            return (
              <InputField
                key={input.data.id}
                input={input}
                register={register}
                errors={errors}
                variant={variant}
                watch={watch}
                trigger={trigger}
              />
            );
          }
        })}
        {children}
      </Box>

      {differentButton ? (
        differentButton
      ) : (
        <Button
          type="submit"
          variant="contained"
          size="large"
          color="primary"
          sx={(theme) => ({
            mt: 3,
            width: "100%",
            py: 1.5,
            textTransform: "none",
            fontWeight: 700,
          })}
        >
          {btnText}
        </Button>
      )}
    </Box>
  );
}
