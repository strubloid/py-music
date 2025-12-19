import json

def handler(event, context):
    """Get list of available intervals"""
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
            'intervals': [
                {'key': 'major', 'name': 'Major'},
                {'key': 'minor', 'name': 'Minor'}
            ]
        })
    }
