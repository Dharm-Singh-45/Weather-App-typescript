import { useLocalStorage } from "./useLocalStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface FavoriteCity {
  id: string;
  lat: number;
  lon: number;
  name: string;
  country: string;
  state?: string;
  AddedAt: number;
}
export function useFavorite() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteCity[]>(
    "favorites",
    []
  );

  const queryClient = useQueryClient();
  const favoriteQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favorites,
    initialData: favorites,
    staleTime: Infinity,
  });
  const addFavorite = useMutation({
    mutationFn: async (city: Omit<FavoriteCity, "id" | "AddedAt">) => {
      const newFavorite: FavoriteCity = {
        ...city,
        id: `${city.lat}-${city.lon}`,
        AddedAt: Date.now(),
      };
      const exists = favorites.some((fav) => fav.id === newFavorite.id);
      if (exists) return favorites;

      const newFavorites = [...favorites, newFavorite].slice(0, 10);
      setFavorites(newFavorites);

      return newFavorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["favorites"],
      });
    },
  });
  const removeFavorite = useMutation({
    mutationFn: async (cityId: string) => {
      const newFavorites = favorites.filter((city) => city.id !== cityId);
      setFavorites(newFavorites);

      return newFavorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["favorites"],
      });
    },
  });
  return {
    favorites: favoriteQuery.data,
    addFavorite,
    removeFavorite,
    isFavorite: (lat: number, lon: number) =>
      favorites.some((city) => city.lat === lat && city.lon === lon),
  };
}
