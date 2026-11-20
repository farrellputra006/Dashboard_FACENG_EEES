<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request and attach enterprise HTTP security headers.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Remove PHP version disclosure header before response is sent
        @header_remove('X-Powered-By');

        $response = $next($request);

        // 2. Remove X-Powered-By from Symfony Response header bag
        $response->headers->remove('X-Powered-By');

        // 3. Corporate Security Headers
        // X-Frame-Options: SAMEORIGIN allows safe PDF preview inside <iframe> on same origin
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME-sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy (Camera, Microphone, Geolocation disabled)
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // X-XSS-Protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        return $response;
    }
}
