#Requires -Version 7.0
<#
.SYNOPSIS
    Checks that a seat can't be sold twice: buyer and buyer2 try to reserve and buy the
    same seat at the same moment.

.DESCRIPTION
    Picks the first free seat of the first upcoming event (or of -EventId), then runs both
    buyers in parallel. Each one reserves the seat and, if that worked, buys it.

    Expected: exactly one buyer ends with a ticket (purchase 200) and the other gets 409.
    The 409 normally comes at the reserve step, since only one hold per seat can exist.

    Note: this really buys a ticket in the database the API runs on, and each run uses up
    another seat. Point it at a test copy if that matters.

    Exit code: 0 if the result is as expected, 1 otherwise.

.PARAMETER BaseUrl
    API base URL.

.PARAMETER EventId
    Event to use. Default: the first event that hasn't started yet.

.EXAMPLE
    ./tests/double-sale.ps1
    ./tests/double-sale.ps1 -BaseUrl https://localhost:7083 -EventId 2
#>
param(
    [string]$BaseUrl = 'http://localhost:5237',
    [int]$EventId,
    [string]$Password = 'Buyer123!'
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

# Log in before the race, so password hashing doesn't skew who starts first.
$buyers = 'buyer@sitsmart.ee', 'buyer2@sitsmart.ee' | ForEach-Object {
    $login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" `
        -ContentType 'application/json' `
        -Body (@{ email = $_; password = $Password } | ConvertTo-Json)
    [pscustomobject]@{ Email = $_; Token = $login.token }
}

if (-not $EventId) {
    $now = [DateTimeOffset]::UtcNow
    $upcoming = Invoke-RestMethod -Uri "$BaseUrl/api/events" |
        Where-Object { [DateTimeOffset]$_.startsAt -gt $now } |
        Sort-Object { [DateTimeOffset]$_.startsAt } |
        Select-Object -First 1
    if (-not $upcoming) { throw 'No upcoming event found. Pass -EventId.' }
    $EventId = $upcoming.id
}

$seat = (Invoke-RestMethod -Uri "$BaseUrl/api/events/$EventId/seats").seats |
    Where-Object state -eq 'Free' |
    Select-Object -First 1
if (-not $seat) { throw "Event $EventId has no free seats." }

Write-Host "Event $EventId, seat $($seat.seatId) (row $($seat.row), number $($seat.number))"

# Both threads wait here until the other one is ready too, then fire at the same time.
$barrier = [System.Threading.Barrier]::new($buyers.Count)

$results = $buyers | ForEach-Object -ThrottleLimit $buyers.Count -Parallel {
    $base = $using:BaseUrl
    $eventId = $using:EventId
    $seatId = ($using:seat).seatId
    $barrier = $using:barrier   # the same object in both threads, not a copy
    $headers = @{ Authorization = "Bearer $($_.Token)" }
    $reserveStatus = $null
    $purchaseStatus = $null

    [void]$barrier.SignalAndWait([TimeSpan]::FromSeconds(30))

    $response = Invoke-RestMethod -Method Post -Uri "$base/api/events/$eventId/reservations" `
        -Headers $headers -ContentType 'application/json' `
        -Body (@{ seatId = $seatId } | ConvertTo-Json) `
        -SkipHttpErrorCheck -StatusCodeVariable reserveStatus

    if ($reserveStatus -eq 201) {
        $response = Invoke-RestMethod -Method Post -Uri "$base/api/reservations/$($response.id)/purchase" `
            -Headers $headers -SkipHttpErrorCheck -StatusCodeVariable purchaseStatus
    }

    # Errors are ProblemDetails (application/problem+json); parse them if they came back as text.
    if ($response -is [string]) {
        $response = try { $response | ConvertFrom-Json } catch { @{ detail = $response } }
    }

    [pscustomobject]@{
        Buyer    = $_.Email
        Reserve  = $reserveStatus
        Purchase = $purchaseStatus
        Result   = if ($purchaseStatus -eq 200) { "ticket $($response.code)" } else { $response.detail }
    }
}

$results | Sort-Object Buyer | Format-Table -AutoSize | Out-Host

$successes = @($results | Where-Object Purchase -eq 200).Count
$conflicts = @($results | Where-Object { $_.Reserve -eq 409 -or $_.Purchase -eq 409 }).Count

if ($successes -eq 1 -and $conflicts -eq 1) {
    Write-Host 'PASS: exactly one success and one 409.' -ForegroundColor Green
    exit 0
}

Write-Host "FAIL: expected 1 success and 1 409, got $successes success(es) and $conflicts 409(s)." -ForegroundColor Red
exit 1
