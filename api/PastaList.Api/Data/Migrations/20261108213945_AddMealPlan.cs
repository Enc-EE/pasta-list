using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaList.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMealPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "meal_plans",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "meal_plan_entries",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MealPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_plan_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meal_plan_entries_meal_plans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalSchema: "pasta",
                        principalTable: "meal_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "meal_plan_invitations",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MealPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AcceptedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_plan_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meal_plan_invitations_meal_plans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalSchema: "pasta",
                        principalTable: "meal_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "meal_plan_members",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MealPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_plan_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meal_plan_members_meal_plans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalSchema: "pasta",
                        principalTable: "meal_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_meal_plan_members_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "pasta",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_meal_plan_entries_MealPlanId_Date_Slot",
                schema: "pasta",
                table: "meal_plan_entries",
                columns: new[] { "MealPlanId", "Date", "Slot" });

            migrationBuilder.CreateIndex(
                name: "IX_meal_plan_invitations_Email_AcceptedAt",
                schema: "pasta",
                table: "meal_plan_invitations",
                columns: new[] { "Email", "AcceptedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_meal_plan_invitations_MealPlanId_Email",
                schema: "pasta",
                table: "meal_plan_invitations",
                columns: new[] { "MealPlanId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_meal_plan_members_MealPlanId_UserId",
                schema: "pasta",
                table: "meal_plan_members",
                columns: new[] { "MealPlanId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_meal_plan_members_UserId",
                schema: "pasta",
                table: "meal_plan_members",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "meal_plan_entries",
                schema: "pasta");

            migrationBuilder.DropTable(
                name: "meal_plan_invitations",
                schema: "pasta");

            migrationBuilder.DropTable(
                name: "meal_plan_members",
                schema: "pasta");

            migrationBuilder.DropTable(
                name: "meal_plans",
                schema: "pasta");
        }
    }
}
