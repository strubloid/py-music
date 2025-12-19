import json
import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.project.music.chords.intervals.Major import MajorInterval
from backend.project.music.chords.intervals.Minor import MinorInterval
from backend.project.music.Music import Music

INTERVALS = {
    'major': MajorInterval,
    'minor': MinorInterval
}

def handler(event, context):
    """
    Netlify Function handler for secondary dominants
    GET /.netlify/functions/secondary-dominants?key=C&interval=major
    """
    try:
        # Parse query parameters
        params = event.get('queryStringParameters', {}) or {}
        key = params.get('key', 'C').upper()
        interval_type = params.get('interval', 'major').lower()
        
        if interval_type not in INTERVALS:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Invalid interval type. Available: {list(INTERVALS.keys())}'
                })
            }
        
        # Create mock LLM
        class MockLLM:
            def getParser(self):
                class MockParser:
                    def get_format_instructions(self):
                        return ''
                return MockParser()
            def startingChain(self, prompt):
                pass
        
        # Get secondary dominants
        music = Music(MockLLM())
        music.setTune(key)
        interval = INTERVALS[interval_type]()
        music.setInterval(interval)
        music.getNotesFromTune()
        chords = music.getChords()
        sevenths = music.getSeventhNoteToIt()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'key': key,
                'interval_type': interval_type,
                'secondary_dominants': [
                    {'target_chord': chord, 'dominant_seventh': seventh}
                    for chord, seventh in zip(chords, sevenths)
                ]
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
