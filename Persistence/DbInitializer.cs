using Microsoft.AspNetCore.Identity;
using Domain; // Add this line if 'Member' is in the 'Domain' namespace



namespace Persistence
{
 public class DbInitializer
{
    public static async Task SeedData(AppDbContext context, UserManager<Member> userManager)
    {
        if (!userManager.Users.Any())
        {
            // --- Create Members ---
            var member = new Member
            {
                UserName = "john_doe",
                Email = "john.doe@example.com",
                PhoneNumber = "123-456-7890",
                FirstName = "John",
                LastName = "Doe",
                IsActive = true,
                IsAdmin = true  // Set as admin so they can login
                //Password123!
                // gkebede
                // @Ethiopia123
            };

            var member1 = new Member
            {
                UserName = "tom_smith",
                Email = "tomSmith@example.com",
                PhoneNumber = "470-980-2045",
                FirstName = "Tom",
                LastName = "Smith",
                IsActive = true,
                IsAdmin = false  // Not an admin, cannot login
            };

            var getachew = new Member
            {
                UserName = "getachew_hailu",
                Email = "getachew.hailu@example.com",
                PhoneNumber = "555-123-4567",
                FirstName = "Getachew",
                MiddleName = "T",
                LastName = "Hailu",
                IsActive = true,
                IsAdmin = true  // Set as admin so they can login
            };

            await userManager.CreateAsync(member, "Password123!");
            await userManager.CreateAsync(member1, "Password123!");
            await userManager.CreateAsync(getachew, "Password123!");

            // --- Payments ---
            if (!context.Payments.Any())
            {
                var payments = new List<Payment>
                {
                    new Payment
                    {
                        PaymentDate = new DateTime(2021, 1, 1),
                        PaymentAmount = 50.00M,
                        PaymentType = PaymentType.CreditCard,
                        PaymentRecurringType = PaymentRecurringType.Annual,
                        MemberId = member.Id
                    },
                    new Payment
                    {
                        PaymentDate = new DateTime(2021, 1, 1),
                        PaymentAmount = 20.00M,
                        PaymentType = PaymentType.ReceiptAttached,
                        PaymentRecurringType = PaymentRecurringType.Monthly,
                        MemberId = member.Id
                    },
                    // Payments for Getachew Hailu
                    new Payment
                    {
                        PaymentDate = new DateTime(2024, 1, 15),
                        PaymentAmount = 100.00M,
                        PaymentType = PaymentType.BankTransfer,
                        PaymentRecurringType = PaymentRecurringType.Membership,
                        MemberId = getachew.Id
                    },
                    new Payment
                    {
                        PaymentDate = new DateTime(2024, 2, 20),
                        PaymentAmount = 75.50M,
                        PaymentType = PaymentType.Cash,
                        PaymentRecurringType = PaymentRecurringType.Monthly,
                        MemberId = getachew.Id
                    },
                    new Payment
                    {
                        PaymentDate = new DateTime(2024, 3, 10),
                        PaymentAmount = 150.00M,
                        PaymentType = PaymentType.CreditCard,
                        PaymentRecurringType = PaymentRecurringType.Quarterly,
                        MemberId = getachew.Id
                    }
                };

                await context.Payments.AddRangeAsync(payments);
            }

            // --- Addresses ---
            if (!context.Addresses.Any())
            {
                var addresses = new List<Address>
                {
                    new Address { Street = "123 Main St", City = "New York", State = "NY", ZipCode = "10001", MemberId = member.Id },
                    new Address { Street = "456 Elm St", City = "Los Angeles", State = "CA", ZipCode = "90001", MemberId = member.Id },
                    // Addresses for Getachew Hailu
                    new Address { Street = "789 Oak Avenue", City = "Columbus", State = "OH", ZipCode = "43215", Country = "USA", MemberId = getachew.Id },
                    new Address { Street = "321 Pine Street", City = "Westerville", State = "OH", ZipCode = "43081", Country = "USA", MemberId = getachew.Id }
                };

                await context.Addresses.AddRangeAsync(addresses);
            }

            // --- FamilyMembers ---
            if (!context.FamilyMembers.Any())
            {
                var familyMembers = new List<FamilyMember>
                {
                    new FamilyMember {
                        MemberFamilyFirstName = "Jane",
                        MemberFamilyLastName = "Doe",
                        MemberFamilyMiddleName = "CBE",
                        Relationship = "Mother",
                        MemberId = member.Id
                    },
                    new FamilyMember {
                        MemberFamilyFirstName = "Sara",
                        MemberFamilyLastName = "Doe",
                        MemberFamilyMiddleName = "Tekle",
                        Relationship = "Sister",
                        MemberId = member.Id
                    },
                    // Family members for Getachew Hailu
                    new FamilyMember {
                        MemberFamilyFirstName = "Mulu",
                        MemberFamilyLastName = "Hailu",
                        MemberFamilyMiddleName = "T",
                        Relationship = "Wife",
                        MemberId = getachew.Id
                    },
                    new FamilyMember {
                        MemberFamilyFirstName = "Daniel",
                        MemberFamilyLastName = "Hailu",
                        MemberFamilyMiddleName = "G",
                        Relationship = "Son",
                        MemberId = getachew.Id
                    },
                    new FamilyMember {
                        MemberFamilyFirstName = "Martha",
                        MemberFamilyLastName = "Hailu",
                        MemberFamilyMiddleName = "G",
                        Relationship = "Daughter",
                        MemberId = getachew.Id
                    }
                };

                await context.FamilyMembers.AddRangeAsync(familyMembers);
            }

            // --- MemberFiles ---
            if (!context.MemberFiles.Any())
            {
                var memberFiles = new List<MemberFile>
                {
                    new MemberFile
                    {
                        FileName = "john.png",
                        Size = (int)new FileInfo(@"C:\Users\ghail\OneDrive\Pictures\john.png").Length,
                        ImageData = File.ReadAllBytes(@"C:\Users\ghail\OneDrive\Pictures\john.png"),
                        MemberId = member.Id
                    },
                    new MemberFile
                    {
                        FileName = "mark.png",
                        Size = (int)new FileInfo(@"C:\Users\ghail\OneDrive\Pictures\mark.png").Length,
                        ImageData = File.ReadAllBytes(@"C:\Users\ghail\OneDrive\Pictures\mark.png"),
                        MemberId = member.Id
                    },
                    new MemberFile
                    {
                        FileName = "car.jpg",
                        Size = (int)new FileInfo(@"C:\Users\ghail\OneDrive\Pictures\car.jpg").Length,
                        ImageData = File.ReadAllBytes(@"C:\Users\ghail\OneDrive\Pictures\car.jpg"),
                        MemberId = member.Id
                    }
                };

                await context.MemberFiles.AddRangeAsync(memberFiles);
            }

            // --- Incidents ---
            if (!context.Incidents.Any())
            {
                var incidents = new List<Incident>
                {
                    new Incident { EventNumber = 1, IncidentDescription = "Death", IncidentType = IncidentType.NaturalDeath, MemberId = member.Id },
                    new Incident { EventNumber = 2, IncidentDescription = "Death", IncidentType = IncidentType.NaturalDeath, MemberId = member.Id },
                    // Incidents for Getachew Hailu
                    new Incident { 
                        EventNumber = 1, 
                        IncidentDescription = "Medical emergency assistance", 
                        IncidentType = IncidentType.AccidentalDeath, 
                        IncidentDate = new DateTime(2024, 1, 10),
                        MemberId = getachew.Id 
                    },
                    new Incident { 
                        EventNumber = 2, 
                        IncidentDescription = "Family support needed", 
                        IncidentType = IncidentType.NaturalDeath, 
                        IncidentDate = new DateTime(2024, 2, 15),
                        MemberId = getachew.Id 
                    },
                    new Incident { 
                        EventNumber = 3, 
                        IncidentDescription = "Community event participation", 
                        IncidentType = IncidentType.AccidentalDeath, 
                        IncidentDate = new DateTime(2024, 3, 5),
                        MemberId = getachew.Id 
                    }
                };

                await context.Incidents.AddRangeAsync(incidents);
            }

            // --- Save All ---
            await context.SaveChangesAsync();
        }
    }
}


}
