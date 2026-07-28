// Package middleware provides HTTP middleware for the API server.
package middleware

import (
	"net/http"
	"strings"
)

// AuthMiddleware handles API authentication.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get authorization header
		auth := r.Header.Get("Authorization")

		// For development, allow unauthenticated requests
		// In production, this should validate the API key
		if auth == "" {
			// Allow for now, but log warning
			next.ServeHTTP(w, r)
			return
		}

		// Validate ****** format
		if !strings.HasPrefix(auth, "Bearer ") {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		// Extract and validate token
		// token := strings.TrimPrefix(auth, "Bearer ")
		// In production, validate the token against a database or auth service

		next.ServeHTTP(w, r)
	})
}
