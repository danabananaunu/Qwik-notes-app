This project is a Qwik-based notes application developed as part of a comparative study of modern frontend frameworks. The application allows users to create, edit, delete, search, and filter notes, with all data stored locally in the browser.

- Notes can be created with a title, text content, optional tags, and optional file attachments
- Notes can be edited and deleted, with all changes reflected immediately in the UI
- A search bar allows real-time filtering of notes based on title and content
- Tag-based filtering allows narrowing down notes by selected tags
- All notes are persisted using browser local storage, so data remains after page reloads
- File attachments are handled on the client side and associated with individual notes

What was used:
- Qwik + Qwik City
- TypeScript
- Vite
- CSS (shared styling to keep UI consistent across framework implementations)


Node.js and npm must be installed on the system. The node_modules folder is intentionally not included in the repository and must be installed locally.
Instructions for deployment:
1. Clone the repository from GitHub to your local machine
2. Navigate into the project folder
3. Install dependencies: npm install
4. Create a productiod like version: npm run build
5. Run the code: npm run preview
6. Open the application in the browser using the local development URL provided by Vite
