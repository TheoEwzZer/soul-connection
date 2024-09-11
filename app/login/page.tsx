import { LoginForm } from "@/components/login-form";
import UpAppearTransition from "@/components/UpAppearTransition";
import { ReactElement } from "react";

export default function LoginPage(): ReactElement {
  return (
    <UpAppearTransition>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <LoginForm />
      </main>
    </UpAppearTransition>
  );
}
