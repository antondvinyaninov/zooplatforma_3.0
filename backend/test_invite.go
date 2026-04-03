package main

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"os"
)

func main() {
	connStr := "postgres://zp:password@88.218.121.213:5967/zp-db?sslmode=disable"
	// Replace password with actual if possible, or just look at handler logs!
	fmt.Println("Just checking...")
}
