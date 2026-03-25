package pets

import (
	"fmt"
	"strconv"
)

// DeletePetCore централизованно удаляет питомца с проверкой прав доступа.
// Параметр contextID может быть org_id (если isOrg=true) или user_id.
func (h *Handler) DeletePetCore(petIDStr string, contextID int, contextType string) error {
	petID, err := strconv.Atoi(petIDStr)
	if err != nil {
		return fmt.Errorf("invalid pet ID")
	}

	var query string
	switch contextType {
	case "org":
		query = `DELETE FROM pets WHERE id = $1 AND org_id = $2`
	case "owner":
		query = `DELETE FROM pets WHERE id = $1 AND user_id = $2 AND relationship = 'owner'`
	case "curator":
		query = `DELETE FROM pets WHERE id = $1 AND user_id = $2 AND relationship = 'curator'`
	default:
		return fmt.Errorf("invalid context type")
	}

	res, err := h.db.Exec(query, petID, contextID)
	if err != nil {
		return fmt.Errorf("failed to delete pet: %v", err)
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("pet not found or access denied")
	}

	return nil
}
