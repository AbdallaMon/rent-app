import { toast } from "react-toastify";
import { Failed, Success } from "@/components/loading/ToastUpdate";

export async function handleRequestSubmit(
  data,
  setLoading,
  path,
  isFileUpload = false,
  toastMessage = "Submitting your request...",
  method = "POST",
) {
  const body = isFileUpload ? data : JSON.stringify(data);
  const headers = isFileUpload ? {} : { "Content-Type": "application/json" };
  setLoading(true);
  const id = toast.loading(toastMessage);
  try {
    const requestOptions =
      method !== "GET" ? { method, body, headers } : { method, headers };
    const request = await fetch("/api/" + path, requestOptions);
    const response = await request.json();
    if (response.status === 200) {
      toast.update(id, Success(response.message));
    } else {
      toast.update(id, Failed(response.message));
    }
    return response;
  } catch (err) {
    console.log(err);
    toast.update(
      id,
      Failed("Error, something went wrong. Please try again later."),
    );
  } finally {
    setLoading(false);
  }
}
