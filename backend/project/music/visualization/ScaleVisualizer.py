from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.columns import Columns
from rich.table import Table
from rich.align import Align
from typing import List

class ScaleVisualizer:
    """
    A class for visualizing musical scales in the terminal.
    Designed to be easily portable to React/web interfaces later.
    """
    
    def __init__(self):
        self.console = Console()
        
        # Piano keyboard layout (one octave)
        self.white_keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
        self.black_keys = ['C#', 'D#', None, 'F#', 'G#', 'A#', None]  # None for gaps
        
        # All chromatic notes in order
        self.chromatic_notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Color scheme for different types of elements
        self.colors = {
            'root': 'bold red on black',
            'scale_note': 'bold blue on black',
            'chord_note': 'bold green on white',
            'seventh': 'bold magenta on white',
            'white_key': 'black on white',
            'black_key': 'white on black',
            'empty': 'dim white'
        }

    def display_piano_scale(self, notes: List[str], root_note: str = None) -> None:
        """
        Display a piano keyboard with scale notes highlighted.
        
        Args:
            notes: List of notes in the scale
            root_note: The root note of the scale (will be highlighted differently)
        """
        if not root_note and notes:
            root_note = notes[0]
            
        # Create the visual representation
        keyboard_display = self._create_piano_keyboard(notes, root_note)
        
        # Display with Rich
        self.console.print("\n")
        self.console.print(Panel(
            keyboard_display,
            title=f"🎹 Piano Keyboard - Scale Visualization",
            border_style="bright_blue",
            padding=(1, 2)
        ))
        
    def display_scale_degrees(self, notes: List[str], scale_name: str = "Scale") -> None:
        """
        Display scale degrees with Roman numerals and note names.
        """
        roman_numerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
        
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Degree", style="cyan", width=8)
        table.add_column("Roman", style="yellow", width=8)
        table.add_column("Note", style="green", width=8)
        table.add_column("Function", style="blue")
        
        functions = ["Tonic", "Supertonic", "Mediant", "Subdominant", 
                    "Dominant", "Submediant", "Leading Tone"]
        
        for i, note in enumerate(notes):
            if i < len(roman_numerals):
                table.add_row(
                    str(i + 1),
                    roman_numerals[i],
                    note,
                    functions[i] if i < len(functions) else "Extended"
                )
        
        self.console.print("\n")
        self.console.print(Panel(
            table,
            title=f"📊 {scale_name} - Scale Degrees",
            border_style="bright_green",
            padding=(1, 2)
        ))

    # Display a guitar fretboard view with scale notes.
    # Great preparation for React guitar components.
    def display_fretboard(self, notes: List[str], root_note: str = None) -> None:

        if not root_note and notes:
            root_note = notes[0]
            
        # Guitar tuning (standard)
        strings = ['E', 'Bx', 'G', 'D', 'A', 'E']
        frets = 24  # Show all 24 frets
        
        fretboard = Table(show_header=True, header_style="bold green")
        fretboard.add_column("String", style="black", width=5)
        
        # Add fret columns
        for fret in range(frets + 1):
            fretboard.add_column(f"{fret}", width=4, justify="center")
        
        # Generate fretboard
        for string_note in strings:
            row = [string_note]
            string_index = self.chromatic_notes.index(string_note)
            
            for fret in range(frets + 1):
                note_index = (string_index + fret) % 12
                current_note = self.chromatic_notes[note_index]
                
                if current_note in notes:
                    if current_note == root_note:
                        row.append(f"[{self.colors['root']}]{current_note}[/]")
                    else:
                        row.append(f"[{self.colors['scale_note']}]{current_note}[/]")
                else:
                    row.append("·")
            
            fretboard.add_row(*row)
        
        self.console.print("\n")
        self.console.print(Panel(
            fretboard,
            title="Guitar Fretboard",
            border_style="bright_green",
            padding=(1, 1)
        ))

    def display_circle_of_fifths_position(self, root_note: str) -> None:
        """
        Show where the key sits on the circle of fifths.
        """
        circle_order = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'Ab', 'Eb', 'Bb', 'F']
        
        if root_note in circle_order:
            position = circle_order.index(root_note)
            
            # Create visual representation
            circle_text = Text()
            for i, note in enumerate(circle_order):
                if note == root_note:
                    circle_text.append(f" [{self.colors['root']}]●{note}●[/] ")
                else:
                    circle_text.append(f" {note} ")
                
                if i < len(circle_order) - 1:
                    circle_text.append("→")
            
            sharps_flats = position if position <= 6 else f"{12 - position} flats" if position > 6 else f"{position} sharps"
            
            info_text = Text()
            info_text.append(f"Key: {root_note} major\n")
            info_text.append(f"Accidentals: {sharps_flats}\n")
            info_text.append(f"Position: {position}/12 on circle")
            
            self.console.print("\n")
            self.console.print(Panel(
                Columns([circle_text, info_text], equal=True),
                title="⭕ Circle of Fifths Position",
                border_style="bright_cyan"
            ))

    def _create_piano_keyboard(self, notes: List[str], root_note: str) -> Text:
        """
        Internal method to create the ASCII piano keyboard representation.
        """
        # Create the keyboard layout
        keyboard = Text()
        
        # Black keys row (top)
        keyboard.append("   ")
        for i, black_key in enumerate(self.black_keys):
            if black_key is None:
                keyboard.append("    ")
            else:
                if black_key in notes:
                    if black_key == root_note:
                        keyboard.append(f"[{self.colors['root']}] {black_key} [/]")
                    else:
                        keyboard.append(f"[{self.colors['scale_note']}] {black_key} [/]")
                else:
                    keyboard.append(f"[{self.colors['black_key']}] {black_key} [/]")
                keyboard.append(" ")
        
        keyboard.append("\n")
        
        # White keys row (bottom) 
        for white_key in self.white_keys:
            if white_key in notes:
                if white_key == root_note:
                    keyboard.append(f"[{self.colors['root']}] {white_key}  [/]")
                else:
                    keyboard.append(f"[{self.colors['scale_note']}] {white_key}  [/]")
            else:
                keyboard.append(f"[{self.colors['white_key']}] {white_key}  [/]")
            keyboard.append(" ")
        
        return keyboard

    # Display a comprehensive analysis of the scale with all visualizations.
    def display_complete_scale_analysis(self, notes: List[str], chords: List[str], 
                                      sevenths: List[str], scale_name: str, 
                                      root_note: str = None) -> None:
        """
        
        """
        if not root_note and notes:
            root_note = notes[0]
        
        # Main title
        title_text = Text()
        title_text.append(f"🎵 Complete Musical Analysis: {scale_name} 🎵", style="bold bright_magenta")
        
        self.console.print("\n")
        self.console.print(Align.center(Panel(
            title_text,
            border_style="bright_magenta",
            padding=(1, 2)
        )))
        
        # Piano keyboard
        self.display_piano_scale(notes, root_note)
        
        # Scale degrees
        self.display_scale_degrees(notes, scale_name)
        
        # Chords and sevenths table
        if chords and sevenths:
            chord_table = Table(show_header=True, header_style="bold cyan")
            chord_table.add_column("Degree", style="yellow", width=8)
            chord_table.add_column("Chord", style="green", width=12)
            chord_table.add_column("Secondary Dom", style="magenta", width=15)
            chord_table.add_column("Function", style="blue")
            
            functions = ["Tonic", "Supertonic", "Mediant", "Subdominant", 
                        "Dominant", "Submediant", "Leading Tone"]
            
            for i, (chord, seventh) in enumerate(zip(chords, sevenths)):
                chord_table.add_row(
                    str(i + 1),
                    chord,
                    f"{seventh} → {chord}",
                    functions[i] if i < len(functions) else "Extended"
                )
            
            self.console.print("\n")
            self.console.print(Panel(
                chord_table,
                title="🎹 Chord Progressions & Secondary Dominants",
                border_style="bright_green"
            ))
        
        # Circle of fifths
        self.display_circle_of_fifths_position(root_note)
        
        # Guitar fretboard
        self.display_fretboard(notes, root_note)
        
        self.console.print("\n" + "="*80 + "\n")
