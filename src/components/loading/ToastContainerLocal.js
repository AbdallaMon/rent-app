import { ToastContainer } from "react-toastify";
import { usePathname } from "next/navigation";

export default function ToastContainerLocal() {
  const params = usePathname();
  return (
    <ToastContainer
      position="top-center"
      theme="dark"
      style={{ width: "80%", maxWidth: "600px", zIndex: 9999 }}
      closeOnClick
    />
  );
}
