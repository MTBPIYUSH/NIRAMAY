-- Function to increment user reports and points
CREATE OR REPLACE FUNCTION increment_user_reports(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET 
    reports = COALESCE(reports, 0) + 1,
    points = COALESCE(points, 0) + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment a value (used for counters)
CREATE OR REPLACE FUNCTION increment(value INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(value, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update user ranks based on points
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS VOID AS $$
BEGIN
  -- Update ranks based on points
  UPDATE user_profiles
  SET rank = ranks.rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY points DESC) as rank
    FROM user_profiles
  ) as ranks
  WHERE user_profiles.id = ranks.id;
  
  -- Update levels based on points
  UPDATE user_profiles
  SET 
    level = GREATEST(1, FLOOR(SQRT(points / 100))::INTEGER),
    next_level_points = POWER(GREATEST(1, FLOOR(SQRT(points / 100)) + 1), 2) * 100
  WHERE TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update ranks when points change
CREATE OR REPLACE FUNCTION trigger_update_ranks()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_ranks();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ranks_trigger ON user_profiles;
CREATE TRIGGER update_ranks_trigger
AFTER UPDATE OF points ON user_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_ranks();
