import { ReactElement, ReactNode } from "react";

function ClothesLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default ClothesLayout;
