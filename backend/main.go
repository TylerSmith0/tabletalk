// Command backend runs the tabletalk API server.
package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/tylersmith0/tabletalk/backend/internal/authmw"
	"github.com/tylersmith0/tabletalk/backend/internal/firebaseapp"
	"github.com/tylersmith0/tabletalk/backend/internal/handlers"
)

func main() {
	// Optional: local dev convenience. Fine if .env doesn't exist - in
	// production, real environment variables are set directly.
	_ = godotenv.Load()

	ctx := context.Background()

	authClient, err := firebaseapp.NewAuthClient(ctx)
	if err != nil {
		log.Fatalf("failed to initialize Firebase: %v", err)
	}

	h := handlers.New(authClient)
	verify := authmw.Verify(authClient)
	requireAdmin := authmw.RequireRole("admin")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.Healthz)
	mux.Handle("GET /api/me", verify(http.HandlerFunc(h.Me)))
	mux.Handle("POST /api/admin/set-role", verify(requireAdmin(http.HandlerFunc(h.SetRole))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
