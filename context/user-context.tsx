"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Context,
  ReactElement,
  useMemo,
} from "react";
interface Me {
  id: bigint;
  email: string;
  name: string;
  surname: string;
  birth_date: Date;
  gender: "Male" | "Female";
  work: string;
}

interface UserContextType {
  me: Me | null;
  setMe: (me: Me | null) => void;
}

const UserContext: Context<UserContextType | undefined> = createContext<
  UserContextType | undefined
>(undefined);

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

export const UserProvider: ({
  children,
}: {
  children: ReactNode;
}) => ReactElement = ({ children }: { children: ReactNode }): ReactElement => {
  const [me, setMe] = useState<Me | null>(null);

  const headers: HeadersInit = useMemo((): Record<string, string> => {
    const headersInit: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (NEXT_PUBLIC_GROUP_TOKEN) {
      headersInit["X-Group-Authorization"] = NEXT_PUBLIC_GROUP_TOKEN;
    } else {
      throw new Error("Group token is not set.");
    }

    return headersInit;
  }, []);

  useEffect((): void => {
    const fetchMe: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/employees/me", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        setMe(data);
      } catch (error) {
        console.error("Error fetching me:", error);
      }
    };

    fetchMe();
  }, [headers]);

  return (
    <UserContext.Provider value={{ me, setMe }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser: () => UserContextType = (): UserContextType => {
  const context: UserContextType | undefined = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
