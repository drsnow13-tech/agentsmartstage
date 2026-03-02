import { neon } from '@neondatabase/serverless';

const sql = () => neon(process.env.DATABASE_URL!);

export async function getCredits(email: string): Promise<number> {
  const db = sql();
  const r = await db`SELECT credits FROM users WHERE email = ${email.toLowerCase()}`;
  return (r[0] as any)?.credits ?? 0;
}

export async function upsertCredits(email: string, credits: number): Promise<number> {
  const db = sql();
  const r = await db`
    INSERT INTO users (email, credits) VALUES (${email.toLowerCase()}, ${credits})
    ON CONFLICT (email) DO UPDATE SET credits = users.credits + ${credits}
    RETURNING credits`;
  return (r[0] as any).credits;
}

export async function deductCredit(email: string): Promise<boolean> {
  const db = sql();
  const r = await db`
    UPDATE users SET credits = credits - 1
    WHERE email = ${email.toLowerCase()} AND credits > 0
    RETURNING credits`;
  return r.length > 0;
}

export async function saveGeneration(id: string, email: string, watermarked: string, clean: string, prompt: string) {
  const db = sql();
  await db`INSERT INTO generations (id, email, watermarked_image, clean_image, prompt)
    VALUES (${id}, ${email.toLowerCase()}, ${watermarked}, ${clean}, ${prompt})`;
}

export async function getGeneration(id: string) {
  const db = sql();
  const r = await db`SELECT * FROM generations WHERE id = ${id} AND expires_at > NOW()`;
  return (r[0] as any) || null;
}

export async function markDownloaded(id: string) {
  const db = sql();
  await db`UPDATE generations SET downloaded = TRUE WHERE id = ${id}`;
}
