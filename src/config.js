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

if (process.env.CLOUD) {
    config.postgres = {
        host: '/cloudsql/kimthi:asia-southeast1:kim-thi-main',
        user: 'postgres',
        password: 'kimthi1346',
        database: 'kimthi',
    }
}

exports.config = config