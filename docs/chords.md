# Chord Theory & Implementation Guide

This document defines how chords are structured, theory-grounded, and implemented in this project. An AI can follow these steps to generate correct CAGED variations for any chord type.

---

## 1. Guitar String Tuning

Standard tuning (low to high): **E2, A2, D3, G3, B3, E4**

String indices in code: `[0]=LowE, [1]=A, [2]=D, [3]=G, [4]=B, [5]=HighE`

```
String:  E(6)   A(5)   D(4)   G(3)   B(2)   E(1)
Fret 0:  E2     A2     D3     G3     B3     E4
```

---

## 2. Note Naming Convention

- Use **sharps** (not flats) in code keys: `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`
- Flat equivalents exist only for display: `Db` (same as `C#`), `Eb` (same as `D#`), etc.

---

## 3. Chord Type Formulas

Intervals are counted in **semitones** from the root:

| Chord Type | Symbol | Intervals (semitones from root) | Notes Formula |
|------------|--------|--------------------------------|--------------|
| Major | (none) | 0, 4, 7 | Root, M3, P5 |
| Minor | m | 0, 3, 7 | Root, m3, P5 |
| Dominant 7 | 7 | 0, 4, 7, 10 | Root, M3, P5, m7 |
| Major 7 | maj7 | 0, 4, 7, 11 | Root, M3, P5, M7 |
| Minor 7 | m7 | 0, 3, 7, 10 | Root, m3, P5, m7 |
| Diminished | dim | 0, 3, 6 | Root, m3, d5 |
| Augmented | aug | 0, 4, 8 | Root, M3, #5 |
| Sus2 | sus2 | 0, 2, 7 | Root, M2, P5 |
| Sus4 | sus4 | 0, 5, 7 | Root, P4, P5 |
| Add9 | add9 | 0, 4, 7, 14 | Root, M3, P5, M9 |
| 6th | 6 | 0, 4, 7, 9 | Root, M3, P5, M6 |
| 9th | 9 | 0, 4, 7, 10, 14 | Root, M3, P5, m7, M9 |
| Power | 5 | 0, 7 | Root, P5 |
| Minor Major 7 | mM7 | 0, 3, 7, 11 | Root, m3, P5, M7 |

---

## 4. CAGED System

Each CAGED shape corresponds to a major chord shape that can be **transposed** to any root and **modified** for different chord types.

### 4.1 The Five Open Shapes (C Major)

```
C SHAPE (open position):
  E A D G B e
  x 3 2 0 1 0
  Finger: - 3 2 - 1 -

A SHAPE (barre at 3rd fret):
  E A D G B e
  x 3 5 5 5 3
  Finger: - 1 3 3 3 1

G SHAPE (8th fret):
  E A D G B e
  8 7 5 5 8 8
  Finger: 3 2 1 1 4 4

E SHAPE (8th fret):
  E A D G B e
  8 10 10 9 8 8
  Finger: 1 3 4 2 1 1

D SHAPE (10th fret):
  E A D G B e
  x x 10 12 13 12
  Finger: - - 1 3 4 2
```

### 4.2 CAGED Transposition Rule

For each semitone up from C:
- Move the shape **up N frets**
- The barre (if any) moves up N frets
- Open strings become fretted at position N

### 4.3 Modifying CAGED for Minor Chords

**Rule:** For minor chords, the **3rd is lowered by 1 semitone**.

For each major CAGED shape:
- Major 3rd → Minor 3rd
- Move the finger that plays the major 3rd down 1 fret
- Keep the root and 5th the same

**Example (A shape, root C):**
```
C Major A-shape:  x 3 5 5 5 3
                   ↑ major 3rd on A-string (3rd fret = E)

C Minor A-shape:  x 3 5 5 4 3
                   ↑ minor 3rd on A-string (3rd fret stays, D# is m3 of C)
                   Actually: move the 5th-string finger DOWN 1 fret
                   C root=3, Eb(m3)=4, G(5)=5 → need Eb, so 4th fret
                   Correct:  x 3 5 5 4 3
```

### 4.4 Modifying CAGED for Dominant 7th

**Rule:** Add the minor 7th interval to the major chord.

For each major CAGED shape:
- Add m7 note
- Common positions: below root (1 fret down), or extend shape

