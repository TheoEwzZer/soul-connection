"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DayPilot } from "@daypilot/daypilot-lite-react";
import { EventString } from "@/app/api/events/route";

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

interface Coach {
  id: string;
  email: string;
  name: string;
  surname: string;
  work: string;
  phone_number: string;
  customer_count: number;
  birth_date: string;
  gender: "Male" | "Female";
}

interface CoachOption {
  label: string;
  value: string;
}

interface EditProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: DayPilot.Date;
  duration: number;
  onSuccess: () => void;
  event: EventString;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  max_participants: z
    .string()
    .min(1, "Max participants is required")
    .transform((val: string): number => parseInt(val, 10))
    .refine((val: number): boolean => !isNaN(val), {
      message: "Max participants must be a number",
    }),
  location_x: z.string().min(1, "Location X is required"),
  location_y: z.string().min(1, "Location Y is required"),
  type: z.string().min(1, "Type is required"),
  employee_id: z.string(),
  location_name: z.string().min(1, "Location name is required"),
});

type FormData = z.infer<typeof formSchema>;

export function Edit({
  isOpen,
  onClose,
  startDate,
  duration,
  onSuccess,
  event,
}: EditProps): ReactElement {
  const form: UseFormReturn<
    {
      name: string;
      max_participants: number;
      location_x: string;
      location_y: string;
      type: string;
      employee_id: string;
      location_name: string;
    },
    any,
    undefined
  > = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event.name,
      max_participants: event.max_participants,
      location_x: event.location_x,
      location_y: event.location_y,
      type: event.type,
      employee_id: event.employee_id,
      location_name: event.location_name,
    },
  });

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

  const onSubmit: (data: FormData) => Promise<void> = async (
    data: FormData
  ): Promise<void> => {
    const eventData = {
      ...data,
      date: startDate.toDate(),
      duration: duration,
    };
    const response = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(eventData),
    });
    if (response.ok) {
      onClose();
      onSuccess();
    } else {
      console.error("Failed to update event", response);
    }
  };

  const [coaches, setCoaches] = useState<CoachOption[]>([]);

  const fetchCoaches: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/employees?work=Coach", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        const coachOptions: CoachOption[] = data.employees.map(
          (coach: Coach): CoachOption => ({
            label: `${coach.name} ${coach.surname}`,
            value: coach.id,
          })
        );
        setCoaches(coachOptions);
      } catch (error) {
        console.error("Error fetching coaches:", error);
      }
    }, [headers]);

  useEffect((): void => {
    fetchCoaches();
  }, [fetchCoaches]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max participants</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location_x"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location X</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location_y"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Y</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Coach</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-[200px] justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? coaches.find(
                                (coach: CoachOption): boolean =>
                                  coach.value === field.value
                              )?.label
                            : "Select coach"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search coach..." />
                        <CommandList>
                          <CommandEmpty>No coach found.</CommandEmpty>
                          <CommandGroup>
                            {coaches.map(
                              (coach: CoachOption): ReactElement => (
                                <CommandItem
                                  value={coach.label}
                                  key={coach.value}
                                  onSelect={(): void => {
                                    form.setValue("employee_id", coach.value);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      coach.value === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {coach.label}
                                </CommandItem>
                              )
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Edit Event</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
