#!/data/data/com.termux/files/usr/bin/bash

# 🎬 Ask for movie details
echo "Add a New Movie to movies.json"
read -p "Title: " title
read -p "Front Image URL: " front
read -p "Back Image URL: " back
read -p "Description: " desc
read -p "Watch Link (stream URL): " stream

# 📦 Create new JSON entry
new_entry=$(cat <<EOF
  {
    "title": "$title",
    "frontImage": "$front",
    "backImage": "$back",
    "description": "$desc",
    "watchLink": "$stream"
  }
EOF
)

# 🧠 Inject into movies.json
tmp_file=$(mktemp)
line_count=$(wc -l < movies.json)

if [ "$line_count" -le 3 ]; then
  # If file is nearly empty
  echo "[$new_entry]" > movies.json
else
  # Strip first and last line (to insert in middle)
  tail -n +2 movies.json | sed '$d' > "$tmp_file"
  echo "," >> "$tmp_file"
  echo "$new_entry" >> "$tmp_file"
  echo "]" >> "$tmp_file"
  echo "[" > movies.json
  cat "$tmp_file" >> movies.json
fi

rm -f "$tmp_file"
echo "✅ Movie '$title' added successfully!"
