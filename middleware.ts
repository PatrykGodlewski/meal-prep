import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { routing } from "./i18n/routing";
import createMiddleware from "next-intl/middleware";

const isSignInPage = createRouteMatcher([
  "/sign-in",
  "/en/sign-in",
  "/pl/sign-in",
]);
// const isProtectedRoute = createRouteMatcher(["/"]);

const intlMiddleware = createMiddleware(routing);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
  if (!isSignInPage(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  return intlMiddleware(request);
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
