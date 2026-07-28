// Package main provides the entry point for the cogctl CLI.
package main

import (
	"os"

	"github.com/o9nn/dro9nn/packages/cli/internal/cmd"
)

// Version information - set at build time
var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	cmd.SetVersionInfo(version, commit, date)
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
