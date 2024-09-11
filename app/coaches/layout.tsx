import { ReactElement, ReactNode } from "react";

function CoachesLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default CoachesLayout;
