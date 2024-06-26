"use client";
import { Button } from "@/common/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/common/components/ui/form";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormReturn, useForm } from "react-hook-form";
import { RequestSchema } from "../../domain/entities/request-schema";
import { PrivateRequest } from "../../domain/entities/request-types";
import useCreateRequest from "../../application/usecases/services/useCreateRequest";
import { usePathname } from "next/navigation";
import useHandleFolderState from "@/features/file/application/usecases/services/useHandleFolderState";

export default function CreateRequestForm() {
  const { setRequestCreationProps } = useCreateRequest();
  const pathName = usePathname();

  const form = useForm<PrivateRequest>({
    resolver: zodResolver(RequestSchema),
    defaultValues: {
      name: "",
      description: "",
      maxFileSize: 10,
      maxFiles: 10,
      dateLimit: 0,
    },
  });
  useHandleFolderState();

  function constructUrlWithQueryParams(
    pathName: string,
    form: UseFormReturn<PrivateRequest, any, undefined>
  ): {
    url: string;
    id: string;
  } {
    // Build the query string
    const params = new URLSearchParams();
    const id = crypto.randomUUID();
    params.append("requestId", id);
    params.append("requestName", form.getValues("name"));
    params.append("requestDescription", form.getValues("description") || "");
    params.append(
      "maxFileSize",
      form.getValues("maxFileSize")?.toString() || "10"
    );
    params.append("maxFiles", form.getValues("maxFiles")?.toString() || "10");
    params.append("dateLimit", form.getValues("dateLimit")?.toString() || "");

    return {
      url: `${window.location.origin}/upload/request?${params.toString()}`,
      id,
    };
  }
  async function onSubmit(values: PrivateRequest) {
    const { url, id } = constructUrlWithQueryParams(pathName, form);

    const request: PrivateRequest = {
      ...values,
      numberOfUploads: 0,
      uploads: [],
      id,
      url,
    };

    setRequestCreationProps(request);

    form.reset();
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={field.name}>Request Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter request name" />
                </FormControl>
                <FormDescription>
                  Specify the name for the request
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={field.name}>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter description" />
                </FormControl>
                <FormDescription>
                  Provide a detailed description
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxFileSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={field.name}>Max File Size (MB)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    onChange={(event) => field.onChange(+event.target.value)}
                    placeholder="Maximum file size in MB"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxFiles"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={field.name}>Max Number of Files</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Maximum number of files" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={field.name}>Date Limit</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>
                  Set a deadline for file submissions
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button className="mt-8" type="submit">
              Submit
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
