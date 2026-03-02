import { sql } from '@vercel/postgres';

export async function getCredits(email: string): Promise<number> {
  const result = await sql`SELECT credits FROM users WHERE email = ${email.toLowerCase()}`;
  return result.rows[0]?.credits ?? 0;
}

export async function upsertCredits(email: string, creditsToAdd: number): Promise<number> {
  const result = await sql`
    INSERT INTO users (email, credits) VALUES (${email.toLowerCase()}, ${creditsToAdd})
    ON CONFLICT (email) DO UPDATE SET credits = users.credits + ${creditsToAdd}
    RETURNING credits
  `;
  return result.rows[0].credits;
}

export async function deductCredit(email: string): Promise<boolean> {
  const result = await sql`
    UPDATE users SET credits = credits - 1 
    WHERE email = ${email.toLowerCase()} AND credits > 0
    RETURNING credits
  `;
  return result.rows.length > 0;
}

export async function saveGeneration(id: string, email: string, watermarked: string, clean: string, prompt: string) {
  await sql`
    INSERT INTO generations (id, email, watermarked_image, clean_image, prompt)
    VALUES (${id}, ${email.toLowerCase()}, ${watermarked}, ${clean}, ${prompt})
  `;
}

export async function getGeneration(id: string) {
  const result = await sql`SELECT * FROM generations WHERE id = ${id} AND expires_at > NOW()`;
  return result.rows[0] || null;
}

export async function markDownloaded(id: string) {
  await sql`UPDATE generations SET downloaded = TRUE WHERE id = ${id}`;
}
