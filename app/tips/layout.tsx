import { Navbar } from "@/components/navbar";
import { ReactElement, ReactNode } from "react";

function FaqLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default FaqLayout;
