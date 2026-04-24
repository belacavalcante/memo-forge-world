DROP POLICY IF EXISTS subjects_select_visible ON public.subjects;
CREATE POLICY subjects_select_visible
ON public.subjects
FOR SELECT
USING (user_id = auth.uid() OR visibility = 'public');

DROP POLICY IF EXISTS decks_select_visible ON public.decks;
CREATE POLICY decks_select_visible
ON public.decks
FOR SELECT
USING (user_id = auth.uid() OR visibility = 'public');

DROP POLICY IF EXISTS summaries_select_visible ON public.summaries;
CREATE POLICY summaries_select_visible
ON public.summaries
FOR SELECT
USING (user_id = auth.uid() OR visibility = 'public');

DROP POLICY IF EXISTS quizzes_select_visible ON public.quizzes;
CREATE POLICY quizzes_select_visible
ON public.quizzes
FOR SELECT
USING (user_id = auth.uid() OR visibility = 'public');