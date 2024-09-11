"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Image from "next/image";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UpAppearTransition from "@/components/UpAppearTransition";

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

interface Customer {
  id: string;
  email: string;
  name: string;
  surname: string;
  created_at: Date;
  birth_date: Date;
}

function getAstrologicalSign(date: Date): string {
  const month: number = date.getMonth() + 1;
  const day: number = date.getDate();

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return "Aquarius";
  }
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return "Pisces";
  }
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return "Aries";
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return "Taurus";
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return "Gemini";
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return "Cancer";
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return "Leo";
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return "Virgo";
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return "Libra";
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return "Scorpio";
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return "Sagittarius";
  }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return "Capricorn";
  }
  return "";
}

export default function CompatibilityPage(): ReactElement {
  const [open1, setOpen1] = useState<boolean>(false);
  const [value1, setValue1] = useState<string>("");
  const [open2, setOpen2] = useState<boolean>(false);
  const [value2, setValue2] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const calculateCompatibility: () => void = (): void => {
    if (value1 === value2) {
      setError("The two customers selected cannot be the same.");
      return;
    }
    setError("");
    const customer1: Customer | undefined = customers.find(
      (customer: Customer): boolean => customer.id === value1
    );
    const customer2: Customer | undefined = customers.find(
      (customer: Customer): boolean => customer.id === value2
    );
    if (customer1 && customer2) {
      const sign1: string = getAstrologicalSign(new Date(customer1.birth_date));
      const sign2: string = getAstrologicalSign(new Date(customer2.birth_date));
      const fixedCompatibility: number = getCompatibility(sign1, sign2);
      setProgress(0);
      const interval: NodeJS.Timeout = setInterval((): void => {
        setProgress((prevProgress: number): number => {
          if (prevProgress >= fixedCompatibility) {
            clearInterval(interval);
            return fixedCompatibility;
          }
          return prevProgress + 1;
        });
      }, 10);
    }
  };

  const headers: Record<string, string> = useMemo(() => {
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
    const fetchCustomers: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/customers", {
          method: "GET",
          headers,
        });
        const data = await res.json();
        setCustomers(data.customers);
      } catch (error) {
        setError("Erreur lors du chargement des données.");
      }
    };

    fetchCustomers();
  }, [headers]);

  const getCompatibility: (sign1: string, sign2: string) => number = (
    sign1: string,
    sign2: string
  ): number => {
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      Aries: {
        Aries: 70,
        Taurus: 60,
        Gemini: 80,
        Cancer: 50,
        Leo: 90,
        Virgo: 60,
        Libra: 70,
        Scorpio: 50,
        Sagittarius: 90,
        Capricorn: 60,
        Aquarius: 80,
        Pisces: 50,
      },
      Taurus: {
        Aries: 60,
        Taurus: 70,
        Gemini: 50,
        Cancer: 80,
        Leo: 60,
        Virgo: 90,
        Libra: 60,
        Scorpio: 70,
        Sagittarius: 50,
        Capricorn: 80,
        Aquarius: 60,
        Pisces: 90,
      },
      Gemini: {
        Aries: 80,
        Taurus: 50,
        Gemini: 70,
        Cancer: 60,
        Leo: 80,
        Virgo: 60,
        Libra: 90,
        Scorpio: 50,
        Sagittarius: 100,
        Capricorn: 60,
        Aquarius: 90,
        Pisces: 60,
      },
      Cancer: {
        Aries: 50,
        Taurus: 80,
        Gemini: 60,
        Cancer: 70,
        Leo: 60,
        Virgo: 80,
        Libra: 50,
        Scorpio: 90,
        Sagittarius: 60,
        Capricorn: 70,
        Aquarius: 50,
        Pisces: 80,
      },
      Leo: {
        Aries: 90,
        Taurus: 60,
        Gemini: 80,
        Cancer: 60,
        Leo: 70,
        Virgo: 60,
        Libra: 80,
        Scorpio: 60,
        Sagittarius: 90,
        Capricorn: 50,
        Aquarius: 80,
        Pisces: 60,
      },
      Virgo: {
        Aries: 60,
        Taurus: 90,
        Gemini: 60,
        Cancer: 80,
        Leo: 60,
        Virgo: 70,
        Libra: 60,
        Scorpio: 80,
        Sagittarius: 50,
        Capricorn: 90,
        Aquarius: 60,
        Pisces: 70,
      },
      Libra: {
        Aries: 70,
        Taurus: 60,
        Gemini: 90,
        Cancer: 50,
        Leo: 80,
        Virgo: 60,
        Libra: 70,
        Scorpio: 60,
        Sagittarius: 80,
        Capricorn: 60,
        Aquarius: 90,
        Pisces: 50,
      },
      Scorpio: {
        Aries: 50,
        Taurus: 70,
        Gemini: 50,
        Cancer: 90,
        Leo: 60,
        Virgo: 80,
        Libra: 60,
        Scorpio: 70,
        Sagittarius: 60,
        Capricorn: 80,
        Aquarius: 50,
        Pisces: 90,
      },
      Sagittarius: {
        Aries: 90,
        Taurus: 50,
        Gemini: 100,
        Cancer: 60,
        Leo: 90,
        Virgo: 50,
        Libra: 80,
        Scorpio: 60,
        Sagittarius: 70,
        Capricorn: 60,
        Aquarius: 80,
        Pisces: 60,
      },
      Capricorn: {
        Aries: 60,
        Taurus: 80,
        Gemini: 60,
        Cancer: 70,
        Leo: 50,
        Virgo: 90,
        Libra: 60,
        Scorpio: 80,
        Sagittarius: 60,
        Capricorn: 70,
        Aquarius: 60,
        Pisces: 80,
      },
      Aquarius: {
        Aries: 80,
        Taurus: 60,
        Gemini: 90,
        Cancer: 50,
        Leo: 80,
        Virgo: 60,
        Libra: 90,
        Scorpio: 50,
        Sagittarius: 80,
        Capricorn: 60,
        Aquarius: 70,
        Pisces: 60,
      },
      Pisces: {
        Aries: 50,
        Taurus: 90,
        Gemini: 60,
        Cancer: 80,
        Leo: 60,
        Virgo: 70,
        Libra: 50,
        Scorpio: 90,
        Sagittarius: 60,
        Capricorn: 80,
        Aquarius: 60,
        Pisces: 70,
      },
    };
    return compatibilityMatrix[sign1][sign2];
  };

  return (
    <UpAppearTransition>
      <div className="flex flex-col items-center space-y-6 p-6 bg-background pt-16 sm:pt-8 md:pt-12 lg:pt-16 xl:pt-20">
        <h1 className="text-2xl font-bold text-primary sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-center mx-auto">
          {t("compatibility.title")}
        </h1>
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 pt-16 sm:pt-8 md:pt-12 lg:pt-16 xl:pt-20">
          <Popover open={open1} onOpenChange={setOpen1}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open1}
                className="w-full sm:w-[280px] justify-between"
              >
                {value1
                  ? customers.find(
                      (customer: Customer): boolean => customer.id === value1
                    )?.name +
                    " " +
                    customers.find(
                      (customer: Customer): boolean => customer.id === value1
                    )?.surname +
                    " (" +
                    getAstrologicalSign(
                      new Date(
                        customers.find(
                          (customer: Customer): boolean =>
                            customer.id === value1
                        )?.birth_date!
                      )
                    ) +
                    ")"
                  : t("shadcn.compatibility.combobox")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full sm:w-[200px] p-0">
              <Command>
                <CommandInput placeholder={t("compatibility.search")} />
                <CommandList>
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map(
                      (customer: Customer): JSX.Element => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id}
                          onSelect={(currentValue: string): void => {
                            setValue1(
                              currentValue === value1 ? "" : currentValue
                            );
                            setOpen1(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value1 === customer.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {customer.name} {customer.surname} (
                          {getAstrologicalSign(new Date(customer.birth_date))})
                        </CommandItem>
                      )
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button onClick={calculateCompatibility} className="px-6">
            {t("compatibility.calculate")}
          </Button>
          <Popover open={open2} onOpenChange={setOpen2}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open2}
                className="w-full sm:w-[280px] justify-between"
              >
                {value2
                  ? customers.find(
                      (customer: Customer): boolean => customer.id === value2
                    )?.name +
                    " " +
                    customers.find(
                      (customer: Customer): boolean => customer.id === value2
                    )?.surname +
                    " (" +
                    getAstrologicalSign(
                      new Date(
                        customers.find(
                          (customer: Customer): boolean =>
                            customer.id === value2
                        )?.birth_date!
                      )
                    ) +
                    ")"
                  : t("shadcn.compatibility.combobox")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full sm:w-[200px] p-0">
              <Command>
                <CommandInput placeholder={t("compatibility.search")} />
                <CommandList>
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map(
                      (customer: Customer): JSX.Element => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id}
                          onSelect={(currentValue: string): void => {
                            setValue2(
                              currentValue === value2 ? "" : currentValue
                            );
                            setOpen2(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value2 === customer.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {customer.name} {customer.surname} (
                          {getAstrologicalSign(new Date(customer.birth_date))})
                        </CommandItem>
                      )
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-6 space-y-6 sm:space-y-0">
          {value1 && (
            <div className="flex flex-col items-center">
              <Image
                src={`/${getAstrologicalSign(
                  new Date(
                    customers.find(
                      (customer: Customer): boolean => customer.id === value1
                    )?.birth_date!
                  )
                ).toLowerCase()}.png`}
                alt={getAstrologicalSign(
                  new Date(
                    customers.find(
                      (customer: Customer): boolean => customer.id === value1
                    )?.birth_date!
                  )
                )}
                width={100}
                height={100}
              />
            </div>
          )}
          {value2 && (
            <div className="flex flex-col items-center">
              <Image
                src={`/${getAstrologicalSign(
                  new Date(
                    customers.find(
                      (customer: Customer): boolean => customer.id === value2
                    )?.birth_date!
                  )
                ).toLowerCase()}.png`}
                alt={getAstrologicalSign(
                  new Date(
                    customers.find(
                      (customer: Customer): boolean => customer.id === value2
                    )?.birth_date!
                  )
                )}
                width={100}
                height={100}
              />
            </div>
          )}
        </div>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        <div className="w-32 h-32 mt-4">
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            styles={buildStyles({
              pathColor: `rgba(62, 152, 199, ${progress / 100})`,
              textColor: "#3e98c7",
            })}
          />
        </div>
      </div>
    </UpAppearTransition>
  );
}
