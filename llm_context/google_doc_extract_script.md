This is the finalized blueprint for the Google Doc Segmenter & HTML Exporter. This plan incorporates error handling for execution timeouts, precise metadata extraction using Regex, and robust HTML/Image conversion.

Phase 1: Persistence & Timeout Architecture
To handle large documents that exceed the 6-minute Google Apps Script limit, the script will use a Checkpoint System.

State Management: Use PropertiesService to store a key (LAST_PROCESSED_CHUNK).

Timer Mechanism: Initialize a start-time variable. Within the main loop, check if elapsedTime > 300,000ms (5 minutes).

Graceful Exit: If the limit is reached, save the current chunk index and trigger a UI alert instructing the user to run the script again to resume.

Reset Capability: Provide a secondary function (resetProgress) to clear the cache and start from the beginning.

Phase 2: Document Segmentation (Chunking)
Iterative Scanning: Scan every element in the document body.

Delimiter Logic: Every time a paragraph starts with the string "Spine Region:", consider it the start of a new "Sub-Document."

Chunk Storage: Store each segment as an array of Document Elements (Paragraphs, ListItems, Images) to preserve object properties for later processing.

Phase 3: High-Precision Metadata Extraction
Metadata can be separated by paragraph breaks or soft newlines (\n).

Text Aggregation: Capture the text of the first 3–5 elements of a chunk and join them into a single string.

Regex Extraction: Apply three specific Regular Expressions to extract only the values following the colon:

Spine Region:\s*(.+)

Type of Imaging:\s*(.+)

Measurement:\s*(.+)

Value Sanitization:

Discard the field labels (e.g., "Spine Region:").

Split results by newline to ensure that if multiple metadata fields are on one line, they are separated.

Apply .toLowerCase() to the Region and Type.

Retain the original casing for the Measurement.

Phase 4: Folder Hierarchy & Image Externalization
Recursive Navigation: Use a helper function getOrCreateFolder(parent, name) to build the path: Root > region > type > measurement.

Asset Management: Inside the measurement folder, create/find a subfolder named images.

Image Processing:

Traverse the chunk for InlineImage elements.

Convert each image to a Blob and save it as a file (e.g., image_1.png) in the images/ folder.

Generate a relative HTML link: <img src="images/image_1.png" />.

Phase 5: HTML Conversion Engine
A custom converter is required to handle text attributes and metadata skipping.

Metadata Exclusion: During conversion, detect paragraphs that contain the extracted metadata strings and skip them to prevent duplicate headers in the HTML file.

Safe Text Processing: To avoid the "Index out of bounds" error, use getTextAttributeIndices(). This allows the script to process "runs" of text based on formatting changes rather than iterating character-by-character.

Style Preservation: Wrap text runs in <b>, <i>, or <u> tags based on the attributes detected at the start of each index run.

Structure: Wrap paragraphs in <p> and ListItems in <li>.

Phase 6: Tail-End Cleanup & Export
Trailing Space Removal: Once the HTML string is generated, apply a Regular Expression (e.g., /(<p>(&nbsp;|\s)*<\/p>)+$/) to remove all empty paragraphs or lines from the end of the content.

HTML Finalization:

Check for existing index.html files in the destination folder.

Trash existing versions to ensure a clean export.

Create the new index.html file with the sanitized HTML string.

Progress Update: Log the successful export to the console and update the PropertiesService checkpoint.

Workflow Summary for the User
Initialize: Run the script. If the document is small, it finishes in one go.

Resume: If the document is very large (e.g., 100+ pages), the script will pause and ask you to run it again. It picks up exactly where it stopped.

Verify: The script creates a clean nested folder structure in Drive with index.html files that reference local images/ folders, ready for web deployment or localized viewing.


