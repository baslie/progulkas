import type {
  DistanceFilterValue,
  DurationFilterValue,
  RouteAudienceValue,
  RouteDifficultyValue,
  RouteStatusValue,
} from "./constants";
import type { FeatureCollection, LineString, MultiLineString } from "geojson";

export type RoutePointOfInterestCategory =
  | "viewpoint"
  | "food"
  | "water"
  | "transport"
  | "warning"
  | "info";

export type RoutePointOfInterest = {
  id: string;
  name: string;
  description?: string | null;
  category: RoutePointOfInterestCategory;
  coordinates: [number, number];
};

export type RouteTrackGeoJson = FeatureCollection<LineString | MultiLineString>;

export type RouteAuthorSummary = {
  id: string;
  name: string | null;
  email: string;
};

export type CatalogFilters = {
  query?: string;
  difficulties: RouteDifficultyValue[];
  audiences: RouteAudienceValue[];
  distance?: DistanceFilterValue;
  duration?: DurationFilterValue;
  limit?: number;
};

export type RawRouteRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  city: string;
  region: string;
  difficulty: RouteDifficultyValue;
  distanceKm: unknown;
  durationMinutes: number;
  suitableFor: RouteAudienceValue[];
  tags: string[] | null;
  highlights: string[] | null;
  coverImageUrl: string | null;
  previewImageUrl: string | null;
  galleryImageUrls: string[] | null;
  ratingAverage: unknown;
  ratingCount: number;
  status: RouteStatusValue;
  isPublished: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type RawRouteDetailsRecord = RawRouteRecord & {
  descriptionMarkdown: string | null;
  howToGet: string | null;
  howToReturn: string | null;
  safetyNotes: string | null;
  interestingFacts: string[] | null;
  trackGeoJson: unknown;
  trackSourceFormat: string | null;
  trackSourceFilename: string | null;
  trackUpdatedAt: Date | string | null;
  pointsOfInterest: unknown;
};

export type CatalogRoute = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  city: string;
  region: string;
  difficulty: RouteDifficultyValue;
  distanceKm: number;
  durationMinutes: number;
  suitableFor: RouteAudienceValue[];
  tags: string[];
  highlights: string[];
  coverImageUrl: string | null;
  previewImageUrl: string | null;
  galleryImageUrls: string[];
  ratingAverage: number | null;
  ratingCount: number;
  status: RouteStatusValue;
  publishedAt: Date | null;
  createdAt: Date;
};

export type RouteDetails = CatalogRoute & {
  descriptionMarkdown: string;
  howToGet: string | null;
  howToReturn: string | null;
  safetyNotes: string | null;
  interestingFacts: string[];
  trackGeoJson: RouteTrackGeoJson | null;
  trackSourceFormat: string | null;
  trackSourceFilename: string | null;
  trackUpdatedAt: Date | null;
  pointsOfInterest: RoutePointOfInterest[];
  authors: RouteAuthorSummary[];
};
