export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListMember {
  list_id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'owner';
  joined_at: string;
  profile?: Profile;
}

export type ListVisibility = 'private' | 'link_read' | 'link_write';

export interface List {
  id: string;
  name: string;
  created_at: string;
  owner_id: string | null;
  visibility: ListVisibility;
}

export interface Item {
  id: string;
  list_id: string;
  text: string;
  checked: boolean;
  category: string;
  order_index: number;
  created_at: string;
}

export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  isLoading: boolean;
}
