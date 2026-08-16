// Package handlers implements the HTTP handlers for the tabletalk backend.
package handlers

import (
	"encoding/json"
	"net/http"

	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/iterator"

	"github.com/tylersmith0/tabletalk/backend/internal/authmw"
)

// Handlers holds the shared dependencies HTTP handlers need.
type Handlers struct {
	AuthClient *auth.Client
}

func New(authClient *auth.Client) *Handlers {
	return &Handlers{AuthClient: authClient}
}

// Healthz is an unauthenticated liveness check.
func (h *Handlers) Healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Me returns the caller's identity and role, read straight off their
// verified ID token - no database lookup needed, since the role travels
// in the token as a custom claim.
func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	token, ok := authmw.FromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing verified token"})
		return
	}

	email, _ := token.Claims["email"].(string)

	writeJSON(w, http.StatusOK, map[string]string{
		"uid":   token.UID,
		"email": email,
		"role":  authmw.Role(token),
	})
}

type userSummary struct {
	UID       string `json:"uid"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Disabled  bool   `json:"disabled"`
	CreatedAt int64  `json:"createdAt"` // milliseconds since epoch
}

// ListUsers returns every Firebase user with their role, for the admin
// console's user table.
func (h *Handlers) ListUsers(w http.ResponseWriter, r *http.Request) {
	users := []userSummary{}

	iter := h.AuthClient.Users(r.Context(), "")
	for {
		u, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list users"})
			return
		}

		var createdAt int64
		if u.UserMetadata != nil {
			createdAt = u.UserMetadata.CreationTimestamp
		}

		users = append(users, userSummary{
			UID:       u.UID,
			Email:     u.Email,
			Role:      authmw.RoleFromClaims(u.CustomClaims),
			Disabled:  u.Disabled,
			CreatedAt: createdAt,
		})
	}

	writeJSON(w, http.StatusOK, users)
}

type setRoleRequest struct {
	UID  string `json:"uid"`
	Role string `json:"role"`
}

var allowedRoles = map[string]bool{"admin": true, "user": true}

// SetRole assigns a role to a target user via their custom claims. Only
// reachable by callers who are already admins - that check is enforced by
// authmw.RequireRole("admin") in the route wiring, not here.
func (h *Handlers) SetRole(w http.ResponseWriter, r *http.Request) {
	var req setRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.UID == "" || !allowedRoles[req.Role] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "uid is required and role must be 'admin' or 'user'"})
		return
	}

	claims := map[string]any{"role": req.Role}
	if err := h.AuthClient.SetCustomUserClaims(r.Context(), req.UID, claims); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to set role"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"uid": req.UID, "role": req.Role})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
