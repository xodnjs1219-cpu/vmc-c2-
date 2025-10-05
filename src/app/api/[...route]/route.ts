import { createHonoApp } from '@/backend/hono/app';

const app = createHonoApp();

export const runtime = 'nodejs';

const handler = (req: Request) => app.fetch(req);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
