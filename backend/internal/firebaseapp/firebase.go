// Package firebaseapp wires up the Firebase Admin SDK.
package firebaseapp

import (
	"context"
	"fmt"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

// NewAuthClient initializes the Firebase Admin SDK and returns an Auth
// client, which can verify ID tokens and set custom claims (roles).
//
// Credentials are loaded from one of, in order:
//  1. FIREBASE_SERVICE_ACCOUNT_JSON - the service account key JSON as a
//     single-line string.
//  2. GOOGLE_APPLICATION_CREDENTIALS - a path to the service account key
//     JSON file, picked up automatically by the SDK's default credential
//     resolution.
func NewAuthClient(ctx context.Context) (*auth.Client, error) {
	var opts []option.ClientOption

	switch {
	case os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON") != "":
		opts = append(opts, option.WithCredentialsJSON([]byte(os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON"))))
	case os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") != "":
		// No explicit option needed - the SDK finds it via Application
		// Default Credentials.
	default:
		return nil, fmt.Errorf("no Firebase credentials found: set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS")
	}

	app, err := firebase.NewApp(ctx, nil, opts...)
	if err != nil {
		return nil, fmt.Errorf("initializing firebase app: %w", err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("initializing firebase auth client: %w", err)
	}

	return client, nil
}
