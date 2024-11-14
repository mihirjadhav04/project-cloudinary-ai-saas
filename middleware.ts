import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

// Define public routes that don't require user authentication
const isPublicRoute = createRouteMatcher([
    "/signin",
    "/signup",
    "/",
    "/home"
]);

// Define public API route(s) that don't require user authentication
const isPublicApiRoute = createRouteMatcher([
    "api/videos"
]);

// Main middleware function using Clerk for authentication
export default clerkMiddleware((auth, req) => {
    const { userId } = auth();  // Get the user's ID if they're logged in
    const currentUrl = new URL(req.url);  // Get the current URL of the request
    const isAccessingDashboard = currentUrl.pathname === "/home";  // Check if the user is accessing the dashboard
    const isApiRequest = currentUrl.pathname.startsWith("/api");  // Check if the request is for an API route

    // If the user is logged in and trying to access a public route that isn't the dashboard
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        // Redirect logged-in users away from public routes to the dashboard
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // If the user is not logged in
    if (!userId) {
        // Redirect non-logged-in users trying to access private routes or non-public API routes to the signin page
        if (!isPublicRoute(req) && isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/signin", req.url));
        }
    }

    // For API requests that are not marked as public, redirect to the signin page if the user is not logged in
    if (isApiRequest && !isPublicApiRoute(req)) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }

    return NextResponse.next()
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
