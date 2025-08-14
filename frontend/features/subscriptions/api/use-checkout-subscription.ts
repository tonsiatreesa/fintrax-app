import { toast } from "sonner";
import { InferResponseType } from "hono";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.subscriptions.checkout["$post"], 200>;

export const useCheckoutSubscription = () => {
  const { getToken } = useAuth();

  const mutation = useMutation<
    ResponseType,
    Error
  >({
    mutationFn: async () => {
      const token = await getToken();
      const response = await client.api.subscriptions.checkout.$post({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw Error("Failed to create URL");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      window.location.href = data;
    },
    onError: () => {
      toast.error("Failed to create URL");
    },
  });

  return mutation;
};
