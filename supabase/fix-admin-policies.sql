-- Drop existing policies on the admins table
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;

-- Create simplified policies that avoid recursion
CREATE POLICY "Enable read access for authenticated users" 
ON admins FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
ON admins FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on id" 
ON admins FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id" 
ON admins FOR DELETE 
USING (auth.uid() = id);