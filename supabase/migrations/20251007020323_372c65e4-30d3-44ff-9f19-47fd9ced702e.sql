-- Change the count column from integer to numeric to support decimal weights
ALTER TABLE workout_exercise 
ALTER COLUMN count TYPE numeric USING count::numeric;