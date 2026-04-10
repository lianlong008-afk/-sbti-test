export interface Question {
  id: string;
  dim: string;
  text: string;
  options: { label: string; value: number }[];
}

export interface SpecialQuestion {
  id: string;
  special: true;
  kind: string;
  text: string;
  options: { label: string; value: number }[];
}

export interface PersonalityType {
  code: string;
  cn: string;
  intro: string;
  desc: string;
}

export interface NormalType {
  code: string;
  pattern: string;
}

export interface Result {
  id: number;
  submitted_at: string;
  answers_json: string;
  final_type: string;
  type_cn: string;
  match_score: number;
  dims_json: string;
  ip: string;
}

export interface DimensionMeta {
  [key: string]: { name: string; model: string };
}

export interface DimLevel {
  level: string;
  score: number;
  explanation: string;
}
