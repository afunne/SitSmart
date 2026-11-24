using Piletimyyk.Worker;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddOptions<WorkerSettings>()
    .Bind(builder.Configuration.GetSection(WorkerSettings.SectionName))
    .Validate(s => Uri.TryCreate(s.ApiBaseUrl, UriKind.Absolute, out _) && s.ApiBaseUrl.EndsWith('/'),
        "Worker:ApiBaseUrl must be an absolute URL ending in '/'.")
    .Validate(s => !string.IsNullOrWhiteSpace(s.LoginPath), "Worker:LoginPath is required.")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Email), "Worker:Email is required.")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Password),
        "Worker:Password is missing. Set it with: dotnet user-secrets set \"Worker:Password\" \"<password>\"")
    .Validate(s => s.IntervalSeconds > 0, "Worker:IntervalSeconds must be greater than 0.")
    .ValidateOnStart();

builder.Services.AddTransient<PiletimyykApiClient>();
builder.Services.AddHostedService<ReleaseExpiredReservationsWorker>();

var host = builder.Build();
host.Run();
