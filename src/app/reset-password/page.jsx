"use client";
import { resetInputs, resetPasswordInputs } from "./data";
import Link from "next/link";

import { useRouter } from "next/navigation";
import AuthForm from "@/components/ui/FormComponents/Forms/AuthFrom/AuthForm";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

export default function ResetPage({ searchParams }) {
  const { token } = searchParams;
  const { setLoading } = useToastContext();
  const router = useRouter();

  async function handleReset(data) {
    try {
      await handleRequestSubmit(
        data,
        setLoading,
        !token ? "auth/reset" : `auth/reset/${token}`,
        false,
        !token ? "يتم مراجعة ايميلك" : "جاري اعادة تعيين كلمة السر"
      );
      if (token) {
        router.push("/login");
      }
    } catch (e) {
      console.log(e);
    }
  }

  const subTitle = <Link href={"/login"}>العودة الي صفحة تسجيل الدخول ؟</Link>;
  return (
    <>
      <AuthForm
        btnText={"اعادة تعيين كلمة السر"}
        inputs={token ? resetPasswordInputs : resetInputs}
        formTitle={"اعادة تعيين كلمة السر"}
        onSubmit={handleReset}
        subTitle={subTitle}
        variant="outlined"
        inputGap="16px"
        centerY={true}
        centerX={true}
        fullHeight={true}
        fullWidth={true}
        formStyle={{
          maxWidth: "400px",
        }}
      />
    </>
  );
}
