import MainForm from "@/components/ui/FormComponents/Forms/MainForm/MainForm";

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
}) {
  return (
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
  );
}
