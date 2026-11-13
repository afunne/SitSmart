# SitSmart - Piletimüük

SitSmart is a ticket sales application where users can browse events, pick seats and buy tickets.
The backend is an ASP.NET Core Web API with a React frontend, and a separate
worker service handles background tasks.

## Tech

- ASP.NET Core Web API
- EF Core + SQLite
- JWT authentication
- WebSocket
- Worker Service
- React + TypeScript (Vite), Radix Themes

## How to run

API (once: set a JWT key of at least 32 characters):

```
cd Piletimyyk.Api
dotnet user-secrets set "Jwt:Key" "<random key>"
dotnet run --launch-profile http
```

Frontend, in a second terminal (http://localhost:5173, forwards `/api` and `/ws` to the API):

```
cd client
npm install
npm run dev
```

`npm run build` builds the frontend into `Piletimyyk.Api/wwwroot`, which the API serves at
http://localhost:5237.
