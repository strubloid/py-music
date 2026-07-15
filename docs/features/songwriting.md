# Songwriting

## Purpose And Outcome

`/create/my-songs` is the Create workflow: a learner applies key, chords, rhythm, and lyric decisions to a playable lead-sheet-like song. Progression data is an ingredient in a song, not a separate end state.

## User Flow

1. Open the song library or create a draft.
2. Choose title, key, and mode.
3. Load a diatonic chord palette from the scale API.
4. Add lyric lines and a small chord bank for each line.
5. Attach chord changes to exact lyric word indexes.
6. Save or update the song, then open a clean print/export view.

## Data Contract

The backend `Progression` model stores `name`, `key`, `interval`, `chords_json`, `lyrics_json`, and `chord_over_lyrics_json`. A chord placement is `{ wordIndex, chord }` indexed by lyric line. This avoids unstable pixel coordinates.

Old flat chord arrays normalize to one line. New songs may use nested line arrays. Never break existing saved records while evolving the model.

## Ownership And Persistence

| Area | Files |
| --- | --- |
| UI | `frontend/src/pages/create/MySongsPage.tsx` |
| API | `frontend/src/services/api.ts`, `backend/project/api/protected.py` |
| persistence | `Progression` in `backend/project/models/user.py` |
| guest fallback | `localStorage.guestProgressions` |
| chord palette | scale API |

Authenticated save uses progression CRUD; guests save locally. There is no automatic guest-to-account merge. Current export uses a browser print view.

## Rules And Tests

Songwriting rewards, if ever added, cannot become the fastest rank path or replace assessed practice. Test legacy normalization, word-index placement, owner-only CRUD, guest/local behavior, failed save feedback, and print output.
