import json

def handler(event, context):
    """Get list of available intervals"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'intervals': [
                {'key': 'major', 'name': 'Major'},
                {'key': 'minor', 'name': 'Minor'}
            ]
        })
    }
