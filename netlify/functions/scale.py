import json
import sys
import os
from pathlib import Path

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
        
        print(f"Processing scale request: key={key}, interval={interval_type}, path={path}")
        
        # For now, return a mock response to verify the function is working
        # TODO: Add actual music theory logic once we confirm connectivity
        mock_response = {
            "scale_name": f"{key} {interval_type.capitalize()}",
            "key": key,
            "interval_type": interval_type,
            "notes": ["C", "D", "E", "F", "G", "A", "B"] if key == "C" else [key, "D", "E", "F", "G", "A", "B"],
            "scale_degrees": [
                {"roman": "I", "note": key, "chord": f"{key}", "function": "Tonic"},
                {"roman": "ii", "note": "D", "chord": "Dm", "function": "Supertonic"},
                {"roman": "iii", "note": "E", "chord": "Em", "function": "Mediant"},
                {"roman": "IV", "note": "F", "chord": "F", "function": "Subdominant"},
                {"roman": "V", "note": "G", "chord": "G", "function": "Dominant"},
                {"roman": "vi", "note": "A", "chord": "Am", "function": "Submediant"},
                {"roman": "vii°", "note": "B", "chord": "Bdim", "function": "Leading Tone"}
            ],
            "chord_sevenths": [
                {"seventh": "Cmaj7", "resolves_to": "C", "resolves_from": "G7", "chord": "C"},
                {"seventh": "Dm7", "resolves_to": "Dm", "resolves_from": "A7", "chord": "Dm"}
            ],
            "common_progressions": {
                "I-IV-V-I": ["C", "F", "G", "C"],
                "I-vi-IV-V": ["C", "Am", "F", "G"],
                "ii-V-I": ["Dm", "G", "C"]
            },
            "status": "mock_data"
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(mock_response)
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
                'type': type(e).__name__,
                'message': 'Function error - check logs'
            })
        }

