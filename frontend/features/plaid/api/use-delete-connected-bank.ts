import { toast } from "sonner";
import { InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.plaid["connected-bank"]["$delete"], 200>;

export const useDeleteConnectedBank = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error
  >({
    mutationFn: async () => {
      const token = await getToken();
      const response = await client.api.plaid["connected-bank"].$delete({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw Error("Failed to delete connected bank");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Connected bank deleted");
      queryClient.invalidateQueries({ queryKey: ["connected-bank"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: () => {
      toast.error("Failed to delete connected bank");
    },
  });

  return mutation;
};
