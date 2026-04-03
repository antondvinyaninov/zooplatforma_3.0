package main

import (
	"fmt"
	"github.com/joho/godotenv"
	"github.com/zooplatforma/backend/internal/shared/config"
	"github.com/zooplatforma/backend/internal/shared/database"
)

func main() {
	godotenv.Load(".env")
	cfg := config.Load()
	db, err := database.Connect(cfg.Database)
	if err != nil {
		fmt.Println("Error connecting to database:", err)
		return
	}
	defer db.Close()

	rows, err := db.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'notifications';
	`)
	if err != nil {
		fmt.Println("Error query:", err)
		return
	}
	defer rows.Close()

	fmt.Println("Columns for 'notifications' table:")
	for rows.Next() {
		var colName, dataType string
		rows.Scan(&colName, &dataType)
		fmt.Printf("- %s: %s\n", colName, dataType)
	}
}
