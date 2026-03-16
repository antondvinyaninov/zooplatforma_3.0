import urllib.request
import json
import base64

try:
    login_data = json.dumps({"phone": "+79991234567", "password": "password"}).encode()
    req_login = urllib.request.Request("http://localhost:8000/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req_login) as resp:
        login_res = json.loads(resp.read().decode())
        if login_res.get("success"):
            token = login_res["data"]["token"]
            
            # Fetch posts
            req_posts = urllib.request.Request("http://localhost:8000/api/posts?limit=5", headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req_posts) as p_resp:
                posts_data = json.loads(p_resp.read().decode())
                print(f"Posts fetched: {len(posts_data.get('data', []))}")
                
except Exception as e:
    print(f"Error: {e}")
