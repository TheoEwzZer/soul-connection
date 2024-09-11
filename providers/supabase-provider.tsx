"use client";

import { useState } from "react";
import {
  SupabaseClient,
  createClientComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

import { Database } from "@/database.types";

interface SupabaseProviderProps {
  children: React.ReactNode;
}

function SupabaseProvider({
  children,
}: SupabaseProviderProps): React.ReactElement {
  const [supabaseClient] = useState(
    (): SupabaseClient<Database, "public", Database["public"]> =>
      createClientComponentClient<Database>()
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}

export default SupabaseProvider;
