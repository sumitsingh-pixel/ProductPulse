
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vknlidvgdspllrvaetjy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmxpZHZnZHNwbGxydmFldGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTYyNDcsImV4cCI6MjA4NTgzMjI0N30.iKL5ykyTW5okwt4AuTssBjE_YmtKoAHE53lWbno9ZuU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
