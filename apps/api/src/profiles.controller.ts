import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { CursorService } from './cursor.service';
import {
  allHandles,
  initSchema,
  listRanking,
  upsertProfile,
} from './db';

let schemaReady: Promise<void> | null = null;
function ensureSchema() {
  if (!schemaReady) schemaReady = initSchema();
  return schemaReady;
}

@Controller()
export class ProfilesController {
  // Instantiated directly (not constructor-injected) so the bundler does not
  // need emitDecoratorMetadata to resolve it — keeps Vercel/esbuild happy.
  private readonly cursor = new CursorService();

  /** User submits their handle via the UI; we validate + fetch + store. */
  @Post('handles')
  async add(@Body('handle') handle: string) {
    await ensureSchema();
    const stats = await this.cursor.fetchProfile(handle);
    await upsertProfile(stats);
    return stats;
  }

  @Get('ranking')
  async ranking(@Query('sort') sort?: string) {
    await ensureSchema();
    return listRanking(sort);
  }

  /** Daily Vercel cron: re-fetch every stored handle.
   *  Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically. */
  @Post('refresh')
  @Get('refresh')
  async refresh(@Headers('authorization') auth?: string) {
    if (
      process.env.CRON_SECRET &&
      auth !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return { ok: false, error: 'unauthorized' };
    }
    await ensureSchema();
    const handles = await allHandles();
    let ok = 0;
    for (const h of handles) {
      try {
        await upsertProfile(await this.cursor.fetchProfile(h));
        ok++;
      } catch {
        // skip handles that went private or were deleted
      }
    }
    return { ok, total: handles.length };
  }
}
