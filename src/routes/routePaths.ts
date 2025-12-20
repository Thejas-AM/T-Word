export const ROUTES = {
  // Public Routes
  HOME: '/',

  // Private Routes
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
