package main

import (
"bytes"
"fmt"
"io/ioutil"
"mime/multipart"
"net/http"
)

func main() {
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "test.jpg")
	part.Write([]byte("fake image data"))
	writer.WriteField("media_type", "photo")
	writer.Close()

	req, _ := http.NewRequest("POST", "http://127.0.0.1:8000/api/media/upload", body)
	req.Header.Add("Content-Type", writer.FormDataContentType())
	// NOTE: We don't have a valid token, so this SHOULD return 401 Unauthorized
// BUT wait, if we don't send auth it returns 401. If we SEND a fake token, the auth middleware might reject it.
	// We need a VALID token to reach the Upload handler!

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	respBody, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("Status: %d\nResponse: %s\n", resp.StatusCode, string(respBody))
}
