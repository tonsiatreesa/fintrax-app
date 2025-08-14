import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

export const useGetConnectedBank = () => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    queryKey: ["connected-bank"],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.plaid["connected-bank"].$get({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch connected bank");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
