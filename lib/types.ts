export type Effect = {
  id: string;
  name: string;
  description: string;
  effectType: string | null;
  hasVariable: boolean;
  icon: string | null;
  fulltime?: boolean;
};

export type Skill = {
  type: string;
  name: string;
  description: string;
  image: string | null;
  cooltime?: string | number | null;
  effects?: Effect[];
};

export type HeroSummary = {
  id: string;
  name: string;
  slug: string;
  nickname: string | null;
  rarity: string;
  type: string;
  group: string;
  hasEffect: boolean;
  portrait: string;
  typeImage: string | null;
  skills: Skill[];
};

export type HeroDetail = HeroSummary & {
  atk: string | number | null;
  def: string | number | null;
  hp: string | number | null;
  spd: string | number | null;
  crit_rate: string | number | null;
  crit_dmg: string | number | null;
  weak_rate: string | number | null;
  block_rate: string | number | null;
  dmg_reduce: string | number | null;
  eff_hit: string | number | null;
  eff_res: string | number | null;
  attack: Skill | null;
  passive: Skill | null;
  active_1: Skill | null;
  active_2: Skill | null;
  description: string | null;
  history: Array<{ date: string; content: string }>;
  transLevel: string | number | null;
};

export type CommentRecord = {
  id: string;
  nickname: string;
  content: string;
  timestamp: string;
};
