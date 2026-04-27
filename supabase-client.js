import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4?bundle";

const SUPABASE_URL = "https://wzippxpprwgdbhzhprmj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_GrrSpG861rX4sjStAmRCKg_XlgO2cem";
const PROFILE_TABLE = "profiles";
const VEHICLES_TABLE = "vehicles";
const REQUESTS_TABLE = "service_requests";
const REQUEST_MESSAGES_TABLE = "service_request_messages";
const REQUEST_LOCATIONS_TABLE = "service_request_locations";
const REQUEST_STATUS_EVENTS_TABLE = "request_status_events";
const ACTIVE_REQUEST_STATUSES = [
  "Chờ fixer xác nhận",
  "Fixer đã xác nhận",
  "Đang tiếp cận",
  "Đang hỗ trợ",
];

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function unwrapSingleRow(value) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function callRequestRpc(functionName, args) {
  const { data, error } = await supabase.rpc(functionName, args);

  if (error) {
    throw error;
  }

  return unwrapSingleRow(data);
}

export function normalizeRole(value) {
  return value === "fixer" ? "fixer" : "user";
}

export function getRoleLabel(role) {
  return normalizeRole(role) === "fixer" ? "Fixer ResQ" : "Khách hàng";
}

function formatSupabaseError(message) {
  const normalized = String(message || "").toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu chưa đúng.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email chưa được xác nhận. Hãy kiểm tra hộp thư rồi đăng nhập lại.";
  }

  if (normalized.includes("user already registered")) {
    return "Email này đã được sử dụng. Bạn hãy đăng nhập hoặc dùng email khác.";
  }

  if (normalized.includes("password should be at least")) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  return message || "Đã có lỗi xảy ra. Hãy thử lại.";
}

async function fetchProfile(userId) {
  try {
    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select("id, full_name, phone, email, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data ?? null;
  } catch (_error) {
    return null;
  }
}

export async function buildAppUser(user) {
  const profile = await fetchProfile(user.id);
  const metadata = user.user_metadata ?? {};
  const email = user.email ?? profile?.email ?? "";
  const name =
    profile?.full_name ??
    metadata.full_name ??
    metadata.name ??
    (email ? email.split("@")[0] : "Người dùng ResQ");
  const phone = profile?.phone ?? metadata.phone ?? "";

  return {
    id: user.id,
    name,
    phone,
    email,
    role: normalizeRole(profile?.role),
  };
}

export async function syncProfile(user, input) {
  try {
    await supabase.from(PROFILE_TABLE).upsert(
      {
        id: user.id,
        full_name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        role: normalizeRole(input.role),
      },
      { onConflict: "id" },
    );
  } catch (_error) {
    // Keep auth usable even before the optional profiles table is created.
  }
}

export async function getCurrentAppUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  return buildAppUser(session.user);
}

export function subscribeToAuthChanges(onChange) {
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const nextUser = session?.user ? await buildAppUser(session.user) : null;
    onChange({ session: session ?? null, user: nextUser });
  });

  return data.subscription;
}

export async function signInWithResQ({ email, password, role }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { error: formatSupabaseError(error.message) };
  }

  const user = data.user
    ? await buildAppUser(data.user)
    : data.session?.user
      ? await buildAppUser(data.session.user)
      : null;

  if (user && user.role !== normalizeRole(role)) {
    await supabase.auth.signOut();
    return {
      error:
        normalizeRole(role) === "fixer"
          ? "Tài khoản này chưa được cấu hình ở vai trò fixer."
          : "Tài khoản này hiện đang thuộc vai trò fixer. Hãy chọn đúng chế độ đăng nhập.",
    };
  }

  return { user, session: data.session ?? null };
}

export async function signUpWithResQ({ name, phone, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: name.trim(),
        phone: phone.trim(),
      },
    },
  });

  if (error) {
    return { error: formatSupabaseError(error.message) };
  }

  if (data.user) {
    await syncProfile(data.user, {
      name,
      phone,
      email: normalizedEmail,
      role,
    });
  }

  const user = data.session?.user ? await buildAppUser(data.session.user) : null;

  return {
    user,
    session: data.session ?? null,
    needsEmailConfirmation: Boolean(data.user && !data.session),
  };
}

export async function signOutResQ() {
  await supabase.auth.signOut();
}

export async function listVehiclesForUser(userId) {
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(VEHICLES_TABLE)
      .select("id, name, plate, year, type, is_default")
      .eq("owner_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return null;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      label: row.name,
      plate: row.plate,
      year: row.year,
      kind: row.type,
      isDefault: Boolean(row.is_default),
      category: row.type === "Xe máy" ? "motorbike" : "car",
    }));
  } catch (_error) {
    return null;
  }
}

