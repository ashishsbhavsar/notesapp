import { useEffect, useState } from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { uploadData } from 'aws-amplify/storage';

Amplify.configure(amplifyConfig);
const client = generateClient();

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });

  // Fetch notes from DataStore
  async function fetchNotes() {
    const res = await client.models.Note.list();
    setNotes(res.data);
  }

  // Create a new note and upload image (if provided)
  async function createNote(e) {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    const noteData = { name: formData.name, description: formData.description };

    if (formData.image) {
      const imageKey = `${Date.now()}-${formData.image.name}`;
      await uploadData({ key: imageKey, data: formData.image });
      noteData.image = imageKey;
    }

    await client.models.Note.create(noteData);
    setFormData({ name: '', description: '', image: null });
    fetchNotes();
  }

  // Delete a note
  async function deleteNote(noteId) {
    await client.models.Note.delete({ id: noteId });
    fetchNotes();
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="App">
          <header className="App-header">
            <h1>Welcome, {user.username}</h1>
            <button onClick={signOut}>Sign out</button>
            <h2>Create Note</h2>
            <form onSubmit={createNote}>
              <input
                type="text"
                placeholder="Note name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              />
              <button type="submit">Create Note</button>
            </form>
            <h2>Notes</h2>
            <ul>
              {notes.map((note) => (
                <li key={note.id}>
                  <strong>{note.name}</strong>: {note.description}
                  {note.image && <p>Image: {note.image}</p>}
                  <button onClick={() => deleteNote(note.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </header>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
