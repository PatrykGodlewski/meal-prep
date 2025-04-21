// File: collectFiles.js

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = "all_code_for_refactor.txt";
const PROJECT_ROOT = process.cwd();

const PROMPT = `
# Refactor Prompt

You are tasked with refactoring this codebase from Supabase to Convex.
Please analyze the following files and provide a migration plan and code changes.

---

`;

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".scss"];

// Helper function to check if a path is a directory
function isDirectory(filePath) {
  return fs.statSync(filePath).isDirectory();
}

// Helper function to check if a path is a file
function isFile(filePath) {
  return fs.statSync(filePath).isFile();
}

// Recursively collect all file paths, ignoring dot files/dirs and filtering by extension
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    // Ignore dot files and dot directories
    if (file.startsWith(".")) return;

    const fullPath = path.join(dir, file);
    if (isDirectory(fullPath)) {
      getAllFiles(fullPath, fileList);
    } else if (isFile(fullPath)) {
      const ext = path.extname(file);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  });
  return fileList;
}

// Main function
function main() {
  // Write the prompt at the top of the output file
  fs.writeFileSync(OUTPUT_FILE, PROMPT);

  const allFiles = getAllFiles(PROJECT_ROOT);

  allFiles.forEach((filePath) => {
    // Skip the output file itself to avoid recursion
    if (path.resolve(filePath) === path.resolve(OUTPUT_FILE)) return;

    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const dirName = path.dirname(relativePath);
    const fileName = path.basename(filePath);

    const header = `\n---\n# File: ${fileName}\n# Dir: ${dirName}\n---\n`;
    const content = fs.readFileSync(filePath, "utf8");

    fs.appendFileSync(OUTPUT_FILE, header + content + "\n");
  });

  console.log(`All files have been written to ${OUTPUT_FILE}`);
}

main();
