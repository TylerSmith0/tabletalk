// Package authmw provides HTTP middleware for verifying Firebase ID tokens
// and enforcing role-based access using their custom claims.
package authmw

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
)

type contextKey string

const tokenContextKey contextKey = "firebaseToken"

// DefaultRole is used when a token carries no "role" custom claim, e.g. a
// user who was created before roles existed or was never explicitly
// assigned one.
const DefaultRole = "user"

// Verify checks the "Authorization: Bearer <idToken>" header against
// Firebase and, on success, stashes the decoded token on the request
// context for downstream handlers (see FromContext).
func Verify(client *auth.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			idToken, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
			if !ok || idToken == "" {
				writeError(w, http.StatusUnauthorized, "missing bearer token")
				return
			}

			token, err := client.VerifyIDToken(r.Context(), idToken)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), tokenContextKey, token)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole wraps a handler so it responds 403 unless the verified
// caller's "role" custom claim matches. Must be chained after Verify.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := FromContext(r.Context())
			if !ok {
				writeError(w, http.StatusUnauthorized, "missing verified token")
				return
			}
			if Role(token) != role {
				writeError(w, http.StatusForbidden, "insufficient role")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// FromContext returns the token stashed by Verify, if any.
func FromContext(ctx context.Context) (*auth.Token, bool) {
	token, ok := ctx.Value(tokenContextKey).(*auth.Token)
	return token, ok
}

// Role reads the "role" custom claim off a verified token, defaulting to
// DefaultRole when the claim is absent.
func Role(token *auth.Token) string {
	return RoleFromClaims(token.Claims)
}

// RoleFromClaims reads the "role" custom claim out of a raw claims map
// (token.Claims and a *auth.ExportedUserRecord's CustomClaims are both this
// same map[string]any shape), defaulting to DefaultRole when absent.
func RoleFromClaims(claims map[string]any) string {
	if role, ok := claims["role"].(string); ok && role != "" {
		return role
	}
	return DefaultRole
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
