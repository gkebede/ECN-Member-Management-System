using Application.Core;
using Application.Dtos;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<Member> _userManager;
        private readonly SignInManager<Member> _signInManager;
        private readonly IConfiguration _config;

        public AccountController(UserManager<Member> userManager, SignInManager<Member> signInManager, IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            // Try to find user by username (case-insensitive)
            var user = await _userManager.FindByNameAsync(loginDto.Username);
            
            // If not found by username, try by email
            if (user == null)
            {
                user = await _userManager.FindByEmailAsync(loginDto.Username);
            }
            
            if (user == null)
                return Unauthorized("Invalid username or password");

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (!result.Succeeded)
            {
                // Log the failure reason for debugging
                if (result.IsLockedOut)
                    return Unauthorized("Account is locked out");
                if (result.IsNotAllowed)
                    return Unauthorized("Account is not allowed to sign in");
                if (result.RequiresTwoFactor)
                    return Unauthorized("Two-factor authentication required");
                
                return Unauthorized("Invalid username or password");
            }

            // Check if user is an admin - only admins can login
            if (!user.IsAdmin)
            {
                return Unauthorized("Access denied. Only admin members can login.");
            }

            return new UserDto
            {
                Username = user.UserName,
                Token = CreateToken(user),
                Email = user.Email
            };
        }

        [Authorize]
        [HttpGet("current")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var user = await _userManager.FindByNameAsync(User.Identity?.Name ?? "");
            
            if (user == null)
                return Unauthorized();

            return new UserDto
            {
                Username = user.UserName,
                Token = CreateToken(user),
                Email = user.Email
            };
        }

        private string CreateToken(Member user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? "")
            };

            var roles = _userManager.GetRolesAsync(user).Result;
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["TokenKey"] ?? "super-secret-key-that-should-be-at-least-32-characters-long-for-security"));
            
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(7),
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}

