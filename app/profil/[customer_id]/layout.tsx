import { ReactElement, ReactNode } from "react";

function ProfilLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default ProfilLayout;
