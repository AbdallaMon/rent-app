import { BasicTabs } from "@/components/ui/Navigation/BasicTabs/BasicTabs";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col gap-3">
      <BasicTabs settings={true}/>
      {children}
    </div>
  );
}
