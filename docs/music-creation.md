# Music Creation Workflow

The app should treat songwriting as the primary task. Chord progressions are only ingredients inside a song, not a separate destination.

## Product model

A song has:

- Title
- Key
- Song lines
- A small chord palette per line
- Lyrics per line
- Chord placements over lyric words

A line is the core writing unit. The musician writes one lyric line, chooses the chords that belong to that line, then attaches each chord to the word where the harmony changes.

```text
        G              D          Em
I was walking through the static of the night
```

The chord is not attached to an arbitrary pixel position. It is attached to a word index inside the line. This makes the sheet stable when text changes, saves cleanly as JSON, and exports consistently.

## Recommended writing flow

1. Start from a title or hook.
2. Pick a key.
3. Create a first section with a familiar harmonic loop.
4. Write lyrics line by line.
5. For each line, add only the chords that line needs.
6. Click words to place chord changes above them.
7. Export a clean lead sheet when the song is playable.

## Good default song structures

- `Verse / Chorus / Verse / Chorus / Bridge / Chorus` — pop and rock default.
- `Verse / Pre-Chorus / Chorus / Verse / Pre-Chorus / Chorus / Bridge / Chorus` — bigger modern pop form.
- `AABA` — compact classic form, good for jazz/folk.
- `Verse / Refrain` — simple singer-songwriter form.

## Chord palette patterns

Use small, reusable line palettes rather than one huge global progression.

### Safe starting loops

- I - V - vi - IV: stable pop/rock emotional loop.
- vi - IV - I - V: starts moodier, resolves brighter.
- I - vi - IV - V: classic old-school song movement.
- ii - V - I: jazz cadence and strong resolution.
- I - bVII - IV: rock/modal color.

### Per-line rule

A lyric line usually needs 1–4 chord changes. More than that often makes the sheet hard to read unless the melody is busy.

## Word-attached chord placement

Store chord placements as:

```json
{
  "0": [
    { "wordIndex": 0, "chord": "G" },
    { "wordIndex": 4, "chord": "D" },
    { "wordIndex": 7, "chord": "Em" }
  ]
}
```

Where the object key is the line index and `wordIndex` is the token position in that lyric line.

### Tokenization

Split words by whitespace. Keep quoted phrases together if needed, but the simple workflow should encourage normal words because they make chord placement clearer.

## Editor UX pattern

The My Songs page should have two states:

1. Library view: organized song blocks showing title, key, line count, chord count, last update, and a tiny sheet preview.
2. Song editor view: full writing desk for one song.

The editor should show:

- Header with title, key, save, export, back.
- Chord palette from the selected key.
- One card per lyric line.
- A small chord bank on each line.
- A sheet preview row where every word is clickable.

Clicking a word opens a chord picker containing only that line's chords. Selecting a chord places it above the word. Clicking a placed chord removes it or lets the user replace it.

## PDF / print export pattern

The exported sheet should be sparse and readable:

- Title at the top.
- Key under the title.
- Each lyric line as one block.
- Chord names above aligned words.
- No editor controls.
- Black text on white paper.
- Avoid diagrams in the print view; use symbols only.

The export can use browser print via a dedicated `window.open()` document. This is enough for a first working lead-sheet export and avoids complex PDF layout libraries.

## Data compatibility

The old backend table is named `progressions`, but the frontend should present them as songs. Existing records can still load if `chords_json` is a flat chord array. New records should save line-level chords as a nested array:

```json
[["G", "D", "Em", "C"], ["C", "G", "D"]]
```

The loader should normalize both formats:

- Flat `['G', 'D']` → `[ ['G', 'D'] ]`
- Nested `[['G'], ['C']]` → unchanged
- Empty/missing → `[[]]`

This keeps older saved work available while moving the product language from progressions to songs.
