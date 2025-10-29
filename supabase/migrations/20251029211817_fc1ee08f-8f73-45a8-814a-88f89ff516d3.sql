-- Update RLS policies for trainer-scoped access with admin override

-- Client table policies
DROP POLICY IF EXISTS "Allow all operations on client" ON client;

CREATE POLICY "Trainers can view their own clients"
ON client FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.trainer_id = client.trainer_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can insert their own clients"
ON client FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.trainer_id = client.trainer_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can update their own clients"
ON client FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.trainer_id = client.trainer_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can delete their own clients"
ON client FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.trainer_id = client.trainer_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Workout table policies
DROP POLICY IF EXISTS "Allow all operations on workout" ON workout;

CREATE POLICY "Trainers can view their clients' workouts"
ON workout FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = workout.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can insert workouts for their clients"
ON workout FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = workout.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can update their clients' workouts"
ON workout FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = workout.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can delete their clients' workouts"
ON workout FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = workout.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Workout exercise table policies
DROP POLICY IF EXISTS "Allow all operations on workout_exercise" ON workout_exercise;

CREATE POLICY "Trainers can view their clients' workout exercises"
ON workout_exercise FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    JOIN workout ON workout.client_id = client.id
    WHERE users.id = auth.uid()
    AND workout.id = workout_exercise.workout_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can insert exercises for their clients' workouts"
ON workout_exercise FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    JOIN workout ON workout.client_id = client.id
    WHERE users.id = auth.uid()
    AND workout.id = workout_exercise.workout_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can update their clients' workout exercises"
ON workout_exercise FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    JOIN workout ON workout.client_id = client.id
    WHERE users.id = auth.uid()
    AND workout.id = workout_exercise.workout_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can delete their clients' workout exercises"
ON workout_exercise FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    JOIN workout ON workout.client_id = client.id
    WHERE users.id = auth.uid()
    AND workout.id = workout_exercise.workout_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Injury table policies
DROP POLICY IF EXISTS "Allow all operations on injury" ON injury;

CREATE POLICY "Trainers can view their clients' injuries"
ON injury FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = injury.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can insert injuries for their clients"
ON injury FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = injury.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can update their clients' injuries"
ON injury FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = injury.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can delete their clients' injuries"
ON injury FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = injury.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Restricted exercise table policies
DROP POLICY IF EXISTS "Allow all operations on restricted_exercise" ON restricted_exercise;

CREATE POLICY "Trainers can view their clients' restricted exercises"
ON restricted_exercise FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = restricted_exercise.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can insert restricted exercises for their clients"
ON restricted_exercise FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = restricted_exercise.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can update their clients' restricted exercises"
ON restricted_exercise FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = restricted_exercise.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can delete their clients' restricted exercises"
ON restricted_exercise FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = restricted_exercise.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Client locations policies
DROP POLICY IF EXISTS "Allow all operations on client_locations" ON client_locations;

CREATE POLICY "Trainers can view their clients' locations"
ON client_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = client_locations.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can insert locations for their clients"
ON client_locations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = client_locations.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can update their clients' locations"
ON client_locations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = client_locations.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can delete their clients' locations"
ON client_locations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    WHERE users.id = auth.uid()
    AND client.id = client_locations.client_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);