using QRCoder;

namespace Piletimyyk.Api.Services;

public interface IQrCodeService
{
    // A PNG QR code for text, Ink Purple on white with a quiet zone.
    byte[] GeneratePng(string text);
}

public class QrCodeService : IQrCodeService
{
    // Ink Purple (#1C0F26) from the design palette, as RGB.
    private static readonly byte[] DarkRgb = [0x1C, 0x0F, 0x26];

    private static readonly byte[] LightRgb = [0xFF, 0xFF, 0xFF];

    // A 12-character ticket code fits in 21×21 modules; with the 4-module quiet zone on each side the PNG is 290×290 px.
    private const int PixelsPerModule = 10;

    public byte[] GeneratePng(string text)
    {
        // Q (25 % recovery): still scannable from a scratched phone screen or a creased printout.
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);

        // The quiet zone (empty margin around the code) is what lets scanners find it on any background.
        return new PngByteQRCode(data).GetGraphic(PixelsPerModule, DarkRgb, LightRgb, drawQuietZones: true);
    }
}
