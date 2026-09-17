import type { SupabaseClient } from "@supabase/supabase-js";
import { ApplicationError } from "@masteryloop/domain";
import type {
  AccountIdentityPort,
  AccountRepository,
  CreateAccountInput,
  UpdateAccountInput,
} from "@masteryloop/application";
import type { Database } from "./database.types.ts";
import { check } from "./errors.ts";
export class SupabaseAccountRepository implements AccountRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async reserve(input: Omit<CreateAccountInput, "password">) {
    const { data, error } = await this.client.rpc("reserve_account", {
      request_id: input.requestId,
      account_email: input.email,
      account_name: input.displayName,
      account_role: input.role,
      grade_level: input.gradeLevel,
      school_year: input.schoolYear,
    });
    check(error);
    return data;
  }
  async update(input: UpdateAccountInput) {
    const { error } = await this.client.rpc("update_account", {
      target_id: input.accountId,
      expected_version: input.expectedVersion,
      account_name: input.displayName,
      account_role: input.role,
      is_active: input.active,
      grade_level: input.gradeLevel,
      school_year: input.schoolYear,
      change_reason: input.reason,
    });
    check(error);
  }
}
export class SupabaseAccountIdentity implements AccountIdentityPort {
  constructor(private readonly adminClient: SupabaseClient<Database>) {}
  async create(input: { email: string; password: string; requestId: string }) {
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { masteryloop_account_request: input.requestId },
    });
    if (error || !data.user)
      throw new ApplicationError(
        "CONFLICT",
        "Account creation could not complete. Verify the email is unused and your admin sign-in is recent, then retry with the same details.",
      );
    const completion = await this.adminClient.rpc("complete_account_provisioning", {
      request_id: input.requestId,
      target_user_id: data.user.id,
      target_email: input.email,
    });
    if (completion.error) {
      await this.adminClient.auth.admin.deleteUser(data.user.id);
      throw new ApplicationError(
        "UNAVAILABLE",
        "Account provisioning could not complete; no partial account was retained.",
      );
    }
    return data.user.id;
  }
}
