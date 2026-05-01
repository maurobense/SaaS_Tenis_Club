using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TennisClubSaaS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReservationPlayersAndLimits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlayFormat",
                table: "Reservations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ReservationParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MemberProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsClubMember = table.Column<bool>(type: "bit", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    ClubTenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReservationParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReservationParticipants_MemberProfiles_MemberProfileId",
                        column: x => x.MemberProfileId,
                        principalTable: "MemberProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReservationParticipants_Reservations_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReservationParticipants_ClubTenantId",
                table: "ReservationParticipants",
                column: "ClubTenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationParticipants_ClubTenantId_ReservationId_Position",
                table: "ReservationParticipants",
                columns: new[] { "ClubTenantId", "ReservationId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReservationParticipants_MemberProfileId",
                table: "ReservationParticipants",
                column: "MemberProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationParticipants_ReservationId",
                table: "ReservationParticipants",
                column: "ReservationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReservationParticipants");

            migrationBuilder.DropColumn(
                name: "PlayFormat",
                table: "Reservations");
        }
    }
}
