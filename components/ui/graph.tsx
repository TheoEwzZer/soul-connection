"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector, Cell } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useTranslation } from "next-i18next";

interface Encounter {
  id: string;
  customer_id: string;
  date: Date;
  rating: number;
  source: string;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

const amountData: {
  source: string;
  amount: number;
  fill: string;
}[] = [
  { source: "concert", amount: 0, fill: "var(--color-concert)" },
  { source: "datingApp", amount: 0, fill: "var(--color-datingApp)" },
  { source: "socialMedia", amount: 0, fill: "var(--color-socialMedia)" },
  { source: "travelGroup", amount: 0, fill: "var(--color-travelGroup)" },
  { source: "school", amount: 0, fill: "var(--color-school)" },
];

const chartConfig: {
  concert: {
    label: string;
    color: string;
  };
  datingApp: {
    label: string;
    color: string;
  };
  socialMedia: {
    label: string;
    color: string;
  };
  travelGroup: {
    label: string;
    color: string;
  };
  school: {
    label: string;
    color: string;
  };
} = {
  concert: {
    label: "Concert",
    color: "hsl(var(--chart-1))",
  },
  datingApp: {
    label: "Dating App",
    color: "hsl(var(--chart-2))",
  },
  socialMedia: {
    label: "Social Media",
    color: "hsl(var(--chart-3))",
  },
  travelGroup: {
    label: "Travel Group",
    color: "hsl(var(--chart-4))",
  },
  school: {
    label: "School",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function Graph(): React.ReactElement {
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState<boolean>(true);

  const headers: HeadersInit = React.useMemo((): Record<string, string> => {
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

  React.useEffect((): void => {
    const fetchEncounters: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/encounters", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        amountData.forEach(
          (item: { source: string; amount: number; fill: string }): void => {
            const count: number = data.filter(
              (encounter: Encounter): boolean =>
                encounter.source.replace(/\s+/g, "").toLowerCase() ===
                item.source.replace(/\s+/g, "").toLowerCase()
            ).length;
            item.amount = count;
          }
        );
      } catch (error) {
        console.error("Error fetching encounters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEncounters();
  }, [headers]);

  const id = "pie-interactive";
  const [activeSource, setActiveSource] = React.useState(amountData[0].source);
  const activeIndex: number = React.useMemo(
    (): number =>
      amountData.findIndex(
        (item: { source: string; amount: number; fill: string }): boolean =>
          item.source === activeSource
      ),
    [activeSource]
  );
  const sources: string[] = React.useMemo(
    (): string[] =>
      amountData.map(
        (item: { source: string; amount: number; fill: string }): string =>
          item.source
      ),
    []
  );

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>{t("analytics.graph")}</CardTitle>
        </div>
        <Select value={activeSource} onValueChange={setActiveSource}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {loading ? (
              <>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
              </>
            ) : (
              sources.map((key: string): React.ReactElement | null => {
                const config = chartConfig[key as keyof typeof chartConfig];
                if (!config) {
                  return null;
                }
                return (
                  <SelectItem
                    key={key}
                    value={key}
                    className="rounded-lg [&_span]:flex"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-sm"
                        style={{
                          backgroundColor: `var(--color-${key})`,
                        }}
                      />
                      {config?.label}
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={amountData}
                dataKey="amount"
                nameKey="source"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem): React.ReactElement => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 25}
                      innerRadius={outerRadius + 12}
                    />
                  </g>
                )}
              >
                <Label
                  content={({ viewBox }): React.ReactElement | undefined => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {amountData[activeIndex].amount.toLocaleString()}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}