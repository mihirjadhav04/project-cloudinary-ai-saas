import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

// Define public routes that don't require user authentication
const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/",
    "/home"
]);

// Define public API route(s) that don't require user authentication
const isPublicApiRoute = createRouteMatcher([
    "api/videos"
]);

// Main middleware function using Clerk for authentication
export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();  // Get the user's ID if they're logged in
    const currentUrl = new URL(req.url);  // Get the current URL of the request
    const isAccessingDashboard = currentUrl.pathname === "/home";  // Check if the user is accessing the dashboard
    const isApiRequest = currentUrl.pathname.startsWith("/api");  // Check if the request is for an API route

    console.log("USERID: ", userId);

    // Redirect logged-in users away from public routes to the dashboard
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // If the user is not logged in, restrict access to non-public routes and non-public API routes
    if (!userId) {
        // If accessing a non-public route or a non-public API route, redirect to the sign-in page
        if (!isPublicRoute(req) || (isApiRequest && !isPublicApiRoute(req))) {
            return NextResponse.redirect(new URL("/sign-in", req.url));
        }
    }

    // Allow access if authenticated or accessing a public route
    return NextResponse.next();
});

// Configuration for middleware to define which routes it should match and process
export const config = {
  matcher: [
    // Exclude internal Next.js routes and static files from middleware processing
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always process API routes
    '/(api|trpc)(.*)',
  ],
}
