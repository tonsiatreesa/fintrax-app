import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

export const useGetAccounts = () => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.accounts.$get({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
