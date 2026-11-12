namespace Piletimyyk.Api.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Buyer = "Buyer";
    public const string Controller = "Controller";
    public const string Service = "Service";

    public static readonly string[] All = { Admin, Buyer, Controller, Service };
}
