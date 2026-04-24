import type { Database } from "@/integrations/supabase/types";

type Difficulty = "easy" | "medium" | "hard";

export interface SRSCard {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

interface SRSOptions {
  reviewAggressiveness?: number | null;
}

/**
 * Variante leve do SM-2.
 * - hard: ease cai, interval reseta para 1d
 * - medium: mantém, multiplica interval por ease
 * - easy: ease sobe, interval x ease + bônus
 */
export function nextReview(card: SRSCard, difficulty: Difficulty, options: SRSOptions = {}) {
  let { ease_factor, interval_days, repetitions } = card;
  const aggressiveness = Math.min(1.15, Math.max(0.45, Number(options.reviewAggressiveness ?? 1)));

  if (difficulty === "hard") {
    repetitions = 0;
    interval_days = 0;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else if (difficulty === "medium") {
    repetitions += 1;
    interval_days = repetitions === 1 ? 1 : Math.max(1, Math.round(interval_days * ease_factor * aggressiveness));
  } else {
    repetitions += 1;
    interval_days = repetitions === 1 ? 4 : Math.max(4, Math.round(interval_days * ease_factor * 1.3 * Math.max(aggressiveness, 0.85)));
    ease_factor = Math.min(3.0, ease_factor + 0.15);
  }

  const due = new Date();
  if (difficulty === "hard") due.setHours(due.getHours() + 4);
  else due.setDate(due.getDate() + interval_days);

  return {
    ease_factor,
    interval_days,
    repetitions,
    due_at: due.toISOString(),
    last_difficulty: difficulty,
  };
}