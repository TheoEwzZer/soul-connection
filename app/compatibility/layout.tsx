import { ReactElement, ReactNode } from "react";

function CompatibilityLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default CompatibilityLayout;
