package services

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/jayrsecadron0421/visitor-management/internal/config"
	"github.com/jayrsecadron0421/visitor-management/internal/models"
)

// SeedAdmin ensures admin account exists; uses env values in cfg.
func SeedAdmin(db *gorm.DB, cfg *config.Config) error {
	if cfg.AdminEmail == "" || cfg.AdminPass == "" {
		return errors.New("admin credentials missing in config")
	}
	var admin models.User
	if err := db.Where("email = ?", cfg.AdminEmail).First(&admin).Error; err == nil {
		// admin already present, update role if necessary
		if admin.Role != "admin" {
			admin.Role = "admin"
			db.Save(&admin)
		}
		return nil
	} else if err != gorm.ErrRecordNotFound {
		return err
	}

	// create admin
	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPass), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin = models.User{
		FullName:     "Admin",
		Email:        cfg.AdminEmail,
		PhoneNumber:  "",
		Birthday:     time.Now(),
		PasswordHash: string(hash),
		Role:         "admin",
		IsActive:     true,
	}
	if err := db.Create(&admin).Error; err != nil {
		return err
	}
	return nil
}
