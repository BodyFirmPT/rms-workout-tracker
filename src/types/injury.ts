export interface Injury {
  id: string;
  client_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  workout_count_offset: number;
}

export interface CreateInjuryInput {
  client_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
}
