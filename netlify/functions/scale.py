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
    Netlify Function handler for scale analysis
    GET /.netlify/functions/scale?key=C&interval=major
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
        
        # Create mock LLM (since we can't use API keys easily in functions)
        class MockLLM:
            def getParser(self):
                class MockParser:
                    def get_format_instructions(self):
                        return ''
                return MockParser()
            def startingChain(self, prompt):
                pass
        
        # Get scale analysis
        music = Music(MockLLM())
        response = music.getCompleteScaleAnalysis(key, interval_type)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response)
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
