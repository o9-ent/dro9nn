// Package main is the entry point for the o9nn API server.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/o9nn/dro9nn/apps/api-server/internal/handlers"
	apimiddleware "github.com/o9nn/dro9nn/apps/api-server/internal/middleware"
)

// Version is the server version.
const Version = "0.1.0"

func main() {
	// Parse command line flags
	port := flag.Int("port", 8080, "Server port")
	flag.Parse()

	// Create router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	// CORS configuration
	// NOTE: In production, replace AllowedOrigins with specific origins
	// and enable AllowCredentials only when using explicit origins.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false, // Must be false when using wildcard origins
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", handlers.HealthCheck)
	r.Get("/version", handlers.GetVersion(Version))

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Add authentication middleware
		r.Use(apimiddleware.AuthMiddleware)

		// Models routes
		r.Route("/models", func(r chi.Router) {
			r.Get("/", handlers.ListModels)
			r.Post("/load", handlers.LoadModel)
			r.Get("/{modelID}", handlers.GetModel)
			r.Delete("/{modelID}", handlers.UnloadModel)
			r.Post("/{modelID}/infer", handlers.Infer)
			r.Post("/{modelID}/generate", handlers.Generate)
			r.Post("/{modelID}/generate/stream", handlers.GenerateStream)
		})

		// Agents routes
		r.Route("/agents", func(r chi.Router) {
			r.Get("/", handlers.ListAgents)
			r.Post("/", handlers.CreateAgent)
			r.Get("/{agentID}", handlers.GetAgent)
			r.Delete("/{agentID}", handlers.DeleteAgent)
			r.Post("/{agentID}/chat", handlers.Chat)
			r.Post("/{agentID}/tool-result", handlers.ExecuteToolResult)
			r.Get("/{agentID}/history", handlers.GetHistory)
			r.Delete("/{agentID}/history", handlers.ClearHistory)
		})
	})

	// Create server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", *port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("o9nn API Server v%s starting on port %d", Version, *port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}
