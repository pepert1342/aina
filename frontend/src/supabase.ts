import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mdzrlnjvnradfrsqzjbs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kenJsbmp2bnJhZGZyc3F6amJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzY0MjgsImV4cCI6MjA4MDExMjQyOH0.UsYe5t1QQrdTROekNOzgNFFP-2H1pUWkI43DQk4Ie8Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)