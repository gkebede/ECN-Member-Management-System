import type { Member, Result } from "../types";
import agent from "./agent";

// The API's HandleResult returns Ok(result.Value), which is just the string ID, not a Result<string>
const createMember = async (member: Member, files: File[] = []): Promise<string | Result<string>> => {
  if (!member.email) {
    throw new Error("Email is required");
  }

  const formData = new FormData();

  // Basic fields
  formData.append("memberDto.id", member.id ?? '');
  formData.append("memberDto.firstName", member.firstName ?? '');
  formData.append("memberDto.middleName", member.middleName ?? '');
  formData.append("memberDto.lastName", member.lastName ?? '');
  formData.append("memberDto.email", member.email ?? '');
  formData.append("memberDto.phoneNumber", member.phoneNumber ?? '');
  formData.append("memberDto.registerDate", member.registerDate ?? '');

  // Booleans
  formData.append("memberDto.isActive", String(member.isActive ?? false));
  formData.append("memberDto.isAdmin", String(member.isAdmin ?? false));

  // Username and Password (for admin members)
  // Note: C# model binding is case-sensitive, use PascalCase to match MemberDto properties
  if (member.userName) {
    formData.append("memberDto.UserName", member.userName);
  }
  if (member.password) {
    formData.append("memberDto.Password", member.password);
  }

  // Nested collections as JSON
  formData.append("memberDto.addressesJson", JSON.stringify(member.addresses ?? []));
  formData.append("memberDto.familyMembersJson", JSON.stringify(member.familyMembers ?? []));
  formData.append("memberDto.paymentsJson", JSON.stringify(member.payments ?? []));
  formData.append("memberDto.incidentsJson", JSON.stringify(member.incidents ?? []));

  // Files
  files.forEach(file => formData.append("files", file));

  // POST using agent
  // HandleResult returns Ok(result.Value), so the response is just the string ID
  const response = await agent.agentFormData.postFormData<string>(
    '/members',
    formData
  );

  // Make sure to return the API result (not AxiosResponse)
  // The API returns just the string ID directly
  return response;
};

export default createMember;
