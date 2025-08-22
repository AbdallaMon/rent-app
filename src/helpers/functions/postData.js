export async function postData(
  url = "",
  data = {},
  setLoading,
  method = "POST",
  bodyType,
  headers = {
    "Content-Type": "application/json",
  },
) {
  try {
    setLoading(true);
    const response = await fetch("/api/" + url, {
      method,
      headers,
      body: bodyType === "json" ? JSON.stringify(data) : data,
    });
    return response.json();
  } catch (e) {
    console.log(e);
    return { status: 500 };
  } finally {
    setLoading(false);
  }
}
