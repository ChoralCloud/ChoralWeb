#!/usr/bin/env python

from sys import argv
from eve import Eve
from datetime import datetime

logs = {
    'schema': {
        'timestamp': {
            'type': 'datetime',
            'default': datetime.utcnow()
        },
        'type': {
            'type': 'string',
            'required': True,
        },
        'message': {
            'type': 'string',
            'required': True,
        },
        'tags': {
            'type': 'list',
            'schema': {
                'type': 'string'
            },
            'required': True,
        },
    },
    'resource_methods': ['GET', 'POST'],
}

eve_settings = {
    'MONGO_HOST': 'localhost',
    'MONGO_PORT': 27017,
    'MONGO_DBNAME': 'admin',
    'DOMAIN': {
        'logs': logs,
    },
}

app = Eve(settings=eve_settings)

if __name__ == "__main__":
    app.run()
