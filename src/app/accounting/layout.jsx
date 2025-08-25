import { BasicTabs } from "@/components/ui/Navigation/BasicTabs/BasicTabs";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col gap-3">
      <BasicTabs accounting={true} />
      {children}
    </div>
  );
}
