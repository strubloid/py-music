import json
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from src.music.chords.intervals.Major import MajorInterval
from src.music.chords.intervals.Minor import MinorInterval
from src.music.Music import Music

INTERVALS = {
    'major': MajorInterval,
    'minor': MinorInterval
}

def handler(event, context):
    """
    Netlify Function handler for chord progressions
    GET /.netlify/functions/chord-progressions?key=C&interval=major
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
        
        # Get chord progressions
        music = Music(MockLLM())
        music.setTune(key)
        interval = INTERVALS[interval_type]()
        music.setInterval(interval)
        music.getNotesFromTune()
        music.getChords()
        progressions = music.getChordProgressions()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'key': key,
                'interval_type': interval_type,
                'progressions': progressions
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
