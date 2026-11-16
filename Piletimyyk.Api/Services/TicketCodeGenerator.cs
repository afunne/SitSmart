using System.Security.Cryptography;

namespace Piletimyyk.Api.Services;

public interface ITicketCodeGenerator
{
    /// <summary>A new random ticket code, e.g. "K7QM2XWD9TPA".</summary>
    string Generate();
}

/// <summary>
/// Ticket codes are typed in or read aloud at the entrance, so the alphabet leaves out
/// characters that are easy to mix up: 0/O and 1/I.
/// 32 characters ^ 12 = 2^60 possible codes, so they can't be guessed. Tickets.Code has a
/// unique index; a collision is astronomically unlikely but would fail the insert.
/// </summary>
public class TicketCodeGenerator : ITicketCodeGenerator
{
    public const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public const int Length = 12;

    public string Generate()
    {
        // Cryptographically secure and without modulo bias (every character equally likely).
        return RandomNumberGenerator.GetString(Alphabet, Length);
    }
}
