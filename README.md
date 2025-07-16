# Mittweida Api

## Aleksandre Kapanadze

Nest.JS project made with typescript to be consumed by a react vite frontend

Frontend link: https://weebpapi.github.io/mittweida-front/
Backend link: https://mittweida-back.onrender.com
(the deployed backend link spins down after 15 minutes of inactivity)

To get everything working on your device, you must create an env file and fill in the following information
with your own AWS S3 config (only for the photo services) as well as providing a connection string to a database and jwt access and refresh secret tokens, alternatively, the backend is deployed at: https://mittweida-back.onrender.com

DATABASE_URL="your-connection-string"
JWT_ACCESS_TOKEN_SECRET=
JWT_REFRESH_TOKEN_SECRET=

### For the photos service

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=
AWS_S3_BUCKET_NAME=
