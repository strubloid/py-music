import json

def handler(event, context):
    """Get music display configuration"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'guitarStringOrder': ['E', 'B', 'G', 'D', 'A', 'E'],
            'pianoKeyOrder': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            'blackKeyOrder': ['C#', 'D#', 'F#', 'G#', 'A#'],
            'chordDisplayOrder': 'ascending',
            'noteNamingConvention': 'sharp',
            'fretboardDirection': 'leftToRight'
        })
    }
