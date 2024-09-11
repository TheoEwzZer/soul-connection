import { ReactElement, ReactNode } from "react";

function LoginLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default LoginLayout;
