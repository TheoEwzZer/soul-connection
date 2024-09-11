"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { EventString } from "@/app/api/events/route";
import { format, parseISO, getYear } from "date-fns";
import { useTranslation } from "next-i18next";

export const description = "A bar chart";

const chartConfig: {
  events: {
    label: string;
    color: string;
  };
} = {
  events: {
    label: "Number of Events",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

export function Barcharts(): ReactElement {
  const [events, setEvents] = useState<EventString[]>([]);
  const [chartData, setChartData] = useState<
    { month: string; events: number }[]
  >([]);
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
    const fetchEvents: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/events", {
          method: "GET",
          headers,
        });
        const data: EventString[] = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [headers]);

  useEffect((): void => {
    const countEventsByMonth: () => void = (): void => {
      const currentYear: number = getYear(new Date());
      const months: string[] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const eventCounts: {
        month: string;
        events: number;
      }[] = months.map(
        (
          month: string
        ): {
          month: string;
          events: number;
        } => ({
          month,
          events: 0,
        })
      );

      events.forEach((event: EventString): void => {
        const eventDate: Date = parseISO(event.date.toString());
        const eventYear: number = getYear(eventDate);
        if (eventYear === currentYear) {
          const eventMonth: string = format(eventDate, "MMMM");
          const monthData:
            | {
                month: string;
                events: number;
              }
            | undefined = eventCounts.find(
            (data: { month: string; events: number }): boolean =>
              data.month === eventMonth
          );
          if (monthData) {
            monthData.events += 1;
          }
        }
      });

      setChartData(eventCounts);
    };

    countEventsByMonth();
  }, [events]);

  const currentYear: number = getYear(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analytics.number_of_events")}</CardTitle>
        <CardDescription>
          {t("analytics.january")} - {t("analytics.december")} {currentYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="events" fill="var(--color-events)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
