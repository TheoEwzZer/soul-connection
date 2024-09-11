"use client";

import React, {
  useEffect,
  useState,
  ReactElement,
  useCallback,
  useMemo,
} from "react";
import {
  MoreHorizontal,
  PlusCircle,
  File,
  ArrowUpDown,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert } from "@/components/ui/alert";
import { Edit } from "@/components/customer/edit-dialog";
import { Add } from "@/components/customer/add-dialog";
import SearchBar from "@/components/searchbar";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from "xlsx";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useTranslation } from "next-i18next";
import UpAppearTransition from "@/components/UpAppearTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckedState } from "@radix-ui/react-checkbox";

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
  profil_picture_url: string | null;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

export default function CustomerPage(): ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set()
  );
  const [sortOrder, setSortOrder] = useState<{
    column: string;
    order: "asc" | "desc";
  }>({ column: "", order: "asc" });
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const currentPage: number = parseInt(searchParams.get("page") || "1", 10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const router: AppRouterInstance = useRouter();
  const { t } = useTranslation();

  const handleExport: () => void = (): void => {
    const worksheet = XLSX.utils.json_to_sheet(filteredCustomers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

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

  const fetchCustomers: (page: number) => Promise<void> = useCallback(
    async (page: number = 1): Promise<void> => {
      setIsLoading(true);
      try {
        const res: Response = await fetch(
          `/api/customers?limit=10&page=${page}&limit=10`,
          {
            method: "GET",
            headers,
          }
        );
        const data: any = await res.json();
        setCustomers(data.customers);
        setTotalPages(data.totalPages);
        setTotalCustomers(data.totalCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  const filterCustomers: () => void = useCallback((): void => {
    if (!customers) {
      return;
    }

    const searchedCustomers: Customer[] = customers.filter(
      (customer: Customer): boolean =>
        customer.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        customer.surname.toLowerCase().includes(searchFilter.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchFilter.toLowerCase())
    );
    setFilteredCustomers(searchedCustomers);
  }, [customers, searchFilter]);

  const sortCustomers: (column: keyof Customer) => void = (
    column: keyof Customer
  ): void => {
    const newOrder: "asc" | "desc" = sortOrder.order === "asc" ? "desc" : "asc";
    const sortedCustomers: Customer[] = [...filteredCustomers].sort(
      (a: Customer, b: Customer): number => {
        const aValue: string =
          a && a[column]
            ? a[column]
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            : "";
        const bValue: string =
          b && b[column]
            ? b[column]
                .toString()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            : "";
        return newOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    );
    setFilteredCustomers(sortedCustomers);
    setSortOrder({ column, order: newOrder });
  };

  useEffect((): void => {
    fetchCustomers(currentPage);
  }, [fetchCustomers, currentPage]);

  useEffect((): void => {
    filterCustomers();
  }, [searchFilter, customers, filterCustomers]);

  const handleDeleteClick: (customer: Customer) => void = (
    customer: Customer
  ): void => {
    setCurrentCustomer(customer);
    setShowAlert(true);
  };

  const handleEditClick: (customer: Customer) => void = (
    customer: Customer
  ): void => {
    setCurrentCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleAddClick: () => void = (): void => {
    setAddDialogOpen(true);
  };

  const handleAlertClose: () => void = (): void => {
    setShowAlert(false);
  };

  const handleAlertConfirm: (
    customer: Customer | null
  ) => Promise<void> = async (customer: Customer | null): Promise<void> => {
    if (!customer) {
      throw new Error("Customer is null");
    }
    const response = await fetch(`/api/customers/${customer.id}`, {
      method: "DELETE",
      headers,
    });
    if (response.ok) {
      handleAlertClose();
      fetchCustomers(currentPage);
    } else {
      console.error("Failed to delete customer");
    }
  };

  const handleBulkDelete: () => Promise<void> = async (): Promise<void> => {
    const deletePromises: Promise<Response>[] = Array.from(
      selectedCustomers
    ).map(
      (customerId: string): Promise<Response> =>
        fetch(`/api/customers/${customerId}`, {
          method: "DELETE",
          headers,
        })
    );

    await Promise.all(deletePromises);
    setSelectedCustomers(new Set());
    fetchCustomers(currentPage);
  };

  const handleAddClose: () => void = (): void => {
    setAddDialogOpen(false);
    fetchCustomers(currentPage);
  };

  const handleEditClose: () => void = (): void => {
    setEditDialogOpen(false);
    fetchCustomers(currentPage);
  };

  const handleSelectAll: (checked: boolean) => void = (
    checked: boolean
  ): void => {
    if (checked) {
      const allCustomerIds = new Set(
        filteredCustomers.map((customer: Customer): string => customer.id)
      );
      setSelectedCustomers(allCustomerIds);
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer: (customerId: string, checked: boolean) => void = (
    customerId: string,
    checked: boolean
  ) => {
    const newSelectedCustomers = new Set(selectedCustomers);
    if (checked) {
      newSelectedCustomers.add(customerId);
    } else {
      newSelectedCustomers.delete(customerId);
    }
    setSelectedCustomers(newSelectedCustomers);
  };

  const renderPaginationItems = () => {
    const paginationItems = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let page = startPage; page <= endPage; page++) {
      paginationItems.push(
        <PaginationItem key={page}>
          <PaginationLink
            href={`?limit=10&page=${page}`}
            isActive={currentPage === page}
            className="text-xs sm:text-sm"
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return paginationItems;
  };

  return (
    <UpAppearTransition>
      <main className="grid flex-1 items-start gap-2 p-2 sm:px-4 sm:py-2 md:gap-4 my-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-left text-sm sm:text-base md:text-lg">
                  {t("customers.title")}
                </CardTitle>
                <CardDescription className="text-left text-xs sm:text-sm md:text-base">
                  {t("customers.total")} {totalCustomers}{" "}
                  {totalCustomers > 1 ? "customers" : "customers"}.
                </CardDescription>
              </div>
              <div className="flex justify-start items-center gap-1 sm:gap-2">
                <SearchBar
                  searchFilter={searchFilter}
                  setSearchFilter={setSearchFilter}
                  className="w-24 sm:w-32 md:w-48"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 sm:h-8 gap-1"
                  onClick={handleExport}
                >
                  <File className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                  </span>
                </Button>
                <Button
                  size="sm"
                  className="h-6 sm:h-8 gap-1"
                  onClick={handleAddClick}
                >
                  <PlusCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t("customers.add")}
                  </span>
                </Button>
                {selectedCustomers.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 sm:h-8 gap-1"
                    onClick={handleBulkDelete}
                  >
                    <Trash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Delete selected
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 sm:h-56 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={
                          filteredCustomers.length > 0 &&
                          selectedCustomers.size === filteredCustomers.length
                        }
                        onCheckedChange={(checked: CheckedState): void =>
                          handleSelectAll(!!checked)
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={(): void => sortCustomers("name")}
                        className="text-xs sm:text-sm"
                      >
                        {t("customers.name")}
                        <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={(): void => sortCustomers("email")}
                        className="text-xs sm:text-sm"
                      >
                        {t("customers.email")}
                        <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-xs sm:text-sm">
                      {t("customers.phone")}
                    </TableHead>
                    <TableHead>
                      <span className="text-xs sm:text-sm">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(
                      (customer: Customer): ReactElement => {
                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCustomers.has(customer.id)}
                                onCheckedChange={(
                                  checked: CheckedState
                                ): void =>
                                  handleSelectCustomer(customer.id, !!checked)
                                }
                                aria-label="Select customer"
                              />
                            </TableCell>
                            <TableCell className="font-medium flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                                {customer.profil_picture_url !== null ? (
                                  <AvatarImage
                                    src={customer.profil_picture_url}
                                    alt="Customer"
                                  />
                                ) : null}
                                <AvatarFallback>{`${customer.name[0]}${customer.surname[0]}`}</AvatarFallback>
                              </Avatar>
                              <span>
                                {customer.name} {customer.surname}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                              {customer.email}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                              {customer.phone_number}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 sm:h-8 sm:w-8"
                                  >
                                    <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={(): void => {
                                      router.push(`/profil/${customer.id}`);
                                    }}
                                  >
                                    {t("customers.view")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(): void =>
                                      handleEditClick(customer)
                                    }
                                  >
                                    {t("customers.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(): void =>
                                      handleDeleteClick(customer)
                                    }
                                  >
                                    {t("customers.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs sm:text-sm">
                        {t("customers.no_results")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {showAlert && (
          <Alert
            isOpen={showAlert}
            onClose={handleAlertClose}
            onConfirm={(): Promise<void> => handleAlertConfirm(currentCustomer)}
          />
        )}
        <Edit
          isOpen={editDialogOpen}
          onClose={handleEditClose}
          customer={currentCustomer}
        />
        {addDialogOpen && (
          <Add isOpen={addDialogOpen} onClose={handleAddClose} />
        )}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?limit=10&page=${Math.max(1, currentPage - 1)}`}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                href={`?limit=10&page=${Math.min(totalPages, currentPage + 1)}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>
    </UpAppearTransition>
  );
}