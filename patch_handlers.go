package main

import (
"crypto/rand"
"encoding/hex"
)

// Dummy block to format easily via goimports later
func stub() {
	b := make([]byte, 16)
	rand.Read(b)
	hex.EncodeToString(b)
}
