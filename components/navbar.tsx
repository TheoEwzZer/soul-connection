"use client";

import Image from "next/image";
import { ReactElement, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleUser, Menu, Package2 } from "lucide-react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "next-i18next";
import i18n from "@/i18n";
import { useUser } from "@/context/user-context";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function Navbar(): ReactElement {
  const { t } = useTranslation();
  const [isEnglish, setIsEnglish] = useState(true);
  const pathname: string = usePathname();
  const { me } = useUser();
  const [loading, setLoading] = useState(true);
  const router: AppRouterInstance = useRouter();
  const { setTheme } = useTheme();

  useEffect((): void => {
    if (me?.work !== undefined) {
      setLoading(false);
    }
  }, [me?.work]);

  const toggleLanguage: () => void = (): void => {
    const newLanguage: "fr" | "en" = isEnglish ? "fr" : "en";
    i18n.changeLanguage(newLanguage);
    setIsEnglish(!isEnglish);
  };

  const handleLogout: () => void = (): void => {
    document.cookie = "access_token=; path=/";
    router.push("/login");
  };

  return (
    <>
      <header
        className={`sticky top-0 flex h-16 items-center justify-between border-b px-4 md:px-6 w-full z-50 bg-white dark:bg-black`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <span className="font-bold text-xl">Soul Connection</span>
        </Link>
        <nav className="hidden md:flex flex-1 justify-center items-center gap-6 text-lg font-medium md:gap-5 md:text-sm lg:gap-6">
          {me?.work !== "Coach" && !loading && (
            <Link
              href="/"
              className={`transition-colors ${
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              } hover:text-foreground`}
            >
              {t("navbar.dashboard")}
            </Link>
          )}
          <Link
            href="/customers"
            className={`transition-colors ${
              pathname === "/customers"
                ? "text-foreground"
                : "text-muted-foreground"
            } hover:text-foreground`}
          >
            {t("navbar.customers")}
          </Link>
          {me?.work !== "Coach" && !loading && (
            <Link
              href="/coaches?page=1&limit=10&work=Coach"
              className={`transition-colors ${
                pathname === "/coaches"
                  ? "text-foreground"
                  : "text-muted-foreground"
              } hover:text-foreground`}
            >
              {t("navbar.coaches")}
            </Link>
          )}
          <Link
            href="/events"
            className={`transition-colors ${
              pathname === "/events"
                ? "text-foreground"
                : "text-muted-foreground"
            } hover:text-foreground`}
          >
            {t("navbar.events")}
          </Link>
          <Link
            href="/tips"
            className={`transition-colors ${
              pathname === "/tips" ? "text-foreground" : "text-muted-foreground"
            } hover:text-foreground`}
          >
            {t("navbar.tips")}
          </Link>
          <Link
            href="/compatibility"
            className={`transition-colors ${
              pathname === "/compatibility"
                ? "text-foreground"
                : "text-muted-foreground"
            } hover:text-foreground`}
          >
            {t("navbar.compatibility")}
          </Link>
          <Link
            href="/documents"
            className={`hover:text-foreground ${
              pathname === "/documents"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Documents
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Package2 className="h-6 w-6" />
                <span className="sr-only">Acme Inc</span>
              </Link>
              {me?.work !== "Coach" && (
                <Link
                  href="/"
                  className={`hover:text-foreground ${
                    pathname === "/"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("navbar.dashboard")}
                </Link>
              )}
              <Link
                href="/customers"
                className={`hover:text-foreground ${
                  pathname === "/customers"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t("navbar.customers")}
              </Link>
              {me?.work !== "Coach" && (
                <Link
                  href="/coaches?page=1&limit=10&work=Coach"
                  className={`hover:text-foreground ${
                    pathname === "/coaches"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("navbar.coaches")}
                </Link>
              )}
              <Link
                href="/events"
                className={`hover:text-foreground ${
                  pathname === "/events"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t("navbar.events")}
              </Link>
              <Link
                href="/tips"
                className={`hover:text-foreground ${
                  pathname === "/tips"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t("navbar.tips")}
              </Link>
              <Link
                href="/compatibility"
                className={`hover:text-foreground ${
                  pathname === "/compatibility"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t("navbar.compatibility")}
              </Link>
              <Link
                href="/documents"
                className={`hover:text-foreground ${
                  pathname === "/documents"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Documents
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-4 md:gap-2 lg:gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={toggleLanguage}
          >
            <Image
              src={isEnglish ? "/uk_flag.png" : "/french.png"}
              alt={isEnglish ? "UK flag" : "French flag"}
              width={20}
              height={20}
              className="h-5 w-5 rounded-full"
            />
            <span className="sr-only">Toggle language</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("navbar.account")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                {t("navbar.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(): void => setTheme("light")}>
                {t("navbar.themes.light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(): void => setTheme("dark")}>
                {t("navbar.themes.dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(): void => setTheme("system")}>
                {t("navbar.themes.system")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
