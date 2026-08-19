'use strict';
// 工場アプリからはログイン画面を出さず、そのまま材料・在庫へ入れる。
// 既存の材料管理ロジック側が getSession/getUser を見るため、工場用の簡易セッションとして扱う。
if (window.supabaseClient?.auth) {
  window.supabaseClient.auth.getSession = async () => ({
    data: { session: { user: { email: 'factory@local' } } },
    error: null
  });
  window.supabaseClient.auth.getUser = async () => ({
    data: { user: { email: 'factory@local' } },
    error: null
  });
}
// Load the last verified inventory implementation, then layer the confirmation UI on top.
document.write('<script src="https://cdn.jsdelivr.net/gh/yuubae96-rgb/order-search-app@28d162512db535b5cfe06d671f15880b42d05e01/materials.js"><\/script>');
document.write('<script src="materials-confirm.js?v=20260819-0145"><\/script>');
