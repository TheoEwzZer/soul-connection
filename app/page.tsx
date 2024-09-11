import { ReactElement } from "react";
import { Dashboard } from "@/components/dashboard";
import UpAppearTransition from "@/components/UpAppearTransition";

export default function Home(): ReactElement {
  return (
    <UpAppearTransition>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <Dashboard />
      </main>
    </UpAppearTransition>
  );
}
