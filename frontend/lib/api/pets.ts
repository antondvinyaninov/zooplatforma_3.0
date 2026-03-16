import { apiClient } from './client';
import { Pet } from './types';

// API методы для питомцев
export const petsApi = {
  getUserPets: (userId: number) => apiClient.get<Pet[]>(`/api/pets/user/${userId}`),
  getCuratedPets: (userId: number) => apiClient.get<Pet[]>(`/api/pets/curated/${userId}`),

  create: (data: { name: string; species?: string; photo?: string }) =>
    apiClient.post<Pet>('/api/pets', data),

  delete: (id: number) => apiClient.delete<{ message: string }>(`/api/pets/${id}`),
};
