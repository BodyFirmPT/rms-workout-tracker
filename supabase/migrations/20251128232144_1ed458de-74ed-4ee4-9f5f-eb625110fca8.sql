-- Drop the existing update policy
DROP POLICY IF EXISTS "Trainers can update their clients' workout exercises" ON workout_exercise;

-- Recreate with explicit WITH CHECK clause
CREATE POLICY "Trainers can update their clients' workout exercises"
ON workout_exercise
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    JOIN workout ON workout.client_id = client.id
    WHERE users.id = auth.uid()
    AND workout.id = workout_exercise.workout_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    JOIN client ON client.trainer_id = users.trainer_id
    JOIN workout ON workout.client_id = client.id
    WHERE users.id = auth.uid()
    AND workout.id = workout_exercise.workout_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);