**Example (C7 CAGED A-shape):**
```
C Major A-shape:  x 3 5 5 5 3
C7 A-shape:       x 3 5 3 5 3  (add Bb on G-string, 3rd fret)

Alternative (more common): 
  x 3 2 3 1 0    (open position with 7th added)
```

### 4.5 Modifying CAGED for Minor 7th

**Rule:** Minor chord + m7 interval.

**Example (Cm7 CAGED A-shape):**
```
Cm A-shape:  x 3 5 5 4 3
Cm7:          x 3 5 3 4 3  (add Bb on G-string)
```

### 4.6 Modifying CAGED for Diminished

**Rule:** Diminished = m3 + d5. Two adjacent shapes form a full diminished chord.

**Example (Cdim CAGED):**
```
Cdim A-shape:  x 3 4 5 4 x  (C-Eb-Gb)
Or open:       x 2 3 4 3 x  (B-D-F = A#dim = Bdim = Cdim)
```

### 4.7 Modifying CAGED for Augmented

**Rule:** Aug = M3 + #5. Move the 5th up 1 fret.

**Example (Caug CAGED A-shape):**
```
C Major A-shape:  x 3 5 5 5 3
Caug:              x 3 5 6 5 3  (G → G#)
```

### 4.8 Modifying CAGED for Sus2 / Sus4

**Sus2:** Replace 3rd with 2nd (root + M2 + P5)
**Sus4:** Replace 3rd with 4th (root + P4 + P5)

**Example (Csus2, open position):**
```
Csus2:  x 3 1 0 3 x  (C-D-G)
```

---

## 5. Fret Position Logic

### 5.1 Finding Optimal Start Fret

```javascript
// Parse fret string to number
const parseFret = (fret) => {
  if (fret === 'x' || fret === 'X') return -1;  // muted
  if (fret === '0') return 0;                    // open
  return parseInt(fret);                         // fretted
};

// Get played frets (exclude muted strings)
const playedFrets = frets.map(parseFret).filter(f => f > 0);

const minFret = Math.min(...playedFrets);
const maxFret = Math.max(...playedFrets);

// Show 5 frets unless starting at fret 5 or higher
const startFret = minFret <= 5 ? 1 : minFret;
const showFretNumber = startFret >= 5;
```

### 5.2 Finger Assignment Heuristic

```javascript
// 1 = Index, 2 = Middle, 3 = Ring, 4 = Pinky
// Barre chords: one finger holds multiple strings at same fret

// For CAGED A-shape barre:
// Finger 1 barres at the starting fret position
// Other fingers shape the chord

// For CAGED E-shape barre:
// Finger 1 barres the 1st fret (or starting fret)
// Finger 2 plays 3rd on G-string
// Finger 3 plays 4th on B-string
```

---

## 6. Implementation Structure

### 6.1 Data Structure

```typescript
interface GuitarChordData {
  frets: string[];      // 6 strings: E A D G B e (index 0-5)
  fingers: (number | null)[];  // null = no finger assigned, 0 = open
  position: string;     // e.g., "A shape (3rd fret)"
}

// fret values:
// 'x' or 'X' = muted/not played
// '0' = open string
// '1'-'24' = fret number
```

### 6.2 Chord Naming in Code

```typescript
// Root + type symbol
'C'      // C Major
'Cm'     // C Minor  
'C7'     // C Dominant 7
'Cmaj7'  // C Major 7
'Cm7'    // C Minor 7
'Cdim'   // C Diminished
'Caug'   // C Augmented
'Csus2'  // C Suspended 2nd
'Csus4'  // C Suspended 4th
'Cadd9'  // C Add 9
'C6'     // C 6th
'C9'     // C Dominant 9
'C5'     // C Power Chord
'CmM7'   // C Minor Major 7
```

### 6.3 Variation Generation Algorithm

For each chord type, generate CAGED variations using:

1. **Major/Minor**: Start with C major CAGED, transpose to root, apply 3rd modification
2. **7/maj7/m7**: Start with major CAGED, add/remove/modify 7th interval
3. **dim/aug**: Start with major CAGED, modify 5th
4. **sus2/sus4**: Start with major CAGED, replace 3rd with 2nd/4th

---

## 7. Required CAGED Variations Per Chord Type

Each chord type MUST have **5 CAGED variations** stored in `guitarChordVariations`:

