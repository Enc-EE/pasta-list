using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaList.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "pasta");

            migrationBuilder.CreateTable(
                name: "shopping_lists",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_lists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "shopping_list_items",
                schema: "pasta",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShoppingListId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: false),
                    Unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsChecked = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_list_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_shopping_list_items_shopping_lists_ShoppingListId",
                        column: x => x.ShoppingListId,
                        principalSchema: "pasta",
                        principalTable: "shopping_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_items_ShoppingListId_SortOrder",
                schema: "pasta",
                table: "shopping_list_items",
                columns: new[] { "ShoppingListId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_shopping_lists_IsArchived",
                schema: "pasta",
                table: "shopping_lists",
                column: "IsArchived");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "shopping_list_items",
                schema: "pasta");

            migrationBuilder.DropTable(
                name: "shopping_lists",
                schema: "pasta");
        }
    }
}
