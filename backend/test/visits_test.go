package tests

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestDurationCalculation(t *testing.T) {
	tIn := time.Date(2025, 1, 1, 8, 0, 0, 0, time.UTC)
	tOut := time.Date(2025, 1, 1, 10, 30, 0, 0, time.UTC)
	dur := tOut.Sub(tIn)
	mins := int64(dur.Minutes())
	assert.Equal(t, int64(150), mins)
}
