<p align="center">
  <img src="client/public/img/Sitsmart_logo.png" alt="SitSmart" width="420">
</p>

<p align="center">
  <strong>Piletimüük reaalajas kohavalikuga</strong><br>
  <em>Ticket sales with live seat selection</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white" alt=".NET 10">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/EF_Core-10-512BD4?logo=dotnet&logoColor=white" alt="EF Core 10">
  <img src="https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/WebSocket-4B2465" alt="WebSocket">
</p>

<p align="center">
  <img src="client/public/img/stage/front_concert_480px.gif" alt="Kontserdilava pikslikunstis / Pixel-art concert stage" width="480">
</p>

<p align="center"><a href="#eesti">Eesti</a> | <a href="#english">English</a></p>

# Eesti

## <img src="https://api.iconify.design/lucide/list-tree.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Sisukord

- [Mis see on?](#mis-see-on)
- [Kohtade olekud](#kohtade-olekud)
- [Arhitektuur](#arhitektuur)
- [Tehnoloogiad](#tehnoloogiad)
- [Dokumentatsioon](#dokumentatsioon)
- [Käivitamine](#käivitamine)

## <img src="https://api.iconify.design/lucide/ticket.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Mis see on?

SitSmart on piletimüügi rakendus, kus ostja valib saaliplaanilt koha, hoiab seda 10 minutit[^et-hoid] ja
ostab pileti QR-koodiga. Saaliplaan uueneb reaalajas: kui keegi teine koha broneerib või ostab,
näed seda kohe, ilma lehte uuesti laadimata. Administraator haldab saale ja üritusi ning näeb
müügistatistikat, kontrolör laseb ukse peal piletid sisse. Taustal töötav Worker[^et-worker]
vabastab aegunud broneeringud.

## <img src="https://api.iconify.design/lucide/armchair.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Kohtade olekud

<table>
  <tr>
    <td align="center"><img src="client/public/img/seats/seat_red_free.gif" alt="" width="48"><br>Vaba</td>
    <td align="center"><img src="client/public/img/seats/seat_red_mine.gif" alt="" width="48"><br>Sinu valik</td>
    <td align="center"><img src="client/public/img/seats/seat_red_reserved.gif" alt="" width="48"><br>Broneeritud (10 min)</td>
    <td align="center"><img src="client/public/img/seats/seat_red_sold_white.gif" alt="" width="48"><br>Müüdud</td>
  </tr>
</table>

Igal müüdud kohal istub kass, kokku on kuus eri kassi.[^et-kass]

## <img src="https://api.iconify.design/lucide/network.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Arhitektuur

```mermaid
flowchart LR
    B["Brauser<br/>React"]
    A["API<br/>ASP.NET Core"]
    D[("SQLite")]
    W["Worker<br/>.NET Worker Service"]

    B <-->|"REST /api (JWT)"| A
    B <-->|"WebSocket /ws/seats"| A
    A -.->|"SeatReserved / SeatReleased / SeatSold"| B
    A <-->|"EF Core"| D
    W -->|"POST release-expired<br/>iga minut, Service JWT"| A
```

- **Kontrollerid on õhukesed:** nad kutsuvad teenust ja teisendavad `ServiceResult`-i
  HTTP-vastuseks (404, 400, 409, 403 koos `ProblemDetails`-iga).
- **Äriloogika on teenustes** (`ReservationService`, `PurchaseService`, `CheckInService` jt):
  kontrollid, hinnad, broneeringu aegumine ja topeltmüügi püüdmine unikaalse indeksi kaudu.
- **Teenused teavitavad pärast salvestamist:** kohtade muutus läheb `SeatNotifier`-i kaudu
  WebSocketi gruppi alles siis, kui andmebaas on muudatuse vastu võtnud.

## <img src="https://api.iconify.design/lucide/layers.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Tehnoloogiad

<table>
  <tr>
    <th align="left">Backend</th>
    <td>
      <img src="https://img.shields.io/badge/ASP.NET_Core_10-512BD4?logo=dotnet&logoColor=white" alt="ASP.NET Core 10">
      <img src="https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white" alt="JWT">
    </td>
  </tr>
  <tr>
    <th align="left">Frontend</th>
    <td>
      <img src="https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black" alt="React 19">
      <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
      <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
      <img src="https://img.shields.io/badge/Radix_Themes-000000?logo=radixui&logoColor=white" alt="Radix Themes">
      <img src="https://img.shields.io/badge/Recharts-22B5BF" alt="Recharts">
    </td>
  </tr>
  <tr>
    <th align="left">Andmebaas</th>
    <td>
      <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite">
      <img src="https://img.shields.io/badge/EF_Core_10-512BD4?logo=dotnet&logoColor=white" alt="EF Core 10"> migratsioonidega
    </td>
  </tr>
  <tr>
    <th align="left">Reaalaeg</th>
    <td>
      <img src="https://img.shields.io/badge/WebSocket-4B2465" alt="WebSocket"> <code>/ws/seats</code>, grupid ürituse kaupa
    </td>
  </tr>
  <tr>
    <th align="left">Taustatöö</th>
    <td>
      <img src="https://img.shields.io/badge/.NET_Worker_Service-512BD4?logo=dotnet&logoColor=white" alt=".NET Worker Service">
    </td>
  </tr>
</table>

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Dokumentatsioon

- [Disainijuhend](docs/design.md): värvid, kirjad, pikslikunst, komponendid ja reeglid

## <img src="https://api.iconify.design/lucide/terminal.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Käivitamine

API (ühe korra: määra vähemalt 32 märgi pikkune JWT-võti):

```
cd Piletimyyk.Api
dotnet user-secrets set "Jwt:Key" "<random key>"
dotnet run --launch-profile http
```

Frontend teises terminalis (http://localhost:5173, suunab `/api` ja `/ws` API-le edasi):

```
cd client
npm install
npm run dev
```

`npm run build` ehitab frontendi kausta `Piletimyyk.Api/wwwroot`, mida API serveerib aadressil
http://localhost:5237.

[^et-hoid]: Hoidmise aega saab muuta API seadega `Reservations:HoldMinutes` (vaikimisi 10).

[^et-worker]: Worker käib kord minutis, seda saab muuta seadega `Worker:IntervalSeconds`.

[^et-kass]: Kass valitakse koha rea ja numbri järgi, nii et sama koht näitab alati sama kassi.

# English

## <img src="https://api.iconify.design/lucide/list-tree.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Contents

- [What is it?](#what-is-it)
- [Seat states](#seat-states)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Documentation](#documentation)
- [How to run](#how-to-run)

## <img src="https://api.iconify.design/lucide/ticket.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;What is it?

SitSmart is a ticket sales app where buyers pick a seat on the hall map, hold it for 10 minutes[^en-hold]
and buy a ticket with a QR code. The seat map updates live: when someone else reserves or buys a
seat, you see it right away, without reloading the page. Admins manage halls and events and see
the sales statistics, and controllers check tickets in at the door. A background Worker[^en-worker]
releases expired holds.

## <img src="https://api.iconify.design/lucide/armchair.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Seat states

<table>
  <tr>
    <td align="center"><img src="client/public/img/seats/seat_red_free.gif" alt="" width="48"><br>Free</td>
    <td align="center"><img src="client/public/img/seats/seat_red_mine.gif" alt="" width="48"><br>Your pick</td>
    <td align="center"><img src="client/public/img/seats/seat_red_reserved.gif" alt="" width="48"><br>Reserved (10 min)</td>
    <td align="center"><img src="client/public/img/seats/seat_red_sold_white.gif" alt="" width="48"><br>Sold</td>
  </tr>
</table>

Every sold seat has a cat on it, six different cats in all.[^en-cats]

## <img src="https://api.iconify.design/lucide/network.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Architecture

```mermaid
flowchart LR
    B["Browser<br/>React"]
    A["API<br/>ASP.NET Core"]
    D[("SQLite")]
    W["Worker<br/>.NET Worker Service"]

    B <-->|"REST /api (JWT)"| A
    B <-->|"WebSocket /ws/seats"| A
    A -.->|"SeatReserved / SeatReleased / SeatSold"| B
    A <-->|"EF Core"| D
    W -->|"POST release-expired<br/>every minute, Service JWT"| A
```

- **Thin controllers:** they call a service and turn its `ServiceResult` into an HTTP response
  (404, 400, 409, 403 with `ProblemDetails`).
- **The business logic lives in the services** (`ReservationService`, `PurchaseService`,
  `CheckInService` and others): checks, prices, hold expiry, and catching double sales through a
  unique index.
- **Services notify after saving:** a seat change reaches the WebSocket group through
  `SeatNotifier` only once the database has accepted it.

## <img src="https://api.iconify.design/lucide/layers.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Technologies

<table>
  <tr>
    <th align="left">Backend</th>
    <td>
      <img src="https://img.shields.io/badge/ASP.NET_Core_10-512BD4?logo=dotnet&logoColor=white" alt="ASP.NET Core 10">
      <img src="https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white" alt="JWT">
    </td>
  </tr>
  <tr>
    <th align="left">Frontend</th>
    <td>
      <img src="https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black" alt="React 19">
      <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
      <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
      <img src="https://img.shields.io/badge/Radix_Themes-000000?logo=radixui&logoColor=white" alt="Radix Themes">
      <img src="https://img.shields.io/badge/Recharts-22B5BF" alt="Recharts">
    </td>
  </tr>
  <tr>
    <th align="left">Database</th>
    <td>
      <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite">
      <img src="https://img.shields.io/badge/EF_Core_10-512BD4?logo=dotnet&logoColor=white" alt="EF Core 10"> with migrations
    </td>
  </tr>
  <tr>
    <th align="left">Real time</th>
    <td>
      <img src="https://img.shields.io/badge/WebSocket-4B2465" alt="WebSocket"> <code>/ws/seats</code>, one group per event
    </td>
  </tr>
  <tr>
    <th align="left">Background work</th>
    <td>
      <img src="https://img.shields.io/badge/.NET_Worker_Service-512BD4?logo=dotnet&logoColor=white" alt=".NET Worker Service">
    </td>
  </tr>
</table>

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;Documentation

- [Design guide](docs/design.md): colors, type, pixel art, components and rules

## <img src="https://api.iconify.design/lucide/terminal.svg?color=%23E0457B" alt="" width="24" height="24">&nbsp;How to run

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

[^en-hold]: The hold time is set with the API setting `Reservations:HoldMinutes` (10 by default).

[^en-worker]: The Worker runs once a minute; change it with `Worker:IntervalSeconds`.

[^en-cats]: The cat is picked from the seat's row and number, so the same seat always shows the same cat.
