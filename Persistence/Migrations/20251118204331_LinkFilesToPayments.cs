using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LinkFilesToPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileDescription",
                table: "MemberFiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentId",
                table: "MemberFiles",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberFiles_PaymentId",
                table: "MemberFiles",
                column: "PaymentId");

            migrationBuilder.AddForeignKey(
                name: "FK_MemberFiles_Payments_PaymentId",
                table: "MemberFiles",
                column: "PaymentId",
                principalTable: "Payments",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MemberFiles_Payments_PaymentId",
                table: "MemberFiles");

            migrationBuilder.DropIndex(
                name: "IX_MemberFiles_PaymentId",
                table: "MemberFiles");

            migrationBuilder.DropColumn(
                name: "FileDescription",
                table: "MemberFiles");

            migrationBuilder.DropColumn(
                name: "PaymentId",
                table: "MemberFiles");
        }
    }
}
