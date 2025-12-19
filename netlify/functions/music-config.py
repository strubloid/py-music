import json

def handler(event, context):
    """Get music display configuration"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'guitarStringOrder': ['E', 'B', 'G', 'D', 'A', 'E'],
            'pianoKeyOrder': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            'blackKeyOrder': ['C#', 'D#', 'F#', 'G#', 'A#'],
            'chordDisplayOrder': 'ascending',
            'noteNamingConvention': 'sharp',
            'fretboardDirection': 'leftToRight'
        })
    }
