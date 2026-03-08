import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json(
      { error: 'DATABASE_URL environment variable is missing' },
      { status: 500 }
    );
  }

  const sql = postgres(connectionString);

  try {
    // Create tables and enable RLS
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT,
        role TEXT DEFAULT 'user',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        user_id UUID DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        template_id TEXT,
        recipient_data JSONB,
        certificate_number TEXT UNIQUE,
        image_url TEXT,
        digital_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Enable RLS
    await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE templates ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;`;

    // Ensure foreign keys exist for joining
    try {
      await sql`ALTER TABLE templates ADD CONSTRAINT templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;`;
    } catch (e) {}
    try {
      await sql`ALTER TABLE certificates ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;`;
    } catch (e) {}

    // Create strict policies for multi-user isolation and admin access
    await sql`
      DO $$ 
      BEGIN
        -- Profiles policies
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
        CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );

        -- Templates policies
        DROP POLICY IF EXISTS "Users can manage their own templates" ON templates;
        CREATE POLICY "Users can manage their own templates" ON templates 
        FOR ALL USING (
          auth.uid() = user_id OR 
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
        
        -- Certificates policies
        DROP POLICY IF EXISTS "Users can manage their own certificates" ON certificates;
        CREATE POLICY "Users can manage their own certificates" ON certificates 
        FOR ALL USING (
          auth.uid() = user_id OR 
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );

        -- Special policy for public verification
        DROP POLICY IF EXISTS "Anyone can verify certificates" ON certificates;
        CREATE POLICY "Anyone can verify certificates" ON certificates 
        FOR SELECT USING (true);

        -- Trigger to create profile on signup
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS trigger AS $$
        DECLARE
          is_first_user BOOLEAN;
        BEGIN
          SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;
          
          INSERT INTO public.profiles (id, email, role)
          VALUES (new.id, new.email, CASE WHEN is_first_user THEN 'admin' ELSE 'user' END);
          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      END $$;
    `;

    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize database' },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}
