export interface PersonMap {
  id: string;
  name: string;
  birth_year: number;
  death_year: number;
  birth_lat: number | null;
  birth_lon: number | null;
  main_photo_url: string;
  activity_description: string | null;
  era: string | null;
  category: string | null;
}

export interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
}

export interface Person {
  id: string;
  name: string;
  name_original: string | null;
  birth_year: number;
  death_year: number;
  birth_year_approximate: boolean;
  death_year_approximate: boolean;
  birth_lat: number | null;
  birth_lon: number | null;
  death_lat: number | null;
  death_lon: number | null;
  birth_place_name: string | null;
  death_place_name: string | null;
  main_photo_url: string;
  description: string;
  activity_description: string | null;
  short_bio: string | null;
  era: string | null;
  category: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  photos: Photo[];
}

export interface PersonListResponse {
  items: Person[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface Era {
  name: string;
  start_year: number;
  end_year: number;
  color: string;
}

export interface PersonYearRange {
  id: string;
  name: string;
  birth_year: number;
  death_year: number;
  era: string | null;
}

export interface EraCount {
  era: string;
  count: number;
}

export interface Stats {
  total_persons: number;
  total_published: number;
  by_era: EraCount[];
  by_category: EraCount[];
}

export interface WelcomeSettings {
  welcome_image: string;
  welcome_title: string;
  welcome_text: string;
  welcome_btn1_text: string;
  welcome_btn1_url: string;
  welcome_btn2_text: string;
  welcome_btn2_url: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
