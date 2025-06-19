export interface ActivitySearch {
  searchQuery?: string;
  categories?: string[];
  isOpenNow?: boolean;
  latitude?: number;
  longitude?: number;
  limit?: number;
  offset?: number;
}
