package migrations

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"sort"
)

// Simple migration runner: executes all .sql files in folder in lexicographic order.
// For dev only. In production prefer a migration tool like golang-migrate.
func RunMigrations(db *sql.DB, migrationsDir string) error {
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return err
	}
	sort.Strings(files)

	for _, f := range files {
		content, err := ioutil.ReadFile(f)
		if err != nil {
			return err
		}
		// split by semicolon, but naive; expect single-statement files or use transactions
		tx, err := db.Begin()
		if err != nil {
			return err
		}
		if _, err := tx.Exec(string(content)); err != nil {
			tx.Rollback()
			// log file name and error
			log.Printf("migration %s failed: %v", f, err)
			return fmt.Errorf("migration %s failed: %w", f, err)
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}
