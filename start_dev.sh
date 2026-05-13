#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Running generate.py to update structure.json and process HTML files ---"
python3 scripts/generate.py

echo ""
echo "--- Starting local HTTP server from the /pages directory ---"
echo "You can access your local changes at: http://localhost:8000"
echo "Press Ctrl+C to stop the server."
echo ""

# Change directory to 'pages' and then run the server
(cd pages && python3 -m http.server 8000)
