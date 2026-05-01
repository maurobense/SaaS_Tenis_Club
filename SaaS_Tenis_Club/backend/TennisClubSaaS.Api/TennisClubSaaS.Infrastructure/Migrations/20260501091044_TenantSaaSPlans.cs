using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TennisClubSaaS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TenantSaaSPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BillingCurrency",
                table: "ClubTenants",
                type: "nvarchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "UYU");

            migrationBuilder.AddColumn<string>(
                name: "BillingNotes",
                table: "ClubTenants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BillingStatus",
                table: "ClubTenants",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "MaxCoaches",
                table: "ClubTenants",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxCourts",
                table: "ClubTenants",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxMembers",
                table: "ClubTenants",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyPrice",
                table: "ClubTenants",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 5990m);

            migrationBuilder.AddColumn<int>(
                name: "PlanType",
                table: "ClubTenants",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionEndsAt",
                table: "ClubTenants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionStartedAt",
                table: "ClubTenants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndsAt",
                table: "ClubTenants",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillingCurrency",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "BillingNotes",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "BillingStatus",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "MaxCoaches",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "MaxCourts",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "MaxMembers",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "MonthlyPrice",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "PlanType",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "SubscriptionEndsAt",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "SubscriptionStartedAt",
                table: "ClubTenants");

            migrationBuilder.DropColumn(
                name: "TrialEndsAt",
                table: "ClubTenants");
        }
    }
}
