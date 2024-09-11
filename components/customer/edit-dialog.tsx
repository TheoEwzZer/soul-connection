"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

interface Customer {
  id: string;
  email: string;
  name: string;
  surname: string;
  created_at: Date;
  phone_number: string;
  description: string;
  birth_date: Date;
  gender: "Male" | "Female";
  address: string;
  employee_id: string | null;
}

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
  customer: Customer | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email address"),
  birth_date: z.date(),
  gender: z.enum(["Male", "Female"], {
    required_error: "Gender is required",
  }),
  phone_number: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  employee_id: z.string().nullable(),
  description: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function Edit({ isOpen, onClose, customer }: EditProps): ReactElement {
  const form: UseFormReturn<
    {
      name: string;
      surname: string;
      email: string;
      birth_date: Date;
      gender: "Male" | "Female";
      phone_number: string;
      address: string;
      employee_id: string | null;
      description: string;
    },
    any,
    undefined
  > = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      birth_date: new Date(),
      gender: "Male",
      phone_number: "",
      address: "",
      employee_id: null,
      description: "",
    },
  });

  useEffect((): void => {
    if (customer) {
      form.reset({
        name: customer.name,
        surname: customer.surname,
        email: customer.email,
        birth_date: customer.birth_date
          ? new Date(customer.birth_date)
          : new Date(),
        gender: customer.gender,
        phone_number: customer.phone_number,
        address: customer.address,
        employee_id: customer.employee_id,
        description: customer.description,
      });
    }
  }, [customer, form]);

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
    if (!customer) {
      throw new Error("Coach is null");
    }
    const response = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    if (response.ok) {
      onClose();
    } else {
      console.error("Failed to update customer");
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date: Date): boolean =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Male" />
                            </FormControl>
                            <FormLabel className="font-normal">Male</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Female" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Female
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
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
                                        form.setValue(
                                          "employee_id",
                                          coach.value
                                        );
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
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
