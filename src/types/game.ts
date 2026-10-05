export type Platform = "PC" | "PlayStation" | "Xbox" | "Nintendo";
export type Genre = "RPG" | "動作" | "冒險" | "策略" | "模擬" | "恐怖";

export interface Game {
  id: string;
  name: string;
  summary?: string | null;
  displayName?: string;
  displaySummary?: string | null;
  coverImageId?: string | null;
  firstReleaseDate?: string | null;
  developerName?: string | null;
  publisherName?: string | null;
  status?: string;
  genres?: Array<{ id: string; name: string }>;
  platforms: Platform[] | Array<{ id: string; name: string; abbreviation: string | null }>;
  externalIds?: Array<{ source: string; externalId: string }>;
  developer?: string;
  description?: string;
  cover?: string;
  artwork?: string;
  score?: number;
  reviewCount?: number;
  genre?: Genre | string;
  rank?: number;
}
