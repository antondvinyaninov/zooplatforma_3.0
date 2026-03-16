import psycopg2
import os

try:
    conn = psycopg2.connect("dbname=zp-db user=zp password=lmLG7k2ed4vas19 host=88.218.121.213 port=5967 sslmode=disable")
    cur = conn.cursor()
    
    query = """
        SELECT 
            p.id, p.author_id, p.content, p.created_at, p.updated_at,
            COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), 0 as shares_count,
            u.name, u.last_name, u.avatar, u.verified,
            COALESCE(p.media_urls, '[]') as media,
            COALESCE(p.tags, '[]') as tags,
            COALESCE(p.attachments, '[]') as attachments,
            p.author_type,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', pet.id,
                            'name', pet.name,
                            'species', pet.species,
                            'breed', pet.breed,
                            'gender', pet.gender,
                            'photo', pet.photo_url,
                            'color', pet.color,
                            'size', pet.size
                        )
                    )
                    FROM pets pet
                    WHERE pet.id = ANY(
                        CASE 
                            WHEN p.attached_pets IS NULL OR p.attached_pets = '' OR p.attached_pets = '[]' THEN ARRAY[]::integer[]
                            WHEN jsonb_typeof(p.attached_pets::jsonb) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p.attached_pets::jsonb)::integer)
                            ELSE ARRAY[]::integer[]
                        END
                    )
                ),
                '[]'
            ) as pets_data,
            EXISTS(SELECT 1 FROM polls WHERE post_id = p.id) as has_poll
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.is_deleted = false AND p.author_type = 'user'
        ORDER BY p.created_at DESC
        LIMIT 1 OFFSET 0
    """
    
    cur.execute(query)
    posts = cur.fetchall()
    print(f"Total posts found: {len(posts)}")
    for p in posts:
        # Check for NULLs
        print([x is None for x in p])
except Exception as e:
    print(e)
