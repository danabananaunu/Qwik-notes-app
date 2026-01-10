import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
  useComputed$
} from '@builder.io/qwik';

type NoteAttachment = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

type Note = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  attachments: NoteAttachment[];
};

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function parseTags(input: string): string[] {
  const set = new Set<string>();
  input
    .split(',')
    .map((t) => normalizeTag(t))
    .filter(Boolean)
    .forEach((t) => set.add(t));
  return [...set];
}

function containsText(note: Note, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (note.title + ' ' + note.content).toLowerCase().includes(query);
}

export default component$(() => {
  const STORAGE_KEY = 'qwik-notes-full';

  const notes = useSignal<Note[]>([]);

  const search = useSignal('');
  const selectedTag = useSignal<string>('all');

  const editingId = useSignal<number | null>(null);
  const title = useSignal('');
  const content = useSignal('');
  const tagsInput = useSignal('');
  const attachments = useSignal<NoteAttachment[]>([]);

  useVisibleTask$(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        notes.value = JSON.parse(raw);
      } catch {
        notes.value = [];
      }
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => notes.value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value));
  });

  const allTags = useComputed$(() => {
    const set = new Set<string>();
    for (const n of notes.value) {
      for (const t of n.tags) set.add(t);
    }
    return ['all', ...Array.from(set).sort()];
  });

  const filteredNotes = useComputed$(() => {
    const q = search.value;
    const tag = selectedTag.value;

    return notes.value.filter((n) => {
      const passText = containsText(n, q);
      const passTag = tag === 'all' ? true : n.tags.includes(tag);
      return passText && passTag;
    });
  });

  const clearEditor$ = $(() => {
    editingId.value = null;
    title.value = '';
    content.value = '';
    tagsInput.value = '';
    attachments.value = [];
  });

  const startEdit$ = $((note: Note) => {
    editingId.value = note.id;
    title.value = note.title;
    content.value = note.content;
    tagsInput.value = note.tags.join(', ');
    attachments.value = note.attachments ?? [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const deleteNote$ = $((id: number) => {
    notes.value = notes.value.filter((n) => n.id !== id);
    if (editingId.value === id) {
      editingId.value = null;
      title.value = '';
      content.value = '';
      tagsInput.value = '';
      attachments.value = [];
    }
  });

  const onFilesSelected$ = $(async (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const fileArr = Array.from(files);

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });

    const newAttachments: NoteAttachment[] = [];
    for (const f of fileArr) {
      const dataUrl = await toDataUrl(f);
      newAttachments.push({
        name: f.name,
        type: f.type,
        size: f.size,
        dataUrl
      });
    }

    attachments.value = [...attachments.value, ...newAttachments];

    input.value = '';
  });

  const removeAttachment$ = $((name: string) => {
    attachments.value = attachments.value.filter((a) => a.name !== name);
  });

  const saveNote$ = $(() => {
    const t = title.value.trim();
    const c = content.value.trim();
    if (!t || !c) return;

    const tags = parseTags(tagsInput.value);

    if (editingId.value) {
      notes.value = notes.value.map((n) =>
        n.id === editingId.value
          ? {
              ...n,
              title: t,
              content: c,
              tags,
              attachments: attachments.value
            }
          : n
      );
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: t,
        content: c,
        tags,
        attachments: attachments.value
      };
      notes.value = [newNote, ...notes.value];
    }

    clearEditor$();
  });

  const setTag$ = $((tag: string) => {
    selectedTag.value = tag;
  });

  return (
    <div class="app-root">
      <header class="app-header">
        <h1 class="app-title">Qwik-notes-app</h1>

        <input
          class="search-input"
          placeholder="Search notes..."
          value={search.value}
          onInput$={(e) =>
            (search.value = (e.target as HTMLInputElement).value)
          }
        />
      </header>

      <div class="main-layout">
        <section class="editor-section">
          <div class="editor-card">
            <h2 class="section-title">{editingId.value ? 'Edit note' : 'New note'}</h2>

            <div class="editor-form">
              <div class="field">
                <span class="field-label">Title</span>
                <input
                  class="field-input"
                  value={title.value}
                  onInput$={(e) =>
                    (title.value = (e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div class="field">
                <span class="field-label">Content</span>
                <textarea
                  class="field-textarea"
                  value={content.value}
                  onInput$={(e) =>
                    (content.value = (e.target as HTMLTextAreaElement).value)
                  }
                />
              </div>

              <div class="field">
                <span class="field-label">Tags</span>
                <input
                  class="field-input"
                  placeholder="e.g. school, work"
                  value={tagsInput.value}
                  onInput$={(e) =>
                    (tagsInput.value = (e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div class="field">
                <span class="field-label">Attachments</span>

                <input
                  id="file-input"
                  class="file-input-hidden"
                  type="file"
                  multiple
                  onChange$={onFilesSelected$}
                />
                <label for="file-input" class="custom-file-button">
                  Choose files
                </label>

                {attachments.value.length > 0 && (
                  <ul class="file-list">
                    {attachments.value.map((a) => (
                      <li key={a.name}>
                        {a.name}{' '}
                        <button
                          type="button"
                          class="btn btn-secondary btn-small"
                          onClick$={$(() => removeAttachment$(a.name))}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div class="editor-actions">
                {editingId.value && (
                  <button class="btn btn-secondary" type="button" onClick$={clearEditor$}>
                    Cancel
                  </button>
                )}

                <button class="btn btn-primary" type="button" onClick$={saveNote$}>
                  {editingId.value ? 'Update note' : 'Add note'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="list-section">
          <div class="list-card">
            <div class="list-header">
              <h2 class="section-title">Your notes</h2>
              <span class="note-count">{filteredNotes.value.length} notes</span>
            </div>

            <div class="tag-filter">
              {allTags.value.map((t) => (
                <button
                  key={t}
                  type="button"
                  class={
                    'tag-pill ' + (selectedTag.value === t ? 'tag-pill-active' : '')
                  }
                  onClick$={$(() => setTag$(t))}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>

            {filteredNotes.value.length === 0 ? (
              <p class="empty-text">No notes found.</p>
            ) : (
              <ul class="notes-list">
                {filteredNotes.value.map((n) => (
                  <li key={n.id} class="note-item">
                    <div>
                      <p class="note-title">{n.title}</p>
                      <p class="note-content">{n.content}</p>
                    </div>

                    <div class="note-footer">
                      <div class="note-tags">
                        {n.tags.map((t) => (
                          <span key={t} class="note-tag">
                            {t}
                          </span>
                        ))}
                      </div>

                      <div class="note-actions">
                        <button
                          type="button"
                          class="btn btn-small btn-primary"
                          onClick$={$(() => startEdit$(n))}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-small btn-danger"
                          onClick$={$(() => deleteNote$(n.id))}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {n.attachments?.length > 0 && (
                      <div class="file-list">
                        {n.attachments.map((a) => (
                          <div key={a.name}>
                            <a href={a.dataUrl} download={a.name}>
                              {a.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );

});
