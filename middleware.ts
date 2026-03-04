import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const isAuthPage = createRouteMatcher([
  "/sign-in",
  "/en/sign-in",
  "/pl/sign-in",
  "/forgot-password",
  "/en/forgot-password",
  "/pl/forgot-password",
]);
// const isProtectedRoute = createRouteMatcher(["/"]);

const intlMiddleware = createMiddleware(routing);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isAuthPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
  if (!isAuthPage(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  return intlMiddleware(request);
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
