export interface WasteReport {
  id: string;
  user_id: string;
  type: "Recyclable" | "Biodegradable" | "Hazardous" | "E-Waste";
  status: "Pending" | "In Progress" | "Collected";
  location: {
    latitude?: number;
    longitude?: number;
    formatted_address?: string;
    city?: string;
    postal_code?: string;
    street_address?: string;
    landmark?: string;
  };
  description: string;
  reported_at: string;
  collected_at: string | null;
  image_url: string | null;
  urgent: boolean;
}

export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  points: number;
  reports: number;
  recycling: number;
  level: number;
  next_level_points: number;
  rank: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  earned_at: string;
}

export interface Reward {
  id: string;
  name: string;
  points: number;
  image_url: string;
  description: string;
}
