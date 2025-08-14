import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions[":id"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api.transactions[":id"]["$patch"]>["json"];

export const useEditTransaction = (id?: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    RequestType
  >({
    mutationFn: async (json) => {
      console.log("Edit mutation called with:", json);
      console.log("Transaction ID:", id);
      
      const token = await getToken();
      console.log("Token obtained:", token ? "✓" : "✗");
      
      const response = await client.api.transactions[":id"]["$patch"]({ 
        param: { id },
        json,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);
      
      // Check for API errors
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      // Check for application-level errors
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log("Edit mutation success:", data);
      toast.success("Transaction updated");
      queryClient.invalidateQueries({ queryKey: ["transaction", { id }] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      console.error("Edit mutation error:", error);
      toast.error("Failed to edit transaction");
    },
  });

  return mutation;
};
