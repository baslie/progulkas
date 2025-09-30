export type RouteCommentStatus = "PENDING" | "PUBLISHED" | "REJECTED" | "HIDDEN";

export type RouteRatingValue = 1 | 2 | 3 | 4 | 5;

export type RouteRatingStats = {
  average: number | null;
  count: number;
  distribution: Record<RouteRatingValue, number>;
  viewerValue: RouteRatingValue | null;
};

export type RouteCommentAuthor = {
  id: string;
  name: string | null;
  email: string;
};

export type RouteCommentNode = {
  id: string;
  routeId: string;
  parentId: string | null;
  content: string;
  status: RouteCommentStatus;
  createdAt: string;
  updatedAt: string;
  spamScore: number;
  isFlagged: boolean;
  isOwn: boolean;
  author: RouteCommentAuthor;
  children: RouteCommentNode[];
};

export type RouteCommentsSnapshot = {
  totalPublished: number;
  tree: RouteCommentNode[];
};

export type RouteEngagementSnapshot = {
  rating: RouteRatingStats;
  comments: RouteCommentsSnapshot;
};

export type NotificationType =
  | "ROUTE_COMMENT"
  | "COMMENT_REPLY"
  | "ROUTE_RATING"
  | "COMMENT_FLAGGED";

export type NotificationView = {
  id: string;
  type: NotificationType;
  data: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};
