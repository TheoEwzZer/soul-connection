"use client";

import { Earth, Heart, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorldMap from "@/components/world";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Graph } from "./ui/graph";
import { Barcharts } from "@/components/bar";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { Event } from "@prisma/client";

interface PaymentsHistory {
  id: string;
  date: Date;
  payment_method: string;
  amount: number;
  comment: string | null;
  customer: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
}

interface Customer {
  id: string;
  name: string;
  surname: string;
  email: string;
  country: string;
  latitude: number;
  longitude: number;
  created_at: Date;
}

interface Encounter {
  id: string;
  customer_id: string;
  date: string;
  rating: number;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

enum Period {
  Day = "day",
  Week = "week",
  Month = "month",
}

export function Dashboard(): ReactElement {
  const { t } = useTranslation();

  const [revenuePeriod, setRevenuePeriod] = useState<Period>(Period.Month);
  const [customersPeriod, setCustomersPeriod] = useState<Period>(Period.Month);
  const [encountersPeriod, setEncountersPeriod] = useState<Period>(
    Period.Month
  );
  const [eventsPeriod, setEventsPeriod] = useState<Period>(Period.Month);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [newCustomers, setNewCustomers] = useState<number>(0);
  const [encountersCount, setEncountersCount] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);

  const [paymentsHistory, setPaymentsHistory] = useState<PaymentsHistory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [loadingPayments, setLoadingPayments] = useState<boolean>(true);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [loadingEncounters, setLoadingEncounters] = useState<boolean>(true);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [loadingCustomerByCountry, setLoadingCustomerByCountry] =
    useState<boolean>(true);
  const [loadingNumberOfEvents, setLoadingNumberOfEvents] =
    useState<boolean>(true);

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
    const fetchPaymentsHistory: () => Promise<void> =
      async (): Promise<void> => {
        try {
          const res: Response = await fetch("/api/payments_history?limit=5", {
            method: "GET",
            headers,
          });
          const data: any = await res.json();
          setPaymentsHistory(data);
        } catch (error) {
          console.error("Error fetching payments history:", error);
        } finally {
          setLoadingPayments(false);
        }
      };

