import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetTransaction = (id?: string) => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    enabled: !!id,
    queryKey: ["transaction", { id }],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.transactions[":id"].$get({
        param: { id },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }

      const { data } = await response.json();
      return {
        ...data,
        amount: convertAmountFromMiliunits(data.amount),
      };
    },
  });

  return query;
};
