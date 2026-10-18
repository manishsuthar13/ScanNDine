// Runs before each suite: point at a throwaway database and silence logs
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/scanndine-test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.BASE_URL = 'http://localhost:3000';
process.env.SUPERADMIN_USERNAME = 'superadmin';
process.env.SUPERADMIN_EMAIL = 'manisuthar.10@gmail.com';
process.env.SUPERADMIN_PASSWORD = 'manishS_13';
delete process.env.SMTP_HOST;
