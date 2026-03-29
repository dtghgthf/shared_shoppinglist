export interface List {
  id: string;
  name: string;
  created_at: string;
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
