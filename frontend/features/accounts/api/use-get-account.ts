import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

export const useGetAccount = (id?: string) => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    enabled: !!id,
    queryKey: ["account", { id }],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.accounts[":id"].$get({
        param: { id },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch account");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