export async function saveVehiclesForUser(userId, vehicles) {
  if (!userId) {
    return false;
  }

  const rows = vehicles.map((vehicle) => ({
    id: vehicle.id,
    owner_id: userId,
    name: vehicle.label,
    plate: vehicle.plate,
    year: vehicle.year,
    type: vehicle.kind,
    is_default: Boolean(vehicle.isDefault),
  }));

  try {
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from(VEHICLES_TABLE)
        .upsert(rows, { onConflict: "id" });

      if (upsertError) {
        return false;
      }
    }

    let deleteQuery = supabase
      .from(VEHICLES_TABLE)
      .delete()
      .eq("owner_id", userId);

    if (rows.length > 0) {
      const keepIds = rows.map((row) => JSON.stringify(row.id)).join(",");
      deleteQuery = deleteQuery.not("id", "in", `(${keepIds})`);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return false;
    }

    return true;
  } catch (_error) {
    // Keep the app usable even if remote vehicle sync fails.
    return false;
  }
}

export function getOrderModeForStatus(status) {
  if (status === "Hoàn thành") {
    return "completed";
  }

  if (status === "Đã hủy") {
    return "cancelled";
  }

  if (status === "Chờ fixer xác nhận") {
    return "pending-confirmation";
  }

  return "active";
}

export function getOrderStageForStatus(status) {
  switch (status) {
    case "Chờ fixer xác nhận":
      return 0;
    case "Fixer đã xác nhận":
      return 2;
    case "Đang tiếp cận":
      return 3;
    case "Đang hỗ trợ":
      return 5;
    case "Hoàn thành":
      return 6;
    default:
      return 0;
  }
}

function mapRequestRecordToAppRequest(record) {
  return {
    id: record.id,
    serviceId: record.service_id,
    serviceTitle: record.service_title,
    servicePrice: record.service_price,
    serviceEta: record.service_eta,
    vehicleId: record.vehicle_id,
    vehicleName: record.vehicle_name,
    vehiclePlate: record.vehicle_plate,
    vehicleType: record.vehicle_type,
    locationAddress: record.location_address,
    locationPoint: {
      lat: record.location_lat,
      lng: record.location_lng,
    },
    locationSource: record.location_source,
    requesterId: record.requester_id,
    requesterName: record.requester_name,
    requesterPhone: record.requester_phone ?? "",
    fixerId: record.fixer_id ?? null,
    fixerName: record.fixer_name ?? "",
    fixerTeam: record.fixer_team ?? "Đội ResQ chờ xác nhận",
    fixerVehicle: record.fixer_vehicle ?? "Fixer sẽ xác nhận sau",
    status: record.status,
    createdAt: record.created_at,
  };
}

export async function createServiceRequest(request) {
  return callRequestRpc("create_service_request", {
    p_request_id: request.id,
    p_service_id: request.serviceId,
    p_service_title: request.serviceTitle,
    p_service_price: request.servicePrice,
    p_service_eta: request.serviceEta,
    p_vehicle_id: request.vehicleId,
    p_vehicle_name: request.vehicleName,
    p_vehicle_plate: request.vehiclePlate,
    p_vehicle_type: request.vehicleType,
    p_location_address: request.locationAddress,
    p_location_lat: request.locationPoint?.lat,
    p_location_lng: request.locationPoint?.lng,
    p_location_source: request.locationSource ?? "manual",
    p_notes: request.notes ?? null,
  });
}

export async function acceptServiceRequest(requestId) {
  return callRequestRpc("accept_service_request", {
    p_request_id: requestId,
  });
}

export async function advanceServiceRequestStatus(requestId) {
  return callRequestRpc("advance_service_request_status", {
    p_request_id: requestId,
  });
}

export async function completeServiceRequest(requestId) {
  return callRequestRpc("complete_service_request", {
    p_request_id: requestId,
  });
}

export async function cancelServiceRequest(requestId) {
  return callRequestRpc("cancel_service_request", {
    p_request_id: requestId,
  });
}

export async function loadLiveRequestState(user) {
  if (!user?.id) {
    return {
      activeRequest: null,
      pendingRequests: [],
      requestHistory: [],
    };
  }

  try {
    const { data, error } = await supabase.rpc("load_live_request_state");

    if (error) {
      throw error;
    }

    const payload = data ?? {};

    return {
      activeRequest: payload.active_request
        ? mapRequestRecordToAppRequest(payload.active_request)
        : null,
      pendingRequests: Array.isArray(payload.pending_requests)
        ? payload.pending_requests.map(mapRequestRecordToAppRequest)
        : [],
      requestHistory: Array.isArray(payload.request_history)
        ? payload.request_history.map(mapRequestRecordToAppRequest)
        : [],
    };
  } catch (_error) {
    return {
      activeRequest: null,
      pendingRequests: [],
      requestHistory: [],
    };
  }
}

