package store

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"

    "github.com/jayrsecadron0421/visitor-management/internal/config"
)

func NewGormDB(cfg *config.Config) (*gorm.DB, error) {
    dsn := cfg.PostgresDSN()
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    return db, nil
}
