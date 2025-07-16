# Mittweida Api

## Aleksandre Kapanadze

Nest.JS project made with typescript to be consumed by a react vite frontend

# NOTE for dev branch

For the development branch, its meant to be run on https://localhost:3000 meaning if you want to run it locally, you must create your own ssl directory on the same level as src
and populate it with cert.pem csr.pem and key.pem and the frontend you access it from must also be https secured (you can do this with https://localhost:5173)

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