export function subscribeToVisibleRequests(userId, onChange) {
  const channel = supabase
    .channel(`resq-mobile-requests:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: REQUESTS_TABLE,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToVehicleChanges(userId, onChange) {
  if (!userId) {
    return () => {};
  }

  const channel = supabase
    .channel(`resq-mobile-vehicles:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: VEHICLES_TABLE,
        filter: `owner_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToProfileChanges(userId, onChange) {
  if (!userId) {
    return () => {};
  }

  const channel = supabase
    .channel(`resq-mobile-profile:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: PROFILE_TABLE,
        filter: `id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listRequestMessages(requestId) {
  if (!requestId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(REQUEST_MESSAGES_TABLE)
      .select("id, request_id, sender_id, sender_name, sender_role, body, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      return [];
    }

    return (data ?? []).map((message) => ({
      id: message.id,
      requestId: message.request_id,
      senderId: message.sender_id ?? null,
      senderName: message.sender_name,
      senderRole: message.sender_role,
      body: message.body,
      createdAt: message.created_at,
    }));
  } catch (_error) {
    return [];
  }
}

export async function sendRequestMessage(input) {
  const { error } = await supabase.rpc("send_request_message", {
    p_request_id: input.requestId,
    p_body: String(input.body ?? "").trim(),
  });

  if (error) {
    throw error;
  }
}

export function subscribeToRequestMessages(requestId, onChange) {
  if (!requestId) {
    return () => {};
  }

  const channel = supabase
    .channel(`resq-mobile-request-messages:${requestId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: REQUEST_MESSAGES_TABLE,
        filter: `request_id=eq.${requestId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listRequestLocations(requestId) {
  if (!requestId) {
    return {
      user: null,
      fixer: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from(REQUEST_LOCATIONS_TABLE)
      .select("request_id, actor_id, actor_role, latitude, longitude, heading, accuracy, source, address, updated_at")
      .eq("request_id", requestId)
      .order("updated_at", { ascending: false });

    if (error) {
      return {
        user: null,
        fixer: null,
      };
    }

    return (data ?? []).reduce(
      (accumulator, row) => {
        accumulator[row.actor_role] = {
          requestId: row.request_id,
          actorId: row.actor_id ?? null,
          actorRole: row.actor_role,
          point: {
            lat: row.latitude,
            lng: row.longitude,
          },
          heading: row.heading ?? null,
          accuracy: row.accuracy ?? null,
          source: row.source,
          address: row.address ?? null,
          updatedAt: row.updated_at,
        };
        return accumulator;
      },
      {
        user: null,
        fixer: null,
      },
    );
  } catch (_error) {
    return {
      user: null,
      fixer: null,
    };
  }
}

export async function upsertRequestLocation(input) {
  const { error } = await supabase
    .from(REQUEST_LOCATIONS_TABLE)
    .upsert(
      {
        request_id: input.requestId,
        actor_id: input.actorId,
        actor_role: input.actorRole,
        latitude: input.point.lat,
        longitude: input.point.lng,
        heading: input.heading ?? null,
        accuracy: input.accuracy ?? null,
        source: input.source ?? "browser",
        address: input.address ?? null,
      },
      {
        onConflict: "request_id,actor_role",
      },
    );

  if (error) {
    throw error;
  }
}

export function subscribeToRequestLocations(requestId, onChange) {
  if (!requestId) {
    return () => {};
  }

  const channel = supabase
    .channel(`resq-mobile-request-locations:${requestId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: REQUEST_LOCATIONS_TABLE,
        filter: `request_id=eq.${requestId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listRequestStatusEvents(requestId) {
  if (!requestId) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc("list_request_status_events", {
      p_request_id: requestId,
    });

    if (error) {
      return [];
    }

    return (data ?? []).map((event) => ({
      id: event.id,
      requestId: event.request_id,
      actorId: event.actor_id ?? null,
      actorRole: event.actor_role,
      eventType: event.event_type,
      status: event.status,
      detail: event.detail ?? "",
      createdAt: event.created_at,
    }));
  } catch (_error) {
    return [];
  }
}

export function subscribeToRequestStatusEvents(requestId, onChange) {
  if (!requestId) {
    return () => {};
  }

  const channel = supabase
    .channel(`resq-mobile-request-status-events:${requestId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: REQUEST_STATUS_EVENTS_TABLE,
        filter: `request_id=eq.${requestId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
