import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { customFonts } from 'src/db/schema';

export interface FontMetadata {
  family: string;
  category: string;
  weights: number[];
  subsets: string[];
  style: string;
  source: 'google' | 'custom';
  format?: string;
  filePath?: string;
  fileSize?: number;
  fileHash?: string;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class FontsService implements OnModuleInit {
  private fontCache: Map<string, FontMetadata[]> = new Map();
  private lastRefresh = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async onModuleInit() {
    await this.loadCuratedFonts();
  }

  private async loadCuratedFonts() {
    // Curated list of popular Google Fonts (Latin and Bengali)
    const curatedFonts: FontMetadata[] = [
      // English - Sans Serif
      { family: 'Poppins', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Inter', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Open Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Lato', category: 'sans-serif', weights: [300, 400, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Montserrat', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Nunito', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Source Sans 3', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Work Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Outfit', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Raleway', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Manrope', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Ubuntu', category: 'sans-serif', weights: [300, 400, 500, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Plus Jakarta Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      // English - Serif
      { family: 'Roboto Slab', category: 'serif', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Merriweather', category: 'serif', weights: [300, 400, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'PT Serif', category: 'serif', weights: [400, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      // English - Display
      { family: 'Oswald', category: 'display', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Abril Fatface', category: 'display', weights: [400], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Righteous', category: 'display', weights: [400], subsets: ['latin'], style: 'normal', source: 'google' },
      // English - Handwriting
      { family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Pacifico', category: 'handwriting', weights: [400], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Satisfy', category: 'handwriting', weights: [400], subsets: ['latin'], style: 'normal', source: 'google' },
      // English - Monospace
      { family: 'Roboto Mono', category: 'monospace', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'Source Code Pro', category: 'monospace', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      { family: 'JetBrains Mono', category: 'monospace', weights: [300, 400, 500, 600, 700], subsets: ['latin'], style: 'normal', source: 'google' },
      // Bangla Fonts
      { family: 'Hind Siliguri', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['bengali', 'latin'], style: 'normal', source: 'google' },
      { family: 'Noto Sans Bengali', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['bengali', 'latin'], style: 'normal', source: 'google' },
      { family: 'Baloo Da 2', category: 'sans-serif', weights: [400, 500, 600, 700, 800], subsets: ['bengali', 'latin'], style: 'normal', source: 'google' },
      { family: 'Tiro Bangla', category: 'serif', weights: [400], subsets: ['bengali', 'latin'], style: 'normal', source: 'google' },
      { family: 'Atma', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['bengali', 'latin'], style: 'normal', source: 'google' },
      { family: 'Galada', category: 'display', weights: [400], subsets: ['bengali', 'latin'], style: 'normal', source: 'google' },
      { family: 'Hind', category: 'sans-serif', weights: [300, 400, 500, 600, 700], subsets: ['latin', 'devanagari'], style: 'normal', source: 'google' },
    ];

    this.fontCache.set('all', curatedFonts);
    this.fontCache.set('latin', curatedFonts.filter(f => f.subsets.includes('latin') && !f.subsets.includes('bengali')));
    this.fontCache.set('bengali', curatedFonts.filter(f => f.subsets.includes('bengali')));
    this.lastRefresh = Date.now();
  }

  async getFonts(script?: string): Promise<FontMetadata[]> {
    // Refresh cache if expired
    if (Date.now() - this.lastRefresh > this.CACHE_TTL) {
      await this.loadCuratedFonts();
    }

    const cached = this.fontCache.get(script || 'all');
    if (cached) return cached;

    return this.fontCache.get('all') || [];
  }

  async refreshCache(): Promise<{ count: number }> {
    await this.loadCuratedFonts();
    const allFonts = this.fontCache.get('all') || [];
    return { count: allFonts.length };
  }

  async getCustomFonts(): Promise<FontMetadata[]> {
    const rows = await this.db.select().from(customFonts).where(eq(customFonts.isActive, true));
    return rows.map(row => ({
      family: row.familyName,
      category: row.category,
      weights: row.weights as number[],
      subsets: row.subsets as string[],
      style: row.style,
      source: 'custom' as const,
      format: row.format,
      filePath: row.filePath,
      fileSize: row.fileSize,
      fileHash: row.fileHash,
      isActive: row.isActive,
      createdBy: row.createdBy ?? undefined,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    }));
  }

  async getAllFonts(): Promise<FontMetadata[]> {
    const googleFonts = await this.getFonts('all');
    const customFonts = await this.getCustomFonts();
    return [...googleFonts, ...customFonts];
  }

  async deleteFont(id: number): Promise<void> {
    const [existing] = await this.db.select().from(customFonts).where(eq(customFonts.id, id));
    if (!existing) {
      throw new Error('Font not found');
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), existing.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await this.db.delete(customFonts).where(eq(customFonts.id, id));
  }

  async toggleFontActive(id: number): Promise<FontMetadata> {
    const [existing] = await this.db.select().from(customFonts).where(eq(customFonts.id, id));
    if (!existing) {
      throw new Error('Font not found');
    }

    const [row] = await this.db
      .update(customFonts)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(customFonts.id, id))
      .returning();

    return {
      family: row.familyName,
      category: row.category,
      weights: row.weights as number[],
      subsets: row.subsets as string[],
      style: row.style,
      source: 'custom',
      format: row.format,
      filePath: row.filePath,
      fileSize: row.fileSize,
      fileHash: row.fileHash,
      isActive: row.isActive,
      createdBy: row.createdBy ?? undefined,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    };
  }
}
