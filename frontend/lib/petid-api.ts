const PETID_API_URL = process.env.NEXT_PUBLIC_PETID_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Типы событий
export type PetEventType =
  | 'registration'
  | 'ownership_change'
  | 'sterilization'
  | 'vaccination'
  | 'treatment'
  | 'lost'
  | 'found'
  | 'death'
  | 'shelter_intake'
  | 'adoption';

export type DeathReason = 'natural' | 'euthanasia' | 'accident' | 'disease';

// Интерфейс события питомца
export interface PetEvent {
  id: number;
  pet_id: number;
  event_type: PetEventType;
  event_date: string;

  // Кто создал событие
  created_by_user_id?: number;
  created_by_clinic_id?: number;
  created_by_organization_id?: number;

  // Детали события
  title?: string;
  description?: string;
  details?: string;

  // Медицинские данные
  vaccine_name?: string;
  vaccine_batch?: string;
  medication_name?: string;
  dosage?: string;
  next_date?: string;

  // Смена владельца
  previous_owner_id?: number;
  new_owner_id?: number;
  transfer_reason?: string;

  // Потеря/находка
  location?: string;
  circumstances?: string;
  contact_phone?: string;
  contact_name?: string;

  // Смерть
  death_reason?: DeathReason;
  death_confirmed_by_clinic_id?: number;

  // Приют
  shelter_id?: number;
  adoption_contract?: string;

  // Верификация
  is_verified: boolean;
  verified_by_user_id?: number;
  verified_at?: string;

  created_at: string;
  updated_at: string;

  // Дополнительные поля для отображения
  created_by_user_name?: string;
  created_by_clinic_name?: string;
  created_by_organization_name?: string;
  previous_owner_name?: string;
  new_owner_name?: string;
  shelter_name?: string;
}

// Запрос на создание события
export interface CreatePetEventRequest {
  pet_id: number;
  event_type: PetEventType;
  event_date?: string;
  title?: string;
  description?: string;
  details?: string;

  // Медицинские данные
  vaccine_name?: string;
  vaccine_batch?: string;
  medication_name?: string;
  dosage?: string;
  next_date?: string;

  // Смена владельца
  previous_owner_id?: number;
  new_owner_id?: number;
  transfer_reason?: string;

  // Потеря/находка
  location?: string;
  circumstances?: string;
  contact_phone?: string;
  contact_name?: string;

  // Смерть
  death_reason?: DeathReason;
  death_confirmed_by_clinic_id?: number;

  // Приют
  shelter_id?: number;
  adoption_contract?: string;
}

class PetIDApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `API Error: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: result.data !== undefined ? result.data : result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      // Тихо возвращаем ошибку без логирования (сервис может быть недоступен)
      return {
        success: false,
        error: 'Service unavailable',
      };
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(body),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

const petidApiClient = new PetIDApiClient(PETID_API_URL);

// API методы для событий питомцев
export const petEventsApi = {
  // Получить историю событий питомца
  getEvents: (petId: number) => petidApiClient.get<PetEvent[]>(`/api/petid/${petId}/events`),

  // Получить медицинскую историю
  getMedicalHistory: (petId: number) =>
    petidApiClient.get<PetEvent[]>(`/api/petid/${petId}/medical`),

  // Создать событие
  createEvent: (petId: number, data: CreatePetEventRequest) =>
    petidApiClient.post<PetEvent>(`/api/petid/${petId}/events`, data),
};

// Утилиты для работы с событиями
export const eventTypeLabels: Record<PetEventType, string> = {
  registration: 'Регистрация',
  ownership_change: 'Смена владельца',
  sterilization: 'Стерилизация',
  vaccination: 'Вакцинация',
  treatment: 'Лечение',
  lost: 'Потерян',
  found: 'Найден',
  death: 'Смерть',
  shelter_intake: 'Поступление в приют',
  adoption: 'Усыновление',
};

export const eventTypeIcons: Record<PetEventType, string> = {
  registration: '📝',
  ownership_change: '🔄',
  sterilization: '✂️',
  vaccination: '💉',
  treatment: '🏥',
  lost: '🔍',
  found: '✅',
  death: '💔',
  shelter_intake: '🏠',
  adoption: '❤️',
};

export const eventTypeColors: Record<PetEventType, string> = {
  registration: 'bg-blue-100 text-blue-700 border-blue-200',
  ownership_change: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  sterilization: 'bg-purple-100 text-purple-700 border-purple-200',
  vaccination: 'bg-green-100 text-green-700 border-green-200',
  treatment: 'bg-red-100 text-red-700 border-red-200',
  lost: 'bg-orange-100 text-orange-700 border-orange-200',
  found: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  death: 'bg-gray-100 text-gray-700 border-gray-200',
  shelter_intake: 'bg-amber-100 text-amber-700 border-amber-200',
  adoption: 'bg-pink-100 text-pink-700 border-pink-200',
};

export const deathReasonLabels: Record<DeathReason, string> = {
  natural: 'Естественная смерть',
  euthanasia: 'Эвтаназия',
  accident: 'Несчастный случай',
  disease: 'Болезнь',
};
