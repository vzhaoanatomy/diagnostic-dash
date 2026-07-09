import type { MenuItemType } from "@/lib/menu-item-types";

export type SessionStatus = "waiting" | "active" | "paused" | "ended";
export type DiagnosisStatus = "pending" | "correct" | "incorrect";

export interface Teacher {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface Case {
  id: string;
  teacher_id: string;
  title: string;
  category: string;
  patient_age: number;
  patient_sex: string;
  chief_complaint: string;
  case_intro: string;
  accepted_diagnoses: string[];
  alternate_accepted_answers: string[];
  starting_budget: number;
  teacher_notes: string;
  debrief_content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseMenuItem {
  id: string;
  case_id: string;
  name: string;
  cost: number;
  description: string;
  clue_content: string;
  clue_image_url: string | null;
  item_type: MenuItemType;
  sort_order: number;
  created_at: string;
}

export interface GameSession {
  id: string;
  case_id: string;
  teacher_id: string;
  join_code: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  session_id: string;
  team_name: string;
  budget_remaining: number;
  shared_notes: string;
  diagnosis: string | null;
  evidence: string[];
  alternate_diagnosis: string | null;
  diagnosis_status: DiagnosisStatus;
  submitted_at: string | null;
  created_at: string;
}

export interface TeamPurchase {
  id: string;
  team_id: string;
  menu_item_id: string;
  cost_paid: number;
  purchased_at: string;
}

export interface CaseWithMenuItems extends Case {
  menu_items: CaseMenuItem[];
}

export interface TeamPurchaseWithItem extends TeamPurchase {
  menu_item: CaseMenuItem;
}

export interface GameSessionWithCase extends GameSession {
  case: Case;
}

export interface TeamWithPurchases extends Team {
  purchases: TeamPurchaseWithItem[];
}

export interface CaseFormData {
  title: string;
  category: string;
  patient_age: number;
  patient_sex: string;
  chief_complaint: string;
  case_intro: string;
  accepted_diagnoses: string[];
  alternate_accepted_answers: string[];
  starting_budget: number;
  teacher_notes: string;
  debrief_content: string;
  menu_items: Omit<CaseMenuItem, "id" | "case_id" | "created_at">[];
}

export interface SubmissionFormData {
  diagnosis: string;
  evidence: string[];
  alternate_diagnosis: string;
}

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      teachers: TableDef<
        Teacher,
        Omit<Teacher, "created_at">,
        Partial<Omit<Teacher, "id" | "created_at">>
      >;
      cases: TableDef<
        Case,
        {
          teacher_id: string;
          title: string;
          category?: string;
          patient_age?: number;
          patient_sex?: string;
          chief_complaint?: string;
          case_intro?: string;
          accepted_diagnoses?: string[];
          alternate_accepted_answers?: string[];
          starting_budget?: number;
          teacher_notes?: string;
          debrief_content?: string;
          is_published?: boolean;
        },
        Partial<Omit<Case, "id" | "created_at">>
      >;
      case_menu_items: TableDef<
        CaseMenuItem,
        Omit<CaseMenuItem, "id" | "created_at">,
        Partial<Omit<CaseMenuItem, "id" | "created_at">>
      >;
      game_sessions: TableDef<
        GameSession,
        {
          case_id: string;
          teacher_id: string;
          join_code: string;
          status?: SessionStatus;
          started_at?: string | null;
          ended_at?: string | null;
        },
        Partial<Omit<GameSession, "id" | "created_at">>
      >;
      teams: TableDef<
        Team,
        {
          session_id: string;
          team_name: string;
          budget_remaining?: number;
          shared_notes?: string;
          diagnosis?: string | null;
          evidence?: string[];
          alternate_diagnosis?: string | null;
          diagnosis_status?: DiagnosisStatus;
          submitted_at?: string | null;
        },
        Partial<Omit<Team, "id" | "created_at">>
      >;
      team_purchases: TableDef<
        TeamPurchase,
        Omit<TeamPurchase, "id" | "purchased_at">,
        Partial<Omit<TeamPurchase, "id">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      purchase_menu_item: {
        Args: { p_team_id: string; p_menu_item_id: string };
        Returns: TeamPurchase;
      };
      generate_join_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      session_status: SessionStatus;
      diagnosis_status: DiagnosisStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
