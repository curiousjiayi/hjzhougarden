# H.J. Zhou's digital garden

- Uses [11ty](https://github.com/11ty/eleventy) ([demo](https://eleventy-garden.netlify.app/))
- Uses [eleventy-garden](https://github.com/binyamin/eleventy-garden)

## :house: About

**Make your changes**

- Styling: The css file is in `/assets/style.css`
- Branding: Add your logo or avatar in `/assets/avatar.png`
- Content: `/_data/site.json` contains vital information to make the site your own
  - Drop your notes in the `/notes` folder (see **Writing notes** below)
- Testing: To view it locally, open a terminal and type `npm start`

## :pencil2: Writing notes

Every markdown file in `src/notes/` is a note. The filename is both the URL (`snowy.md` → `/notes/snowy/`) and the wiki-link target (`[[snowy]]`). Start the body with a `# Heading`. Use lowercase filenames: links are case-sensitive once deployed.

**Front matter** (all optional; put it between `---` lines at the top of the file)

| Field | What it does | Example |
|---|---|---|
| `title` | Overrides the title derived from the filename (used in the tab, lists, and backlinks) | `title: Why I have two names` |
| `tags` | Any tag becomes a collection. `essay` lists the note under "Long-form essays" on the home page | `tags: essay` or `tags: [essay, parrots]` |
| `date` | Publish date. Shows "Published …" in the kicker and sets order in the essay list. Without it, the note's date is its first git commit | `date: 2025-03-04` |
| `updated` | Revision date, shown as "Updated …" in the kicker. Set it by hand for substantive edits | `updated: 2025-04-01` |
| `draft` | `true` hides the note from production builds; it still shows under `npm start` | `draft: true` |
| `cover` | Header image shown above the title. Also used as the link-preview image | `cover: /assets/photo.jpeg` |
| `cover_alt` | Alt text for the cover | `cover_alt: A budgie on a perch` |
| `cover_width` | Display width of the cover in pixels (natural size if omitted) | `cover_width: 240` |
| `preview` | Hand-written snippet for the backlink hover card (default: first 240 characters of the note) | `preview: A short summary.` |
| `desc` | Meta description for search engines and link previews (default: the site description) | `desc: One sentence about this note.` |

**Links**

- `[[snowy]]` links to a note; `[[snowy|my bird]]` with custom text
- `[[snowy#Diet]]` links to a section heading; `[[#Diet]]` to a heading on the current page
- Links to other notes create backlinks automatically. External links (`http…`) open in a new tab and get the green stroke
- Markdown links to external pages work as usual: `[text](https://…)`

**Images**

- `![alt text](/assets/photo.jpeg)` renders centered, capped at the column width. Add `{width=300}` after it to size it
- With a caption, use HTML:
  ```html
  <figure>
  <img src="/assets/photo.jpeg" alt="Alt text" width="300" />
  <figcaption>The caption.</figcaption>
  </figure>
  ```
- Export photos at about 1600px wide before adding them; browsers can't display HEIC, so convert to JPEG or PNG first

**Publish it**

- You can use Netlify, Vercel, or whatever else works.
