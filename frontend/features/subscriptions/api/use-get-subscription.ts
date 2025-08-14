import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

export const useGetSubscription = () => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.subscriptions.current.$get({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
