import type { SupabaseClient, User } from "@supabase/supabase-js";

type EnsureProfileResult = {
  error?: string;
};

type ProfileSeed = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  created_by_user_id?: string;
  modified_by_user_id?: string;
};

type ErrorLike = {
  code?: string;
  message?: string;
};

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function getUserNameParts(user: User) {
  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  const givenName = readString(metadata.given_name);
  const familyName = readString(metadata.family_name);

  if (givenName || familyName) {
    return {
      first_name: givenName ?? readString(user.email?.split("@")[0]) ?? "User",
      last_name: familyName ?? "",
    };
  }

  const fullName = readString(metadata.full_name) ?? readString(metadata.name);

  if (fullName) {
    const [firstName, ...rest] = fullName.split(/\s+/);
    return {
      first_name: firstName ?? readString(user.email?.split("@")[0]) ?? "User",
      last_name: rest.join(" "),
    };
  }

  return {
    first_name: readString(user.email?.split("@")[0]) ?? "User",
    last_name: "",
  };
}

function buildProfileSeed(user: User): ProfileSeed {
  const { first_name, last_name } = getUserNameParts(user);

  return {
    id: user.id,
    first_name,
    last_name,
    ...(user.email ? { email: user.email } : {}),
    created_by_user_id: user.id,
    modified_by_user_id: user.id,
  };
}

function getPayloadVariants(seed: ProfileSeed) {
  return [
    {
      id: seed.id,
      first_name: seed.first_name,
      last_name: seed.last_name,
      ...(seed.email ? { email: seed.email } : {}),
      created_by_user_id: seed.created_by_user_id,
      modified_by_user_id: seed.modified_by_user_id,
    },
    {
      id: seed.id,
      first_name: seed.first_name,
      last_name: seed.last_name,
      ...(seed.email ? { email: seed.email } : {}),
    },
    {
      id: seed.id,
      first_name: seed.first_name,
      last_name: seed.last_name,
      created_by_user_id: seed.created_by_user_id,
      modified_by_user_id: seed.modified_by_user_id,
    },
    {
      id: seed.id,
      first_name: seed.first_name,
      last_name: seed.last_name,
    },
    {
      id: seed.id,
    },
  ];
}

function isRetryableSchemaError(error: ErrorLike | null) {
  if (!error) {
    return false;
  }

  if (error.code === "PGRST204" || error.code === "42703") {
    return true;
  }

  return /could not find the .* column|column .* does not exist/i.test(
    error.message ?? ""
  );
}

export async function ensureProfileForUser(
  supabase: SupabaseClient,
  user: User
): Promise<EnsureProfileResult> {
  const payloads = getPayloadVariants(buildProfileSeed(user));
  let lastError: ErrorLike | null = null;

  for (const payload of payloads) {
    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

    if (!error) {
      return {};
    }

    lastError = error;

    if (!isRetryableSchemaError(error)) {
      break;
    }
  }

  console.error("Failed to ensure profile row", {
    userId: user.id,
    error: lastError,
  });

  return {
    error: "We couldn't finish setting up your account.",
  };
}
