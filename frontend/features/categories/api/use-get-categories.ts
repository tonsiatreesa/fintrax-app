import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { client } from "@/lib/hono";

export const useGetCategories = () => {
  const { getToken } = useAuth();
  
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = await getToken();
      const response = await client.api.categories.$get({}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
