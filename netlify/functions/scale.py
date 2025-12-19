import json
import sys
import os
from pathlib import Path

# Add src to path
src_path = str(Path(__file__).parent.parent.parent / 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

try:
    from src.music.chords.intervals.Major import MajorInterval
    from src.music.chords.intervals.Minor import MinorInterval
    from src.music.Music import Music
except ImportError as e:
    print(f"Import error: {e}")
    MajorInterval = None
    MinorInterval = None
    Music = None

INTERVALS = {
    'major': MajorInterval,
    'minor': MinorInterval
}

def handler(event, context):
    """
    Netlify Function handler for scale analysis
    Handles both: /api/scale?key=C&interval=major AND /api/scale/C?interval=major
    """
    try:
        # Get headers
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, OPTIONS'
        }
        
        # Handle OPTIONS request for CORS
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Parse path parameter (e.g., /api/scale/C)
        path = event.get('path', '')
        path_params = event.get('pathParameters', {})
        query_params = event.get('queryStringParameters', {}) or {}
        
        # Extract key from path or query
        key = None
        if path_params and 'key' in path_params:
            key = path_params['key']
        elif '/scale/' in path:
            # Extract from path like /api/scale/C or /.netlify/functions/scale/C
            parts = path.split('/scale/')
            if len(parts) > 1:
                key = parts[1].split('?')[0].split('/')[0]
        
        if not key:
            key = query_params.get('key', 'C')
        
        key = key.upper()
        interval_type = query_params.get('interval', 'major').lower()
        
        print(f"Processing scale request: key={key}, interval={interval_type}")
        
        if not MajorInterval or not MinorInterval or not Music:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Music system not initialized',
                    'key': key,
                    'interval': interval_type
                })
            }
        
        if interval_type not in INTERVALS:
            return {
                'statusCode': 400,
                'headers': headers,
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
            'headers': headers,
            'body': json.dumps(response)
        }
        
    except Exception as e:
        print(f"Error in scale function: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            })
        }