    const fetchCustomers: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/customers", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        setCustomers(data.customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
        setLoadingCustomerByCountry(false);
      }
    };

    const fetchEncounters: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/encounters", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        setEncounters(data);
      } catch (error) {
        console.error("Error fetching encounters:", error);
      } finally {
        setLoadingEncounters(false);
      }
    };

    const fetchEvents: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/events", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
        setLoadingNumberOfEvents(false);
      }
    };

    fetchPaymentsHistory();
    fetchCustomers();
    fetchEncounters();
    fetchEvents();
  }, [headers]);

  useEffect((): void => {
    const now = new Date();
    const filteredPayments: PaymentsHistory[] = paymentsHistory.filter(
      (payment: PaymentsHistory): boolean => {
        const paymentDate = new Date(payment.date);
        if (revenuePeriod === Period.Day) {
          return paymentDate.toDateString() === now.toDateString();
        } else if (revenuePeriod === Period.Week) {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return paymentDate >= weekAgo && paymentDate <= now;
        } else if (revenuePeriod === Period.Month) {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return paymentDate >= monthAgo && paymentDate <= now;
        }
        return false;
      }
    );

    const total: number = filteredPayments.reduce(
      (sum: number, payment: PaymentsHistory): number => sum + payment.amount,
      0
    );
    setTotalRevenue(total);
  }, [paymentsHistory, revenuePeriod]);

  useEffect((): void => {
    const now = new Date();
    const filteredCustomers: Customer[] = customers.filter(
      (customer: Customer): boolean => {
        const customerDate = new Date(customer.created_at);
        if (customersPeriod === Period.Day) {
          return customerDate.toDateString() === now.toDateString();
        } else if (customersPeriod === Period.Week) {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return customerDate >= weekAgo && customerDate <= now;
        } else if (customersPeriod === Period.Month) {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return customerDate >= monthAgo && customerDate <= now;
        }
        return false;
      }
    );

    setNewCustomers(filteredCustomers.length);
  }, [customers, customersPeriod]);

  useEffect((): void => {
    const now = new Date();
    const filteredEncounters: Encounter[] = encounters.filter(
      (encounter: Encounter): boolean => {
        const encounterDate = new Date(encounter.date);
        if (encountersPeriod === Period.Day) {
          return encounterDate.toDateString() === now.toDateString();
        } else if (encountersPeriod === Period.Week) {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return encounterDate >= weekAgo && encounterDate <= now;
        } else if (encountersPeriod === Period.Month) {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return encounterDate >= monthAgo && encounterDate <= now;
        }
        return false;
      }
    );

    setEncountersCount(filteredEncounters.length);
  }, [encounters, encountersPeriod]);

  useEffect((): void => {
    const now = new Date();
    const filteredEvents: Event[] = events.filter((event: Event): boolean => {
      const eventDate = new Date(event.date);
      if (eventsPeriod === Period.Day) {
        return eventDate.toDateString() === now.toDateString();
      } else if (eventsPeriod === Period.Week) {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return eventDate >= weekAgo && eventDate <= now;
      } else if (eventsPeriod === Period.Month) {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return eventDate >= monthAgo && eventDate <= now;
      }
      return false;
    });

    setEventsCount(filteredEvents.length);
  }, [events, eventsPeriod]);

  const renderPeriodButtons = (
    selectedPeriod: Period,
    setSelectedPeriod: React.Dispatch<React.SetStateAction<Period>>
  ): ReactElement => (
    <div className="flex gap-1 flex-wrap justify-center">
      <Button
        size="sm"
        variant={selectedPeriod === Period.Day ? "default" : "outline"}
        onClick={(): void => setSelectedPeriod(Period.Day)}
        className="w-full sm:w-auto"
      >
        D
      </Button>
      <Button
        size="sm"
        variant={selectedPeriod === Period.Week ? "default" : "outline"}
        onClick={(): void => setSelectedPeriod(Period.Week)}
        className="w-full sm:w-auto"
      >
        W
      </Button>
      <Button
        size="sm"
        variant={selectedPeriod === Period.Month ? "default" : "outline"}
        onClick={(): void => setSelectedPeriod(Period.Month)}
        className="w-full sm:w-auto"
      >
        M
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-2 sm:p-4 md:p-8 lg:p-12">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 pb-2">
              <div className="flex items-center">
                <CardTitle className="text-sm font-medium">
                  {t("analytics.revenue")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
              <div className="flex items-center gap-2">
                {renderPeriodButtons(revenuePeriod, setRevenuePeriod)}
              </div>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{totalRevenue}€</div>
              )}
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-1">
            <CardHeader className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 pb-2">
              <div className="flex items-center">
                <CardTitle className="text-sm font-medium">
                  {t("analytics.customers")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
              <div className="flex items-center gap-2">
                {renderPeriodButtons(customersPeriod, setCustomersPeriod)}
              </div>
            </CardHeader>
            <CardContent>
              {loadingCustomers ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{newCustomers}</div>
              )}
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-2">
            <CardHeader className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 pb-2">
              <div className="flex items-center">
                <CardTitle className="text-sm font-medium">
                  {t("analytics.encounters")}
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
              <div className="flex items-center gap-2">
                {renderPeriodButtons(encountersPeriod, setEncountersPeriod)}
              </div>
            </CardHeader>
            <CardContent>
              {loadingEncounters ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{encountersCount}</div>
              )}
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-3">
            <CardHeader className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 pb-2">
              <div className="flex items-center">
                <CardTitle className="text-sm font-medium">
                  {t("analytics.events")}
                </CardTitle>
                <Earth className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
              <div className="flex items-center gap-2">
                {renderPeriodButtons(eventsPeriod, setEventsPeriod)}
              </div>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{eventsCount}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center">
              <div className="grid gap-2">
                <CardTitle>Transactions</CardTitle>
                <CardDescription>{t("analytics.recent")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingPayments ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] sm:w-auto">
                        {t("analytics.customer")}
                      </TableHead>
                      <TableHead className="w-[100px] sm:w-auto">
                        {t("analytics.date")}
                      </TableHead>
                      <TableHead className="w-[100px] sm:w-auto">
                        {t("analytics.method")}
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {t("analytics.comment")}
                      </TableHead>
                      <TableHead className="text-right w-[80px] sm:w-auto">
                        {t("analytics.amount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsHistory
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .slice(0, 5)
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="font-medium">
                              {payment.customer.name} {payment.customer.surname}
                            </div>
                            <div className="hidden sm:inline text-sm text-muted-foreground">
                              {payment.customer.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(payment.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {payment.comment}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.amount}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Graph />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card x-chunk="dashboard-01-chunk-5">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>{t("analytics.customers")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCustomerByCountry ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                  <WorldMap customers={customers} />
                </div>
              )}
            </CardContent>
          </Card>
          <Card x-chunk="dashboard-01-chunk-6">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>{t("analytics.events")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNumberOfEvents ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                  <Barcharts />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
