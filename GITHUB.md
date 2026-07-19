# Option 1: Run the script directly for a preview
npm run commit

# Option 2: Just use an empty/dot message and the hook auto-generates it
git add .
git commit -m "."
# → chore(pages): +3 new, ~2 modified — ChatPage, useCallStore, ProfilePage

# Option 3: Commit with no message — hook fills it in
git commit