import type {
  DistanceFilterValue,
  DurationFilterValue,
  RouteAudienceValue,
  RouteDifficultyValue,
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
  ratingAverage: unknown;
  ratingCount: number;
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
  ratingAverage: number | null;
  ratingCount: number;
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
  pointsOfInterest: RoutePointOfInterest[];
};
