import { ReactElement, ReactNode } from "react";

function CustomersLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}

export default CustomersLayout;
