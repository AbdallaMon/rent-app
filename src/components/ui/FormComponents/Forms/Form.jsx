import { useForm } from "react-hook-form";
import { Box, Button, Typography } from "@mui/material";
import TextAreaField from "@/components/ui/FormComponents/MUIInputs/TextAreaField";
import { MuiTextField } from "@/components/ui/FormComponents/MUIInputs/MuiTextField";
import { MuiSelect } from "@/components/ui/FormComponents/MUIInputs/MuiSelect";
import { MuiDatePicker } from "@/components/ui/FormComponents/MUIInputs/MuiDatePicker";
import MuiFileField from "@/components/ui/FormComponents/MUIInputs/MuiFileField";
import MuiSwitchField from "@/components/ui/FormComponents/MUIInputs/MuiSwitchField";
import { useRef } from "react";
import SimpleSelect from "@/components/ui/FormComponents/MUIInputs/SimpleSelect";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export function Form({
  formStyle,
  onSubmit,
  inputs,
  variant,
  formTitle,
  subTitle,
  btnText,
  differentButton,
  children,
  extraData,
  disabled,
  reFetch,
  removeButton = false,
  extraComponent,
  rerender,
}) {
  const ExtraComponent = extraComponent;
  const d = useForm();
  const {
    formState,
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    getValues,
  } = d;
  const { errors } = formState;
  const formData = watch();
  const formRef = useRef();

  return (
    <Box
      sx={{
        bgcolor: "common.white",
        borderRadius: 1,
        boxShadow: 2,
        my: 4,
        p: { xs: 2, md: 4 },
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          style={{ ...formStyle }}
          ref={formRef}
        >
          <Typography
            variant="h4"
            sx={{ mb: 3, textAlign: "center", fontWeight: "bold" }}
          >
            {formTitle}
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            {subTitle}
          </Typography>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {inputs.map((input) => {
              switch (input.data.type) {
                case "text":
                  return (
                    <MuiTextField
                      variant={variant}
                      register={register}
                      input={input}
                      errors={errors}
                      trigger={trigger}
                      watch={watch}
                      key={input.data.id}
                    />
                  );
                case "simpleSelect":
                  return (
                    <SimpleSelect
                      errors={errors}
                      register={register}
                      variant={variant}
                      select={input}
                      key={input.data.id}
                      extraData={extraData}
                      disabled={disabled}
                      reFetch={reFetch}
                      control={control}
                      triggerValue={setValue}
                    />
                  );
                case "textarea":
                  return (
                    <TextAreaField
                      errors={errors}
                      input={input}
                      register={register}
                      variant={variant}
                      control={control}
                      key={input.data.id}
                    />
                  );
                case "select":
                  return (
                    <MuiSelect
                      errors={errors}
                      register={register}
                      variant={variant}
                      select={input}
                      key={input.data.id}
                      extraData={extraData}
                      disabled={disabled}
                      reFetch={reFetch}
                      control={control}
                      triggerValue={setValue}
                    />
                  );
                case "date":
                  return (
                    <MuiDatePicker
                      input={input}
                      control={control}
                      key={input.data.id}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  );
                case "file":
                  return (
                    <MuiFileField
                      control={control}
                      input={input}
                      variant={variant}
                      register={register}
                      errors={errors}
                      key={input.data.id}
                    />
                  );
                case "switch":
                  return (
                    <MuiSwitchField
                      register={register}
                      control={control}
                      input={input}
                      key={input.data.id}
                    />
                  );
                case "number":
                  return (
                    <MuiTextField
                      variant={variant}
                      register={register}
                      input={input}
                      errors={errors}
                      trigger={trigger}
                      watch={watch}
                      key={input.data.id}
                    />
                  );
                default:
                  return null;
              }
            })}
            {children}
          </Box>

          <Box>
            {ExtraComponent && (
              <ExtraComponent
                data={formData}
                control={control}
                register={register}
                errors={errors}
                setValue={setValue}
                getValues={getValues}
              />
            )}
          </Box>

          {differentButton ? (
            differentButton
          ) : (
            <>
              {!removeButton && (
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3, px: 4, py: 1.25, borderRadius: 2 }}
                >
                  {btnText}
                </Button>
              )}
            </>
          )}
        </form>
      </LocalizationProvider>
    </Box>
  );
}