### 7.1 Major (Complete ✓)

| Shape | C Major | G Major | E Major | A Major | D Major |
|-------|---------|---------|---------|---------|---------|
| Position | Open | 8th fret | Open | Open | 10th fret |
| Barre | No | No | No | No | No |

### 7.2 Minor (Complete ✓)

Same as major CAGED positions, but with minor 3rd.

### 7.3 Dominant 7 (Missing - To Implement)

| Shape | Root Position | Notes |
|-------|--------------|-------|
| C7 Open | Open position | Add m7 (Bb for C7) |
| A7 | 3rd fret barre | A-shape with m7 |
| G7 | 8th fret | G-shape with m7 |
| E7 | Open | E with added 7th |
| D7 | 10th fret | D-shape with m7 |

**Common C7 Shapes:**
```
C7 Open:     x 3 2 3 1 0   (open low E, C-E-G-Bb)
C7 A-shape:  x 3 5 3 5 3   (barre 3, add Bb on G-string)
C7 E-shape:  0 2 0 1 0 0   (E shape with D in bass = C/E, different)
C7 alt:      x 3 5 5 5 3   (C major A-shape, same notes as C7 because open low E mutes)
```

### 7.4 Major 7 (Missing - To Implement)

**Common Cmaj7 Shapes:**
```
Cmaj7 Open:  x 3 2 0 0 0   (C-E-G-B)
Cmaj7 A:     x 3 5 4 5 3    (barre 3, Cmaj7 voicing)
Cmaj7 E:     0 2 1 1 0 0   (E-shape variant)
```

### 7.5 Minor 7 (Missing - To Implement)

**Common Cm7 Shapes:**
```
Cm7 Open:    x 3 5 3 4 3   (C-Eb-G-Bb)
Cm7 A:       x 3 5 3 4 3   (same as C7 A-shape but with Eb)
Cm7 E:       0 2 0 0 0 0   (Em with m7 voicing)
```

### 7.6 Diminished (Incomplete)

Need proper CAGED system with barre chords.

### 7.7 Augmented (Missing - To Implement)

### 7.8 Sus2 / Sus4 (Missing - To Implement)

### 7.9 Add9 / 6th / 9th (Missing - To Implement)

### 7.10 Power (5) (Missing - To Implement)

### 7.11 Minor Major 7 (Missing - To Implement)

---

## 8. Verification Checklist

When implementing any chord, verify:

- [ ] All 5 CAGED positions exist
- [ ] Fret numbers are physically playable
- [ ] Finger assignments follow natural hand shape
- [ ] Barre positions are at correct frets
- [ ] Open/muted strings are correct for the voicing
- [ ] Chord notes match the theoretical formula
- [ ] `parseFret` handles all fret values correctly
- [ ] Start fret calculation works for positions 5+

---

## 9. Reference: Chromatic Note Positions

Standard tuning reference (fret 0 = open):

```
Fret:  0    1    2    3    4    5    6    7    8    9    10   11   12
E:     E    F    F#   G    G#   A    A#   B    C    C#   D    D#   E
A:     A    A#   B    C    C#   D    D#   E    F    F#   G    G#   A
D:     D    D#   E    F    F#   G    G#   A    A#   B    C    C#   D
G:     G    G#   A    A#   B    C    C#   D    D#   E    F    F#   G
B:     B    C    C#   D    D#   E    F    F#   G    G#   A    A#   B
e:     e    f    f#   g    g#   a    a#   b    c    c#   d    d#   e
```

---

## 10. Implementation Order

To fix the missing CAGED variations, implement in this order:

1. **Dominant 7th (7)** - Most common extension after major/minor
2. **Major 7th (maj7)** - Common in jazz/pop
3. **Minor 7th (m7)** - Common minor extension
4. **Diminished (dim)** - Two-shape system
5. **Augmented (aug)** - Simple 5th modification
6. **Sus2 / Sus4** - 3rd replacement
7. **Add9 / 6th / 9th** - Extended chords
8. **Power (5)** - Simple two-note chords
9. **Minor Major 7 (mM7)** - Minor with M7

Each chord type follows the same pattern:
1. Start with the major CAGED shape
2. Apply the interval modification rule
3. Verify all 5 positions are playable
4. Add to `guitarChordVariations` with proper `position` labels
