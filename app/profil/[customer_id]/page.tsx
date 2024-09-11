"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Mail } from "lucide-react";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Customer, Encounter, PaymentHistory } from "@prisma/client";
import { useTranslation } from "next-i18next";
import UpAppearTransition from "@/components/UpAppearTransition";
import CircularLoader from "@/components/circular-loader";
import { translateText } from "@/app/api/deepl/translation";
import i18n from "@/i18n";

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

export default function CustomerDetails({
  params,
}: {
  params: { customer_id: string };
}): ReactElement {
  const router: AppRouterInstance = useRouter();
  const { customer_id } = params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentsHistory, setPaymentsHistory] = useState<
    PaymentHistory[] | null
  >([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [translatedEncounters, setTranslatedEncounters] = useState<Encounter[]>(
    []
  );
  const { t } = useTranslation();

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
    const fetchCustomer: () => Promise<void> = async (): Promise<void> => {
      const res: Response = await fetch(`/api/customers/${customer_id}`, {
        method: "GET",
        headers,
      });
      const data: any = await res.json();
      setCustomer(data);
    };

    const fetchPaymentsHistory: () => Promise<void> =
      async (): Promise<void> => {
        try {
          const res: Response = await fetch(
            `/api/customers/${customer_id}/payments_history`,
            {
              method: "GET",
              headers,
            }
          );
          const data: any = await res.json();
          if (data.detail) {
            setPaymentsHistory(null);
            return;
          }
          setPaymentsHistory(data);
        } catch (error) {
          console.error("Error fetching payments history:", error);
          setPaymentsHistory(null);
        }
      };

    const fetchEncounters: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch(
          `/api/encounters/customer/${customer_id}`,
          {
            method: "GET",
            headers,
          }
        );
        const data: any = await res.json();
        setEncounters(data);
      } catch (error) {
        console.error("Error fetching encounters:", error);
      }
    };

    fetchCustomer();
    fetchPaymentsHistory();
    fetchEncounters();
  }, [headers, customer_id]);

  useEffect(() => {
    const translateEncounters = async () => {
      if (i18n.language === "fr") {
        const translated = await Promise.all(
          encounters.map(async (encounter) => {
            const translatedComment = encounter.comment
              ? await translateText(encounter.comment, "FR")
              : encounter.comment;
            return { ...encounter, comment: translatedComment };
          })
        );
        setTranslatedEncounters(translated);
      } else {
        setTranslatedEncounters(encounters);
      }
    };

    if (encounters.length > 0) {
      translateEncounters();
    }
  }, [encounters]);

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularLoader size="lg" />
      </div>
    );
  }

  const totalEncounters: number = encounters.length;
  const positiveEncounters: number = encounters.filter(
    (encounter: Encounter): boolean => encounter.rating > 2
  ).length;

  const handleWardrobeClick = (): void => {
    router.push(`/clothes/${customer_id}`);
  };

  return (
    <UpAppearTransition>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow pt-16">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">
                {t("profile.details")} {customer.name} {customer.surname}
              </h1>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={(): void => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("profile.back")}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-6">
                <Card>
                  <CardHeader className="flex flex-col items-center">
                    <Avatar className="w-24 h-24">
                      {customer.profil_picture_url !== null ? (
                        <AvatarImage
                          src={customer.profil_picture_url}
                          alt="Customer"
                        />
                      ) : null}
                      <AvatarFallback>{`${customer.name[0]}${customer.surname[0]}`}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="mt-4 pb:8">
                      {customer.name} {customer.surname}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.contact_wardrobe")}</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full mt-4 flex justify-around items-center">
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Mail className="h-6 w-6" />
                      <span className="ml-2">{t("profile.send")}</span>
                    </a>
                    <div
                      onClick={handleWardrobeClick}
                      className="cursor-pointer bg-blue-500 text-white p-4 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-center">
                        <Star className="h-6 w-6" />
                        <span className="ml-2">{t("profile.wardrobe")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.statistics")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{totalEncounters}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("profile.total")}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{positiveEncounters}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("profile.positive")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.short_details")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>{t("profile.id")}</strong>{" "}
                      {customer.id.toString()}
                    </p>
                    <p>
                      <strong>Email:</strong> {customer.email}
                    </p>
                    <p>
                      <strong>{t("profile.address")}</strong> {customer.address}
                    </p>
                    <p>
                      <strong>Description:</strong> {customer.description}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.recent")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>{t("profile.rating")}</TableHead>
                          <TableHead>{t("profile.comment")}</TableHead>
                          <TableHead>Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {translatedEncounters.map(
                          (encounter: Encounter): ReactElement => (
                            <TableRow key={encounter.id.toString()}>
                              <TableCell>
                                {new Date(encounter.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(
                                    (star: number): ReactElement => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= encounter.rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {encounter.comment || "No comment"}
                              </TableCell>
                              <TableCell>{encounter.source}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {paymentsHistory === null ? null : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("analytics.history")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("analytics.customer")}</TableHead>
                            <TableHead>{t("analytics.date")}</TableHead>
                            <TableHead>{t("analytics.method")}</TableHead>
                            <TableHead>{t("analytics.comment")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsHistory.map(
                            (payment: PaymentHistory): ReactElement => (
                              <TableRow key={payment.id.toString()}>
                                <TableCell>
                                  {new Date(payment.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{payment.payment_method}</TableCell>
                                <TableCell>${payment.amount}</TableCell>
                                <TableCell>
                                  {payment.comment || "No comment"}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </UpAppearTransition>
  );
}
