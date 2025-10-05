import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

/**
 * Server Action 및 Route Handler용 Supabase 클라이언트
 * 쿠키를 읽고 쓸 수 있습니다.
 * 
 * ⚠️ 주의: Server Component에서는 사용하지 마세요!
 * Server Component에서는 createSupabaseServerClient()를 사용하세요.
 */
export const createSupabaseServerActionClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
};
