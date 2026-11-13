import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);
export const supabase = supabaseConfigured ? createClient(url, publishableKey) : null;

export async function submitQuoteRequest(values) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('quote_requests').insert({
    name: values.name.trim(),
    company: values.company.trim() || null,
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    service: values.service,
    message: values.message.trim(),
  });
  if (error) throw error;
}
