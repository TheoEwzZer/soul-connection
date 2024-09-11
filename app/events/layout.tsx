import { ReactElement, ReactNode } from "react";

function EventsLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-full">{children}</div>;
}

export default EventsLayout;
