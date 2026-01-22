-- ============================================
-- FIX SECURITY: Replace overly permissive RLS policies
-- ============================================

-- Drop the permissive "true" policies
DROP POLICY IF EXISTS "Allow all operations on trainer" ON public.trainer;
DROP POLICY IF EXISTS "Allow all operations on location" ON public.location;
DROP POLICY IF EXISTS "Allow all operations on equipment" ON public.equipment;
DROP POLICY IF EXISTS "Allow all operations on muscle_group" ON public.muscle_group;

-- ============================================
-- TRAINER TABLE POLICIES
-- Trainers are linked to users via users.trainer_id
-- Only authenticated users can access their own trainer record, admins can access all
-- ============================================

CREATE POLICY "Users can view their own trainer"
ON public.trainer FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.trainer_id = trainer.id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their own trainer"
ON public.trainer FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.trainer_id = trainer.id
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.trainer_id = trainer.id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert their own trainer"
ON public.trainer FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can delete trainers"
ON public.trainer FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- LOCATION TABLE POLICIES
-- Locations can be accessed by trainers who have clients linked to those locations
-- ============================================

CREATE POLICY "Trainers can view locations linked to their clients"
ON public.location FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = location.id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trainers can insert locations"
ON public.location FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can update locations linked to their clients"
ON public.location FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = location.id
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = location.id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trainers can delete locations linked to their clients"
ON public.location FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = location.id
  )
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- EQUIPMENT TABLE POLICIES
-- Equipment belongs to locations, so access follows location access
-- ============================================

CREATE POLICY "Trainers can view equipment at their clients' locations"
ON public.equipment FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = equipment.location_id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trainers can insert equipment at their clients' locations"
ON public.equipment FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = equipment.location_id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trainers can update equipment at their clients' locations"
ON public.equipment FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = equipment.location_id
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = equipment.location_id
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trainers can delete equipment at their clients' locations"
ON public.equipment FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.client c ON c.trainer_id = u.trainer_id
    JOIN public.client_locations cl ON cl.client_id = c.id
    WHERE u.id = auth.uid() AND cl.location_id = equipment.location_id
  )
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- MUSCLE_GROUP TABLE POLICIES
-- Muscle groups are reference data - public read, admin-only write
-- ============================================

CREATE POLICY "Anyone authenticated can view muscle groups"
ON public.muscle_group FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert muscle groups"
ON public.muscle_group FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update muscle groups"
ON public.muscle_group FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete muscle groups"
ON public.muscle_group FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));