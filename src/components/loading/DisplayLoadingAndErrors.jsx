import ToastContainerLocal from "@/components/loading/ToastContainerLocal";

export function DisplayLoadingAndErrors({ loading }) {
  return (
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 50000000000,
            width: "100%",
            height: "100%",
          }}
        ></div>
      )}
      <ToastContainerLocal />
    </>
  );
}
