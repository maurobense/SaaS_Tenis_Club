using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TennisClubSaaS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class GuestPlayerFee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "GuestFeePaidAt",
                table: "Reservations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "GuestFeePerPlayer",
                table: "Reservations",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GuestFeeTotal",
                table: "Reservations",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuestFeePaidAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "GuestFeePerPlayer",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "GuestFeeTotal",
                table: "Reservations");
        }
    }
}
