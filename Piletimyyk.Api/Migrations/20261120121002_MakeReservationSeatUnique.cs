using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Piletimyyk.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeReservationSeatUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Expired holds used to stay next to newer ones for the same seat, which would make
            // the unique index fail to build. Keep only the newest row per seat; older ones have
            // expired (a new hold is only possible once the previous one has).
            migrationBuilder.Sql("""
                DELETE FROM "Reservations"
                WHERE "Id" NOT IN (
                    SELECT MAX("Id") FROM "Reservations" GROUP BY "EventId", "SeatId"
                );
                """);

            migrationBuilder.DropIndex(
                name: "IX_Reservations_EventId_SeatId",
                table: "Reservations");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_EventId_SeatId",
                table: "Reservations",
                columns: new[] { "EventId", "SeatId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reservations_EventId_SeatId",
                table: "Reservations");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_EventId_SeatId",
                table: "Reservations",
                columns: new[] { "EventId", "SeatId" });
        }
    }
}
