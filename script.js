import L from "https://esm.sh/leaflet@1.9.4";
import {
  acceptServiceRequest,
  advanceServiceRequestStatus,
  cancelServiceRequest,
  completeServiceRequest,
  createServiceRequest,
  getCurrentAppUser,
  getRoleLabel,
  getOrderModeForStatus,
  getOrderStageForStatus,
  listVehiclesForUser,
  listRequestLocations,
  listRequestMessages,
  listRequestStatusEvents,
  loadLiveRequestState,
  saveVehiclesForUser,
  sendRequestMessage,
  signInWithResQ,
  signOutResQ,
  signUpWithResQ,
  subscribeToRequestLocations,
  subscribeToRequestMessages,
  subscribeToProfileChanges,
  subscribeToRequestStatusEvents,
  subscribeToVehicleChanges,
  subscribeToVisibleRequests,
  subscribeToAuthChanges,
  upsertRequestLocation,
} from "./supabase-client.js";

const userNavItems = [
  { id: "services", label: "Dịch Vụ", shortLabel: "Dịch\nVụ", icon: "wrench" },
  { id: "garage", label: "Garage", shortLabel: "Garage", icon: "pin" },
  { id: "order", label: "Theo Dõi", shortLabel: "Theo\nDõi", icon: "shield" },
  { id: "profile", label: "Tài Khoản", shortLabel: "Tài\nKhoản", icon: "user" },
];

const fixerNavItems = [
  { id: "services", label: "Đơn Hàng", shortLabel: "Đơn\nHàng", icon: "wrench" },
  { id: "order", label: "Quá Trình", shortLabel: "Quá\nTrình", icon: "shield" },
  { id: "profile", label: "Tài Khoản", shortLabel: "Tài\nKhoản", icon: "user" },
];

const USER_LOCATION = {
  lat: 10.776889,
  lng: 106.700806,
  label: "ResQ Hub, Quận 1, TP. Hồ Chí Minh",
};

const USER_LOCATION_SHORT = "Quận 1, TP.HCM";
const RESQ_HOTLINE = "1900 1234";
const RESQ_HOTLINE_TEL = "19001234";

const services = [
  {
    id: "tire",
    title: "Vá lốp / Thay lốp",
    description: "Xử lý nhanh lốp xe bị thủng, xập hoặc hư hỏng trên đường.",
    price: "Từ 50.000đ",
    eta: "~12 phút",
    types: ["motorbike", "car"],
    icon: "tire",
  },
  {
    id: "brake",
    title: "Bảo trì hệ thống phanh",
    description: "Kiểm tra và thay thế bộ phận phanh bị mòn để đảm bảo an toàn khi lái.",
    price: "Từ 200.000đ",
    eta: "~18 phút",
    types: ["car"],
    icon: "brake",
  },
  {
    id: "oil",
    title: "Thay dầu động cơ",
    description: "Thay dầu định kỳ để duy trì hiệu suất và bảo vệ động cơ bền bỉ.",
    price: "Từ 150.000đ",
    eta: "~15 phút",
    types: ["motorbike", "car"],
    icon: "oil",
  },
  {
    id: "battery",
    title: "Kích bình / cứu điện",
    description: "Khởi động nhanh khi xe hết bình giữa đường hoặc sau khi để lâu ngày.",
    price: "Từ 90.000đ",
    eta: "~10 phút",
    types: ["car"],
    icon: "bolt",
  },
  {
    id: "chain",
    title: "Sửa sên xe máy",
    description: "Căng chỉnh, thay mắt sên hoặc xử lý kẹt sên để xe máy vận hành ổn định.",
    price: "Từ 70.000đ",
    eta: "~14 phút",
    types: ["motorbike"],
    icon: "bike",
  },
];

const garages = [
  {
    id: "garage-1",
    name: "Minh Moto Express",
    address: "7 Pasteur, Q.1",
    distance: "0.4 km",
    rating: "4.9",
    phone: "0908 334 221",
    wait: "Mở",
    eta: "~8 phút",
    lat: 10.7824,
    lng: 106.6972,
    services: ["Lốp", "Điện", "Cứu hộ nhanh"],
    supports: ["motorbike", "car"],
    isOpen: true,
  },
  {
    id: "garage-2",
    name: "Sửa Xe 24/7 Q1",
    address: "52 Nam Kỳ Khởi Nghĩa",
    distance: "0.9 km",
    rating: "4.7",
    phone: "0919 556 443",
    wait: "Mở",
    eta: "~9 phút",
    lat: 10.7704,
    lng: 106.7128,
    services: ["Phanh", "Dầu", "Chẩn đoán"],
    supports: ["motorbike", "car"],
    isOpen: true,
  },
  {
    id: "garage-3",
    name: "Anh Tài Moto",
    address: "101 Trần Hưng Đạo, Q.5",
    distance: "1.5 km",
    rating: "4.4",
    phone: "0938 774 112",
    wait: "Mở",
    eta: "~11 phút",
    lat: 10.7797,
    lng: 106.7203,
    services: ["Ắc quy", "Động cơ", "Cứu hộ nhanh"],
    supports: ["motorbike", "car"],
    isOpen: true,
  },
  {
    id: "garage-4",
    name: "Bike Fix Center",
    address: "34 Cách Mạng Tháng 8",
    distance: "2.3 km",
    rating: "4.3",
    phone: "0967 223 889",
    wait: "Đóng",
    eta: "~14 phút",
    lat: 10.7735,
    lng: 106.6889,
    services: ["Xe máy", "Cứu hộ đêm"],
    supports: ["motorbike"],
    isOpen: false,
  },
];

const emergencyServiceByVehicle = {
  car: "battery",
  motorbike: "tire",
};

const orderStages = [
  { id: "sent", label: "Đã gửi", time: "14:02" },
  { id: "processing", label: "Đang xử lý", time: "14:03" },
  { id: "accepted", label: "Fixer đã nhận", time: "14:05" },
  { id: "traveling", label: "Fixer đang đến", time: "14:07" },
  { id: "arrived", label: "Đã đến nơi", time: "--:--" },
  { id: "repairing", label: "Đang sửa chữa", time: "--:--" },
  { id: "completed", label: "Hoàn thành", time: "--:--" },
];

const profileMenu = [
  { id: "personal", label: "Thông tin cá nhân", icon: "user-outline" },
  { id: "vehicles", label: "Xe của tôi", icon: "car-outline" },
  { id: "notifications", label: "Thông báo", icon: "bell" },
  { id: "security", label: "Bảo mật", icon: "shield-outline" },
  { id: "logout", label: "Đăng xuất", icon: "logout", danger: true },
];

const defaultSavedVehicles = [
  {
    id: "vehicle-motorbike-default",
    category: "motorbike",
    label: "Honda Wave RSX",
    plate: "59F1-12345",
    year: "2022",
    kind: "Xe máy",
    isDefault: true,
  },
  {
    id: "vehicle-car-default",
    category: "car",
    label: "Mazda CX-5",
    plate: "51K-19876",
    year: "2023",
    kind: "Ô tô",
    isDefault: true,
  },
];

const defaultState = {
  screen: "sos",
  serviceFilter: "car",
  activeServiceId: "tire",
  selectedServiceId: null,
  emergencySheet: null,
  callingActive: false,
  rescueForm: { name: "", plate: "", year: "" },
  emergencyVehicleType: "motorbike",
  requestVehicle: "vehicle-motorbike-default",
  requestPriority: "priority",
  selectedGarageId: null,
  garageSheetState: "peek",
  garageDetailSheet: null,
  orderMode: "idle",
  orderListTab: "active",
  orderStage: 3,
  liveRequest: null,
  incomingRequests: [],
  requestHistory: [],
  requestLocations: {
    user: null,
    fixer: null,
  },
  savedVehicles: defaultSavedVehicles,
  profileSheet: null,
  vehicleSheet: null,
  authSheet: null,
  authRole: "user",
  profileHighlight: "notifications",
  requestChats: {},
  requestStatusEvents: {},
  notifications: {
    request: true,
    eta: true,
    marketing: false,
  },
  security: {
    biometric: true,
    pin: true,
    trustedDevice: false,
  },
};

const APP_MODE =
  document.body.dataset.appMode === "fixer"
    ? "fixer"
    : document.body.dataset.appMode === "user"
      ? "user"
      : "user";
const IS_FIXER_APP = APP_MODE === "fixer";
const urlParams = new URLSearchParams(window.location.search);
const IS_PREVIEW_MODE = urlParams.get("preview") === "1";
const previewOptions = {
  preset: urlParams.get("preset"),
  role: urlParams.get("previewRole"),
  screen: urlParams.get("screen"),
  sheet: urlParams.get("sheet"),
  vehicleType: urlParams.get("vehicle"),
  filter: urlParams.get("filter"),
  profileSheet: urlParams.get("profileSheet"),
  authSheet: urlParams.get("authSheet"),
  skipSplash: urlParams.get("skipSplash") === "1",
};
const STORAGE_KEY_PREFIX = `resq-mobile-app-state:${APP_MODE}`;
let currentStorageScopeKey = "guest";

const state = loadState();
state.authRole = IS_FIXER_APP ? "fixer" : "user";
const authState = {
  ready: false,
  user: null,
  session: null,
};
const authUi = {
  pending: false,
  error: "",
  message: "",
  fields: {
    loginEmail: "",
    loginPassword: "",
    regName: "",
    regPhone: "",
    regEmail: "",
    regPassword: "",
    regConfirm: "",
  },
};
const mapControllers = {
  garage: null,
  order: null,
};
const liveSync = {
  requestsUnsubscribe: null,
  vehiclesUnsubscribe: null,
  profileUnsubscribe: null,
  messagesUnsubscribe: null,
  locationsUnsubscribe: null,
  statusEventsUnsubscribe: null,
  geolocationWatchId: null,
  activeRequestId: null,
  lastPublishedLocation: null,
};

const screenRoot = document.getElementById("screen-root");
const navRoot = document.getElementById("nav-root");
const overlayRoot = document.getElementById("overlay-root");
const brandRoot = document.getElementById("brand-root");
const controlsRoot = document.getElementById("studio-controls");
const RESQ_SPLASH_DURATION_MS = 1400;
const appLaunchState = {
  splashVisible: !previewOptions.skipSplash,
};

document.body.classList.toggle("is-launch-screen", appLaunchState.splashVisible);

hydratePreviewState();
render();
if (appLaunchState.splashVisible) {
  startLaunchSequence();
}
if (!IS_PREVIEW_MODE) {
  void initializeAuth();
}

document.addEventListener("pointerdown", () => {
  if (appLaunchState.splashVisible) {
    finishLaunchSequence();
  }
});

document.addEventListener("keydown", () => {
  if (appLaunchState.splashVisible) {
    finishLaunchSequence();
  }
});

