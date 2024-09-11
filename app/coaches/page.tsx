"use client";

import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
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
import { Edit } from "@/components/coach/edit-dialog";
import { Add } from "@/components/coach/add-dialog";
import SearchBar from "@/components/searchbar";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from "xlsx";
import { useTranslation } from "next-i18next";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import UpAppearTransition from "@/components/UpAppearTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckedState } from "@radix-ui/react-checkbox";

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
  profil_picture_url: string | null;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

export default function LoginPage(): ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [selectedCoaches, setSelectedCoaches] = useState<Set<string>>(
    new Set()
  );
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const currentPage: number = parseInt(searchParams.get("page") || "1", 10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<{
    column: string;
    order: "asc" | "desc";
  }>({ column: "", order: "asc" });
  const { t } = useTranslation();

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredCoaches);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coaches");
    XLSX.writeFile(workbook, "coaches.xlsx");
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

  const fetchCoaches: (page: number) => Promise<void> = useCallback(
    async (page: number = 1): Promise<void> => {
      setIsLoading(true);
      try {
        const res: Response = await fetch(
          `/api/employees?work=Coach&page=${page}&limit=10`,
          {
            method: "GET",
            headers,
          }
        );
        const data: any = await res.json();
        setCoaches(data.employees);
        setTotalPages(data.totalPages);
        setTotalEmployees(data.totalEmployees);
      } catch (error) {
        console.error("Error fetching coaches:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [headers]
  );

  const filterCoaches: () => void = useCallback((): void => {
    const searchedCoaches: Coach[] = coaches.filter(
      (coach: Coach): boolean =>
        coach.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        coach.surname.toLowerCase().includes(searchFilter.toLowerCase()) ||
        coach.email.toLowerCase().includes(searchFilter.toLowerCase())
    );
    setFilteredCoaches(searchedCoaches);
  }, [coaches, searchFilter]);

  const sortCoaches: (column: keyof Coach) => void = (
    column: keyof Coach
  ): void => {
    const newOrder: "asc" | "desc" = sortOrder.order === "asc" ? "desc" : "asc";
    const sortedCoaches: Coach[] = [...filteredCoaches].sort(
      (a: Coach, b: Coach): number => {
        const aValue: string = a[column]
          ? a[column]
              .toString()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          : "";

        const bValue: string = b[column]
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
    setFilteredCoaches(sortedCoaches);
    setSortOrder({ column, order: newOrder });
  };

  useEffect((): void => {
    fetchCoaches(currentPage);
  }, [fetchCoaches, currentPage]);

  useEffect((): void => {
    filterCoaches();
  }, [searchFilter, coaches, filterCoaches]);

  const handleDeleteClick: (coach: Coach) => void = (coach: Coach): void => {
    setCurrentCoach(coach);
    setShowAlert(true);
  };

  const handleEditClick: (coach: Coach) => void = (coach: Coach): void => {
    setCurrentCoach(coach);
    setEditDialogOpen(true);
  };

  const handleAddClick: () => void = (): void => {
    setAddDialogOpen(true);
  };

  const handleAlertClose: () => void = (): void => {
    setShowAlert(false);
  };

  const handleAlertConfirm: (coach: Coach | null) => Promise<void> = async (
    coach: Coach | null
  ) => {
    if (!coach) {
      throw new Error("Coach is null");
    }
    const response = await fetch(`/api/employees/${coach.id}`, {
      method: "DELETE",
      headers,
    });
    if (response.ok) {
      handleAlertClose();
      fetchCoaches(currentPage);
    } else {
      console.error("Failed to delete coach");
    }
  };

  const handleBulkDelete: () => Promise<void> = async (): Promise<void> => {
    const deletePromises: Promise<Response>[] = Array.from(selectedCoaches).map(
      (customerId: string): Promise<Response> =>
        fetch(`/api/employees/${customerId}`, {
          method: "DELETE",
          headers,
        })
    );

    await Promise.all(deletePromises);
    setSelectedCoaches(new Set());
    fetchCoaches(currentPage);
  };

  const handleAddClose: () => void = (): void => {
    setAddDialogOpen(false);
    fetchCoaches(currentPage);
  };

  const handleEditClose: () => void = (): void => {
    setEditDialogOpen(false);
    fetchCoaches(currentPage);
  };

  const handleSelectAll: (checked: boolean) => void = (
    checked: boolean
  ): void => {
    if (checked) {
      const allCoachIds = new Set(
        filteredCoaches.map((coach: Coach): string => coach.id)
      );
      setSelectedCoaches(allCoachIds);
    } else {
      setSelectedCoaches(new Set());
    }
  };

  const handleSelectCoach: (coachId: string, checked: boolean) => void = (
    coachId: string,
    checked: boolean
  ) => {
    const newSelectedCoaches = new Set(selectedCoaches);
    if (checked) {
      newSelectedCoaches.add(coachId);
    } else {
      newSelectedCoaches.delete(coachId);
    }
    setSelectedCoaches(newSelectedCoaches);
  };

  return (
    <UpAppearTransition>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 my-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("coaches.title")}</CardTitle>
            <CardDescription>
              {t("coaches.total")} {totalEmployees}{" "}
              {totalEmployees > 1 ? "coaches" : "coach"}.
            </CardDescription>
            <div className="p-4"></div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2"></div>
              <div className="flex items-center gap-2">
                <SearchBar
                  searchFilter={searchFilter}
                  setSearchFilter={setSearchFilter}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={handleExport}
                >
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                  </span>
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={handleAddClick}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t("coaches.add")}
                  </span>
                </Button>
                {selectedCoaches.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 gap-1"
                    onClick={handleBulkDelete}
                  >
                    <Trash className="h-3.5 w-3.5" />
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
              <Skeleton className="h-56 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={
                          filteredCoaches.length > 0 &&
                          selectedCoaches.size === filteredCoaches.length
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
                        onClick={(): void => sortCoaches("name")}
                      >
                        {t("coaches.name")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={(): void => sortCoaches("email")}
                      >
                        {t("coaches.email")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("coaches.phone")}</TableHead>
                    <TableHead>
                      <span>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoaches.length > 0 ? (
                    filteredCoaches.map(
                      (coach: Coach): ReactElement => (
                        <TableRow key={coach.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCoaches.has(coach.id)}
                              onCheckedChange={(checked: CheckedState): void =>
                                handleSelectCoach(coach.id, !!checked)
                              }
                              aria-label="Select coach"
                            />
                          </TableCell>
                          <TableCell className="font-medium flex items-center space-x-2">
                            <Avatar>
                              {coach.profil_picture_url !== null ? (
                                <AvatarImage
                                  src={coach.profil_picture_url}
                                  alt="Coach"
                                />
                              ) : null}
                              <AvatarFallback>{`${coach.name[0]}${coach.surname[0]}`}</AvatarFallback>
                            </Avatar>
                            <span>
                              {coach.name} {coach.surname}
                            </span>
                          </TableCell>
                          <TableCell>{coach.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {coach.phone_number}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={(): void => handleEditClick(coach)}
                                >
                                  {t("coaches.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(): void => handleDeleteClick(coach)}
                                >
                                  {t("coaches.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        {t("coaches.no_results")}
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
            onConfirm={(): Promise<void> => handleAlertConfirm(currentCoach)}
          />
        )}
        <Edit
          isOpen={editDialogOpen}
          onClose={handleEditClose}
          coach={currentCoach}
        />
        {addDialogOpen && (
          <Add isOpen={addDialogOpen} onClose={handleAddClose} />
        )}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${Math.max(
                  1,
                  currentPage - 1
                )}&limit=10&work=Coach`}
              />
            </PaginationItem>
            {Array.from(
              { length: totalPages },
              (_: unknown, index: number): ReactElement => (
                <PaginationItem key={index}>
                  <PaginationLink
                    href={`?page=${index + 1}&limit=10&work=Coach`}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href={`?page=${Math.min(
                  totalPages,
                  currentPage + 1
                )}&limit=10&work=Coach`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>
    </UpAppearTransition>
  );
}
