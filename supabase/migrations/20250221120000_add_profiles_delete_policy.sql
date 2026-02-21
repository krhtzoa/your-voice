-- Allow users to delete their own profile (complete CRUD on own data)
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
