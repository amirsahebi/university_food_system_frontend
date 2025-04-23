export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ROUTES = {
  // Auth
  SIGNUP: '/auth/signup/',
  SIGNIN: '/auth/signin/',
  SIGNOUT: '/auth/signout/',
  REFRESH_TOKEN: '/auth/refresh/',
  ME: '/auth/me/',
  SEND_VERIFICATION_CODE: '/auth/send-verification-code/',
  VERIFY_CODE: '/auth/verify-code/',
  REQUEST_PASSWORD_RESET: '/auth/request-password-reset/',
  RESET_PASSWORD: '/auth/reset-password/',
  UPDATE_PROFILE: '/auth/profile/update/',
  CHANGE_PASSWORD: '/auth/change-password/',
  CHECK_PHONE_EXISTS: '/auth/check-phone-number/',
  CHECK_STUDENT_NUMBER_EXISTS: '/auth/check-student-number/',
  
  // Payment routes
  PAYMENT_REQUEST: "/payments/request/",
  PAYMENT_VERIFY: "/payments/verify/",
  PAYMENT_START: "/payments/start",
  PAYMENT_HISTORY: "/payments/history/",

  // Foods
  GET_FOODS: '/foods/',
  ADD_FOOD: '/foods/',
  UPDATE_FOOD: (id: string) => `/foods/${id}/`,
  DELETE_FOOD: (id: string) => `/foods/${id}/`,
  GET_FOOD_CATEGORIES: '/foods/categories/',
  ADD_FOOD_CATEGORY: '/foods/categories/',
  UPDATE_FOOD_CATEGORY: (id: string) => `/foods/categories/${id}/`,
  DELETE_FOOD_CATEGORY: (id: string) => `/foods/categories/${id}/`,

  // Menu
  GET_TEMPLATE_MENU: '/menu/template/',
  ADD_TEMPLATE_MENU_ITEM: '/menu/template/',
  UPDATE_TEMPLATE_MENU_ITEM: (id: string) => `/menu/template/${id}/`,
  DELETE_TEMPLATE_MENU_ITEM: (id: string) => `/menu/template/${id}/`,
  GET_DAILY_MENU: '/menu/daily/',
  ADD_DAILY_MENU_ITEM: '/menu/daily/',
  UPDATE_DAILY_MENU_ITEM: (id: string) => `/menu/daily/${id}/`,
  DELETE_DAILY_MENU_ITEM: (id: string) => `/menu/daily/${id}/`,
  TOGGLE_DAILY_MENU_ITEM_AVAILABILITY: (id: string) => `/menu/daily/${id}/availability/`,
  USE_TEMPLATE_FOR_DAILY: '/menu/use-template/',

  // Voucher
  GET_VOUCHER_PRICE: '/core/voucher/price/',
  UPDATE_VOUCHER_PRICE: '/core/voucher/price/',

  // Reports
  GET_RESERVATION_LOGS: '/reports/orders/logs/',
  GET_DAILY_ORDER_COUNTS: '/reports/orders/daily-counts/',

  // Orders
  GET_RECEIVER_ORDERS: '/orders/receiver/',
  UPDATE_ORDER_STATUS: (id: string) => `/orders/${id}/status/`,
  PLACE_ORDER: '/orders/place/',
  GET_PENDING_ORDERS: '/orders/pending/',
  DELIVER_ORDER: (id: string) => `/orders/${id}/deliver/`,
  GET_STUDENT_ORDERS: '/orders/student/',
  GET_READY_TO_PICKUP_ORDERS: '/orders/ready-to-pickup/',
  GET_PICKED_UP_ORDERS: '/orders/picked-up/',
  VERIFY_DELIVERY_CODE: '/orders/delivery-code/',
  CANCEL_RESERVATION: (id: string) => `/orders/${id}/cancel/`,

};

export const createApiUrl = (route: string): string => `${API_BASE_URL}${route}`;
