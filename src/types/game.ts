export type Platform = "PC" | "PlayStation" | "Xbox" | "Nintendo";
export type Genre = "RPG" | "動作" | "冒險" | "策略" | "模擬" | "恐怖";

export interface Game {
  id: string;
  name: string;
  developer: string;
  description: string;
  cover: string;
  artwork: string;
  score: number;
  reviewCount: number;
  genre: Genre;
  platforms: Platform[];
  rank?: number;
}
