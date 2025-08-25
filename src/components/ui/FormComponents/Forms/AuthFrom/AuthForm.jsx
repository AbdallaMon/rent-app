import MainForm from "@/components/ui/FormComponents/Forms/MainForm/MainForm";
import { Box } from "@mui/material";

export default function AuthForm({
  inputs,
  onSubmit,
  differentButton,
  btnText,
  formTitle,
  subTitle = "",
  formStyle,
  variant,
  children,
  inputGap,
  centerY,
  centerX,
  fullWidth,
  fullHeight,
}) {
  return (
    <Box
      sx={{
        width: fullWidth ? "100%" : "auto",
        height: fullHeight ? "100vh" : "auto",
        display: "flex",
        justifyContent: centerX ? "center" : "flex-start",
        alignItems: centerY ? "center" : "flex-start",
      }}
    >
      <MainForm
        inputs={inputs}
        onSubmit={onSubmit}
        differentButton={differentButton}
        btnText={btnText}
        formTitle={formTitle}
        subTitle={subTitle}
        formStyle={formStyle}
        variant={variant}
        inputGap={inputGap}
      >
        {children}
      </MainForm>
    </Box>
  );
}
