#!/data/data/com.termux/files/usr/bin/bash

# Ask for movie details
echo "🎬 Add a New Movie"
read -p "Title: " title
read -p "Front Image URL: " front
read -p "Back Image URL: " back
read -p "Description: " desc
read -p "Stream URL: " stream

# Create JSON block
new_entry=$(cat <<EOF
  {
    "title": "$title",
    "frontImage": "$front",
    "backImage": "$back",
    "description": "$desc",
    "streamUrl": "$stream"
  }
EOF
)

# Insert it into movies.json
tmp_file=$(mktemp)
line_count=$(wc -l < movies.json)

if [ "$line_count" -le 3 ]; then
  # If file has only 2 brackets (empty array)
  echo "[$new_entry]" > movies.json
else
  # Add comma before appending
  tail -n +2 movies.json | sed '$d' > "$tmp_file"
  echo "," >> "$tmp_file"
  echo "$new_entry" >> "$tmp_file"
  echo "]" >> "$tmp_file"
  echo "[" > movies.json
  cat "$tmp_file" >> movies.json
fi

rm -f "$tmp_file"
echo "✅ Movie added successfully!"

