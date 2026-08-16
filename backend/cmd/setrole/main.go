// Command setrole is a bootstrapping tool for assigning a role directly via
// the Admin SDK, bypassing the "caller must already be admin" check that
// guards the HTTP API's POST /api/admin/set-role endpoint. Use it once, to
// create the very first admin. After that, admins should use the HTTP
// endpoint instead of this tool.
//
// Usage:
//
//	go run ./cmd/setrole <uid> <admin|user>
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/joho/godotenv"

	"github.com/tylersmith0/tabletalk/backend/internal/firebaseapp"
)

func main() {
	_ = godotenv.Load()

	if len(os.Args) != 3 || (os.Args[2] != "admin" && os.Args[2] != "user") {
		fmt.Fprintln(os.Stderr, "usage: go run ./cmd/setrole <uid> <admin|user>")
		os.Exit(1)
	}
	uid, role := os.Args[1], os.Args[2]

	ctx := context.Background()
	client, err := firebaseapp.NewAuthClient(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to initialize Firebase: %v\n", err)
		os.Exit(1)
	}

	if err := client.SetCustomUserClaims(ctx, uid, map[string]any{"role": role}); err != nil {
		fmt.Fprintf(os.Stderr, "failed to set role: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("set role=%s for uid=%s\n", role, uid)
}
