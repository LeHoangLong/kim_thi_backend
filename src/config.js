const config = {
    "postgres": {
        "user": "admin",
        "password": "~admin~124679~",
        "host": "db",
        "database": "kimthi",
        "application_name": 'kimthi',
    },
    "postgres_test": {
        "user": "admin",
        "password": "~admin~124679~",
        "host": "db-test",
        "database": "kimthi",
        "application_name": 'kimthi',
    },
    "pagination": {
        "defaultSize": 10,
        "maxSize": 50
    },
    "geocoder": {
        "provider": 'google',
        "apiKey": 'AIzaSyA30V1U6ANKqisXXm4V6hIaewF6qbyZSkI'
    }
}
exports.config = config