import { toast } from "sonner";
import { InferResponseType } from "hono";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.plaid["create-link-token"]["$post"], 200>;

export const useCreateLinkToken = () => {
  const { getToken } = useAuth();

  const mutation = useMutation<
    ResponseType,
    Error
  >({
    mutationFn: async () => {
      const token = await getToken();
      const response = await client.api.plaid["create-link-token"].$post({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw Error("Failed to create link token");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Link token created");
    },
    onError: () => {
      toast.error("Failed to create link token");
    },
  });

  return mutation;
};
