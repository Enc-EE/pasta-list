using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaList.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddListOwnershipAndSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                schema: "pasta",
                table: "shopping_lists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "shopping_list_invitations",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShoppingListId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AcceptedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_list_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_shopping_list_invitations_shopping_lists_ShoppingListId",
                        column: x => x.ShoppingListId,
                        principalSchema: "pasta",
                        principalTable: "shopping_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "shopping_list_members",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShoppingListId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_list_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_shopping_list_members_shopping_lists_ShoppingListId",
                        column: x => x.ShoppingListId,
                        principalSchema: "pasta",
                        principalTable: "shopping_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shopping_list_members_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "pasta",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_shopping_lists_OwnerId",
                schema: "pasta",
                table: "shopping_lists",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_invitations_Email_AcceptedAt",
                schema: "pasta",
                table: "shopping_list_invitations",
                columns: new[] { "Email", "AcceptedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_invitations_ShoppingListId_Email",
                schema: "pasta",
                table: "shopping_list_invitations",
                columns: new[] { "ShoppingListId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_members_ShoppingListId_UserId",
                schema: "pasta",
                table: "shopping_list_members",
                columns: new[] { "ShoppingListId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_members_UserId",
                schema: "pasta",
                table: "shopping_list_members",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "shopping_list_invitations",
                schema: "pasta");

            migrationBuilder.DropTable(
                name: "shopping_list_members",
                schema: "pasta");

            migrationBuilder.DropIndex(
                name: "IX_shopping_lists_OwnerId",
                schema: "pasta",
                table: "shopping_lists");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                schema: "pasta",
                table: "shopping_lists");
        }
    }
}
