DO $$ BEGIN
  CREATE TYPE public.visibility_type AS ENUM ('private', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS visibility public.visibility_type NOT NULL DEFAULT 'private';
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS visibility public.visibility_type NOT NULL DEFAULT 'private';
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS visibility public.visibility_type NOT NULL DEFAULT 'private';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS visibility public.visibility_type NOT NULL DEFAULT 'private';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quiz_accuracy numeric NOT NULL DEFAULT 1.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_aggressiveness numeric NOT NULL DEFAULT 1.0;

CREATE TABLE IF NOT EXISTS public.mind_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid,
  title text NOT NULL,
  description text,
  mermaid_code text NOT NULL,
  source public.source_type NOT NULL DEFAULT 'manual',
  source_url text,
  visibility public.visibility_type NOT NULL DEFAULT 'private',
  upvotes_count integer NOT NULL DEFAULT 0,
  elite_badge boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mind_maps_select_visible ON public.mind_maps;
CREATE POLICY mind_maps_select_visible
ON public.mind_maps
FOR SELECT
USING (user_id = auth.uid() OR visibility = 'public');

DROP POLICY IF EXISTS mind_maps_insert_own ON public.mind_maps;
CREATE POLICY mind_maps_insert_own
ON public.mind_maps
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mind_maps_update_own ON public.mind_maps;
CREATE POLICY mind_maps_update_own
ON public.mind_maps
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mind_maps_delete_own ON public.mind_maps;
CREATE POLICY mind_maps_delete_own
ON public.mind_maps
FOR DELETE
USING (user_id = auth.uid());

CREATE TRIGGER update_mind_maps_updated_at
BEFORE UPDATE ON public.mind_maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.material_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_type text NOT NULL,
  material_id uuid NOT NULL,
  creator_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_type, material_id)
);

ALTER TABLE public.material_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS upvotes_select_all ON public.material_upvotes;
CREATE POLICY upvotes_select_all
ON public.material_upvotes
FOR SELECT
USING (true);

DROP POLICY IF EXISTS upvotes_insert_self ON public.material_upvotes;
CREATE POLICY upvotes_insert_self
ON public.material_upvotes
FOR INSERT
WITH CHECK (user_id = auth.uid() AND creator_user_id <> auth.uid());

DROP POLICY IF EXISTS upvotes_delete_self ON public.material_upvotes;
CREATE POLICY upvotes_delete_self
ON public.material_upvotes
FOR DELETE
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_material_upvote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_type text;
  target_id uuid;
  target_creator uuid;
  new_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_type := OLD.material_type;
    target_id := OLD.material_id;
    target_creator := OLD.creator_user_id;
  ELSE
    target_type := NEW.material_type;
    target_id := NEW.material_id;
    target_creator := NEW.creator_user_id;
  END IF;

  SELECT count(*) INTO new_count
  FROM public.material_upvotes
  WHERE material_type = target_type AND material_id = target_id;

  IF target_type = 'mind_map' THEN
    UPDATE public.mind_maps
    SET upvotes_count = new_count,
        elite_badge = new_count >= 10
    WHERE id = target_id;
  END IF;

  UPDATE public.profiles
  SET reputation = greatest(0, reputation + CASE WHEN TG_OP = 'DELETE' THEN -1 ELSE 1 END)
  WHERE user_id = target_creator;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_material_upvotes_after_insert ON public.material_upvotes;
CREATE TRIGGER sync_material_upvotes_after_insert
AFTER INSERT ON public.material_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_material_upvote_counts();

DROP TRIGGER IF EXISTS sync_material_upvotes_after_delete ON public.material_upvotes;
CREATE TRIGGER sync_material_upvotes_after_delete
AFTER DELETE ON public.material_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_material_upvote_counts();

CREATE OR REPLACE FUNCTION public.update_learning_performance(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_accuracy numeric;
BEGIN
  SELECT CASE WHEN sum(total) > 0 THEN sum(score)::numeric / sum(total)::numeric ELSE 1.0 END
  INTO recent_accuracy
  FROM (
    SELECT score, total
    FROM public.quiz_attempts
    WHERE user_id = _user_id
    ORDER BY created_at DESC
    LIMIT 20
  ) q;

  recent_accuracy := coalesce(recent_accuracy, 1.0);

  UPDATE public.profiles
  SET quiz_accuracy = recent_accuracy,
      review_aggressiveness = CASE
        WHEN recent_accuracy < 0.55 THEN 0.55
        WHEN recent_accuracy < 0.70 THEN 0.75
        WHEN recent_accuracy < 0.85 THEN 0.9
        ELSE 1.0
      END
  WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_learning_performance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_learning_performance(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quiz_attempts_update_learning_performance ON public.quiz_attempts;
CREATE TRIGGER quiz_attempts_update_learning_performance
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_learning_performance();

CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON public.mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_visibility ON public.mind_maps(visibility);
CREATE INDEX IF NOT EXISTS idx_material_upvotes_material ON public.material_upvotes(material_type, material_id);