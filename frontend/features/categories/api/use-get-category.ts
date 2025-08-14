import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

export const useGetCategory = (id?: string) => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    enabled: !!id,
    queryKey: ["category", { id }],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.categories[":id"].$get({
        param: { id },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
