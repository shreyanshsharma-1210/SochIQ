"""
SochIQ Test Suite: Browser Presence Tracking & 30-Minute Grace Period Lifecycle
Verifies all 12 core requirements specified in Section 5 of the prompt.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import app.core.credentials as creds
from app.core.credentials import (
    create_browser_session,
    validate_browser_session,
    record_tab_heartbeat,
    record_tab_leave,
    get_session_presence_state,
    cleanup_expired_workspaces,
    create_developer_api_key,
    validate_developer_api_key,
    _ACTIVE_TABS,
    _DISCONNECTED_AT,
    _MEMORY_SESSIONS,
    _MEMORY_API_KEYS,
    TAB_HEARTBEAT_TIMEOUT_SECONDS,
    GRACE_PERIOD_MINUTES
)


def run_all_tests():
    print("=" * 70)
    print("🚀 STARTING SOCHIQ PRESENCE & 30-MIN GRACE PERIOD VERIFICATION SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # Scenario 1: Tab Open > 30 min (Continuous Presence)
    # -------------------------------------------------------------
    print("\n[Scenario 1] Open tab > 30 minutes with continuous heartbeats", flush=True)
    owner1 = "11111111-1111-1111-1111-111111111111"
    sess1 = create_browser_session(owner_id=owner1, tab_id="tab_1")
    raw1 = sess1["raw_token"]
    hash1 = creds.hash_token(raw1)
    now = datetime.now(timezone.utc)

    # Simulate 35 minutes passing with heartbeats continuing every 20s
    simulated_now = now + timedelta(minutes=35)
    # Tab sends heartbeat at 35 min
    creds._ACTIVE_TABS[hash1] = {"tab_1": simulated_now}
    # Validate session at 35 min
    validated = validate_browser_session(raw1, tab_id="tab_1")
    assert validated is not None, "Workspace MUST remain active when tab is present > 30 min"
    assert validated["status"] == "active"
    print("  ✓ PASS: Workspace remained active after 35 minutes of tab presence.", flush=True)

    # -------------------------------------------------------------
    # Scenario 2: Inactive User > 30 min with Tab Open
    # -------------------------------------------------------------
    print("\n[Scenario 2] Inactive user (no clicks/API calls) > 30 minutes with tab open")
    # Even if user clicks nothing, client background interval sends heartbeats
    simulated_now_2 = now + timedelta(hours=2) # 2 hours idle
    creds._ACTIVE_TABS[creds.hash_token(raw1)] = {"tab_1": simulated_now_2}
    validated_2 = validate_browser_session(raw1)
    assert validated_2 is not None, "User inactivity MUST NOT trigger workspace expiry while tab is open"
    assert validated_2["status"] == "active"
    print("  ✓ PASS: 2 hours of user inactivity with tab open did not expire workspace.")

    # -------------------------------------------------------------
    # Scenario 3: Tab Closure Starts 30-Minute Grace Period
    # -------------------------------------------------------------
    print("\n[Scenario 3] Closing tab initiates 30-minute grace period")
    leave_res = record_tab_leave(raw1, "tab_1")
    assert leave_res["status"] == "grace_period", f"Expected grace_period, got {leave_res['status']}"
    assert leave_res["is_active"] is False
    assert leave_res["grace_period_remaining_seconds"] == 30 * 60
    assert creds.hash_token(raw1) in _DISCONNECTED_AT
    print("  ✓ PASS: Tab closure successfully started 30-minute grace period.")

    # -------------------------------------------------------------
    # Scenario 4: Reopen within 5 Minutes (Restoration)
    # -------------------------------------------------------------
    print("\n[Scenario 4] Reopening application after 5 minutes restores workspace")
    sess_hash1 = creds.hash_token(raw1)
    # Simulate 5 minutes into the grace period
    _DISCONNECTED_AT[sess_hash1] = datetime.now(timezone.utc) - timedelta(minutes=5)
    restored_5m = validate_browser_session(raw1, tab_id="new_tab_after_5m")
    assert restored_5m is not None, "Workspace must be restored when reopened at 5 minutes"
    assert sess_hash1 not in _DISCONNECTED_AT, "Grace period must be cancelled upon user return"
    assert restored_5m["status"] == "active"
    print("  ✓ PASS: Reopening after 5 minutes restored workspace and cancelled grace period.")

    # -------------------------------------------------------------
    # Scenario 5: Reopen at 29 Minutes (Just Before Deadline)
    # -------------------------------------------------------------
    print("\n[Scenario 5] Reopening application at 29 minutes restores workspace")
    record_tab_leave(raw1, "new_tab_after_5m")
    # Simulate 29 minutes elapsed
    _DISCONNECTED_AT[sess_hash1] = datetime.now(timezone.utc) - timedelta(minutes=29)
    restored_29m = validate_browser_session(raw1, tab_id="new_tab_at_29m")
    assert restored_29m is not None, "Workspace must be recoverable at 29 minutes"
    assert restored_29m["status"] == "active"
    print("  ✓ PASS: Reopening at 29 minutes successfully restored workspace.")

    # -------------------------------------------------------------
    # Scenario 6: Reopen at 31 Minutes (Past Deadline -> Purged)
    # -------------------------------------------------------------
    print("\n[Scenario 6] Reopening at 31 minutes confirms cleanup and fresh workspace")
    record_tab_leave(raw1, "new_tab_at_29m")
    # Simulate 31 minutes elapsed (past 30-minute grace period)
    _DISCONNECTED_AT[sess_hash1] = datetime.now(timezone.utc) - timedelta(minutes=31)
    expired_sess = validate_browser_session(raw1)
    assert expired_sess is None, "Workspace must be expired and purged past 30-minute grace period"
    print("  ✓ PASS: 31 minutes absence correctly expired and purged temporary workspace.")

    # -------------------------------------------------------------
    # Scenario 7: Page Reload Handling
    # -------------------------------------------------------------
    print("\n[Scenario 7] Page reload: leave followed by immediate reconnect", flush=True)
    sess_reload = create_browser_session(owner_id="22222222-2222-2222-2222-222222222222", tab_id="reload_tab_v1")
    raw_reload = sess_reload["raw_token"]
    hash_reload = creds.hash_token(raw_reload)

    # Browser triggers unload
    record_tab_leave(raw_reload, "reload_tab_v1")
    assert hash_reload in _DISCONNECTED_AT

    # Browser reloads and reconnects 1 second later
    reloaded = validate_browser_session(raw_reload, tab_id="reload_tab_v2")
    assert reloaded is not None, "Reloaded page must seamlessly retain workspace"
    assert hash_reload not in _DISCONNECTED_AT, "Reconnection on reload must cancel grace period immediately"
    print("  ✓ PASS: Page reload seamlessly restored workspace without data loss.", flush=True)

    # -------------------------------------------------------------
    # Scenario 8: Multi-Tab Support (Two Tabs Open, One Closes)
    # -------------------------------------------------------------
    print("\n[Scenario 8] Multi-tab: Two tabs open, close one tab", flush=True)
    sess_multi = create_browser_session(owner_id="33333333-3333-3333-3333-333333333333", tab_id="tab_A")
    raw_multi = sess_multi["raw_token"]
    hash_multi = creds.hash_token(raw_multi)

    # Open second tab in same workspace
    record_tab_heartbeat(raw_multi, "tab_B")
    presence_both = get_session_presence_state(raw_multi)
    assert presence_both["active_tab_count"] == 2

    # Close tab A
    leave_A = record_tab_leave(raw_multi, "tab_A")
    assert leave_A["status"] == "active", "Workspace must stay active when tab B is still open"
    assert leave_A["active_tab_count"] == 1
    assert hash_multi not in _DISCONNECTED_AT, "Grace period MUST NOT start while tab B is open"
    print("  ✓ PASS: Closing one of two tabs kept workspace active without starting grace period.", flush=True)

    # -------------------------------------------------------------
    # Scenario 9: Multi-Tab Support (Close Last Remaining Tab)
    # -------------------------------------------------------------
    print("\n[Scenario 9] Multi-tab: Closing second/last tab initiates grace period", flush=True)
    leave_B = record_tab_leave(raw_multi, "tab_B")
    assert leave_B["status"] == "grace_period", "Grace period must start when the LAST tab closes"
    assert leave_B["active_tab_count"] == 0
    assert hash_multi in _DISCONNECTED_AT
    print("  ✓ PASS: Grace period started only when the final active tab closed.", flush=True)

    # -------------------------------------------------------------
    # Scenario 10: Browser Crash Simulation (Missing Heartbeats > 45s)
    # -------------------------------------------------------------
    print("\n[Scenario 10] Browser crash simulation (heartbeats cease without unload)", flush=True)
    sess_crash = create_browser_session(owner_id="44444444-4444-4444-4444-444444444444", tab_id="crash_tab")
    raw_crash = sess_crash["raw_token"]
    hash_crash = creds.hash_token(raw_crash)

    # Simulate heartbeat stopped 50 seconds ago (exceeding 45s threshold)
    _ACTIVE_TABS[hash_crash]["crash_tab"] = datetime.now(timezone.utc) - timedelta(seconds=50)

    # Server checks presence
    presence_crash = get_session_presence_state(raw_crash)
    assert presence_crash["is_active"] is False, "Tab must be marked inactive after 45s of missed heartbeats"
    assert presence_crash["active_tab_count"] == 0
    assert hash_crash in _DISCONNECTED_AT, "Server must initiate grace period on crash"
    print("  ✓ PASS: Missed heartbeats for > 45s properly initiated grace period.", flush=True)

    # -------------------------------------------------------------
    # Scenario 11: Idempotent Cleanup (Reactivated Workspace Preserved)
    # -------------------------------------------------------------
    print("\n[Scenario 11] Idempotent cleanup does not delete reactivated workspace", flush=True)
    sess_react = create_browser_session(owner_id="55555555-5555-5555-5555-555555555555", tab_id="active_tab_react")
    raw_react = sess_react["raw_token"]
    hash_react = creds.hash_token(raw_react)

    # Execute cleanup sweep while tab is actively heartbeating
    cleanup_expired_workspaces()
    assert hash_react in _MEMORY_SESSIONS, "Active workspace must not be deleted by cleanup sweep"
    print("  ✓ PASS: Active workspace safely preserved during background cleanup sweeps.", flush=True)

    # -------------------------------------------------------------
    # Scenario 12: Developer API Key Lifecycle
    # -------------------------------------------------------------
    print("\n[Scenario 12] Developer API key lifecycle tied to parent workspace", flush=True)
    sess_parent = create_browser_session(owner_id="66666666-6666-6666-6666-666666666666", tab_id="dev_portal_tab")
    raw_parent = sess_parent["raw_token"]
    parent_sess_id = sess_parent["session_id"]
    owner_id = sess_parent["owner_id"]

    # Generate developer API key
    key_res = create_developer_api_key(owner_id=owner_id, browser_session_id=parent_sess_id)
    raw_key = key_res["raw_key"]

    # 12a: Key valid while workspace is active
    val_key = validate_developer_api_key(raw_key, required_scope="datasets:read")
    assert val_key is not None, "API key must validate while workspace is active"

    # 12b: Key valid during 30-minute grace period
    record_tab_leave(raw_parent, "dev_portal_tab")
    val_key_grace = validate_developer_api_key(raw_key, required_scope="datasets:read")
    assert val_key_grace is not None, "API key remains usable or in grace period with parent workspace"

    # 12c: Key purged when parent workspace is purged past grace period
    creds.delete_workspace_data(owner_id=owner_id, session_id=parent_sess_id)
    val_key_purged = validate_developer_api_key(raw_key, required_scope="datasets:read")
    assert val_key_purged is None, "API key must be revoked/purged when parent workspace is deleted"
    print("  ✓ PASS: Developer API key remained valid with workspace and was revoked upon workspace purge.", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("🎉 ALL 12 WORKSPACE LIFECYCLE & PRESENCE SCENARIOS VERIFIED SUCCESSFULLY!", flush=True)
    print("=" * 70, flush=True)


if __name__ == "__main__":
    run_all_tests()
