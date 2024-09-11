"use client";

import { ReactElement, useState, useEffect, useMemo, ChangeEvent } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Search, FileText, Download, Trash, Plus } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/context/user-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSupabaseClient,
  SupabaseClient,
} from "@supabase/auth-helpers-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EmployeeInfo {
  id: bigint;
  name: string;
  surname: string;
}

interface Document {
  id: bigint;
  name: string;
  type: string;
  size: bigint;
  date: string;
  employee_id: bigint;
  document_url: string;
  employee: EmployeeInfo | null;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  file: z
    .any()
    .refine(
      (file: any): file is File => file instanceof File,
      "File is required"
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function DocumentAccess(): ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { me } = useUser();

  const supabaseClient: SupabaseClient<any, "public", any> =
    useSupabaseClient();
  const form: UseFormReturn<FormData> = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      file: undefined,
    },
  });

  const headers: Record<string, string> = useMemo((): Record<
    string,
    string
  > => {
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

  const formatSize: (bytes: bigint) => string = (bytes: bigint): string => {
    const sizes: string[] = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === BigInt(0)) {
      return "0 Byte";
    }
    const bytesNumber: number = Number(bytes);
    const i: number = Math.floor(Math.log(bytesNumber) / Math.log(1024));
    return (
      parseFloat((bytesNumber / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  useEffect((): void => {
    const fetchDocuments: () => Promise<void> = async (): Promise<void> => {
      try {
        const response = await fetch("/api/documents", {
          method: "GET",
          headers,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const data: Document[] = await response.json();
        setDocuments(data);
        setFilteredDocuments(data);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocuments();
  }, [headers]);

  const handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const term: string = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered: Document[] = documents.filter(
      (doc: Document): boolean =>
        doc.name.toLowerCase().includes(term) ||
        doc.type.toLowerCase().includes(term)
    );
    setFilteredDocuments(filtered);
  };

  const handleDelete: (id: bigint) => Promise<void> = async (
    id: bigint
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      setDocuments((prevDocuments: Document[]): Document[] =>
        prevDocuments.filter((doc: Document): boolean => doc.id !== id)
      );
      setFilteredDocuments((prevDocuments: Document[]): Document[] =>
        prevDocuments.filter((doc: Document): boolean => doc.id !== id)
      );
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const onSubmit: (data: FormData) => Promise<void> = async (
    data: FormData
  ): Promise<void> => {
    try {
      let documentUrl: string = "";
      if (data.file) {
        const { data: uploadData, error: uploadError } =
          await supabaseClient.storage
            .from("documents")
            .upload(data.file.name, data.file);

        if (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
          return;
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from("documents")
          .getPublicUrl(data.file.name);

        documentUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...data,
          document_url: documentUrl,
          size: data.file.size,
          employee_id: me?.id,
          type: data.file.type,
          file_name: data.file.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add document");
      }

      const newDoc: Document = await response.json();
      setDocuments((prevDocs: Document[]): Document[] => [...prevDocs, newDoc]);
      setFilteredDocuments((prevDocs: Document[]): Document[] => [
        ...prevDocs,
        newDoc,
      ]);
      setIsAddModalOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documents access</CardTitle>
              <CardDescription>
                Search and access your stored documents
              </CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Add New Document</DialogTitle>
                      <DialogDescription>
                        Upload a new document to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                        name="file"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                onChange={(
                                  e: ChangeEvent<HTMLInputElement>
                                ): void => {
                                  if (e.target.files && e.target.files[0]) {
                                    field.onChange(e.target.files[0]);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Document</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="text-gray-400" />
            <Input
              type="text"
              placeholder="Search for a document..."
              value={searchTerm}
              onChange={handleSearch}
              className="flex-grow"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map(
                (doc: Document): ReactElement => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc?.type?.split("/").pop()?.toUpperCase() || ""}
                    </TableCell>
                    <TableCell>{formatSize(doc.size)}</TableCell>
                    <TableCell>
                      {format(new Date(doc.date), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {doc.employee
                        ? `${doc.employee.name} ${doc.employee.surname}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(): Window | null =>
                            window.open(doc.document_url, "_blank")
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        {me && doc.employee_id === me.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(): Promise<void> => handleDelete(doc.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            {filteredDocuments.length} document(s) found
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