document.addEventListener("click", (event) => {
  if (appLaunchState.splashVisible) {
    finishLaunchSequence();
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  switch (action) {
    case "set-screen":
      if (actionTarget.dataset.value === "garage") {
        const garageVehicleType = getGarageVehicleFilter();
        const filteredGarages = getEmergencyGarages(garageVehicleType);
        setState({
          screen: "garage",
          serviceFilter: garageVehicleType,
          garageSheetState: "peek",
          garageDetailSheet: null,
          selectedGarageId:
            filteredGarages.some((garage) => garage.id === state.selectedGarageId)
              ? state.selectedGarageId
              : filteredGarages[0]?.id
            ?? null,
          selectedServiceId: null,
          profileSheet: null,
          authSheet: null,
        });
        break;
      }

      setState({
        screen: actionTarget.dataset.value,
        selectedServiceId: null,
        profileSheet: null,
        authSheet: null,
        garageDetailSheet: null,
      });
      break;
    case "set-filter":
      setState({ serviceFilter: actionTarget.dataset.value, selectedServiceId: null });
      break;
    case "set-garage-vehicle": {
      const garageVehicleType = actionTarget.dataset.value === "car" ? "car" : "motorbike";
      const preferredGarageId = getEmergencyGarages(garageVehicleType)[0]?.id ?? null;
      setState({
        screen: "garage",
        serviceFilter: garageVehicleType,
        requestVehicle: getEmergencyVehicleId(garageVehicleType),
        selectedGarageId: preferredGarageId,
        garageSheetState: "peek",
        garageDetailSheet: null,
      });
      break;
    }
    case "open-service":
      setState({
        selectedServiceId: actionTarget.dataset.value,
        requestVehicle: getDefaultVehicleForService(getService(actionTarget.dataset.value)),
      });
      break;
    case "close-service":
      setState({ selectedServiceId: null });
      break;
    case "open-sos-landing":
      if (
        state.liveRequest
        && state.orderMode !== "completed"
        && state.orderMode !== "cancelled"
        && state.orderMode !== "idle"
      ) {
        setState({
          screen: "order",
          emergencySheet: null,
        });
        break;
      }
      setState({
        screen: "sos",
        emergencySheet: null,
        selectedServiceId: null,
        profileSheet: null,
        authSheet: null,
        vehicleSheet: null,
      });
      break;
    case "open-sos":
      if (
        state.liveRequest
        && state.orderMode !== "completed"
        && state.orderMode !== "cancelled"
        && state.orderMode !== "idle"
      ) {
        setState({
          screen: "order",
          emergencySheet: null,
        });
        break;
      }

      setState({
        emergencySheet: "vehicle",
        emergencyVehicleType: state.serviceFilter === "car" ? "car" : "motorbike",
        selectedServiceId: null,
        profileSheet: null,
        authSheet: null,
        vehicleSheet: null,
      });
      break;
    case "close-sos":
      setState({ emergencySheet: null });
      break;
    case "set-rescue-field": {
      const fieldName = actionTarget.dataset.field;
      if (!fieldName) {
        break;
      }
      const value = actionTarget.value ?? "";
      state.rescueForm = { ...state.rescueForm, [fieldName]: value };
      saveState();
      break;
    }
    case "submit-rescue-call": {
      state.callingActive = true;
      state.emergencySheet = null;
      render();
      const garageId = getEmergencyGarages(state.emergencyVehicleType)[0]?.id ?? "garage-1";
      window.setTimeout(() => {
        state.callingActive = false;
        state.activeServiceId = getEmergencyServiceId(state.emergencyVehicleType);
        state.requestVehicle = getEmergencyVehicleId(state.emergencyVehicleType);
        render();
        void handleCreateRequest(garageId);
      }, 2200);
      break;
    }
    case "select-sos-vehicle": {
      const emergencyVehicleType = actionTarget.dataset.value === "car" ? "car" : "motorbike";
      const preferredGarageId = getEmergencyGarages(emergencyVehicleType)[0]?.id ?? null;
      setState({
        emergencySheet: "garage",
        emergencyVehicleType,
        serviceFilter: emergencyVehicleType,
        requestVehicle: getEmergencyVehicleId(emergencyVehicleType),
        selectedGarageId: preferredGarageId,
      });
      break;
    }
    case "select-sos-vehicle-only": {
      const emergencyVehicleType = actionTarget.dataset.value === "car" ? "car" : "motorbike";
      setState({
        emergencyVehicleType,
        serviceFilter: emergencyVehicleType,
        requestVehicle: getEmergencyVehicleId(emergencyVehicleType),
      });
      break;
    }
    case "set-emergency-garage":
      setState({
        emergencySheet: "garage",
        selectedGarageId: actionTarget.dataset.value,
      });
      break;
    case "dispatch-emergency":
      state.activeServiceId = getEmergencyServiceId(state.emergencyVehicleType);
      state.requestVehicle = getEmergencyVehicleId(state.emergencyVehicleType);
      state.emergencySheet = null;
      render();
      void handleCreateRequest(actionTarget.dataset.value ?? state.selectedGarageId ?? "garage-1");
      break;
    case "set-vehicle":
      setState({ requestVehicle: actionTarget.dataset.value });
      break;
    case "set-priority":
      setState({ requestPriority: actionTarget.dataset.value });
      break;
    case "create-request":
      void handleCreateRequest(state.selectedGarageId ?? "garage-1");
      break;
    case "confirm-request":
      void handleConfirmRequest();
      break;
    case "set-garage":
      setState({
        screen: "garage",
        selectedGarageId: actionTarget.dataset.value,
        garageSheetState: "peek",
        garageDetailSheet: null,
      });
      break;
    case "toggle-garage-sheet":
      setState({
        garageSheetState: state.garageSheetState === "expanded" ? "peek" : "expanded",
        garageDetailSheet: null,
      });
      break;
    case "open-garage-detail":
      setState({
        screen: "garage",
        selectedGarageId: actionTarget.dataset.value,
        garageDetailSheet: actionTarget.dataset.value,
        garageSheetState: "peek",
      });
      break;
    case "close-garage-detail":
      setState({ garageDetailSheet: null });
      break;
    case "set-order-tab":
      setState({ orderListTab: actionTarget.dataset.value === "completed" ? "completed" : "active" });
      break;
    case "garage-request":
      void handleCreateRequest(actionTarget.dataset.value);
      break;
    case "advance-order":
      void advanceOrder();
      break;
    case "complete-order":
      void completeOrder();
      break;
    case "cancel-order":
      void cancelOrder();
      break;
    case "reset-order":
      setState({ screen: "order", orderMode: "idle", orderListTab: "active", orderStage: 3, liveRequest: null });
      break;
    case "set-order-mode":
      applyOrderMode(actionTarget.dataset.value);
      break;
    case "set-order-stage":
      setState({ orderMode: "active", orderListTab: "active", orderStage: Number(actionTarget.dataset.value) });
      break;
    case "open-profile-sheet":
      if (!authState.user) {
        clearAuthUi();
        setState({
          screen: IS_FIXER_APP ? "profile" : "services",
          authSheet: "login",
          profileSheet: null,
        });
        break;
      }
      setState({
        screen: "profile",
        profileSheet: actionTarget.dataset.value,
        authSheet: null,
        vehicleSheet: null,
        profileHighlight: actionTarget.dataset.value,
      });
      break;
    case "close-profile-sheet":
      setState({ profileSheet: null });
      break;
    case "open-vehicle-form":
      setState({
        profileSheet: null,
        vehicleSheet: actionTarget.dataset.value ?? "motorbike",
        screen: "profile",
      });
      break;
    case "close-vehicle-form":
      setState({ vehicleSheet: null });
      break;
    case "confirm-logout":
      void handleSignOut();
      break;
    case "open-auth":
      clearAuthUi();
      setState({
        screen: "profile",
        profileSheet: null,
        authRole: IS_FIXER_APP ? "fixer" : state.authRole,
        authSheet: actionTarget.dataset.value ?? "login",
      });
      break;
    case "close-auth":
      clearAuthUi();
      setState({ authSheet: null });
      break;
    case "set-auth-role":
      if (IS_FIXER_APP) {
        setState({ authRole: "fixer" });
        break;
      }
      clearAuthUi();
      setState({ authRole: actionTarget.dataset.value });
      break;
    case "set-auth-sheet":
      clearAuthUi();
      setState({ authSheet: actionTarget.dataset.value });
      break;
    case "preset":
      applyPreset(actionTarget.dataset.value);
      break;
    case "close-overlay":
      setState({
        selectedServiceId: null,
        profileSheet: null,
        authSheet: null,
        vehicleSheet: null,
        garageDetailSheet: null,
      });
      break;
    default:
      break;
  }
});

document.addEventListener("input", (event) => {
  if (appLaunchState.splashVisible) {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const field = target.dataset.authField;
  if (field && field in authUi.fields) {
    authUi.fields[field] = target.value;
  }

  if (target.dataset.action === "set-rescue-field") {
    const rescueField = target.dataset.field;
    if (rescueField) {
      state.rescueForm = { ...state.rescueForm, [rescueField]: target.value };
    }
  }
});

document.addEventListener("change", (event) => {
  if (appLaunchState.splashVisible) {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.dataset.action === "toggle-notification") {
    setState({
      notifications: {
        ...state.notifications,
        [target.dataset.value]: target.checked,
      },
    });
  }

  if (target.dataset.action === "toggle-security") {
    setState({
      security: {
        ...state.security,
        [target.dataset.value]: target.checked,
      },
    });
  }
});

document.addEventListener("submit", (event) => {
  if (appLaunchState.splashVisible) {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  const authForm = target.dataset.authForm;
  const vehicleForm = target.dataset.vehicleForm;
  const chatForm = target.dataset.chatForm;

  if (authForm) {
    event.preventDefault();

    if (authForm === "login") {
      void handleAuthLogin(target);
      return;
    }

    if (authForm === "register") {
      void handleAuthRegister(target);
    }
    return;
  }

  if (vehicleForm === "save") {
    event.preventDefault();
    handleVehicleSave(target);
    return;
  }

  if (chatForm === "send") {
    event.preventDefault();
    handleChatSubmit(target);
  }
});

function render() {
  destroyMaps();

  if (appLaunchState.splashVisible) {
    brandRoot.innerHTML = "";
    screenRoot.innerHTML = renderStaticPreview();
    navRoot.innerHTML = "";
    overlayRoot.innerHTML = "";
    if (controlsRoot) {
      controlsRoot.innerHTML = "";
    }
    return;
  }

  brandRoot.innerHTML = renderBrand();
  screenRoot.innerHTML = renderScreen();
  navRoot.innerHTML = renderNav();
  overlayRoot.innerHTML = renderOverlay();
  if (controlsRoot) {
    controlsRoot.innerHTML = renderControls();
  }
  saveState();
  window.requestAnimationFrame(() => {
    initializeMaps();
  });
}

function startLaunchSequence() {
  window.setTimeout(() => {
    finishLaunchSequence();
  }, RESQ_SPLASH_DURATION_MS);
}

function finishLaunchSequence() {
  if (!appLaunchState.splashVisible) {
    return;
  }

  appLaunchState.splashVisible = false;
  document.body.classList.remove("is-launch-screen");
  render();
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function getScopedStorageKey(scopeKey = currentStorageScopeKey) {
  return `${STORAGE_KEY_PREFIX}:${scopeKey}`;
}

function getStateScopeKey(user = authState.user) {
  return user?.id ? `user:${user.id}` : "guest";
}

function loadState(scopeKey = currentStorageScopeKey) {
  const defaultScreen = IS_FIXER_APP ? "profile" : "sos";
  const defaultAuthRole = IS_FIXER_APP ? "fixer" : defaultState.authRole;

  if (IS_PREVIEW_MODE) {
    return {
      ...structuredClone(defaultState),
      screen: defaultScreen,
      authRole: defaultAuthRole,
    };
  }

  try {
    const raw = window.localStorage.getItem(getScopedStorageKey(scopeKey));
    if (!raw) {
      return {
        ...structuredClone(defaultState),
        screen: defaultScreen,
        authRole: defaultAuthRole,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      ...structuredClone(defaultState),
      screen: typeof parsed.screen === "string" ? parsed.screen : defaultScreen,
      serviceFilter:
        typeof parsed.serviceFilter === "string"
          ? parsed.serviceFilter
          : defaultState.serviceFilter,
      activeServiceId:
        typeof parsed.activeServiceId === "string"
          ? parsed.activeServiceId
          : defaultState.activeServiceId,
      selectedServiceId:
        typeof parsed.selectedServiceId === "string" || parsed.selectedServiceId === null
          ? parsed.selectedServiceId
          : defaultState.selectedServiceId,
      requestVehicle:
        typeof parsed.requestVehicle === "string" || parsed.requestVehicle === null
          ? parsed.requestVehicle
          : defaultState.requestVehicle,
      requestPriority:
        typeof parsed.requestPriority === "string"
          ? parsed.requestPriority
          : defaultState.requestPriority,
      selectedGarageId:
        typeof parsed.selectedGarageId === "string" || parsed.selectedGarageId === null
          ? parsed.selectedGarageId
          : defaultState.selectedGarageId,
      garageSheetState:
        parsed.garageSheetState === "expanded" ? "expanded" : defaultState.garageSheetState,
      orderListTab:
        parsed.orderListTab === "completed" ? "completed" : defaultState.orderListTab,
      authRole: IS_FIXER_APP ? "fixer" : parsed.authRole === "fixer" ? "fixer" : defaultState.authRole,
      profileHighlight:
        typeof parsed.profileHighlight === "string"
          ? parsed.profileHighlight
          : defaultState.profileHighlight,
      notifications: {
        ...defaultState.notifications,
        ...parsed.notifications,
      },
      security: {
        ...defaultState.security,
        ...parsed.security,
      },
    };
  } catch (_error) {
    return {
      ...structuredClone(defaultState),
      screen: defaultScreen,
      authRole: defaultAuthRole,
    };
  }
}

function saveState() {
  if (IS_PREVIEW_MODE) {
    return;
  }

  try {
    const persistableState = {
      screen: state.screen,
      serviceFilter: state.serviceFilter,
      activeServiceId: state.activeServiceId,
      selectedServiceId: state.selectedServiceId,
      requestVehicle: state.requestVehicle,
      requestPriority: state.requestPriority,
      selectedGarageId: state.selectedGarageId,
      garageSheetState: state.garageSheetState,
      orderListTab: state.orderListTab,
      authRole: state.authRole,
      profileHighlight: state.profileHighlight,
      notifications: state.notifications,
      security: state.security,
    };

    window.localStorage.setItem(
      getScopedStorageKey(),
      JSON.stringify(persistableState),
    );
  } catch (_error) {
    // Ignore storage failures so the prototype still works in restricted browsers.
  }
}

function applyPersistedUiState(scopeKey = currentStorageScopeKey) {
  const persisted = loadState(scopeKey);

  state.screen = persisted.screen;
  state.serviceFilter = persisted.serviceFilter;
  state.activeServiceId = persisted.activeServiceId;
  state.selectedServiceId = persisted.selectedServiceId;
  state.requestVehicle = persisted.requestVehicle;
  state.requestPriority = persisted.requestPriority;
  state.selectedGarageId = persisted.selectedGarageId;
  state.garageSheetState = persisted.garageSheetState;
  state.garageDetailSheet = null;
  state.orderListTab = persisted.orderListTab;
  state.authRole = IS_FIXER_APP ? "fixer" : persisted.authRole;
  state.profileHighlight = persisted.profileHighlight;
  state.notifications = {
    ...defaultState.notifications,
    ...persisted.notifications,
  };
  state.security = {
    ...defaultState.security,
    ...persisted.security,
  };
}

function sanitizePreviewScreen(screen) {
  return ["services", "garage", "order", "profile"].includes(screen) ? screen : null;
}

function sanitizePreviewRole(role) {
  return role === "fixer" || role === "user" ? role : null;
}

function sanitizeVehicleType(type) {
  return type === "car" || type === "motorbike" ? type : null;
}

function sanitizeProfileSheet(sheet) {
  return ["personal", "vehicles", "notifications", "security", "logout"].includes(sheet)
    ? sheet
    : null;
}

function sanitizeAuthSheet(sheet) {
  return sheet === "register" || sheet === "login" ? sheet : null;
}

function getPreviewUser(role) {
  if (role === "fixer") {
    return {
      id: "preview-fixer",
      role: "fixer",
      name: "Fixer ResQ",
      phone: "0908 112 233",
      email: "fixer@resq.preview",
    };
  }

  if (role === "user") {
    return {
      id: "preview-user",
      role: "user",
      name: "Mr. Hùng",
      phone: "0901 234 567",
      email: "hung@resq.preview",
    };
  }

  return null;
}

function hydratePreviewState() {
  if (!IS_PREVIEW_MODE) {
    return;
  }

  const previewRole = sanitizePreviewRole(previewOptions.role);
  const previewScreen = sanitizePreviewScreen(previewOptions.screen);
  const previewVehicleType = sanitizeVehicleType(previewOptions.vehicleType);
  const previewProfileSheet = sanitizeProfileSheet(previewOptions.profileSheet);
  const previewAuthSheet = sanitizeAuthSheet(previewOptions.authSheet);
  const previewFilter =
    previewOptions.filter === "all"
      ? "all"
      : sanitizeVehicleType(previewOptions.filter);
  const previewUser = getPreviewUser(previewRole);
  const presetState = getPresetState(previewOptions.preset);

  authState.ready = true;
  authState.user = previewUser;
  authState.session = null;
  currentStorageScopeKey = getStateScopeKey(previewUser);

  state.authRole = previewUser?.role ?? (IS_FIXER_APP ? "fixer" : "user");
  state.savedVehicles = structuredClone(defaultSavedVehicles);
  state.requestVehicle = state.savedVehicles[0]?.id ?? defaultState.requestVehicle;
  state.selectedServiceId = null;
  state.profileSheet = null;
  state.vehicleSheet = null;
  state.garageDetailSheet = null;
  state.requestHistory = [];
  state.requestChats = {};
  state.requestStatusEvents = {};
  state.requestLocations = {
    user: null,
    fixer: null,
  };
  state.incomingRequests = [];
  state.notifications = {
    ...defaultState.notifications,
  };
  state.security = {
    ...defaultState.security,
  };

  if (presetState) {
    Object.assign(state, presetState);
  } else {
    state.screen = previewScreen ?? (IS_FIXER_APP ? "profile" : "sos");
    state.authSheet = previewUser ? null : (previewAuthSheet ?? (IS_FIXER_APP ? "login" : null));
    state.orderMode = defaultState.orderMode;
    state.orderListTab = defaultState.orderListTab;
    state.orderStage = defaultState.orderStage;
    state.liveRequest = null;
  }

  if (previewFilter) {
    state.serviceFilter = previewFilter;
  }

  if (previewVehicleType) {
    state.emergencyVehicleType = previewVehicleType;
    state.requestVehicle = getEmergencyVehicleId(previewVehicleType);
  }

  if (previewScreen) {
    state.screen = previewScreen;
  }

  if (previewProfileSheet) {
    state.screen = "profile";
    state.profileSheet = previewProfileSheet;
    state.authSheet = null;
  }

  if (previewAuthSheet && !previewUser) {
    state.authSheet = previewAuthSheet;
  }

  if (previewOptions.sheet === "sos-vehicle") {
    state.screen = "services";
    state.emergencySheet = "vehicle";
    state.authSheet = null;
  } else if (previewOptions.sheet === "sos-garage") {
    state.screen = "services";
    state.emergencySheet = "garage";
    state.authSheet = null;
    if (!state.selectedGarageId) {
      state.selectedGarageId = getEmergencyGarages(state.emergencyVehicleType)[0]?.id ?? null;
    }
  } else {
    state.emergencySheet = null;
  }
}

function renderBrand() {
  return `
    <div class="app-brand app-brand--lockup">
      <div class="brand-lockup-svg" aria-label="ResQ">${brandLockupSvg("dark")}</div>
    </div>
  `;
}

function brandLockupSvg(theme = "dark") {
  const isLight = theme === "light";
  const fill = isLight ? "#ffffff" : "var(--accent)";
  return `
    <svg viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <g fill="${fill}">
        <!-- stylized R with gear ear -->
        <path d="M8 6h22c8 0 14 5.6 14 13.5 0 5.6-3 9.7-7.7 11.8L46 50h-9.5l-8.6-17.4H17V50H8V6zm9 8.4v9.8h12c3.4 0 5.7-2 5.7-4.9s-2.3-4.9-5.7-4.9H17z"/>
        <!-- gear / antenna detail -->
        <circle cx="36" cy="10" r="3.2"/>
        <path d="M36 4l1 2.6 2.6 1L39 9l1.5 2.4-2.7.6L36 14l-1.8-2-2.7-.6L33 9l-.4-1.4L34.6 6 36 4z" opacity="0.95"/>
        <!-- esQ: lowercase e, s, then circle Q -->
        <text x="50" y="44" font-family="'Syne', 'Inter', sans-serif" font-size="34" font-weight="800" letter-spacing="-2">esQ</text>
      </g>
    </svg>
  `;
}

function requiresFixerAuth() {
  return IS_FIXER_APP && !authState.user;
}

function getGarageVehicleIconName(garage, preferredType = null) {
  if (preferredType === "car") {
    return "car";
  }

  if (preferredType === "motorbike") {
    return "bike";
  }

  if (Array.isArray(garage?.supports) && garage.supports.includes("motorbike") && !garage.supports.includes("car")) {
    return "bike";
  }

  return "garage";
}

function getGarageVehicleFilter() {
  return state.serviceFilter === "car" ? "car" : "motorbike";
}

function getVisibleGaragesForCurrentFilter() {
  return getEmergencyGarages(getGarageVehicleFilter());
}

function getPreferredVehicleType() {
  return state.serviceFilter === "car" ? "car" : "motorbike";
}

function getServicePreferredVehicleType(service) {
  if (state.serviceFilter !== "all" && service.types.includes(state.serviceFilter)) {
    return state.serviceFilter;
  }

  if (service.types.includes("motorbike") && !service.types.includes("car")) {
    return "motorbike";
  }

  return "car";
}

function getNearestGarageForVehicle(vehicleType = getPreferredVehicleType()) {
  const matchingGarages = getEmergencyGarages(vehicleType);
  return matchingGarages.find((garage) => garage.isOpen) ?? matchingGarages[0] ?? garages[0] ?? null;
}

function getPlannedServiceIdForVehicle(vehicleType = getPreferredVehicleType()) {
  return vehicleType === "car" ? "oil" : "chain";
}

function getEtaConfidenceLabel(eta) {
  const etaMinutes = Number.parseInt(String(eta ?? "").replace(/\D/g, ""), 10);

  if (!Number.isFinite(etaMinutes)) {
    return "ETA cập nhật trực tiếp";
  }

  return `ETA ổn định ${Math.max(88, 99 - etaMinutes)}%`;
}

function getServiceLiveAvailabilityLabel(service) {
  const vehicleType = getServicePreferredVehicleType(service);
  const openGarages = getEmergencyGarages(vehicleType).filter((garage) => garage.isOpen).length;

  if (openGarages <= 0) {
    return "ResQ đang ưu tiên điều phối";
  }

  return `${openGarages} garage đang nhận ca`;
}

function getGarageLiveAvailabilityLabel(garage) {
  if (!garage) {
    return "Đang đồng bộ garage";
  }

  const garageAvailabilityById = {
    "garage-1": "2 fixer trực tuyến",
    "garage-2": "1 đội trực 24/7",
    "garage-3": "Đội cứu hộ cơ động",
    "garage-4": "Nhận lại lúc 07:00",
  };

  return garageAvailabilityById[garage.id]
    ?? (garage.isOpen ? "Đang nhận ca" : "Tạm ngưng nhận ca");
}

function getMissionEtaValue(status, fallbackEta) {
  if (status === "Đang hỗ trợ") {
    return "Đã tới nơi";
  }

  if (status === "Hoàn thành") {
    return "Đã hoàn tất";
  }

  if (status === "Đã hủy") {
    return "Đã dừng";
  }

  return fallbackEta || "--";
}

function getMissionContent({ isFixer, pendingLikeMode, status, etaValue, selectedGarageName }) {
  if (pendingLikeMode) {
    return isFixer
      ? {
          headline: "Ca mới cần phản hồi ngay",
          summary: "SLA phản hồi đang ưu tiên dưới 2 phút để không trễ điều phối.",
          etaLabel: "SLA phản hồi",
          etaValue: "02 phút",
          stepTitle: "Xác nhận và gọi khách",
          stepBody: "Chốt vị trí dừng xe trước khi bắt đầu di chuyển để giảm cuộc gọi qua lại.",
        }
      : {
          headline: "ResQ đang chốt fixer gần bạn",
          summary: `${selectedGarageName} đang là điểm điều phối ưu tiên cho ca cứu hộ này.`,
          etaLabel: "ETA dự kiến",
          etaValue,
          stepTitle: "Giữ điện thoại mở",
          stepBody: "Bạn sẽ thấy hành trình trực tiếp ngay khi fixer xác nhận và bắt đầu di chuyển.",
        };
  }

  if (status === "Fixer đã xác nhận") {
    return isFixer
      ? {
          headline: "Bắt đầu tiếp cận khách hàng",
          summary: "Liên hệ nhanh để xác nhận điểm đón và tình trạng xe trước khi xuất phát.",
          etaLabel: "ETA mục tiêu",
          etaValue,
          stepTitle: "Gọi khách trong 1 phút",
          stepBody: "Một cuộc gọi ngắn sẽ giúp bạn khóa đúng vị trí và giữ kỳ vọng thời gian đến.",
        }
      : {
          headline: "Fixer đã nhận ca của bạn",
          summary: "ResQ đã khóa đội hỗ trợ và chuẩn bị mở hành trình trực tiếp.",
          etaLabel: "ETA hiện tại",
          etaValue,
          stepTitle: "Chuẩn bị mô tả sự cố",
          stepBody: "Giữ điện thoại gần bạn để fixer có thể gọi lại khi cần chốt vị trí chính xác.",
        };
  }

  if (status === "Đang tiếp cận") {
    return isFixer
      ? {
          headline: "Đang trên đường tới khách",
          summary: "Ưu tiên cập nhật nếu ETA thay đổi để khách chủ động chuẩn bị điểm dừng an toàn.",
          etaLabel: "ETA hiện tại",
          etaValue,
          stepTitle: "Báo khách khi còn dưới 2 phút",
          stepBody: "Một cập nhật ngắn ngay trước khi tới nơi giúp giảm thời gian tìm nhau trên đường.",
        }
      : {
          headline: "Fixer đang đến chỗ bạn",
          summary: "Hành trình được đồng bộ trực tiếp để bạn biết chính xác khi nào đội cứu hộ tới nơi.",
          etaLabel: "ETA hiện tại",
          etaValue,
          stepTitle: "Đứng ở vị trí an toàn",
          stepBody: "Bật đèn cảnh báo nếu có thể và chuẩn bị sẵn chìa khóa hoặc giấy tờ xe khi fixer liên hệ.",
        };
  }

  if (status === "Đang hỗ trợ") {
    return isFixer
      ? {
          headline: "Đang xử lý tại hiện trường",
          summary: "Đây là lúc cập nhật hạng mục rõ ràng nhất để tránh phát sinh bất ngờ với khách.",
          etaLabel: "Trạng thái",
          etaValue,
          stepTitle: "Chốt hạng mục trước khi thao tác",
          stepBody: "Xác nhận nhanh phương án sửa chữa hoặc cứu hộ trước khi tiếp tục xử lý xe.",
        }
      : {
          headline: "Fixer đang hỗ trợ tại chỗ",
          summary: "ResQ vẫn giữ đường dây liên lạc mở nếu bạn cần cập nhật thêm trong quá trình sửa chữa.",
          etaLabel: "Trạng thái",
          etaValue,
          stepTitle: "Giữ khu vực thao tác thông thoáng",
          stepBody: "Chuẩn bị sẵn thông tin xe và tránh di chuyển xe khi fixer đang kiểm tra.",
        };
  }

  if (status === "Hoàn thành") {
    return isFixer
      ? {
          headline: "Ca cứu hộ đã hoàn tất",
          summary: "Kiểm tra lại ghi chú cuối ca trước khi chuyển sang yêu cầu tiếp theo.",
          etaLabel: "Kết quả",
          etaValue,
          stepTitle: "Đóng ca gọn gàng",
          stepBody: "Xác nhận lịch sử cập nhật và để khách biết ca hỗ trợ đã được hoàn tất.",
        }
      : {
          headline: "Yêu cầu của bạn đã hoàn tất",
          summary: "Lịch sử cứu hộ và cập nhật trạng thái cuối cùng đã được giữ lại trong tài khoản ResQ.",
          etaLabel: "Kết quả",
          etaValue,
          stepTitle: "Kiểm tra lại xe trước khi đi tiếp",
          stepBody: "Nếu cần thêm hỗ trợ, bạn có thể tạo yêu cầu mới từ cùng màn hình dịch vụ.",
        };
  }

  if (status === "Đã hủy") {
    return {
      headline: "Yêu cầu này đã được dừng",
      summary: "ResQ giữ lại lịch sử điều phối để bạn có thể khởi tạo lại nhanh nếu cần.",
      etaLabel: "Trạng thái",
      etaValue,
      stepTitle: isFixer ? "Chờ ca tiếp theo" : "Tạo lại yêu cầu khi sẵn sàng",
      stepBody: isFixer
        ? "Bảng điều phối sẽ ưu tiên ca mới ngay khi có khách hàng gần bạn gửi yêu cầu."
        : "Bạn có thể mở lại dịch vụ hoặc SOS bất cứ lúc nào nếu vẫn cần hỗ trợ.",
    };
  }

  return {
    headline: isFixer ? "Theo dõi ca hỗ trợ hiện tại" : "Theo dõi hành trình cứu hộ",
    summary: "Trạng thái, ETA và liên lạc đều đang được đồng bộ trực tiếp trong app.",
    etaLabel: "ETA hiện tại",
    etaValue,
    stepTitle: isFixer ? "Giữ cập nhật ngắn và rõ" : "Giữ điện thoại mở để nhận cuộc gọi",
    stepBody: isFixer
      ? "Mỗi thay đổi trạng thái đều giúp khách hàng yên tâm hơn trong bối cảnh khẩn cấp."
      : "Những cập nhật ngắn từ fixer sẽ xuất hiện ngay bên dưới màn hình này.",
  };
}

function normalizeUserForAppMode(user) {
  if (!user) {
    return null;
  }

  if (IS_FIXER_APP) {
    return user.role === "fixer" ? user : null;
  }

  return user.role === "user" ? user : null;
}

function renderStaticPreview() {
  return `
    <section class="screen screen--splash" aria-label="ResQ splash screen">
      <div class="screen-scroll screen-scroll--splash">
        <div class="splash-lockup splash-lockup--figma" aria-label="ResQ">
          <div class="splash-logo">${brandLockupSvg("light")}</div>
        </div>
      </div>
    </section>
  `;
}

function renderScreen() {
  if (!authState.ready) {
    return renderAuthLoadingScreen();
  }

  if (requiresFixerAuth()) {
    return renderAuthGateScreen();
  }

  switch (state.screen) {
    case "sos":
      return renderSosLandingScreen();
    case "garage":
      return renderGarageScreen();
    case "order":
      return renderOrderScreen();
    case "profile":
      return renderProfileScreen();
    case "services":
    default:
      return renderServicesScreen();
  }
}

function renderSosLandingScreen() {
  const userName = authState.user?.name ?? "Bạn";
  const locationLabel = state.requestLocations?.user?.address ?? "Bạn đang ở Quận 7";
  const locationLine = state.requestLocations?.user?.lineTwo ?? "Nguyễn Văn Linh, Tân Phong, Quận 7";

  return `
    <section class="screen screen--sos" aria-label="ResQ SOS landing">
      <div class="screen-scroll screen-scroll--sos">
        <div class="sos-headline">
          <h1>Emergency on the road?</h1>
          <p>Press the button below,<br/>help will reach you soon</p>
        </div>

        <div class="sos-hero">
          <button class="sos-hero-button" data-action="open-sos" aria-label="Open emergency rescue">
            <span class="sos-ring sos-ring--1" aria-hidden="true"></span>
            <span class="sos-ring sos-ring--2" aria-hidden="true"></span>
            <span class="sos-ring sos-ring--3" aria-hidden="true"></span>
            <span class="sos-core" aria-hidden="true">
              ${icon("siren-car")}
              <em>Breakdown?...</em>
            </span>
          </button>
        </div>

        <div class="sos-location-card" aria-label="Vị trí của bạn">
          <div class="sos-location-head">
            <strong>User location</strong>
            <span class="sos-location-status">
              <span class="dot" aria-hidden="true"></span>detecting...
            </span>
          </div>
          <div class="sos-location-body">
            <div class="sos-location-icon">${icon("user-outline")}</div>
            <div class="sos-location-copy">
              <p>${escapeHtml(locationLabel)}</p>
              <p>${escapeHtml(locationLine)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAuthLoadingScreen() {
  return `
    <section class="screen">
      <div class="screen-scroll">
        <div class="profile-shell is-empty auth-gate-shell">
          <div class="profile-icon">${icon("user-outline")}</div>
          <h1>Đang đồng bộ tài khoản</h1>
          <p>Kiểm tra phiên Supabase để giữ đăng nhập ổn định giữa website và app.</p>
        </div>
      </div>
    </section>
  `;
}

function renderAuthGateScreen() {
  const isRegister = state.authSheet === "register";
  const heading = IS_FIXER_APP
    ? isRegister
      ? "Tạo tài khoản fixer"
      : "Fixer đăng nhập để bắt đầu"
    : isRegister
      ? "Tạo tài khoản ResQ"
      : "Đăng nhập để bắt đầu";
  const copy = IS_FIXER_APP
    ? "Đăng nhập fixer để nhận điều phối, xác nhận đơn, và đồng bộ trạng thái xử lý theo thời gian thực."
    : "Đăng nhập bằng tài khoản ResQ để đồng bộ đơn hàng, xe của bạn, và lịch sử hỗ trợ giữa web với app.";

  return `
    <section class="screen">
      <div class="screen-scroll">
        <div class="auth-gate-shell">
          <p class="eyebrow">${IS_FIXER_APP ? "Fixer account" : "ResQ account"}</p>
          <h1>${heading}</h1>
          <p class="auth-gate-copy">
            ${copy}
          </p>
          <div class="auth-gate-card">
            ${renderAuthPanelContent(isRegister)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderServicesScreen() {
  if (authState.user?.role === "fixer") {
    return renderFixerServicesScreen();
  }

  const userName = authState.user?.name ?? "Mr. Hùng";
  const firstName = userName.split(" ").at(-1) ?? userName;
  const greetingLine = "Good Morning!";
  const preferredVehicleType = getPreferredVehicleType();
  const nearestGarage = getNearestGarageForVehicle(preferredVehicleType);
  const plannedServiceId = getPlannedServiceIdForVehicle(preferredVehicleType);
  const filteredServices = services.filter((service) => {
    if (state.serviceFilter === "all") {
      return true;
    }
    return service.types.includes(state.serviceFilter);
  });
  const hasOpenOrder =
    Boolean(state.liveRequest)
    && state.orderMode !== "completed"
    && state.orderMode !== "cancelled"
    && state.orderMode !== "idle";
  const rescuePrimaryAction = hasOpenOrder ? "set-screen" : "open-sos";
  const rescuePrimaryValue = hasOpenOrder ? ' data-value="order"' : "";
  const rescueSecondaryAction = hasOpenOrder ? "set-screen" : "open-service";
  const rescueSecondaryValue = hasOpenOrder ? "garage" : plannedServiceId;
  const rescueEta = hasOpenOrder
    ? state.liveRequest?.serviceEta ?? nearestGarage?.eta ?? "--"
    : nearestGarage?.eta ?? "--";

  return `
    <section class="screen">
      <div class="screen-scroll">
        <div class="hello-card hello-card--figma">
          <div class="hello-avatar">${escapeHtml(firstName.charAt(0) || "H")}</div>
          <div>
            <h1>${escapeHtml(userName)}</h1>
            <div class="muted-text">${escapeHtml(greetingLine)}</div>
          </div>
        </div>

        <div class="service-section-head">
          <div>
            <p>Dịch vụ theo kế hoạch</p>
            <strong>Chọn nhanh theo loại xe và mức độ gấp</strong>
          </div>
          <span>${escapeHtml(filteredServices.length)} dịch vụ</span>
        </div>

        <div class="service-list service-list--figma">
          ${filteredServices
            .map(
              (service) => `
                <button class="service-card service-card--figma" data-action="${hasOpenOrder ? "set-screen" : "open-service"}" data-value="${hasOpenOrder ? "order" : service.id}">
                  <div class="service-card-head">
                    <div class="icon-badge">${icon(service.icon)}</div>
                    <div class="trust-badge-row service-card-trust">
                      <span class="trust-badge is-dark">${icon("shield")} Đã xác minh</span>
                      <span class="trust-badge is-live">${escapeHtml(getServiceLiveAvailabilityLabel(service))}</span>
                    </div>
                  </div>
                  <div class="service-card-copy">
                    <h3>${service.title}</h3>
                    <p>${service.description}</p>
                  </div>
                  <div class="service-card-foot service-card-foot--stacked">
                    <div class="service-card-metric">
                      <span>ETA gần nhất</span>
                      <strong>${service.eta}</strong>
                      <small>${escapeHtml(getEtaConfidenceLabel(service.eta))}</small>
                    </div>
                    <div class="service-card-trailing">
                      <span class="service-card-label">Chi phí từ</span>
                      <strong class="service-card-price">${service.price}</strong>
                      <span class="service-card-arrow" aria-hidden="true">&#8250;</span>
                    </div>
                  </div>
                </button>
              `,
            )
            .join("")}
        </div>

        <div class="hotline-panel">
          <div>
            <p>Hotline ResQ 24/7</p>
            <strong>${RESQ_HOTLINE}</strong>
            <span>Gọi nhanh nếu bạn chưa chắc nên chọn dịch vụ nào hoặc cần điều phối khẩn cấp.</span>
          </div>
          <a class="hotline-action-button" href="tel:${RESQ_HOTLINE_TEL}">
            ${icon("phone")} Gọi
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderFixerServicesScreen() {
  const liveRequest = state.liveRequest;
  const pendingRequests = state.incomingRequests ?? [];
  const queueRequests = liveRequest
    ? [liveRequest, ...pendingRequests.filter((request) => request.id !== liveRequest.id)]
    : pendingRequests;
  const focusRequest = queueRequests[0] ?? null;
  const focusGarage = garages.find((garage) => garage.id === focusRequest?.garageId) ?? garages[0] ?? null;
  const pendingCount = queueRequests.filter((request) => request.status === "Chờ fixer xác nhận").length;
  const activeCount = queueRequests.filter((request) => request.status !== "Chờ fixer xác nhận").length;
  const focusIsPending = focusRequest?.status === "Chờ fixer xác nhận";
  const secondaryRequests = queueRequests.slice(1, 4);

  return `
    <section class="screen">
      <div class="screen-scroll">
        <section class="dispatch-hero">
          <div class="dispatch-hero-top">
            <span class="rescue-banner-eyebrow">Fixer dispatch</span>
            <span class="dispatch-name">${escapeHtml(authState.user?.name ?? "Fixer ResQ")}</span>
          </div>
          <h1>Ưu tiên xác nhận ca gần nhất trước</h1>
          <p>${
            pendingCount > 0
              ? `${pendingCount} ca đang chờ bạn phản hồi ngay bây giờ.`
              : activeCount > 0
                ? `${activeCount} ca đang được bạn phụ trách. Ưu tiên cập nhật ETA và trạng thái trước khi nhận thêm ca mới.`
                : "Hiện chưa có ca mới, hệ thống sẽ đẩy ca gần nhất lên đầu ngay khi phát sinh."
          }</p>

          <div class="dispatch-kpi-grid">
            <div class="dispatch-kpi">
              <span>Ca chờ</span>
              <strong>${String(pendingCount).padStart(2, "0")}</strong>
            </div>
            <div class="dispatch-kpi">
              <span>SLA</span>
              <strong>${focusIsPending ? "02 phút" : "On track"}</strong>
            </div>
            <div class="dispatch-kpi">
              <span>Khoảng cách</span>
              <strong>${escapeHtml(focusGarage?.distance ?? "--")}</strong>
            </div>
            <div class="dispatch-kpi">
              <span>ETA</span>
              <strong>${escapeHtml(focusRequest?.serviceEta ?? "--")}</strong>
            </div>
          </div>
        </section>

        ${
          focusRequest
            ? `
              <div class="dispatch-section-head">
                <div>
                  <p>Ca ưu tiên</p>
                  <strong>${focusIsPending ? "Xác nhận hoặc mở điều phối ngay" : "Đang phụ trách"}</strong>
                </div>
                <span class="request-pill ${getRequestToneClass(focusRequest.status)}">${escapeHtml(focusRequest.status)}</span>
              </div>

              <div class="dispatch-card dispatch-card--primary">
                <div class="dispatch-card-row">
                  <div class="dispatch-contact">
                    <div class="dispatch-contact-icon">${icon("shield")}</div>
                    <div class="dispatch-contact-copy">
                      <strong>${escapeHtml(focusRequest.serviceTitle)}</strong>
                      <span>${escapeHtml(focusRequest.requesterName)} · ${escapeHtml(focusRequest.requesterPhone || "Chưa có số liên hệ")}</span>
                    </div>
                  </div>
                  <a class="hotline-action-button" href="tel:${(focusRequest.requesterPhone || RESQ_HOTLINE).replace(/\D/g, "")}">
                    ${icon("phone")} Gọi
                  </a>
                </div>

                <div class="trust-badge-row">
                  <span class="trust-badge is-dark">${icon("shield")} Đã xác minh</span>
                  <span class="trust-badge is-live">${escapeHtml(getGarageLiveAvailabilityLabel(focusGarage))}</span>
                  <span class="trust-badge">${escapeHtml(getEtaConfidenceLabel(focusRequest.serviceEta))}</span>
                </div>

                <div class="mission-detail-grid mission-detail-grid--dispatch">
                  <div class="mission-detail-item">
                    <span>SLA</span>
                    <strong>${focusIsPending ? "02 phút" : "Đúng tiến độ"}</strong>
                  </div>
                  <div class="mission-detail-item">
                    <span>Khoảng cách</span>
                    <strong>${escapeHtml(focusGarage?.distance ?? "--")}</strong>
                  </div>
                  <div class="mission-detail-item">
                    <span>Điều phối</span>
                    <strong>${escapeHtml(focusGarage?.name ?? "ResQ Dispatch")}</strong>
                  </div>
                  <div class="mission-detail-item">
                    <span>Loại xe</span>
                    <strong>${escapeHtml(focusRequest.vehicleType)}</strong>
                  </div>
                </div>

                <div class="mission-next-step">
                  <p>Việc cần làm ngay</p>
                  <strong>${focusIsPending ? "Xác nhận trong 2 phút để giữ SLA" : "Giữ khách hàng luôn được cập nhật"}</strong>
                  <span>${
                    focusIsPending
                      ? "Sau khi nhận ca, hãy gọi khách ngay để chốt vị trí dừng xe và chuẩn bị tiếp cận."
                      : "Nếu ETA thay đổi hoặc bạn đã đến nơi, hãy cập nhật tiến độ ngay từ luồng theo dõi."
                  }</span>
                </div>

                <div class="sheet-actions">
                  ${
                    focusIsPending
                      ? `
                        <button class="primary-button" data-action="confirm-request">Nhận ca ngay</button>
                        <button class="secondary-button" data-action="set-screen" data-value="order">Xem điều phối</button>
                      `
                      : `
                        <button class="primary-button" data-action="set-screen" data-value="order">Mở điều phối</button>
                        <button class="secondary-button" data-action="advance-order">Cập nhật bước tiếp theo</button>
                      `
                  }
                </div>
              </div>

              ${
                secondaryRequests.length > 0
                  ? `
                    <div class="dispatch-section-head dispatch-section-head--compact">
                      <div>
                        <p>Hàng chờ</p>
                        <strong>${secondaryRequests.length} ca còn lại trong bán kính gần</strong>
                      </div>
                    </div>
                    <div class="dispatch-queue-list">
                      ${secondaryRequests
                        .map((request) => {
                          const requestGarage = garages.find((garage) => garage.id === request.garageId) ?? garages[0];

                          return `
                            <article class="dispatch-queue-card">
                              <div class="dispatch-queue-top">
                                <div>
                                  <strong>${escapeHtml(request.serviceTitle)}</strong>
                                  <span>${escapeHtml(request.requesterName)} · ${escapeHtml(requestGarage?.distance ?? "--")}</span>
                                </div>
                                <span class="request-pill ${getRequestToneClass(request.status)}">${escapeHtml(request.status)}</span>
                              </div>
                              <div class="dispatch-queue-meta">
                                <span>${icon("clock")} ${escapeHtml(request.serviceEta)}</span>
                                <span>${icon("pin")} ${escapeHtml(requestGarage?.name ?? "ResQ Dispatch")}</span>
                              </div>
                            </article>
                          `;
                        })
                        .join("")}
                    </div>
                  `
                  : ""
              }
            `
            : `
              <div class="order-empty order-empty--figma dispatch-empty">
                <div class="empty-badge">Fixer</div>
                <h2>Chưa có ca nào chờ điều phối</h2>
                <p>Khi khách hàng gửi yêu cầu mới, ca gần nhất và có SLA gấp nhất sẽ xuất hiện ở đây trước.</p>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderGarageScreen() {
  const garageVehicleFilter = getGarageVehicleFilter();
  const visibleGarages = getVisibleGaragesForCurrentFilter();
  const selectedGarage =
    visibleGarages.find((garage) => garage.id === state.selectedGarageId)
    ?? visibleGarages[0]
    ?? null;
  const orderedGarages = [
    ...(selectedGarage ? [selectedGarage] : []),
    ...visibleGarages.filter((garage) => garage.id !== selectedGarage?.id),
  ];
  const garageContextLabel =
    garageVehicleFilter === "car"
      ? "Ô tô"
      : garageVehicleFilter === "motorbike"
        ? "Xe máy"
        : "Tất cả";
  const hasLiveRequest =
    Boolean(state.liveRequest)
    && state.orderMode !== "completed"
    && state.orderMode !== "cancelled"
    && state.orderMode !== "idle";
  const garagePrimaryAction = hasLiveRequest ? "set-screen" : "garage-request";
  const garagePrimaryValue = hasLiveRequest ? "order" : selectedGarage?.id ?? "";
  const garagePrimaryLabel = hasLiveRequest ? "Mở hành trình cứu hộ" : "Điều phối garage này";

  return `
    <section class="screen screen--garage-fullmap">
      <div class="garage-map-stage garage-map-stage--fullscreen">
        <div class="garage-map-layer garage-map-layer--figma garage-map-layer--fullscreen">
          <div class="map-canvas" data-map="garage" aria-label="Garage dispatch map"></div>
          <div class="map-blur-fade map-blur-fade--garage" aria-hidden="true"></div>
        </div>

        <div class="garage-floating-ui">
          <div class="garage-summary-card garage-summary-card--floating">
            <div class="garage-summary-icon">${icon("van")}</div>
            <div class="garage-summary-copy">
              <p>Garage đang ưu tiên</p>
              <strong>${escapeHtml(selectedGarage?.name ?? "Cứu Hộ 24/7 Sài Gòn")}</strong>
              <span>${USER_LOCATION_SHORT} · ${escapeHtml(selectedGarage?.eta ?? "~ 8 phút")} · ${escapeHtml(getEtaConfidenceLabel(selectedGarage?.eta))}</span>
            </div>
            <a class="garage-summary-call" href="tel:${RESQ_HOTLINE_TEL}">
              ${icon("phone")} ${RESQ_HOTLINE}
            </a>
          </div>

          <div class="garage-bottom-sheet ${state.garageSheetState === "expanded" ? "is-expanded" : "is-peek"}">
            <button
              class="garage-sheet-grabber-button"
              data-action="toggle-garage-sheet"
              aria-expanded="${state.garageSheetState === "expanded" ? "true" : "false"}"
              aria-label="${state.garageSheetState === "expanded" ? "Thu gọn danh sách garage" : "Mở rộng danh sách garage"}"
            >
              <span class="sheet-grabber"></span>
              <span class="garage-sheet-caption">${state.garageSheetState === "expanded" ? "Đang hiển thị danh sách garage" : "Kéo lên để đổi garage đã chọn"}</span>
            </button>

            <div class="garage-filter-row">
              <button
                class="pill-button ${garageVehicleFilter === "motorbike" ? "is-active is-dark" : ""}"
                data-action="set-garage-vehicle"
                data-value="motorbike"
              >
                ${icon("bike")} Xe máy
              </button>
              <button
                class="pill-button ${garageVehicleFilter === "car" ? "is-active is-dark" : ""}"
                data-action="set-garage-vehicle"
                data-value="car"
              >
                ${icon("car")} Ô tô
              </button>
            </div>

            <div class="garage-context-line garage-context-line--sheet">${icon("pin")} ${garageContextLabel} · ${USER_LOCATION_SHORT} · chạm thẻ để đổi garage</div>

            ${
              selectedGarage
                ? `
                  <div class="garage-selected-strip">
                    <div class="garage-selected-copy">
                      <p>Garage đã chọn</p>
                      <strong>${escapeHtml(selectedGarage.name)}</strong>
                      <span>${escapeHtml(selectedGarage.address)}</span>
                    </div>
                    <div class="trust-badge-row">
                      <span class="trust-badge is-dark">${icon("shield")} Đã xác minh</span>
                      <span class="trust-badge is-live">${escapeHtml(getGarageLiveAvailabilityLabel(selectedGarage))}</span>
                      <span class="trust-badge">${escapeHtml(getEtaConfidenceLabel(selectedGarage.eta))}</span>
                    </div>
                    <div class="garage-selected-actions">
                      <button class="secondary-button" data-action="open-garage-detail" data-value="${selectedGarage.id}">
                        Xem chi tiết
                      </button>
                      <button class="primary-button" data-action="${garagePrimaryAction}" data-value="${garagePrimaryValue}">
                        ${garagePrimaryLabel}
                      </button>
                    </div>
                  </div>
                `
                : ""
            }

            <div class="garage-list garage-list--figma garage-list--sheet">
              ${orderedGarages
                .map(
                  (garage) => `
                    <article class="garage-list-card ${garage.id === selectedGarage?.id ? "is-selected" : ""}">
                      <button class="garage-list-main" data-action="set-garage" data-value="${garage.id}">
                        <div class="garage-list-icon">${icon(getGarageVehicleIconName(garage, garageVehicleFilter))}</div>
                        <div class="garage-list-copy">
                          <div class="garage-list-heading">
                            <strong>${escapeHtml(garage.name)}</strong>
                            <span class="garage-status ${garage.isOpen ? "is-open" : "is-closed"}">${garage.wait}</span>
                          </div>
                          <p>${escapeHtml(garage.address)}</p>
                          <div class="garage-card-trust">
                            <span class="trust-badge is-dark">${icon("shield")} Đã xác minh</span>
                            <span class="trust-badge ${garage.isOpen ? "is-live" : "is-muted"}">${escapeHtml(getGarageLiveAvailabilityLabel(garage))}</span>
                          </div>
                          <div class="garage-list-meta">
                            <span><strong>ETA ${garage.eta}</strong></span>
                            <span>${icon("pin")} ${garage.distance}</span>
                            <span>${icon("star")} ${garage.rating}</span>
                          </div>
                        </div>
                      </button>
                      <a class="garage-list-call ${garage.isOpen ? "" : "is-disabled"}" href="tel:${garage.phone.replace(/\D/g, "")}">
                        ${icon("phone")}
                      </a>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderGarageDetailSheet() {
  const garage = garages.find((item) => item.id === state.garageDetailSheet)
    ?? garages.find((item) => item.id === state.selectedGarageId)
    ?? null;

  if (!garage) {
    return "";
  }

  const garageVehicleFilter = getGarageVehicleFilter();
  const hasLiveRequest =
    Boolean(state.liveRequest)
    && state.orderMode !== "completed"
    && state.orderMode !== "cancelled"
    && state.orderMode !== "idle";

  return `
    <div class="backdrop" data-action="close-garage-detail"></div>
    <section class="service-sheet garage-detail-sheet">
      <div class="sheet-grabber"></div>
      <div class="sheet-header">
        <div>
          <p class="eyebrow">Garage gần bạn</p>
          <h2>${escapeHtml(garage.name)}</h2>
        </div>
        <button class="sheet-close" aria-label="Đóng garage detail" data-action="close-garage-detail">${icon("close")}</button>
      </div>

      <div class="garage-detail-hero">
        <div class="garage-detail-icon">${icon(getGarageVehicleIconName(garage, garageVehicleFilter))}</div>
        <div class="garage-detail-copy">
          <div class="garage-detail-heading">
            <strong>${escapeHtml(garage.name)}</strong>
            <span class="garage-status ${garage.isOpen ? "is-open" : "is-closed"}">${garage.wait}</span>
          </div>
          <p>${escapeHtml(garage.address)}</p>
          <div class="trust-badge-row garage-detail-trust">
            <span class="trust-badge is-dark">${icon("shield")} Đã xác minh</span>
            <span class="trust-badge ${garage.isOpen ? "is-live" : "is-muted"}">${escapeHtml(getGarageLiveAvailabilityLabel(garage))}</span>
            <span class="trust-badge">${escapeHtml(getEtaConfidenceLabel(garage.eta))}</span>
          </div>
          <div class="garage-list-meta garage-detail-meta">
            <span>${icon("pin")} ${garage.distance}</span>
            <span>${icon("star")} ${garage.rating}</span>
            <span class="garage-list-phone">${garage.phone}</span>
          </div>
        </div>
      </div>

      <div class="form-card garage-detail-card">
        <strong>Dịch vụ hỗ trợ</strong>
        <div class="garage-detail-service-row">
          ${garage.services.map((service) => `<span class="garage-service-pill">${escapeHtml(service)}</span>`).join("")}
        </div>
        <div class="garage-detail-note">
          <span>${garageVehicleFilter === "car" ? "Ô tô" : "Xe máy"} · ${USER_LOCATION_SHORT}</span>
          <strong>ETA ${garage.eta} · ${escapeHtml(getEtaConfidenceLabel(garage.eta))}</strong>
        </div>
      </div>

      <div class="sheet-actions garage-detail-actions">
        <a class="secondary-button garage-detail-call" href="tel:${garage.phone.replace(/\D/g, "")}">
          ${icon("phone")} Gọi garage
        </a>
        <button class="primary-button" data-action="${hasLiveRequest ? "set-screen" : "garage-request"}" data-value="${hasLiveRequest ? "order" : garage.id}">
          ${hasLiveRequest ? "Mở hành trình" : "Điều phối ngay"}
        </button>
      </div>
    </section>
  `;
}

function renderOrderScreen() {
  const liveRequest = state.liveRequest;
  const isFixer = authState.user?.role === "fixer";
  const activeService = getCurrentService();
  const vehicle = liveRequest
    ? {
        label: liveRequest.vehicleName,
        plate: liveRequest.vehiclePlate,
        kind: liveRequest.vehicleType,
      }
    : getSelectedVehicle();
  const selectedGarage = garages.find((garage) => garage.id === state.selectedGarageId) ?? garages[0];
  const statusEvents = getCurrentRequestStatusEvents();
  const currentStage = orderStages[Math.min(state.orderStage, orderStages.length - 1)] ?? null;
  const nextStage = orderStages[state.orderStage + 1] ?? null;
  const showCompleted = state.orderListTab === "completed";
  const pendingLikeMode = state.orderMode === "pending-confirmation";
  const activeCards =
    liveRequest
    && !showCompleted
    && state.orderMode !== "completed"
    && state.orderMode !== "cancelled"
    ? [liveRequest]
    : [];
  const completedCards = [
    ...(showCompleted && liveRequest && state.orderMode === "completed" ? [liveRequest] : []),
    ...state.requestHistory,
  ];
  const missionEtaValue = getMissionEtaValue(
    liveRequest?.status,
    liveRequest?.serviceEta ?? selectedGarage?.eta ?? null,
  );
  const missionContent = liveRequest
    ? getMissionContent({
        isFixer,
        pendingLikeMode,
        status: liveRequest.status,
        etaValue: missionEtaValue,
        selectedGarageName: selectedGarage?.name ?? "ResQ Dispatch",
      })
    : null;
  const contactPhone = isFixer
    ? liveRequest?.requesterPhone || RESQ_HOTLINE
    : selectedGarage?.phone || RESQ_HOTLINE;
  const contactSupport = isFixer
    ? `${liveRequest?.vehicleName ?? "Xe chưa rõ"} · ${liveRequest?.locationAddress ?? USER_LOCATION_SHORT}`
    : `${selectedGarage?.name ?? "ResQ Dispatch"} · ${liveRequest?.fixerVehicle ?? "Đội cứu hộ ResQ"}`;

  return `
    <section class="screen">
      <div class="screen-scroll screen-scroll--figma-page">
        <div class="page-heading page-heading--figma">
          <h1>${isFixer ? "Quá trình" : "Đơn của tôi"}</h1>
          <p>${isFixer ? "Theo dõi tình trạng xử lý từng ca hỗ trợ" : "Theo dõi tình trạng dịch vụ"}</p>
        </div>

        <div class="order-tab-row">
          <button
            class="pill-button ${!showCompleted ? "is-active is-dark" : ""}"
            data-action="set-order-tab"
            data-value="active"
          >
            Đang xử lý
          </button>
          <button
            class="pill-button ${showCompleted ? "is-active" : ""}"
            data-action="set-order-tab"
            data-value="completed"
          >
            Hoàn thành
          </button>
        </div>

        ${
          showCompleted
            ? renderRequestListSection(
                completedCards,
                "completed",
                isFixer ? "Chưa có ca hoàn thành" : "Chưa có yêu cầu hoàn thành",
                isFixer
                  ? "Khi xử lý xong một ca, lịch sử sẽ xuất hiện ở đây."
                  : "Sau khi fixer hoàn tất, lịch sử cứu hộ sẽ xuất hiện ở đây.",
              )
            : renderRequestListSection(
                activeCards,
                pendingLikeMode ? "pending" : state.orderMode === "cancelled" ? "cancelled" : "active",
                isFixer ? "Bạn chưa có ca đang mở" : "Bạn chưa có yêu cầu đang xử lý",
                isFixer
                  ? "Request mới sẽ hiện ở đây ngay khi khách hàng gửi và chờ fixer xác nhận."
                  : "Tạo yêu cầu từ Dịch Vụ hoặc SOS để bắt đầu theo dõi fixer.",
              )
        }

        ${
          liveRequest && !showCompleted
            ? `
              <div class="request-detail-card mission-card">
                <div class="mission-card-head">
                  <div>
                    <p>Nhiệm vụ hiện tại</p>
                    <strong>${escapeHtml(missionContent?.headline ?? "Theo dõi hành trình cứu hộ")}</strong>
                    <span>${escapeHtml(missionContent?.summary ?? "ResQ đang đồng bộ trạng thái theo thời gian thực.")}</span>
                  </div>
                  <span class="request-pill ${getRequestToneClass(liveRequest.status)}">${escapeHtml(liveRequest.status)}</span>
                </div>

                <div class="mission-main-grid">
                  <div class="mission-eta-card">
                    <span>${escapeHtml(missionContent?.etaLabel ?? "ETA hiện tại")}</span>
                    <strong>${escapeHtml(missionContent?.etaValue ?? missionEtaValue)}</strong>
                    <small>${escapeHtml(getEtaConfidenceLabel(liveRequest.serviceEta ?? selectedGarage?.eta ?? missionEtaValue))}</small>
                  </div>

                  <div class="mission-contact-card">
                    <div class="mission-contact-copy">
                      <p>${isFixer ? "Khách đang chờ" : "Fixer đang đến"}</p>
                      <strong>${escapeHtml(
                        isFixer
                          ? liveRequest.requesterName ?? "Khách ResQ"
                          : liveRequest.fixerName ?? "Fixer ResQ",
                      )}</strong>
                      <span>${escapeHtml(contactSupport)}</span>
                    </div>
                    <a class="hotline-action-button" href="tel:${contactPhone.replace(/\D/g, "")}">
                      ${icon("phone")} Gọi
                    </a>
                  </div>
                </div>

                <div class="mission-next-step">
                  <p>Việc cần làm ngay</p>
                  <strong>${escapeHtml(missionContent?.stepTitle ?? "Tiếp tục theo dõi")}</strong>
                  <span>${escapeHtml(missionContent?.stepBody ?? "Mọi cập nhật tiếp theo sẽ xuất hiện ngay trong thẻ này.")}</span>
                </div>

                <div class="mission-detail-grid">
                  <div class="mission-detail-item">
                    <span>Dịch vụ</span>
                    <strong>${escapeHtml(liveRequest.serviceTitle ?? activeService.title)}</strong>
                  </div>
                  <div class="mission-detail-item">
                    <span>Điều phối</span>
                    <strong>${escapeHtml(selectedGarage.name)}</strong>
                  </div>
                  <div class="mission-detail-item">
                    <span>Phương tiện</span>
                    <strong>${escapeHtml(vehicle?.label ?? "--")}</strong>
                  </div>
                  <div class="mission-detail-item">
                    <span>Vị trí</span>
                    <strong>${escapeHtml(USER_LOCATION_SHORT)}</strong>
                  </div>
                </div>

                <div class="sheet-actions">
                  ${
                    isFixer
                      ? `
                        ${
                          pendingLikeMode
                            ? `<button class="primary-button" data-action="confirm-request">Xác nhận đơn</button>`
                            : `<button class="secondary-button" data-action="advance-order">Cập nhật bước tiếp theo</button>`
                        }
                        <button class="ghost-button" data-action="complete-order">Hoàn tất</button>
                        <button class="ghost-button" data-action="cancel-order">Hủy đơn</button>
                      `
                      : `
                        <button class="primary-button" data-action="set-screen" data-value="garage">Mở garage</button>
                        ${
                          pendingLikeMode || state.orderMode === "cancelled"
                            ? `<button class="secondary-button" data-action="set-screen" data-value="services">Xem dịch vụ</button>`
                            : `<button class="secondary-button" data-action="cancel-order">Hủy đơn</button>`
                        }
                      `
                  }
                </div>
              </div>

              ${
                !pendingLikeMode && state.orderMode !== "cancelled"
                  ? `
                    <div class="compact-map-shell">
                      <div class="order-map-layer order-map-layer--inline">
                        <div class="map-canvas" data-map="order" aria-label="Live order map"></div>
                        <div class="map-blur-fade" aria-hidden="true"></div>
                      </div>
                    </div>
                  `
                  : ""
              }

              ${
                pendingLikeMode
                  ? `
                    <div class="form-card request-note-card">
                      <strong>${isFixer ? "Khách đang chờ bạn xác nhận" : "Bản đồ sẽ mở ngay khi fixer nhận ca"}</strong>
                      <span>${
                        isFixer
                          ? `${escapeHtml(liveRequest.requesterName)} đang đợi bạn phản hồi để bắt đầu hành trình cứu hộ.`
                          : "Trong lúc này, ResQ vẫn giữ vị trí của bạn và ưu tiên garage gần nhất đang trực."
                      }</span>
                    </div>
                  `
                  : `
                    <div class="request-progress-card">
                      <div class="request-progress-head">
                        <div>
                          <p>Lộ trình xử lý</p>
                          <strong>${escapeHtml(currentStage?.label ?? liveRequest.status ?? "Đang xử lý")}</strong>
                          <span>${escapeHtml(nextStage?.label ?? "Tiếp tục theo dõi")}</span>
                        </div>
                        <span class="request-pill ${getRequestToneClass(liveRequest.status)}">${escapeHtml(liveRequest.status)}</span>
                      </div>
                      <div class="timeline-list">
                        ${orderStages
                          .map((item, index) => {
                            const stageClass =
                              index < state.orderStage
                                ? "is-complete"
                                : index === state.orderStage
                                  ? "is-current"
                                  : "is-future";

                            return `
                              <div class="timeline-row ${stageClass}">
                                <div class="timeline-dot"></div>
                                <strong>${item.label}</strong>
                                <em>${index <= state.orderStage ? getOrderTimelineTime(item.id, liveRequest, statusEvents) : "--:--"}</em>
                              </div>
                            `;
                          })
                          .join("")}
                      </div>
                    </div>
                  `
              }

              ${state.orderMode !== "cancelled" ? renderStatusFeedCard(liveRequest) : ""}
              ${state.orderMode !== "cancelled" ? renderChatCard(liveRequest) : ""}
            `
            : ""
        }
      </div>
    </section>
  `;
}

function renderProfileScreen() {
  if (!authState.user && !IS_FIXER_APP) {
    return renderGuestProfileScreen();
  }

  const userName = authState.user?.name ?? "Hùng";
  const firstName = userName.split(" ").at(-1) ?? userName;

  return `
    <section class="screen">
      <div class="screen-scroll screen-scroll--figma-page">
        <div class="profile-shell profile-shell--figma">
          <div class="profile-icon profile-icon--figma">${icon("user-outline")}</div>
          <h1>${escapeHtml(firstName)}</h1>
          <p>${escapeHtml(authState.user.phone || "Chưa cập nhật số điện thoại")}</p>

          <div class="profile-menu profile-menu--figma">
            ${profileMenu
              .map(
                (item) => `
                  <button
                    class="profile-menu-item profile-menu-item--figma ${state.profileHighlight === item.id ? "is-highlight" : ""} ${item.danger ? "is-danger" : ""}"
                    data-action="open-profile-sheet"
                    data-value="${item.id}"
                  >
                    <span class="menu-icon">${icon(item.icon)}</span>
                    <strong>${item.label}</strong>
                    <span class="menu-chevron">${item.danger ? "" : icon("chevron-right")}</span>
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderGuestProfileScreen() {
  return `
    <section class="screen">
      <div class="screen-scroll screen-scroll--figma-page">
        <div class="profile-shell profile-shell--figma">
          <div class="profile-icon profile-icon--figma">${icon("user-outline")}</div>
          <h1>Khách ResQ</h1>
          <p>Tiếp tục xem dịch vụ ngay, đăng nhập sau khi bạn muốn đồng bộ đơn hàng.</p>

          <div class="auth-cta-group">
            <button class="primary-button" data-action="open-auth" data-value="login">Đăng nhập</button>
            <button class="secondary-button" data-action="open-auth" data-value="register">Tạo tài khoản</button>
          </div>

          <div class="profile-menu profile-menu--figma guest-profile-menu">
            <button
              class="profile-menu-item profile-menu-item--figma ${state.profileHighlight === "vehicles" ? "is-highlight" : ""}"
              data-action="open-auth"
              data-value="login"
            >
              <span class="menu-icon">${icon("car-outline")}</span>
              <strong>Đồng bộ xe của tôi</strong>
              <span class="menu-chevron">${icon("chevron-right")}</span>
            </button>
            <button
              class="profile-menu-item profile-menu-item--figma ${state.profileHighlight === "notifications" ? "is-highlight" : ""}"
              data-action="open-auth"
              data-value="login"
            >
              <span class="menu-icon">${icon("bell")}</span>
              <strong>Lưu lịch sử cứu hộ</strong>
              <span class="menu-chevron">${icon("chevron-right")}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderOverlay() {
  if (!authState.ready || requiresFixerAuth()) {
    return "";
  }

  if (state.callingActive) {
    return renderCallingOverlay();
  }

  if (state.emergencySheet) {
    return renderEmergencySheet();
  }

  if (state.selectedServiceId) {
    return renderServiceSheet();
  }

  if (state.garageDetailSheet) {
    return renderGarageDetailSheet();
  }

  if (state.authSheet) {
    return renderAuthSheet();
  }

  if (state.vehicleSheet) {
    return renderVehicleSheet();
  }

  if (state.profileSheet) {
    return renderProfileOverlay();
  }

  return "";
}

function renderEmergencySheet() {
  if (state.emergencySheet === "garage") {
    return renderEmergencyGarageSheet();
  }

  return renderEmergencyVehicleSheet();
}

function renderCallingOverlay() {
  return `
    <section class="calling-overlay" aria-label="Calling rescue">
      <div class="calling-brand">${brandLockupSvg("light")}</div>
      <div class="calling-stage">
        <span class="calling-ring calling-ring--3" aria-hidden="true"></span>
        <span class="calling-ring calling-ring--2" aria-hidden="true"></span>
        <span class="calling-ring calling-ring--1" aria-hidden="true"></span>
        <span class="calling-core" aria-hidden="true">${icon("siren-car")}</span>
      </div>
      <p class="calling-status">
        <span>Calling</span><em>.</em><em>.</em><em>.</em>
      </p>
    </section>
  `;
}

function renderEmergencyVehicleSheet() {
  const form = state.rescueForm ?? { name: "", plate: "", year: "" };
  const isCar = state.emergencyVehicleType === "car";
  const placeholderName = isCar ? "Mazda CX-5" : "Honda Wave RSX";
  const placeholderPlate = isCar ? "51K-123.45" : "59F1-12345";

  return `
    <div class="backdrop" data-action="close-sos"></div>
    <section class="emergency-sheet emergency-sheet--vehicle">
      <div class="emergency-sheet-panel emergency-sheet-panel--form">
        <div class="emergency-sheet-top emergency-sheet-top--accent">
          <button class="emergency-close" aria-label="Close emergency flow" data-action="close-sos">
            ${icon("close")}
          </button>
          <div class="emergency-title-lock">${icon("shield")} Hỗ trợ khẩn cấp</div>
          <h2>Bạn đang đi loại xe nào?</h2>
        </div>

        <div class="emergency-sheet-body emergency-sheet-body--spacious">
          <div class="emergency-vehicle-grid">
            <button
              type="button"
              class="emergency-vehicle-card ${state.emergencyVehicleType === "car" ? "is-active" : ""}"
              data-action="select-sos-vehicle-only"
              data-value="car"
            >
              <div class="emergency-vehicle-icon">${icon("car")}</div>
              <strong>Ô tô</strong>
              <span>Sedan / SUV / Bán tải</span>
            </button>

            <button
              type="button"
              class="emergency-vehicle-card ${state.emergencyVehicleType === "motorbike" ? "is-active" : ""}"
              data-action="select-sos-vehicle-only"
              data-value="motorbike"
            >
              <div class="emergency-vehicle-icon">${icon("bike")}</div>
              <strong>Xe máy</strong>
              <span>Scooter / Côn tay</span>
            </button>
          </div>

          <p class="rescue-form-caption">Hãy nhập thông tin xe của bạn</p>

          <label class="rescue-input-row">
            <span class="rescue-input-icon">${icon(isCar ? "car-outline" : "bike")}</span>
            <input
              class="rescue-input"
              type="text"
              data-action="set-rescue-field"
              data-field="name"
              placeholder="${placeholderName}"
              value="${escapeHtml(form.name ?? "")}"
              aria-label="Tên xe"
            />
          </label>

          <div class="rescue-input-grid">
            <label class="rescue-input-cell">
              <em>Biển số xe</em>
              <input
                class="rescue-input rescue-input--bare"
                type="text"
                data-action="set-rescue-field"
                data-field="plate"
                placeholder="${placeholderPlate}"
                value="${escapeHtml(form.plate ?? "")}"
                aria-label="Biển số xe"
              />
            </label>
            <label class="rescue-input-cell">
              <em>Năm sản xuất</em>
              <input
                class="rescue-input rescue-input--bare"
                type="text"
                inputmode="numeric"
                data-action="set-rescue-field"
                data-field="year"
                placeholder="v.d. 2022"
                value="${escapeHtml(form.year ?? "")}"
                aria-label="Năm sản xuất"
              />
            </label>
          </div>

          <p class="rescue-form-help">Hãy nhập thông tin xe để các fixer và các bên cứu hộ có thể hỗ trợ chính xác nhất</p>

          <div class="rescue-form-actions">
            <button class="primary-button rescue-call-button" data-action="submit-rescue-call">
              Gọi cứu hộ ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderEmergencyGarageSheet() {
  const vehicleLabel = state.emergencyVehicleType === "car" ? "Ô tô" : "Xe máy";
  const emergencyGarages = getEmergencyGarages(state.emergencyVehicleType);
  const selectedGarage =
    emergencyGarages.find((garage) => garage.id === state.selectedGarageId)
    ?? emergencyGarages[0]
    ?? null;
  const emergencyGarageIconName = state.emergencyVehicleType === "car" ? "car" : "bike";

  return `
    <div class="backdrop" data-action="close-sos"></div>
    <section class="emergency-sheet emergency-sheet--garage">
      <div class="emergency-sheet-panel">
        <div class="emergency-sheet-top emergency-sheet-top--accent emergency-sheet-top--garage">
          <button class="emergency-close" aria-label="Back to vehicle choice" data-action="open-sos">
            ${icon("close")}
          </button>
          <div class="emergency-title-lock">${icon("shield")} Hỗ trợ khẩn cấp</div>
          <h2>Garage gần bạn nhất</h2>
        </div>

        <div class="emergency-rescue-card emergency-rescue-card--hero">
          <div class="emergency-rescue-icon">${icon("van")}</div>
          <div class="emergency-rescue-copy">
            <div>
              <p>Xe cứu hộ gần bạn</p>
              <strong>Cứu Hộ 24/7 Sài Gòn</strong>
              <span>${USER_LOCATION_SHORT} · ~ 8 phút</span>
            </div>
          </div>
          <a class="emergency-rescue-call" href="tel:${RESQ_HOTLINE_TEL}">
            ${icon("phone")} ${RESQ_HOTLINE}
          </a>
        </div>

        <div class="emergency-sheet-body emergency-sheet-body--garage">

          <div class="emergency-context-line">${icon("pin")} ${vehicleLabel} · ${USER_LOCATION_SHORT}</div>

          <div class="emergency-garage-list">
            ${emergencyGarages
              .map(
                (garage) => `
                  <article class="emergency-garage-card ${garage.id === selectedGarage?.id ? "is-selected" : ""}">
                    <button
                      class="emergency-garage-main"
                      data-action="set-emergency-garage"
                      data-value="${garage.id}"
                    >
                      <div class="emergency-garage-icon">${icon(emergencyGarageIconName)}</div>
                      <div class="emergency-garage-copy">
                        <div class="emergency-garage-heading">
                          <strong>${escapeHtml(garage.name)}</strong>
                          <span class="emergency-garage-state ${garage.isOpen ? "is-open" : "is-closed"}">
                            ${garage.wait}
                          </span>
                        </div>
                        <p>${escapeHtml(garage.address)}</p>
                        <div class="emergency-garage-meta">
                          <span>${icon("pin")} ${garage.distance}</span>
                          <span>${icon("star")} ${garage.rating}</span>
                          <span class="emergency-garage-phone">${garage.phone}</span>
                        </div>
                      </div>
                    </button>
                    <a class="emergency-garage-call ${garage.isOpen ? "" : "is-disabled"}" href="tel:${garage.phone.replace(/\D/g, "")}">
                      ${icon("phone")}
                    </a>
                  </article>
                `,
              )
              .join("")}
          </div>

          ${
            selectedGarage
              ? `
                <div class="sheet-actions emergency-dispatch-actions">
                  <button class="primary-button" data-action="dispatch-emergency" data-value="${selectedGarage.id}">
                    Điều phối fixer
                  </button>
                  <button class="secondary-button" data-action="set-screen" data-value="garage">
                    Xem bản đồ garage
                  </button>
                </div>
              `
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function renderServiceSheet() {
  const service = getService(state.selectedServiceId);
  const vehicleChoices = getVehiclesForService(service);
  const selectedVehicle = getSelectedVehicle();
  const serviceVehicle = vehicleChoices.find((vehicle) => vehicle.id === state.requestVehicle) ?? selectedVehicle;

  return `
    <div class="backdrop" data-action="close-service"></div>
    <section class="service-sheet">
      <div class="sheet-grabber"></div>
      <div class="sheet-header">
        <div>
          <p class="eyebrow">Request service</p>
          <h2>${service.title}</h2>
        </div>
        <button class="sheet-close" aria-label="Close sheet" data-action="close-service">${icon("close")}</button>
      </div>

      <div class="sheet-hero">
        <div class="sheet-icon">${icon(service.icon)}</div>
        <div class="sheet-copy">
          <h3>${service.price} · ${service.eta}</h3>
          <p>${service.description}</p>
        </div>
      </div>

      <div class="form-card" style="margin-bottom:16px;">
        <strong>Luồng yêu cầu</strong>
        <span>Chọn xe, xác nhận vị trí, rồi chuyển sang trạng thái chờ fixer xác nhận ngay trong app.</span>
      </div>

      <div class="sheet-section">
        <h4>Phương tiện</h4>
        ${
          vehicleChoices.length > 0
            ? `
              <div class="filter-row">
                ${vehicleChoices
                  .map(
                    (choice) => `
                      <button
                        class="vehicle-pill ${state.requestVehicle === choice.id ? "is-active" : ""}"
                        data-action="set-vehicle"
                        data-value="${choice.id}"
                      >
                        ${escapeHtml(choice.label)}
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="form-card">
                <strong>Chưa có xe phù hợp</strong>
                <span>Thêm xe trong hồ sơ để tiếp tục gửi request cho dịch vụ này.</span>
                <div class="sheet-actions">
                  ${
                    service.types.includes("motorbike")
                      ? `<button class="secondary-button" data-action="open-vehicle-form" data-value="motorbike">Thêm xe máy</button>`
                      : ""
                  }
                  ${
                    service.types.includes("car")
                      ? `<button class="secondary-button" data-action="open-vehicle-form" data-value="car">Thêm ô tô</button>`
                      : ""
                  }
                </div>
              </div>
            `
        }
      </div>

      <div class="sheet-section">
        <h4>Mức độ ưu tiên</h4>
        <div class="filter-row">
          <button
            class="vehicle-pill ${state.requestPriority === "standard" ? "is-active" : ""}"
            data-action="set-priority"
            data-value="standard"
          >
            Chuẩn
          </button>
          <button
            class="vehicle-pill ${state.requestPriority === "priority" ? "is-active" : ""}"
            data-action="set-priority"
            data-value="priority"
          >
            Khẩn cấp
          </button>
        </div>
      </div>

      <div class="sheet-section">
        <h4>Thông tin điều phối</h4>
        <div class="form-card">
          ${
            serviceVehicle
              ? `
                <strong>${escapeHtml(serviceVehicle.label)}</strong>
                <span>${escapeHtml(serviceVehicle.plate)} · Ước tính fixer tiếp cận trong ${service.eta}</span>
              `
              : `
                <strong>Chưa có phương tiện đồng bộ</strong>
                <span>Thêm xe trong hồ sơ, dữ liệu đó sẽ được dùng chung cho cả website và app.</span>
              `
          }
        </div>
      </div>

      <div class="sheet-actions">
        <button class="primary-button" data-action="create-request" ${vehicleChoices.length === 0 ? "disabled" : ""}>Tạo yêu cầu</button>
        <button class="secondary-button" data-action="close-service">Để sau</button>
      </div>
    </section>
  `;
}

function renderAuthSheet() {
  const isRegister = state.authSheet === "register";

  return `
    <div class="backdrop" data-action="close-auth"></div>
    <section class="auth-sheet">
      <div class="sheet-grabber"></div>
      <div class="sheet-header">
        <div>
          <p class="eyebrow">${IS_FIXER_APP ? "Fixer auth" : "Supabase auth"}</p>
          <h2>${IS_FIXER_APP ? (isRegister ? "Tạo tài khoản fixer" : "Fixer đăng nhập") : (isRegister ? "Tạo tài khoản ResQ" : "Đăng nhập ResQ")}</h2>
        </div>
        <button class="sheet-close" aria-label="Close auth sheet" data-action="close-auth">${icon("close")}</button>
      </div>
      ${renderAuthPanelContent(isRegister)}
    </section>
  `;
}

function renderAuthPanelContent(isRegister) {
  const roleOptions = IS_FIXER_APP
    ? [["fixer", "Fixer", "Nhận điều phối và xử lý ca"]]
    : [["user", "Khách hàng", "Gọi cứu hộ và theo dõi ETA"]];

  return `
    <div class="auth-role-grid">
      ${roleOptions
        .map(
          ([role, title, detail]) => `
            <button
              class="auth-role-card ${state.authRole === role ? "is-active" : ""}"
              data-action="set-auth-role"
              data-value="${role}"
              type="button"
            >
              <strong>${title}</strong>
              <span>${detail}</span>
            </button>
          `,
        )
        .join("")}
    </div>

    <div class="auth-tab-row">
      <button
        class="pill-button ${!isRegister ? "is-active" : ""}"
        data-action="set-auth-sheet"
        data-value="login"
        type="button"
      >
        Đăng nhập
      </button>
      <button
        class="pill-button ${isRegister ? "is-active" : ""}"
        data-action="set-auth-sheet"
        data-value="register"
        type="button"
      >
        Đăng ký
      </button>
    </div>

    ${
      authUi.error
        ? `<p class="auth-feedback is-error">${escapeHtml(authUi.error)}</p>`
        : authUi.message
          ? `<p class="auth-feedback is-success">${escapeHtml(authUi.message)}</p>`
          : ""
    }

    ${
      isRegister
        ? `
          <form class="auth-form" data-auth-form="register">
            <label class="field-label">
              Họ và tên
              <input class="text-input" data-auth-field="regName" name="name" value="${escapeAttribute(authUi.fields.regName)}" placeholder="Nguyễn Văn A" />
            </label>
            <label class="field-label">
              Số điện thoại
              <input class="text-input" data-auth-field="regPhone" name="phone" value="${escapeAttribute(authUi.fields.regPhone)}" placeholder="0901 234 567" />
            </label>
            <label class="field-label">
              Email
              <input class="text-input" data-auth-field="regEmail" name="email" type="email" value="${escapeAttribute(authUi.fields.regEmail)}" placeholder="you@example.com" />
            </label>
            <label class="field-label">
              Mật khẩu
              <input class="text-input" data-auth-field="regPassword" name="password" type="password" value="${escapeAttribute(authUi.fields.regPassword)}" placeholder="Ít nhất 6 ký tự" />
            </label>
            <label class="field-label">
              Xác nhận mật khẩu
              <input class="text-input" data-auth-field="regConfirm" name="confirmPassword" type="password" value="${escapeAttribute(authUi.fields.regConfirm)}" placeholder="Nhập lại mật khẩu" />
            </label>
            <button class="primary-button auth-submit" type="submit" ${authUi.pending ? "disabled" : ""}>
              ${authUi.pending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>
        `
        : `
          <form class="auth-form" data-auth-form="login">
            <label class="field-label">
              Email
              <input class="text-input" data-auth-field="loginEmail" name="email" type="email" value="${escapeAttribute(authUi.fields.loginEmail)}" placeholder="you@example.com" />
            </label>
            <label class="field-label">
              Mật khẩu
              <input class="text-input" data-auth-field="loginPassword" name="password" type="password" value="${escapeAttribute(authUi.fields.loginPassword)}" placeholder="Nhập mật khẩu" />
            </label>
            <button class="primary-button auth-submit" type="submit" ${authUi.pending ? "disabled" : ""}>
              ${authUi.pending ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        `
    }

    <p class="auth-note">
      Cùng một project Supabase đang dùng cho web và app, nên bạn có thể giữ vai trò khách hàng hoặc fixer nhất quán giữa hai trải nghiệm.
    </p>
  `;
}

function renderProfileOverlay() {
  if (state.profileSheet === "logout") {
    return `
      <div class="backdrop" data-action="close-profile-sheet"></div>
      <div class="modal-card">
        <div class="modal-icon">${icon("logout")}</div>
        <h3>Đăng xuất khỏi ResQ?</h3>
        <p>
          Các trạng thái demo vẫn còn trong prototype, nhưng hồ sơ và điều phối hiện tại sẽ được đưa
          về trạng thái mặc định.
        </p>
        <div class="sheet-actions">
          <button class="primary-button" data-action="confirm-logout">Đăng xuất</button>
          <button class="secondary-button" data-action="close-profile-sheet">Ở lại</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="backdrop" data-action="close-profile-sheet"></div>
    <section class="profile-sheet">
      <div class="sheet-grabber"></div>
      <div class="sheet-header">
        <div>
          <p class="eyebrow">Profile state</p>
          <h2>${getProfileSheetTitle()}</h2>
        </div>
        <button class="sheet-close" aria-label="Close sheet" data-action="close-profile-sheet">${icon("close")}</button>
      </div>
      ${renderProfileSheetContent()}
    </section>
  `;
}

function renderVehicleSheet() {
  const category = state.vehicleSheet === "car" ? "car" : "motorbike";
  const kindLabel = category === "car" ? "Ô tô" : "Xe máy";

  return `
    <div class="backdrop" data-action="close-vehicle-form"></div>
    <section class="profile-sheet">
      <div class="sheet-grabber"></div>
      <div class="sheet-header">
        <div>
          <p class="eyebrow">Vehicle state</p>
          <h2>Thêm phương tiện</h2>
        </div>
        <button class="sheet-close" aria-label="Close vehicle sheet" data-action="close-vehicle-form">${icon("close")}</button>
      </div>

      <form class="auth-form" data-vehicle-form="save">
        <label class="field-label">
          Loại xe
          <input class="text-input" name="kindLabel" value="${kindLabel}" disabled />
        </label>
        <input type="hidden" name="category" value="${category}" />
        <label class="field-label">
          Tên xe
          <input class="text-input" name="label" placeholder="${category === "car" ? "Mazda CX-5" : "Honda Vision"}" />
        </label>
        <label class="field-label">
          Biển số
          <input class="text-input" name="plate" placeholder="${category === "car" ? "51K-19876" : "59F1-12345"}" />
        </label>
        <label class="field-label">
          Năm
          <input class="text-input" name="year" inputmode="numeric" placeholder="2024" />
        </label>
        <button class="primary-button auth-submit" type="submit">Lưu xe</button>
      </form>
    </section>
  `;
}

function renderProfileSheetContent() {
  const currentUser = authState.user;

  switch (state.profileSheet) {
    case "personal":
      return `
        <div class="sheet-section">
          <div class="profile-stats">
            ${renderProfileStat("Yêu cầu", state.liveRequest ? "01" : "00")}
            ${renderProfileStat("Xe lưu", String(state.savedVehicles.length))}
            ${renderProfileStat("Hài lòng", "98%")}
          </div>
        </div>
        <div class="sheet-section">
          <div class="form-card">
            <strong>${escapeHtml(currentUser?.name ?? "Người dùng ResQ")}</strong>
            <span>${escapeHtml(currentUser?.phone || "Chưa cập nhật")} · ${escapeHtml(currentUser?.email || "Chưa cập nhật")}</span>
          </div>
          <div class="form-card" style="margin-top:10px;">
            <strong>Vai trò hiện tại</strong>
            <span>${escapeHtml(getRoleLabel(currentUser?.role ?? "user"))}</span>
          </div>
          <p class="form-note" style="margin-top:12px;">
            Giữ thông tin cá nhân ngắn gọn và dễ quét để thao tác nhanh trong ngữ cảnh khẩn cấp.
          </p>
        </div>
      `;
    case "vehicles":
      return `
        <div class="sheet-section">
          <div class="vehicle-list">
            ${state.savedVehicles
              .map(
                (vehicle, index) => `
                  <div class="vehicle-item">
                    <div class="vehicle-item-head">
                      <div>
                        <strong>${escapeHtml(vehicle.label)}</strong>
                        <span>${escapeHtml(vehicle.plate)} · ${escapeHtml(vehicle.kind)} · ${escapeHtml(vehicle.year)}</span>
                      </div>
                      ${vehicle.isDefault || index === 0 ? '<span class="default-chip">Mặc định</span>' : ""}
                    </div>
                  </div>
                `,
              )
              .join("")}
            <div class="vehicle-item">
              <div class="vehicle-item-head">
                <div>
                  <strong>Thêm phương tiện mới</strong>
                  <span>Lưu xe để rút ngắn thời gian khi tạo yêu cầu lần sau.</span>
                </div>
                <div class="inline-actions">
                  <button class="mini-button" data-action="open-vehicle-form" data-value="motorbike">+ Xe máy</button>
                  <button class="mini-button" data-action="open-vehicle-form" data-value="car">+ Ô tô</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    case "notifications":
      return `
        <div class="sheet-section">
          <div class="settings-list">
            ${renderToggleCard("toggle-notification", "request", "Xác nhận yêu cầu", state.notifications.request)}
            ${renderToggleCard("toggle-notification", "eta", "ETA và cập nhật fixer", state.notifications.eta)}
            ${renderToggleCard("toggle-notification", "marketing", "Ưu đãi bảo dưỡng định kỳ", state.notifications.marketing)}
          </div>
        </div>
      `;
    case "security":
      return `
        <div class="sheet-section">
          <div class="security-list">
            ${renderToggleCard("toggle-security", "biometric", "Sinh trắc học khi mở app", state.security.biometric)}
            ${renderToggleCard("toggle-security", "pin", "Mã PIN cho thanh toán", state.security.pin)}
            ${renderToggleCard("toggle-security", "trustedDevice", "Tin cậy thiết bị hiện tại", state.security.trustedDevice)}
          </div>
          <div class="form-card" style="margin-top:12px;">
            <strong>Lần đăng nhập gần nhất</strong>
            <span>11/04/2026 · iPhone 15 Pro · TP. Hồ Chí Minh</span>
          </div>
        </div>
      `;
    default:
      return "";
  }
}

function renderProfileStat(label, value) {
  return `
    <div class="profile-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderToggleCard(action, key, label, checked) {
  return `
    <label class="settings-item">
      <div>
        <strong>${label}</strong>
      </div>
      <input
        class="hidden"
        type="checkbox"
        data-action="${action}"
        data-value="${key}"
        ${checked ? "checked" : ""}
      />
      <span class="switch ${checked ? "is-on" : ""}" aria-hidden="true"></span>
    </label>
  `;
}

function renderNav() {
  if (!authState.ready || requiresFixerAuth()) {
    return "";
  }

  const navItems = getNavItems();

  if (authState.user?.role === "fixer") {
    return `
      <nav class="bottom-nav bottom-nav--fixer" aria-label="Main navigation" style="grid-template-columns: repeat(${navItems.length}, minmax(0, 1fr));">
        ${navItems
          .map(
            (item) => `
              <button
                class="nav-button ${state.screen === item.id ? "is-active" : ""}"
                data-action="set-screen"
                data-value="${item.id}"
                aria-current="${state.screen === item.id ? "page" : "false"}"
              >
                ${icon(item.icon)}
                <span>${item.label}</span>
              </button>
            `,
          )
          .join("")}
      </nav>
    `;
  }

  return `
    <nav class="bottom-nav bottom-nav--figma" aria-label="Main navigation">
      <div class="bottom-nav-rail">
        ${navItems
          .map((item, index) => {
            const spacer = index === 2 ? '<div class="nav-spacer" aria-hidden="true"></div>' : "";
            return `
              ${spacer}
              <button
                class="nav-button nav-button--figma ${state.screen === item.id ? "is-active" : ""}"
                data-action="set-screen"
                data-value="${item.id}"
                aria-label="${item.label}"
                aria-current="${state.screen === item.id ? "page" : "false"}"
              >
                ${icon(item.icon)}
                <span>${item.id === "services" ? "SERVICES" : item.id === "garage" ? "NEARBY" : item.id === "order" ? "ORDER" : "PROFILE"}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      <button
        class="sos-button ${state.screen === "sos" ? "is-active" : ""}"
        data-action="open-sos-landing"
        aria-label="Open emergency dispatch"
      >
        ${icon("siren-car")}
        <span>SOS</span>
      </button>
    </nav>
  `;
}

function renderControls() {
  const navItems = getNavItems();

  return `
    <section class="panel-card control-group">
      <p class="eyebrow">Scenarios</p>
      <h3>State presets</h3>
      <p>Jump into the most useful mobile journeys instead of clicking through from scratch.</p>
      <div class="button-grid two">
        ${renderPresetButton("browse", "Browse services", "Service list with car filter active")}
        ${renderPresetButton("garage", "Nearby garages", "Map-first discovery with selected hub")}
        ${renderPresetButton("active", "Fixer en route", "Live order state based on the Figma frame")}
        ${renderPresetButton("complete", "Repair completed", "Closed-loop success state and recap")}
      </div>
    </section>

    <section class="panel-card control-group">
      <p class="eyebrow">Navigation</p>
      <h3>Primary screens</h3>
      <div class="button-grid two">
        ${navItems
          .map(
            (item) => `
              <button class="control-button ${state.screen === item.id ? "is-active" : ""}" data-action="set-screen" data-value="${item.id}">
                <strong>${item.label}</strong>
                <span>${getScreenDescription(item.id)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="panel-card control-group">
      <p class="eyebrow">Service states</p>
      <h3>Filter and request</h3>
      <div class="button-grid three">
        ${renderFilterControl("all", "All")}
        ${renderFilterControl("motorbike", "Motorbike")}
        ${renderFilterControl("car", "Car")}
      </div>
      <div class="utility-row">
        <button class="utility-button" data-action="open-service" data-value="tire">Open tire sheet</button>
        <button class="utility-button" data-action="open-service" data-value="battery">Open battery sheet</button>
      </div>
    </section>

    <section class="panel-card control-group">
      <p class="eyebrow">Order states</p>
      <h3>Lifecycle</h3>
      <div class="button-grid two">
        ${renderOrderModeButton("idle", "Idle", "No active rescue request")}
        ${renderOrderModeButton("pending-confirmation", "Pending", "Waiting for fixer confirmation")}
        ${renderOrderModeButton("active", "Active", "Fixer is being coordinated")}
        ${renderOrderModeButton("completed", "Completed", "Repair and payment wrapped")}
        ${renderOrderModeButton("cancelled", "Cancelled", "Abort and recover flow")}
      </div>
      <div class="button-grid three" style="margin-top:12px;">
        ${orderStages
          .slice(0, 6)
          .map(
            (stage, index) => `
              <button
                class="control-button ${state.orderMode === "active" && state.orderStage === index ? "is-active" : ""}"
                data-action="set-order-stage"
                data-value="${index}"
              >
                <strong>${index + 1}. ${stage.label}</strong>
                <span>${stage.time}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="panel-card control-group">
      <p class="eyebrow">Profile states</p>
      <h3>Account layers</h3>
      <div class="toggle-grid">
        ${profileMenu
          .map(
            (item) => `
              <button
                class="control-button ${state.profileHighlight === item.id ? "is-active" : ""}"
                data-action="open-profile-sheet"
                data-value="${item.id}"
              >
                <strong>${item.label}</strong>
                <span>${getProfileDescription(item.id)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="panel-card control-group">
      <p class="eyebrow">Notes</p>
      <h3>Implementation highlights</h3>
      <div class="note-list">
        <div class="note-item">Built as plain <code>HTML/CSS/JS</code> so it runs directly in Live Server without Vite or npm.</div>
        <div class="note-item">The four Figma views stay recognizable, while the extra sheets, toggles, and empty/success modes make the prototype usable end-to-end.</div>
        <div class="note-item">State is saved in <code>localStorage</code>, so your last scenario stays open while iterating locally.</div>
      </div>
    </section>
  `;
}

function renderPresetButton(id, title, description) {
  const active = isPresetActive(id);
  return `
    <button class="preset-card ${active ? "is-active" : ""}" data-action="preset" data-value="${id}">
      <strong>${title}</strong>
      <span>${description}</span>
    </button>
  `;
}

function renderFilterButton(id, label) {
  return `
    <button class="pill-button ${state.serviceFilter === id ? "is-active" : ""}" data-action="set-filter" data-value="${id}">
      ${label}
    </button>
  `;
}

function renderFilterControl(id, label) {
  return `
    <button class="control-button ${state.serviceFilter === id ? "is-active" : ""}" data-action="set-filter" data-value="${id}">
      <strong>${label}</strong>
      <span>Update visible service catalogue</span>
    </button>
  `;
}

function renderOrderModeButton(id, title, description) {
  return `
    <button class="control-button ${state.orderMode === id ? "is-active" : ""}" data-action="set-order-mode" data-value="${id}">
      <strong>${title}</strong>
      <span>${description}</span>
    </button>
  `;
}

function getEmergencyGarages(vehicleType) {
  return garages.filter((garage) =>
    Array.isArray(garage.supports) ? garage.supports.includes(vehicleType) : true,
  );
}

function getEmergencyServiceId(vehicleType) {
  return emergencyServiceByVehicle[vehicleType] ?? "tire";
}

function getEmergencyVehicleId(vehicleType) {
  const service = getService(getEmergencyServiceId(vehicleType));
  return getDefaultVehicleForService(service);
}

function formatRequestCode(requestId) {
  const digits = String(requestId ?? "")
    .replace(/\D/g, "")
    .slice(-4);

  return `#ESQ-${digits || "1042"}`;
}

function formatRequestDateLabel(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return `Hôm nay, ${date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString("vi-VN");
}

function getRequestToneClass(status) {
  if (status === "Hoàn thành") {
    return "is-done";
  }

  if (status === "Đã hủy") {
    return "is-cancelled";
  }

  if (status === "Chờ fixer xác nhận") {
    return "is-pending";
  }

  return "is-live";
}

function getRequestStatusCopy(request, mode) {
  if (mode === "completed") {
    return "Hoàn thành";
  }

  if (mode === "cancelled") {
    return "Đã hủy";
  }

  if (mode === "pending") {
    return "Fixer đang xác nhận";
  }

  if (request.status === "Đang tiếp cận") {
    return "Kỹ thuật viên đang đến";
  }

  if (request.status === "Đang hỗ trợ") {
    return "Fixer đang hỗ trợ";
  }

  return request.status;
}

function getRequestPillLabel(mode) {
  if (mode === "completed") {
    return "Xong";
  }

  if (mode === "cancelled") {
    return "Đã hủy";
  }

  return "Đang xử lý";
}

function renderRequestCard(request, mode = "active") {
  const statusValue =
    mode === "completed"
      ? "Hoàn thành"
      : mode === "cancelled"
        ? "Đã hủy"
        : request.status;
  const toneClass = getRequestToneClass(statusValue);
  const statusLineClass =
    toneClass === "is-done"
      ? "request-list-line--done"
      : toneClass === "is-cancelled"
        ? "request-list-line--cancelled"
        : "request-list-line--accent";

  return `
    <article class="request-list-card ${toneClass}">
      <div class="request-list-head">
        <span class="request-code">${formatRequestCode(request.id)}</span>
        <span class="request-pill ${toneClass}">${escapeHtml(getRequestPillLabel(mode))}</span>
      </div>
      <h3>${escapeHtml(request.serviceTitle)}</h3>
      <div class="request-list-line">
        ${icon("clock")}
        <span>${formatRequestDateLabel(request.createdAt)}</span>
      </div>
      <div class="request-list-line ${statusLineClass}">
        ${toneClass === "is-done" ? icon("check") : toneClass === "is-cancelled" ? icon("close") : icon("pin")}
        <span>${escapeHtml(getRequestStatusCopy(request, mode))}</span>
      </div>
    </article>
  `;
}

function renderRequestListSection(requests, mode, emptyTitle, emptyCopy) {
  if (!requests.length) {
    return `
      <div class="order-empty order-empty--figma">
        <div class="empty-badge">${mode === "completed" ? "History" : "Live"}</div>
        <h2>${emptyTitle}</h2>
        <p>${emptyCopy}</p>
        <div class="sheet-actions">
          <button class="primary-button" data-action="set-screen" data-value="services">
            ${authState.user?.role === "fixer" ? "Mở đơn hàng" : "Mở dịch vụ"}
          </button>
          ${
            authState.user?.role === "fixer"
              ? ""
              : `<button class="secondary-button" data-action="set-screen" data-value="garage">Xem garage</button>`
          }
        </div>
      </div>
    `;
  }

  return `
    <div class="request-card-list">
      ${requests.map((request) => renderRequestCard(request, mode)).join("")}
    </div>
  `;
}

function getScreenDescription(screen) {
  const descriptions = {
    services:
      authState.user?.role === "fixer"
        ? "Review incoming orders and confirm assignments"
        : "Browse roadside fixes and create a request",
    garage: "Map-first garage discovery and dispatch",
    order:
      authState.user?.role === "fixer"
        ? "Process tracking, status updates and customer chat"
        : "Live fixer tracking, chat and status timeline",
    profile: "Settings, notifications, security and logout",
  };

  return descriptions[screen];
}

function getNavItems() {
  return IS_FIXER_APP || authState.user?.role === "fixer" ? fixerNavItems : userNavItems;
}

function getProfileDescription(id) {
  const descriptions = {
    personal: "Compact identity summary and priority zone",
    vehicles: "Saved vehicles and default selection",
    notifications: "Delivery preferences and ETA nudges",
    security: "Biometric, PIN and device trust",
    logout: "Confirmation modal with graceful reset",
  };

  return descriptions[id];
}

function getProfileSheetTitle() {
  const titles = {
    personal: "Thông tin cá nhân",
    vehicles: "Xe của tôi",
    notifications: "Thông báo",
    security: "Bảo mật",
  };

  return titles[state.profileSheet] ?? "Hồ sơ";
}

function getService(id) {
  return services.find((service) => service.id === id) ?? services[0];
}

function getCurrentService() {
  return getService(state.activeServiceId ?? state.selectedServiceId ?? "tire");
}

function createChatMessage({ requestId, senderRole, senderName, body }) {
  return {
    id: `chat-${Math.random().toString(36).slice(2, 10)}`,
    requestId,
    senderRole,
    senderName,
    body,
    createdAt: new Date().toISOString(),
  };
}

function appendChatMessageList(messages, nextMessage) {
  const currentMessages = Array.isArray(messages) ? messages : [];
  return [...currentMessages, nextMessage];
}

function createInitialRequestChat(request) {
  return [
    createChatMessage({
      requestId: request.id,
      senderRole: "system",
      senderName: "ResQ",
      body: "Yêu cầu đã được ghi nhận. Khi fixer xác nhận đơn, cuộc trò chuyện sẽ mở ngay tại đây.",
    }),
  ];
}

function getCurrentRequestChat() {
  const requestId = state.liveRequest?.id;
  if (!requestId) {
    return [];
  }

  return Array.isArray(state.requestChats?.[requestId]) ? state.requestChats[requestId] : [];
}

function getCurrentRequestStatusEvents() {
  const requestId = state.liveRequest?.id;
  if (!requestId) {
    return [];
  }

  return Array.isArray(state.requestStatusEvents?.[requestId])
    ? state.requestStatusEvents[requestId]
    : [];
}

function formatCompactTime(value) {
  if (!value) {
    return "--:--";
  }

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findStatusEventTime(statusEvents, status) {
  const match = statusEvents.find((event) => event.status === status);
  return match?.createdAt ?? null;
}

function getOrderTimelineTime(stageId, liveRequest, statusEvents) {
  switch (stageId) {
    case "sent":
      return formatCompactTime(liveRequest?.createdAt ?? statusEvents[0]?.createdAt ?? null);
    case "processing":
      return formatCompactTime(findStatusEventTime(statusEvents, "Chờ fixer xác nhận") ?? liveRequest?.createdAt);
    case "accepted":
      return formatCompactTime(findStatusEventTime(statusEvents, "Fixer đã xác nhận"));
    case "traveling":
      return formatCompactTime(findStatusEventTime(statusEvents, "Đang tiếp cận"));
    case "arrived":
    case "repairing":
      return formatCompactTime(findStatusEventTime(statusEvents, "Đang hỗ trợ"));
    case "completed":
      return formatCompactTime(findStatusEventTime(statusEvents, "Hoàn thành"));
    default:
      return "--:--";
  }
}

function renderStatusFeedCard(liveRequest) {
  if (!liveRequest) {
    return "";
  }

  const statusEvents = getCurrentRequestStatusEvents();
  const eventsToRender = statusEvents.length > 0
    ? [...statusEvents].reverse().slice(0, 4)
    : [];

  return `
    <div class="order-card">
      <p class="label">Cập nhật trực tiếp từ Supabase</p>
      <div class="timeline-list">
        ${
          eventsToRender.length > 0
            ? eventsToRender
                .map(
                  (event) => `
                    <div class="timeline-row is-complete">
                      <div class="timeline-dot"></div>
                      <div>
                        <strong>${escapeHtml(event.status)}</strong>
                        <em style="display:block;margin-top:4px;">${escapeHtml(
                          event.detail || "ResQ đã ghi nhận cập nhật mới cho yêu cầu này.",
                        )}</em>
                      </div>
                      <em>${formatCompactTime(event.createdAt)}</em>
                    </div>
                  `,
                )
                .join("")
            : `
              <div class="chat-message is-system">
                <p>Dòng thời gian sẽ xuất hiện ngay khi yêu cầu tạo mới hoặc fixer chuyển trạng thái.</p>
              </div>
            `
        }
      </div>
    </div>
  `;
}

function renderChatCard(liveRequest) {
  if (!liveRequest) {
    return "";
  }

  const messages = getCurrentRequestChat();
  const canSendMessage = Boolean(authState.user);

  return `
    <div class="order-card chat-card">
      <p class="label">${authState.user?.role === "fixer" ? "Chat với khách hàng" : "Chat với fixer"}</p>
      <div class="chat-thread">
        ${
          messages.length > 0
            ? messages
                .map(
                  (message) => `
                    <div class="chat-message ${
                      message.senderRole === "system"
                        ? "is-system"
                        : message.senderRole === authState.user?.role
                          ? "is-self"
                          : "is-peer"
                    }">
                      <div class="chat-meta">
                        <strong>${
                          message.senderRole === "system"
                            ? "ResQ"
                            : message.senderRole === authState.user?.role
                              ? "Bạn"
                              : escapeHtml(message.senderName)
                        }</strong>
                        <span>${new Date(message.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                      </div>
                      <p>${escapeHtml(message.body)}</p>
                    </div>
                  `,
                )
                .join("")
            : `<div class="chat-message is-system"><p>Khung chat sẽ sáng lên khi có tin nhắn đầu tiên trong đơn này.</p></div>`
        }
      </div>
      <form class="chat-form" data-chat-form="send">
        <input
          type="text"
          name="message"
          class="text-input"
          ${canSendMessage ? "" : "disabled"}
          placeholder="${
            !canSendMessage
              ? "Đăng nhập để nhắn trực tiếp với fixer..."
              : authState.user?.role === "fixer"
              ? "Nhắn cập nhật cho khách hàng..."
              : "Nhắn vị trí hoặc tình trạng xe..."
          }"
        />
        <button class="primary-button" type="submit" ${canSendMessage ? "" : "disabled"}>${icon("send")} Gửi</button>
      </form>
    </div>
  `;
}

function normalizeSavedVehicles(vehicles) {
  const normalized = Array.isArray(vehicles) ? vehicles : [];
  const motorbikeDefaultId =
    normalized.find((vehicle) => vehicle.category === "motorbike" && vehicle.isDefault)?.id ??
    normalized.find((vehicle) => vehicle.category === "motorbike")?.id;
  const carDefaultId =
    normalized.find((vehicle) => vehicle.category === "car" && vehicle.isDefault)?.id ??
    normalized.find((vehicle) => vehicle.category === "car")?.id;

  return normalized.map((vehicle) => ({
    ...vehicle,
    isDefault:
      vehicle.category === "motorbike"
        ? vehicle.id === motorbikeDefaultId
        : vehicle.id === carDefaultId,
  }));
}

function syncVehiclesState(vehicles) {
  const normalizedVehicles = normalizeSavedVehicles(vehicles);
  const previouslySelectedVehicleId = state.requestVehicle;

  state.savedVehicles = normalizedVehicles;
  state.requestVehicle = normalizedVehicles.some(
    (vehicle) => vehicle.id === previouslySelectedVehicleId,
  )
    ? previouslySelectedVehicleId
    : getDefaultVehicleForService(getCurrentService());
}

function getVehiclesForService(service) {
  return normalizeSavedVehicles(state.savedVehicles).filter((vehicle) =>
    service.types.includes(vehicle.category),
  );
}

function getVehicleById(vehicleId) {
  const availableVehicles = normalizeSavedVehicles(state.savedVehicles);

  if (vehicleId) {
    const exactMatch = availableVehicles.find((vehicle) => vehicle.id === vehicleId);
    if (exactMatch) {
      return exactMatch;
    }
  }

  if (availableVehicles.length > 0) {
    return availableVehicles[0];
  }

  return authState.user ? null : normalizeSavedVehicles(defaultSavedVehicles)[0];
}

function getSelectedVehicle() {
  return getVehicleById(state.requestVehicle);
}

function getDefaultVehicleForService(service) {
  const serviceVehicles = getVehiclesForService(service);
  const matchingVehicle = serviceVehicles.find((vehicle) => vehicle.isDefault);
  return matchingVehicle?.id ?? serviceVehicles[0]?.id ?? null;
}

function buildLiveRequest({ serviceId, vehicleId, garageId, status }) {
  const service = getService(serviceId);
  const vehicle = getVehicleById(vehicleId);
  const garage = garages.find((item) => item.id === garageId) ?? garages[0];

  if (!vehicle) {
    return null;
  }

  return {
    id: `RSQ-${Math.floor(100000 + Math.random() * 900000)}`,
    serviceId: service.id,
    serviceTitle: service.title,
    servicePrice: service.price,
    serviceEta: service.eta,
    vehicleId: vehicle.id,
    vehicleName: vehicle.label,
    vehiclePlate: vehicle.plate,
    vehicleType: vehicle.kind,
    locationAddress: USER_LOCATION.label,
    locationPoint: {
      lat: USER_LOCATION.lat,
      lng: USER_LOCATION.lng,
    },
    locationSource: "manual",
    notes: "",
    requesterId: authState.user?.role === "user" ? authState.user.id : null,
    requesterName: authState.user?.name ?? "Khách ResQ",
    requesterPhone: authState.user?.phone ?? "0901 234 567",
    fixerId: null,
    fixerName: garage.name,
    fixerTeam: "Đội ResQ chờ xác nhận",
    fixerVehicle: "Fixer sẽ xác nhận sau",
    garageId: garage.id,
    status,
    createdAt: new Date().toISOString(),
  };
}

function getFallbackRequestLocations(request) {
  if (!request) {
    return {
      user: null,
      fixer: null,
    };
  }

  const userPoint = request.locationPoint ?? {
    lat: USER_LOCATION.lat,
    lng: USER_LOCATION.lng,
  };

  return {
    user: {
      requestId: request.id,
      actorId: request.requesterId ?? null,
      actorRole: "user",
      point: userPoint,
      heading: null,
      accuracy: null,
      source: request.locationSource ?? "manual",
      address: request.locationAddress ?? USER_LOCATION.label,
      updatedAt: request.createdAt ?? new Date(0).toISOString(),
    },
    fixer: {
      requestId: request.id,
      actorId: request.fixerId ?? null,
      actorRole: "fixer",
      point: {
        lat: userPoint.lat + 0.0205,
        lng: userPoint.lng - 0.026,
      },
      heading: null,
      accuracy: null,
      source: "fallback",
      address: null,
      updatedAt: request.createdAt ?? new Date(0).toISOString(),
    },
  };
}

function clearRequestScopedSync() {
  if (typeof liveSync.requestsUnsubscribe === "function") {
    liveSync.requestsUnsubscribe();
  }
  if (typeof liveSync.vehiclesUnsubscribe === "function") {
    liveSync.vehiclesUnsubscribe();
  }
  if (typeof liveSync.profileUnsubscribe === "function") {
    liveSync.profileUnsubscribe();
  }
  if (typeof liveSync.messagesUnsubscribe === "function") {
    liveSync.messagesUnsubscribe();
  }
  if (typeof liveSync.locationsUnsubscribe === "function") {
    liveSync.locationsUnsubscribe();
  }
  if (typeof liveSync.statusEventsUnsubscribe === "function") {
    liveSync.statusEventsUnsubscribe();
  }
  liveSync.requestsUnsubscribe = null;
  liveSync.vehiclesUnsubscribe = null;
  liveSync.profileUnsubscribe = null;
  liveSync.messagesUnsubscribe = null;
  liveSync.locationsUnsubscribe = null;
  liveSync.statusEventsUnsubscribe = null;
  liveSync.activeRequestId = null;

  if (liveSync.geolocationWatchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(liveSync.geolocationWatchId);
    liveSync.geolocationWatchId = null;
  }

  liveSync.lastPublishedLocation = null;
}

async function refreshVehiclesFromRemote(userId) {
  if (!userId) {
    syncVehiclesState([]);
    return;
  }

  const vehicles = await listVehiclesForUser(userId);

  if (vehicles === null) {
    return;
  }

  syncVehiclesState(vehicles);
}

async function refreshCurrentUserFromRemote() {
  const nextUser = await getCurrentAppUser();
  authState.user = nextUser;

  if (nextUser?.role === "fixer" && state.screen === "garage") {
    state.screen = "services";
  }
}

function startAccountScopedSync(user) {
  if (!user?.id) {
    return;
  }

  liveSync.requestsUnsubscribe = subscribeToVisibleRequests(user.id, () => {
    void applyRemoteRequestState();
  });

  liveSync.vehiclesUnsubscribe = subscribeToVehicleChanges(user.id, () => {
    void refreshVehiclesFromRemote(user.id).then(() => {
      render();
    });
  });

  liveSync.profileUnsubscribe = subscribeToProfileChanges(user.id, () => {
    void refreshCurrentUserFromRemote().then(() => {
      void applyRemoteRequestState();
      render();
    });
  });
}

function getPrimaryRequestSnapshot(requestState) {
  return requestState.activeRequest ?? requestState.pendingRequests?.[0] ?? null;
}

async function loadRequestMessagesIntoState(requestId) {
  if (!requestId) {
    state.requestChats = {};
    return;
  }

  const messages = await listRequestMessages(requestId);
  state.requestChats = {
    ...state.requestChats,
    [requestId]:
      messages.length > 0
        ? messages
        : createInitialRequestChat({ id: requestId }),
  };
}

async function loadRequestStatusEventsIntoState(requestId) {
  if (!requestId) {
    state.requestStatusEvents = {};
    return;
  }

  const events = await listRequestStatusEvents(requestId);
  state.requestStatusEvents = {
    ...state.requestStatusEvents,
    [requestId]: events,
  };
}

async function loadRequestLocationsIntoState(request) {
  if (!request?.id) {
    state.requestLocations = {
      user: null,
      fixer: null,
    };
    return;
  }

  const remoteLocations = await listRequestLocations(request.id);
  const fallbackLocations = getFallbackRequestLocations(request);
  state.requestLocations = {
    user: remoteLocations.user ?? fallbackLocations.user,
    fixer: remoteLocations.fixer ?? fallbackLocations.fixer,
  };
}

function startOwnLocationWatch(request) {
  if (!request?.id || !authState.user || !("geolocation" in navigator)) {
    return;
  }

  if (
    authState.user.role === "fixer" &&
    request.fixerId !== authState.user.id
  ) {
    return;
  }

  if (liveSync.geolocationWatchId !== null) {
    navigator.geolocation.clearWatch(liveSync.geolocationWatchId);
    liveSync.geolocationWatchId = null;
  }

  liveSync.geolocationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const nextPoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const now = Date.now();
      const lastPublished = liveSync.lastPublishedLocation;

      if (lastPublished) {
        const latDelta = Math.abs(lastPublished.point.lat - nextPoint.lat);
        const lngDelta = Math.abs(lastPublished.point.lng - nextPoint.lng);

        if (latDelta < 0.00008 && lngDelta < 0.00008 && now - lastPublished.at < 8000) {
          return;
        }
      }

      liveSync.lastPublishedLocation = {
        point: nextPoint,
        at: now,
      };

      void upsertRequestLocation({
        requestId: request.id,
        actorId: authState.user.id,
        actorRole: authState.user.role,
        point: nextPoint,
        heading:
          typeof position.coords.heading === "number" && !Number.isNaN(position.coords.heading)
            ? position.coords.heading
            : null,
        accuracy: position.coords.accuracy,
        source: "browser",
        address:
          authState.user.role === "user"
            ? request.locationAddress ?? USER_LOCATION.label
            : null,
      }).catch(() => {});
    },
    () => {
      if (authState.user?.role === "user") {
        void upsertRequestLocation({
          requestId: request.id,
          actorId: authState.user.id,
          actorRole: "user",
          point: request.locationPoint ?? {
            lat: USER_LOCATION.lat,
            lng: USER_LOCATION.lng,
          },
          source: request.locationSource ?? "manual",
          address: request.locationAddress ?? USER_LOCATION.label,
        }).catch(() => {});
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 8000,
      timeout: 12000,
    },
  );
}

async function syncRequestScopedLiveData(request) {
  const nextRequestId = request?.id ?? null;

  if (liveSync.activeRequestId === nextRequestId) {
    return;
  }

  if (typeof liveSync.messagesUnsubscribe === "function") {
    liveSync.messagesUnsubscribe();
  }
  if (typeof liveSync.locationsUnsubscribe === "function") {
    liveSync.locationsUnsubscribe();
  }
  if (typeof liveSync.statusEventsUnsubscribe === "function") {
    liveSync.statusEventsUnsubscribe();
  }
  liveSync.messagesUnsubscribe = null;
  liveSync.locationsUnsubscribe = null;
  liveSync.statusEventsUnsubscribe = null;
  liveSync.activeRequestId = nextRequestId;

  if (!request?.id) {
    state.requestLocations = {
      user: null,
      fixer: null,
    };
    state.requestStatusEvents = {};
    return;
  }

  await Promise.all([
    loadRequestMessagesIntoState(request.id),
    loadRequestLocationsIntoState(request),
    loadRequestStatusEventsIntoState(request.id),
  ]);

  liveSync.messagesUnsubscribe = subscribeToRequestMessages(request.id, () => {
    void loadRequestMessagesIntoState(request.id).then(() => {
      render();
    });
  });

  liveSync.locationsUnsubscribe = subscribeToRequestLocations(request.id, () => {
    void loadRequestLocationsIntoState(request).then(() => {
      render();
    });
  });

  liveSync.statusEventsUnsubscribe = subscribeToRequestStatusEvents(request.id, () => {
    void loadRequestStatusEventsIntoState(request.id).then(() => {
      render();
    });
  });

  startOwnLocationWatch(request);
}

async function applyRemoteRequestState() {
  if (!authState.user) {
    state.liveRequest = null;
    state.incomingRequests = [];
    state.requestHistory = [];
    state.orderMode = "idle";
    state.orderListTab = "active";
    state.orderStage = 3;
    state.requestLocations = {
      user: null,
      fixer: null,
    };
    state.requestStatusEvents = {};
    clearRequestScopedSync();
    render();
    return;
  }

  const requestState = await loadLiveRequestState(authState.user);
  const primaryRequest = getPrimaryRequestSnapshot(requestState);

  state.liveRequest = primaryRequest;
  state.incomingRequests = requestState.pendingRequests ?? [];
  state.requestHistory = requestState.requestHistory ?? [];
  state.orderMode = primaryRequest
    ? getOrderModeForStatus(primaryRequest.status)
    : "idle";
  state.orderListTab = primaryRequest ? "active" : "completed";
  state.orderStage = primaryRequest
    ? getOrderStageForStatus(primaryRequest.status)
    : 3;

  if (primaryRequest?.serviceId) {
    state.activeServiceId = primaryRequest.serviceId;
  }

  await syncRequestScopedLiveData(primaryRequest);
  render();
}

async function syncVehiclesToRemote() {
  if (!authState.user) {
    return false;
  }

  const didSync = await saveVehiclesForUser(
    authState.user.id,
    normalizeSavedVehicles(state.savedVehicles),
  );

  if (didSync) {
    await refreshVehiclesFromRemote(authState.user.id);
  }

  return didSync;
}

function handleVehicleSave(form) {
  const formData = new FormData(form);
  const category = String(formData.get("category") ?? "motorbike");
  const label = String(formData.get("label") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const year = String(formData.get("year") ?? "").trim();

  if (!label || plate.length < 5 || year.length !== 4) {
    return;
  }

  const nextVehicle = {
    id: `vehicle-${Math.random().toString(36).slice(2, 10)}`,
    category,
    label,
    plate,
    year,
    kind: category === "car" ? "Ô tô" : "Xe máy",
    isDefault: !state.savedVehicles.some((vehicle) => vehicle.category === category),
  };

  state.savedVehicles = normalizeSavedVehicles([...state.savedVehicles, nextVehicle]);
  state.requestVehicle = nextVehicle.id;
  state.vehicleSheet = null;
  render();
  void syncVehiclesToRemote().then(() => {
    render();
  });
}

async function handleChatSubmit(form) {
  const requestId = state.liveRequest?.id;
  if (!requestId || !authState.user) {
    return;
  }

  const formData = new FormData(form);
  const message = String(formData.get("message") ?? "").trim();
  if (!message) {
    return;
  }

  const optimisticMessage = createChatMessage({
    requestId,
    senderRole: authState.user.role,
    senderName: authState.user.name ?? "Người dùng ResQ",
    body: message,
  });

  state.requestChats = {
    ...state.requestChats,
    [requestId]: appendChatMessageList(state.requestChats[requestId], optimisticMessage),
  };
  render();

  try {
    await sendRequestMessage({
      requestId,
      senderId: authState.user.id,
      senderRole: authState.user.role,
      senderName: authState.user.name ?? "Người dùng ResQ",
      body: message,
    });
    await loadRequestMessagesIntoState(requestId);
    render();
  } catch (_error) {
    // Keep the optimistic message visible even if the network sync is delayed.
  }
}

async function handleCreateRequest(garageId) {
  const nextRequest = buildLiveRequest({
    serviceId: state.selectedServiceId ?? state.activeServiceId,
    vehicleId: state.requestVehicle,
    garageId: garageId ?? state.selectedGarageId ?? "garage-1",
    status: "Chờ fixer xác nhận",
  });

  if (!nextRequest) {
    state.selectedServiceId = state.selectedServiceId ?? state.activeServiceId;
    state.profileSheet = null;
    state.vehicleSheet = getCurrentService().types.includes("car") ? "car" : "motorbike";
    render();
    return;
  }

  setState({
    screen: "order",
    orderMode: "pending-confirmation",
    orderListTab: "active",
    orderStage: 0,
    activeServiceId: nextRequest.serviceId,
    selectedGarageId: nextRequest.garageId,
    garageDetailSheet: null,
    garageSheetState: "peek",
    liveRequest: nextRequest,
    selectedServiceId: null,
    requestChats: {
      ...state.requestChats,
      [nextRequest.id]: createInitialRequestChat(nextRequest),
    },
    requestStatusEvents: {
      ...state.requestStatusEvents,
      [nextRequest.id]: [
        {
          id: `status-${nextRequest.id}`,
          requestId: nextRequest.id,
          actorId: authState.user?.id ?? null,
          actorRole: authState.user?.role ?? "user",
          eventType: "created",
          status: "Chờ fixer xác nhận",
          detail: "Yêu cầu đã được ghi nhận và đang chờ fixer xác nhận.",
          createdAt: nextRequest.createdAt,
        },
      ],
    },
    requestLocations: getFallbackRequestLocations(nextRequest),
  });

  try {
    await createServiceRequest(nextRequest);
    await upsertRequestLocation({
      requestId: nextRequest.id,
      actorId: authState.user?.id ?? null,
      actorRole: "user",
      point: nextRequest.locationPoint,
      source: nextRequest.locationSource,
      address: nextRequest.locationAddress,
    });
    await applyRemoteRequestState();
  } catch (_error) {
    // Keep the current screen usable and let the realtime refresh recover when the network returns.
  }
}

async function handleConfirmRequest() {
  if (!state.liveRequest || !authState.user) {
    return;
  }

  const confirmedRequest = {
    ...state.liveRequest,
    fixerId: authState.user.id,
    fixerName: authState.user.name ?? "Fixer ResQ",
    fixerTeam: `Fixer ${authState.user.name?.split(" ").at(-1) ?? "ResQ"}`,
    fixerVehicle:
      state.liveRequest.vehicleType === "Xe máy"
        ? "Xe máy toolkit ResQ"
        : "Van cứu hộ ResQ",
    status: "Fixer đã xác nhận",
  };

  setState({
    screen: "order",
    orderMode: "active",
    orderListTab: "active",
    orderStage: getOrderStageForStatus("Fixer đã xác nhận"),
    liveRequest: confirmedRequest,
  });

  try {
    await acceptServiceRequest(confirmedRequest.id);
    await applyRemoteRequestState();
  } catch (_error) {
    // Keep the local state responsive and let the live sync catch up.
  }
}

function applyPreset(preset) {
  const nextPreset = getPresetState(preset);

  if (!nextPreset) {
    return;
  }

  setState(nextPreset);
}

function getPresetState(preset) {
  const presets = {
    browse: {
      screen: "services",
      serviceFilter: "car",
      activeServiceId: "tire",
      selectedServiceId: null,
      selectedGarageId: null,
      garageSheetState: "peek",
      garageDetailSheet: null,
      orderMode: "idle",
      orderListTab: "active",
      liveRequest: null,
      profileSheet: null,
      authSheet: null,
      profileHighlight: "notifications",
    },
    garage: {
      screen: "garage",
      serviceFilter: "motorbike",
      activeServiceId: "tire",
      selectedGarageId: "garage-2",
      garageSheetState: "peek",
      garageDetailSheet: null,
      selectedServiceId: null,
      orderMode: "idle",
      orderListTab: "active",
      liveRequest: null,
      profileSheet: null,
      authSheet: null,
    },
    active: {
      screen: "order",
      activeServiceId: "tire",
      selectedGarageId: "garage-1",
      garageSheetState: "peek",
      garageDetailSheet: null,
      orderMode: "active",
      orderListTab: "active",
      orderStage: 3,
      requestVehicle: "vehicle-motorbike-default",
      liveRequest: buildLiveRequest({
        serviceId: "tire",
        vehicleId: "vehicle-motorbike-default",
        garageId: "garage-1",
        status: "Đang tiếp cận",
      }),
      selectedServiceId: null,
      profileSheet: null,
      authSheet: null,
    },
    complete: {
      screen: "order",
      activeServiceId: "oil",
      selectedGarageId: "garage-3",
      garageSheetState: "peek",
      garageDetailSheet: null,
      orderMode: "completed",
      orderListTab: "completed",
      orderStage: 6,
      requestVehicle: "vehicle-car-default",
      liveRequest: buildLiveRequest({
        serviceId: "oil",
        vehicleId: "vehicle-car-default",
        garageId: "garage-3",
        status: "Hoàn thành",
      }),
      selectedServiceId: null,
      profileSheet: null,
      authSheet: null,
    },
  };

  return presets[preset] ? structuredClone(presets[preset]) : null;
}

function isPresetActive(preset) {
  if (preset === "browse") {
    return state.screen === "services" && state.orderMode === "idle";
  }

  if (preset === "garage") {
    return state.screen === "garage" && Boolean(state.selectedGarageId);
  }

  if (preset === "active") {
    return state.screen === "order" && state.orderMode === "active";
  }

  if (preset === "complete") {
    return state.screen === "order" && state.orderMode === "completed";
  }

  return false;
}

function applyOrderMode(mode) {
  if (mode === "pending-confirmation") {
    setState({ screen: "order", orderMode: "pending-confirmation", orderListTab: "active", orderStage: 0 });
    return;
  }

  if (mode === "active") {
    setState({ screen: "order", orderMode: "active", orderListTab: "active", orderStage: Math.min(state.orderStage, 5) });
    return;
  }

  if (mode === "completed") {
    setState({ screen: "order", orderMode: "completed", orderListTab: "completed", orderStage: 6 });
    return;
  }

  if (mode === "cancelled") {
    setState({ screen: "order", orderMode: "cancelled", orderListTab: "active" });
    return;
  }

  setState({ screen: "order", orderMode: "idle", orderListTab: "active", orderStage: 3, liveRequest: null });
}

async function advanceOrder() {
  if (!state.liveRequest) {
    return;
  }

  const nextStatus =
    state.liveRequest.status === "Fixer đã xác nhận"
      ? "Đang tiếp cận"
      : state.liveRequest.status === "Đang tiếp cận"
        ? "Đang hỗ trợ"
        : state.liveRequest.status === "Đang hỗ trợ"
          ? "Hoàn thành"
          : state.liveRequest.status;

  const nextRequest = {
    ...state.liveRequest,
    status: nextStatus,
  };

  setState({
    liveRequest: nextRequest,
    orderMode: getOrderModeForStatus(nextStatus),
    orderListTab: nextStatus === "Hoàn thành" ? "completed" : "active",
    orderStage: getOrderStageForStatus(nextStatus),
  });

  try {
    await advanceServiceRequestStatus(nextRequest.id);
    await loadRequestMessagesIntoState(nextRequest.id);
    render();
  } catch (_error) {
    // Keep the UI responsive while the realtime state catches up.
  }
}

async function completeOrder() {
  if (!state.liveRequest) {
    return;
  }

  const completedRequest = {
    ...state.liveRequest,
    status: "Hoàn thành",
  };

  setState({
    liveRequest: completedRequest,
    orderMode: "completed",
    orderListTab: "completed",
    orderStage: 6,
  });

  try {
    await completeServiceRequest(completedRequest.id);
    await loadRequestMessagesIntoState(completedRequest.id);
    render();
  } catch (_error) {
    // Let the live refresh reconcile any delayed writes.
  }
}

async function cancelOrder() {
  if (!state.liveRequest) {
    return;
  }

  const cancelledRequest = {
    ...state.liveRequest,
    status: "Đã hủy",
  };

  setState({
    liveRequest: cancelledRequest,
    orderMode: "cancelled",
    orderListTab: "active",
    orderStage: getOrderStageForStatus("Chờ fixer xác nhận"),
  });

  try {
    await cancelServiceRequest(cancelledRequest.id);
    await loadRequestMessagesIntoState(cancelledRequest.id);
    render();
  } catch (_error) {
    // Let the next remote refresh reconcile the final state.
  }
}

async function initializeAuth() {
  try {
    authState.user = normalizeUserForAppMode(await getCurrentAppUser());
    if (authState.user) {
      currentStorageScopeKey = getStateScopeKey(authState.user);
      applyPersistedUiState(currentStorageScopeKey);
      await refreshVehiclesFromRemote(authState.user.id);
      state.authSheet = null;
      if (authState.user.role === "fixer" && state.screen === "garage") {
        state.screen = "services";
      }
      await applyRemoteRequestState();
      startAccountScopedSync(authState.user);
    } else {
      clearRequestScopedSync();
      currentStorageScopeKey = getStateScopeKey(null);
      applyPersistedUiState(currentStorageScopeKey);
      state.screen = IS_FIXER_APP ? "profile" : "sos";
      state.authSheet = IS_FIXER_APP ? "login" : null;
      state.authRole = IS_FIXER_APP ? "fixer" : "user";
    }
  } catch (_error) {
    authState.user = null;
    clearRequestScopedSync();
    currentStorageScopeKey = getStateScopeKey(null);
    applyPersistedUiState(currentStorageScopeKey);
    state.screen = IS_FIXER_APP ? "profile" : "sos";
    state.authSheet = IS_FIXER_APP ? "login" : null;
    state.authRole = IS_FIXER_APP ? "fixer" : "user";
  } finally {
    authState.ready = true;
    render();
  }

  subscribeToAuthChanges(({ session, user }) => {
    authState.session = session;
    authState.user = normalizeUserForAppMode(user);
    authState.ready = true;
    clearRequestScopedSync();
    currentStorageScopeKey = getStateScopeKey(authState.user);
    applyPersistedUiState(currentStorageScopeKey);

    if (!authState.user) {
      state.profileSheet = null;
      state.screen = IS_FIXER_APP ? "profile" : "sos";
      state.authSheet = IS_FIXER_APP ? "login" : null;
      state.authRole = IS_FIXER_APP ? "fixer" : "user";
      state.savedVehicles = structuredClone(defaultSavedVehicles);
      state.requestVehicle = state.savedVehicles[0].id;
      state.liveRequest = null;
      state.incomingRequests = [];
      state.requestHistory = [];
      state.orderMode = "idle";
      state.requestChats = {};
      state.requestStatusEvents = {};
      state.requestLocations = {
        user: null,
        fixer: null,
      };
      render();
      return;
    }

    state.authSheet = null;
    if (authState.user.role === "fixer" && state.screen === "garage") {
      state.screen = "services";
    }

    const nextScopedUser = authState.user;
    void refreshVehiclesFromRemote(nextScopedUser.id).then(() => {
      startAccountScopedSync(nextScopedUser);
      void applyRemoteRequestState();
      render();
    });
  });
}

function clearAuthUi() {
  authUi.pending = false;
  authUi.error = "";
  authUi.message = "";
}

function resetAuthFields() {
  authUi.fields = {
    loginEmail: "",
    loginPassword: "",
    regName: "",
    regPhone: "",
    regEmail: "",
    regPassword: "",
    regConfirm: "",
  };
}

async function handleAuthLogin(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  authUi.fields.loginEmail = email;
  authUi.fields.loginPassword = password;

  if (!email) {
    authUi.error = "Vui lòng nhập email.";
    authUi.message = "";
    render();
    return;
  }

  if (!password) {
    authUi.error = "Vui lòng nhập mật khẩu.";
    authUi.message = "";
    render();
    return;
  }

  authUi.pending = true;
  authUi.error = "";
  authUi.message = "";
  render();

  const result = await signInWithResQ({
    email,
    password,
    role: state.authRole,
  });

  authUi.pending = false;

  if (result.error) {
    authUi.error = result.error;
    render();
    return;
  }

  resetAuthFields();
  clearAuthUi();
  setState({
    authSheet: null,
    screen: "services",
    profileSheet: null,
    profileHighlight: "personal",
  });
}

async function handleAuthRegister(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  authUi.fields.regName = name;
  authUi.fields.regPhone = phone;
  authUi.fields.regEmail = email;
  authUi.fields.regPassword = password;
  authUi.fields.regConfirm = confirmPassword;

  if (!name) {
    authUi.error = "Vui lòng nhập họ và tên.";
    authUi.message = "";
    render();
    return;
  }

  if (!phone) {
    authUi.error = "Vui lòng nhập số điện thoại.";
    authUi.message = "";
    render();
    return;
  }

  if (!email) {
    authUi.error = "Vui lòng nhập email.";
    authUi.message = "";
    render();
    return;
  }

  if (password.length < 6) {
    authUi.error = "Mật khẩu phải có ít nhất 6 ký tự.";
    authUi.message = "";
    render();
    return;
  }

  if (password !== confirmPassword) {
    authUi.error = "Mật khẩu xác nhận không khớp.";
    authUi.message = "";
    render();
    return;
  }

  authUi.pending = true;
  authUi.error = "";
  authUi.message = "";
  render();

  const result = await signUpWithResQ({
    name,
    phone,
    email,
    password,
    role: state.authRole,
  });

  authUi.pending = false;

  if (result.error) {
    authUi.error = result.error;
    render();
    return;
  }

  if (result.needsEmailConfirmation) {
    authUi.fields.loginEmail = email;
    authUi.fields.loginPassword = "";
    authUi.message =
      state.authRole === "fixer"
        ? "Tài khoản fixer đã được tạo. Hãy xác nhận email rồi đăng nhập."
        : "Tài khoản đã được tạo. Hãy xác nhận email rồi đăng nhập.";
    authUi.error = "";
    setState({ authSheet: "login" });
    return;
  }

  resetAuthFields();
  clearAuthUi();
  setState({
    authSheet: null,
    screen: "services",
    profileSheet: null,
    profileHighlight: "personal",
  });
}

async function handleSignOut() {
  authUi.pending = true;
  render();

  try {
    await signOutResQ();
  } finally {
    clearRequestScopedSync();
    resetAuthFields();
    clearAuthUi();
    setState({
      authSheet: IS_FIXER_APP ? "login" : null,
      profileSheet: null,
      garageDetailSheet: null,
      garageSheetState: "peek",
      screen: IS_FIXER_APP ? "profile" : "services",
      activeServiceId: "tire",
      selectedServiceId: null,
      orderMode: "idle",
      liveRequest: null,
      incomingRequests: [],
      requestHistory: [],
      requestChats: {},
      requestStatusEvents: {},
      requestLocations: {
        user: null,
        fixer: null,
      },
      selectedGarageId: null,
      profileHighlight: "notifications",
      authRole: IS_FIXER_APP ? "fixer" : "user",
    });
  }
}

function destroyMaps() {
  Object.values(mapControllers).forEach((controller) => {
    controller?.map?.remove();
  });

  mapControllers.garage = null;
  mapControllers.order = null;
}

function initializeMaps() {
  if (state.screen === "garage") {
    mountGarageMap();
  }

  if (state.screen === "order") {
    mountOrderMap();
  }
}

function mountGarageMap() {
  const mapElement = document.querySelector("[data-map='garage']");
  if (!mapElement) {
    return;
  }

  const map = createBaseMap(mapElement);
  const points = [[USER_LOCATION.lat, USER_LOCATION.lng]];
  const visibleGarages = getVisibleGaragesForCurrentFilter();
  const selectedGarage =
    visibleGarages.find((garage) => garage.id === state.selectedGarageId)
    ?? visibleGarages[0]
    ?? null;
  const resolvedSelectedGarageId = selectedGarage?.id ?? null;

  L.circle([USER_LOCATION.lat, USER_LOCATION.lng], {
    radius: 520,
    color: "#ee3224",
    weight: 1,
    fillColor: "#ee3224",
    fillOpacity: 0.08,
  }).addTo(map);

  L.marker([USER_LOCATION.lat, USER_LOCATION.lng], {
    icon: createMarkerIcon("user"),
  }).addTo(map);

  visibleGarages.forEach((garage) => {
    points.push([garage.lat, garage.lng]);

    const marker = L.marker([garage.lat, garage.lng], {
      icon: createMarkerIcon("garage", garage.id === resolvedSelectedGarageId),
    }).addTo(map);

    marker.on("click", () => {
      setState({
        screen: "garage",
        selectedGarageId: garage.id,
        garageSheetState: "peek",
        garageDetailSheet: null,
      });
    });
  });

  if (selectedGarage) {
    const route = buildRoutePoints(selectedGarage, USER_LOCATION);

    L.polyline(route, {
      color: "rgba(238,50,36,0.24)",
      weight: 14,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    L.polyline(route, {
      color: "#ee3224",
      weight: 4,
      lineCap: "round",
      lineJoin: "round",
      dashArray: "14 10",
    }).addTo(map);

    map.fitBounds(route, {
      padding: [48, 48],
      maxZoom: 14,
    });
  } else {
    map.fitBounds(points, {
      padding: [48, 48],
      maxZoom: 13,
    });
  }

  mapControllers.garage = { map };
}

function mountOrderMap() {
  const mapElement = document.querySelector("[data-map='order']");
  if (!mapElement) {
    return;
  }

  const map = createBaseMap(mapElement);
  const { userPoint, fixerPoint } = getResolvedOrderMapPoints();
  const route = buildRoutePoints(
    { lat: fixerPoint.lat, lng: fixerPoint.lng },
    { lat: userPoint.lat, lng: userPoint.lng },
  );

  L.polyline(route, {
    color: "#f7d6d2",
    weight: 14,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  L.polyline(route, {
    color: "#ee3224",
    weight: 4,
    lineCap: "round",
    lineJoin: "round",
    opacity: state.orderMode === "cancelled" ? 0.22 : 0.96,
  }).addTo(map);

  L.marker([userPoint.lat, userPoint.lng], {
    icon: createMarkerIcon("user"),
  }).addTo(map);

  L.marker([fixerPoint.lat, fixerPoint.lng], {
    icon: createMarkerIcon("fixer"),
  }).addTo(map);

  map.fitBounds(route, {
    padding: [48, 48],
    maxZoom: 14,
  });

  mapControllers.order = { map };
}

function getResolvedOrderMapPoints() {
  const fallbackLocations = getFallbackRequestLocations(state.liveRequest);
  const userPoint =
    state.requestLocations?.user?.point ??
    fallbackLocations.user?.point ?? {
      lat: USER_LOCATION.lat,
      lng: USER_LOCATION.lng,
    };
  const fixerPoint =
    state.requestLocations?.fixer?.point ??
    fallbackLocations.fixer?.point ?? {
      lat: userPoint.lat + 0.0205,
      lng: userPoint.lng - 0.026,
    };

  return { userPoint, fixerPoint };
}

function createBaseMap(mapElement) {
  const map = L.map(mapElement, {
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true,
    scrollWheelZoom: true,
  }).setView([USER_LOCATION.lat, USER_LOCATION.lng], 13);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
  }).addTo(map);

  window.requestAnimationFrame(() => {
    map.invalidateSize();
    window.setTimeout(() => map.invalidateSize(), 180);
  });

  return map;
}

function createMarkerIcon(kind, isSelected = false) {
  if (kind === "garage") {
    return L.divIcon({
      className: "",
      iconSize: [58, 62],
      iconAnchor: [29, 56],
      html: `
        <div class="leaflet-garage-pin ${isSelected ? "is-selected" : ""}">
          ${icon("garage")}
        </div>
      `,
    });
  }

  if (kind === "fixer") {
    return L.divIcon({
      className: "",
      iconSize: [58, 58],
      iconAnchor: [29, 29],
      html: `
        <div class="leaflet-fixer-pin">
          ${icon("van")}
        </div>
      `,
    });
  }

  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div class="leaflet-user-pin">
        <span class="leaflet-user-pin__pulse"></span>
        <span class="leaflet-user-pin__core"></span>
      </div>
    `,
  });
}

function buildRoutePoints(originGarage, destination, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps;
    const curve = Math.sin(progress * Math.PI) * 0.0024;

    return [
      interpolate(originGarage.lat, destination.lat, progress) + curve,
      interpolate(originGarage.lng, destination.lng, progress) - curve * 0.85,
    ];
  });
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character] ?? character;
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function renderOrderRoute(showMarker) {
  return `
    <svg viewBox="0 0 430 932" aria-hidden="true">
      ${
        showMarker
          ? `
            <path
              d="M216 278 L216 415 L258 512 L318 612 L430 612"
              fill="none"
              stroke="rgba(238,50,36,0.14)"
              stroke-width="20"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M216 278 L216 415 L258 512 L318 612 L430 612"
              fill="none"
              stroke="#ee3224"
              stroke-width="5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          `
          : ""
      }
    </svg>
  `;
}

function icon(name) {
  const icons = {
    wrench: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a4 4 0 0 0 3.98 5.3l-7.4 7.4a2 2 0 1 1-2.82-2.82l7.4-7.4a4 4 0 0 0 5.3-3.98l-3.15 1.05-2.38-2.38z"/>
      </svg>
    `,
    pin: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11z"/><circle cx="12" cy="10" r="2.6"/>
      </svg>
    `,
    shield: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l7 3v5c0 5-3.3 8.9-7 10-3.7-1.1-7-5-7-10V6l7-3z"/>
      </svg>
    `,
    user: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="3.2"/><path d="M6.5 19c1.5-3 3.5-4.5 5.5-4.5s4 1.5 5.5 4.5"/>
      </svg>
    `,
    "user-outline": `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="3.4"/><path d="M5 19c1.9-3.2 4.2-4.8 7-4.8 2.8 0 5.1 1.6 7 4.8"/>
      </svg>
    `,
    garage: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 12l8-6 8 6"/><path d="M6 11h12v8H6z"/><path d="M9 15h.01M15 15h.01"/>
      </svg>
    `,
    tire: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.3"/>
      </svg>
    `,
    brake: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="7.5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>
      </svg>
    `,
    oil: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 6h10"/><path d="M9 6v5h6V6"/><path d="M6 11h12l-1.6 7H7.6L6 11z"/>
      </svg>
    `,
    bolt: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9z"/>
      </svg>
    `,
    bike: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h4l4 7"/><path d="M10 10l2-3 2 3"/>
      </svg>
    `,
    car: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 16l1.5-5h11L19 16"/><path d="M4 16h16v3H4z"/><circle cx="7.5" cy="17.5" r="1.3"/><circle cx="16.5" cy="17.5" r="1.3"/>
      </svg>
    `,
    "car-outline": `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 15l1.3-4.4c.3-1 1.1-1.6 2.1-1.6h7.2c1 0 1.8.6 2.1 1.6L19 15"/><path d="M4 15h16v4H4z"/><circle cx="7.5" cy="17.2" r="1.3"/><circle cx="16.5" cy="17.2" r="1.3"/>
      </svg>
    `,
    bell: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15.5 17h-7l1.1-1.7c.3-.4.4-.9.4-1.4V11a2.5 2.5 0 1 1 5 0v2.9c0 .5.1 1 .4 1.4z"/><path d="M10.3 19a1.8 1.8 0 0 0 3.4 0"/>
      </svg>
    `,
    "shield-outline": `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 4l5 2.2v4.2c0 4-2.5 7.1-5 8.4-2.5-1.3-5-4.4-5-8.4V6.2L12 4z"/>
      </svg>
    `,
    logout: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 6H6v12h4"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>
      </svg>
    `,
    close: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>
    `,
    "chevron-right": `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 6l6 6-6 6"/>
      </svg>
    `,
    phone: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 4h3l1 4-2 2a13 13 0 0 0 5 5l2-2 4 1v3c0 .6-.4 1-1 1-8.3 0-15-6.7-15-15 0-.6.4-1 1-1z"/>
      </svg>
    `,
    send: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 11.5L20 4l-5.5 16-2.7-5.3L3 11.5z"/><path d="M11.8 14.7l8.2-10.7"/>
      </svg>
    `,
    clock: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.8 2.2"/>
      </svg>
    `,
    star: `
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2.7l2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.3 6.7 19.01l1.01-5.9-4.29-4.18 5.93-.86L12 2.7z"/>
      </svg>
    `,
    check: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12.5l4.2 4.2L19 7"/>
      </svg>
    `,
    van: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 14l2-5h9l3 3h4v5H3z"/><circle cx="8" cy="17" r="1.6"/><circle cx="18" cy="17" r="1.6"/>
      </svg>
    `,
    "siren-car": `
      <svg viewBox="0 0 32 32" fill="currentColor" stroke="none">
        <!-- siren beams -->
        <path d="M9.4 3.6l-1.4-1.4L6.6 3.6 8 5l1.4-1.4zM23.5 3.6L22.1 2.2 20.7 3.6 22.1 5l1.4-1.4zM16 1.5L16 4M11.4 5l-1 1.4M21.6 6.4l-1-1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <!-- car body -->
        <path d="M9 9.5h14a2 2 0 0 1 1.94 1.5l1.46 5.5H5.6l1.46-5.5A2 2 0 0 1 9 9.5z"/>
        <rect x="4" y="16" width="24" height="6" rx="1.5"/>
        <circle cx="9.5" cy="22.6" r="2.4" fill="currentColor"/>
        <circle cx="22.5" cy="22.6" r="2.4" fill="currentColor"/>
        <!-- top siren housing -->
        <rect x="13" y="6.5" width="6" height="3.2" rx="0.8"/>
      </svg>
    `,
    "edit-pencil": `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/>
      </svg>
    `,
  };

  return icons[name] ?? "";
}
