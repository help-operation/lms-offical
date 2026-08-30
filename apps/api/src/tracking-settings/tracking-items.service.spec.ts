import { Test, TestingModule } from '@nestjs/testing';
import { TrackingItemsService } from './tracking-items.service';
import { DB_TOKEN } from 'src/db/db.module';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';

/**
 * Minimal chainable mock matching the subset of drizzle's query builder this
 * service uses. `select()` is called two different ways in the service:
 *  - `select({key}).from(x)` — ensureSeeded's existing-keys check, awaited
 *    directly with no further chaining, so `.from()` must itself resolve.
 *  - `select().from(x).orderBy(...)` — list(), where `.from()` must stay
 *    chainable and only `.orderBy()` resolves.
 * A single mock object can't safely be both a thenable AND a plain object
 * (NestJS's `useValue` provider unwraps anything with a `.then`, which broke
 * an earlier version of this mock) — so branch on whether `select()` was
 * called with a projection argument instead.
 */
function makeDbMock(rows: any[]) {
  const chain: any = {
    select: jest.fn((projection?: unknown) => {
      if (projection !== undefined) {
        chain.from = jest.fn(() => Promise.resolve(rows));
      } else {
        chain.from = jest.fn(() => chain);
      }
      return chain;
    }),
    from: jest.fn(() => chain),
    orderBy: jest.fn(() => Promise.resolve(rows)),
    insert: jest.fn(() => chain),
    values: jest.fn(() => chain),
    onConflictDoNothing: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => chain),
    set: jest.fn(() => chain),
    where: jest.fn(() => chain),
    returning: jest.fn(() => Promise.resolve([rows[0]])),
  };
  return chain;
}

describe('TrackingItemsService', () => {
  let service: TrackingItemsService;
  let revalidate: jest.Mock;

  async function build(rows: any[]) {
    revalidate = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingItemsService,
        { provide: DB_TOKEN, useValue: makeDbMock(rows) },
        { provide: RevalidationService, useValue: { revalidate } },
      ],
    }).compile();
    service = module.get(TrackingItemsService);
  }

  it('strips secret config fields from the public projection', async () => {
    await build([
      { key: 'fb_pixel', category: 'core_tag', label: 'Facebook Pixel', enabled: true, config: { id: '123', capiAccessToken: 'SECRET', capiTestEventCode: 'TEST1' } },
    ]);

    const publicRows = await service.listPublic();

    expect(publicRows[0].config).toEqual({ id: '123' });
    expect(publicRows[0].config).not.toHaveProperty('capiAccessToken');
    expect(publicRows[0].config).not.toHaveProperty('capiTestEventCode');
  });

  it('admin list() still includes secret config fields', async () => {
    await build([
      { key: 'fb_pixel', category: 'core_tag', label: 'Facebook Pixel', enabled: true, config: { id: '123', capiAccessToken: 'SECRET' } },
    ]);

    const rows = await service.list();

    expect(rows[0].config).toHaveProperty('capiAccessToken', 'SECRET');
  });

  it('bulkUpdate only touches the items included in the request', async () => {
    const rows = [
      { key: 'gtm', category: 'core_tag', label: 'GTM', enabled: false, config: {} },
      { key: 'ga4', category: 'core_tag', label: 'GA4', enabled: false, config: {} },
    ];
    await build(rows);

    await service.bulkUpdate([{ key: 'gtm', enabled: true }]);

    // Only one update() call should have been issued for the single dirty item.
    const db = (service as any).db;
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});
