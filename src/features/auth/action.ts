'use server';

import { createClient } from "@/lib/supabase/server";
import type { AuthInput } from './schema';

export async function loginUser(data: AuthInput) {
   const supabase = await createClient();

   const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
   });

   if (error) {
      throw new Error(error.message === 'Invalid login credentials'
         ? 'Email or password is incorrect'
         : error.message
      );
   }

   return 'Login success!';
}

export async function registerUser(data: AuthInput) {
   const supabase = await createClient();

   const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
   });

   if (error) {
      throw new Error(error.message === 'User already registered'
         ? 'Email is already registered, please login.'
         : error.message
      );
   }

   return 'Registration succeed! Please login.';
}